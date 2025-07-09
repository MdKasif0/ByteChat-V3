'use client';

import React, { useState, useEffect } from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Button } from '@/components/ui/button';
import { MessageCircle, Phone, Settings, Zap } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const onboardingSlides = [
    {
        icon: Zap,
        title: "Welcome to ByteChat",
        description: "The fast, secure, and modern way to connect with your friends and colleagues.",
    },
    {
        icon: MessageCircle,
        title: "Real-time Messaging",
        description: "Enjoy seamless conversations with typing indicators, read receipts, and emoji reactions.",
    },
    {
        icon: Phone,
        title: "HD Voice & Video Calls",
        description: "Connect face-to-face with high-quality, secure, and reliable peer-to-peer calls.",
    },
    {
        icon: Settings,
        title: "Fully Customizable",
        description: "Personalize your experience with custom themes, chat wallpapers, and user profiles.",
    },
];

type OnboardingWizardProps = {
    onComplete: () => void;
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
    const [api, setApi] = useState<CarouselApi>()
    const [current, setCurrent] = useState(0)
    const [count, setCount] = useState(0)

    useEffect(() => {
        if (!api) return;
        setCount(api.scrollSnapList().length)
        setCurrent(api.selectedScrollSnap())
        api.on("select", () => {
            setCurrent(api.selectedScrollSnap())
        })
    }, [api]);

    const handleNext = () => {
        if (current === count - 1) {
            onComplete();
        } else {
            api?.scrollNext();
        }
    }

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <div className="w-full max-w-md mx-auto text-center">
                    <Carousel setApi={setApi} className="w-full">
                        <CarouselContent>
                            {onboardingSlides.map((slide, index) => {
                                const Icon = slide.icon;
                                return (
                                    <CarouselItem key={index}>
                                        <div className="p-8 flex flex-col items-center justify-center h-[28rem]">
                                            <motion.div 
                                                className="mb-8 bg-primary/10 text-primary p-5 rounded-full shadow-lg shadow-primary/20"
                                                initial={{ scale: 0.5, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 20 }}
                                            >
                                               <Icon className="h-14 w-14" />
                                            </motion.div>
                                            <h2 className="text-3xl font-bold font-headline mb-3">{slide.title}</h2>
                                            <p className="text-muted-foreground text-base max-w-xs">{slide.description}</p>
                                        </div>
                                    </CarouselItem>
                                )
                            })}
                        </CarouselContent>
                    </Carousel>

                    <div className="flex items-center justify-center gap-2 my-4">
                        {Array(count).fill(0).map((_, i) => (
                            <button
                                key={i}
                                onClick={() => api?.scrollTo(i)}
                                className={`h-2 rounded-full transition-all duration-300 ${current === i ? 'w-6 bg-primary' : 'w-2 bg-muted'}`}
                                aria-label={`Go to slide ${i + 1}`}
                            />
                        ))}
                    </div>

                    <Button onClick={handleNext} className="w-full h-12 text-base font-semibold" size="lg">
                        {current === count - 1 ? "Get Started" : "Next"}
                    </Button>
                </div>
            </motion.div>
        </AnimatePresence>
    )
}
