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
                }
            `}</style>

            <div className="support-header">
                <h2 className="text-gradient" style={{ margin: 0 }}>{t('support_page.title')}</h2>
                <Button variant="secondary" onClick={handleSendMail} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.9rem' }}>
                    <Mail size={18} /> {t('support_page.contact_btn')}
                </Button>
            </div>

            <Card className="flex-1 flex flex-col overflow-hidden p-0 bg-white dark:bg-slate-800 border-gray-100 dark:border-gray-700">
                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 bg-gray-50/50 dark:bg-slate-900/50">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}
                        >
                            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs ${msg.sender === 'user'
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                                }`}>
                                {msg.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
                            </div>
                            <div className={`py-3 px-4 rounded-xl shadow-sm whitespace-pre-wrap text-sm break-words ${msg.sender === 'user'
                                    ? 'bg-indigo-600 text-white rounded-tr-sm'
                                    : 'bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-100 rounded-tl-sm border border-gray-100 dark:border-gray-600'
                                }`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="self-start ml-12 text-gray-400 dark:text-gray-500 text-sm italic animate-pulse">
                            {t('support_page.typing')}
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <form onSubmit={handleSendMessage} className="p-4 bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-gray-700 flex gap-3">
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder={t('support_page.input_placeholder')}
                        className="flex-1 p-3 border border-gray-200 dark:border-gray-600 rounded-lg text-base outline-none text-gray-900 dark:text-white bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500/50 block w-full min-w-0"
                    />
                    <Button type="submit" disabled={!inputText.trim()} className="aspect-square p-0 w-[48px] flex items-center justify-center flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-lg shadow-indigo-500/30">
                        <Send size={20} />
                    </Button>
                </form>
            </Card>
        </div>
    );
};

export default Support;
