
'use client';

import { usePeer } from '@/contexts/peer-context';
import { UserAvatar } from '../user-avatar';
import { Button } from '../ui/button';
import { Mic, MicOff, PhoneOff, Video, VideoOff, ChevronLeft, RotateCw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { useSound } from '@/hooks/use-sound';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const CallControlButton = ({ children, onClick, className, ...props }: { children: React.ReactNode, onClick?: () => void, className?: string, [key: string]: any }) => (
    <Button 
        onClick={onClick} 
        variant="ghost" 
        size="icon" 
        className={cn(
            "h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white", 
            className
        )}
        {...props}
    >
        {children}
    </Button>
);

function CallTimer({ startTime }: { startTime: Date | null }) {
    const [elapsedTime, setElapsedTime] = useState(0);

    useEffect(() => {
        if (!startTime) {
            setElapsedTime(0);
            return;
        }

        const timer = setInterval(() => {
            const now = new Date();
            const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
            setElapsedTime(elapsed);
        }, 1000);

        return () => clearInterval(timer);
    }, [startTime]);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        if (h !== '00') {
            return `${h}:${m}:${s}`;
        }
        return `${m}:${s}`;
    };

    if (!startTime) return null;

    return <span className="text-base font-medium tabular-nums">{formatTime(elapsedTime)}</span>;
}


export function CallView() {
    const { 
        localStream, 
        remoteStream, 
        endCall, 
        activeCall,
        isMuted,
        toggleMute,
        isCameraOff,
        toggleCamera
    } = usePeer();
    const { toast } = useToast();
    
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const { play: playCallingSound, stop: stopCallingSound } = useSound('/calling.mp3', { loop: true });
    
    const otherUser = activeCall?.metadata;
    const isOutgoingRinging = activeCall && !remoteStream;
    const [startTime, setStartTime] = useState<Date | null>(null);

    useEffect(() => {
        if (!activeCall?.metadata?.callId) {
            setStartTime(null);
            return;
        }
        const callDocRef = doc(db, 'calls', activeCall.metadata.callId);
        const unsubscribe = onSnapshot(callDocRef, (docSnapshot) => {
            if (docSnapshot.exists()) {
                const data = docSnapshot.data();
                if (data.status === 'connected' && data.answeredAt) {
                    setStartTime(data.answeredAt.toDate());
                } else {
                    setStartTime(null);
                }

                // End the call if the other party hangs up/declines/etc.
                if (data.status !== 'ringing' && data.status !== 'connected') {
                    endCall();
                }

            } else {
                // Document deleted or doesn't exist, end the call
                endCall();
                setStartTime(null);
            }
        });
        return () => unsubscribe();
    }, [activeCall?.metadata?.callId, endCall]);

    const showTimer = !!startTime && !isOutgoingRinging;

    useEffect(() => {
        if (isOutgoingRinging) {
            playCallingSound();
        } else {
            stopCallingSound();
        }
        return () => stopCallingSound();
    }, [isOutgoingRinging, playCallingSound, stopCallingSound]);

    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);
    
    if (!activeCall) return null;
    
    const isVideoCall = activeCall.metadata?.type === 'video';
    const showRemoteVideo = isVideoCall && remoteStream?.getVideoTracks().length > 0 && !isOutgoingRinging;
    
    const handleSwitchCamera = () => {
        toast({
            title: "Coming Soon!",
            description: "Camera switching functionality is not yet implemented.",
        });
    }

    return (
        <motion.div 
            className="fixed inset-0 bg-black z-50 flex flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {/* Background Layer (Remote Video / Fallback UI) */}
            <div className="absolute inset-0">
                <AnimatePresence>
                    {showRemoteVideo ? (
                        <motion.video
                            key="remote-video"
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                            className="h-full w-full object-cover"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        />
                    ) : (
                         <motion.div 
                            key="fallback-ui"
                            className="h-full w-full bg-gray-900 flex items-center justify-center"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <div className="absolute inset-0 bg-black/30 backdrop-blur-2xl" />
                            <div className="relative flex flex-col items-center gap-6 text-center text-white">
                                <UserAvatar name={otherUser?.name || 'C'} avatarUrl={otherUser?.avatar || ''} className="h-32 w-32 text-4xl border-4 border-white/20" />
                                <p className="text-lg text-white/80 mt-2">
                                    {isOutgoingRinging ? 'Ringing...' : 'Connecting...'}
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Local Video Preview */}
            <AnimatePresence>
                {localStream && isVideoCall && (
                     <motion.div 
                        drag
                        dragConstraints={{ left: 0, right: window.innerWidth - 128 - 24, top: 0, bottom: window.innerHeight - 192 - 24 }}
                        className="absolute bottom-36 right-6 z-20"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ delay: 0.5, type: 'spring' }}
                    >
                         <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className={cn(
                                "h-48 w-32 rounded-3xl object-cover border-2 border-white/50 shadow-2xl transition-opacity bg-black cursor-grab active:cursor-grabbing",
                                isCameraOff && "opacity-0 pointer-events-none"
                            )}
                         />
                         {isCameraOff && (
                             <div className="absolute inset-0 h-48 w-32 rounded-3xl bg-black flex items-center justify-center border-2 border-white/50 shadow-2xl">
                                 <VideoOff className="h-8 w-8 text-white/50"/>
                             </div>
                         )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* UI Overlay */}
            <div className="relative z-10 flex flex-col flex-1">
                 {/* Header */}
                <motion.div
                    className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-black/50 to-transparent grid grid-cols-3 items-center"
                    initial={{ y: -100 }}
                    animate={{ y: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.2 }}
                >
                    <div className="justify-self-start">
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-black/30 hover:bg-black/40 text-white backdrop-blur-md" onClick={endCall}>
                            <ChevronLeft className="h-6 w-6" />
                        </Button>
                    </div>
                    <div className="justify-self-center">
                        <h2 className="text-xl font-bold text-white drop-shadow-md">{otherUser?.name || 'Unknown Caller'}</h2>
                    </div>
                </motion.div>

                <div className="flex-1" />

                {/* Footer Controls */}
                <motion.div
                    className="absolute bottom-6 left-0 right-0 z-20 flex items-center justify-center"
                    initial={{ y: 120 }}
                    animate={{ y: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.2 }}
                >
                     <div className="flex items-center gap-3 bg-gray-900/70 backdrop-blur-md rounded-full p-2 shadow-lg">
                        {!isOutgoingRinging && (
                            <>
                                {isVideoCall && <CallControlButton onClick={handleSwitchCamera}><RotateCw /></CallControlButton>}
                                {isVideoCall && <CallControlButton onClick={toggleCamera}>{isCameraOff ? <VideoOff /> : <Video />}</CallControlButton>}
                                <CallControlButton onClick={toggleMute}>{isMuted ? <MicOff /> : <Mic />}</CallControlButton>
                            </>
                        )}
                        
                        <Button
                            onClick={endCall}
                            className={cn(
                                "rounded-full h-12 p-0 bg-red-600 hover:bg-red-700 text-white flex items-center justify-center text-base transition-all duration-300",
                                showTimer ? "w-28 px-4" : "w-12"
                            )}
                        >
                            <div className="flex items-center gap-2">
                                <PhoneOff className="h-5 w-5" />
                                {showTimer && <CallTimer startTime={startTime} />}
                            </div>
                        </Button>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
}
