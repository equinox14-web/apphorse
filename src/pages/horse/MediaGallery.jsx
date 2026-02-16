import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { ArrowLeft, Image as ImageIcon, Film, Plus, Trash2, X, Download, Cloud, Loader } from 'lucide-react';
import { canEdit } from '../../utils/permissions';
import { cloudPhotoService } from '../../services/cloudPhotoService';
import { useAuth } from '../../context/AuthContext';

const MediaGallery = () => {
    const { id } = useParams();
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [horse, setHorse] = useState(null);
    const [media, setMedia] = useState([]);
    const [uploadType, setUploadType] = useState('image'); // 'image' | 'video'
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedMedia, setSelectedMedia] = useState(null); // For lightbox
    const [uploading, setUploading] = useState(false);
    const [deleting, setDeleting] = useState(null);
    const [loading, setLoading] = useState(true);

    // Charger le nom du cheval depuis localStorage
    useEffect(() => {
        const savedHorses = JSON.parse(localStorage.getItem('my_horses_v4') || '[]');
        const found = savedHorses.find(h => h.id.toString() === id);
        if (found) setHorse(found);
    }, [id]);

    // Charger les photos du cloud en temps réel (streaming)
    useEffect(() => {
        if (!currentUser?.uid) {
            console.warn('⚠️ Utilisateur non authentifié');
            setLoading(false);
            return;
        }

        setLoading(true);
        console.log(`📸 Chargement photos du cloud pour ${id}...`);

        // Stream photos du cloud
        const unsubscribe = cloudPhotoService.getPhotosStream(
            currentUser.uid,
            id,
            (photos) => {
                console.log(`✅ ${photos.length} photos chargées du cloud`);
                setMedia(photos);
                setLoading(false);
            }
        );

        return unsubscribe;
    }, [currentUser?.uid, id]);

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!currentUser?.uid) {
            alert('❌ Vous devez être connecté pour uploader des photos');
            return;
        }

        // Vérifier la taille du fichier
        const limit = file.type.includes('video') ? 50000000 : 5000000; // 50MB vidéo, 5MB image
        if (file.size > limit) {
            alert(`❌ Fichier trop volumineux (Max ${limit / 1000000}MB)`);
            return;
        }

        setUploading(true);
        try {
            console.log(`📤 Upload: ${file.name}...`);
            await cloudPhotoService.uploadPhoto(currentUser.uid, id, file);
            console.log('✅ Photo uploadée avec succès');
            setShowUploadModal(false);
            // Les photos se mettent à jour automatiquement via onSnapshot ✅
        } catch (error) {
            console.error('❌ Erreur upload:', error);
            alert('❌ Erreur lors de l\'upload: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (mediaId, storageRef) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette photo ?')) return;

        if (!currentUser?.uid) {
            alert('❌ Vous devez être connecté');
            return;
        }

        setDeleting(mediaId);
        try {
            console.log(`🗑️ Suppression de ${mediaId}...`);
            await cloudPhotoService.deletePhoto(currentUser.uid, id, mediaId, storageRef);
            console.log('✅ Photo supprimée');
            if (selectedMedia?.id === mediaId) setSelectedMedia(null);
            // Les photos se mettent à jour automatiquement via onSnapshot ✅
        } catch (error) {
            console.error('❌ Erreur suppression:', error);
            alert('❌ Erreur lors de la suppression: ' + error.message);
        } finally {
            setDeleting(null);
        }
    };

    return (
        <div className="animate-fade-in">
            <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Button variant="secondary" onClick={() => navigate(-1)} style={{ padding: '0.5rem' }}>
                        <ArrowLeft size={20} />
                    </Button>
                    <div>
                        <h2 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0 }}>
                            Galerie Média {currentUser?.uid && <Cloud size={20} style={{ display: 'inline', marginLeft: '8px', color: '#3b82f6' }} />}
                        </h2>
                        <span style={{ color: '#666' }}>{horse ? horse.name : 'Chargement...'}</span>
                        {currentUser?.uid && <small style={{ color: '#999' }}> • Sauvegardé en cloud ☁️</small>}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Button 
                        onClick={() => { setUploadType('image'); setShowUploadModal(true); }}
                        disabled={uploading}
                    >
                        {uploading ? <Loader size={18} style={{ marginRight: '8px', animation: 'spin 1s linear infinite' }} /> : <ImageIcon size={18} style={{ marginRight: '8px' }} />}
                        Ajouter Photo
                    </Button>
                    <Button 
                        onClick={() => { setUploadType('video'); setShowUploadModal(true); }}
                        disabled={uploading}
                    >
                        {uploading ? <Loader size={18} style={{ marginRight: '8px', animation: 'spin 1s linear infinite' }} /> : <Film size={18} style={{ marginRight: '8px' }} />}
                        Ajouter Vidéo
                    </Button>
                </div>
            </div>

            {/* Chargement initial */}
            {loading && (
                <div style={{ textAlign: 'center', padding: '4rem', color: '#999', background: '#f9fafb', borderRadius: '12px' }}>
                    <Loader size={48} style={{ marginBottom: '1rem', opacity: 0.5, animation: 'spin 1s linear infinite' }} />
                    <p>Chargement de la galerie...</p>
                </div>
            )}

            {/* Aucune photo */}
            {!loading && media.length === 0 && (
                <div style={{ textAlign: 'center', padding: '4rem', color: '#999', background: '#f9fafb', borderRadius: '12px' }}>
                    <ImageIcon size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                    <p>Aucune photo ou vidéo pour le moment.</p>
                    <small style={{ color: '#bbb' }}>Cliquez sur "Ajouter Photo" pour commencer</small>
                </div>
            )}

            {/* Gallery Grid */}
            {!loading && media.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
                    {media.map(m => (
                        <div 
                            key={m.id} 
                            style={{ 
                                position: 'relative', 
                                borderRadius: '12px', 
                                overflow: 'hidden', 
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)', 
                                aspectRatio: '1/1', 
                                cursor: 'pointer',
                                opacity: deleting === m.id ? 0.5 : 1,
                                transition: 'opacity 0.2s'
                            }}
                            onClick={() => !deleting && setSelectedMedia(m)}
                        >
                            {m.type === 'image' ? (
                                <img src={m.url} alt={m.fileName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <video src={m.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            )}

                            <div 
                                className="overlay" 
                                style={{
                                    position: 'absolute', 
                                    inset: 0, 
                                    background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
                                    opacity: 0, 
                                    transition: 'opacity 0.2s', 
                                    display: 'flex', 
                                    alignItems: 'flex-end', 
                                    padding: '10px'
                                }}
                                onMouseEnter={e => e.currentTarget.style.opacity = 1}
                                onMouseLeave={e => e.currentTarget.style.opacity = 0}
                            >
                                <div style={{ color: 'white', fontSize: '0.8rem', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {new Date(m.uploadedAt || m.createdAt).toLocaleDateString()}
                                </div>
                                <button 
                                    onClick={(e) => { 
                                        e.stopPropagation(); 
                                        handleDelete(m.id, m.storageRef);
                                    }}
                                    disabled={deleting === m.id}
                                    style={{ 
                                        background: 'white', 
                                        border: 'none', 
                                        borderRadius: '50%', 
                                        padding: '6px', 
                                        cursor: deleting === m.id ? 'wait' : 'pointer', 
                                        color: '#ef4444',
                                        opacity: deleting === m.id ? 0.6 : 1
                                    }}
                                >
                                    {deleting === m.id ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={14} />}
                                </button>
                            </div>

                            {/* Type Indicator */}
                            <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.5)', color: 'white', padding: '4px', borderRadius: '6px' }}>
                                {m.type === 'image' ? <ImageIcon size={14} /> : <Film size={14} />}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Upload Modal */}
            {showUploadModal && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <Card style={{ width: '90%', maxWidth: '400px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0 }}>Ajouter une {uploadType === 'image' ? 'photo' : 'vidéo'}</h3>
                            <button 
                                onClick={() => setShowUploadModal(false)} 
                                style={{ border: 'none', background: 'none', cursor: 'pointer' }}
                                disabled={uploading}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div style={{ border: '2px dashed #ddd', padding: '2rem', borderRadius: '12px', textAlign: 'center', marginBottom: '1rem', background: uploading ? '#f9fafb' : 'white' }}>
                            <input
                                type="file"
                                accept={uploadType === 'image' ? "image/*" : "video/*"}
                                onChange={handleUpload}
                                disabled={uploading}
                                style={{ display: 'none' }}
                                id="media-upload"
                            />
                            <label htmlFor="media-upload" style={{ cursor: uploading ? 'wait' : 'pointer', display: 'block' }}>
                                <div style={{ marginBottom: '1rem', color: '#1890ff', opacity: uploading ? 0.5 : 1 }}>
                                    {uploading ? (
                                        <Loader size={48} style={{ animation: 'spin 1s linear infinite' }} />
                                    ) : (
                                        uploadType === 'image' ? <ImageIcon size={48} /> : <Film size={48} />
                                    )}
                                </div>
                                <Button as="span" disabled={uploading}>
                                    {uploading ? 'Upload en cours...' : 'Sélectionner un fichier'}
                                </Button>
                            </label>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: '#666', textAlign: 'center' }}>
                            {uploading ? (
                                '⏳ Sauvegarde dans le cloud en cours...'
                            ) : (
                                '☁️ Le fichier sera sauvegardé automatiquement dans le cloud pour accès sur tous les appareils'
                            )}
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

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default MediaGallery;
