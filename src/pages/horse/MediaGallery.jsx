import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { ArrowLeft, Image as ImageIcon, Film, Plus, Trash2, X, Download } from 'lucide-react';
import { canEdit } from '../../utils/permissions';

const MediaGallery = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [horse, setHorse] = useState(null);
    const [media, setMedia] = useState([]);
    const [uploadType, setUploadType] = useState('image'); // 'image' | 'video'
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedMedia, setSelectedMedia] = useState(null); // For lightbox

    useEffect(() => {
        // Load Horse Name
        const savedHorses = JSON.parse(localStorage.getItem('my_horses_v4') || '[]');
        const found = savedHorses.find(h => h.id.toString() === id);
        if (found) setHorse(found);

        // Load Media for this horse
        const savedMedia = JSON.parse(localStorage.getItem(`horse_media_${id}`) || '[]');
        setMedia(savedMedia);
    }, [id]);

    const handleUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Size Limit (5MB for images, 10MB for videos for demo)
        const limit = uploadType === 'image' ? 5000000 : 10000000;
        if (file.size > limit) {
            alert(`Fichier trop volumineux (Max ${limit / 1000000}MB)`);
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const newMedia = {
                id: Date.now(),
                type: uploadType,
                url: reader.result,
                date: new Date().toISOString(),
                name: file.name
            };

            const updatedMedia = [newMedia, ...media];
            setMedia(updatedMedia);
            localStorage.setItem(`horse_media_${id}`, JSON.stringify(updatedMedia));
            setShowUploadModal(false);
        };
        reader.readAsDataURL(file);
    };

    const handleDelete = (mediaId) => {
        if (!confirm("Supprimer ce média ?")) return;
        const updated = media.filter(m => m.id !== mediaId);
        setMedia(updated);
        localStorage.setItem(`horse_media_${id}`, JSON.stringify(updated));
        if (selectedMedia?.id === mediaId) setSelectedMedia(null);
    };

    return (
        <div className="animate-fade-in">
            <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Button variant="secondary" onClick={() => navigate(-1)} style={{ padding: '0.5rem' }}>
                        <ArrowLeft size={20} />
                    </Button>
                    <div>
                        <h2 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0 }}>Galerie Média</h2>
                        <span style={{ color: '#666' }}>{horse ? horse.name : 'Chargement...'}</span>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Button onClick={() => { setUploadType('image'); setShowUploadModal(true); }}>
                        <ImageIcon size={18} style={{ marginRight: '8px' }} /> Ajouter Photo
                    </Button>
                    <Button onClick={() => { setUploadType('video'); setShowUploadModal(true); }}>
                        <Film size={18} style={{ marginRight: '8px' }} /> Ajouter Vidéo
                    </Button>
                </div>
            </div>

            {media.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: '#999', background: '#f9fafb', borderRadius: '12px' }}>
                    <ImageIcon size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                    <p>Aucune photo ou vidéo pour le moment.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
                    {media.map(m => (
                        <div key={m.id} style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', aspectRatio: '1/1', cursor: 'pointer' }}
                            onClick={() => setSelectedMedia(m)}
                        >
                            {m.type === 'image' ? (
                                <img src={m.url} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <video src={m.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            )}

                            <div className="overlay" style={{
                                position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
                                opacity: 0, transition: 'opacity 0.2s', display: 'flex', alignItems: 'flex-end', padding: '10px'
                            }}
                                onMouseEnter={e => e.currentTarget.style.opacity = 1}
                                onMouseLeave={e => e.currentTarget.style.opacity = 0}
                            >
                                <div style={{ color: 'white', fontSize: '0.8rem', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {new Date(m.date).toLocaleDateString()}
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); handleDelete(m.id); }} style={{ background: 'white', border: 'none', borderRadius: '50%', padding: '6px', cursor: 'pointer', color: '#ef4444' }}>
                                    <Trash2 size={14} />
                                </button>
                            </div>

                            {/* Type Indicator */}
                            <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0)', color: 'white', padding: '4px', borderRadius: '6px' }}>
                                {m.type === 'image' ? <ImageIcon size={14} /> : <Film size={14} />}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Upload Modal */}
            {showUploadModal && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <Card style={{ width: '90%', maxWidth: '400px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0 }}>Ajouter une {uploadType === 'image' ? 'photo' : 'vidéo'}</h3>
                            <button onClick={() => setShowUploadModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={24} /></button>
                        </div>

                        <div style={{ border: '2px dashed #ddd', padding: '2rem', borderRadius: '12px', textAlign: 'center', marginBottom: '1rem' }}>
                            <input
                                type="file"
                                accept={uploadType === 'image' ? "image/*" : "video/*"}
                                onChange={handleUpload}
                                style={{ display: 'none' }}
                                id="media-upload"
                            />
                            <label htmlFor="media-upload" style={{ cursor: 'pointer', display: 'block' }}>
                                <div style={{ marginBottom: '1rem', color: '#1890ff' }}>
                                    {uploadType === 'image' ? <ImageIcon size={48} /> : <Film size={48} />}
                                </div>
                                <Button as="span">Sélectionner un fichier</Button>
                            </label>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: '#666', textAlign: 'center' }}>
                            Le fichier sera stocké localement dans votre navigateur.
                        </p>
                    </Card>
                </div>
            )}

            {/* Lightbox / View Modal */}
            {selectedMedia && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'black', zIndex: 1100,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }} onClick={() => setSelectedMedia(null)}>
                    <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }} onClick={e => e.stopPropagation()}>
                        {selectedMedia.type === 'image' ? (
                            <img src={selectedMedia.url} alt="Full view" style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: '8px' }} />
                        ) : (
                            <video src={selectedMedia.url} controls autoPlay style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: '8px' }} />
                        )}
                        <button
                            onClick={() => setSelectedMedia(null)}
                            style={{ position: 'absolute', top: -40, right: 0, color: 'white', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                            <X size={32} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MediaGallery;
