import React, { useState, useEffect } from 'react';
import { ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

const AdBanner = ({ seed = 0 }) => {
    const [sponsors, setSponsors] = useState([]);
    const [loading, setLoading] = useState(true);
    // Initialize start index differently based on seed to avoid identical ads
    const [currentIndex, setCurrentIndex] = useState(seed % 5 || 0); // Modulo safe default

    // For Swipe Handling
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);

    // Fetch Sponsors from Firestore
    useEffect(() => {
        const fetchSponsors = async () => {
            try {
                const q = query(collection(db, "app_sponsors"), where("isActive", "==", true));
                const querySnapshot = await getDocs(q);
                const fetchedSponsors = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setSponsors(fetchedSponsors);
                if (fetchedSponsors.length > 0) {
                    // Update index based on actual length and seed
                    setCurrentIndex((seed + Math.floor(Math.random() * 10)) % fetchedSponsors.length);
                }
            } catch (error) {
                console.error("Error fetching sponsors:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSponsors();
    }, [seed]);

    // Auto-Play Logic
    useEffect(() => {
        if (sponsors.length <= 1) return;

        // Randomize interval slightly to desynchronize multiple banners (4s to 6s)
        const randomDelay = 4000 + Math.random() * 2000;

        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % sponsors.length);
        }, randomDelay);

        return () => clearInterval(interval);
    }, [sponsors.length]);

    // Swipe Logic
    const handleTouchStart = (e) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const handleTouchMove = (e) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > 50;
        const isRightSwipe = distance < -50;

        if (isLeftSwipe) {
            nextSlide();
        }
        if (isRightSwipe) {
            prevSlide();
        }
    };

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev + 1) % sponsors.length);
    };

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev === 0 ? sponsors.length - 1 : prev - 1));
    };

    if (loading) return null; // Or a skeleton loader
    if (sponsors.length === 0) return null; // Hide if no sponsors

    const currentSponsor = sponsors[currentIndex];

    // Helper to distinguish between image-based and text-based ads if needed. 
    // Assuming mostly image based on "Au lieu d'une image fixe".
    // But maintaining backward compat with style logic if specific fields exist.

    return (
        <div
            className="ad-banner no-print"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
                position: 'relative',
                borderRadius: '8px',
                marginBottom: '1.5rem',
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                backgroundColor: currentSponsor.color || '#fff', // Fallback color
                border: currentSponsor.borderColor ? `1px solid ${currentSponsor.borderColor}` : 'none',
                minHeight: '100px', // Ensure it has height
                transition: 'background-color 0.5s ease'
            }}
        >
            {/* Carousel Content */}
            <div style={{ display: 'flex', transition: 'opacity 0.5s ease-in-out', height: '100%' }}>
                {
                    // If imageUrl is present, show Image Banner
                    // If imageUrl is present, show Image Banner
                    currentSponsor.imageUrl ? (() => {
                        // Smart Link Auto-Detection
                        const findLink = (data) => {
                            if (data.link) return data.link;
                            if (data.url) return data.url;
                            if (data.website) return data.website;
                            if (data.href) return data.href;
                            // Fuzzy Search for any field looking like a URL (excluding images)
                            for (const [k, v] of Object.entries(data)) {
                                if (['imageUrl', 'image', 'photo', 'id', 'title', 'color', 'borderColor'].includes(k)) continue;
                                if (typeof v === 'string' && (v.trim().startsWith('http') || v.trim().startsWith('www'))) return v.trim();
                            }
                            return null;
                        };
                        let targetUrl = findLink(currentSponsor);
                        if (targetUrl && !targetUrl.startsWith('http')) targetUrl = 'https://' + targetUrl;
                        const ImageContent = () => {
                            // Robust check for keys (handling case sensitivity and plurals)
                            const sourceText = currentSponsor.source || currentSponsor.Source || currentSponsor.sources || currentSponsor.Sources || currentSponsor.site || currentSponsor.Site || currentSponsor.origin;
                            const priceText = currentSponsor.price || currentSponsor.Price || currentSponsor.prix || currentSponsor.Prix || currentSponsor.cost;

                            return (
                                <>
                                    <img
                                        src={currentSponsor.imageUrl}
                                        alt={currentSponsor.title || "Sponsor"}
                                        loading="lazy"
                                        style={{
                                            width: '100%',
                                            height: 'auto',
                                            maxHeight: '300px', // Increased height limit
                                            objectFit: 'contain', // Prevents cropping
                                            display: 'block',
                                            margin: '0 auto' // Centers the image
                                        }}
                                    />
                                    {/* Optional Overlay Text if title exists and it's not embedded in image */}
                                    {currentSponsor.displayTitle && (
                                        <div style={{
                                            position: 'absolute', bottom: 0, left: 0, right: 0,
                                            background: 'rgba(0,0,0,0.6)', color: 'white', padding: '0.5rem 1rem',
                                            pointerEvents: 'none' // Let clicks pass through
                                        }}>
                                            <h4 style={{ margin: 0, fontSize: '0.9rem' }}>{currentSponsor.title}</h4>
                                        </div>
                                    )}

                                    {/* Source Badge (e.g. Amazon) */}
                                    {sourceText && (
                                        <div style={{
                                            position: 'absolute', top: '10px', left: '10px',
                                            background: 'rgba(255, 255, 255, 0.9)', color: '#333',
                                            padding: '4px 8px', borderRadius: '4px',
                                            fontSize: '0.75rem', fontWeight: 'bold',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                            pointerEvents: 'none'
                                        }}>
                                            {sourceText}
                                        </div>
                                    )}

                                    {/* Price Badge (e.g. 29.99€) */}
                                    {priceText && (
                                        <div style={{
                                            position: 'absolute', top: '10px', right: '10px',
                                            background: '#e11d48', color: 'white',
                                            padding: '4px 8px', borderRadius: '4px',
                                            fontSize: '0.85rem', fontWeight: 'bold',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                            pointerEvents: 'none'
                                        }}>
                                            {priceText}
                                        </div>
                                    )}
                                </>
                            );
                        };

                        return targetUrl ? (
                            <a
                                href={targetUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    display: 'block',
                                    width: '100%',
                                    height: '100%',
                                    cursor: 'pointer',
                                    position: 'relative',
                                    zIndex: 10,
                                    textDecoration: 'none'
                                }}
                            >
                                <ImageContent />
                            </a>
                        ) : (
                            <div
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    cursor: 'default',
                                    position: 'relative',
                                    zIndex: 10
                                }}
                            >
                                <ImageContent />
                            </div>
                        );
                    })() : (
                        // Fallback Layout (Text Based like before)
                        <div style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                            <div>
                                <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: currentSponsor.borderColor || '#888', marginBottom: '0.25rem' }}>
                                    {currentSponsor.label || "Partenaire"}
                                </div>
                                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: currentSponsor.textColor || '#333' }}>
                                    {currentSponsor.title}
                                </h4>
                                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', color: '#555' }}>
                                    {currentSponsor.description || currentSponsor.text}
                                </p>
                            </div>
                            {currentSponsor.link && (
                                <button
                                    onClick={() => window.open(currentSponsor.link, '_blank')}
                                    style={{
                                        background: currentSponsor.borderColor || '#333',
                                        color: 'white',
                                        border: 'none',
                                        padding: '0.5rem 1rem',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontWeight: 600,
                                        fontSize: '0.85rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        flexShrink: 0,
                                        marginLeft: '1rem'
                                    }}
                                >
                                    Voir <ExternalLink size={14} />
                                </button>
                            )}
                        </div>
                    )
                }
            </div>

            {/* Navigation Dots (Only if multiple) */}
            {sponsors.length > 1 && (
                <div style={{
                    position: 'absolute',
                    bottom: '8px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    gap: '4px'
                }}>
                    {sponsors.map((_, idx) => (
                        <div
                            key={idx}
                            onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
                            style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                backgroundColor: idx === currentIndex ? (currentSponsor.imageUrl ? '#fff' : currentSponsor.textColor || '#333') : 'rgba(128,128,128,0.5)',
                                cursor: 'pointer'
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Optional Arrows (Visible on hover could be better, but simpler here) */}
            {sponsors.length > 1 && (
                <>
                    <button
                        onClick={(e) => { e.stopPropagation(); prevSlide(); }}
                        style={{
                            position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)',
                            background: 'rgba(255,255,255,0.7)', border: 'none', borderRadius: '50%',
                            width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', opacity: 0.6
                        }}
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); nextSlide(); }}
                        style={{
                            position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                            background: 'rgba(255,255,255,0.7)', border: 'none', borderRadius: '50%',
                            width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', opacity: 0.6
                        }}
                    >
                        <ChevronRight size={16} />
                    </button>
                </>
            )}
        </div>
    );
};

export default AdBanner;
