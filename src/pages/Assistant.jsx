import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase'; // Adjust path if needed
import { collection, addDoc, onSnapshot } from 'firebase/firestore';
import { Send, Sparkles, Bot, User, Loader2, Check, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ReactMarkdown from 'react-markdown';
import { chatWithAssistant } from '../services/geminiService';
import { syncAIChatToFirestore, fetchAIChatFromFirestore } from '../services/dataSyncService';

const Assistant = () => {
    const { t } = useTranslation();
    const { currentUser } = useAuth();
    const { mode } = useTheme(); // 'light' or 'dark'

    // Initialisation depuis localStorage ou message par défaut
    const [messages, setMessages] = useState(() => {
        const saved = localStorage.getItem('equinox_assistant_history');
        if (saved) {
            try {
                // Reconstruire les objets Date car JSON.parse retourne des strings
                return JSON.parse(saved).map(msg => ({
                    ...msg,
                    timestamp: new Date(msg.timestamp)
                }));
            } catch (e) {
                console.error("Erreur lecture historique", e);
            }
        }
        return [{
            id: 'intro',
            role: 'assistant',
            content: "Bonjour ! Je suis votre assistant Equinox. Comment puis-je vous aider aujourd'hui ?",
            timestamp: new Date()
        }];
    });

    // Chargement Cloud au démarrage si connecté
    useEffect(() => {
        if (currentUser) {
            fetchAIChatFromFirestore(currentUser.uid).then(cloudHistory => {
                if (cloudHistory && cloudHistory.length > 0) {
                    console.log("📥 Historique Cloud chargé");
                    // Conversion des dates (Firestore timestamp string) en objets Date
                    const formatted = cloudHistory.map(msg => ({
                        ...msg,
                        timestamp: new Date(msg.timestamp)
                    }));
                    setMessages(formatted);
                }
            });
        }
    }, [currentUser]);

    const [inputValue, setInputValue] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Sauvegarde automatique (Local + Cloud)
    useEffect(() => {
        localStorage.setItem('equinox_assistant_history', JSON.stringify(messages));
        if (currentUser) {
            // Debounce simple ou appel direct (c'est léger)
            syncAIChatToFirestore(currentUser.uid, messages);
        }
        scrollToBottom();
    }, [messages, isThinking, currentUser]);

    const clearHistory = () => {
        if (confirm("Voulez-vous vraiment effacer l'historique de la conversation ?")) {
            const newHistory = [{
                id: Date.now().toString(),
                role: 'assistant',
                content: "Historique effacé. De quoi voulez-vous parler ?",
                timestamp: new Date()
            }];
            setMessages(newHistory);
            localStorage.setItem('equinox_assistant_history', JSON.stringify(newHistory));
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        const userMsg = inputValue.trim();
        setInputValue('');

        // Add user message to UI immediately
        const userMessageObj = {
            id: Date.now().toString(),
            role: 'user',
            content: userMsg,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMessageObj]);
        setIsThinking(true);

        // 1. Récupération des données dynamiques (Chevaux + Date)
        const horses = JSON.parse(localStorage.getItem('my_horses_v4') || '[]');
        const horsesListStr = horses.map(h => `- ${h.name} (ID: ${h.id})`).join('\n');
        const todayStr = new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

        // 2. Construction du Prompt Système Avancé
        // 2. Construction du Prompt Système Avancé (Equinox Vet Guard)
        const advancedPrompt = `Tu es "Equinox Vet Guard", un assistant IA expert en santé équine et pharmacologie vétérinaire, intégré à l'application de gestion d'écurie "Equinox".

TES OBJECTIFS :
1. Analyser les demandes de soins et santé.
2. Répondre aux questions des propriétaires avec précision et prudence.
3. Aider à la planification des soins et de l'entraînement.

RÈGLES DE SÉCURITÉ ABSOLUES (CRITIQUE) :
- Tu n'es PAS un vétérinaire. Tu ne poses jamais de diagnostic définitif.
- Si l'utilisateur décrit une urgence vitale (coliques, fracture, hémorragie, cheval couché), ta PREMIÈRE phrase doit être : "🚨 URGENCE : Appelez immédiatement votre vétérinaire."
- Rappelle toujours que tes conseils ne remplacent pas une consultation physique.

MODE CONSEIL & DISCUSSION :
- Ton ton est professionnel, empathique et éducatif. Utilise le vouvoiement.
- Sois concis. Listes à puces appréciées.
- Base tes réponses sur la médecine vétérinaire équine moderne.
- Si on demande un dosage sans ordonnance, refuse de donner une dose précise (risque de surdosage).

MODE PLANIFICATION (Si l'utilisateur demande de CRÉER ou PLANIFIER des séances) :
- Vérifie si tu as le cheval et la date.
- Génère un bloc JSON spécial entouré de \`\`\`json_planning et \`\`\` contenant un tableau d'événements.
   Format JSON attendu :
   [
     {
       "title": "Nom de la séance",
       "date": "YYYY-MM-DD",
       "time": "14:00",
       "type": "care" (ou stable, other, saut, longe...),
       "horseId": "ID_EXACT_DU_CHEVAL",
       "details": "Description courte",
       "color": "#e11d48" (Rouge pour santé) ou autre
     }
   ]

CONTEXTE UTILISATEUR :
Date actuelle : ${todayStr}
L'utilisateur est un gérant d'écurie ou propriétaire.
CHEVAUX DE L'ÉCURIE (Nom et ID) :
${horsesListStr}

QUESTION UTILISATEUR :
${userMsg}`;

        console.log("--------------- DEBUG PROMPT ---------------");
        console.log(advancedPrompt);
        console.log("-------------------------------------------");

        try {
            // APPEL DIRECT À L'API GEMINI (Sans passer par Firestore)
            const result = await chatWithAssistant(advancedPrompt);

            if (result.success) {
                const aiMessageObj = {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: result.response,
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, aiMessageObj]);
            } else {
                console.error("Erreur Gemini Service:", result.error);
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: `Une erreur est survenue : ${result.error}`,
                    isError: true,
                    timestamp: new Date()
                }]);
            }

            setIsThinking(false);

        } catch (error) {
            console.error("Error calling Gemini:", error);
            setIsThinking(false);
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: "Désolé, une erreur technique est survenue.",
                isError: true,
                timestamp: new Date()
            }]);
        }
    };




    // Fonction pour ajouter au calendrier
    const addToCalendar = (eventData) => {
        try {
            const existing = JSON.parse(localStorage.getItem('appHorse_customEvents') || '[]');
            const newEvent = {
                id: Date.now(),
                title: eventData.title,
                dateStr: new Date(`${eventData.date}T${eventData.time}`).toISOString(),
                type: eventData.type || 'other',
                types: [eventData.type || 'other'],
                color: eventData.color || '#3b82f6',
                horseId: eventData.horseId,
                rider: 'Moi',
                details: eventData.details || 'Planifié via Assistant IA',
                completed: false
            };

            const updated = [...existing, newEvent];
            localStorage.setItem('appHorse_customEvents', JSON.stringify(updated));
            alert(`✅ "${eventData.title}" ajouté au calendrier pour le ${eventData.date} à ${eventData.time} !`);

            // Événement personnalisé pour rafraîchir le calendrier si ouvert
            window.dispatchEvent(new Event('storage'));
        } catch (e) {
            console.error(e);
            alert("Erreur lors de l'ajout au calendrier");
        }
    };

    // Helper pour rendu de message (Texte + Carte Planning)
    const renderMessageContent = (msg) => {
        // Détection du bloc JSON planning
        const planningRegex = /```json_planning([\s\S]*?)```/;
        const match = msg.content.match(planningRegex);

        if (match) {
            const jsonStr = match[1];
            const textPart = msg.content.replace(planningRegex, '').trim();
            let events = [];
            try {
                events = JSON.parse(jsonStr);
            } catch (e) {
                console.error("Erreur parsing JSON planning", e);
            }

            return (
                <div className="markdown-content">
                    {textPart && <ReactMarkdown>{textPart}</ReactMarkdown>}

                    {events.length > 0 && (
                        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600, opacity: 0.8, textTransform: 'uppercase' }}>
                                📅 Proposition de planning ({events.length})
                            </div>
                            {events.map((evt, idx) => (
                                <div key={idx} style={{
                                    background: 'white',
                                    color: '#333',
                                    padding: '1rem',
                                    borderRadius: '12px',
                                    borderLeft: `4px solid ${evt.color || '#3b82f6'}`,
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                }}>
                                    <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{evt.title}</div>
                                    <div style={{ display: 'flex', gap: '1rem', margin: '0.5rem 0', fontSize: '0.9rem', color: '#666' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            🗓️ {evt.date}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            🕒 {evt.time}
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
                                        {evt.details}
                                    </div>
                                    <button
                                        onClick={() => addToCalendar(evt)}
                                        style={{
                                            background: '#f3f4f6',
                                            border: 'none',
                                            color: '#333',
                                            padding: '0.5rem 1rem',
                                            borderRadius: '8px',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            fontSize: '0.9rem',
                                            width: '100%',
                                            justifyContent: 'center',
                                            transition: 'background 0.2s'
                                        }}
                                        onMouseOver={e => e.target.style.background = '#e5e7eb'}
                                        onMouseOut={e => e.target.style.background = '#f3f4f6'}
                                    >
                                        <Check size={16} /> Ajouter au calendrier
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            );
        }

        return (
            <div className="markdown-content">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
        );
    };

    return (
        <div className="animate-fade-in assistant-page-wrapper">
            <style>{`
                .assistant-page-wrapper {
                    height: calc(100vh - 100px);
                    display: flex;
                    flex-direction: column;
                    max-width: 1000px;
                    margin: 0 auto;
                    position: relative;
                }
                
                .assistant-header {
                    padding: 1.5rem;
                    margin-bottom: 1rem;
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    border-radius: var(--radius-lg);
                }

                .chat-panel {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    border-radius: var(--radius-lg);
                    overflow: hidden;
                    position: relative;
                }

                .messages-list {
                    flex: 1;
                    overflow-y: auto;
                    padding: 1.5rem;
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }

                .input-section {
                    padding: 1.5rem;
                    border-top: 1px solid var(--border-color);
                }

                @media (max-width: 768px) {
                    .assistant-page-wrapper {
                        height: calc(100dvh - 84px); /* Ajustement pour la barre de nav mobile */
                        max-width: 100%;
                    }

                    .assistant-header {
                        padding: 0.75rem 1rem;
                        margin-bottom: 0.5rem;
                        border-radius: 0;
                    }
                    
                    .chat-panel {
                        border-radius: 0;
                    }

                    .messages-list {
                        padding: 1rem;
                        gap: 1rem;
                    }

                    .input-section {
                        padding: 0.75rem;
                    }
                }
            `}</style>

            {/* Header / Context */}
            <div className="glass-panel assistant-header">
                <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                    flexShrink: 0
                }}>
                    <Sparkles size={24} />
                </div>
                <div style={{ flex: 1 }}>
                    <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Assistant IA Equinox</h1>
                    <p style={{ margin: 0, opacity: 0.7, fontSize: '0.9rem' }}>Propulsé par Google Gemini</p>
                </div>

                {messages.length > 2 && (
                    <button
                        onClick={clearHistory}
                        title="Effacer l'historique"
                        style={{
                            background: 'transparent',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-color)',
                            width: '40px',
                            height: '40px',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            opacity: 0.7,
                            flexShrink: 0
                        }}
                        onMouseOver={e => { e.target.style.opacity = 1; e.target.style.background = 'rgba(239, 68, 68, 0.1)'; e.target.style.borderColor = '#ef4444'; e.target.style.color = '#ef4444'; }}
                        onMouseOut={e => { e.target.style.opacity = 0.7; e.target.style.background = 'transparent'; e.target.style.borderColor = 'var(--border-color)'; e.target.style.color = 'var(--text-color)'; }}
                    >
                        <Trash2 size={18} />
                    </button>
                )}
            </div>

            {/* Chat Area */}
            <div className="glass-panel chat-panel">
                {/* Messages List */}
                <div className="messages-list">
                    {messages.map((msg) => (
                        <div key={msg.id} style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        }}>
                            <div style={{
                                display: 'flex',
                                gap: '0.75rem',
                                maxWidth: '85%',
                                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
                            }}>
                                {/* Avatar */}
                                <div style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    background: msg.role === 'user' ? '#e2e8f0' : 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                    color: msg.role === 'user' ? '#64748b' : 'white',
                                    fontSize: '0.8rem'
                                }}>
                                    {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                                </div>

                                {/* Bubble */}
                                <div style={{
                                    background: msg.role === 'user'
                                        ? 'var(--color-primary)'
                                        : (mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'white'),
                                    color: msg.role === 'user' ? 'white' : 'inherit',
                                    padding: '1rem',
                                    borderRadius: '16px',
                                    borderTopRightRadius: msg.role === 'user' ? '4px' : '16px',
                                    borderTopLeftRadius: msg.role === 'assistant' ? '4px' : '16px',
                                    boxShadow: msg.role === 'assistant' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                                    border: msg.role === 'assistant' ? '1px solid rgba(0,0,0,0.05)' : 'none',
                                    lineHeight: 1.6,
                                    fontSize: '0.95rem',
                                    wordBreak: 'break-word',
                                    overflowWrap: 'anywhere'
                                }}>
                                    {msg.role === 'user' ? (
                                        msg.content
                                    ) : (
                                        renderMessageContent(msg)
                                    )}
                                </div>
                            </div>
                            <span style={{
                                fontSize: '0.7rem',
                                opacity: 0.5,
                                marginTop: '0.25rem',
                                marginRight: msg.role === 'user' ? '3rem' : 0,
                                marginLeft: msg.role === 'assistant' ? '3rem' : 0,
                            }}>
                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    ))}

                    {isThinking && (
                        <div style={{ display: 'flex', gap: '0.75rem', maxWidth: '80%' }}>
                            <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                color: 'white'
                            }}>
                                <Bot size={16} />
                            </div>
                            <div style={{
                                background: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'white',
                                padding: '1rem',
                                borderRadius: '16px',
                                borderTopLeftRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                            }}>
                                <Loader2 className="animate-spin" size={16} />
                                <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>Réflexion en cours...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="input-section" style={{
                    background: mode === 'dark' ? 'rgba(0,0,0,0.2)' : '#f8fafc'
                }}>
                    <form onSubmit={handleSendMessage} style={{
                        display: 'flex',
                        gap: '0.75rem',
                        position: 'relative'
                    }}>
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Posez une question à l'assistant..."
                            disabled={isThinking}
                            style={{
                                flex: 1,
                                padding: '0.875rem 1.25rem',
                                borderRadius: '12px',
                                border: '1px solid var(--border-color)',
                                background: mode === 'dark' ? '#1e293b' : 'white',
                                color: 'inherit',
                                fontSize: '1rem',
                                outline: 'none',
                                transition: 'all 0.2s ease',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                        />
                        <button
                            type="submit"
                            disabled={!inputValue.trim() || isThinking}
                            style={{
                                background: 'var(--color-primary)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                padding: '0 1.25rem',
                                cursor: inputValue.trim() && !isThinking ? 'pointer' : 'not-allowed',
                                opacity: inputValue.trim() && !isThinking ? 1 : 0.7,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s'
                            }}
                        >
                            <Send size={20} />
                        </button>
                    </form>
                    <p style={{
                        textAlign: 'center',
                        fontSize: '0.75rem',
                        opacity: 0.5,
                        marginTop: '0.75rem',
                        marginBottom: 0
                    }}>
                        L'IA peut faire des erreurs. Vérifiez les informations importantes.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Assistant;
