'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/user-avatar';
import { ChevronLeft, User, Info, AtSign, Link as LinkIcon, Pencil } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type React from 'react';
import { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const ProfileDetailItem = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) => (
  <div className="flex items-start gap-6 py-4">
    <Icon className="h-6 w-6 text-muted-foreground" />
    <div className="flex-1">
      <p className="text-sm text-foreground">{label}</p>
      <div className="text-base text-muted-foreground mt-1">{value}</div>
    </div>
  </div>
);

const ProfilePageSkeleton = () => (
    <div className="flex flex-col h-screen bg-background text-foreground">
        <header className="flex items-center p-3 border-b border-border/10 shrink-0">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-6 w-24 ml-4" />
        </header>
        <main className="flex-1 overflow-y-auto p-6">
            <div className="flex flex-col items-center text-center pt-8 pb-6">
                <Skeleton className="h-32 w-32 rounded-full" />
                <Skeleton className="h-5 w-16 mt-4" />
            </div>
            <div className="mt-6 space-y-4">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
            </div>
        </main>
    </div>
);


export default function ProfilePage() {
    const router = useRouter();
    const { userProfile, loading } = useAuth();
    const { toast } = useToast();

    const [isEditingAbout, setIsEditingAbout] = useState(false);
    const [aboutText, setAboutText] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        if (userProfile) {
            setAboutText(userProfile.customStatus || 'To see limits of possibility, you have to try impossible.');
        }
    }, [userProfile]);

    if (loading || !userProfile) {
        return <ProfilePageSkeleton />;
    }

    const handleSaveAbout = async () => {
        if (!userProfile) return;
        setIsUpdating(true);
        const userDocRef = doc(db!, 'users', userProfile.uid);
        try {
            await updateDoc(userDocRef, {
                customStatus: aboutText,
            });
            toast({ title: "Profile updated!" });
            setIsEditingAbout(false);
        } catch (error) {
            console.error("Failed to update profile", error);
            toast({ variant: 'destructive', title: "Update failed", description: "Could not save your changes." });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleCancelEdit = () => {
        setIsEditingAbout(false);
        setAboutText(userProfile.customStatus || 'To see limits of possibility, you have to try impossible.');
    };

    return (
        <div className="flex flex-col h-screen bg-background text-foreground">
            <header className="flex items-center p-3 border-b border-border/10 shrink-0">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-10 w-10 rounded-full">
                    <ChevronLeft className="h-6 w-6" />
                </Button>
                <h1 className="text-xl font-semibold ml-2">Profile</h1>
            </header>
            
            <main className="flex-1 overflow-y-auto px-6">
                <div className="flex flex-col items-center text-center pt-8 pb-6">
                    <UserAvatar name={userProfile.name} avatarUrl={userProfile.avatar} className="h-32 w-32 text-5xl" />
                    <Button variant="link" className="text-primary text-base mt-2">
                        Edit
                    </Button>
                </div>
                
                <div className="divide-y divide-border/10">
                    <ProfileDetailItem
                        icon={User}
                        label="Name"
                        value={<p>{userProfile.name}</p>}
                    />
                    
                    <div className="flex items-start gap-6 py-4">
                        <Info className="h-6 w-6 text-muted-foreground mt-1" />
                        <div className="flex-1">
                            <p className="text-sm text-foreground">About</p>
                            {!isEditingAbout ? (
                                <div className="text-base text-muted-foreground mt-1">{aboutText}</div>
                            ) : (
                                <div className="mt-2 space-y-2">
                                    <Textarea
                                        value={aboutText}
                                        onChange={(e) => setAboutText(e.target.value)}
                                        placeholder="Tell everyone a little about yourself..."
                                        rows={3}
                                        className="text-base"
                                    />
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" size="sm" onClick={handleCancelEdit}>Cancel</Button>
                                        <Button size="sm" onClick={handleSaveAbout} disabled={isUpdating}>
                                            {isUpdating ? 'Saving...' : 'Save'}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                        {!isEditingAbout && (
                            <div className="ml-auto">
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full -mr-2" onClick={() => setIsEditingAbout(true)}>
                                    <Pencil className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </div>
                    
                     <ProfileDetailItem
                        icon={AtSign}
                        label="Username"
                        value={<p>@{userProfile.username}</p>}
                    />
                     <ProfileDetailItem
                        icon={LinkIcon}
                        label="Links"
                        value={<button className="text-primary hover:underline">Add links</button>}
                    />
                </div>
            </main>
        </div>
    );
}
