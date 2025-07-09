'use client';

import { Pause, Play } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';

interface AudioPlayerProps {
    blobUrl: string;
    waveform: number[];
    duration: number;
    isMe: boolean;
}

const formatTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export function AudioPlayer({ blobUrl, waveform, duration, isMe }: AudioPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        const audio = new Audio(blobUrl);
        audioRef.current = audio;

        const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
        const handleEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
        };
        
        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('ended', handleEnded);

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
            }
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('ended', handleEnded);
        };
    }, [blobUrl]);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
    const remainingTime = duration - currentTime;

    return (
        <div className="flex items-center gap-2 w-64 text-sm">
            <Button
                size="icon"
                variant="ghost"
                className={cn(
                    "h-10 w-10 rounded-full shrink-0 border",
                    isMe 
                        ? "bg-white/10 text-primary-foreground hover:bg-white/20 border-white/20"
                        : "bg-background/50 text-card-foreground hover:bg-background/80 border-border"
                )}
                onClick={togglePlay}
            >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 fill-current" />}
            </Button>
            <div className="flex-1 flex items-center gap-1 h-8 relative">
                {/* Waveform background */}
                <div className="flex items-end gap-0.5 w-full h-full">
                    {(waveform || []).map((bar, index) => (
                        <div
                            key={index}
                            className={cn("w-1 rounded-full", isMe ? "bg-primary-foreground/30" : "bg-foreground/20")}
                            style={{ height: `${bar * 100}%` }}
                        />
                    ))}
                </div>
                 {/* Waveform progress */}
                 <div className="absolute inset-0 flex items-end gap-0.5 w-full h-full overflow-hidden" style={{ width: `${progress}%`}}>
                    <div className="flex items-end gap-0.5 w-64 h-full">
                        {(waveform || []).map((bar, index) => (
                            <div
                                key={index}
                                className={cn("w-1 rounded-full", isMe ? "bg-primary-foreground" : "bg-foreground/80")}
                                style={{ height: `${bar * 100}%` }}
                            />
                        ))}
                    </div>
                 </div>
            </div>
            <span className="font-mono tabular-nums w-12 text-right text-xs text-muted-foreground">
                {formatTime(isPlaying ? remainingTime : duration)}
            </span>
        </div>
    );
}
