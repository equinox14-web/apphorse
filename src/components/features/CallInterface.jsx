import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import Button from '../common/Button';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff } from 'lucide-react';

const CallInterface = ({ callType, isCaller, onEndCall, localStream, remoteStream }) => {
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);

    useEffect(() => {
        if (localStream && localVideoRef.current) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream, localVideoRef.current]);

    useEffect(() => {
        if (remoteStream && remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream, remoteVideoRef.current]);

    const toggleMic = () => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => track.enabled = !track.enabled);
            setIsMuted(!isMuted);
        }
    };

    const toggleVideo = () => {
        if (localStream) {
            localStream.getVideoTracks().forEach(track => track.enabled = !track.enabled);
            setIsVideoEnabled(!isVideoEnabled);
        }
    };

    return createPortal(
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.9)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
        }}>
            <div style={{ position: 'relative', width: '100%', height: '100%', maxWidth: '1000px', maxHeight: '800px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

                {/* Remote Video (Main) */}
                <div style={{ width: '100%', height: '100%', background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {remoteStream ? (
                        <video ref={remoteVideoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : (
                        <div style={{ color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                            <div className="animate-pulse" style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Phone size={40} />
                            </div>
                            <div>{isCaller ? 'Appel en cours...' : 'Appel entrant...'}</div>
                        </div>
                    )}
                </div>

                {/* Local Video (PiP) */}
                {callType === 'video' && (
                    <div style={{
                        position: 'absolute', bottom: '100px', right: '20px',
                        width: '150px', height: '200px', background: '#333',
                        borderRadius: '12px', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.2)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                    }}>
                        <video ref={localVideoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                )}
            </div>

            {/* Controls */}
            <div style={{
                position: 'absolute', bottom: '30px', left: '50%', transform: 'translateX(-50%)',
                display: 'flex', gap: '1.5rem', background: 'rgba(50,50,50,0.8)', padding: '1rem 2rem', borderRadius: '999px',
                backdropFilter: 'blur(10px)'
            }}>
                <Button
                    variant="secondary"
                    onClick={toggleMic}
                    style={{ borderRadius: '50%', width: '56px', height: '56px', background: isMuted ? '#ef4444' : '#4b5563', color: 'white', border: 'none' }}
                >
                    {isMuted ? <MicOff /> : <Mic />}
                </Button>

                {callType === 'video' && (
                    <Button
                        variant="secondary"
                        onClick={toggleVideo}
                        style={{ borderRadius: '50%', width: '56px', height: '56px', background: !isVideoEnabled ? '#ef4444' : '#4b5563', color: 'white', border: 'none' }}
                    >
                        {isVideoEnabled ? <Video /> : <VideoOff />}
                    </Button>
                )}

                <Button
                    variant="danger"
                    onClick={onEndCall}
                    style={{ borderRadius: '50%', width: '56px', height: '56px', background: '#dc2626', color: 'white', border: 'none' }}
                >
                    <PhoneOff />
                </Button>
            </div>
        </div>,
        document.body
    );
};

export default CallInterface;
