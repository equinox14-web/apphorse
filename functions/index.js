const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer'); // N'oubliez pas: npm install nodemailer

// Prevent crash if config is missing during deploy
const stripeSecret = functions.config().stripe?.secret || "sk_live_PLACEHOLDER_NEED_CONFIG";
const stripe = require('stripe')(stripeSecret);

admin.initializeApp();

// Configuration de votre transporteur Email (SMTP)
// Remplacer par vos vrais identifiants (Gmail, Outlook, Brevo...)
// Pour GMAIL : Utilisez un "Mot de passe d'application" (App Password)
const transporter = nodemailer.createTransport({
    host: "smtp.office365.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: 'horse-equinox@outlook.com', // Votre adresse Outlook complète
        pass: '@LoanMae1978' // Votre mot de passe Outlook
    },
    tls: {
        ciphers: 'SSLv3'
    }
});

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
 * Échange le code d'autorisation temporaire de Stripe Connect contre un ID de compte connecté.
 * Appelé depuis le frontend via httpsCallable.
 */
exports.resolveStripeConnect = functions.https.onCall(async (data, context) => {
    // 1. Vérification Auth
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Utilisateur non connecté.');
    }

    const { code } = data;
    const userId = context.auth.uid; // Plus sûr que de le passer en paramètre

    if (!code) {
        throw new functions.https.HttpsError('invalid-argument', 'Code manquant.');
    }

    try {
        // Échange du code via l'API Stripe
        const response = await stripe.oauth.token({
            grant_type: 'authorization_code',
            code: code,
        });

        const connectedAccountId = response.stripe_user_id;

        // Enregistrement dans Firestore de l'ID Stripe de l'écurie
        await admin.firestore().collection('users').doc(userId).update({
            stripeConnectId: connectedAccountId,
            stripeConnectEnabled: true,
            stripeConnectDate: admin.firestore.FieldValue.serverTimestamp()
        });

        return { success: true, accountId: connectedAccountId };

    } catch (error) {
        console.error("Stripe Connect Error:", error);
        throw new functions.https.HttpsError('internal', error.message);
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

/**
 * Trigger: Nouveau compte Utilisateur créé
 * Action: Envoi automatique d'un email de bienvenue via Nodemailer (SMTP).
 */
exports.sendWelcomeEmail = functions.auth.user().onCreate(async (user) => {
    const email = user.email;
    const name = user.displayName || 'Cavalier';

    if (!email) {
        console.log("Pas d'email pour cet utilisateur, abandon.");
        return null;
    }

    // Contenu HTML du mail
    const htmlContent = `
    <div style="font-family: sans-serif; color: #333; line-height: 1.6;">
        <h2 style="color: #0284c7;">Bienvenue sur Equinox 🐴 : Votre écurie est prête !</h2>
        <p>Bonjour ${name},</p>
        <p>Félicitations et bienvenue sur Equinox ! Nous sommes ravis de vous compter parmi les écuries qui modernisent leur gestion.</p>
        
        <p>Votre compte est créé, mais pour profiter à 100 % de la plateforme (et surtout pour commencer à encaisser vos pensions), voici les 3 étapes prioritaires à réaliser maintenant :</p>
        
        <ol>
            <li>
                <strong>🏦 Activez vos paiements (Important)</strong><br>
                Pour recevoir l'argent des propriétaires directement sur votre compte bancaire, nous devons vérifier votre identité (Sécurité bancaire oblige).<br>
                👉 <em>Rendez-vous dans l'onglet "Mon Compte" > "Paiements" et téléchargez votre Kbis/Pièce d'identité.</em>
            </li>
            <li>
                <strong>🐴 Ajoutez vos premiers pensionnaires</strong><br>
                Créez les fiches de vos chevaux. Plus vous êtes précis, plus le suivi sera facile pour vous et vos propriétaires.
            </li>
            <li>
                <strong>💬 Invitez vos propriétaires</strong><br>
                Une fois les chevaux créés, liez-les à leurs propriétaires. Ils recevront une invitation pour télécharger l'app et suivre la vie de leur cheval (et régler vos factures !).
            </li>
        </ol>

        <p style="background-color: #f0f9ff; padding: 15px; border-radius: 8px; border-left: 4px solid #0284c7;">
            <strong>💡 Le saviez-vous ?</strong><br>
            En utilisant Equinox pour votre facturation, vous bénéficiez d'un mandat de facturation automatique. Fini la paperasse : nous générons les factures conformes en votre nom et les envoyons aux clients. Vous n'avez plus qu'à vérifier les encaissements !
        </p>

        <p>Besoin d'aide pour démarrer ? Répondez simplement à cet email, nous sommes là pour vous accompagner.</p>
        <p>À très vite aux écuries,</p>
        <p><strong>L'équipe Equinox</strong></p>
    </div>
    `;

    const mailOptions = {
        from: '"L\'équipe Equinox" <horse-equinox@outlook.com>', // EXPÉDITEUR
        to: email, // DESTINATAIRE
        subject: 'Bienvenue sur Equinox 🐴 : Votre écurie est prête !',
        html: htmlContent
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Email de bienvenue envoyé à:', email);
    } catch (error) {
        console.error('Erreur lors de l\'envoi de l\'email via Nodemailer:', error);
    }
});

/**
 * Change l'abonnement d'un utilisateur sans redirection (si déjà abonné).
 * Appelé depuis le frontend via httpsCallable.
 */
exports.updateUserSubscription = functions.https.onCall(async (data, context) => {
    // 1. Vérification Auth
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Utilisateur non connecté.');
    }

    const { newPriceId } = data;
    const email = context.auth.token.email;

    if (!newPriceId || !email) {
        throw new functions.https.HttpsError('invalid-argument', 'Paramètres manquants.');
    }

    try {
        // 2. Retrouver le client Stripe
        const customers = await stripe.customers.list({ email: email, limit: 1 });
        if (customers.data.length === 0) {
            throw new functions.https.HttpsError('not-found', 'Aucun client Stripe trouvé pour cet email.');
        }
        const customer = customers.data[0];

        // 3. Retrouver l'abonnement ACTIF
        const subscriptions = await stripe.subscriptions.list({
            customer: customer.id,
            status: 'active',
            limit: 1
        });

        if (subscriptions.data.length === 0) {
            throw new functions.https.HttpsError('failed-precondition', 'Pas d\'abonnement actif à modifier.');
        }

        const currentSub = subscriptions.data[0];
        const currentItemId = currentSub.items.data[0].id;

        // 4. Mettre à jour l'abonnement
        await stripe.subscriptions.update(currentSub.id, {
            items: [{
                id: currentItemId,
                price: newPriceId, // Le nouveau Price ID
            }],
            proration_behavior: 'create_prorations', // Gère le prorata automatiquement
        });

        return { success: true, message: "Abonnement mis à jour avec succès." };

    } catch (error) {
        console.error("Erreur update subscription:", error);
        // Renvoyer l'erreur au client
        throw new functions.https.HttpsError('internal', error.message);
    }
});
