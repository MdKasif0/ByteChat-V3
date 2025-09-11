'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth, UserProfile } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, doc, onSnapshot, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { UserAvatar } from '@/components/user-avatar';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  MoreVertical,
  MessageSquare,
  Phone,
  Video,
  Bell,
  Image as ImageIcon,
  Lock,
  Clock,
  ShieldAlert,
  Slash,
  Trash2,
  ChevronRight,
  FileText
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { usePeer } from '@/contexts/peer-context';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { getFile } from '@/lib/indexed-db';
import type { Message } from '@/components/chat/message-list';

const InfoPageSkeleton = () => (
  <div className="flex flex-col h-screen bg-background">
    <header className="flex items-center p-3 border-b shrink-0">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="ml-auto flex gap-2">
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
    </header>
    <main className="flex-1 overflow-y-auto px-6">
      <div className="flex flex-col items-center text-center pt-8 pb-6">
        <Skeleton className="h-28 w-28 rounded-full mb-4" />
        <Skeleton className="h-8 w-40 mb-2" />
        <Skeleton className="h-5 w-32" />
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
      <Skeleton className="h-24 w-full rounded-lg mb-6" />
      <Skeleton className="h-40 w-full rounded-lg" />
    </main>
  </div>
);

const SettingsItem = ({ icon: Icon, title, subtitle, onClick, isDestructive = false }: {
    icon: React.ElementType,
    title: string,
    subtitle?: string,
    onClick?: () => void,
    isDestructive?: boolean,
}) => (
    <button onClick={onClick} className="flex items-center p-4 w-full text-left transition-colors hover:bg-accent rounded-lg">
        <Icon className={cn("h-6 w-6 mr-6 shrink-0", isDestructive ? "text-destructive" : "text-muted-foreground")} />
        <div className="flex-1">
            <p className={cn("text-base font-medium", isDestructive ? "text-destructive" : "text-foreground")}>{title}</p>
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
    </button>
);


const MediaPreviewItem = ({ message }: { message: Message }) => {
    const [url, setUrl] = useState<string | null>(null);

    useEffect(() => {
        let objectUrl: string | null = null;
        if (message.fileId) {
            getFile(message.fileId).then(file => {
                if (file) {
                    objectUrl = URL.createObjectURL(file);
                    setUrl(objectUrl);
                }
            });
        }
        return () => {
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [message.fileId]);

    if (!url) return <Skeleton className="aspect-square w-full rounded-lg" />;

    return (
        <div className="aspect-square w-full relative rounded-lg overflow-hidden bg-muted">
            {message.type === 'image' && <Image src={url} alt="Shared media" fill className="object-cover" />}
            {message.type === 'video' && <Video className="h-6 w-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white" />}
             {message.type === 'file' && <FileText className="h-6 w-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary" />}
        </div>
    );
};


export default function ContactInfoPage() {
    const router = useRouter();
    const params = useParams();
    const userId = params.userId as string;

    const { userProfile: currentUser } = useAuth();
    const { startCall } = usePeer();

    const [otherUser, setOtherUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [media, setMedia] = useState<Message[]>([]);

    const chatId = useMemo(() => {
        if (!currentUser || !userId) return null;
        return [currentUser.uid, userId].sort().join('_');
    }, [currentUser, userId]);


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
            setLoading(false);
        });
        return () => unsubscribe();
    }, [userId, router]);

    useEffect(() => {
        if (!chatId) return;
        const mediaQuery = query(
            collection(db, 'chats', chatId, 'messages'),
            where('type', 'in', ['image', 'video']),
            orderBy('timestamp', 'desc'),
            limit(4)
        );
        const unsubscribe = onSnapshot(mediaQuery, (snapshot) => {
            const mediaItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
            setMedia(mediaItems);
        });
        return () => unsubscribe();
    }, [chatId]);

    const handleAction = (type: 'message' | 'audio' | 'video') => {
        if (!otherUser || !currentUser) return;

        if (type === 'message') {
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
    
    if (loading || !otherUser) {
        return <InfoPageSkeleton />;
    }

    return (
        <div className="flex flex-col h-screen bg-background text-foreground">
            <header className="flex items-center p-3 border-b shrink-0">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-10 w-10 rounded-full">
                    <ChevronLeft className="h-6 w-6" />
                </Button>
                <div className="ml-auto">
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full">
                        <MoreVertical />
                    </Button>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto">
                <div className="flex flex-col items-center text-center pt-8 pb-6 px-6">
                    <UserAvatar name={otherUser.name} avatarUrl={otherUser.avatar} className="h-28 w-28 text-4xl mb-4" />
                    <h2 className="text-3xl font-bold">{otherUser.name}</h2>
                    <p className="text-muted-foreground mt-1">@{otherUser.username}</p>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6 px-6">
                    <Button variant="outline" className="flex flex-col h-auto py-3 gap-1.5 border-border/20 bg-foreground/5 hover:bg-foreground/10 rounded-xl" onClick={() => handleAction('message')}>
                        <MessageSquare className="h-5 w-5 text-primary" />
                        <span>Message</span>
                    </Button>
                     <Button variant="outline" className="flex flex-col h-auto py-3 gap-1.5 border-border/20 bg-foreground/5 hover:bg-foreground/10 rounded-xl" onClick={() => handleAction('audio')}>
                        <Phone className="h-5 w-5 text-primary" />
                        <span>Audio</span>
                    </Button>
                     <Button variant="outline" className="flex flex-col h-auto py-3 gap-1.5 border-border/20 bg-foreground/5 hover:bg-foreground/10 rounded-xl" onClick={() => handleAction('video')}>
                        <Video className="h-5 w-5 text-primary" />
                        <span>Video</span>
                    </Button>
                </div>
                
                <Separator className="my-4"/>

                {media.length > 0 && (
                     <div className="px-6">
                        <div className="flex justify-between items-center mb-2">
                             <h3 className="font-semibold">Media, links and docs</h3>
                             <Button variant="ghost" size="sm" className="text-primary">
                                 <span>{media.length}</span>
                                 <ChevronRight className="h-4 w-4" />
                             </Button>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            {media.map(item => <MediaPreviewItem key={item.id} message={item} />)}
                        </div>
                    </div>
                )}
               
                <Separator className="my-4"/>

                <div className="px-4 space-y-1">
                    <SettingsItem icon={Bell} title="Mute notifications" />
                    <SettingsItem icon={ImageIcon} title="Media visibility" />
                    <SettingsItem icon={Lock} title="Encryption" subtitle="Messages and calls are end-to-end encrypted." />
                    <SettingsItem icon={Clock} title="Disappearing messages" subtitle="Off" />
                </div>
                
                 <Separator className="my-4"/>

                 <div className="px-4 space-y-1">
                    <SettingsItem icon={Slash} title={`Block "${otherUser.name}"`} isDestructive />
                    <SettingsItem icon={ShieldAlert} title={`Report "${otherUser.name}"`} isDestructive />
                    <SettingsItem icon={Trash2} title="Delete chat" isDestructive />
                </div>

                <div className="h-8"></div>

            </main>
        </div>
    );
}
