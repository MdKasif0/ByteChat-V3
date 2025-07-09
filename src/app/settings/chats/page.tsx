'use client';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronLeft, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect, useRef } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { getFile, saveFile } from '@/lib/indexed-db';

const ChatSettingsPageSkeleton = () => (
    <div className="flex flex-col h-screen bg-background text-foreground">
        <header className="flex items-center p-3 border-b border-border/10 shrink-0">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-6 w-24 ml-4" />
        </header>
        <main className="flex-1 overflow-y-auto p-6 space-y-8">
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-4 w-3/4 mt-2" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="aspect-video w-full rounded-lg" />
                    <div>
                        <Skeleton className="h-4 w-20 mb-2" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="flex justify-end">
                        <Skeleton className="h-10 w-24" />
                    </div>
                </CardContent>
            </Card>
        </main>
    </div>
);


export default function ChatSettingsPage() {
    const router = useRouter();
    const { userProfile, loading } = useAuth();
    const { toast } = useToast();
    const [wallpaperUrl, setWallpaperUrl] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const objectUrlRef = useRef<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!userProfile) return;

        const wallpaperUri = userProfile.wallpaper;
        if (wallpaperUri) {
            if (wallpaperUri.startsWith('indexeddb://')) {
                const fileId = wallpaperUri.replace('indexeddb://', '');
                getFile(fileId).then(file => {
                    if (file) {
                        const newObjectUrl = URL.createObjectURL(file);
                        objectUrlRef.current = newObjectUrl;
                        setWallpaperUrl(newObjectUrl);
                    }
                }).catch(console.error);
            } else {
                setWallpaperUrl(wallpaperUri);
            }
        } else {
            setWallpaperUrl('');
        }

        return () => {
            if (objectUrlRef.current) {
                URL.revokeObjectURL(objectUrlRef.current);
                objectUrlRef.current = null;
            }
        };
    }, [userProfile]);


    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !userProfile) return;

        if (!file.type.startsWith('image/')) {
            toast({ variant: 'destructive', title: 'Invalid File Type', description: 'Please select an image file.' });
            return;
        }

        setIsSaving(true);
        const fileId = `wallpaper-${userProfile.uid}`;
        const userDocRef = doc(db, 'users', userProfile.uid);

        try {
            await saveFile(fileId, file);
            await updateDoc(userDocRef, { wallpaper: `indexeddb://${fileId}` });

            if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
            const newObjectUrl = URL.createObjectURL(file);
            objectUrlRef.current = newObjectUrl;
            setWallpaperUrl(newObjectUrl);

            toast({ title: 'Wallpaper updated successfully!' });
        } catch (error) {
            console.error('Failed to update wallpaper from file', error);
            toast({ variant: 'destructive', title: 'Update failed', description: 'Could not save your wallpaper.' });
        } finally {
            setIsSaving(false);
            if(fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleSaveHttpUrl = async () => {
        if (!userProfile || wallpaperUrl.startsWith('blob:')) return;
        setIsSaving(true);
        const userDocRef = doc(db, 'users', userProfile.uid);
        try {
            new URL(wallpaperUrl);
            await updateDoc(userDocRef, { wallpaper: wallpaperUrl });
            toast({ title: 'Wallpaper updated successfully!' });
        } catch (error) {
            console.error('Failed to update wallpaper from URL', error);
            toast({ variant: 'destructive', title: 'Invalid URL', description: 'Please enter a valid image URL.' });
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleRemoveWallpaper = async () => {
        if (!userProfile) return;
        setIsSaving(true);
        if (objectUrlRef.current) {
            URL.revokeObjectURL(objectUrlRef.current);
            objectUrlRef.current = null;
        }
        const userDocRef = doc(db, 'users', userProfile.uid);
        try {
            await updateDoc(userDocRef, { wallpaper: '' });
            setWallpaperUrl('');
            toast({ title: 'Wallpaper removed.' });
        } catch (error) {
            console.error('Failed to remove wallpaper', error);
            toast({ variant: 'destructive', title: 'Update failed', description: 'Could not remove your wallpaper.' });
        } finally {
            setIsSaving(false);
        }
    }

    if (loading || !userProfile) {
        return <ChatSettingsPageSkeleton />;
    }

    return (
        <div className="flex flex-col h-screen bg-background text-foreground">
            <header className="flex items-center p-3 border-b border-border/10 shrink-0">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-10 w-10 rounded-full">
                    <ChevronLeft className="h-6 w-6" />
                </Button>
                <h1 className="text-xl font-semibold ml-2">Chats</h1>
            </header>

            <main className="flex-1 overflow-y-auto p-6 space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Chat Wallpaper</CardTitle>
                        <CardDescription>Set a custom background for all your chats. Upload an image or paste an image URL below.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div 
                            className={cn(
                                "aspect-video w-full rounded-lg bg-muted flex items-center justify-center bg-cover bg-center transition-all",
                                !wallpaperUrl && 'bg-zinc-200 dark:bg-zinc-800'
                            )}
                            style={{ backgroundImage: wallpaperUrl ? `url(${wallpaperUrl})` : undefined }}
                         >
                            {!wallpaperUrl && <ImageIcon className="h-12 w-12 text-muted-foreground" />}
                         </div>
                        
                        <div>
                            <Label htmlFor="wallpaper-url">Image URL</Label>
                            <Input
                                id="wallpaper-url"
                                value={wallpaperUrl.startsWith('blob:') ? 'Uploaded from device' : wallpaperUrl}
                                onChange={(e) => setWallpaperUrl(e.target.value)}
                                placeholder="https://example.com/image.png"
                                className="mt-2"
                                disabled={wallpaperUrl.startsWith('blob:')}
                            />
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />
                        <div className="flex justify-end gap-2">
                             <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isSaving}>
                                Upload Image
                            </Button>
                            <Button variant="ghost" onClick={handleRemoveWallpaper} disabled={isSaving || !wallpaperUrl}>
                                Remove
                            </Button>
                            <Button onClick={handleSaveHttpUrl} disabled={isSaving || wallpaperUrl.startsWith('blob:') || !wallpaperUrl}>
                                {isSaving ? 'Saving...' : 'Save URL'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
