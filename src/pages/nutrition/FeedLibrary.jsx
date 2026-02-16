import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Edit2, Camera, Search, TrendingUp } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

function FeedLibrary() {
    const navigate = useNavigate();
    const [customFeeds, setCustomFeeds] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('recent'); // recent, usage, name

    useEffect(() => {
        loadCustomFeeds();
    }, []);

    function loadCustomFeeds() {
        const saved = localStorage.getItem('appHorse_customFeeds');
        if (saved) {
            setCustomFeeds(JSON.parse(saved));
        }
    }

    function handleDelete(feedId) {
        const feed = customFeeds.find(f => f.id === feedId);
        if (!feed) return;

        if (confirm(`Voulez-vous vraiment supprimer "${feed.name}" de votre bibliothèque ?`)) {
            const updated = customFeeds.filter(f => f.id !== feedId);
            setCustomFeeds(updated);
            localStorage.setItem('appHorse_customFeeds', JSON.stringify(updated));
        }
    }

    function handleEdit(feedId) {
        // TODO: Implémenter l'édition
        alert('Fonctionnalité d\'édition à venir !');
    }

    // Filtrer et trier
    const filteredFeeds = customFeeds
        .filter(f => {
            if (!searchQuery) return true;
            const query = searchQuery.toLowerCase();
            return (
                f.name.toLowerCase().includes(query) ||
                f.brand.toLowerCase().includes(query) ||
                f.category?.toLowerCase().includes(query)
            );
        })
        .sort((a, b) => {
            if (sortBy === 'recent') {
                return new Date(b.lastUsed || b.scannedAt) - new Date(a.lastUsed || a.scannedAt);
            } else if (sortBy === 'usage') {
                return (b.usageCount || 0) - (a.usageCount || 0);
            } else if (sortBy === 'name') {
                return a.name.localeCompare(b.name);
            }
            return 0;
        });

    // Statistiques
    const totalFeeds = customFeeds.length;
    const totalUsage = customFeeds.reduce((sum, f) => sum + (f.usageCount || 0), 0);
    const mostUsed = customFeeds.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))[0];

    return (
        <div style={{ padding: '1rem', maxWidth: '800px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
                <button
                    onClick={() => navigate(-1)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}
                >
                    <ArrowLeft size={24} />
                </button>
                <div style={{ marginLeft: '0.5rem' }}>
                    <h1 style={{ margin: 0, fontSize: '1.5rem' }}>📚 Bibliothèque d'Aliments</h1>
                    <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>
                        {totalFeeds} aliment{totalFeeds > 1 ? 's' : ''} scanné{totalFeeds > 1 ? 's' : ''}
                    </p>
                </div>
            </div>

            {/* Statistiques */}
            {totalFeeds > 0 && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: '1rem',
                    marginBottom: '1.5rem'
                }}>
                    <Card style={{ padding: '1rem', textAlign: 'center', background: '#f0f9ff' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0369a1' }}>{totalFeeds}</div>
                        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Aliments</div>
                    </Card>
                    <Card style={{ padding: '1rem', textAlign: 'center', background: '#f0fdf4' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#15803d' }}>{totalUsage}</div>
                        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Utilisations</div>
                    </Card>
                    {mostUsed && (
                        <Card style={{ padding: '1rem', textAlign: 'center', background: '#fef3c7' }}>
                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#92400e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {mostUsed.name}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Plus utilisé</div>
                        </Card>
                    )}
                </div>
            )}

            {/* Barre de recherche et tri */}
            <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                    {/* Recherche */}
                    <div style={{ flex: 1, position: 'relative' }}>
                        <Search
                            size={20}
                            style={{
                                position: 'absolute',
                                left: '0.75rem',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: '#94a3b8'
                            }}
                        />
                        <input
                            type="text"
                            placeholder="Rechercher un aliment..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0',
                                fontSize: '1rem'
                            }}
                        />
                    </div>

                    {/* Tri */}
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        style={{
                            padding: '0.75rem',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            background: 'white',
                            fontSize: '1rem',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="recent">Plus récents</option>
                        <option value="usage">Plus utilisés</option>
                        <option value="name">Nom A-Z</option>
                    </select>
                </div>
            </div>

            {/* Liste des aliments */}
            {filteredFeeds.length === 0 ? (
                <Card style={{ padding: '3rem', textAlign: 'center', background: '#f8fafc' }}>
                    <Camera size={48} color="#cbd5e1" style={{ margin: '0 auto 1rem' }} />
                    <h3 style={{ color: '#64748b', marginBottom: '0.5rem' }}>
                        {searchQuery ? 'Aucun résultat' : 'Aucun aliment scanné'}
                    </h3>
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                        {searchQuery
                            ? 'Essayez une autre recherche'
                            : 'Scannez votre premier aliment depuis le calculateur de ration'}
                    </p>
                </Card>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {filteredFeeds.map(feed => (
                        <Card key={feed.id} style={{ padding: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                {/* Icône */}
                                <div style={{
                                    width: '50px',
                                    height: '50px',
                                    borderRadius: '8px',
                                    background: feed.category === 'MELANGE' ? '#fef3c7' : '#dbeafe',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.5rem',
                                    flexShrink: 0
                                }}>
                                    {feed.category === 'MELANGE' ? '⚡' : '💊'}
                                </div>

                                {/* Infos */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: '600', fontSize: '1.1rem', marginBottom: '0.25rem' }}>
                                        {feed.name}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem' }}>
                                        {feed.brand} • {feed.category}
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: '#94a3b8' }}>
                                        <span>UFC: {feed.ufc}/kg</span>
                                        <span>MADC: {feed.madc}g/kg</span>
                                        {feed.usageCount && (
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <TrendingUp size={12} />
                                                {feed.usageCount} utilisation{feed.usageCount > 1 ? 's' : ''}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                                    <button
                                        onClick={() => handleEdit(feed.id)}
                                        style={{
                                            padding: '0.5rem',
                                            borderRadius: '6px',
                                            border: '1px solid #e2e8f0',
                                            background: 'white',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                        title="Modifier"
                                    >
                                        <Edit2 size={16} color="#64748b" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(feed.id)}
                                        style={{
                                            padding: '0.5rem',
                                            borderRadius: '6px',
                                            border: '1px solid #fee2e2',
                                            background: '#fef2f2',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                        title="Supprimer"
                                    >
                                        <Trash2 size={16} color="#ef4444" />
                                    </button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Bouton retour */}
            <div style={{ marginTop: '2rem' }}>
                <Button
                    onClick={() => navigate(-1)}
                    variant="secondary"
                    style={{ width: '100%', padding: '1rem' }}
                >
                    Retour
                </Button>
            </div>
        </div>
    );
}

export default FeedLibrary;
