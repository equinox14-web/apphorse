import React, { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { User, Mail, Save, Image as ImageIcon, Upload, Key } from 'lucide-react';

import { useTranslation } from 'react-i18next';

const Profile = () => {
    const { t } = useTranslation();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('user@example.com');
    const [password, setPassword] = useState('');
    const [logo, setLogo] = useState(null); // Logo data URL
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        const storedName = localStorage.getItem('user_name') || t('profile_page.default_name');
        const storedLogo = localStorage.getItem('user_logo');
        setName(storedName);
        if (storedLogo) setLogo(storedLogo);
    }, []);

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 3000000) { // Limit to 3MB
                setErrorMsg(t('profile_page.upload_error_size'));
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setLogo(reader.result);
                setErrorMsg('');
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = (e) => {
        e.preventDefault();
        setErrorMsg('');

        try {
            localStorage.setItem('user_name', name);
            if (logo) localStorage.setItem('user_logo', logo);

            setSuccessMsg(t('profile_page.save_success'));

            // Dispatch event to update MainLayout without reload
            window.dispatchEvent(new Event('user_updated'));

            setTimeout(() => {
                setSuccessMsg('');
            }, 3000);
        } catch (err) {
            console.error(err);
            if (err.name === 'QuotaExceededError' || err.code === 22) {
                setErrorMsg(t('profile_page.save_error_storage'));
            } else {
                setErrorMsg(t('profile_page.save_error_generic'));
            }
        }
    };

    return (
        <div className="animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>


            {errorMsg && (
                <div style={{ padding: '1rem', background: '#fff1f0', border: '1px solid #ffccc7', color: '#ff4d4f', borderRadius: '8px', marginBottom: '1.5rem' }}>
                    <span>{errorMsg}</span>
                </div>
            )}

            {successMsg && (
                <div style={{ padding: '1rem', background: '#f6ffed', border: '1px solid #b7eb8f', color: '#52c41a', borderRadius: '8px', marginBottom: '1.5rem' }}>
                    <span>{successMsg}</span>
                </div>
            )}

            <Card>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                    <div style={{ position: 'relative', width: '100px', height: '100px' }}>
                        <input
                            id="logo-upload"
                            type="file"
                            accept="image/png, image/jpeg, image/svg+xml"
                            onChange={handleLogoChange}
                            style={{ display: 'none' }}
                        />
                        <label
                            htmlFor="logo-upload"
                            style={{
                                display: 'block',
                                width: '100%',
                                height: '100%',
                                borderRadius: '50%',
                                overflow: 'hidden',
                                cursor: 'pointer',
                                background: 'var(--color-background)',
                                border: '2px dashed var(--color-border)',
                                position: 'relative'
                            }}
                            className="group"
                        >
                            {logo ? (
                                <img src={logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', fontSize: '2rem', fontWeight: 'bold' }}>
                                    {name.charAt(0).toUpperCase()}
                                </div>
                            )}

                            <div className="group-hover:opacity-100" style={{
                                position: 'absolute',
                                top: 0, left: 0, width: '100%', height: '100%',
                                background: 'rgba(0,0,0,0.6)',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                opacity: 0,
                                transition: 'opacity 0.2s',
                                color: 'white',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                gap: '4px'
                            }}>
                                <Upload color="white" size={20} />
                                <span>{t('profile_page.change_logo')}</span>
                            </div>
                        </label>
                    </div>
                    <div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>{name || t('profile_page.default_name')}</h3>
                    </div>
                </div>

                <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <User size={16} /> {t('profile_page.name_label')}
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            style={{
                                padding: '0.75rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                                fontSize: '1rem'
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Mail size={16} /> {t('profile_page.email_label')}
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={{
                                padding: '0.75rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                                fontSize: '1rem'
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Key size={16} /> {t('profile_page.password_label')}
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            style={{
                                padding: '0.75rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                                fontSize: '1rem'
                            }}
                        />
                    </div>

                    <div style={{ marginTop: '1rem' }}>
                        <Button type="submit" style={{ width: '100%' }}>
                            <Save size={18} />
                            {t('profile_page.save_btn')}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default Profile;
