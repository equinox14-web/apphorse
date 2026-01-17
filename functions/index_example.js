const functions = require('firebase-functions');
const admin = require('firebase-admin');
const stripe = require('stripe')(functions.config().stripe.secret);

admin.initializeApp();

/**
 * Crée une session Checkout pour un paiement MARKETPLACE (Cavalier -> Écurie)
 * avec prélèvement d'une commission (Application Fee) pour la plateforme (Equinox).
 */
exports.createMarketplaceSession = functions.https.onRequest(async (req, res) => {
    // Enable CORS
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.end();
        return;
    }

    try {
        const { amount, currency, connectedAccountId, applicationFeeAmount, successUrl, cancelUrl, invoiceId } = req.body;

        if (!amount || !connectedAccountId) {
            res.status(400).send({ error: "Missing amount or connectedAccountId" });
            return;
        }

        // Création de la session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: currency || 'eur',
                    product_data: {
                        name: `Facture #${invoiceId || 'Ref inconnu'}`,
                    },
                    unit_amount: amount,
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: successUrl,
            cancel_url: cancelUrl,
            payment_intent_data: {
                application_fee_amount: applicationFeeAmount, // LA COMMISSION DE 1%
                transfer_data: {
                    destination: connectedAccountId, // L'ARGENT VA À L'ÉCURIE
                },
            },
        });

        res.status(200).send({ url: session.url, id: session.id });

    } catch (error) {
        console.error("Stripe Error:", error);
        res.status(500).send({ error: error.message });
    }
});

/**
 * Crée une session pour un ABONNEMENT (SaaS)
 * Remplace l'extension Firebase si elle est défaillante.
 */
exports.createSubscriptionSession = functions.https.onRequest(async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.end();
        return;
    }

    try {
        const { priceId, email, userId, successUrl, cancelUrl } = req.body;

        if (!priceId || !email) {
            res.status(400).send({ error: "Missing priceId or email" });
            return;
        }

        // 1. Chercher ou créer le client Stripe
        const customers = await stripe.customers.list({ email: email, limit: 1 });
        let customerId;

        if (customers.data.length > 0) {
            customerId = customers.data[0].id;
        } else {
            const newCustomer = await stripe.customers.create({
                email: email,
                metadata: { firebaseUID: userId }
            });
            customerId = newCustomer.id;
        }

        // 2. Créer la session
        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            customer: customerId,
            line_items: [{
                price: priceId,
                quantity: 1,
            }],
            allow_promotion_codes: true,
            success_url: successUrl,
            cancel_url: cancelUrl,
            metadata: {
                firebaseUID: userId
            }
        });

        res.status(200).send({ url: session.url });

    } catch (error) {
        console.error("Subscription Error:", error);
        res.status(500).send({ error: error.message });
    }
});

/**
 * Trigger Firestore: Envoi de Notification Push lors d'un nouveau message
 */
exports.sendChatNotification = functions.firestore
    .document('channels/{channelId}/messages/{messageId}')
    .onCreate(async (snap, context) => {
        const message = snap.data();
        const channelId = context.params.channelId;
        const senderId = message.senderId;

        // 1. Récupérer le Channel pour voir les membres
        const channelRef = admin.firestore().collection('channels').doc(channelId);
        const channelSnap = await channelRef.get();
        const channelData = channelSnap.data();

        if (!channelData) return;

        // 2. Trouver le destinataire (celui qui n'est PAS l'envoyeur)
        const recipientId = channelData.members.find(uid => uid !== senderId);
        if (!recipientId) return;

        // 3. Récupérer le Token FCM du destinataire
        const userRef = admin.firestore().collection('users').doc(recipientId);
        const userSnap = await userRef.get();
        const userData = userSnap.data();

        if (!userData || !userData.fcmToken) {
            console.log("Pas de token FCM pour l'utilisateur", recipientId);
            return;
        }

        // 4. Préparer la notification
        const payload = {
            token: userData.fcmToken,
            notification: {
                title: 'Nouveau message Equinox',
                body: message.type === 'image' ? '📷 Photo reçue' : message.text,
            },
            data: {
                channelId: channelId,
                click_action: '/messages' // URL à ouvrir
            },
            // Options pour Android/Web
            webpush: {
                fcmOptions: {
                    link: '/messages'
                }
            }
        };

        // 5. Envoyer
        try {
            await admin.messaging().send(payload);
            console.log("Notification envoyée à", recipientId);
        } catch (error) {
            console.error("Erreur envoi notif:", error);
            // Si le token est invalide, on pourrait le supprimer ici
        }
    });
