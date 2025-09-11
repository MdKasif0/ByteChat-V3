
'use client';

import { MobileLayout } from '@/components/layout/mobile-layout';
import { UserAvatar } from '@/components/user-avatar';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Camera, Plus } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useRouter } from 'next/navigation';

// Mock data for statuses
const recentUpdates = [
  { id: 1, name: 'Alice Johnson', avatar: 'https://placehold.co/100x100.png', time: '15 minutes ago', viewed: false, aiHint: "woman portrait" },
  { id: 2, name: 'Bob Williams', avatar: 'https://placehold.co/100x100.png', time: '1 hour ago', viewed: false, aiHint: "man smiling" },
];
const viewedUpdates = [
  { id: 3, name: 'Charlie Brown', avatar: 'https://placehold.co/100x100.png', time: '3 hours ago', viewed: true, aiHint: "person thinking" },
  { id: 4, name: 'Diana Prince', avatar: 'https://placehold.co/100x100.png', time: '8 hours ago', viewed: true, aiHint: "woman hero" },
]

export default function UpdatesPage() {
    const { userProfile } = useAuth();
    const router = useRouter();

    const handleAddStatus = () => {
        // This would open a camera/gallery view in a real app
        console.log("Add status clicked");
    };

    const handleViewStatus = (statusId: number) => {
        // This would navigate to a status viewer page in a real app
        console.log(`View status ${statusId}`);
    };
    
    // This function is required by MobileLayout but not fully utilized on this page.
    const handleChatSelect = (chat: any) => {
        router.push('/chat');
        sessionStorage.setItem('chatToOpen', JSON.stringify(chat));
    }

    return (
        <MobileLayout onChatSelect={handleChatSelect}>
            <header className="flex items-center justify-between p-4">
                <h1 className="text-3xl font-bold">Updates</h1>
                <Button variant="ghost" size="icon" className="rounded-full h-10 w-10">
                    <Camera className="h-5 w-5" />
                </Button>
            </header>

            <main className="px-2">
                <div className="space-y-4">
                    <div className="px-2">
                        <h2 className="text-lg font-semibold text-muted-foreground">Status</h2>
                    </div>
                    
                    <button onClick={handleAddStatus} className="flex items-center gap-4 p-2 rounded-xl hover:bg-accent w-full text-left transition-colors">
                        <div className="relative">
                            <UserAvatar name={userProfile?.name || 'U'} avatarUrl={userProfile?.avatar} className="h-14 w-14" />
                            <div className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full h-6 w-6 flex items-center justify-center ring-2 ring-background">
                                <Plus className="h-4 w-4" />
                            </div>
                        </div>
                        <div className="flex-1">
                            <p className="font-bold">My Status</p>
                            <p className="text-sm text-muted-foreground">Tap to add a status update</p>
                        </div>
                    </button>
                    
                    <Separator />
                    
                    <div>
                        <h3 className="font-semibold text-muted-foreground px-3 mb-2">Recent updates</h3>
                        <div className="space-y-1">
                            {recentUpdates.map(update => (
                                <button key={update.id} onClick={() => handleViewStatus(update.id)} className="flex items-center gap-4 p-2 rounded-xl hover:bg-accent w-full text-left transition-colors">
                                    <UserAvatar name={update.name} avatarUrl={update.avatar} className="h-14 w-14" ringColor="ring-primary" data-ai-hint={update.aiHint} />
                                    <div className="flex-1">
                                        <p className="font-bold">{update.name}</p>
                                        <p className="text-sm text-muted-foreground">{update.time}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 className="font-semibold text-muted-foreground px-3 mb-2">Viewed updates</h3>
                        <div className="space-y-1">
                            {viewedUpdates.map(update => (
                                <button key={update.id} onClick={() => handleViewStatus(update.id)} className="flex items-center gap-4 p-2 rounded-xl hover:bg-accent w-full text-left transition-colors">
                                    <UserAvatar name={update.name} avatarUrl={update.avatar} className="h-14 w-14" ringColor="ring-muted" data-ai-hint={update.aiHint} />
                                    <div className="flex-1">
                                        <p className="font-bold">{update.name}</p>
                                        <p className="text-sm text-muted-foreground">{update.time}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </MobileLayout>
    );
}

    
