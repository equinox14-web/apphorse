import React, { useState } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SEO from '../components/SEO';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '../firebase';
import { setDoc, doc } from 'firebase/firestore';
import { Eye, EyeOff, X } from 'lucide-react';
import { WHITELISTED_TESTERS } from '../utils/permissions';

const SignUp = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState('');
    const [isPro, setIsPro] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [showCGU, setShowCGU] = useState(false); // State for CGU Modal

    const handleSubmit = async (e) => {
        // ... (rest of handleSubmit unchanged)
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // 1. Set Auth Language for Verification Emails
            auth.languageCode = i18n.language;

            // 2. Create User in Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 3. Update Profile (Display Name)
            await updateProfile(user, {
                displayName: name
            });

            // 3b. Check for Tester Whitelist
            const isTester = WHITELISTED_TESTERS.includes(email.toLowerCase());
            const planToSet = isTester ? ['elite'] : (isPro ? ['pro_trial'] : ['decouverte']);
            const roleToSet = isTester ? 'Pro' : (isPro ? 'Pro' : 'rider');

            // 4. Create User Document in Firestore
            await setDoc(doc(db, "users", user.uid), {
                name: name,
                email: email,
                role: roleToSet,
                plans: planToSet,
                trialStartDate: (isPro || isTester) ? Date.now() : null,
                createdAt: new Date().toISOString(),
                language: i18n.language, // Save preference for backend
                isAdminBypass: isTester // Protect from AuthContext overwrite
            });

            // Legacy LocalStorage cleanup for fresh start
            localStorage.removeItem('userType');
            localStorage.removeItem('subscriptionPlan');

            if (isTester) {
                localStorage.setItem('subscriptionPlan', JSON.stringify(['elite']));
                localStorage.setItem('user_role', 'Pro');
                // Ensure permissions.js sees the email immediately
                localStorage.setItem('user_email', email);
            } else if (isPro) {
                localStorage.setItem('subscriptionPlan', JSON.stringify(['pro_trial']));
                localStorage.setItem('trialStartDate', Date.now().toString());
                localStorage.setItem('user_role', 'Pro');
            } else {
                localStorage.setItem('subscriptionPlan', JSON.stringify(['decouverte']));
                localStorage.setItem('user_role', 'rider');
            }

            navigate('/dashboard');
        } catch (err) {
            console.error("Signup Error:", err);
            let msg = "Une erreur est survenue lors de l'inscription.";
            if (err.code === 'auth/email-already-in-use') msg = "Cet email est déjà utilisé.";
            if (err.code === 'auth/weak-password') msg = "Le mot de passe doit faire au moins 6 caractères.";
            setError(msg);
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
            padding: '1rem'
        }}>
            <SEO title={`${t('landing.nav.create')} - Equinox`} description={t('landing.seo.description')} />
            <Card className="animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <img src="/Logo_equinox-nom.png" alt="Equinox" style={{ maxWidth: '200px', height: 'auto', marginBottom: '1rem' }} />
                    <p style={{ color: 'var(--color-text-muted)' }}>L'excellence au service de vos chevaux.</p>
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
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>{t('settings_page.account.name_label')}</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Jean Dupont ou Haras de la Vallée"
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid rgba(0,0,0,0.1)',
                                background: 'rgba(255,255,255,0.5)',
                                fontSize: '1rem',
                                outline: 'none',
                                transition: 'all 0.2s'
                            }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>{t('profile_page.email_label')}</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="jean@example.com"
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid rgba(0,0,0,0.1)',
                                background: 'rgba(255,255,255,0.5)',
                                fontSize: '1rem',
                                outline: 'none'
                            }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>{t('profile_page.password_label')}</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                style={{
                                    width: '100%',
                                    padding: '0.75rem 2.5rem 0.75rem 1rem',
                                    borderRadius: 'var(--radius-sm)',
                                    border: '1px solid rgba(0,0,0,0.1)',
                                    background: 'rgba(255,255,255,0.5)',
                                    fontSize: '1rem',
                                    outline: 'none'
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '10px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    opacity: 0.6
                                }}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>



                    <div style={{ display: 'flex', alignItems: 'start', gap: '0.5rem', marginTop: '1rem' }}>
                        <input
                            type="checkbox"
                            id="cgu"
                            required
                            style={{ width: '18px', height: '18px', cursor: 'pointer', marginTop: '3px' }}
                        />
                        <label htmlFor="cgu" style={{ fontSize: '0.85rem', cursor: 'pointer', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
                            J'accepte les <span onClick={(e) => { e.preventDefault(); setShowCGU(true); }} style={{ color: 'var(--color-primary)', textDecoration: 'underline', fontWeight: 600 }}>CGU/CGV</span> et je donne mandat de facturation à Equinox pour émettre mes factures en mon nom et pour mon compte.
                        </label>
                    </div>

                    <Button
                        type="submit"
                        variant="primary"
                        style={{ marginTop: '1rem', width: '100%', justifyContent: 'center' }}
                        disabled={loading}
                    >
                        {loading ? t('settings_page.subscription.loading') : t('landing.coming_soon.button')}
                    </Button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                    Déjà membre ? <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Se connecter</Link>
                </p>
            </Card>
            <div style={{
                position: 'fixed',
                bottom: '1rem',
                left: '0',
                right: '0',
                textAlign: 'center',
                color: 'var(--color-text-muted)',
                fontSize: '0.8rem',
                opacity: 0.7,
                pointerEvents: 'none'
            }}>
                {t('footer.copyright')}
            </div>

            {/* CGU/CGV MODAL */}
            {showCGU && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', zIndex: 9999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '1rem'
                }} onClick={() => setShowCGU(false)}>
                    <Card
                        className="animate-fade-in-up"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            maxWidth: '600px', width: '100%', maxHeight: '80vh',
                            display: 'flex', flexDirection: 'column', padding: '0',
                            overflow: 'hidden'
                        }}
                    >
                        <div style={{
                            padding: '1.5rem', borderBottom: '1px solid #e5e7eb',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            background: '#f9fafb'
                        }}>
                            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Conditions Générales (CGU/CGV)</h3>
                            <button onClick={() => setShowCGU(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#6b7280' }}>
                                <X size={24} />
                            </button>
                        </div>
                        <div style={{ padding: '1.5rem', overflowY: 'auto', lineHeight: '1.6', color: '#374151', fontSize: '0.95rem' }}>
                            <h4 style={{ fontWeight: 700, marginTop: '0', color: '#111827' }}>MANDAT DE FACTURATION</h4>
                            <p>
                                En acceptant les présentes conditions, le Client (l'Écurie) donne expressément mandat à EQUINOX (la Plateforme) d'émettre
                                en son nom et pour son compte les factures destinées à ses propres clients (les Cavaliers/Propriétaires),
                                conformément à l'article 289 du Code Général des Impôts.
                            </p>
                            <p>
                                Le Client conserve l'entière responsabilité de ses obligations en matière de facturation et de ses conséquences
                                au regard de la TVA. Le Client s'engage à verser au Trésor Public la taxe mentionnée sur les factures émises en son nom.
                            </p>

                            <h4 style={{ fontWeight: 700, marginTop: '1rem', color: '#111827' }}>FRAIS DE SERVICE</h4>
                            <p>
                                <strong>Transaction Bancaire (Stripe) :</strong> ~1.4% + 0.25€ par transaction réussie.<br />
                                <strong>Frais de Plateforme (Equinox) :</strong> 1% par transaction (Application Fee).<br />
                                <strong>Frais de Facturation (Stripe Invoicing) :</strong> Gratuit jusqu'à 25 factures/mois, puis 0.4% par facture payée (plafonné à 2€).
                            </p>

                            <h4 style={{ fontWeight: 700, marginTop: '1rem', color: '#111827' }}>RESPONSABILITÉ</h4>
                            <p>
                                EQUINOX agit en tant qu'intermédiaire technique et ne saurait être tenu responsable des litiges commerciaux
                                entre l'Écurie et le propriétaire/client.
                            </p>

                            <div style={{ marginTop: '2rem', padding: '1rem', background: '#eff6ff', borderRadius: '8px', fontSize: '0.9rem', color: '#1e40af' }}>
                                Les Conditions Générales complètes sont consultables à tout moment dans les Paramètres de l'application.
                            </div>
                        </div>
                        <div style={{ padding: '1rem', borderTop: '1px solid #e5e7eb', textAlign: 'right' }}>
                            <Button onClick={() => setShowCGU(false)}>J'ai compris</Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default SignUp;
