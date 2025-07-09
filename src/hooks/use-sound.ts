'use client';
import { useEffect, useRef, useCallback } from 'react';

export const useSound = (src: string, { volume = 1, loop = false } = {}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // This effect manages the lifecycle of the audio element.
  // It runs only when the `src` changes, preventing re-creation on other prop changes.
  useEffect(() => {
    const audio = new Audio(src);
    audioRef.current = audio;

    return () => {
      // Cleanup: pause audio and clear the ref.
      audio.pause();
      audioRef.current = null;
    };
  }, [src]);

  // This effect synchronizes the volume and loop properties.
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.loop = loop;
    }
  }, [volume, loop]);

  const play = useCallback(() => {
    if (audioRef.current) {
      // The play() method returns a promise which should be handled.
      // We catch and ignore the 'AbortError' which is expected if `pause()` is called before `play()` completes.
      audioRef.current.play().catch(error => {
        if (error.name !== 'AbortError') {
          console.error('Audio play failed:', error);
        }
      });
    }
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, []);

  return { play, pause, stop };
};
