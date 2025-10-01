'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { VoiceRecorderState } from '@/types';

interface UseVoiceRecorderOptions {
    onSegmentReady: (audioBlob: Blob) => void;
    onLevelChange?: (level: number) => void;
    silenceThreshold?: number; // RMS threshold for silence detection
    silenceTimeout?: number; // Silence duration in ms before stopping segment
}

export function useVoiceRecorder({
    onSegmentReady,
    onLevelChange,
    silenceThreshold = 0.01,
    // Lower default silence timeout to reduce end-of-utterance latency
    // 350ms is a good balance for conversational UX; make configurable if needed
    silenceTimeout = 350,
}: UseVoiceRecorderOptions) {
    const [state, setState] = useState<VoiceRecorderState>({
        isListening: false,
        isProcessing: false,
        audioLevel: 0,
    });

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const animationFrameRef = useRef<number | undefined>(undefined);

    const stopSegment = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }

        if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
        }
    }, []);

    // TODO: Fine-tune VAD threshold based on your environment
    // Current threshold: 0.01 RMS - may need adjustment for different microphones
    const detectSilence = useCallback(() => {
        if (!analyserRef.current) return;

        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);

        // Calculate RMS (Root Mean Square) for volume level
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
            const amplitude = dataArray[i] / 255;
            sum += amplitude * amplitude;
        }
        const rms = Math.sqrt(sum / bufferLength);

        setState(prev => ({ ...prev, audioLevel: rms }));
        onLevelChange?.(rms);

        if (rms > silenceThreshold) {
            // Voice detected - clear silence timer
            if (silenceTimerRef.current) {
                clearTimeout(silenceTimerRef.current);
                silenceTimerRef.current = null;
            }
        } else {
            // Silence detected - start timer if not already running
            if (!silenceTimerRef.current) {
                silenceTimerRef.current = setTimeout(() => {
                    stopSegment();
                }, silenceTimeout);
            }
        }

        if (state.isListening) {
            animationFrameRef.current = requestAnimationFrame(detectSilence);
        }
    }, [silenceThreshold, silenceTimeout, state.isListening, onLevelChange, stopSegment]);

    const startRecording = useCallback(async () => {
        try {
            // Request microphone permission
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                }
            });

            streamRef.current = stream;

            // Set up audio context for VAD
            audioContextRef.current = new AudioContext();
            const source = audioContextRef.current.createMediaStreamSource(stream);
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 2048;
            source.connect(analyserRef.current);

            // TODO: Check browser support for different MIME types
            // Preferred formats for AssemblyAI compatibility
            let mimeType = 'audio/webm;codecs=opus';
            let options: MediaRecorderOptions = {};

            if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
                mimeType = 'audio/webm;codecs=opus';
            } else if (MediaRecorder.isTypeSupported('audio/webm')) {
                mimeType = 'audio/webm';
            } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
                mimeType = 'audio/mp4';
            } else if (MediaRecorder.isTypeSupported('audio/wav')) {
                mimeType = 'audio/wav';
            } else {
                // Fallback - let browser choose
                mimeType = '';
            }

            if (mimeType) {
                options = { mimeType };
            }

            console.log('Using MIME type:', mimeType || 'browser default');

            // Set up MediaRecorder
            const mediaRecorder = new MediaRecorder(stream, options);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                if (audioChunksRef.current.length > 0) {
                    const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
                    onSegmentReady(audioBlob);
                    audioChunksRef.current = [];
                }

                // Automatically start a new recording segment if still listening
                // Shorten restart delay to minimize gaps between segments
                if (state.isListening) {
                    setTimeout(() => {
                        if (state.isListening && mediaRecorderRef.current) {
                            mediaRecorderRef.current.start();
                        }
                    }, 10);
                }
            };

            mediaRecorder.start();
            setState(prev => ({ ...prev, isListening: true }));

            // Start VAD monitoring
            detectSilence();

        } catch (error) {
            console.error('Error starting recording:', error);
            throw error;
        }
    }, [state.isListening, onSegmentReady, detectSilence]);

    const stopRecording = useCallback(() => {
        setState(prev => ({ ...prev, isListening: false }));

        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }

        if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
        }

        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }

        analyserRef.current = null;
        mediaRecorderRef.current = null;
    }, []);

    const setProcessing = useCallback((processing: boolean) => {
        setState(prev => ({ ...prev, isProcessing: processing }));
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (state.isListening) {
                stopRecording();
            }
        };
    }, [state.isListening, stopRecording]);

    return {
        ...state,
        startRecording,
        stopRecording,
        setProcessing,
    };
}