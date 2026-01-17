export const createMarketplaceCheckoutSession = async (invoice, stableStripeAccountId) => {
    try {
        const response = await fetch('https://us-central1-equinox-320c1.cloudfunctions.net/createMarketplaceSession', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                amount: Math.round(invoice.amount * 100), // En centimes
                currency: 'eur',
                connectedAccountId: stableStripeAccountId,
                applicationFeeAmount: Math.round(invoice.amount * 100 * 0.01), // 1% commission
                successUrl: window.location.origin + '/billing?payment=success',
                cancelUrl: window.location.origin + '/billing?payment=cancel',
                invoiceId: invoice.id || invoice.number
            }),
        });

        const session = await response.json();

        if (session.error) {
            throw new Error(session.error);
        }

        // Redirection vers Stripe
        window.location.href = session.url;
    } catch (error) {
        console.error("Erreur création session paiement:", error);
        alert("Erreur lors de l'initialisation du paiement: " + error.message);
    }
};

export const createSubscriptionSession = async (priceId, email, userId) => {
    try {
        // Change URL to your real deployed function URL
        const response = await fetch('https://us-central1-equinox-320c1.cloudfunctions.net/createSubscriptionSession', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                priceId: priceId,
                email: email,
                userId: userId,
                successUrl: window.location.origin + '/dashboard?session_id={CHECKOUT_SESSION_ID}&payment=success',
                cancelUrl: window.location.origin + '/settings?payment=cancel'
            }),
        });

        const session = await response.json();

        if (session.error) {
            throw new Error(session.error);
        }

        if (session.url) {
            window.location.href = session.url;
        } else {
            throw new Error("Pas d'URL renvoyée par le serveur.");
        }

    } catch (error) {
        console.error("Erreur souscription:", error);
        alert("Erreur lors de la souscription: " + error.message);
    }
};
