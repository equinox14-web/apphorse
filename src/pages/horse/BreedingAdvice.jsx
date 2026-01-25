import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { ArrowLeft, GitMerge } from 'lucide-react';

const BreedingAdvice = () => {
    const navigate = useNavigate();

    return (
        <div className="animate-fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Button variant="secondary" onClick={() => navigate(-1)} style={{ padding: '0.5rem' }}>
                    <ArrowLeft size={20} />
                </Button>
                <div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0 }}>Conseil Croisement</h2>
                    <span style={{ color: '#666' }}>Module Expert</span>
                </div>
            </div>

            {/* Simple Coming Soon Content */}
            <Card style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '3rem', border: '1px dashed #1890ff', background: '#fcfcfc' }}>

                <div style={{
                    width: '100px', height: '100px', borderRadius: '50%',
                    background: '#e6f7ff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: '2rem'
                }}>
                    <GitMerge size={48} color="#1890ff" />
                </div>

                <h1 style={{ fontSize: '3rem', fontWeight: 800, color: '#2c3e50', marginBottom: '1rem' }}>
                    Coming Soon
                </h1>

                <p style={{ fontSize: '1.2rem', color: '#666', maxWidth: '400px', marginBottom: '3rem' }}>
                    Cette fonctionnalité est en cours de développement.
                </p>

                <Button onClick={() => navigate('/breeding')}>Retour</Button>
            </Card>
        </div>
    );
};

export default BreedingAdvice;
