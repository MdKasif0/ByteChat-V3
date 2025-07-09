'use client';

import { LottieAnimation } from './lottie-animation';
import { motion } from 'framer-motion';

export function NoInternetView() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm"
        >
            <LottieAnimation
                src="https://lottie.host/embed/c1f54a80-1a28-44d4-8395-a18520868f9b/P2aYprkCHw.json"
                className="w-52 h-52"
            />
            <h2 className="text-xl font-bold mt-4">No Internet Connection</h2>
            <p className="text-muted-foreground">Please check your connection and try again.</p>
        </motion.div>
    );
}
