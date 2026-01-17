import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase'; // Adjust path if needed
import { collection, addDoc, onSnapshot } from 'firebase/firestore';
import { Send, Sparkles, Bot, User, Loader2, CheckCircle, Mic, MicOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ReactMarkdown from 'react-markdown';

// Sous-composant pour la gestion d'état du planning
const PlanningProposal = ({ events }) => {
    const [status, setStatus] = useState('idle'); // 'idle' | 'saved'

    const handleSave = () => {
        try {
            const existing = JSON.parse(localStorage.getItem('appHorse_customEvents') || '[]');
            const newEvents = events.map(evt => ({
                id: Date.now() + Math.random(),
                title: evt.title,
                dateStr: new Date(`${evt.date}T${evt.time || '10:00'}`).toISOString(),
                type: evt.type || 'other',
                types: [evt.type || 'other'],
                color: '#4f46e5',
                horseId: evt.horseId || '',
                rider: evt.rider || 'Moi',
                details: evt.details || 'Planifié par Assistant IA'
            }));

            const updated = [...existing, ...newEvents];
            localStorage.setItem('appHorse_customEvents', JSON.stringify(updated));
            setStatus('saved');
        } catch (error) {
            console.error("Erreur sauvegarde", error);
            alert("Erreur: " + error.message);
        }
    };

    if (status === 'saved') {
        return (
            <div style={{
                marginTop: '1rem',
                padding: '1rem',
                background: '#ecfdf5', // Vert très clair
                border: '1px solid #10b981',
                borderRadius: '12px',
                color: '#065f46',
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                fontWeight: 600
            }}>
                <CheckCircle size={20} />
                Planning ajouté avec succès !
            </div>
        );
    }

    return (
        <div style={{
            marginTop: '1rem',
            background: 'white',
            borderRadius: '12px',
            padding: '1rem',
            border: '1px solid #e2e8f0',
            color: '#1e293b'
        }}>
            <h4 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={16} className="text-primary" />
                Proposition de Planning
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                {events.map((evt, idx) => (
                    <div key={idx} style={{
                        display: 'flex', justifyContent: 'space-between',
                        fontSize: '0.9rem', padding: '0.5rem',
                        background: '#f8fafc', borderRadius: '8px'
                    }}>
                        <strong>{evt.title}</strong>
                        <span>{new Date(evt.date).toLocaleDateString()}</span>
                    </div>
                ))}
            </div>
            <button
                onClick={handleSave}
                style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'var(--color-primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem',
                    transition: 'all 0.2s'
                }}
            >
                <CheckCircle size={18} />
                Valider et Ajouter au Calendrier
            </button>
        </div>
    );
};

