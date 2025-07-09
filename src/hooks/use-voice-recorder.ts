'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

// Helper function to generate a pseudo-random waveform for visualization
const generateWaveformData = (durationSeconds: number): number[] => {
    const bars = Math.min(Math.floor(durationSeconds * 2.5), 50); // ~2.5 bars per second, max 50
    return Array.from({ length: bars }, () => Math.random() * 0.8 + 0.2); // Random height between 0.2 and 1.0
};


export const useVoiceRecorder = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            mediaRecorderRef.current = recorder;
            audioChunksRef.current = [];
            setAudioBlob(null);

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            recorder.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
                setAudioBlob(blob);
                // Explicitly stop tracks on the stream that the recorder was using.
                if (recorder.stream) {
                    recorder.stream.getTracks().forEach(track => track.stop());
                }
            };
            
            recorder.start();
            setIsRecording(true);
            setRecordingTime(0);

            timerIntervalRef.current = setInterval(() => {
                setRecordingTime(prevTime => prevTime + 1);
            }, 1000);

        } catch (error) {
            console.error("Error starting recording:", error);
            // Consider showing a toast to the user
        }
    }, []);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
            }
            setIsRecording(false);
        }
    }, [isRecording]);

    const resetRecording = useCallback(() => {
        if (mediaRecorderRef.current?.state === "recording") {
            mediaRecorderRef.current.stop(); // onstop will clean up the tracks
        } else {
             // If not recording, but stream might be active, stop it manually.
            mediaRecorderRef.current?.stream?.getTracks().forEach(track => track.stop());
        }
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
        }
        setIsRecording(false);
        setRecordingTime(0);
        setAudioBlob(null);
        audioChunksRef.current = [];
    }, []);

    const getRecordingData = useCallback(() => {
        if (!audioBlob) return null;
        
        const file = new File([audioBlob], `voice-message-${Date.now()}.webm`, { type: audioBlob.type });
        const waveform = generateWaveformData(recordingTime);

        return {
            file,
            duration: recordingTime,
            waveform,
        };
    }, [audioBlob, recordingTime]);

    useEffect(() => {
        return () => {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
            }
             if (mediaRecorderRef.current?.stream) {
                mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            }
        }
    }, []);

    return { isRecording, recordingTime, audioBlob, startRecording, stopRecording, resetRecording, getRecordingData };
};
