import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';
import { Lock } from 'lucide-react';

const Payment = () => {
    const navigate = useNavigate();

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', padding: '1rem' }}>
            <Card className="animate-fade-in" style={{ padding: '3rem', textAlign: 'center', maxWidth: '500px', width: '100%' }}>
                <div style={{ color: '#10b981', marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                    <Lock size={64} color="#6b7280" />
                </div>
                <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem', color: '#1f2937' }}>Paiement Bientôt Disponible</h2>
                <p style={{ color: '#6b7280', marginBottom: '2rem', lineHeight: '1.6' }}>
                    Le module de paiement sécurisé est en cours de finalisation.<br />
                    L'activation des offres payantes sera disponible très prochainement.
                </p>
                <Button onClick={() => navigate('/')} style={{ width: '100%', justifyContent: 'center' }}>
                    Retour à l'accueil
                </Button>
            </Card>
        </div>
    );
};

export default Payment;
