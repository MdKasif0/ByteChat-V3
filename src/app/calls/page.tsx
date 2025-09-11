
'use client';

import { MobileLayout } from '@/components/layout/mobile-layout';
import { Phone, Video, ArrowUpRight, ArrowDownLeft, Search, MoreVertical, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth, UserProfile } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';
import { UserAvatar } from '@/components/user-avatar';
import { Button } from '@/components/ui/button';
import { usePeer } from '@/contexts/peer-context';
import { toast } from '@/hooks/use-toast';
import { LottieAnimation } from '@/components/lottie-animation';
import { cn } from '@/lib/utils';
import { formatCallTimestamp } from '@/lib/date-utils';
import { useRouter } from 'next/navigation';

interface CallLog {
    id: string;
    callerId: string;
    callerName: string;
    callerAvatar: string | null;
    callerUsername: string;
    receiverId: string;
    receiverName: string;
    receiverAvatar: string | null;
    receiverUsername: string;
    type: 'audio' | 'video';
    status: 'ringing' | 'connected' | 'completed' | 'missed' | 'declined';
    createdAt: Timestamp;
    duration?: number;
}

function CallLogItem({ log, currentUser }: { log: CallLog, currentUser: UserProfile }) {
    const { startCall } = usePeer();
    const router = useRouter();
    const isOutgoing = log.callerId === currentUser.uid;
    
    const otherUser = {
        uid: isOutgoing ? log.receiverId : log.callerId,
        name: isOutgoing ? log.receiverName : log.callerName,
        avatar: isOutgoing ? log.receiverAvatar : log.callerAvatar,
        username: isOutgoing ? log.receiverUsername : log.callerUsername,
        peerId: isOutgoing ? log.receiverUsername : log.callerUsername,
    };
    
    const wasMissedByMe = !isOutgoing && (log.status === 'missed' || log.status === 'declined');

    const handleCallBack = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!otherUser.peerId) {
            toast({ variant: 'destructive', title: 'Cannot Call', description: 'User is not available for calls.' });
            return;
        }
        startCall(otherUser, log.type);
    }

    const handleNavigate = () => {
        router.push(`/calls/${otherUser.uid}`);
    }
    
    const DirectionIcon = isOutgoing ? ArrowUpRight : ArrowDownLeft;
    const iconColor = wasMissedByMe ? 'text-destructive' : 'text-green-500';

    return (
        <div 
            className="flex items-center p-3 gap-4 hover:bg-accent rounded-lg transition-colors cursor-pointer"
            onClick={handleNavigate}
        >
            <UserAvatar name={otherUser.name} avatarUrl={otherUser.avatar} className="h-12 w-12"/>
            <div className="flex-1 overflow-hidden">
                <p className={cn("font-semibold truncate", wasMissedByMe && "text-destructive")}>{otherUser.name}</p>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <DirectionIcon className={cn("h-4 w-4", iconColor)} />
                    <span>{formatCallTimestamp(log.createdAt.toDate())}</span>
                </div>
            </div>
            <Button onClick={handleCallBack} variant="ghost" size="icon" className="text-muted-foreground hover:text-primary h-10 w-10 rounded-full">
                {log.type === 'video' ? <Video className="h-5 w-5"/> : <Phone className="h-5 w-5"/>}
            </Button>
        </div>
    )
}

export default function CallsPage() {
    const { userProfile } = useAuth();
    const [callLogs, setCallLogs] = useState<CallLog[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        if (!userProfile) return;

        const callsRef = collection(db!, 'calls');
        const q = query(callsRef, 
            where('participants', 'array-contains', userProfile.uid),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const logs = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() } as CallLog))
                .filter(log => log.status !== 'ringing' && log.status !== 'connected');
            setCallLogs(logs);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching call logs:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userProfile]);

    const handleChatSelect = (chat: any) => {
        router.push('/chat');
        sessionStorage.setItem('chatToOpen', JSON.stringify(chat));
    };

  return (
    <MobileLayout onChatSelect={handleChatSelect}>
      <header className="flex items-center justify-between p-4">
        <h1 className="text-3xl font-bold">Calls</h1>
        <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 text-muted-foreground">
                <Search className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 text-muted-foreground">
                <MoreVertical className="h-5 w-5" />
            </Button>
        </div>
      </header>
      <main className="flex-1 pb-24">
        {!loading && (
            <>
                {callLogs.length === 0 ? (
                    <div className="flex flex-1 flex-col items-center justify-center text-center text-muted-foreground p-4 mt-[-80px]">
                        <LottieAnimation src="https://lottie.host/embed/8488950c-e2f7-4a6c-ab03-a968a3bf602e/rA9g5a4358.json" className="w-64 h-64" />
                        <h2 className="text-xl font-semibold mt-4">No Call History</h2>
                        <p>Your call log is empty. Make your first call!</p>
                    </div>
                ) : (
                    <div className="px-2">
                        <h2 className="text-lg font-semibold text-muted-foreground px-3 py-2">Recent</h2>
                        <div className="space-y-1">
                            {callLogs.map(log => <CallLogItem key={log.id} log={log} currentUser={userProfile!} />)}
                        </div>
                    </div>
                )}
            </>
        )}
      </main>
    </MobileLayout>
  );
}

    
