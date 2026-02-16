import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Plus, TrendingUp, TrendingDown, Minus, Edit2, Trash2, Scale } from 'lucide-react';
import { Card, Button } from '../../components/common';
import BarometricCamera from '../../components/camera/BarometricCamera';
import { canEdit, isWhitelistedTester } from '../../utils/permissions';
import { useAuth } from '../../context/AuthContext';
import {
    calculateWeightStats,
    BODY_CONDITION_SCORES,
    getCurrentWeight,
} from '../../utils/weightEstimation';
import { scheduleSyncToFirestore } from '../../services/firestoreSync';

function WeightTracking() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [horse, setHorse] = useState(null);
    const { currentUser } = useAuth();
    const [weightEntries, setWeightEntries] = useState([]);
    const [showBarymetricCamera, setShowBarymetricCamera] = useState(false);
    const [showManualModal, setShowManualModal] = useState(false);
    const [showDevInfo, setShowDevInfo] = useState(false);
    const [editingEntry, setEditingEntry] = useState(null);

    const [manualForm, setManualForm] = useState({
        date: new Date().toISOString().split('T')[0],
        value: '',
        bodyConditionScore: 3,
    });

    // Permissions
    const canEditWeight = canEdit();

    // Chargement des données
    useEffect(() => {
        loadHorseData();
        loadWeightHistory();

        // Listen for cloud sync completion
        const handleRefresh = () => {
            console.log("🔄 WeightTracking: Cloud data refreshed, reloading...");
            loadHorseData();
            loadWeightHistory();
        };

        window.addEventListener('equinox_data_refreshed', handleRefresh);
        return () => window.removeEventListener('equinox_data_refreshed', handleRefresh);
    }, [id]);

    const loadHorseData = () => {
        // Charger depuis localStorage (à remplacer par Firestore)
        const horses = JSON.parse(localStorage.getItem('my_horses_v4') || '[]');
        const currentHorse = horses.find(h => h.id.toString() === id.toString());

        if (currentHorse) {
            setHorse(currentHorse);
        } else {
            // Fallback: créer un objet cheval minimal si non trouvé
            setHorse({
                id,
                name: 'Cheval',
                breed: '',
            });
        }
    };

    const loadWeightHistory = () => {
        // Charger depuis localStorage (à remplacer par Firestore)
        const key = `weightHistory_${id}`;
        const history = JSON.parse(localStorage.getItem(key) || '[]');
        setWeightEntries(history);
    };

    const updateHorseMainWeight = (newWeight) => {
        const idStr = id.toString();

        // 1. Update in Main Stable
        const savedHorses = JSON.parse(localStorage.getItem('my_horses_v4') || '[]');
        const horseIndex = savedHorses.findIndex(h => h.id.toString() === idStr);
        if (horseIndex > -1) {
            savedHorses[horseIndex].weight = newWeight;
            localStorage.setItem('my_horses_v4', JSON.stringify(savedHorses));
        }

        // 2. Update in Breeding if applicable
        const savedMares = JSON.parse(localStorage.getItem('appHorse_breeding_v2') || '[]');
        const mareIndex = savedMares.findIndex(m => m.id.toString() === idStr);
        if (mareIndex > -1) {
            savedMares[mareIndex].weight = newWeight;
            localStorage.setItem('appHorse_breeding_v2', JSON.stringify(savedMares));
        }

        // 3. Schedule Sync
        if (currentUser?.uid) {
            scheduleSyncToFirestore(currentUser.uid);
        }
    };

    const _updateWeightEntriesAndPersist = (updated) => {
        setWeightEntries(updated);
        localStorage.setItem(`weightHistory_${id}`, JSON.stringify(updated));

        // Update horse's main weight if this is the new most recent
        const sorted = [...updated].sort((a, b) => new Date(b.date) - new Date(a.date));
        const newWeight = sorted.length > 0 ? sorted[0].value : '-';
        updateHorseMainWeight(newWeight);
    };

    const saveWeightEntry = (entry) => {
        const newEntry = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            ...entry,
        };
        _updateWeightEntriesAndPersist([newEntry, ...weightEntries]);
    };

    const updateWeightEntry = (entryId, updates) => {
        const updated = weightEntries.map(e =>
            e.id === entryId ? { ...e, ...updates } : e
        );
        _updateWeightEntriesAndPersist(updated);
    };

    const deleteWeightEntry = (entryId) => {
        if (!confirm('Supprimer cette pesée ?')) return;
        const updated = weightEntries.filter(e => e.id !== entryId);
        _updateWeightEntriesAndPersist(updated);
    };

    const handleOpenBarymetricCamera = () => {
        // Restriction d'accès à la fonctionnalité barymétrique
        if (!isWhitelistedTester(currentUser?.email)) {
            setShowDevInfo(true);
            return;
        }

        if (!horse) return;
        setShowBarymetricCamera(true);
    };

    const handleBarymetricMeasurementComplete = (data) => {
        saveWeightEntry({
            value: data.weight,
            weight: data.weight,
            source: 'BARYMETRIC_AI',
            confidence: data.confidence,
            measurements: data.measurements,
            method: data.method,
            timestamp: data.timestamp,
        });
        setShowBarymetricCamera(false);
    };

    const handleManualSubmit = (e) => {
        e.preventDefault();

        const weight = parseInt(manualForm.value, 10);
        if (!weight || weight < 50 || weight > 1500) {
            alert('Poids invalide (50-1500 kg)');
            return;
        }

        if (editingEntry) {
            updateWeightEntry(editingEntry.id, {
                value: weight,
                bodyConditionScore: manualForm.bodyConditionScore,
                date: manualForm.date,
            });
            setEditingEntry(null);
        } else {
            saveWeightEntry({
                value: weight,
                source: 'MANUAL',
                bodyConditionScore: manualForm.bodyConditionScore,
                date: manualForm.date,
            });
        }

        setShowManualModal(false);
        setManualForm({ date: new Date().toISOString().split('T')[0], value: '', bodyConditionScore: 3 });
    };



    const stats = calculateWeightStats(weightEntries);

    if (!horse) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                Chargement...
            </div>
        );
    }

    return (
        <div style={{ padding: '1rem', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                <button
                    onClick={() => navigate(`/horses/${id}`)}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                    }}
                >
                    <ArrowLeft size={24} />
                </button>
                <div style={{ flex: 1, minWidth: '250px' }}>
                    <h1 style={{ margin: 0, fontSize: '1.75rem', lineHeight: '1.2' }}>
                        <Scale size={28} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
                        Suivi du Poids - {horse.name}
                    </h1>
                    <p style={{ color: '#666', margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
                        Historique des pesées et estimation par photo
                    </p>
                </div>
            </div>

            {/* Statistiques */}
            {stats && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem',
                    marginBottom: '2rem',
                }}>
                    <Card>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem' }}>
                                Poids Actuel
                            </div>
                            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                                {stats.current} kg
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem' }}>
                                Tendance (30j)
                            </div>
                            <div style={{
                                fontSize: '1.8rem',
                                fontWeight: 'bold',
                                color: stats.trend > 0 ? '#10b981' : stats.trend < 0 ? '#ef4444' : '#666',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                            }}>
                                {stats.trend > 0 ? <TrendingUp size={24} /> : stats.trend < 0 ? <TrendingDown size={24} /> : <Minus size={24} />}
                                {Math.abs(stats.trend)} kg
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem' }}>
                                Min / Max / Moy
                            </div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                                {stats.min} / {stats.max} / {stats.avg} kg
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Actions */}
            {canEditWeight && (
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                    <Button
                        onClick={handleOpenBarymetricCamera}
                        variant="primary"
                        style={{ flex: '1 1 300px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                    >
                        <Camera size={20} style={{ marginRight: '0.5rem' }} />
                        Mesure Barymétrique (IA) ⭐
                    </Button>

                    <Button
                        onClick={() => setShowManualModal(true)}
                        variant="secondary"
                        style={{ flex: '1 1 200px' }}
                    >
                        <Plus size={20} style={{ marginRight: '0.5rem' }} />
                        Saisie Manuelle
                    </Button>
                </div>
            )}

            {/* Historique */}
            <Card>
                <h2 style={{ marginTop: 0, fontSize: '1.25rem' }}>📊 Historique des Pesées</h2>

                {weightEntries.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '3rem',
                        color: '#999',
                    }}>
                        <Scale size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                        <p>Aucune pesée enregistrée</p>
                        <p style={{ fontSize: '0.9rem' }}>
                            Utilisez la caméra IA ou saisissez manuellement
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {weightEntries.map((entry) => (
                            <div
                                key={entry.id}
                                style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '1rem',
                                    padding: '1rem',
                                    background: 'var(--color-bg-secondary)',
                                    borderRadius: '8px',
                                    border: '1px solid var(--color-border)',
                                }}
                            >
                                <div style={{ minWidth: '120px' }}>
                                    <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
                                        {entry.value} kg
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: '#666' }}>
                                        {new Date(entry.date).toLocaleDateString('fr-FR', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                        })}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
                                    <div style={{
                                        fontSize: '0.75rem',
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '12px',
                                        background: entry.source === 'BARYMETRIC_AI'
                                            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                            : entry.source === 'PHOTO_ESTIMATION'
                                                ? '#dbeafe'
                                                : '#f3f4f6',
                                        color: entry.source === 'BARYMETRIC_AI' || entry.source === 'PHOTO_ESTIMATION'
                                            ? '#ffffff'
                                            : '#6b7280',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {entry.source === 'BARYMETRIC_AI'
                                            ? '🔬 Barymétrie IA'
                                            : entry.source === 'PHOTO_ESTIMATION'
                                                ? '📸 Photo IA'
                                                : '✏️ Manuel'}
                                    </div>

                                    <div style={{
                                        fontSize: '0.75rem',
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '12px',
                                        background: '#fef3c7',
                                        color: '#92400e',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        BCS {entry.bodyConditionScore || 3}
                                    </div>

                                    {(entry.profilePhotoUrl || entry.rearPhotoUrl) && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            {entry.profilePhotoUrl && (
                                                <a 
                                                    href={entry.profilePhotoUrl} 
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    title="Photo profil"
                                                    style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        width: '28px',
                                                        height: '28px',
                                                        borderRadius: '4px',
                                                        background: 'rgba(59, 130, 246, 0.1)',
                                                        border: '1px solid #3b82f6',
                                                        textDecoration: 'none',
                                                        transition: 'all 0.2s'
                                                    }}
                                                >
                                                    📸 P
                                                </a>
                                            )}
                                            {entry.rearPhotoUrl && (
                                                <a 
                                                    href={entry.rearPhotoUrl} 
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    title="Photo arrière"
                                                    style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        width: '28px',
                                                        height: '28px',
                                                        borderRadius: '4px',
                                                        background: 'rgba(59, 130, 246, 0.1)',
                                                        border: '1px solid #3b82f6',
                                                        textDecoration: 'none',
                                                        transition: 'all 0.2s'
                                                    }}
                                                >
                                                    📸 R
                                                </a>
                                            )}
                                        </div>
                                    )}
                                        <div style={{ display: 'flex', gap: '0.25rem', marginLeft: '0.5rem' }}>
                                            <button
                                                onClick={() => {
                                                    setEditingEntry(entry);
                                                    setManualForm({
                                                        date: entry.date.split('T')[0],
                                                        value: entry.value.toString(),
                                                        bodyConditionScore: entry.bodyConditionScore || 3,
                                                    });
                                                    setShowManualModal(true);
                                                }}
                                                style={{
                                                    background: 'white',
                                                    border: '1px solid #e5e7eb',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    padding: '0.4rem',
                                                    color: 'var(--color-primary)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}
                                                aria-label="Modifier"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => deleteWeightEntry(entry.id)}
                                                style={{
                                                    background: 'white',
                                                    border: '1px solid #fee2e2',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    padding: '0.4rem',
                                                    color: '#ef4444',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}
                                                aria-label="Supprimer"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* Modal Caméra Barymétrique */}
            {showBarymetricCamera && (
                <BarometricCamera
                    horse={horse}
                    onMeasurementComplete={handleBarymetricMeasurementComplete}
                    onClose={() => setShowBarymetricCamera(false)}
                />
            )}

            {/* Modal Saisie Manuelle */}
            {showManualModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                }}>
                    <Card style={{ maxWidth: '500px', width: '90%', maxHeight: '90vh', overflow: 'auto' }}>
                        <h2 style={{ marginTop: 0 }}>
                            {editingEntry ? 'Modifier la pesée' : 'Saisie manuelle'}
                        </h2>

                        <form onSubmit={handleManualSubmit}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                                    Date
                                </label>
                                <input
                                    type="date"
                                    value={manualForm.date}
                                    onChange={(e) => setManualForm({ ...manualForm, date: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        borderRadius: '8px',
                                        border: '1px solid var(--color-border)',
                                    }}
                                    required
                                />
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                                    Poids (kg)
                                </label>
                                <input
                                    type="number"
                                    value={manualForm.value}
                                    onChange={(e) => setManualForm({ ...manualForm, value: e.target.value })}
                                    min="50"
                                    max="1500"
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        borderRadius: '8px',
                                        border: '1px solid var(--color-border)',
                                    }}
                                    required
                                />
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                                    Note d'État Corporel (BCS)
                                </label>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    {BODY_CONDITION_SCORES.map((bcs) => (
                                        <button
                                            key={bcs.value}
                                            type="button"
                                            onClick={() => setManualForm({ ...manualForm, bodyConditionScore: bcs.value })}
                                            style={{
                                                padding: '0.5rem 1rem',
                                                borderRadius: '8px',
                                                border: manualForm.bodyConditionScore === bcs.value
                                                    ? '2px solid var(--color-primary)'
                                                    : '1px solid var(--color-border)',
                                                background: manualForm.bodyConditionScore === bcs.value
                                                    ? 'var(--color-primary-light)'
                                                    : 'transparent',
                                                cursor: 'pointer',
                                                fontSize: '0.85rem',
                                            }}
                                            title={bcs.description}
                                        >
                                            {bcs.value}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <Button
                                    type="button"
                                    onClick={() => {
                                        setShowManualModal(false);
                                        setEditingEntry(null);
                                        setManualForm({ date: new Date().toISOString().split('T')[0], value: '', bodyConditionScore: 3 });
                                    }}
                                    variant="secondary"
                                    style={{ flex: 1 }}
                                >
                                    Annuler
                                </Button>
                                <Button type="submit" variant="primary" style={{ flex: 1 }}>
                                    {editingEntry ? 'Modifier' : 'Ajouter'}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}

            {/* Modal Info Dév */}
            {showDevInfo && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2000,
                }}>
                    <Card style={{ maxWidth: '400px', width: '90%', textAlign: 'center', padding: '2rem' }}>
                        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                            <div style={{
                                width: '64px',
                                height: '64px',
                                borderRadius: '50%',
                                background: 'rgba(59, 130, 246, 0.1)',
                                color: '#3b82f6',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <Camera size={32} />
                            </div>
                        </div>
                        <h2 style={{ marginTop: 0, fontSize: '1.5rem' }}>Fonctionnalité en cours de développement 🚧</h2>
                        <p style={{ color: '#666', lineHeight: 1.6, marginBottom: '2rem' }}>
                            La pesée par photo IA est une technologie expérimentale en cours de finalisation par notre équipe. Elle sera bientôt disponible pour tous !
                        </p>
                        <Button
                            onClick={() => setShowDevInfo(false)}
                            variant="primary"
                            style={{ width: '100%' }}
                        >
                            Compris !
                        </Button>
                    </Card>
                </div>
            )}
        </div>
    );
}

export default WeightTracking;
