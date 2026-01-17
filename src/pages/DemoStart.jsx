import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { signInAnonymously } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import Card from '../components/Card';
import Button from '../components/Button';
import { Crown, Clock, CheckCircle } from 'lucide-react';
import SEO from '../components/SEO';

const DemoStart = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const demoType = searchParams.get('type') || 'pro'; // 'pro' or 'amateur'
    const [loading, setLoading] = useState(false);

    // Dynamic Content based on Type
    const isAmino = demoType === 'amateur';
    const title = isAmino ? "Equinox Passion +" : "Equinox Pro Élite";
    const planToSet = isAmino ? ['passion', 'eleveur_amateur_paid'] : ['elite'];
    const featuresList = isAmino ? [
        "Gestion Budget & Contrats",
        "Modèle Compétition",
        "Suivi Élevage (5 juments)",
        "Partage Demi-pension"
    ] : [
        "Chevaux Illimités",
        "Module Élevage Illimité",
        "Facturation & Compta",
        "App Mobile"
    ];

    const startDemo = async () => {
        setLoading(true);
        try {
            // 1. Authenticate anonymously
            const userCredential = await signInAnonymously(auth);
            const user = userCredential.user;

            // 2. Set Expiration (7 days from now)
            const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

            // 3. Create Demo Profile in Firestore
            await setDoc(doc(db, "users", user.uid), {
                name: "Utilisateur Démo",
                email: "demo@equinox.app",
                role: isAmino ? 'owner' : 'owner', // Both are technically owners structure-wise, but Pro has Pro features
                plans: planToSet,
                isDemo: true,
                demoExpiresAt: expiresAt,
                createdAt: new Date().toISOString()
            });

            // 4. Set Local Storage Flags
            localStorage.setItem('userType', isAmino ? 'amateur' : 'pro');
            localStorage.setItem('subscriptionPlan', JSON.stringify(planToSet));
            localStorage.setItem('user_name', 'Utilisateur Démo');
            localStorage.setItem('app_demo_mode', 'true');
            localStorage.setItem('app_demo_expires', expiresAt.toString());

            // 5. Redirect to Dashboard
            navigate('/');
            window.location.reload();

        } catch (error) {
            console.error("Error starting demo:", error);
            alert("Impossible de lancer la démo pour le moment.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)',
            padding: '1rem',
            color: 'white'
        }}>
            <SEO title={`Démo Gratuite - ${title}`} />

            <Card className="animate-fade-in" style={{ maxWidth: '500px', width: '100%', padding: '3rem', textAlign: 'center', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{
                    width: '80px', height: '80px',
                    background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
                    borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 2rem auto',
                    boxShadow: '0 0 30px rgba(251, 191, 36, 0.3)'
                }}>
                    <Crown size={40} color="white" />
                </div>

                <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem', background: 'linear-gradient(to right, #fbbf24, #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    {title}
                </h1>

                <h2 style={{ fontSize: '1.2rem', fontWeight: 500, opacity: 0.9, marginBottom: '2rem' }}>
                    Démo Gratuite (7 Jours)
                </h2>

                <p style={{ lineHeight: '1.6', marginBottom: '2rem', color: '#9ca3af', fontSize: '1.05rem' }}>
                    Accédez immédiatement à <strong>toutes les fonctionnalités</strong> de la version {isAmino ? 'Passion' : 'Pro'}.
                    Aucune carte bancaire requise.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2.5rem', textAlign: 'left' }}>
                    {featuresList.map((feat, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#e5e7eb' }}>
                            <CheckCircle size={18} color="#fbbf24" /> {feat}
                        </div>
                    ))}
                </div>

                <Button
                    onClick={startDemo}
                    disabled={loading}
                    style={{
                        width: '100%',
                        padding: '1rem',
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
                        border: 'none',
                        color: 'white',
                        boxShadow: '0 4px 15px rgba(217, 119, 6, 0.4)'
                    }}
                >
                    {loading ? 'Lancement...' : 'Démarrer l\'essai maintenant'}
                </Button>

                <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#6b7280', fontSize: '0.9rem' }}>
                    <Clock size={16} /> Fin automatique après 7 jours
                </div>
            </Card>
        </div>
    );
};

export default DemoStart;
