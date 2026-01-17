import React, { useState } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import { useNavigate, Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { signInAnonymously } from 'firebase/auth';
import { auth } from '../firebase';
import { Shield, ArrowLeft } from 'lucide-react';

const LoginCode = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [code, setCode] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // 1. Verify Code Locally (Simulation context)
            // In a real app, this would be a cloud function call.
            const members = JSON.parse(localStorage.getItem('appHorse_team_v2') || '[]');
            const matchedMember = members.find(m => m.accessCode === code.trim() && !m.isExternal);

            if (!matchedMember) {
                throw new Error("Code invalide ou expiré.");
            }

            // 2. Sign In Anonymously to permit basic structural access
            await signInAnonymously(auth);

            // 3. Set Local Storage Identity
            localStorage.setItem('user_name', matchedMember.name);
            localStorage.setItem('user_role', matchedMember.role);
            localStorage.setItem('userType', matchedMember.role); // Important for permissions

            // If Admin
            if (matchedMember.isAdmin) {
                localStorage.setItem('user_is_admin', 'true');
                // We might need to fake plans to allow admin access
                localStorage.setItem('subscriptionPlan', JSON.stringify(['admin']));
            } else {
                // For non-admin team member, inherit basic 'team' plan capabilities?
                // Or stick to 'decouverte' but with role privileges?
                // Permissions.js checks 'user_role' mostly.
                localStorage.setItem('subscriptionPlan', JSON.stringify(['team_member']));
            }

            // 4. Redirect
            navigate('/');

        } catch (err) {
            console.error("Login Code Error:", err);
            setError(err.message || "Erreur de connexion.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '1rem',
            background: '#f9fafb'
        }}>
            <SEO title="Connexion Code Équipe - Equinox" />
            <Card className="animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem' }}>
                <button
                    onClick={() => navigate('/login')}
                    style={{
                        border: 'none', background: 'none', color: '#6b7280',
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        cursor: 'pointer', marginBottom: '1.5rem', fontSize: '0.9rem'
                    }}
                >
                    <ArrowLeft size={16} /> Retour connexion
                </button>

                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#eff6ff', color: '#1890ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
                        <Shield size={32} />
                    </div>
                    <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem', color: '#111827', fontWeight: 800 }}>Accès Équipe</h1>
                    <p style={{ color: 'var(--color-text-muted)' }}>Entrez le code fourni par votre administrateur.</p>
                </div>

                {error && (
                    <div style={{
                        background: '#fee2e2', color: '#ef4444',
                        padding: '0.75rem', borderRadius: '8px',
                        marginBottom: '1rem', fontSize: '0.9rem', textAlign: 'center'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>Code d'accès</label>
                        <input
                            type="text"
                            required
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            placeholder="H-1234"
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid #d1d5db',
                                fontSize: '1.2rem',
                                letterSpacing: '0.1em',
                                textAlign: 'center',
                                outline: 'none',
                                textTransform: 'uppercase',
                                fontWeight: 700
                            }}
                        />
                    </div>

                    <Button
                        type="submit"
                        variant="primary"
                        style={{ marginTop: '0.5rem', width: '100%', justifyContent: 'center' }}
                        disabled={loading}
                    >
                        {loading ? 'Vérification...' : 'Accéder'}
                    </Button>
                </form>

                <div style={{ marginTop: '2rem', padding: '1rem', background: '#f3f4f6', borderRadius: '8px', fontSize: '0.85rem', color: '#6b7280', lineHeight: '1.4' }}>
                    ℹ️ <strong>Note :</strong> Ce mode de connexion est restreint à l'écurie actuelle. Pour utiliser Equinox avec plusieurs écuries, veuillez créer un compte personnel.
                </div>
            </Card>
        </div>
    );
};

export default LoginCode;
