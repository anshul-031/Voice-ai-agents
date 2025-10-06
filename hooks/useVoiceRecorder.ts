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
    silenceThreshold = 0.005, // Lowered from 0.01 to be more sensitive
    // Increased silence timeout to allow for more natural pauses in speech
    // 750ms gives more time before stopping the recording
    silenceTimeout = 750,
}: UseVoiceRecorderOptions) {
    console.log('[useVoiceRecorder] Hook initialized with:', { silenceThreshold, silenceTimeout });
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
    const isListeningRef = useRef<boolean>(false); // Add ref to track listening state without causing re-renders

    const stopSegment = useCallback(() => {
        console.log('[useVoiceRecorder] stopSegment called');

        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            console.log('[useVoiceRecorder] Stopping MediaRecorder...');
            mediaRecorderRef.current.stop();
        } else {
            console.log('[useVoiceRecorder] MediaRecorder not recording, state:', mediaRecorderRef.current?.state);
        }

        if (silenceTimerRef.current) {
            console.log('[useVoiceRecorder] Clearing silence timer');
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
        }
    }, []);

    // TODO: Fine-tune VAD threshold based on your environment
    // Current threshold: 0.01 RMS - may need adjustment for different microphones
    const detectSilence = useCallback(() => {
        if (!analyserRef.current) {
            console.log('[useVoiceRecorder] detectSilence: analyser not available');
            return;
        }

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

        // Log audio levels more frequently to help with debugging (every ~500ms = 2% of frames at 60fps)
        if (Math.random() < 0.05) {
            console.log(`[useVoiceRecorder] Audio level: ${rms.toFixed(4)}, Threshold: ${silenceThreshold}, isListening: ${isListeningRef.current}`);
        }

        if (rms > silenceThreshold) {
            // Voice detected - clear silence timer
            if (silenceTimerRef.current) {
                clearTimeout(silenceTimerRef.current);
                silenceTimerRef.current = null;
                console.log('[useVoiceRecorder] Voice detected, cleared silence timer');
            }
        } else {
            // Silence detected - start timer if not already running
            if (!silenceTimerRef.current) {
                console.log('[useVoiceRecorder] Silence detected, starting timer');
                silenceTimerRef.current = setTimeout(() => {
                    console.log('[useVoiceRecorder] Silence timeout reached, stopping segment');
                    stopSegment();
                }, silenceTimeout);
            }
        }

        // Use ref instead of state to avoid stale closures
        if (isListeningRef.current) {
            animationFrameRef.current = requestAnimationFrame(detectSilence);
        } else {
            console.log('[useVoiceRecorder] Stopping VAD monitoring, isListening is false');
        }
    }, [silenceThreshold, silenceTimeout, onLevelChange, stopSegment]);

    const startRecording = useCallback(async () => {
        console.log('[useVoiceRecorder] startRecording called');

        try {
            console.log('[useVoiceRecorder] Requesting microphone access...');
            // Request microphone permission with optimized audio settings
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    channelCount: 1, // Mono audio for better STT performance
                    sampleRate: 44100, // Standard sample rate
                    // Try to get a high-quality audio track
                    deviceId: undefined // Let the user choose or use default
                }
            });

            console.log('[useVoiceRecorder] Microphone access granted');
            console.log('[useVoiceRecorder] Audio tracks:', stream.getAudioTracks().map(t => ({
                label: t.label,
                enabled: t.enabled,
                muted: t.muted,
                settings: t.getSettings()
            })));

            streamRef.current = stream;

            // Set up audio context for VAD
            console.log('[useVoiceRecorder] Setting up AudioContext and Analyser...');
            audioContextRef.current = new AudioContext();
            const source = audioContextRef.current.createMediaStreamSource(stream);
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 2048;
            source.connect(analyserRef.current);
            console.log('[useVoiceRecorder] AudioContext state:', audioContextRef.current.state);

            // TODO: Check browser support for different MIME types
            // Preferred formats for AssemblyAI compatibility
            let mimeType = 'audio/webm;codecs=opus';
            let options: MediaRecorderOptions = {};

            console.log('[useVoiceRecorder] Checking supported MIME types...');
            if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
                mimeType = 'audio/webm;codecs=opus';
                console.log('[useVoiceRecorder] Using audio/webm;codecs=opus');
            } else if (MediaRecorder.isTypeSupported('audio/webm')) {
                mimeType = 'audio/webm';
                console.log('[useVoiceRecorder] Using audio/webm');
            } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
                mimeType = 'audio/mp4';
                console.log('[useVoiceRecorder] Using audio/mp4');
            } else if (MediaRecorder.isTypeSupported('audio/wav')) {
                mimeType = 'audio/wav';
                console.log('[useVoiceRecorder] Using audio/wav');
            } else {
                // Fallback - let browser choose
                mimeType = '';
                console.log('[useVoiceRecorder] Using browser default MIME type');
            }

            if (mimeType) {
                options = { mimeType };
            }

            console.log('[useVoiceRecorder] Final MIME type:', mimeType || 'browser default');

            // Set up MediaRecorder
            console.log('[useVoiceRecorder] Creating MediaRecorder...');
            const mediaRecorder = new MediaRecorder(stream, options);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                console.log('[useVoiceRecorder] Data available, size:', event.data.size, 'bytes');
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                console.log('[useVoiceRecorder] MediaRecorder stopped');
                console.log('[useVoiceRecorder] Audio chunks collected:', audioChunksRef.current.length);

                if (audioChunksRef.current.length > 0) {
                    const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
                    console.log('[useVoiceRecorder] Created audio blob, size:', audioBlob.size, 'bytes');
                    console.log('[useVoiceRecorder] Calling onSegmentReady callback...');
                    onSegmentReady(audioBlob);
                    audioChunksRef.current = [];
                }

                // Automatically start a new recording segment if still listening
                // Shorten restart delay to minimize gaps between segments
                if (isListeningRef.current) {
                    console.log('[useVoiceRecorder] Still listening, restarting MediaRecorder in 10ms...');
                    setTimeout(() => {
                        if (isListeningRef.current && mediaRecorderRef.current) {
                            console.log('[useVoiceRecorder] Restarting MediaRecorder...');
                            mediaRecorderRef.current.start();
                        }
                    }, 10);
                } else {
                    console.log('[useVoiceRecorder] Not listening anymore, not restarting');
                }
            };

            mediaRecorder.onerror = (event) => {
                console.error('[useVoiceRecorder] MediaRecorder error:', event);
            };

            mediaRecorder.onstart = () => {
                console.log('[useVoiceRecorder] MediaRecorder started');
            };

            console.log('[useVoiceRecorder] Starting MediaRecorder...');
            mediaRecorder.start();

            // Update both state and ref
            setState(prev => ({ ...prev, isListening: true }));
            isListeningRef.current = true;
            console.log('[useVoiceRecorder] isListening set to true');

            // Start VAD monitoring
            console.log('[useVoiceRecorder] Starting VAD (Voice Activity Detection) monitoring...');
            detectSilence();

        } catch (error) {
            console.error('[useVoiceRecorder] Error starting recording:', error);
            isListeningRef.current = false;
            throw error;
        }
    }, [onSegmentReady, detectSilence]);

    const stopRecording = useCallback(() => {
        console.log('[useVoiceRecorder] stopRecording called');

        // Update both state and ref
        setState(prev => ({ ...prev, isListening: false }));
        isListeningRef.current = false;
        console.log('[useVoiceRecorder] isListening set to false');

        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            console.log('[useVoiceRecorder] Stopping MediaRecorder...');
            mediaRecorderRef.current.stop();
        }

        if (silenceTimerRef.current) {
            console.log('[useVoiceRecorder] Clearing silence timer');
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
        }

        if (animationFrameRef.current) {
            console.log('[useVoiceRecorder] Cancelling animation frame');
            cancelAnimationFrame(animationFrameRef.current);
        }

        if (streamRef.current) {
            console.log('[useVoiceRecorder] Stopping media stream tracks');
            streamRef.current.getTracks().forEach(track => {
                console.log('[useVoiceRecorder] Stopping track:', track.label);
                track.stop();
            });
            streamRef.current = null;
        }

        if (audioContextRef.current) {
            console.log('[useVoiceRecorder] Closing AudioContext, state:', audioContextRef.current.state);
            audioContextRef.current.close();
            audioContextRef.current = null;
        }

        analyserRef.current = null;
        mediaRecorderRef.current = null;
        console.log('[useVoiceRecorder] Recording stopped and cleaned up');
    }, []);

    const setProcessing = useCallback((processing: boolean) => {
        setState(prev => ({ ...prev, isProcessing: processing }));
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            console.log('[useVoiceRecorder] Component unmounting, cleaning up...');
            if (isListeningRef.current) {
                stopRecording();
            }
        };
    }, [stopRecording]);

    return {
        ...state,
        startRecording,
        stopRecording,
        setProcessing,
    };
}