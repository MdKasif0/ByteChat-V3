'use client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useState } from "react"
import { useAuth, UserProfile } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore"
import { AtSign, UserPlus } from "lucide-react"

const formSchema = z.object({
  username: z.string().min(1, { message: "Username cannot be empty." }),
});

type Chat = {
    id: string;
    name: string;
    avatar: string;
    online: boolean;
    lastMessage: string;
    unread?: number;
    username: string;
};

export function NewChatDialog({ children, onChatSelect }: { children: React.ReactNode; onChatSelect: (chat: Chat) => void; }) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { userProfile: currentUser } = useAuth();
    const { toast } = useToast();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            username: "",
        },
    });

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsSubmitting(true);

        if (!currentUser) {
            toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in to start a chat." });
            setIsSubmitting(false);
            return;
        }

        if (values.username.toLowerCase() === currentUser.username.toLowerCase()) {
            toast({ variant: "destructive", title: "Cannot Chat With Yourself", description: "Please enter another user's username." });
            setIsSubmitting(false);
            return;
        }

        try {
            const usersRef = collection(db!, 'users');
            const q = query(usersRef, where('username', '==', values.username));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                toast({ variant: "destructive", title: "User Not Found", description: `No user with the username "${values.username}" exists.` });
                setIsSubmitting(false);
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
                    typing: {
                        [currentUser.uid]: false,
                        [otherUser.uid]: false,
                    }
                });
            }

            const newChat: Chat = {
                id: chatId,
                name: otherUser.name,
                avatar: otherUser.avatar || 'https://placehold.co/100x100.png',
                online: false, // We'll implement presence later
                username: otherUser.username,
                lastMessage: 'Say hello!',
            };

            onChatSelect(newChat);
            setOpen(false);
            form.reset();

        } catch (error) {
            console.error("Error starting chat:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not start the chat. Please try again." });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm" onInteractOutside={(e) => { if (isSubmitting) e.preventDefault(); }} >
                <DialogHeader className="text-center items-center">
                    <div className="mb-3 bg-primary/10 text-primary p-3 rounded-full">
                        <UserPlus className="h-7 w-7" />
                    </div>
                    <DialogTitle className="font-headline text-2xl">Add new friend</DialogTitle>
                    <DialogDescription>
                        Enter your friend's unique username to start a conversation.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
                        <FormField
                            control={form.control}
                            name="username"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <div className="relative">
                                            <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                            <Input 
                                                id="username" 
                                                placeholder="jane_cooper" 
                                                className="pl-10 h-12 text-base" 
                                                {...field} 
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage className="text-center" />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit" disabled={isSubmitting} className="w-full h-11 text-base">
                                {isSubmitting ? 'Connecting...' : 'Connect'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
