import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';
import { ArrowLeft, Clock, MapPin, User, Package, Trophy } from 'lucide-react';

const TrainingDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // Mock Data based on ID (In a real app, fetch from API)
    const training = {
        id: id,
        title: 'Entraînement Saut (CSO)',
        horse: 'Thunder',
        date: 'Aujourd\'hui',
        time: '14:00 - 15:00',
        location: 'Carrière Extérieure',
        rider: 'Julie',
        coach: 'Pierre (Coach)',
        type: 'Technique',
        equipment: [
            'Selle CSO Marron',
            'Tapis Bleu Marine',
            'Filet simple + Muserolle croisée',
            'Guêtres et Protège-boulets',
            'Cravache courte'
        ],
        exercises: [
            'Détente aux 3 allures (15 min)',
            'Travail sur des barres au sol',
            'Enchaînement parcours 80cm',
            'Retour au calme'
        ]
    };

    return (
        <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Button variant="secondary" onClick={() => navigate(-1)} style={{ padding: '0.5rem' }}>
                    <ArrowLeft size={20} />
                </Button>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0 }}>Détails de l'activité</h2>
            </div>

            <Card style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <div style={{
                            display: 'inline-block',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '20px',
                            background: '#e6f7ff',
                            color: '#1890ff',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            marginBottom: '0.5rem'
                        }}>
                            {training.type}
                        </div>
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{training.title}</h3>
                        <p style={{ color: 'var(--color-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            🐴 {training.horse}
                        </p>
                    </div>
                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)' }}>
                            <Clock size={16} /> {training.date} • {training.time}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)', justifyContent: 'flex-end' }}>
                            <MapPin size={16} /> {training.location}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)', justifyContent: 'flex-end' }}>
                            <User size={16} /> {training.rider} avec {training.coach}
                        </div>
                    </div>
                </div>
            </Card>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>

                {/* Equipment Section */}
                <Card title="Matériel à utiliser">
                    <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {training.equipment.map((item, index) => (
                            <li key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingBottom: '0.75rem', borderBottom: index !== training.equipment.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
                                <div style={{
                                    width: '32px', height: '32px', borderRadius: '8px',
                                    background: 'rgba(0,0,0,0.03)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: 'var(--color-text-muted)'
                                }}>
                                    <Package size={16} />
                                </div>
                                {item}
                            </li>
                        ))}
                    </ul>
                </Card>

                {/* Plan Section */}
                <Card title="Programme de séance">
                    <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {training.exercises.map((item, index) => (
                            <li key={index} style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{
                                    width: '24px', height: '24px', borderRadius: '50%',
                                    background: 'var(--color-primary)', color: 'white',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 'bold', fontSize: '0.8rem',
                                    flexShrink: 0, marginTop: '2px'
                                }}>
                                    {index + 1}
                                </div>
                                <span style={{ lineHeight: '1.5' }}>{item}</span>
                            </li>
                        ))}
                    </ul>
                </Card>

            </div>
        </div>
    );
};

export default TrainingDetail;
