'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronLeft, AlertTriangle, User, UserX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

const DeleteWarningItem = ({ children }: { children: React.ReactNode }) => (
    <li className="list-disc list-inside text-muted-foreground">{children}</li>
);


const DeletePageSkeleton = () => (
    <div className="flex flex-col h-screen bg-background text-foreground">
        <header className="flex items-center p-3 border-b border-border/10 shrink-0">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-6 w-24 ml-4" />
        </header>
        <main className="flex-1 overflow-y-auto p-6 space-y-8">
            <div className="space-y-4">
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-3/4" />
            </div>
             <div className="space-y-4">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-12 w-48" />
            </div>
             <div className="space-y-4">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
            <Skeleton className="h-12 w-full" />
        </main>
    </div>
);

export default function DeleteAccountPage() {
    const router = useRouter();
    const { userProfile, loading } = useAuth();
    const { toast } = useToast();
    const [confirmationUsername, setConfirmationUsername] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    const isConfirmationMatching = userProfile ? confirmationUsername.toLowerCase() === userProfile.username.toLowerCase() : false;
    
    const handleDelete = async () => {
        if (!isConfirmationMatching) {
            toast({
                variant: 'destructive',
                title: "Username mismatch",
                description: "Please enter your correct username to confirm."
            });
            return;
        }
        setIsDeleting(true);
        // In a real app, you would have a complex flow here:
        // 1. Re-authenticate user.
        // 2. Delete user data from Firestore (user doc, chats, etc).
        // 3. Delete user files from Storage.
        // 4. Delete the user from Firebase Auth.
        console.log("Initiating account deletion for:", userProfile?.username);
        toast({
            title: "Deletion in progress...",
            description: "Account deletion is a complex process and has been logged."
        });
        // For this prototype, we'll just log and navigate away.
        // In a real app, you'd likely sign the user out after deletion is confirmed.
        router.push('/login');
        setIsDeleting(false);
    };

    if (loading || !userProfile) {
        return <DeletePageSkeleton />;
    }

    return (
        <div className="flex flex-col h-screen bg-background text-foreground">
            <header className="flex items-center p-3 border-b border-border/10 shrink-0">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-10 w-10 rounded-full">
                    <ChevronLeft className="h-6 w-6" />
                </Button>
                <h1 className="text-xl font-semibold ml-2">Delete this account</h1>
            </header>

            <main className="flex-1 overflow-y-auto p-6 space-y-8">
                <section>
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="h-6 w-6 text-destructive mt-1" />
                        <div>
                            <h2 className="text-lg font-semibold text-destructive">If you delete this account:</h2>
                            <ul className="mt-2 space-y-1.5">
                                <DeleteWarningItem>The account will be deleted from ByteChat and all your devices</DeleteWarningItem>
                                <DeleteWarningItem>Your message history will be erased</DeleteWarningItem>
                                <DeleteWarningItem>You will be removed from all your ByteChat groups</DeleteWarningItem>
                            </ul>
                        </div>
                    </div>
                </section>
                
                <Separator />

                <section className="flex items-center gap-4">
                     <User className="h-6 w-6 text-muted-foreground shrink-0" />
                     <div className="flex-1">
                        <h3 className="font-semibold">Change username instead?</h3>
                     </div>
                     <Button 
                        variant="outline" 
                        onClick={() => router.push('/settings/profile')}
                        className="bg-green-500/10 border-green-500/20 text-green-500 hover:bg-green-500/20 hover:text-green-400"
                    >
                        Change username
                    </Button>
                </section>
                
                <Separator />
                
                <section className="space-y-4">
                    <p className="text-muted-foreground">To delete your account, confirm your username.</p>
                    <div>
                        <Label htmlFor="username-confirm" className="text-sm font-medium text-foreground">Username</Label>
                        <Input 
                            id="username-confirm"
                            value={confirmationUsername}
                            onChange={(e) => setConfirmationUsername(e.target.value)}
                            placeholder={`@${userProfile.username}`}
                            className="mt-2 h-12"
                        />
                    </div>
                </section>
            </main>
            
            <footer className="p-4 border-t border-border/10">
                <Button 
                    variant="destructive" 
                    className="w-full h-12 text-base"
                    onClick={handleDelete}
                    disabled={!isConfirmationMatching || isDeleting}
                >
                    {isDeleting ? 'Deleting...' : 'Delete account'}
                </Button>
            </footer>
        </div>
    );
}
