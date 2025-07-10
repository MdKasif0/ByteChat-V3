
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, updateDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { useRouter, usePathname } from 'next/navigation';
import { auth, db, firebaseInitialized, messaging, firebaseConfig } from '@/lib/firebase';
import { AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PeerProvider, usePeer } from './peer-context';
import { CallView } from '@/components/call/call-view';
import { IncomingCallDialog } from '@/components/call/incoming-call-dialog';
import { AnimatePresence } from 'framer-motion';
import { NoInternetView } from '@/components/no-internet-view';
import { LoadingScreen } from '@/components/loading-screen';
import { getToken, onMessage } from 'firebase/messaging';
import { useToast } from '@/hooks/use-toast';

export interface UserProfile {
  uid: string;
  email: string | null;
  name: string;
  username: string;
  peerId: string;
  avatar?: string | null;
  status?: 'online' | 'offline';
  customStatus?: string;
  lastSeen?: any; // Firestore Timestamp
  wallpaper?: string | null;
  fcmToken?: string;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isOnline: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const publicRoutes = ['/login', '/'];
const setupRoute = '/setup-username';

function MissingEnvVarsMessage() {
    return (
        <div className="flex h-screen items-center justify-center bg-background p-4">
            <Card className="w-full max-w-lg">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                        <AlertTriangle className="h-6 w-6 text-destructive" />
                    </div>
                    <CardTitle className="text-2xl font-headline">Configuration Error</CardTitle>
                    <CardDescription>
                        Your Firebase environment variables are not set correctly.
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-sm">
                    <p>Please follow these steps to resolve the issue:</p>
                    <ol className="mt-3 list-inside list-decimal space-y-2 rounded-md border bg-muted/50 p-4">
                        <li>In the file explorer, find the <code>.env.local.example</code> file.</li>
                        <li>Create a copy of this file and rename it to <code>.env.local</code>.</li>
                        <li>Open <code>.env.local</code> and fill in your project credentials from the Firebase Console.</li>
                        <li>After saving the file, restart the development server.</li>
                    </ol>
                </CardContent>
            </Card>
        </div>
    )
}

function AppWithCallUI({ children, isOnline }: { children: React.ReactNode, isOnline: boolean }) {
    const { callInProgress } = usePeer();
    
    return (
        <>
            <AnimatePresence>
                {!isOnline && <NoInternetView />}
            </AnimatePresence>
            {children}
            <IncomingCallDialog />
            {callInProgress && <CallView />}
        </>
    )
}

export function AuthProvider({ children }: { children: ReactNode }) {
    if (!firebaseInitialized) {
        return <MissingEnvVarsMessage />;
    }

  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    let unsubProfile: (() => void) | undefined;
    const unsubscribe = onAuthStateChanged(auth!, async (firebaseUser) => {
      if (unsubProfile) unsubProfile();

      if (firebaseUser) {
        setUser(firebaseUser);
        const userDocRef = doc(db!, 'users', firebaseUser.uid);
        
        unsubProfile = onSnapshot(userDocRef, (doc) => {
          if (doc.exists()) {
            const profile = { uid: doc.id, ...doc.data() } as UserProfile;
            setUserProfile(profile);
            if (['/login', setupRoute, '/'].includes(pathname)) {
              router.push('/chat');
            }
          } else {
            setUserProfile(null);
            if (pathname !== setupRoute) {
              router.push(setupRoute);
            }
          }
        });
        
      } else {
        setUser(null);
        setUserProfile(null);
        if (!publicRoutes.includes(pathname) && pathname !== setupRoute) {
          router.push('/');
        }
      }
      setLoading(false);
    });

    return () => {
        unsubscribe();
        if (unsubProfile) unsubProfile();
    };
  }, [pathname, router]);

  // Handle FCM Token and foreground messages
  useEffect(() => {
      if (!messaging || !userProfile || typeof window === 'undefined') return;
      
      const setupNotifications = async () => {
          try {
              // Pass config to service worker
              navigator.serviceWorker.ready.then((registration) => {
                registration.active?.postMessage({
                  type: 'SET_FIREBASE_CONFIG',
                  config: firebaseConfig
                });
              });

              const permission = await Notification.requestPermission();
              if (permission === 'granted') {
                  const fcmToken = await getToken(messaging, {
                      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
                  });

                  if (fcmToken && fcmToken !== userProfile.fcmToken) {
                      const userDocRef = doc(db!, 'users', userProfile.uid);
                      await setDoc(userDocRef, { fcmToken }, { merge: true });
                  }
              }
          } catch (error) {
              console.error('Error getting FCM token:', error);
              toast({ variant: 'destructive', title: 'Notification Error', description: 'Could not set up push notifications.' });
          }
      };

      setupNotifications();

      const unsubscribeOnMessage = onMessage(messaging, (payload) => {
          console.log("Foreground message received:", payload);
          toast({
              title: payload.data?.title,
              description: payload.data?.body,
          });
      });

      return () => {
          unsubscribeOnMessage();
      };
  }, [userProfile, toast]);

    // This is the new, consolidated useEffect for presence management.
    useEffect(() => {
        // Only run presence logic if a user is logged in.
        if (!user) return;

        const userDocRef = doc(db!, 'users', user.uid);

        const updateUserStatus = (isOnlineValue: boolean) => {
            // Update the UI state for the "No Internet" banner
            setIsOnline(isOnlineValue);

            // Update Firestore with the user's status
            updateDoc(userDocRef, {
                status: isOnlineValue ? 'online' : 'offline',
                lastSeen: serverTimestamp(),
            }).catch(err => {
                // This can happen on page unload, it's a best-effort update.
                // We don't need to show an error to the user here.
            });
        };
        
        // Initial check when the component mounts
        updateUserStatus(navigator.onLine);

        // Listeners for browser network and visibility events
        const handleOnline = () => updateUserStatus(true);
        const handleOffline = () => updateUserStatus(false);
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                updateUserStatus(true);
            } else {
                updateUserStatus(false);
            }
        };

        const handleBeforeUnload = () => updateUserStatus(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        // beforeunload is a best-effort attempt for tab/browser close
        window.addEventListener('beforeunload', handleBeforeUnload);


        return () => {
            // Set offline status on unmount (e.g., component cleanup or user signs out)
            if (auth?.currentUser) { // Check if user is still logged in during cleanup
                updateUserStatus(false);
            }
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [user]); // Re-run this effect if the user changes.


  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth!, provider);
    } catch (error) {
      console.error("Error signing in with Google", error);
    }
  };

  const signOut = async () => {
    if (user) {
        try {
            await updateDoc(doc(db!, 'users', user.uid), {
                status: 'offline',
                lastSeen: serverTimestamp(),
                fcmToken: '', // Clear FCM token on sign out
            });
        } catch (error) {
            console.error("Failed to set user offline on sign out", error);
        }
    }
    await firebaseSignOut(auth!);
  };

  const value = { user, userProfile, loading, isOnline, signInWithGoogle, signOut };

  if (loading) {
    return <LoadingScreen />;
  }
  
  if (user && ['/', '/login'].includes(pathname)) {
    return <LoadingScreen />;
  }

  const isPublic = publicRoutes.includes(pathname);
  if (!user && !isPublic && pathname !== setupRoute) {
    return <LoadingScreen />;
  }

  if (user && !userProfile && pathname !== setupRoute) {
    return <LoadingScreen />;
  }

  return (
    <AuthContext.Provider value={value}>
        <PeerProvider>
            <AppWithCallUI isOnline={isOnline}>
                {children}
            </AppWithCallUI>
        </PeerProvider>
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
