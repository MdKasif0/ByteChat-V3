'use client';

import { useRouter } from 'next/navigation';
import { useAuth, UserProfile } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/user-avatar';
import { ChevronLeft, Image as ImageIcon, ZapOff, Zap } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from 'next/image';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import jsQR from 'jsqr';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

const QRCodePageSkeleton = () => (
    <div className="flex flex-col h-screen">
        <header className="flex items-center p-3 border-b border-border/10 shrink-0">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-6 w-24 ml-4" />
        </header>
        <main className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center">
            <div className="bg-card rounded-2xl p-8 text-center max-w-sm w-full shadow-lg">
                <Skeleton className="h-16 w-16 rounded-full mx-auto mb-4" />
                <Skeleton className="h-6 w-32 mx-auto" />
                <Skeleton className="h-4 w-24 mx-auto mt-2" />
                <Skeleton className="mt-6 aspect-square w-full max-w-[256px] mx-auto rounded-lg" />
            </div>
            <Skeleton className="h-4 w-4/5 mx-auto mt-6" />
            <Skeleton className="h-4 w-3/5 mx-auto mt-2" />
        </main>
    </div>
);

const MyCodeTab = () => {
    const { userProfile } = useAuth();
    if (!userProfile) return null;

    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${userProfile.username}`;

    return (
        <div className="flex flex-col items-center justify-center h-full pt-8 pb-4 p-4">
            <Card className="bg-card dark:bg-zinc-800 rounded-2xl p-8 text-center max-w-sm w-full shadow-lg border-none">
                <UserAvatar name={userProfile.name} avatarUrl={userProfile.avatar} className="h-16 w-16 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-foreground">{userProfile.name}</h2>
                <p className="text-muted-foreground text-sm">ByteChat contact</p>
                <div className="mt-6 bg-white p-4 rounded-lg">
                    <Image
                        src={qrCodeUrl}
                        alt="Your QR Code"
                        width={256}
                        height={256}
                        className="mx-auto"
                        unoptimized
                        data-ai-hint="qr code"
                    />
                </div>
            </Card>
            <p className="text-muted-foreground text-sm text-center mt-6 max-w-sm">
                Your QR code is private. If you share it with someone, they can scan it with their ByteChat camera to add you as a contact.
            </p>
        </div>
    );
};

const ScanCodeTab = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const animationFrameId = useRef<number>();

    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
    const [isFlashOn, setIsFlashOn] = useState(false);
    
    const router = useRouter();
    const { userProfile: currentUser } = useAuth();
    const { toast } = useToast();

    const handleNewChat = useCallback(async (username: string) => {
        if (!currentUser) {
            toast({ variant: "destructive", title: "Authentication Error" });
            return;
        }

        if (username.toLowerCase() === currentUser.username.toLowerCase()) {
            toast({ variant: "destructive", title: "Cannot Chat With Yourself" });
            router.back();
            return;
        }

        try {
            const usersRef = collection(db!, 'users');
            const q = query(usersRef, where('username', '==', username));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                toast({ variant: "destructive", title: "User Not Found", description: `No user with username "${username}" exists.` });
                router.back();
                return;
            }

            const otherUser = querySnapshot.docs[0].data() as UserProfile;
            const chatId = [currentUser.uid, otherUser.uid].sort().join('_');
            const chatDocRef = doc(db!, 'chats', chatId);

            const chatDoc = await getDoc(chatDocRef);
            if (!chatDoc.exists()) {
                await setDoc(chatDocRef, {
                    participantUids: [currentUser.uid, otherUser.uid],
                    participants: {
                        [currentUser.uid]: { name: currentUser.name, username: currentUser.username, avatar: currentUser.avatar },
                        [otherUser.uid]: { name: otherUser.name, username: otherUser.username, avatar: otherUser.avatar },
                    },
                    createdAt: serverTimestamp(),
                    typing: { [currentUser.uid]: false, [otherUser.uid]: false, }
                });
            }

            const chatToOpen = {
                id: chatId,
                name: otherUser.name,
                avatar: otherUser.avatar,
                username: otherUser.username,
            };
            sessionStorage.setItem('chatToOpen', JSON.stringify(chatToOpen));
            router.push('/chat');

        } catch (error) {
            console.error("Error starting chat from QR:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not start the chat." });
            router.back();
        }
    }, [currentUser, router, toast]);

    const tick = useCallback(() => {
        if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && canvasRef.current) {
            const canvas = canvasRef.current;
            const video = videoRef.current;
            const ctx = canvas.getContext('2d');

            if (ctx) {
                canvas.height = video.videoHeight;
                canvas.width = video.videoWidth;
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const code = jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: 'dontInvert',
                });

                if (code && code.data) {
                    toast({ title: "QR Code Scanned!", description: `Found user: @${code.data}` });
                    if (video.srcObject) {
                        (video.srcObject as MediaStream).getTracks().forEach(track => track.stop());
                    }
                    if (animationFrameId.current) {
                        cancelAnimationFrame(animationFrameId.current);
                    }
                    handleNewChat(code.data);
                    return; // Stop the loop
                }
            }
        }
        animationFrameId.current = requestAnimationFrame(tick);
    }, [handleNewChat, toast]);

    useEffect(() => {
        const getCameraPermission = async () => {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
            setHasCameraPermission(true);
    
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
              animationFrameId.current = requestAnimationFrame(tick);
            }
          } catch (error) {
            console.error('Error accessing camera:', error);
            setHasCameraPermission(false);
            toast({
              variant: 'destructive',
              title: 'Camera Access Denied',
              description: 'Please enable camera permissions in your browser settings to scan codes.',
            });
          }
        };
    
        getCameraPermission();

        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
            if (videoRef.current && videoRef.current.srcObject) {
                (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
            }
        }
      }, [tick, toast]);


    const handleFileScan = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new window.Image();
            img.onload = () => {
                const canvas = canvasRef.current;
                if (canvas) {
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.drawImage(img, 0, 0, img.width, img.height);
                        const imageData = ctx.getImageData(0, 0, img.width, img.height);
                        const code = jsQR(imageData.data, imageData.width, img.height);
                        if (code && code.data) {
                            toast({ title: "QR Code Scanned!", description: `Found user: @${code.data}` });
                            handleNewChat(code.data);
                        } else {
                            toast({ variant: 'destructive', title: 'No QR Code Found', description: 'Could not find a valid ByteChat QR code in the selected image.' });
                        }
                    }
                }
            };
            img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
        
        if (event.target) {
            event.target.value = '';
        }
    };

    const handleGalleryClick = () => {
        fileInputRef.current?.click();
    };

    const toggleFlashlight = async () => {
        if (!videoRef.current?.srcObject) return;
        const stream = videoRef.current.srcObject as MediaStream;
        const track = stream.getVideoTracks()[0];
        
        if (track) {
            try {
                // @ts-ignore - 'torch' is a valid capability for media tracks
                const capabilities = track.getCapabilities();
                if (capabilities.torch) {
                    await track.applyConstraints({
                        advanced: [{ torch: !isFlashOn }],
                    });
                    setIsFlashOn(!isFlashOn);
                } else {
                     toast({ title: "Flashlight not supported on this device." });
                }
            } catch (error) {
                 console.error('Error toggling flashlight:', error);
                 toast({ variant: 'destructive', title: 'Flashlight Error' });
            }
        }
    };


    return (
        <div className="relative h-full w-full bg-black text-white">
            <video ref={videoRef} className="absolute inset-0 h-full w-full object-cover" autoPlay muted playsInline />
            <canvas ref={canvasRef} className="hidden" />
            <input type="file" ref={fileInputRef} onChange={handleFileScan} accept="image/*" className="hidden" />
            
            {/* Central overlay for scanner cutout and text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-8">
                 <div className="relative w-64 h-64">
                    <div className="absolute -inset-[9999px] border-[9999px] border-black/60 rounded-3xl" />
                    <div className="absolute inset-0 rounded-2xl border-2 border-white/70" />
                 </div>
                 <p className="text-center text-sm font-medium text-white">
                    Scan a ByteChat QR code
                </p>
            </div>
            
            {hasCameraPermission === false && (
                <div className="absolute inset-0 flex items-center justify-center bg-black">
                    <Alert variant="destructive" className="m-4">
                        <AlertTitle>Camera Access Required</AlertTitle>
                        <AlertDescription>
                            Please allow camera access to use this feature.
                        </AlertDescription>
                    </Alert>
                </div>
            )}
            
            {/* Bottom controls */}
            <div className="absolute bottom-0 left-0 right-0 p-8">
                <div className="w-full flex items-center justify-around pointer-events-auto">
                    <Button onClick={handleGalleryClick} variant="ghost" className="flex flex-col items-center h-auto p-2 gap-1 text-white hover:bg-white/10 rounded-lg">
                        <ImageIcon className="h-6 w-6" />
                        <span className="text-xs font-semibold">Gallery</span>
                    </Button>
                     <Button onClick={toggleFlashlight} variant="ghost" className="flex flex-col items-center h-auto p-2 gap-1 text-white hover:bg-white/10 rounded-lg">
                        {isFlashOn ? <Zap className="h-6 w-6" /> : <ZapOff className="h-6 w-6" />}
                        <span className="text-xs font-semibold">Flashlight</span>
                    </Button>
                </div>
            </div>
        </div>
    );
};


export default function QRCodePage() {
    const router = useRouter();
    const { userProfile, loading } = useAuth();
    
    if (loading || !userProfile) {
        return <QRCodePageSkeleton />;
    }

    return (
        <div className="flex flex-col h-screen bg-background text-foreground">
            <header className="flex items-center p-3 border-b border-border/10 shrink-0">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-10 w-10 rounded-full">
                    <ChevronLeft className="h-6 w-6" />
                </Button>
                <h1 className="text-xl font-semibold ml-2">QR code</h1>
            </header>

            <Tabs defaultValue="my-code" className="w-full flex-1 flex flex-col">
                <TabsList className="grid w-full grid-cols-2 bg-transparent p-0 border-b border-border/10 h-auto shrink-0">
                    <TabsTrigger value="my-code" className="text-base h-12 rounded-none data-[state=active]:shadow-[inset_0_-2px_0_hsl(var(--primary))] data-[state=active]:text-primary data-[state=active]:bg-transparent focus-visible:ring-0">My code</TabsTrigger>
                    <TabsTrigger value="scan-code" className="text-base h-12 rounded-none data-[state=active]:shadow-[inset_0_-2px_0_hsl(var(--primary))] data-[state=active]:text-primary data-[state=active]:bg-transparent focus-visible:ring-0">Scan code</TabsTrigger>
                </TabsList>
                <TabsContent value="my-code" className="m-0 flex-1 overflow-y-auto">
                    <MyCodeTab />
                </TabsContent>
                <TabsContent value="scan-code" className="m-0 flex-1">
                    <ScanCodeTab />
                </TabsContent>
            </Tabs>
        </div>
    );
}
