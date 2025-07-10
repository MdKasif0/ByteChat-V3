
'use client';

import { usePeer } from '@/contexts/peer-context';
import { UserAvatar } from '../user-avatar';
import { Button } from '../ui/button';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSound } from '@/hooks/use-sound';
import { useEffect } from 'react';
import { LottieAnimation } from '../lottie-animation';

export function IncomingCallDialog() {
    const { incomingCall, answerCall, endCall } = usePeer();
    const { play: playRingtone, stop: stopRingtone } = useSound('/receiving.mp3', { loop: true });
    
    useEffect(() => {
        if (incomingCall) {
            playRingtone();
        } else {
            stopRingtone();
        }
        return () => stopRingtone();
    }, [incomingCall, playRingtone, stopRingtone]);

    const caller = incomingCall?.metadata;
    const isVideoCall = caller?.type === 'video';

    const handleDecline = () => {
        // In peerjs, the call object needs to be closed on the receiver side too.
        incomingCall?.close();
        endCall();
    }
    
    return (
        <div
            className={cn(
                "fixed top-0 left-0 right-0 z-50 flex justify-center transition-transform duration-300 ease-in-out",
                !!incomingCall ? "translate-y-0" : "-translate-y-full"
            )}
        >
            <div className="mt-4 w-full max-w-sm rounded-2xl border bg-background/80 p-4 shadow-2xl backdrop-blur-md animate-in fade-in-0 slide-in-from-top-12">
                <div className="flex items-center gap-4">
                     <div className="relative">
                        <UserAvatar name={caller?.name || 'C'} avatarUrl={caller?.avatar || ''} className="h-14 w-14 text-xl" />
                        <LottieAnimation src="https://lottie.host/embed/192d11f6-d4df-497b-8b9a-9e19665c5553/fXg3T5uYk1.json" className="absolute -inset-2" />
                    </div>
                    <div className="flex-1">
                        <p className="font-bold text-lg">{caller?.name || 'Unknown Caller'}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                            {isVideoCall ? <Video className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
                            Incoming {isVideoCall ? 'video' : 'audio'} call...
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button onClick={handleDecline} variant="destructive" size="icon" className="h-12 w-12 rounded-full">
                            <PhoneOff className="h-6 w-6" />
                        </Button>
                        <Button onClick={() => answerCall()} size="icon" className="h-12 w-12 rounded-full bg-green-500 hover:bg-green-600">
                            <Phone className="h-6 w-6" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
