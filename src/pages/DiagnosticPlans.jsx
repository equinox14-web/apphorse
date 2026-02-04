import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import Card from '../components/common/Card';

const DiagnosticPlans = () => {
    const [userPlans, setUserPlans] = useState(null);
    const [stripeSubscriptions, setStripeSubscriptions] = useState([]);
    const [firestoreProducts, setFirestoreProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadDiagnosticData = async () => {
            if (!auth.currentUser) {
                alert("Vous devez être connecté pour accéder à cette page");
                return;
            }

            try {
                // 1. Load user document
                const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
                if (userDoc.exists()) {
                    setUserPlans(userDoc.data());
                }

                // 2. Load Stripe subscriptions
                const subsRef = collection(db, 'customers', auth.currentUser.uid, 'subscriptions');
                const subsQuery = query(subsRef, where('status', 'in', ['active', 'trialing']));
                const subsSnapshot = await getDocs(subsQuery);
                const subs = subsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setStripeSubscriptions(subs);

                // 3. Load all products from Firestore
                const productsRef = collection(db, 'products');
                const productsQuery = query(productsRef, where('active', '==', true));
                const productsSnapshot = await getDocs(productsQuery);
                const products = await Promise.all(productsSnapshot.docs.map(async (doc) => {
                    const productData = { id: doc.id, ...doc.data() };
                    const pricesQuery = collection(db, 'products', doc.id, 'prices');
                    const pricesSnapshot = await getDocs(pricesQuery);
                    const prices = pricesSnapshot.docs.map(p => ({ id: p.id, ...p.data() }));
                    return { ...productData, prices };
                }));
                setFirestoreProducts(products);

            } catch (error) {
                console.error("Erreur chargement diagnostic:", error);
            } finally {
                setLoading(false);
            }
        };

        loadDiagnosticData();
    }, []);

    if (loading) {
        return <div className="p-8 text-center">Chargement des données de diagnostic...</div>;
    }

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">🔍 Diagnostic des Plans</h1>

            {/* User Info */}
            <Card className="mb-6 p-6">
                <h2 className="text-2xl font-semibold mb-4">👤 Informations Utilisateur</h2>
                <div className="space-y-2">
                    <p><strong>Email:</strong> {auth.currentUser?.email}</p>
                    <p><strong>UID:</strong> {auth.currentUser?.uid}</p>
                    <p><strong>Plan (Firestore):</strong> <code className="bg-gray-100 px-2 py-1 rounded">{JSON.stringify(userPlans?.plans || 'N/A')}</code></p>
                    <p><strong>Role (Firestore):</strong> <code className="bg-gray-100 px-2 py-1 rounded">{userPlans?.role || 'N/A'}</code></p>
                    <p><strong>isAdminBypass:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{String(userPlans?.isAdminBypass)}</code></p>
                </div>
            </Card>

            {/* LocalStorage */}
            <Card className="mb-6 p-6">
                <h2 className="text-2xl font-semibold mb-4">💾 LocalStorage</h2>
                <div className="space-y-2">
                    <p><strong>subscriptionPlan:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{localStorage.getItem('subscriptionPlan') || 'N/A'}</code></p>
                    <p><strong>user_role:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{localStorage.getItem('user_role') || 'N/A'}</code></p>
                    <p><strong>user_simulated:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{localStorage.getItem('user_simulated') || 'false'}</code></p>
                    <p><strong>force_elite_access:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{localStorage.getItem('force_elite_access') || 'false'}</code></p>
                </div>
            </Card>

            {/* Stripe Subscriptions */}
            <Card className="mb-6 p-6">
                <h2 className="text-2xl font-semibold mb-4">💳 Abonnements Stripe</h2>
                {stripeSubscriptions.length === 0 ? (
                    <p className="text-gray-500">Aucun abonnement actif trouvé</p>
                ) : (
                    <div className="space-y-4">
                        {stripeSubscriptions.map((sub, index) => (
                            <div key={index} className="border rounded p-4 bg-blue-50">
                                <p><strong>ID:</strong> {sub.id}</p>
                                <p><strong>Status:</strong> {sub.status}</p>
                                <p><strong>Role:</strong> <code className="bg-white px-2 py-1 rounded">{sub.role || '❌ ABSENT'}</code></p>
                                <p><strong>Product:</strong> {sub.product || 'N/A'}</p>
                                <p><strong>Price:</strong> {sub.price || 'N/A'}</p>
                                <details className="mt-2">
                                    <summary className="cursor-pointer text-sm text-blue-600">Voir toutes les données</summary>
                                    <pre className="bg-white p-2 rounded mt-2 text-xs overflow-auto max-h-64">
                                        {JSON.stringify(sub, null, 2)}
                                    </pre>
                                </details>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* Firestore Products */}
            <Card className="mb-6 p-6">
                <h2 className="text-2xl font-semibold mb-4">🏷️ Produits Firestore</h2>
                <div className="space-y-4">
                    {firestoreProducts.map((product, index) => (
                        <div key={index} className="border rounded p-4 bg-green-50">
                            <p><strong>ID:</strong> {product.id}</p>
                            <p><strong>Nom:</strong> {product.name}</p>
                            <p><strong>Active:</strong> {String(product.active)}</p>
                            <p><strong>Metadata:</strong></p>
                            <pre className="bg-white p-2 rounded text-xs">
                                {JSON.stringify(product.metadata || {}, null, 2)}
                            </pre>
                            <p className="mt-2"><strong>Prices:</strong></p>
                            {product.prices.map((price, i) => (
                                <div key={i} className="ml-4 mt-1 text-sm">
                                    <code className="bg-white px-2 py-1 rounded mr-2">{price.id}</code>
                                    <span>{price.interval || price.recurring?.interval}: {(price.unit_amount / 100).toFixed(2)} {price.currency?.toUpperCase()}</span>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </Card>

            {/* Diagnostic Summary */}
            <Card className="mb-6 p-6 bg-yellow-50">
                <h2 className="text-2xl font-semibold mb-4">⚠️ Vérifications</h2>
                <ul className="space-y-2">
                    <li className={userPlans?.plans ? 'text-green-600' : 'text-red-600'}>
                        {userPlans?.plans ? '✅' : '❌'} Plans définis dans Firestore users/{'{uid}'}
                    </li>
                    <li className={stripeSubscriptions.length > 0 ? 'text-green-600' : 'text-yellow-600'}>
                        {stripeSubscriptions.length > 0 ? '✅' : '⚠️'} Abonnement Stripe actif
                    </li>
                    <li className={stripeSubscriptions.some(s => s.role) ? 'text-green-600' : 'text-red-600'}>
                        {stripeSubscriptions.some(s => s.role) ? '✅' : '❌'} Champ 'role' présent dans l'abonnement Stripe
                    </li>
                    <li className={localStorage.getItem('subscriptionPlan') ? 'text-green-600' : 'text-red-600'}>
                        {localStorage.getItem('subscriptionPlan') ? '✅' : '❌'} subscriptionPlan dans localStorage
                    </li>
                </ul>

                {stripeSubscriptions.length > 0 && !stripeSubscriptions.some(s => s.role) && (
                    <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded">
                        <p className="font-bold text-red-700">🚨 PROBLÈME DÉTECTÉ</p>
                        <p className="text-red-700 mt-2">
                            L'abonnement Stripe existe mais le champ <code>role</code> est absent !
                            <br />
                            <strong>Solution:</strong> Vérifiez que le produit dans Stripe Dashboard a une métadonnée <code>role</code> définie.
                        </p>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default DiagnosticPlans;
