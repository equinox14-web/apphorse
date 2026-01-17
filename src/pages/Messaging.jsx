import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, setDoc, getDoc, getDocs, deleteDoc, deleteField } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getToken } from 'firebase/messaging';
import { db, auth, storage, messaging } from '../firebase';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import Button from '../components/Button';
import { Send, User, Image as ImageIcon, Phone, Video, MoreVertical, Bell, ArrowLeft, Plus, X } from 'lucide-react';
import CallInterface from '../components/CallInterface'; // Import Call Interface
import { useTranslation } from 'react-i18next';

const Messaging = () => {
    const { t } = useTranslation();
    const { currentUser } = useAuth();
    const [channels, setChannels] = useState([]);
    const [activeChannelId, setActiveChannelId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [uploading, setUploading] = useState(false);
    const [notifPermission, setNotifPermission] = useState(Notification.permission);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    // New Conversation State
    const [showNewConvModal, setShowNewConvModal] = useState(false);
    const [searchPhone, setSearchPhone] = useState('');

    // --- CALLING STATE ---
    const [callState, setCallState] = useState({ isActive: false, type: 'audio', isCaller: false });
    const [incomingCall, setIncomingCall] = useState(null);
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const peerConnection = useRef(null);

    // WEBRTC CONFIG
    const servers = {
        iceServers: [
            {
                urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
            },
        ],
        iceCandidatePoolSize: 10,
    };

    // 0. Listen for Incoming Calls (in Active Channel)
    useEffect(() => {
        if (!activeChannelId) return;

        // Listen to the specific call document for this channel
        const callDocRef = doc(db, 'channels', activeChannelId, 'call', 'active'); // Using a fixed sub-doc 'active' or subcollection

        // Using subcollection 'calls' ? No, simpler to use a single doc 'call/info' or just subcollection 'calls'
        // Let's use `channels/{cid}/calls` and listen for any 'offer' where we are not the caller.
        // Actually simplest is: one active call per channel.
        // Let's assume `doc(db, 'channels', activeChannelId, 'calls', 'active_call')`.

        const unsubscribe = onSnapshot(doc(db, 'channels', activeChannelId, 'calls', 'active'), (snapshot) => {
            const data = snapshot.data();
            if (data && data.type === 'offer' && data.callerId !== currentUser.uid) {
                // Incoming Call!
                setIncomingCall(data);
            } else if (!data) {
                // Call ended remotely or doesn't exist
                setIncomingCall(null);
                if (callState.isActive && !callState.isCaller) {
                    endCall(false); // End if we were in it (remote hung up)
                }
            } else if (data && data.type === 'answer' && callState.isCaller) {
                // Call Answered!
                // Handle answer (WebRTC) - handled in startCall logic/listener usually, but good to know UI wise.
            }
        });

        return () => unsubscribe();
    }, [activeChannelId, currentUser.uid, callState.isActive]);


    const startCall = async (type) => {
        setCallState({ isActive: true, type, isCaller: true });

        // 1. Setup Local Stream
        const stream = await navigator.mediaDevices.getUserMedia({ video: type === 'video', audio: true });
        setLocalStream(stream);

        // 2. Setup Peer Connection
        const pc = new RTCPeerConnection(servers);
        peerConnection.current = pc;

        // Push tracks
        stream.getTracks().forEach(track => {
            pc.addTrack(track, stream);
        });

        // Pull tracks
        pc.ontrack = (event) => {
            event.streams[0].getTracks().forEach(track => {
                remoteStream?.addTrack(track); // If remoteStream exists
            });
            setRemoteStream(event.streams[0]);
        };

        // 3. Create Offer
        const callDoc = doc(db, 'channels', activeChannelId, 'calls', 'active');
        const offerCandidates = collection(callDoc, 'offerCandidates');
        const answerCandidates = collection(callDoc, 'answerCandidates');

        pc.onicecandidate = (event) => {
            event.candidate && addDoc(offerCandidates, event.candidate.toJSON());
        };

        const offerDescription = await pc.createOffer();
        await pc.setLocalDescription(offerDescription);

        const offer = {
            sdp: offerDescription.sdp,
            type: offerDescription.type,
        };

        await setDoc(callDoc, {
            callerId: currentUser.uid,
            callerName: currentUser.displayName || 'Utilisateur',
            type: 'offer',
            offer,
            callType: type
        });

        // Listen for Answer
        onSnapshot(callDoc, (snapshot) => {
            const data = snapshot.data();
            if (!pc.currentRemoteDescription && data?.answer) {
                const answerDescription = new RTCSessionDescription(data.answer);
                pc.setRemoteDescription(answerDescription);
            }
        });

        // Listen for Remote ICE
        onSnapshot(answerCandidates, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const candidate = new RTCIceCandidate(change.doc.data());
                    pc.addIceCandidate(candidate);
                }
            });
        });
    };

    const answerCall = async () => {
        if (!incomingCall) return;
        setCallState({ isActive: true, type: incomingCall.callType, isCaller: false });
        setIncomingCall(null); // Hide modal

        const callDoc = doc(db, 'channels', activeChannelId, 'calls', 'active');
        const answerCandidates = collection(callDoc, 'answerCandidates');
        const offerCandidates = collection(callDoc, 'offerCandidates');

        const pc = new RTCPeerConnection(servers);
        peerConnection.current = pc;

        const stream = await navigator.mediaDevices.getUserMedia({ video: incomingCall.callType === 'video', audio: true });
        setLocalStream(stream);
        stream.getTracks().forEach(track => pc.addTrack(track, stream));

        pc.ontrack = (event) => {
            setRemoteStream(event.streams[0]);
        };

        // Get Offer
        const callSnapshot = await getDoc(callDoc);
        const callData = callSnapshot.data();
        const offerDescription = callData.offer;

        await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));

        const answerDescription = await pc.createAnswer();
        await pc.setLocalDescription(answerDescription);

        const answer = {
            type: answerDescription.type,
            sdp: answerDescription.sdp,
        };

        await updateDoc(callDoc, { answer, type: 'answer' }); // Update State

        // ICE
        pc.onicecandidate = (event) => {
            event.candidate && addDoc(answerCandidates, event.candidate.toJSON());
        };

        onSnapshot(offerCandidates, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const data = change.doc.data();
                    pc.addIceCandidate(new RTCIceCandidate(data));
                }
            });
        });
    };

    const endCall = async (deleteDb = true) => {
        // Cleanup
        if (peerConnection.current) {
            peerConnection.current.close();
            peerConnection.current = null;
        }
        if (localStream) {
            localStream.getTracks().forEach(t => t.stop());
            setLocalStream(null);
        }
        setRemoteStream(null);
        setCallState({ isActive: false, type: 'audio', isCaller: false });
        setIncomingCall(null);

        if (deleteDb && activeChannelId) {
            // Delete the 'active' call doc to signal end
            // Note: Subcollections need to be deleted manually in Admin SDK, but client side we ignore them or leave them
            // Minimal cleanup: delete the main doc
            try {
                await deleteDoc(doc(db, 'channels', activeChannelId, 'calls', 'active'));
            } catch (e) {
                console.error("End call cleanup error", e);
            }
        }
    };

    const rejectCall = async () => {
        setIncomingCall(null);
        // Optionally update DB to say 'rejected'
    };

    // 1. Fetch Channels
    useEffect(() => {
        if (!currentUser) return;

        const q = query(
            collection(db, 'channels'),
            where('members', 'array-contains', currentUser.uid),
            orderBy('updatedAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const loadedChannels = snapshot.docs.map(doc => {
                const data = doc.data();
                // Find other member
                const otherMemberId = data.members.find(id => id !== currentUser.uid);
                const otherMemberName = data.memberNames ? data.memberNames[otherMemberId] : 'Utilisateur';

                return {
                    id: doc.id,
                    ...data,
                    otherMemberName,
                    otherMemberId
                };
            });
            setChannels(loadedChannels);
        });

        return () => unsubscribe();
    }, [currentUser]);

    // 2. Fetch Messages for Active Channel
    useEffect(() => {
        if (!activeChannelId) return;

        const q = query(
            collection(db, 'channels', activeChannelId, 'messages'),
            orderBy('createdAt', 'asc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMessages(msgs);
            scrollToBottom();
        });

        return () => unsubscribe();
    }, [activeChannelId]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // 3. Send Message
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if ((!inputText.trim() && !uploading) || !activeChannelId) return;

        const text = inputText.trim();
        setInputText('');

        try {
            // Add message to subcollection
            await addDoc(collection(db, 'channels', activeChannelId, 'messages'), {
                text: text,
                senderId: currentUser.uid,
                createdAt: serverTimestamp(),
                type: 'text'
            });

            // Update parent channel
            await updateDoc(doc(db, 'channels', activeChannelId), {
                lastMessage: text,
                updatedAt: serverTimestamp(),
                [`unread.${getOtherMemberId()}`]: true // Flag for unread count logic if needed
            });

        } catch (error) {
            console.error("Error sending message:", error);
            alert(t('messaging_page.chat.errors.send_error'));
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !activeChannelId) return;

        setUploading(true);
        try {
            const storageRef = ref(storage, `chat/${activeChannelId}/${Date.now()}_${file.name}`);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);

            // Send Image Message
            await addDoc(collection(db, 'channels', activeChannelId, 'messages'), {
                imageUrl: url,
                text: 'Photo',
                senderId: currentUser.uid,
                createdAt: serverTimestamp(),
                type: 'image'
            });

            // Send Image Message
            await addDoc(collection(db, 'channels', activeChannelId, 'messages'), {
                imageUrl: url,
                text: t('messaging_page.chat.photo_label'),
                senderId: currentUser.uid,
                createdAt: serverTimestamp(),
            });

        } catch (error) {
            console.error("Upload failed", error);
            alert(t('messaging_page.chat.errors.upload_error'));
        } finally {
            setUploading(false);
        }
    };

    const getOtherMemberId = () => {
        const chan = channels.find(c => c.id === activeChannelId);
        return chan ? chan.otherMemberId : null;
    };

    const getActiveChannelData = () => {
        return channels.find(c => c.id === activeChannelId);
    };

    // 4. Notifications Setup
    const enableNotifications = async () => {
        try {
            const permission = await Notification.requestPermission();
            setNotifPermission(permission);
            if (permission === 'granted') {
                // Get Token (VAPID key is optional for default FCM, but recommended)
                // Using default config from firebase.js
                const token = await getToken(messaging, {
                    vapidKey: "BM2D3K4L..." // OPTIONAL: Replace with real public VAPID key if "permission denied" errors occur
                });

                if (token) {
                    await updateDoc(doc(db, 'users', currentUser.uid), {
                        fcmToken: token
                    });
                    alert(t('messaging_page.notifications.enabled_alert'));
                }
            }
        } catch (error) {
            console.error("Notif error:", error);
            alert(t('messaging_page.notifications.error_alert'));
        }
    };

    const handleCreateConversation = async (e) => {
        e.preventDefault();
        if (!searchPhone.trim()) return;

        try {
            // 1. Search User by Phone
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('phoneNumber', '==', searchPhone.trim()));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                alert(t('messaging_page.new_conv.user_not_found'));
                return;
            }

            const targetUser = querySnapshot.docs[0].data();
            const targetUserId = querySnapshot.docs[0].id;

            if (targetUserId === currentUser.uid) {
                alert(t('messaging_page.new_conv.cannot_message_self'));
                return;
            }

            // 2. Check if channel already exists
            const existingChannel = channels.find(c => c.members.includes(targetUserId));
            if (existingChannel) {
                setActiveChannelId(existingChannel.id);
                setShowNewConvModal(false);
                setSearchPhone('');
                return;
            }

            // 3. Create New Channel
            const newChannelRef = await addDoc(collection(db, 'channels'), {
                members: [currentUser.uid, targetUserId],
                memberNames: {
                    [currentUser.uid]: currentUser.displayName || 'Me',
                    [targetUserId]: targetUser.displayName || targetUser.email
                },
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                lastMessage: '',
                unread: { [targetUserId]: false, [currentUser.uid]: false }
            });

            setActiveChannelId(newChannelRef.id);
            setShowNewConvModal(false);
            setSearchPhone('');

        } catch (error) {
            console.error("Error creating conversation", error);
            alert("Error");
        }
    };

    return (
        <div className={`messaging-container ${activeChannelId ? 'chat-active' : ''}`} style={{ display: 'flex', height: 'calc(100vh - 140px)', gap: '1rem', marginTop: '-1rem' }}>

            {/* Sidebar List */}
            <Card style={{ width: '300px', padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }} className="messaging-sidebar">
                <div style={{ padding: '1rem', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{t('messaging_page.sidebar.title')}</h3>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {notifPermission !== 'granted' && (
                            <Button size="small" variant="secondary" onClick={enableNotifications} title={t('messaging_page.notifications.enable_tooltip')}>
                                <Bell size={16} />
                            </Button>
                        )}
                        <Button size="small" onClick={() => setShowNewConvModal(true)} title={t('messaging_page.new_conv.title')}>
                            <Plus size={16} />
                        </Button>
                    </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {channels.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: '#999', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                            <div>{t('messaging_page.sidebar.no_conversations')}</div>

                        </div>
                    ) : (
                        channels.map(channel => (
                            <div
                                key={channel.id}
                                onClick={() => setActiveChannelId(channel.id)}
                                style={{
                                    padding: '1rem', cursor: 'pointer',
                                    background: activeChannelId === channel.id ? '#e6f7ff' : 'white',
                                    borderBottom: '1px solid #f9f9f9',
                                    display: 'flex', alignItems: 'center', gap: '10px'
                                }}
                            >
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <User size={20} color="#666" />
                                </div>
                                <div style={{ flex: 1, overflow: 'hidden' }}>
                                    <div style={{ fontWeight: 600 }}>{channel.otherMemberName}</div>
                                    <div style={{ fontSize: '0.85rem', color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {channel.senderId === currentUser.uid ? t('messaging_page.sidebar.you_prefix') : ''}{channel.lastMessage}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </Card>

            {/* Chat Area */}
            {activeChannelId ? (
                <Card style={{ flex: 1, padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }} className="messaging-chat">
                    {/* Header */}
                    <div style={{ padding: '1rem', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <button className="chat-back-btn" onClick={() => setActiveChannelId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><ArrowLeft /></button>
                            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{getActiveChannelData()?.otherMemberName}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', color: '#1890ff' }}>
                            <Button variant="ghost" onClick={() => startCall('audio')} title={t('messaging_page.chat.audio_call_tooltip')}>
                                <Phone size={20} />
                            </Button>
                            <Button variant="ghost" onClick={() => startCall('video')} title={t('messaging_page.chat.video_call_tooltip')}>
                                <Video size={20} />
                            </Button>
                        </div>
                    </div>

                    {/* CALL INTERFACE */}
                    {callState.isActive && (
                        <CallInterface
                            callType={callState.type}
                            isCaller={callState.isCaller}
                            onEndCall={endCall}
                            localStream={localStream}
                            remoteStream={remoteStream}
                        />
                    )}

                    {/* RECEIVING CALL MODAL */}
                    {incomingCall && !callState.isActive && (
                        <div style={{
                            position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.5)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <Card style={{ padding: '2rem', textAlign: 'center', minWidth: '300px' }} className="animate-fade-in">
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <div className="animate-pulse" style={{
                                        width: '80px', height: '80px', background: 'var(--color-primary)', borderRadius: '50%',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', color: 'white'
                                    }}>
                                        <Phone size={40} />
                                    </div>
                                </div>
                                <h3 style={{ marginBottom: '0.5rem' }}>{t('messaging_page.incoming_call.title')}</h3>
                                <p style={{ color: '#666', marginBottom: '2rem' }}>{t('messaging_page.incoming_call.calling_text', { name: incomingCall.callerName || 'Utilisateur' })}</p>
                                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                    <Button variant="danger" onClick={rejectCall}>
                                        {t('messaging_page.incoming_call.reject')}
                                    </Button>
                                    <Button style={{ background: '#10b981', border: 'none' }} onClick={answerCall}>
                                        <Phone size={18} style={{ marginRight: '0.5rem' }} /> {t('messaging_page.incoming_call.answer')}
                                    </Button>
                                </div>
                            </Card>
                        </div>
                    )}

                    {/* Messages */}
                    <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', background: '#f5f7fa', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        {messages.map((msg, idx) => {
                            const isMe = msg.senderId === currentUser.uid;
                            return (
                                <div key={msg.id} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
                                    <div style={{
                                        background: isMe ? '#1890ff' : 'white',
                                        color: isMe ? 'white' : '#333',
                                        padding: '0.8rem 1rem',
                                        borderRadius: isMe ? '18px 18px 0 18px' : '18px 18px 18px 0',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                                    }}>
                                        {msg.type === 'image' ? (
                                            <img src={msg.imageUrl} alt="Envoi" style={{ maxWidth: '100%', borderRadius: '8px' }} />
                                        ) : (
                                            msg.text
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSendMessage} style={{ padding: '1rem', background: 'white', borderTop: '1px solid #eee', display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <input
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                        />
                        <Button type="button" variant="secondary" onClick={() => fileInputRef.current.click()} style={{ padding: '8px', borderRadius: '50%' }}>
                            <ImageIcon size={20} />
                        </Button>
                        <input
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder={t('messaging_page.chat.message_placeholder')}
                            style={{ flex: 1, padding: '0.8rem', borderRadius: '24px', border: '1px solid #ddd', background: '#fff', outline: 'none', color: '#333' }}
                        />
                        <Button type="submit" disabled={!inputText.trim() && !uploading} style={{ borderRadius: '50%', width: '45px', height: '45px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Send size={18} />
                        </Button>
                    </form>
                </Card>
            ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', background: 'rgba(255,255,255,0.5)', borderRadius: '16px' }} className="desktop-only">
                    {t('messaging_page.chat.select_conversation')}
                </div>
            )}
            {/* New Conversation Modal */}
            {showNewConvModal && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <Card style={{ width: '90%', maxWidth: '400px', padding: '2rem' }} className="animate-fade-in">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.3rem' }}>{t('messaging_page.new_conv.title')}</h3>
                            <button onClick={() => setShowNewConvModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateConversation}>
                            <input
                                autoFocus
                                type="tel"
                                value={searchPhone}
                                onChange={(e) => setSearchPhone(e.target.value)}
                                placeholder={t('messaging_page.new_conv.phone_placeholder')}
                                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '1.5rem', color: '#333', backgroundColor: '#fff' }}
                            />
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <Button type="button" variant="secondary" onClick={() => setShowNewConvModal(false)} style={{ flex: 1 }}>
                                    {t('messaging_page.new_conv.btn_cancel')}
                                </Button>
                                <Button type="submit" style={{ flex: 1 }}>
                                    {t('messaging_page.new_conv.btn_create')}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default Messaging;
