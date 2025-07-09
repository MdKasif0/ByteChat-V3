'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { GoogleIcon } from "@/components/icons/google";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

export default function LoginPage() {
  const { signInWithGoogle } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleEmailSignIn = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth!, values.email, values.password);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Sign In Failed",
        description: error.message,
      });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleEmailSignUp = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
        await createUserWithEmailAndPassword(auth!, values.email, values.password);
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Sign Up Failed",
            description: error.message,
        });
    } finally {
        setIsSubmitting(false);
    }
  }

  const AuthForm = ({ type }: { type: 'signin' | 'signup' }) => (
    <Form {...form}>
        <form onSubmit={form.handleSubmit(type === 'signin' ? handleEmailSignIn : handleEmailSignUp)} className="grid gap-4">
            <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                            <Input placeholder="you@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <Button type="submit" className="w-full mt-4 h-11 text-base font-semibold" disabled={isSubmitting}>
                {isSubmitting ? 'Processing...' : (type === 'signin' ? 'Sign In' : 'Create Account')}
            </Button>
        </form>
    </Form>
  )

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted/20 p-4 font-body">
        <div className="w-full max-w-md space-y-6">
            <div className="text-center">
                <Image
                    src="/bytechat-logo.png"
                    alt="ByteChat Logo"
                    width={56}
                    height={56}
                    className="mx-auto mb-4"
                    data-ai-hint="logo chat"
                />
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                    Welcome to ByteChat
                </h1>
                <p className="mt-2 text-muted-foreground">
                    A new era of real-time communication.
                </p>
            </div>
            
            <Card className="overflow-hidden rounded-2xl border-none shadow-xl shadow-primary/5">
                <Tabs defaultValue="signin" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 rounded-none bg-muted/50 p-1 h-14">
                        <TabsTrigger value="signin" className="text-base rounded-lg h-full">Sign In</TabsTrigger>
                        <TabsTrigger value="signup" className="text-base rounded-lg h-full">Sign Up</TabsTrigger>
                    </TabsList>
                    <CardContent className="p-6 pt-8">
                        <TabsContent value="signin" className="m-0">
                            <AuthForm type="signin" />
                        </TabsContent>
                        <TabsContent value="signup" className="m-0">
                            <AuthForm type="signup" />
                        </TabsContent>
                    </CardContent>
                </Tabs>
            </Card>

            <div>
                <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-muted/20 px-2 text-muted-foreground">
                        Or continue with
                    </span>
                    </div>
                </div>
                <Button variant="outline" className="w-full h-12 text-base" onClick={signInWithGoogle} disabled={isSubmitting}>
                    <GoogleIcon className="mr-3 h-5 w-5" />
                    Sign in with Google
                </Button>
            </div>

        </div>
    </div>
  );
}