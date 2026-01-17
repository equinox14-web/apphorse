import React, { useState } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SEO from '../components/SEO';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { Eye, EyeOff } from 'lucide-react';
import LanguageSwitcher from '../components/LanguageSwitcher';

const Login = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await signInWithEmailAndPassword(auth, email, password);
            // AuthContext will handle state update and localStorage sync automatically
            navigate('/dashboard');
        } catch (err) {
            console.error("Login Error:", err);
            let msg = "Email ou mot de passe incorrect.";
            if (err.code === 'auth/user-not-found') msg = "Aucun utilisateur trouvé avec cet email.";
            if (err.code === 'auth/wrong-password') msg = "Mot de passe incorrect.";
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
            padding: '1rem',
            position: 'relative' // Ensure relative positioning for absolute children
        }}>
            <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
                <LanguageSwitcher variant="header" />
            </div>
            <SEO title={`${t('landing.nav.login')} - Equinox`} description={t('landing.seo.description')} />
            <Card className="animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#111827', fontWeight: 800, letterSpacing: '-0.02em' }}>{t('login.welcome_back')}</h1>
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
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <label style={{ fontSize: '0.9rem', fontWeight: 500 }}>{t('profile_page.password_label')}</label>
                            <a href="#" style={{ fontSize: '0.85rem', color: 'var(--color-primary)' }}>{t('landing.coming_soon.title')} ?</a>
                        </div>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                style={{
                                    width: '100%',
                                    padding: '0.75rem 2.5rem 0.75rem 1rem', // Added padding right for icon
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
                                    right: '0.75rem',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#6b7280',
                                    display: 'flex',
                                    alignItems: 'center'
                                }}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        variant="primary"
                        style={{ marginTop: '1rem', width: '100%', justifyContent: 'center' }}
                        disabled={loading}
                    >
                        {loading ? t('settings_page.subscription.loading') : t('landing.nav.login')}
                    </Button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                    {t('landing.coming_soon.desc')} <Link to="/signup" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{t('landing.coming_soon.button')}</Link>
                </p>

                <div style={{ marginTop: '2rem', borderTop: '1px solid #e5e7eb', paddingTop: '1.5rem', textAlign: 'center' }}>
                    <button
                        onClick={() => navigate('/login-code')}
                        style={{
                            background: 'none', border: 'none',
                            color: '#4b5563', fontWeight: 600, fontSize: '0.95rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                            width: '100%', cursor: 'pointer', padding: '0.5rem',
                            borderRadius: '8px', transition: 'background 0.2s'
                        }}
                        onMouseOver={e => e.currentTarget.style.background = '#f3f4f6'}
                        onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                    >
                        {t('login.team_code_button')}
                    </button>
                </div>
            </Card>
            <div style={{
                position: 'absolute',
                bottom: '1rem',
                left: '0',
                right: '0',
                textAlign: 'center',
                color: 'var(--color-text-muted)',
                fontSize: '0.8rem',
                opacity: 0.7
            }}>
                {t('footer.copyright')}
            </div>
        </div>
    );
};

export default Login;
