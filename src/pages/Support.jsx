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

        <div className="animate-fade-in support-container">
            <style>{`
                .support-container {
                    max-width: 800px;
                    margin: 0 auto;
                    height: calc(100vh - 120px);
                    display: flex;
                    flex-direction: column;
                }
                .support-header {
                    margin-bottom: 1rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .support-chat-area {
                    flex: 1;
                    overflow-y: auto;
                    padding: 1.5rem;
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    background: rgba(255,255,255,0.5);
                }
                .support-input-area {
                    padding: 1rem;
                    background: white;
                    border-top: 1px solid #e5e7eb;
                    display: flex;
                    gap: 1rem;
                }
                
                @media (max-width: 768px) {
                    .support-container {
                        height: calc(100dvh - 84px);
                        margin: 0;
                        max-width: 100%;
                    }
                    .support-header {
                        padding: 0 1rem;
                        margin-bottom: 0.5rem;
                    }
                    .support-chat-area {
                        padding: 1rem;
                    }
                    .support-input-area {
                        padding: 0.75rem;
                        padding-bottom: calc(0.75rem + env(safe-area-inset-bottom));
                    }
                }
            `}</style>

            <div className="support-header">
                <h2 className="text-gradient" style={{ margin: 0 }}>{t('support_page.title')}</h2>
                <Button variant="secondary" onClick={handleSendMail} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.9rem' }}>
                    <Mail size={18} /> {t('support_page.contact_btn')}
                </Button>
            </div>

            <Card style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
                {/* Chat Area */}
                <div className="support-chat-area">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            style={{
                                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                                maxWidth: '85%',
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
                                flexShrink: 0,
                                fontSize: '0.8rem'
                            }}>
                                {msg.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
                            </div>
                            <div style={{
                                background: msg.sender === 'user' ? 'var(--color-primary)' : 'white',
                                color: msg.sender === 'user' ? 'white' : '#1f2937',
                                padding: '0.75rem 1rem',
                                borderRadius: '12px',
                                borderTopLeftRadius: msg.sender === 'bot' ? '2px' : '12px',
                                borderTopRightRadius: msg.sender === 'user' ? '2px' : '12px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                whiteSpace: 'pre-wrap',
                                fontSize: '0.95rem',
                                wordBreak: 'break-word'
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
                <form onSubmit={handleSendMessage} className="support-input-area">
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
                            backgroundColor: '#fff',
                            minWidth: 0
                        }}
                    />
                    <Button type="submit" disabled={!inputText.trim()} style={{ aspectRatio: '1/1', padding: 0, width: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Send size={20} />
                    </Button>
                </form>
            </Card>
        </div>
    );
};

export default Support;
