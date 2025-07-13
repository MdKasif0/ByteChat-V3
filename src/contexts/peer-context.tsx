
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useRef, useCallback } from 'react';
import type Peer from 'peerjs';
import { useAuth, UserProfile } from './auth-context';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { addDoc, collection, doc, serverTimestamp, updateDoc, getDoc } from 'firebase/firestore';
import { initDB, saveFile } from '@/lib/indexed-db';
import { eventBus } from '@/lib/event-bus';

interface PeerContextType {
    peer: Peer | null;
    peerId: string | null;
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;
    incomingCall: Peer.MediaConnection | null;
    activeCall: Peer.MediaConnection | null;
    callInProgress: boolean;
    isMuted: boolean;
    isCameraOff: boolean;
    startCall: (otherUser: { uid: string; peerId: string; name: string; avatar: string | null; username: string; }, type: 'audio' | 'video') => Promise<void>;
    answerCall: () => Promise<void>;
    endCall: () => void;
    toggleMute: () => void;
    toggleCamera: () => void;
    sendFile: (peerId: string, file: File) => Promise<{ fileId: string; fileName: string; fileSize: number; mediaType: string; }>;
    acceptCallFromUrl: (callId: string) => void;
}

const PeerContext = createContext<PeerContextType | undefined>(undefined);

const usePeerJS = () => {
  const [peerConstructor, setPeerConstructor] = useState<{ default: typeof Peer } | null>(null);

  useEffect(() => {
    import('peerjs').then(module => setPeerConstructor(module));
  }, []);

  return peerConstructor;
}

