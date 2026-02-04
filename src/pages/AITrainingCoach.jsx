import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { Brain, Sparkles, Target, Calendar, TrendingUp, ChevronRight, ChevronLeft, Loader2, Check, AlertCircle, User, GraduationCap } from 'lucide-react';
import { useTrainingAI } from '../hooks/useTrainingAI';
import SEO from '../components/common/SEO';
import { useAuth } from '../context/AuthContext';

export default function AITrainingCoach() {
    const navigate = useNavigate();
    const { generatePlan, loading, error, trainingPlan } = useTrainingAI();
    const { userProfile } = useAuth();

    // État du wizard (1: Cheval, 2: Cavalier, 3: Discipline, 4: Niveau/Freq, 5: Objectifs, 6: Résultat)
    const [step, setStep] = useState(1);
    const [selectedHorse, setSelectedHorse] = useState(null);
    const [riderName, setRiderName] = useState('');
    const [riderLevel, setRiderLevel] = useState('Galop 5-7');
    const [teamMembers, setTeamMembers] = useState([]);
    const [isCustomRider, setIsCustomRider] = useState(false);

    const [formData, setFormData] = useState({
        discipline: '',
        level: '',
        frequency: 3,
        focus: ''
    });

    // Initialiser le nom du cavalier
    useEffect(() => {
        if (userProfile?.displayName) {
            setRiderName(userProfile.displayName);
        }
    }, [userProfile]);

    // Charger les chevaux depuis localStorage
    const [horses, setHorses] = useState([]);

    useEffect(() => {
        // Chargement uniquement des chevaux de l'écurie active
        const stableHorses = JSON.parse(localStorage.getItem('my_horses_v4')) || [];
        setHorses(stableHorses);

        // Chargement de l'équipe
        const savedTeam = JSON.parse(localStorage.getItem('appHorse_team_v2')) || [];
        const riders = savedTeam.filter(m => !m.isExternal);
        setTeamMembers(riders);
    }, []);

    // Disciplines disponibles
    const disciplines = [
        { value: 'CSO', label: 'CSO', icon: '🏇' },
        { value: 'Dressage', label: 'Dressage', icon: '🎭' },
        { value: 'CCE', label: 'CCE', icon: '🏆' },
        { value: 'Complet', label: 'Complet', icon: '⭐' },
        { value: 'Attelage', label: 'Attelage', icon: '🐴' },
        { value: 'PonyGames', label: 'Pony Games', icon: '🎯' },
        { value: 'HorseBall', label: 'Horse Ball', icon: '⚽' },
        { value: 'Endurance', label: 'Endurance', icon: '🏃' },
        { value: 'Galop', label: 'Courses Galop', icon: '🏁' },
        { value: 'Trot', label: 'Courses Trot', icon: '🚜' },
        { value: 'Loisir', label: 'Loisir', icon: '🌄' }
    ];

    // Niveaux CHEVAL disponibles
    const levels = [
        { value: 'Jeune', label: 'Jeune cheval', description: 'Débourrage - 5 ans' },
        { value: 'Intermédiaire', label: 'Intermédiaire', description: '6-10 ans' },
        { value: 'Confirmé', label: 'Confirmé', description: '10+ ans' },
        { value: 'Competition', label: 'Compétition', description: 'Niveau compétition' }
    ];

    // Niveaux CAVALIER disponibles
    const riderLevels = [
        { value: 'Débutant', label: 'Débutant' },
        { value: 'Galop 1-4', label: 'Galop 1 à 4' },
        { value: 'Galop 5-7', label: 'Galop 5 à 7' },
        { value: 'Amateur/Pro', label: 'Amateur / Pro' }
    ];

    // Navigation entre étapes
    const nextStep = () => {
        if (step < 5) setStep(step + 1);
    };

    const prevStep = () => {
        if (step > 1) setStep(step - 1);
    };

    // Validation de l'étape
    const canProceed = () => {
        switch (step) {
            case 1:
                return selectedHorse !== null;
            case 2: // Cavalier
                return riderName.trim() !== '';
            case 3: // Discipline
                return formData.discipline !== '';
            case 4: // Niveau/Freq
                return formData.level !== '';
            case 5: // Objectifs
                return true;
            default:
                return false;
        }
    };

    // Génération du planning
    const handleGenerate = async () => {
        if (!selectedHorse) {
            alert('Veuillez sélectionner un cheval');
            return;
        }

        const params = {
            horse: {
                name: selectedHorse.name,
                age: selectedHorse.age,
                breed: selectedHorse.race,
                estimatedWeight: selectedHorse.estimatedWeight || selectedHorse.weight || 'Non mesuré'
            },
            rider: {
                name: riderName,
                level: riderLevel
            },
            discipline: formData.discipline,
            level: formData.level,
            frequency: formData.frequency,
            focus: formData.focus
        };

        const result = await generatePlan(params);

        if (result.success) {
            setStep(6);
        }
    };

    // Sauvegarder le planning
    const handleSavePlan = () => {
        if (!trainingPlan) return;

        const savedPlans = JSON.parse(localStorage.getItem('ai_training_plans')) || [];
        const newPlan = {
            id: Date.now(),
            horseName: selectedHorse.name,
            horseId: selectedHorse.id,
            riderName: riderName, // Sauvegarde du cavalier
            riderLevel: riderLevel,
            discipline: formData.discipline,
            level: formData.level,
            plan: trainingPlan,
            createdAt: new Date().toISOString()
        };

        savedPlans.push(newPlan);
        localStorage.setItem('ai_training_plans', JSON.stringify(savedPlans));

        alert('✅ Planning sauvegardé !');
        navigate('/calendar');
    };

    return (
        <div className="animate-fade-in">
            <SEO title="AI Training Coach - Equinox" description="Générez un planning d'entraînement personnalisé avec l'IA" />

            {/* Stepper */}
            <Card style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '800px', margin: '0 auto', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                        <React.Fragment key={s}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', minWidth: '60px' }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 600,
                                    fontSize: '0.9rem',
                                    background: step >= s ? 'var(--color-primary)' : '#e5e7eb',
                                    color: step >= s ? 'white' : '#9ca3af',
                                    transition: 'all 0.3s'
                                }}>
                                    {step > s ? <Check size={20} /> : s}
                                </div>
                                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                                    {s === 1 && 'Cheval'}
                                    {s === 2 && 'Cavalier'}
                                    {s === 3 && 'Discipline'}
                                    {s === 4 && 'Niveau'}
                                    {s === 5 && 'Objectif'}
                                </span>
                            </div>
                            {s < 5 && (
                                <div style={{
                                    flex: 1,
                                    height: '2px',
                                    background: step > s ? 'var(--color-primary)' : '#e5e7eb',
                                    margin: '0 0.5rem',
                                    transition: 'all 0.3s',
                                    minWidth: '20px'
                                }} />
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </Card>

            {/* Contenu */}
            <Card>
                {/* ÉTAPE 1 : Sélection du cheval */}
                {step === 1 && (
                    <div>
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <div style={{
                                width: '60px',
                                height: '60px',
                                borderRadius: '50%',
                                background: 'rgba(221, 161, 94, 0.15)',
                                color: 'var(--color-secondary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 1rem auto'
                            }}>
                                <Target size={32} />
                            </div>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-text-main)' }}>
                                Sélectionnez votre cheval
                            </h2>
                            <p style={{ color: 'var(--color-text-muted)' }}>
                                Choisissez le cheval pour lequel générer un planning
                            </p>
                        </div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                            gap: '1.5rem'
                        }}>
                            {horses.length === 0 ? (
                                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem' }}>
                                    <AlertCircle size={48} style={{ color: '#999', marginBottom: '1rem' }} />
                                    <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
                                        Aucun cheval enregistré
                                    </p>
                                    <Button onClick={() => navigate('/horses')}>
                                        Ajouter un cheval
                                    </Button>
                                </div>
                            ) : (
                                horses.map((horse) => (
                                    <Card
                                        key={horse.id}
                                        className="hover-card"
                                        style={{
                                            cursor: 'pointer',
                                            borderLeft: selectedHorse?.id === horse.id ? '4px solid var(--color-primary)' : 'none',
                                            background: selectedHorse?.id === horse.id ? 'rgba(221, 161, 94, 0.05)' : 'transparent'
                                        }}
                                        onClick={() => setSelectedHorse(horse)}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{
                                                width: '50px',
                                                height: '50px',
                                                borderRadius: '50%',
                                                background: 'rgba(221, 161, 94, 0.15)',
                                                color: 'var(--color-secondary)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '1.5rem',
                                                fontWeight: 700
                                            }}>
                                                {horse.name.charAt(0)}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-main)' }}>
                                                    {horse.name}
                                                </h3>
                                                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                                                    {horse.race} • {horse.age || '?'} ans
                                                </p>
                                            </div>
                                            {selectedHorse?.id === horse.id && (
                                                <Check size={24} style={{ color: 'var(--color-primary)' }} />
                                            )}
                                        </div>
                                    </Card>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* ÉTAPE 2 : Sélection du Cavalier (NEW) */}
                {step === 2 && (
                    <div>
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <div style={{
                                width: '60px',
                                height: '60px',
                                borderRadius: '50%',
                                background: 'rgba(221, 161, 94, 0.15)',
                                color: 'var(--color-secondary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 1rem auto'
                            }}>
                                <User size={32} />
                            </div>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-text-main)' }}>
                                Qui est le cavalier ?
                            </h2>
                            <p style={{ color: 'var(--color-text-muted)' }}>
                                L'IA adaptera les conseils au niveau du cavalier
                            </p>
                        </div>

                        <div style={{ maxWidth: '500px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '1rem', color: 'var(--color-text-main)' }}>
                                    Nom du cavalier
                                </label>

                                {!isCustomRider ? (
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <select
                                            value={riderName}
                                            onChange={(e) => {
                                                if (e.target.value === 'CUSTOM') {
                                                    setIsCustomRider(true);
                                                    setRiderName('');
                                                } else {
                                                    setRiderName(e.target.value);
                                                }
                                            }}
                                            style={{
                                                width: '100%',
                                                padding: '1rem',
                                                borderRadius: '12px',
                                                border: '1px solid var(--border-color)',
                                                fontSize: '1.1rem',
                                                background: 'var(--color-bg)',
                                                color: 'var(--color-text-main)',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <option value="">Sélectionner un membre...</option>
                                            {userProfile?.displayName && (
                                                <option value={userProfile.displayName}>{userProfile.displayName} (Moi)</option>
                                            )}
                                            {teamMembers.map(m => (
                                                <option key={m.id} value={m.name}>
                                                    {m.name} ({m.role})
                                                </option>
                                            ))}
                                            <option value="CUSTOM">+ Autre / Invité</option>
                                        </select>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <input
                                            type="text"
                                            value={riderName}
                                            onChange={(e) => setRiderName(e.target.value)}
                                            placeholder="Nom du cavalier invité"
                                            autoFocus
                                            style={{
                                                flex: 1,
                                                padding: '1rem',
                                                borderRadius: '12px',
                                                border: '1px solid var(--border-color)',
                                                fontSize: '1.1rem',
                                                background: 'var(--color-bg)',
                                                color: 'var(--color-text-main)'
                                            }}
                                        />
                                        <Button variant="secondary" onClick={() => setIsCustomRider(false)}>
                                            Liste
                                        </Button>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', fontSize: '1rem', color: 'var(--color-text-main)' }}>
                                    Niveau du cavalier
                                </label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                                    {riderLevels.map((lvl) => (
                                        <div
                                            key={lvl.value}
                                            onClick={() => setRiderLevel(lvl.value)}
                                            style={{
                                                padding: '1rem',
                                                borderRadius: '12px',
                                                border: riderLevel === lvl.value ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                                                background: riderLevel === lvl.value ? 'rgba(221, 161, 94, 0.05)' : 'transparent',
                                                cursor: 'pointer',
                                                textAlign: 'center',
                                                fontWeight: 500,
                                                color: 'var(--color-text-main)',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            {lvl.label}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ÉTAPE 3 : Sélection de la discipline */}
                {step === 3 && (
                    <div>
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <div style={{
                                width: '60px',
                                height: '60px',
                                borderRadius: '50%',
                                background: 'rgba(221, 161, 94, 0.15)',
                                color: 'var(--color-secondary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 1rem auto'
                            }}>
                                <Target size={32} />
                            </div>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-text-main)' }}>
                                Quelle discipline ?
                            </h2>
                            <p style={{ color: 'var(--color-text-muted)' }}>
                                L'IA sélectionnera les exercices adaptés
                            </p>
                        </div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                            gap: '1rem'
                        }}>
                            {disciplines.map((disc) => (
                                <Card
                                    key={disc.value}
                                    className="hover-card"
                                    style={{
                                        cursor: 'pointer',
                                        textAlign: 'center',
                                        padding: '1.5rem 1rem',
                                        borderLeft: formData.discipline === disc.value ? '4px solid var(--color-primary)' : 'none',
                                        background: formData.discipline === disc.value ? 'rgba(221, 161, 94, 0.05)' : 'transparent'
                                    }}
                                    onClick={() => setFormData({ ...formData, discipline: disc.value })}
                                >
                                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{disc.icon}</div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-main)' }}>{disc.label}</div>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* ÉTAPE 4 : Niveau et fréquence */}
                {step === 4 && (
                    <div>
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <div style={{
                                width: '60px',
                                height: '60px',
                                borderRadius: '50%',
                                background: 'rgba(221, 161, 94, 0.15)',
                                color: 'var(--color-secondary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 1rem auto'
                            }}>
                                <TrendingUp size={32} />
                            </div>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-text-main)' }}>
                                Niveau et fréquence
                            </h2>
                        </div>

                        {/* Sélection du niveau */}
                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: '1rem', fontSize: '1rem', color: 'var(--color-text-main)' }}>
                                Niveau du cheval
                            </label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                                {levels.map((lvl) => (
                                    <Card
                                        key={lvl.value}
                                        className="hover-card"
                                        style={{
                                            cursor: 'pointer',
                                            borderLeft: formData.level === lvl.value ? '4px solid var(--color-primary)' : 'none',
                                            background: formData.level === lvl.value ? 'rgba(221, 161, 94, 0.05)' : 'transparent'
                                        }}
                                        onClick={() => setFormData({ ...formData, level: lvl.value })}
                                    >
                                        <div style={{ fontWeight: 600, marginBottom: '0.25rem', color: 'var(--color-text-main)' }}>{lvl.label}</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{lvl.description}</div>
                                    </Card>
                                ))}
                            </div>
                        </div>

                        {/* Fréquence */}
                        <div>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: '1rem', fontSize: '1rem', color: 'var(--color-text-main)' }}>
                                Fréquence : {formData.frequency} séances / semaine
                            </label>
                            <input
                                type="range"
                                min="1"
                                max="7"
                                value={formData.frequency}
                                onChange={(e) => setFormData({ ...formData, frequency: parseInt(e.target.value) })}
                                style={{
                                    width: '100%',
                                    height: '6px',
                                    background: 'var(--color-primary)',
                                    borderRadius: '3px',
                                    outline: 'none',
                                    cursor: 'pointer'
                                }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* ÉTAPE 5 : Objectifs */}
                {step === 5 && (
                    <div>
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <div style={{
                                width: '60px',
                                height: '60px',
                                borderRadius: '50%',
                                background: 'rgba(221, 161, 94, 0.15)',
                                color: 'var(--color-secondary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 1rem auto'
                            }}>
                                <Calendar size={32} />
                            </div>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-text-main)' }}>
                                Objectifs spécifiques
                            </h2>
                            <p style={{ color: 'var(--color-text-muted)' }}>
                                Décrivez vos objectifs pour personnaliser le planning
                            </p>
                        </div>

                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--color-text-main)' }}>
                                Focus (Optionnel)
                            </label>
                            <textarea
                                value={formData.focus}
                                onChange={(e) => setFormData({ ...formData, focus: e.target.value })}
                                placeholder="Ex: Préparer un concours, améliorer le cardio, renforcer le dos..."
                                style={{
                                    width: '100%',
                                    minHeight: '100px',
                                    padding: '0.75rem',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-color)',
                                    fontSize: '0.95rem',
                                    resize: 'vertical',
                                    background: 'var(--color-bg)',
                                    color: 'var(--color-text-main)'
                                }}
                                rows="4"
                            />
                        </div>

                        {/* Résumé */}
                        <Card accent={true} style={{ background: 'rgba(221, 161, 94, 0.05)', marginBottom: '2rem' }}>
                            <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--color-text-main)' }}>📋 Résumé du programme</h3>
                            <div style={{ fontSize: '0.95rem', lineHeight: '1.8', color: 'var(--color-text-main)' }}>
                                <p><strong>Cheval :</strong> {selectedHorse?.name}</p>
                                <p><strong>Cavalier :</strong> {riderName} ({riderLevel})</p>
                                <p><strong>Discipline :</strong> {formData.discipline}</p>
                                <p><strong>Niveau cheval :</strong> {formData.level}</p>
                                <p><strong>Fréquence :</strong> {formData.frequency} séances / semaine</p>
                                {formData.focus && <p><strong>Focus :</strong> {formData.focus}</p>}
                            </div>
                        </Card>

                        <Button
                            onClick={handleGenerate}
                            disabled={loading}
                            style={{ width: '100%', padding: '1rem', fontSize: '1.05rem' }}
                        >
                            {loading ? (
                                <><Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> Génération...</>
                            ) : (
                                <><Sparkles size={20} /> Générer mon planning IA</>
                            )}
                        </Button>

                        {error && (
                            <div style={{ marginTop: '1rem', padding: '1rem', background: '#fee2e2', borderRadius: '8px', color: '#991b1b' }}>
                                ❌ {error}
                            </div>
                        )}
                    </div>
                )}

                {/* ÉTAPE 6 : Résultats */}
                {step === 6 && trainingPlan && (
                    <div>
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <div style={{
                                width: '60px',
                                height: '60px',
                                borderRadius: '50%',
                                background: '#d1fae5',
                                color: '#065f46',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 1rem auto'
                            }}>
                                <Check size={36} />
                            </div>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-text-main)' }}>
                                {trainingPlan.planningTitle}
                            </h2>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '1.05rem' }}>
                                {trainingPlan.objective}
                            </p>
                        </div>

                        {/* Analyse du coach */}
                        {trainingPlan.coachAnalysis && (
                            <Card style={{ background: 'rgba(221, 161, 94, 0.1)', marginBottom: '2rem', borderLeft: '4px solid var(--color-secondary)' }}>
                                <h3 style={{ marginTop: 0, marginBottom: '0.75rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-main)' }}>
                                    <Brain size={20} style={{ color: 'var(--color-secondary)' }} /> Analyse du Directeur de Performance
                                </h3>
                                <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.6', fontStyle: 'italic', color: 'var(--color-text-main)' }}>{trainingPlan.coachAnalysis}</p>
                            </Card>
                        )}

                        {/* Planning hebdomadaire */}
                        <div style={{ marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.3rem', marginBottom: '1.5rem', color: 'var(--color-text-main)' }}>📅 Planning hebdomadaire</h3>

                            {trainingPlan.weeklySchedule && trainingPlan.weeklySchedule.map((session, index) => (
                                <Card key={index} style={{ marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                                        <div style={{ flex: 1 }}>
                                            <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-text-main)' }}>{session.day}</h4>
                                            <p style={{ margin: '0.25rem 0 0 0', color: 'var(--color-secondary)', fontWeight: 600 }}>
                                                {session.sessionName}
                                            </p>
                                            {session.trainingType && (
                                                <span style={{
                                                    display: 'inline-block',
                                                    marginTop: '0.5rem',
                                                    padding: '0.2rem 0.6rem',
                                                    borderRadius: '8px',
                                                    fontSize: '0.7rem',
                                                    fontWeight: 600,
                                                    background: '#e0e7ff',
                                                    color: '#4338ca'
                                                }}>
                                                    {session.trainingType}
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>{session.duration}</div>
                                            <span style={{
                                                display: 'inline-block',
                                                marginTop: '0.25rem',
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '12px',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                background: session.intensity === 'Élevée' ? '#fee2e2' :
                                                    session.intensity === 'Moyenne' ? '#fed7aa' : '#d1fae5',
                                                color: session.intensity === 'Élevée' ? '#991b1b' :
                                                    session.intensity === 'Moyenne' ? '#9a3412' : '#065f46'
                                            }}>
                                                {session.intensity}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Objectif du coach pour cette séance */}
                                    {session.coachObjective && (
                                        <div style={{
                                            marginBottom: '1rem',
                                            padding: '0.75rem',
                                            background: 'rgba(221, 161, 94, 0.08)',
                                            borderRadius: '8px',
                                            fontSize: '0.9rem',
                                            fontWeight: 500
                                        }}>
                                            <strong style={{ color: 'var(--color-secondary)' }}>🎯 Objectif Coach:</strong> <span style={{ color: 'var(--color-text-main)' }}>{session.coachObjective}</span>
                                        </div>
                                    )}

                                    {session.phases && session.phases.map((phase, pi) => (
                                        <div key={pi} style={{ marginBottom: '1rem' }}>
                                            <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: 'var(--color-text-main)' }}>
                                                • {phase.name} ({phase.duration})
                                            </div>
                                            <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                                                {phase.exercises && phase.exercises.map((ex, ei) => (
                                                    <li key={ei} style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
                                                        {ex}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}

                                    {session.tips && (
                                        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                                            💡 {session.tips}
                                        </div>
                                    )}
                                </Card>
                            ))}
                        </div>

                        {/* Conseils supplémentaires */}
                        {trainingPlan.nutritionAdvice && (
                            <Card style={{ background: '#d1fae5', marginBottom: '1rem' }}>
                                <h3 style={{ marginTop: 0, marginBottom: '0.5rem', color: '#065f46' }}>🥕 Conseils nutritionnels</h3>
                                <p style={{ margin: 0, fontSize: '0.95rem', color: '#064e3b' }}>{trainingPlan.nutritionAdvice}</p>
                            </Card>
                        )}

                        {trainingPlan.progressIndicators && (
                            <Card style={{ background: '#dbeafe', marginBottom: '1rem' }}>
                                <h3 style={{ marginTop: 0, marginBottom: '1rem', color: '#1e40af' }}>📊 Indicateurs de progression</h3>
                                <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#1e3a8a' }}>
                                    {trainingPlan.progressIndicators.map((indicator, index) => (
                                        <li key={index} style={{ marginBottom: '0.5rem' }}>{indicator}</li>
                                    ))}
                                </ul>
                            </Card>
                        )}

                        {trainingPlan.warnings && (
                            <Card style={{ background: '#fef3c7', marginBottom: '1rem' }}>
                                <h3 style={{ marginTop: 0, marginBottom: '0.5rem', color: '#92400e' }}>⚠️ Points de vigilance</h3>
                                <p style={{ margin: 0, fontSize: '0.95rem', color: '#78350f' }}>{trainingPlan.warnings}</p>
                            </Card>
                        )}

                        {/* Stratégie d'affûtage */}
                        {trainingPlan.tapering && (
                            <Card style={{ background: '#fce7f3', marginBottom: '2rem' }}>
                                <h3 style={{ marginTop: 0, marginBottom: '0.5rem', color: '#9d174d' }}>🔥 Stratégie d'Affûtage (Tapering)</h3>
                                <p style={{ margin: 0, fontSize: '0.95rem', color: '#831843' }}>{trainingPlan.tapering}</p>
                            </Card>
                        )}

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <Button onClick={handleSavePlan} style={{ flex: 1 }}>
                                💾 Sauvegarder
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={() => {
                                    setStep(1);
                                    setSelectedHorse(null);
                                    setFormData({ discipline: '', level: '', frequency: 3, focus: '' });
                                }}
                                style={{ flex: 1 }}
                            >
                                Nouveau planning
                            </Button>
                        </div>
                    </div>
                )}
            </Card>

            {/* Navigation */}
            {step < 6 && (
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'space-between' }}>
                    {step > 1 ? (
                        <Button variant="secondary" onClick={prevStep}>
                            <ChevronLeft size={18} /> Retour
                        </Button>
                    ) : <div />}

                    {step < 5 && (
                        <Button onClick={nextStep} disabled={!canProceed()}>
                            Continuer <ChevronRight size={18} />
                        </Button>
                    )}
                </div>
            )}

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
