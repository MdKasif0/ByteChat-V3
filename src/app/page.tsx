'use client';

import Image from 'next/image';
import { Button } from '@/components/button';
import { ArrowUpRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function LandingPage() {
  const router = useRouter();

  return (
    <main className="relative h-screen w-screen bg-white">
      <Image
        src="/landing-page-cover.png"
        alt="Cute characters with smiling faces"
        fill
        objectFit="cover"
        quality={100}
        priority
        className="z-0"
        data-ai-hint="cute characters"
      />
      <div className="absolute inset-x-0 bottom-10 z-10 flex justify-center px-8">
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full max-w-sm"
        >
            <Button 
                onClick={() => router.push('/login')}
                className="w-full h-14 rounded-full text-lg font-semibold flex items-center justify-between px-2 bg-[#D58A7B] hover:bg-[#C97F71]"
            >
                <span className="pl-4">Let's get Started</span>
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                    <ArrowUpRight className="h-5 w-5" />
                </span>
            </Button>
        </motion.div>
      </div>
    </main>
  );
}