export function PeerProvider({ children }: { children: ReactNode }) {
    const { userProfile } = useAuth();
    const { toast } = useToast();
    const PeerConstructor = usePeerJS();
    
    const [peer, setPeer] = useState<Peer | null>(null);
    const [peerId, setPeerId] = useState<string | null>(null);
    const peerRef = useRef<Peer | null>(null);

    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [incomingCall, setIncomingCall] = useState<Peer.MediaConnection | null>(null);
    const [activeCall, setActiveCall] = useState<Peer.MediaConnection | null>(null);
    
    const activeCallRef = useRef(activeCall);
    useEffect(() => { activeCallRef.current = activeCall }, [activeCall]);

    const localStreamRef = useRef(localStream);
    useEffect(() => { localStreamRef.current = localStream }, [localStream]);

    const dataConnectionsRef = useRef<Record<string, Peer.DataConnection>>({});

    const callInProgress = !!activeCall;

    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    
    useEffect(() => {
        initDB();
    }, []);
    
    const getMedia = useCallback(async (type: 'audio' | 'video'): Promise<MediaStream> => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: type === 'video',
                audio: true,
            });
            setLocalStream(stream);
            if (type === 'audio') {
                stream.getVideoTracks().forEach(track => track.enabled = false);
                setIsCameraOff(true);
            } else {
                 setIsCameraOff(false);
            }
            setIsMuted(false);
            return stream;
        } catch (error) {
            console.error('Error accessing media devices.', error);
            toast({
                variant: 'destructive',
                title: 'Permission Denied',
                description: 'Camera and microphone access is required for calls.',
            });
            throw new Error('Media permissions denied.');
        }
    }, [toast]);

    const cleanupLocalCallState = useCallback(() => {
        if (activeCallRef.current) {
            activeCallRef.current.close();
        }
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
        }
        setLocalStream(null);
        setRemoteStream(null);
        setActiveCall(null);
        setIncomingCall(null);
    }, []);
    
    const endCall = useCallback(async () => {
        const callToEnd = activeCallRef.current;
        
        if (callToEnd?.metadata?.callId && userProfile) {
            try {
                const callDocRef = doc(db!, 'calls', callToEnd.metadata.callId);
                const callDoc = await getDoc(callDocRef);

                if (callDoc.exists()) {
                    const callData = callDoc.data();
                    let finalStatus = callData.status;
                    let duration = 0;

                    if (callData.status === 'connected') {
                        finalStatus = 'completed';
                        const answeredAt = callData.answeredAt?.toDate();
                        if (answeredAt) {
                            duration = Math.floor((new Date().getTime() - answeredAt.getTime()) / 1000);
                        }
                    } else if (callData.status === 'ringing') {
                         finalStatus = userProfile.uid === callData.callerId ? 'missed' : 'declined';
                    }
                    
                    if (finalStatus !== callData.status) {
                        await updateDoc(callDocRef, {
                            status: finalStatus,
                            endedAt: serverTimestamp(),
                            duration: duration,
                        });
                    }
                }
            } catch (error) {
                console.error("Failed to update call log on endCall", error);
            }
        }
        
        cleanupLocalCallState();
    }, [userProfile, cleanupLocalCallState]);

    const setupCallEvents = useCallback((call: Peer.MediaConnection) => {
        call.on('stream', (stream) => {
            setRemoteStream(stream);
        });
        call.on('close', endCall);
        call.on('error', (err) => {
            console.error('Call error:', err);
            endCall();
        });
        setActiveCall(call);
    }, [endCall]);

    const answerCall = useCallback(async () => {
        if (!incomingCall) return;
    
        const callToAnswer = incomingCall;
        setIncomingCall(null); // Clear incoming call immediately to hide the dialog
    
        const type = callToAnswer.metadata.type;
        const callId = callToAnswer.metadata.callId;
    
        if (callId) {
            try {
                const callDocRef = doc(db!, 'calls', callId);
                await updateDoc(callDocRef, {
                    status: 'connected',
                    answeredAt: serverTimestamp(),
                });
            } catch (error) {
                console.error("Error updating call status to connected:", error);
            }
        }
    
        try {
            const stream = await getMedia(type);
            callToAnswer.answer(stream);
            setupCallEvents(callToAnswer);
        } catch (error) {
            console.error("Error getting media or answering call:", error);
            // If we fail here, we should end the call on Firestore as well.
            if (callId) {
                const callDocRef = doc(db!, 'calls', callId);
                await updateDoc(callDocRef, { status: 'failed', endedAt: serverTimestamp() }).catch();
            }
            callToAnswer.close(); // Close the peer connection
        }
    }, [incomingCall, getMedia, setupCallEvents]);
    

    const answerCallById = useCallback(async (callId: string) => {
        // This is a placeholder for a more complex flow if needed,
        // for now we rely on the main `answerCall` logic which uses the `incomingCall` state.
        console.log("Attempting to answer call by ID (not yet fully implemented):", callId);
        // In a real scenario, you'd find the call in a state map and answer it.
        // For now, we'll assume the `incomingCall` state is set correctly by the time user interacts.
    }, []);

    const acceptCallFromUrl = useCallback((callId: string) => {
        // The logic in AuthProvider/ChatPage will handle showing the incoming call dialog
        // or directly answering if the state is managed properly.
        // This function is a signal to the app, but the core logic is in `answerCall`.
        console.log("Accepted call from URL, callId:", callId);
    }, []);


    useEffect(() => {
        if (!userProfile?.peerId || peerRef.current || !PeerConstructor) return;

        const newPeer = new PeerConstructor.default(userProfile.peerId, {
            host: '0.peerjs.com',
            port: 443,
            path: '/',
            secure: true,
        });
        
        peerRef.current = newPeer;
        setPeer(newPeer);

        newPeer.on('open', (id) => {
            setPeerId(id);
        });

        newPeer.on('call', (call) => {
            if (activeCallRef.current) {
                console.log("Ignoring incoming call, another call is active.");
                // You might want to send a 'busy' signal back to the caller here.
                return;
            }
            setIncomingCall(call);
        });

        newPeer.on('connection', (conn) => {
            dataConnectionsRef.current[conn.peer] = conn;
            conn.on('data', async (data: any) => {
                if (data.file && data.fileId && data.fileName && data.fileType) {
                    try {
                        const receivedFile = new File([data.file], data.fileName, { type: data.fileType });
                        await saveFile(data.fileId, receivedFile);
                        eventBus.dispatchEvent(new CustomEvent('file-received', { detail: { fileId: data.fileId } }));
                        toast({ title: "File Received", description: `Saved ${data.fileName}` });
                    } catch (err) {
                        console.error("Failed to save received file", err);
                        toast({ variant: 'destructive', title: "File Receive Error", description: "Could not save the received file." });
                    }
                }
            });
            conn.on('close', () => {
                delete dataConnectionsRef.current[conn.peer];
            });
        });

        newPeer.on('error', (err: any) => {
            console.error('PeerJS error:', err);
            if (err.type === 'peer-unavailable') {
                 toast({ 
                    title: "User is Offline", 
                    description: "They will be notified of your missed call." 
                });
                endCall();
            } else {
                 toast({ variant: 'destructive', title: 'Connection Error', description: `An error occurred: ${err.message}` });
                 endCall();
            }
        });

        return () => {
            newPeer.destroy();
            peerRef.current = null;
        };
    }, [userProfile, toast, PeerConstructor, endCall]);

    
    const startCall = async (otherUser: { uid: string; peerId: string; name: string; avatar: string | null; username: string; }, type: 'audio' | 'video') => {
        if (!peer || peer.destroyed || !userProfile) {
            toast({
                variant: 'destructive',
                title: 'Connection Error',
                description: 'Cannot initiate call. Please check your connection and try again.',
            });
            return;
        }

        const otherUserDocRef = doc(db, 'users', otherUser.uid);
        const otherUserDocSnap = await getDoc(otherUserDocRef);
        const recipientProfile = otherUserDocSnap.data() as UserProfile | undefined;

        const callsCollection = collection(db!, 'calls');
        const callDocRef = await addDoc(callsCollection, {
            callerId: userProfile.uid,
            callerName: userProfile.name,
            callerAvatar: userProfile.avatar,
            callerUsername: userProfile.username,
            receiverId: otherUser.uid,
            receiverName: otherUser.name,
            receiverAvatar: otherUser.avatar,
            receiverUsername: otherUser.username,
            type: type,
            status: 'ringing',
            createdAt: serverTimestamp(),
            participants: [userProfile.uid, otherUser.uid],
        });
        const callId = callDocRef.id;

        if (recipientProfile?.status === 'offline' && recipientProfile.fcmToken) {
            fetch('/api/send-notification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token: recipientProfile.fcmToken,
                    title: '📞 Incoming Call',
                    body: `${userProfile.name} is calling you...`,
                    url: `/chat?callId=${callId}&action=accept`,
                    avatar: userProfile.avatar,
                    tag: callId,
                    actions: JSON.stringify([
                        { action: 'accept-call', title: 'Accept' },
                        { action: 'decline-call', title: 'Decline' },
                    ]),
                    callId: callId,
                }),
            });
        }

        const stream = await getMedia(type);

        const metadata = {
            callerId: userProfile.uid,
            name: userProfile.name,
            avatar: userProfile.avatar,
            type: type,
            callId: callId,
        };

        const call = peer.call(otherUser.peerId, stream, { metadata });
        
        if (call) {
            setupCallEvents(call);
        } else {
             await updateDoc(callDocRef, { status: 'failed' });
             toast({ variant: 'destructive', title: 'Call Failed', description: 'Could not connect to the user.' });
             cleanupLocalCallState();
        }
    };
    
    const sendFile = (peerId: string, file: File): Promise<{ fileId: string; fileName: string; fileSize: number; mediaType: string; }> => {
        return new Promise((resolve, reject) => {
            if (!peerRef.current) {
                return reject(new Error('Peer connection not established.'));
            }
            const conn = peerRef.current.connect(peerId, { reliable: true });
            conn.on('open', () => {
                const fileId = `${Date.now()}-${file.name}`;
                saveFile(fileId, file)
                    .then(() => {
                        const payload = { fileId, file, fileName: file.name, fileType: file.type };
                        conn.send(payload);
                        resolve({
                            fileId,
                            fileName: file.name,
                            fileSize: file.size,
                            mediaType: file.type,
                        });
                    })
                    .catch(err => reject(err));
            });
            conn.on('error', (err) => {
                console.error('Data connection error:', err);
                reject(err);
            });
        });
    };

    const toggleMute = () => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => track.enabled = !track.enabled);
            setIsMuted(prevState => !prevState);
        }
    };

    const toggleCamera = () => {
        if (localStream) {
            localStream.getVideoTracks().forEach(track => track.enabled = !track.enabled);
            setIsCameraOff(prevState => !prevState);
        }
    };
    
    const value: PeerContextType = {
        peer,
        peerId,
        localStream,
        remoteStream,
        incomingCall,
        activeCall,
        callInProgress,
        isMuted,
        isCameraOff,
        startCall,
        answerCall,
        endCall,
        toggleMute,
        toggleCamera,
        sendFile,
        acceptCallFromUrl,
    };

    return <PeerContext.Provider value={value}>{children}</PeerContext.Provider>;
}

export const usePeer = (): PeerContextType => {
    const context = useContext(PeerContext);
    if (context === undefined) {
        throw new Error('usePeer must be used within a PeerProvider');
    }
    return context;
};
