import React, { useState, useRef, useEffect } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { Send, User, Bot, Mail, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';

const Support = () => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const [messages, setMessages] = useState([
        {
            id: 1,
            sender: 'bot',
            text: "" // Init as empty, will update on mount to allow translation
        }
    ]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    // Initial Message Translation Fix
    useEffect(() => {
        setMessages(prev => prev.map(m => m.id === 1 ? { ...m, text: t('support_page.bot_welcome') } : m));
    }, [t]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        const userMsg = { id: Date.now(), sender: 'user', text: inputText };
        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        setIsTyping(true);

        // Simple Rule-Base Bot Logic
        setTimeout(() => {
            let botResponse = t('support_page.bot.default_response');
            const lowerInput = userMsg.text.toLowerCase();

            if (lowerInput.includes('1') || lowerInput.includes('technique') || lowerInput.includes('technical')) {
                botResponse = t('support_page.bot.technical');
            } else if (lowerInput.includes('2') || lowerInput.includes('abonnement') || lowerInput.includes('subscription') || lowerInput.includes('pay')) {
                botResponse = t('support_page.bot.subscription');
            } else if (lowerInput.includes('3') || lowerInput.includes('bug') || lowerInput.includes('marche pas') || lowerInput.includes('broken')) {
                botResponse = t('support_page.bot.bug');
            } else if (lowerInput.includes('mail') || lowerInput.includes('contact') || lowerInput.includes('humain') || lowerInput.includes('human')) {
                botResponse = t('support_page.bot.contact');
            } else if (lowerInput.includes('merci') || lowerInput.includes('oui') || lowerInput.includes('super') || lowerInput.includes('thanks') || lowerInput.includes('yes')) {
                botResponse = t('support_page.bot.thanks');
            }

            const botMsg = { id: Date.now() + 1, sender: 'bot', text: botResponse };
            setMessages(prev => [...prev, botMsg]);
            setIsTyping(false);
        }, 1000);
    };

    const handleSendMail = () => {
        const subject = t('support_page.mail.subject');
        const body = t('support_page.mail.body');
        window.location.href = `mailto:horse-equinox@outlook.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    };

    return (
        <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto', height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 className="text-gradient">{t('support_page.title')}</h2>
                <Button variant="secondary" onClick={handleSendMail} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <Mail size={18} /> {t('support_page.contact_btn')}
                </Button>
            </div>

            <Card style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
                {/* Chat Area */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(255,255,255,0.5)' }}>
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            style={{
                                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                                maxWidth: '80%',
                                display: 'flex',
                                gap: '0.5rem',
                                flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row'
                            }}
                        >
                            <div style={{
                                width: '32px', height: '32px', borderRadius: '50%',
                                background: msg.sender === 'user' ? 'var(--color-primary)' : '#e5e7eb',
                                color: msg.sender === 'user' ? 'white' : '#4b5563',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0
                            }}>
                                {msg.sender === 'user' ? <User size={18} /> : <Bot size={18} />}
                            </div>
                            <div style={{
                                background: msg.sender === 'user' ? 'var(--color-primary)' : 'white',
                                color: msg.sender === 'user' ? 'white' : '#1f2937',
                                padding: '0.75rem 1rem',
                                borderRadius: '12px',
                                borderTopLeftRadius: msg.sender === 'bot' ? '2px' : '12px',
                                borderTopRightRadius: msg.sender === 'user' ? '2px' : '12px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                whiteSpace: 'pre-wrap'
                            }}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div style={{ alignSelf: 'flex-start', marginLeft: '3rem', color: '#9ca3af', fontSize: '0.85rem', fontStyle: 'italic' }}>
                            {t('support_page.typing')}
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <form onSubmit={handleSendMessage} style={{ padding: '1rem', background: 'white', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '1rem' }}>
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder={t('support_page.input_placeholder')}
                        style={{
                            flex: 1,
                            padding: '0.75rem 1rem',
                            border: '1px solid #e5e7eb',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '1rem',
                            outline: 'none',
                            color: '#333',
                            backgroundColor: '#fff'
                        }}
                    />
                    <Button type="submit" disabled={!inputText.trim()} style={{ aspectRatio: '1/1', padding: 0, width: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Send size={20} />
                    </Button>
                </form>
            </Card>
        </div>
    );
};

export default Support;