const Assistant = () => {
    const { t } = useTranslation();
    const { currentUser } = useAuth();
    const { mode } = useTheme(); // 'light' or 'dark'
    const [messages, setMessages] = useState([
        {
            id: 'intro',
            role: 'assistant',
            content: "Bonjour ! Je suis votre assistant Equinox. Comment puis-je vous aider aujourd'hui dans la gestion de votre écurie ?",
            timestamp: new Date()
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef(null);
    const messagesEndRef = useRef(null);

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("La reconnaissance vocale n'est pas supportée par votre navigateur.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'fr-FR';
        recognition.continuous = false;
        recognition.interimResults = true;

        recognition.onstart = () => setIsListening(true);

        recognition.onresult = (event) => {
            const transcript = Array.from(event.results)
                .map(result => result[0])
                .map(result => result.transcript)
                .join('');
            setInputValue(transcript);
        };

        recognition.onerror = (event) => {
            console.error("Erreur vocale:", event.error);
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isThinking]);

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
        const advancedPrompt = `CONTEXTE:
Tu es l'assistant expert de l'application Equinox.
Date actuelle : ${todayStr}.
Cheval par défaut si non précisé : demande lequel.

CHEVAUX DE L'ÉCURIE (Nom et ID):
${horsesListStr}

INSTRUCTIONS:
- Réponds toujours en français.
- SI l'utilisateur demande de PLANIFIER ou CRÉER des séances :
   1. Vérifie si tu as le cheval et la date.
   2. Génère un bloc JSON spécial entouré de \`\`\`json_planning et \`\`\` contenant un tableau d'événements.
   Format JSON attendu :
   [
     {
       "title": "Saut d'obstacles",
       "date": "YYYY-MM-DD",
       "time": "14:00",
       "type": "saut",
       "horseId": "ID_EXACT_DU_CHEVAL",
       "details": "Description courte"
     }
   ]
   (Types valides: dressage, saut, longe, trotting, marcheur, care, stable, other)

QUESTION UTILISATEUR:
${userMsg}`;

        console.log("--------------- DEBUG PROMPT ---------------");
        console.log(advancedPrompt);
        console.log("-------------------------------------------");

        try {
            // Create a document in 'generate' collection
            const docRef = await addDoc(collection(db, 'generate'), {
                prompt: advancedPrompt,
                createdAt: new Date(),
                userId: currentUser?.uid
            });
            console.log("Document created with ID:", docRef.id);

            // Listen for changes to this document (waiting for the 'output' field)
            const unsubscribe = onSnapshot(docRef, (docSnap) => {
                const data = docSnap.data();
                if (data) {
                    // Cas 1 : Succès
                    if (data.output) {
                        const aiMessageObj = {
                            id: docSnap.id,
                            role: 'assistant',
                            content: data.output,
                            timestamp: new Date()
                        };
                        setMessages(prev => [...prev, aiMessageObj]);
                        setIsThinking(false);
                        unsubscribe();
                    }
                    // Cas 2 : Erreur renvoyée par l'extension
                    else if (data.status && data.status.state === 'ERRORED') {
                        console.error("Erreur Extension Gemini:", data.status);
                        setMessages(prev => [...prev, {
                            id: Date.now().toString(),
                            role: 'assistant',
                            content: `Erreur IA: ${data.status.error || "Une erreur inconnue est survenue côté serveur."}`,
                            isError: true,
                            timestamp: new Date()
                        }]);
                        setIsThinking(false);
                        unsubscribe();
                    }
                }
            });

        } catch (error) {
            console.error("Error sending message:", error);
            setIsThinking(false);
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: "Désolé, une erreur est survenue lors de la communication avec l'IA.",
                isError: true,
                timestamp: new Date()
            }]);
        }
    };




    // Helper pour rendu de message avec ou sans planning
    const renderMessageContent = (msg) => {
        // Regex pour trouver le bloc JSON
        const jsonBlockRegex = /```json_planning([\s\S]*?)```/;
        const match = msg.content.match(jsonBlockRegex);

        if (match && msg.role === 'assistant') {
            const textBefore = msg.content.split(match[0])[0];
            let events = [];
            try {
                events = JSON.parse(match[1]);
            } catch (e) { console.error("JSON Error", e); }

            return (
                <div className="markdown-content">
                    <ReactMarkdown>{textBefore}</ReactMarkdown>
                    {events.length > 0 && <PlanningProposal events={events} />}
                </div>
            );
        }

        // Rendu standard
        return (
            <div className="markdown-content">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
        );
    };

    return (
        <div className="animate-fade-in" style={{
            height: 'calc(100vh - 140px)',
            display: 'flex',
            flexDirection: 'column',
            maxWidth: '1000px',
            margin: '0 auto',
            position: 'relative'
        }}>


            {/* Header / Context */}
            <div className="glass-panel" style={{
                padding: '1.5rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                borderRadius: 'var(--radius-lg)'
            }}>
                <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                }}>
                    <Sparkles size={24} />
                </div>
                <div>
                    <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Assistant IA Equinox</h1>
                    <p style={{ margin: 0, opacity: 0.7, fontSize: '0.9rem' }}>Propulsé par Google Gemini</p>
                </div>
            </div>

            {/* Chat Area */}
            <div className="glass-panel" style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                position: 'relative'
            }}>
                {/* Messages List */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.5rem'
                }}>
                    {messages.map((msg) => (
                        <div key={msg.id} style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        }}>
                            <div style={{
                                display: 'flex',
                                gap: '0.75rem',
                                maxWidth: '80%',
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
                                    // Style spécifique pour le Markdown
                                    fontSize: '0.95rem'
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
                <div style={{
                    padding: '1.5rem',
                    background: mode === 'dark' ? 'rgba(0,0,0,0.2)' : '#f8fafc',
                    borderTop: '1px solid var(--border-color)'
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
                            placeholder={isListening ? "Je vous écoute..." : "Posez une question à l'assistant..."}
                            disabled={isThinking}
                            style={{
                                flex: 1,
                                padding: '0.875rem 1.25rem',
                                borderRadius: '12px',
                                border: isListening ? '2px solid #ef4444' : '1px solid var(--border-color)',
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
                            type="button"
                            onClick={toggleListening}
                            style={{
                                background: isListening ? '#ef4444' : 'transparent',
                                color: isListening ? 'white' : 'var(--color-text-muted)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '12px',
                                padding: '0 1rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s'
                            }}
                            title="Dicter vocalement"
                        >
                            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                        </button>
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
