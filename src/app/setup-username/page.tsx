'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useAuth, UserProfile } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import {
  doc,
  setDoc,
  query,
  collection,
  where,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { Logo } from '@/components/icons/logo';

const usernameSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }).max(50),
  username: z
    .string()
    .min(3, { message: 'Username must be at least 3 characters.' })
    .max(20)
    .regex(/^[a-zA-Z0-9_.-]+$/, {
      message: 'Username can only contain letters, numbers, underscore, dot, or hyphen.',
    }),
});

async function isUsernameUnique(username: string): Promise<boolean> {
  const q = query(collection(db!, 'users'), where('username', '==', username));
  const querySnapshot = await getDocs(q);
  return querySnapshot.empty;
}

export default function SetupUsernamePage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof usernameSchema>>({
    resolver: zodResolver(usernameSchema),
    defaultValues: {
      name: user?.displayName || '',
      username: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof usernameSchema>) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'You must be logged in to set up a profile.',
      });
      return;
    }
    setIsSubmitting(true);

    const isUnique = await isUsernameUnique(values.username);
    if (!isUnique) {
      form.setError('username', {
        type: 'manual',
        message: 'This username is already taken.',
      });
      setIsSubmitting(false);
      return;
    }

    const userProfile: UserProfile = {
      uid: user.uid,
      email: user.email,
      name: values.name,
      username: values.username,
      peerId: values.username,
      avatar: user.photoURL || null,
      status: 'online',
      customStatus: 'Available',
      lastSeen: serverTimestamp(),
    };

    try {
      await setDoc(doc(db!, 'users', user.uid), userProfile);
      toast({
        title: 'Profile Created!',
        description: 'Your profile has been successfully set up.',
      });
      router.push('/chat');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create your profile. Please try again.',
      });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <Logo className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl font-headline">One last step...</CardTitle>
          <CardDescription>
            Choose a display name and a unique username to start chatting.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid gap-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Display Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="John Doe" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="username"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Username</FormLabel>
                                <FormControl>
                                    <Input placeholder="john_doe" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : 'Save and Continue'}
                    </Button>
                </form>
            </Form>
        </CardContent>
        <CardFooter className="justify-center">
             <Button variant="link" size="sm" onClick={signOut}>
                Sign Out
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
