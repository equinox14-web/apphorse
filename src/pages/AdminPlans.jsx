import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { Shield, Crown, Briefcase, Heart, Star } from 'lucide-react';

const AdminPlans = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const userEmail = auth.currentUser?.email;

    // WHITELIST - Only for admin
    const ADMIN_EMAIL = 'aurelie.jossic@gmail.com';

    if (userEmail !== ADMIN_EMAIL) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <h2>🚫 Accès Refusé</h2>
                <p>Cette page est réservée à l'administrateur.</p>
                <Button onClick={() => navigate('/dashboard')}>Retour au Dashboard</Button>
            </div>
        );
    }

    const plans = [
        { id: 'decouverte', name: 'Découverte', icon: Star, color: '#9ca3af' },
        { id: 'passion', name: 'Passion', icon: Heart, color: '#ec4899' },
        { id: 'eleveur_amateur_paid', name: 'Passion Élevage', icon: Heart, color: '#be185d' },
        { id: 'eleveur', name: 'Spécial Éleveur', icon: Crown, color: '#d97706' },
        { id: 'start', name: 'Start', icon: Briefcase, color: '#3b82f6' },
        { id: 'pro', name: 'Pro', icon: Briefcase, color: '#2563eb' },
        { id: 'elite', name: 'Elite', icon: Shield, color: '#7c3aed' },
    ];

    const changePlan = async (planId) => {
        setLoading(true);
        try {
            // Update Firestore users collection
            await updateDoc(doc(db, 'users', auth.currentUser.uid), {
                plans: [planId],
                isAdminBypass: true
            });

            // Update localStorage
            localStorage.setItem('subscriptionPlan', JSON.stringify([planId]));

            alert(`✅ Plan changé pour ${plans.find(p => p.id === planId)?.name}`);
            window.location.reload();
        } catch (error) {
            console.error('Erreur changement plan:', error);
            alert('❌ Erreur : ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const currentPlan = JSON.parse(localStorage.getItem('subscriptionPlan') || '["decouverte"]')[0];

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <h1 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Shield /> Admin - Gestion des Plans
            </h1>
            <p style={{ marginBottom: '2rem', color: 'var(--color-text-muted)' }}>
                Page réservée à l'administrateur. Changez de plan instantanément pour tester les fonctionnalités.
            </p>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2rem'
            }}>
                {plans.map((plan) => {
                    const Icon = plan.icon;
                    const isActive = currentPlan === plan.id;

                    return (
                        <Card
                            key={plan.id}
                            style={{
                                borderColor: isActive ? plan.color : 'transparent',
                                borderWidth: isActive ? '3px' : '1px',
                                position: 'relative'
                            }}
                        >
                            {isActive && (
                                <div style={{
                                    position: 'absolute',
                                    top: '1rem',
                                    right: '1rem',
                                    background: plan.color,
                                    color: 'white',
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '20px',
                                    fontSize: '0.8rem',
                                    fontWeight: '600'
                                }}>
                                    ACTIF
                                </div>
                            )}

                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '1rem',
                                padding: '1rem'
                            }}>
                                <div style={{
                                    width: '80px',
                                    height: '80px',
                                    borderRadius: '50%',
                                    background: `${plan.color}20`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <Icon size={40} color={plan.color} />
                                </div>

                                <h3 style={{ margin: 0, fontSize: '1.5rem' }}>{plan.name}</h3>

                                <Button
                                    onClick={() => changePlan(plan.id)}
                                    disabled={loading || isActive}
                                    style={{
                                        width: '100%',
                                        background: isActive ? '#e5e7eb' : plan.color,
                                        cursor: isActive ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    {isActive ? '✓ Plan Actif' : 'Activer'}
                                </Button>
                            </div>
                        </Card>
                    );
                })}
            </div>

            <Card style={{ background: '#fef3c7', border: '2px solid #fbbf24' }}>
                <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    ⚠️ Informations Importantes
                </h3>
                <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                    <li>Cette page est <strong>uniquement accessible en production</strong> pour aurelie.jossic@gmail.com</li>
                    <li>Le changement de plan est <strong>instantané</strong> et persiste entre les sessions</li>
                    <li>Les utilisateurs normaux <strong>ne peuvent pas accéder</strong> à cette page</li>
                    <li>Vous pouvez tester toutes les fonctionnalités de chaque plan librement</li>
                </ul>
            </Card>

            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                <Button variant="secondary" onClick={() => navigate('/dashboard')}>
                    Retour au Dashboard
                </Button>
            </div>
        </div>
    );
};

export default AdminPlans;
