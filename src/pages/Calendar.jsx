import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { ChevronLeft, ChevronRight, Calendar as CalIcon, Clock, MapPin, Activity, Plus, User, Box, Trash2, ArrowLeft, CheckCircle } from 'lucide-react';
import { canAccess, isExternalUser } from '../utils/permissions';
import { useAuth } from '../context/AuthContext';
import { syncCalendarToFirestore, fetchCalendarFromFirestore } from '../services/dataSyncService';


const Calendar = () => {
    const { t, i18n } = useTranslation();
    const { currentUser } = useAuth();
    console.log("Calendar Language:", i18n.language);

    // ... (rest of states)

    // Sync Cloud Calendar on Mount
    useEffect(() => {
        if (currentUser) {
            fetchCalendarFromFirestore(currentUser.uid).then(data => {
                if (data) {
                    console.log("📥 Calendrier chargé depuis le Cloud");
                    if (data.customEvents) localStorage.setItem('appHorse_customEvents', JSON.stringify(data.customEvents));
                    if (data.careEvents) localStorage.setItem('appHorse_careItems_v3', JSON.stringify(data.careEvents));
                    // Reload UI
                    loadAllEvents();
                } else {
                    // Si rien dans le cloud, on pousse ce qu'on a en local (première sync)
                    const localCustom = JSON.parse(localStorage.getItem('appHorse_customEvents') || '[]');
                    const localCare = JSON.parse(localStorage.getItem('appHorse_careItems_v3') || '[]');
                    if (localCustom.length > 0 || localCare.length > 0) {
                        syncCalendarToFirestore(currentUser.uid, localCustom, localCare);
                    }
                }
            });
        }
    }, [currentUser]);
    const [view, setView] = useState('month'); // 'month', 'week', 'day'
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [deleteId, setDeleteId] = useState(null); // Custom Confirm Modal State
    const [validateId, setValidateId] = useState(null); // Custom Validate Modal State

    const [horsesList, setHorsesList] = useState([]);
    const [teamList, setTeamList] = useState([]);

    useEffect(() => {
        const savedHorses = JSON.parse(localStorage.getItem('my_horses_v4') || '[]');
        const savedMares = JSON.parse(localStorage.getItem('appHorse_breeding_v2') || '[]');
        setHorsesList([...savedHorses, ...savedMares]);

        const savedTeam = JSON.parse(localStorage.getItem('appHorse_team_v2') || '[]');
        setTeamList(savedTeam);
    }, []);
    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [newEvent, setNewEvent] = useState({
        type: 'dressage', // default type
        title: '',
        horseId: '',
        rider: '',
        date: '',
        time: '10:00', // Default time
        duration: '60'
    });

    // Event Types State
    // Event Types State
    const [activityTypes, setActivityTypes] = useState(() => {
        const saved = localStorage.getItem('appHorse_activityTypes');

        // Define Activity Sets
        const standardTypes = [
            { id: 'dressage', label: 'Dressage', color: '#1e40af' }, // Blue 800
            { id: 'saut', label: 'Saut d\'obstacles', color: '#b91c1c' }, // Red 700
            { id: 'tap', label: 'Travail à pied (TAP)', color: '#15803d' }, // Green 700
            { id: 'longe', label: 'Longe', color: '#0f766e' }, // Teal 700
            { id: 'marcheur', label: 'Marcheur', color: '#7e22ce' }, // Purple 700
            { id: 'stable', label: 'Box', color: '#d97706' },
            { id: 'other', label: 'Autre', color: '#4b5563' }
        ];

        const trottingTypes = [
            { id: 'promenade', label: 'Promenade', color: '#059669' }, // Emerald 600
            { id: 'trotting', label: 'Trotting', color: '#2563eb' }, // Blue 600
            { id: 'americaine', label: 'Américaine', color: '#ea580c' }, // Orange 600
            { id: 'heat', label: 'Travail par Heat', color: '#dc2626' }, // Red 600
            { id: 'lignedroite', label: 'Ligne Droite', color: '#7c3aed' }, // Violet 600
            { id: 'speed', label: 'Speed/Vitesse', color: '#db2777' }, // Pink 600
            { id: 'training', label: 'Training', color: '#4f46e5' }, // Indigo 600
            { id: 'race', label: 'Jour de Course', color: '#000000' }, // Black
            { id: 'stable', label: 'Box', color: '#d97706' }, // Amber 600
            { id: 'care', label: 'Soins', color: '#0891b2' },
            { id: 'other', label: 'Autre', color: '#4b5563' }
        ];

        const gallopTypes = [
            { id: 'trotting', label: 'Trotting', color: '#2563eb' }, // Blue 600
            { id: 'chasse', label: 'Galop de chasse', color: '#047857' }, // Emerald 700
            { id: 'canter', label: 'Canter', color: '#0284c7' }, // Sky 600
            { id: 'demitrain', label: 'Demi-train', color: '#b45309' }, // Amber 700
            { id: 'boutvite', label: 'Bout-vite', color: '#b91c1c' }, // Red 700
            { id: 'boites', label: 'Boites', color: '#6d28d9' }, // Violet 700
            { id: 'saut', label: 'Saut', color: '#c026d3' }, // Fuchsia 600
            { id: 'race', label: 'Jour de Course', color: '#000000' }, // Black
            { id: 'stable', label: 'Box', color: '#d97706' },
            { id: 'care', label: 'Soins', color: '#0891b2' },
            { id: 'other', label: 'Autre', color: '#4b5563' }
        ];

        const enduranceTypes = [
            { id: 'fond', label: 'Travail de Fond', color: '#15803d' }, // Green 700
            { id: 'trotting', label: 'Trotting', color: '#2563eb' }, // Blue 600
            { id: 'canter', label: 'Galop Canter', color: '#0284c7' }, // Sky 600
            { id: 'denivele', label: 'Travail Dénivelé', color: '#ea580c' }, // Orange 600
            { id: 'recup', label: 'Récup Active', color: '#14b8a6' }, // Teal 500
            { id: 'carriere', label: 'Carrière', color: '#4f46e5' }, // Indigo 600
            { id: 'race', label: 'Course / Concours', color: '#000000' }, // Black
            { id: 'stable', label: 'Box', color: '#d97706' },
            { id: 'care', label: 'Soins', color: '#0891b2' },
            { id: 'other', label: 'Autre', color: '#4b5563' }
        ];

        const sportTypes = [
            { id: 'dressage', label: 'Dressage', color: '#1e40af' }, // Blue 800
            { id: 'saut', label: 'Saut d\'obstacles', color: '#b91c1c' }, // Red 700
            { id: 'tap', label: 'Travail à pied (TAP)', color: '#15803d' }, // Green 700
            { id: 'longe', label: 'Longe', color: '#0f766e' }, // Teal 700
            { id: 'marcheur', label: 'Marcheur', color: '#7e22ce' }, // Purple 700
            { id: 'training', label: 'Training', color: '#4f46e5' } // Indigo 600
        ];

        // Core Types (Always present or added at end)
        const coreTypes = [
            { id: 'stable', label: 'Box', color: '#f59e0b' },
            { id: 'care', label: 'Soins', color: '#0891b2' },
            { id: 'other', label: 'Autre', color: '#6b7280' }
        ];

        // Check User Configuration & Aggregate
        const activities = JSON.parse(localStorage.getItem('userActivities') || '[]');
        let finalTypes = [];

        // If no specific activity selected (or legacy), use Sport+Core as default
        if (activities.length === 0) {
            finalTypes = [...sportTypes, ...coreTypes];
        } else {
            if (activities.includes("Chevaux de sport")) finalTypes.push(...sportTypes);
            if (activities.includes("Chevaux de course (Trotteurs)")) finalTypes.push(...trottingTypes);
            if (activities.includes("Chevaux de course (Galoppeurs)")) finalTypes.push(...gallopTypes);
            if (activities.includes("Chevaux d'endurance")) finalTypes.push(...enduranceTypes);

            // Always add Core if not present (though they are in profile lists usually)
            // To be safe, we add core independently and dedup.
            finalTypes.push(...coreTypes);
        }

        // Deduplicate by ID
        const uniqueTypes = Array.from(new Map(finalTypes.map(item => [item.id, item])).values());

        // If saved data exists AND matches our generated structure? 
        // Actually, if user *changes* profile, we want to update.
        // We will return the computed uniqueTypes primarily. 
        // Validating against saved data is tricky if we want dynamic updates.
        // Let's trust the computed list based on current profile.
        return uniqueTypes;
    });

    const isGalop = () => {
        const activities = JSON.parse(localStorage.getItem('userActivities') || '[]');
        // Enable Multi-Select UI for Racing/Performance profiles generally?
        // User asked for "Sélectionner plusieurs" specifically for Galop in step 861.
        // But maybe Trot also benefits? 
        // For now, keep it triggered by Galop, OR if multiple profiles are active.
        return activities.includes("Chevaux de course (Galoppeurs)") || activities.includes("Chevaux de course (Trotteurs)") || activities.includes("Chevaux d'endurance");
    };

    useEffect(() => {
        localStorage.setItem('appHorse_activityTypes', JSON.stringify(activityTypes));
    }, [activityTypes]);

    const handleAddType = () => {
        const name = prompt(t('calendar_page.form.add_category_prompt'));
        if (!name) return;
        const id = name.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (activityTypes.find(t => t.id === id)) {
            alert(t('calendar_page.form.category_exists'));
            return;
        }
        // Random color
        const color = '#' + Math.floor(Math.random() * 16777215).toString(16);
        setActivityTypes([...activityTypes, { id, label: name, color }]);
        setNewEvent({ ...newEvent, type: id });
    };

    const handleDeleteType = () => {
        if (newEvent.type === 'other' || newEvent.type === 'care') {
            alert(t('calendar_page.form.cannot_delete_system'));
            return;
        }
        const typeLabel = activityTypes.find(t => t.id === newEvent.type)?.label;
        if (window.confirm(t('calendar_page.form.delete_category_confirm', { name: typeLabel }))) {
            setActivityTypes(activityTypes.filter(t => t.id !== newEvent.type));
            setNewEvent({ ...newEvent, type: 'other' });
        }
    };

    // Helpers defined inside component to access state
    const getTypeName = (typeId, typesArray = []) => {
        if (typeId === 'care') return t('activity_types.care');

        // Handle Multiple Types
        if (typesArray && typesArray.length > 0) {
            return typesArray.map(tId => {
                const trKey = `activity_types.${tId}`;
                if (i18n.exists(trKey)) return t(trKey);

                const tObj = activityTypes.find(type => type.id === tId);
                return tObj ? tObj.label : tId;
            }).join(' + ');
        }

        const trKey = `activity_types.${typeId}`;
        if (i18n.exists(trKey)) return t(trKey);

        const type = activityTypes.find(t => t.id === typeId);
        return type ? type.label : t('calendar_page.form.activity');
    };

    const getDefaultTitle = (evt) => {
        try {
            if (evt.type === 'stable') return t('activity_types.stable');
            const found = horsesList.find(h => String(h.id) === String(evt.horseId));
            const horseName = found ? found.name : t('calendar_page.form.horse');
            // Safe access to getTypeName
            const typeName = getTypeName(evt.type, evt.types) || t('calendar_page.form.activity');
            return `${typeName} - ${horseName}`;
        } catch (e) {
            console.error("Title gen error:", e);
            return t('calendar_page.form.title');
        }
    };

    const loadAllEvents = () => {
        let careEvents = [];
        let customEvents = [];
        let aiPlanningEvents = [];

        try {
            // 1. Get Care Items (Read-only source)
            const savedCare = localStorage.getItem('appHorse_careItems_v3');
            if (savedCare) {
                careEvents = JSON.parse(savedCare).map(item => ({
                    id: `care-${item.id}`,
                    title: `${item.name} (${item.horse})`,
                    date: new Date(item.date),
                    type: 'care',
                    color: (() => {
                        switch (item.type) {
                            case 'vaccins': return '#3b82f6'; // Bleu
                            case 'vermifuges': return '#22c55e'; // Vert
                            case 'marechal': return '#f59e0b'; // Orange
                            case 'osteo': return '#a855f7'; // Violet
                            default: return '#0891b2'; // Cyan par défaut
                        }
                    })(),
                    details: item.type,
                    horseId: item.horseId
                }));
            }
        } catch (e) { console.error("Error loading care items", e); }

        try {
            // 2. Get Custom Calendar Events
            const savedCustom = localStorage.getItem('appHorse_customEvents');
            if (savedCustom) {
                customEvents = JSON.parse(savedCustom)
                    .filter(evt => !evt.completed) // Filter out completed tasks
                    .map(evt => ({
                        ...evt,
                        date: new Date(evt.dateStr)
                    }));
            }
        } catch (e) { console.error("Error loading custom events", e); }

        try {
            // 3. Get AI Training Plans
            const savedAIPlans = localStorage.getItem('ai_training_plans');
            if (savedAIPlans) {
                const plans = JSON.parse(savedAIPlans);

                plans.forEach((planData, planIndex) => {
                    const plan = planData.plan;
                    if (plan && plan.weeklySchedule) {
                        // Convertir chaque session du planning en événement
                        plan.weeklySchedule.forEach((session, sessionIndex) => {
                            if (session.day && session.sessionName) {
                                // Calculer la date basée sur le jour de la semaine
                                const today = new Date();
                                const dayOfWeek = getDayOfWeekNumber(session.day);
                                const targetDate = getNextDateForDay(today, dayOfWeek);

                                aiPlanningEvents.push({
                                    id: `ai-plan-${planIndex}-${sessionIndex}`,
                                    title: `🤖 ${session.sessionName}`,
                                    date: targetDate,
                                    type: 'training',
                                    color: '#8b5cf6', // Violet pour l'IA
                                    details: `${session.intensity} • ${session.duration}`,
                                    description: session.tips || '',
                                    horseName: planData.horseName || 'Planning IA'
                                });
                            }
                        });
                    }
                });
            }
        } catch (e) { console.error("Error loading AI training plans", e); }

        let allEvents = [...careEvents, ...customEvents, ...aiPlanningEvents];

        // Filter for External Users (Vets, Farriers, etc.)
        if (isExternalUser()) {
            const role = (localStorage.getItem('user_role') || '').toLowerCase();
            // Normalize to handle accents (e.g. Vétérinaire -> veterinaire)
            const nRole = role.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

            allEvents = allEvents.filter(evt => {
                const txt = (evt.details + ' ' + evt.title).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

                // 2. Role Specific Filtering
                if (nRole.includes('marechal') || nRole.includes('farrier')) {
                    return txt.includes('ferrure') || txt.includes('shoeing') || txt.includes('parage') || txt.includes('trim') || txt.includes('pied') || txt.includes('foot') || txt.includes('fer') || txt.includes('shoe');
                }
                if (nRole.includes('veterinaire') || nRole.includes('vet') || nRole.includes('veterinarian')) {
                    const keywords = ['vaccin', 'vaccine', 'vermifuge', 'wormer', 'soin', 'care', 'visite', 'visit', 'echo', 'gyneco', 'saillie', 'breeding', 'naissance', 'birth', 'foaling', 'gestation', 'maladie', 'disease', 'blessure', 'injury', 'urgence', 'emergency', 'carnet', 'record'];
                    return keywords.some(k => txt.includes(k));
                }

                // Fallback for Dentiste/Osteo: Match the role name itself in the event type/details
                // e.g. "Dentiste" role sees "Passage Dentiste"
                return txt.includes(nRole);
            });
        }

        setEvents(allEvents);
    };

    // Helper functions for AI planning dates
    const getDayOfWeekNumber = (dayName) => {
        const days = {
            'lundi': 1, 'monday': 1,
            'mardi': 2, 'tuesday': 2,
            'mercredi': 3, 'wednesday': 3,
            'jeudi': 4, 'thursday': 4,
            'vendredi': 5, 'friday': 5,
            'samedi': 6, 'saturday': 6,
            'dimanche': 0, 'sunday': 0
        };
        return days[dayName.toLowerCase()] || 0;
    };

    const getNextDateForDay = (startDate, targetDay) => {
        const date = new Date(startDate);
        const currentDay = date.getDay();
        let daysToAdd = targetDay - currentDay;
        if (daysToAdd < 0) daysToAdd += 7;
        date.setDate(date.getDate() + daysToAdd);
        return date;
    };

    useEffect(() => {
        loadAllEvents();
    }, []);

    // Event Validation (Complete)
    const handleValidateEvent = (id) => {
        setValidateId(id);
    };

    const performValidate = () => {
        if (!validateId) return;

        try {
            const existing = JSON.parse(localStorage.getItem('appHorse_customEvents') || '[]');
            const updated = existing.map(e => String(e.id) === String(validateId) ? { ...e, completed: true } : e);
            localStorage.setItem('appHorse_customEvents', JSON.stringify(updated));

            // Sync Cloud
            if (currentUser) {
                const localCare = JSON.parse(localStorage.getItem('appHorse_careItems_v3') || '[]');
                syncCalendarToFirestore(currentUser.uid, updated, localCare);
            }

            // UI Refresh
            loadAllEvents();
            setValidateId(null);
            setSelectedEvent(null);
        } catch (e) {
            console.error(e);
            alert("Erreur: " + e.message);
        }
    };

    // Save Custom Event
    const handleSaveEvent = (e) => {
        if (e) e.preventDefault();
        // Removed Debug Alert

        console.log("Saving Event...", newEvent);

        try {
            if (!newEvent.date || !newEvent.time) {
                alert(t('calendar_page.form.select_date_time'));
                return;
            }

            // Construct date object
            const fullDate = new Date(`${newEvent.date}T${newEvent.time}`);
            if (isNaN(fullDate.getTime())) {
                alert(t('calendar_page.form.invalid_date'));
                return;
            }

            // Default safe type if missing
            const safeType = newEvent.type || 'other';

            // Generate title safely
            let safeTitle = newEvent.title;
            if (!safeTitle) {
                safeTitle = getDefaultTitle({
                    ...newEvent,
                    type: safeType,
                    types: newEvent.types || []
                });
            }

            const eventToSave = {
                id: Date.now(),
                title: safeTitle,
                dateStr: fullDate.toISOString(), // Save as string for JSON
                type: safeType,
                types: newEvent.types || [],
                color: getTypeColor(safeType) || '#6b7280',
                horseId: newEvent.horseId || '',
                rider: newEvent.rider || 'Moi',
                details: safeType === 'stable' ? t('activity_types.stable') : `${t('calendar_page.form.rider')}: ${newEvent.rider || 'Moi'}`
            };

            console.log("Event Object Constructed:", eventToSave);

            // Load existing
            let existing = [];
            try {
                existing = JSON.parse(localStorage.getItem('appHorse_customEvents') || '[]');
            } catch (err) { existing = []; }

            // Check for potential duplicates (same title, start time, and horse)
            // We relax the check slightly to avoid blocking legit edits if logic changes, but strict on ID or exact content
            const isDuplicate = existing.some(evt =>
                evt.dateStr === eventToSave.dateStr &&
                evt.horseId === eventToSave.horseId &&
                evt.title === eventToSave.title
            );

            if (isDuplicate) {
                if (!window.confirm(t('calendar_page.form.duplicate_confirm'))) {
                    return;
                }
            }

            const updated = [...existing, eventToSave];
            localStorage.setItem('appHorse_customEvents', JSON.stringify(updated));

            // Sync Cloud
            if (currentUser) {
                const localCare = JSON.parse(localStorage.getItem('appHorse_careItems_v3') || '[]');
                syncCalendarToFirestore(currentUser.uid, updated, localCare);
            }

            // Reload view
            loadAllEvents();
            setShowModal(false);

            alert(t('calendar_page.form.save_success'));

            // Reset form but keep date context
            setNewEvent(prev => ({
                ...prev,
                title: '',
                horseId: '',
                rider: ''
            }));

        } catch (error) {
            console.error("Erreur lors de la sauvegarde :", error);
            alert(t('calendar_page.form.error_saving', { error: error.message }));
        }
    };


    const handleDeleteEvent = (id) => {
        setDeleteId(id);
    };

    const performDelete = () => {
        if (!deleteId) return;

        try {
            const existing = JSON.parse(localStorage.getItem('appHorse_customEvents') || '[]');
            const updated = existing.filter(e => String(e.id) !== String(deleteId));
            localStorage.setItem('appHorse_customEvents', JSON.stringify(updated));

            // Sync Cloud
            if (currentUser) {
                const localCare = JSON.parse(localStorage.getItem('appHorse_careItems_v3') || '[]');
                syncCalendarToFirestore(currentUser.uid, updated, localCare);
            }

            // Update UI without reload
            loadAllEvents();
            setDeleteId(null);
            setSelectedEvent(null);

        } catch (e) {
            console.error(e);
            alert("Erreur technique: " + e.message);
        }
    };

    // Event Details State
    const [selectedEvent, setSelectedEvent] = useState(null);

    // Navigation Logic
    const next = () => {
        const newDate = new Date(currentDate);
        if (view === 'month') newDate.setMonth(newDate.getMonth() + 1);
        else if (view === 'week') newDate.setDate(newDate.getDate() + 7);
        else newDate.setDate(newDate.getDate() + 1);
        setCurrentDate(newDate);
    };

    const prev = () => {
        const newDate = new Date(currentDate);
        if (view === 'month') newDate.setMonth(newDate.getMonth() - 1);
        else if (view === 'week') newDate.setDate(newDate.getDate() - 7);
        else newDate.setDate(newDate.getDate() - 1);
        setCurrentDate(newDate);
    };

    const isToday = (d) => {
        const today = new Date();
        return d.getDate() === today.getDate() &&
            d.getMonth() === today.getMonth() &&
            d.getFullYear() === today.getFullYear();
    };

    // Helper: Get Start/End of periods
    const getStartOfWeek = (d) => {
        const date = new Date(d);
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
        return new Date(date.setDate(diff));
    };

    const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();

    const getTypeColor = (typeId) => {
        if (typeId === 'care') return '#0891b2';
        const type = activityTypes.find(t => t.id === typeId);
        return type ? type.color : '#6b7280';
    };

    // RENDERERS
    const renderMonth = () => {
        const daysInMonth = getDaysInMonth(currentDate.getMonth(), currentDate.getFullYear());
        const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay(); // 0-6
        const offset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // Mon start

        const blanks = Array(offset).fill(null);
        const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

        const allSlots = [...blanks, ...days];

        const weekDays = [
            t('calendar_page.days.mon'), t('calendar_page.days.tue'), t('calendar_page.days.wed'),
            t('calendar_page.days.thu'), t('calendar_page.days.fri'), t('calendar_page.days.sat'),
            t('calendar_page.days.sun')
        ];

        return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
                {weekDays.map(d => (
                    <div key={d} style={{ textAlign: 'center', fontWeight: 600, padding: '0.5rem', opacity: 0.7 }}>{d}</div>
                ))}

                {allSlots.map((day, idx) => {
                    if (!day) return <div key={idx} />;

                    const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                    const dayEvents = events.filter(e =>
                        e.date.getDate() === day &&
                        e.date.getMonth() === currentDate.getMonth() &&
                        e.date.getFullYear() === currentDate.getFullYear()
                    );

                    return (
                        <div key={idx} style={{
                            background: 'rgba(255,255,255,0.5)',
                            borderRadius: '12px',
                            minHeight: '100px',
                            padding: '0.5rem',
                            border: isToday(dayDate) ? '2px solid var(--color-primary)' : '1px solid transparent',
                            cursor: 'pointer',
                            display: 'flex', flexDirection: 'column', gap: '4px'
                        }}
                            onClick={() => { setCurrentDate(dayDate); setView('day'); }}
                        >
                            <div style={{ fontWeight: 600, color: '#333', marginBottom: '4px' }}>{day}</div>
                            {dayEvents.slice(0, 3).map((e, i) => (
                                <div key={i}
                                    onClick={(event) => { event.stopPropagation(); setSelectedEvent(e); }}
                                    style={{
                                        fontSize: '0.7rem',
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        background: e.color + '33', // 20% opacity
                                        color: e.color,
                                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                                    }}>
                                    {e.title}
                                </div>
                            ))}
                            {dayEvents.length > 3 && <div style={{ fontSize: '0.7rem', color: '#666' }}>+{dayEvents.length - 3} {t('calendar_page.event_details.others')}</div>}
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderWeek = () => {
        const start = getStartOfWeek(currentDate);

        return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', height: '100%' }}>
                {Array.from({ length: 7 }).map((_, i) => {
                    const d = new Date(start);
                    d.setDate(d.getDate() + i);
                    const dayEvents = events.filter(e =>
                        e.date.getDate() === d.getDate() &&
                        e.date.getMonth() === d.getMonth() &&
                        e.date.getFullYear() === d.getFullYear()
                    );

                    return (
                        <div key={i} style={{
                            background: 'rgba(255,255,255,0.5)',
                            borderRadius: '12px',
                            padding: '0.5rem',
                            minHeight: '400px',
                            border: isToday(d) ? '2px solid var(--color-primary)' : '1px solid transparent',
                            cursor: 'pointer'
                        }} onClick={() => { setCurrentDate(d); setView('day'); }}>
                            <div style={{ textAlign: 'center', marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
                                <div style={{ fontSize: '0.9rem', color: '#666' }}>{d.toLocaleDateString(i18n.language, { weekday: 'short' })}</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{d.getDate()}</div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {dayEvents.map((e, idx) => (
                                    <div key={idx}
                                        onClick={(event) => { event.stopPropagation(); setSelectedEvent(e); }}
                                        style={{
                                            padding: '0.5rem',
                                            borderRadius: '8px',
                                            background: e.color,
                                            color: 'white',
                                            fontSize: '0.8rem',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                        }}>
                                        <div style={{ fontWeight: 600 }}>{e.title}</div>
                                        <div style={{ opacity: 0.9 }}>{e.date.getHours() ? `${e.date.getHours()}h00` : 'Journée'}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderDay = () => {
        const dayEvents = events.filter(e =>
            e.date.getDate() === currentDate.getDate() &&
            e.date.getMonth() === currentDate.getMonth() &&
            e.date.getFullYear() === currentDate.getFullYear()
        );

        dayEvents.sort((a, b) => {
            const hA = a.date.getHours() || 0;
            const hB = b.date.getHours() || 0;
            return hA - hB;
        });

        return (
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr)', gap: '1rem' }}>
                <div style={{ padding: '0 1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ margin: 0, color: '#666' }}>{t('calendar_page.planning_of', { date: currentDate.toLocaleDateString(i18n.language, { weekday: 'long', day: 'numeric', month: 'long' }) })}</h3>
                    </div>

                    {dayEvents.length > 0 ? dayEvents.map((e, i) => (
                        <div key={i}
                            onClick={() => setSelectedEvent(e)}
                            style={{
                                display: 'flex',
                                gap: '1rem',
                                marginBottom: '1rem',
                                padding: '1rem',
                                background: 'white',
                                borderRadius: '12px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                                borderLeft: `5px solid ${e.color}`,
                                position: 'relative',
                                cursor: 'pointer'
                            }}>
                            <div style={{ fontWeight: 700, minWidth: '60px', color: '#888' }}>
                                {e.date.getHours() !== 0 ? `${e.date.getHours()}h${String(e.date.getMinutes()).padStart(2, '0')}` : 'Journée'}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{e.title}</div>
                                <div style={{ color: '#666', fontSize: '0.9rem', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    {e.type === 'care' ? <Activity size={14} /> : (e.type === 'stable' ? <Box size={14} /> : <User size={14} />)}
                                    {getTypeName(e.type, e.types)} {e.details && `- ${e.details}`}
                                </div>
                            </div>
                            {!String(e.id).startsWith('care-') && (
                                <button
                                    type="button"
                                    onClick={(ev) => { ev.stopPropagation(); handleDeleteEvent(e.id); }}
                                    style={{ border: 'none', background: 'transparent', color: '#ff4d4f', cursor: 'pointer', opacity: 0.5 }}
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    )) : (
                        <div style={{ textAlign: 'center', padding: '3rem', color: '#999', background: 'rgba(255,255,255,0.5)', borderRadius: '12px' }}>
                            <Clock size={40} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                            <p>{t('calendar_page.no_events')}</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="animate-fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>


            {/* Header / Navigation */}
            {/* Header / Navigation */}
            {/* Header / Navigation */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                <h1 style={{ margin: 0, fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CalIcon size={28} className="text-primary" />
                    {t('calendar_page.title')}
                </h1>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {view === 'day' && (
                        <Button variant="secondary" onClick={() => setView('month')} title={t('calendar_page.back_to_month')}>
                            <ArrowLeft size={20} />
                        </Button>
                    )}
                    <h2 style={{ margin: 0, textTransform: 'capitalize' }}>
                        {currentDate.toLocaleDateString(i18n.language, { month: 'long', year: 'numeric' })}
                    </h2>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: '8px', padding: '2px' }}>
                        {['month', 'week', 'day'].map(v => (
                            <button
                                key={v}
                                onClick={() => setView(v)}
                                style={{
                                    padding: '0.5rem 1rem',
                                    borderRadius: '8px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    background: view === v ? 'white' : 'transparent',
                                    color: view === v ? 'var(--color-primary)' : '#666',
                                    fontWeight: view === v ? 600 : 400,
                                    boxShadow: view === v ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {t(`calendar_page.views.${v}`)}
                            </button>
                        ))}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Button variant="secondary" onClick={prev}><ChevronLeft size={20} /></Button>
                        <Button variant="secondary" onClick={() => setCurrentDate(new Date())}>{t('calendar_page.today')}</Button>
                        <Button variant="secondary" onClick={next}><ChevronRight size={20} /></Button>

                        {!isExternalUser() && (
                            <Button onClick={() => {
                                const d = new Date(currentDate);
                                const localDate = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
                                setNewEvent({ ...newEvent, date: localDate });
                                setShowModal(true);
                            }}>
                                <Plus size={18} />
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Content Body */}
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
                {view === 'month' && renderMonth()}
                {view === 'week' && renderWeek()}
                {view === 'day' && renderDay()}
            </div>

            {/* Add Event Modal */}
            {showModal && createPortal(
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', zIndex: 9999,
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
                    paddingTop: '5vh'
                }}>
                    <Card style={{ width: '90%', maxWidth: '400px' }}>
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>{t('calendar_page.form.title')}</h3>

                        <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>


                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>{t('calendar_page.form.activity')}</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    {isGalop() ? (
                                        <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                            {activityTypes.map(type => {
                                                if (type.id === 'care') return null; // Skip care
                                                const isSelected = (newEvent.types || []).includes(type.id) || newEvent.type === type.id;
                                                const label = i18n.exists(`activity_types.${type.id}`) ? t(`activity_types.${type.id}`) : type.label;
                                                return (
                                                    <div
                                                        key={type.id}
                                                        onClick={() => {
                                                            let current = newEvent.types || [];
                                                            if (current.includes(type.id)) current = current.filter(x => x !== type.id);
                                                            else current = [...current, type.id];

                                                            // Update both simple type (primary) and types array
                                                            setNewEvent({ ...newEvent, types: current, type: current[0] || '' });
                                                        }}
                                                        style={{
                                                            padding: '0.5rem 0.8rem',
                                                            borderRadius: '20px',
                                                            background: isSelected ? type.color : '#f3f4f6',
                                                            color: isSelected ? 'white' : '#374151',
                                                            cursor: 'pointer',
                                                            fontSize: '0.85rem',
                                                            border: isSelected ? `1px solid ${type.color}` : '1px solid #e5e7eb',
                                                            transition: 'all 0.2s'
                                                        }}
                                                    >
                                                        {label}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <select
                                            required
                                            style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', color: '#333', backgroundColor: '#fff' }}
                                            value={newEvent.type}
                                            onChange={e => setNewEvent({ ...newEvent, type: e.target.value })}
                                        >
                                            {activityTypes.map(type => (
                                                <option key={type.id} value={type.id}>
                                                    {i18n.exists(`activity_types.${type.id}`) ? t(`activity_types.${type.id}`) : type.label}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                    <Button variant="secondary" onClick={handleAddType} type="button" title={t('calendar_page.form.manage_categories.add_tooltip')}>
                                        <Plus size={18} />
                                    </Button>
                                    <Button variant="danger" onClick={handleDeleteType} type="button" title={t('calendar_page.form.manage_categories.delete_tooltip')} style={{ padding: '0.5rem' }}>
                                        <Trash2 size={18} color="#ef4444" />
                                    </Button>
                                </div>
                            </div>

                            {newEvent.type !== 'stable' && newEvent.type !== 'other' && (
                                <>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>{t('calendar_page.form.horse')}</label>
                                        <select
                                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', color: '#333', backgroundColor: '#fff' }}
                                            value={newEvent.horseId}
                                            onChange={e => setNewEvent({ ...newEvent, horseId: e.target.value })}
                                        >
                                            <option value="">-- {t('calendar_page.form.horse')} --</option>
                                            {horsesList.map(h => (
                                                <option key={h.id} value={h.id}>{h.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>{t('calendar_page.form.rider')}</label>
                                        <select
                                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', color: '#333', backgroundColor: '#fff' }}
                                            value={newEvent.rider}
                                            onChange={e => setNewEvent({ ...newEvent, rider: e.target.value })}
                                        >
                                            <option value="Moi">{t('settings_page.account.title')} (Moi)</option>
                                            {teamList.map((member, i) => (
                                                <option key={i} value={member.name}>{member.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </>
                            )}

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>{t('calendar_page.form.date')}</label>
                                    <input
                                        type="date"
                                        required
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', color: '#333', backgroundColor: '#fff' }}
                                        value={newEvent.date}
                                        onChange={e => setNewEvent({ ...newEvent, date: e.target.value })}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>{t('calendar_page.form.time')}</label>
                                    <input
                                        type="time"
                                        required
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', color: '#333', backgroundColor: '#fff' }}
                                        value={newEvent.time}
                                        onChange={e => setNewEvent({ ...newEvent, time: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                                <Button variant="secondary" onClick={() => setShowModal(false)} type="button">
                                    {t('calendar_page.form.cancel')}
                                </Button>
                                <Button onClick={handleSaveEvent} type="button">
                                    {t('calendar_page.form.save')}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>,
                document.body
            )}

            {/* Event Details Modal */}
            {selectedEvent && createPortal(
                <div
                    style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.5)', zIndex: 9999,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '1rem'
                    }}
                    onClick={() => setSelectedEvent(null)}
                >
                    <Card
                        style={{
                            padding: '2rem',
                            maxWidth: '500px',
                            width: '100%',
                            maxHeight: '80vh',
                            overflowY: 'auto'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header avec couleur de l'événement */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            marginBottom: '1.5rem',
                            paddingBottom: '1rem',
                            borderBottom: `3px solid ${selectedEvent.color}`
                        }}>
                            <div style={{
                                width: '50px',
                                height: '50px',
                                borderRadius: '12px',
                                background: selectedEvent.color + '20',
                                color: selectedEvent.color,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                {selectedEvent.type === 'care' ? (
                                    <Activity size={24} />
                                ) : selectedEvent.type === 'stable' ? (
                                    <Box size={24} />
                                ) : (
                                    <User size={24} />
                                )}
                            </div>
                            <div style={{ flex: 1 }}>
                                <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>{selectedEvent.title}</h3>
                                <div style={{ color: '#666', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                                    {getTypeName(selectedEvent.type, selectedEvent.types)}
                                </div>
                            </div>
                        </div>

                        {/* Détails */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                            {/* Date et heure */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '10px',
                                    background: '#f3f4f6',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <Clock size={20} color="#666" />
                                </div>
                                <div>
                                    <div style={{ fontWeight: 600, color: '#333' }}>
                                        {selectedEvent.date.toLocaleDateString(i18n.language, {
                                            weekday: 'long',
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric'
                                        })}
                                    </div>
                                    <div style={{ fontSize: '0.9rem', color: '#666' }}>
                                        {selectedEvent.date.getHours() !== 0
                                            ? `${selectedEvent.date.getHours()}h${String(selectedEvent.date.getMinutes()).padStart(2, '0')}`
                                            : t('calendar_page.planning_of', { date: 'Journée' })}
                                    </div>
                                </div>
                            </div>

                            {/* Détails supplémentaires */}
                            {selectedEvent.details && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '10px',
                                        background: '#f3f4f6',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <Activity size={20} color="#666" />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '0.85rem', color: '#999', textTransform: 'uppercase', marginBottom: '2px' }}>
                                            Détails
                                        </div>
                                        <div style={{ color: '#333' }}>{selectedEvent.details}</div>
                                    </div>
                                </div>
                            )}

                            {/* Cheval */}
                            {(selectedEvent.horseId || selectedEvent.horseName) && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '10px',
                                        background: '#f3f4f6',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        🐴
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '0.85rem', color: '#999', textTransform: 'uppercase', marginBottom: '2px' }}>
                                            {t('calendar_page.form.horse')}
                                        </div>
                                        <div style={{ color: '#333', fontWeight: 500 }}>
                                            {selectedEvent.horseName || horsesList.find(h => String(h.id) === String(selectedEvent.horseId))?.name || 'Inconnu'}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Conseils IA */}
                            {selectedEvent.description && (
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '10px',
                                        background: '#f3f4f6',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        💡
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '0.85rem', color: '#999', textTransform: 'uppercase', marginBottom: '2px' }}>
                                            Conseils
                                        </div>
                                        <div style={{ color: '#333', fontSize: '0.9rem', lineHeight: '1.5' }}>
                                            {selectedEvent.description}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div style={{
                            display: 'flex',
                            gap: '0.75rem',
                            paddingTop: '1rem',
                            borderTop: '1px solid #e5e7eb'
                        }}>
                            {!String(selectedEvent.id).startsWith('care-') && (
                                <>
                                    <Button
                                        variant="danger"
                                        onClick={() => {
                                            handleDeleteEvent(selectedEvent.id);
                                            setSelectedEvent(null);
                                        }}
                                        style={{
                                            flex: 1,
                                            background: '#fee2e2',
                                            color: '#dc2626',
                                            border: 'none'
                                        }}
                                    >
                                        <Trash2 size={16} />
                                        <span style={{ marginLeft: '0.5rem' }}>{t('common.delete')}</span>
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            handleValidateEvent(selectedEvent.id);
                                            setSelectedEvent(null);
                                        }}
                                        style={{ flex: 1 }}
                                    >
                                        <CheckCircle size={16} />
                                        <span style={{ marginLeft: '0.5rem' }}>Valider</span>
                                    </Button>
                                </>
                            )}
                            <Button
                                variant="secondary"
                                onClick={() => setSelectedEvent(null)}
                                style={{ flex: selectedEvent.id?.toString().startsWith('care-') ? 1 : 'auto' }}
                            >
                                {t('common.close')}
                            </Button>
                        </div>
                    </Card>
                </div>,
                document.body
            )}

            {/* Validate Modal */}
            {validateId && createPortal(
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', zIndex: 9999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <Card style={{ padding: '2rem', maxWidth: '400px', textAlign: 'center' }}>
                        <CheckCircle size={48} className="text-primary mb-4" style={{ margin: '0 auto 1rem auto' }} />
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>{t('calendar_page.event_details.validate_confirm')}</h3>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <Button variant="secondary" onClick={() => setValidateId(null)}>{t('calendar_page.form.cancel')}</Button>
                            <Button onClick={performValidate}>{t('calendar_page.form.save')}</Button>
                        </div>
                    </Card>
                </div>,
                document.body
            )}

            {/* Delete Modal */}
            {deleteId && createPortal(
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', zIndex: 9999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <Card style={{ padding: '2rem', maxWidth: '400px', textAlign: 'center' }}>
                        <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
                            <Trash2 size={32} />
                        </div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', color: '#1f2937' }}>{t('calendar_page.delete_confirm_title')}</h3>
                        <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
                            {t('calendar_page.delete_confirm_desc')}
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <Button variant="secondary" onClick={() => setDeleteId(null)}>{t('calendar_page.form.cancel')}</Button>
                            <Button onClick={performDelete} style={{ background: '#ef4444', color: 'white', border: 'none' }}>
                                {t('calendar_page.delete_button')}
                            </Button>
                        </div>
                    </Card>
                </div >,
                document.body
            )}
        </div >
    );
};

export default Calendar;
