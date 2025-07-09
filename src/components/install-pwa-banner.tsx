'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

interface BeforeInstallPromptEvent extends Event {
    readonly platforms: Array<string>;
    readonly userChoice: Promise<{
        outcome: 'accepted' | 'dismissed',
        platform: string
    }>;
    prompt(): Promise<void>;
}

export function InstallPwaBanner() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        
        deferredPrompt.prompt();
        
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            toast({ title: 'Installation successful!', description: 'ByteChat has been added to your home screen.' });
        } else {
             toast({ title: 'Installation dismissed.', description: 'You can install ByteChat later from the browser menu.' });
        }

        setDeferredPrompt(null);
    };

    return (
        <AnimatePresence>
            {deferredPrompt && (
                <motion.div
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -100, opacity: 0 }}
                    className="fixed top-4 left-4 right-4 z-50"
                >
                    <div className="bg-background/80 backdrop-blur-md rounded-xl p-4 shadow-lg flex items-center gap-4 border max-w-md mx-auto">
                        <img src="/bytechat-logo.png" alt="ByteChat Logo" className="h-12 w-12" />
                        <div className="flex-1">
                            <p className="font-bold">Install ByteChat App</p>
                            <p className="text-sm text-muted-foreground">Add to home screen for a better experience.</p>
                        </div>
                        <Button onClick={handleInstallClick}>
                            <Download className="mr-2 h-4 w-4" />
                            Install
                        </Button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
