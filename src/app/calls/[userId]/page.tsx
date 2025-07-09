'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth, UserProfile } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, query, where, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';
import { UserAvatar } from '@/components/user-avatar';
import { Button } from '@/components/ui/button';
import { ChevronLeft, MoreVertical, MessageSquare, Phone, Video, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { usePeer } from '@/contexts/peer-context';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { isSameDay } from 'date-fns';
import { formatDateSeparator } from '@/lib/date-utils';
import { format } from 'date-fns';
import { Separator } from '@/components/ui/separator';

interface CallLog {
    id: string;
    callerId: string;
    receiverId: string;
    type: 'audio' | 'video';
    status: 'completed' | 'missed' | 'declined';
    createdAt: Timestamp;
    duration?: number;
}


function HistoryItem({ log, isOutgoing }: { log: CallLog; isOutgoing: boolean }) {
    const wasMissed = log.status === 'missed' || log.status === 'declined';
    const DirectionIcon = isOutgoing ? ArrowUpRight : ArrowDownLeft;
    const iconColor = wasMissed ? 'text-destructive' : 'text-green-500';

    const formatDuration = (seconds: number) => {
        if (!seconds || seconds < 1) return null;
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}m ${s}s`;
    };

    return (
        <div className="flex items-center gap-4 py-3">
            <DirectionIcon className={cn("h-5 w-5", iconColor)} />
            <div className="flex-1">
                <p className={cn("font-semibold", wasMissed && "text-destructive")}>
                    {isOutgoing ? 'Outgoing' : 'Incoming'}
                </p>
                <p className="text-sm text-muted-foreground">{format(log.createdAt.toDate(), 'p')}</p>
            </div>
            {log.duration ? (
                 <p className="text-sm text-muted-foreground">{formatDuration(log.duration)}</p>
            ) : null}
        </div>
    );
}

export default function CallInfoPage() {
    const router = useRouter();
    const params = useParams();
    const userId = params.userId as string;

    const { userProfile: currentUser } = useAuth();
    const { startCall } = usePeer();

    const [otherUser, setOtherUser] = useState<UserProfile | null>(null);
    const [callHistory, setCallHistory] = useState<CallLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) return;
        const userDocRef = doc(db, 'users', userId);
        const unsubscribe = onSnapshot(userDocRef, (doc) => {
            if (doc.exists()) {
                setOtherUser({ uid: doc.id, ...doc.data() } as UserProfile);
            } else {
                toast({ variant: 'destructive', title: 'User not found' });
                router.back();
            }
        });
        return () => unsubscribe();
    }, [userId, router]);

    useEffect(() => {
        if (!currentUser || !otherUser) return;
        
        setLoading(true);
        const callsRef = collection(db, 'calls');
        const q = query(
            callsRef, 
            where('participants', 'array-contains', currentUser.uid),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const logs = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() } as CallLog))
                .filter(log => (log.callerId === otherUser.uid || log.receiverId === otherUser.uid) && log.status !== 'ringing' && log.status !== 'connected');
            setCallHistory(logs);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching call history:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser, otherUser]);

    const handleAction = (type: 'message' | 'audio' | 'video') => {
        if (!otherUser || !currentUser) return;

        if (type === 'message') {
            const chatId = [currentUser.uid, otherUser.uid].sort().join('_');
            const chatToOpen = {
                id: chatId,
                name: otherUser.name,
                avatar: otherUser.avatar,
                username: otherUser.username,
            };
            sessionStorage.setItem('chatToOpen', JSON.stringify(chatToOpen));
            router.push('/chat');
        } else {
            startCall(otherUser, type);
        }
    };

    const callListWithSeparators: (CallLog | { isSeparator: true; date: Date; id: string })[] = [];
    if (!loading && callHistory.length > 0) {
        let lastDate: Date | null = null;
        callHistory.forEach(log => {
            const logDate = log.createdAt.toDate();
            if (!lastDate || !isSameDay(lastDate, logDate)) {
                callListWithSeparators.push({ isSeparator: true, date: logDate, id: logDate.toISOString() });
            }
            callListWithSeparators.push(log);
            lastDate = logDate;
        });
    }

    return (
        <div className="flex flex-col h-screen bg-background text-foreground">
            <header className="flex items-center p-3 border-b border-border/10 shrink-0">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-10 w-10 rounded-full">
                    <ChevronLeft className="h-6 w-6" />
                </Button>
                <h1 className="text-xl font-semibold ml-2">Call info</h1>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full ml-auto">
                    <MoreVertical />
                </Button>
            </header>
            <main className="flex-1 overflow-y-auto px-6">
                {otherUser ? (
                    <>
                        <div className="flex flex-col items-center text-center pt-8 pb-6">
                            <UserAvatar name={otherUser.name} avatarUrl={otherUser.avatar} className="h-28 w-28 text-4xl mb-4" />
                            <h2 className="text-3xl font-bold">{otherUser.name}</h2>
                            <p className="text-muted-foreground mt-1">@{otherUser.username}</p>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <Button variant="outline" className="flex flex-col h-auto py-3 gap-1.5 border-border/20 bg-foreground/5 hover:bg-foreground/10 rounded-xl" onClick={() => handleAction('message')}>
                                <MessageSquare className="h-5 w-5 text-green-400" />
                                <span>Message</span>
                            </Button>
                             <Button variant="outline" className="flex flex-col h-auto py-3 gap-1.5 border-border/20 bg-foreground/5 hover:bg-foreground/10 rounded-xl" onClick={() => handleAction('audio')}>
                                <Phone className="h-5 w-5 text-green-400" />
                                <span>Audio</span>
                            </Button>
                             <Button variant="outline" className="flex flex-col h-auto py-3 gap-1.5 border-border/20 bg-foreground/5 hover:bg-foreground/10 rounded-xl" onClick={() => handleAction('video')}>
                                <Video className="h-5 w-5 text-green-400" />
                                <span>Video</span>
                            </Button>
                        </div>
                        
                        {callHistory.length > 0 && <Separator className="bg-border/10"/>}

                        <div className="divide-y divide-border/10">
                            {callListWithSeparators.map((item) => {
                                 if ('isSeparator' in item && item.isSeparator) {
                                    return <p key={item.id} className="text-sm font-semibold text-muted-foreground pt-6 pb-2">{formatDateSeparator(item.date)}</p>;
                                }
                                const log = item as CallLog;
                                const isOutgoing = log.callerId === currentUser?.uid;
                                return <HistoryItem key={log.id} log={log} isOutgoing={isOutgoing} />;
                            })}
                        </div>
                    </>
                ) : (
                    // Optional: You can place a lightweight, non-layout-shifting loader here
                    // For now, it will be blank while `otherUser` is fetched.
                    null
                )}
            </main>
        </div>
    );
}
