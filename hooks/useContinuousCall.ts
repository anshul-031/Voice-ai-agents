'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type CallState = 'idle' | 'connecting' | 'active' | 'ending';

interface UseContinuousCallOptions {
    onAudioLevelChange?: (level: number) => void;
}

interface UseContinuousCallReturn {
    callState: CallState;
    audioLevel: number;
    startCall: () => Promise<void>;
    endCall: () => void;
    isCallActive: boolean;
}

/**
 * Hook for managing continuous phone-call-like audio recording
 * Unlike useVoiceRecorder, this keeps recording active until explicitly ended
 * No silence detection or automatic stopping - user controls the call lifecycle
 */
export function useContinuousCall({
    onAudioLevelChange,
}: UseContinuousCallOptions): UseContinuousCallReturn {
    const [callState, setCallState] = useState<CallState>('idle');
    const [audioLevel, setAudioLevel] = useState(0);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const animationFrameRef = useRef<number | undefined>(undefined);
    const isActiveRef = useRef<boolean>(false);

    // Monitor audio levels continuously
    const monitorAudioLevel = useCallback(() => {
        if (!analyserRef.current || !isActiveRef.current) {
            return;
        }

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteTimeDomainData(dataArray);

        // Calculate RMS (Root Mean Square) for audio level
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
            const normalized = (dataArray[i] - 128) / 128;
            sum += normalized * normalized;
        }
        const rms = Math.sqrt(sum / dataArray.length);

        setAudioLevel(rms);
        onAudioLevelChange?.(rms);

        // Continue monitoring
        if (isActiveRef.current) {
            animationFrameRef.current = requestAnimationFrame(monitorAudioLevel);
        }
    }, [onAudioLevelChange]);

    // Start the call
    const startCall = useCallback(async () => {
        console.log('[useContinuousCall] Starting call...');

        if (isActiveRef.current) {
            console.log('[useContinuousCall] Call already active');
            return;
        }

        try {
            setCallState('connecting');

            // Request microphone access with optimized settings
            console.log('[useContinuousCall] Requesting microphone access...');
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    channelCount: 1,
                    sampleRate: 44100,
                },
            });

            console.log('[useContinuousCall] Microphone access granted');
            streamRef.current = stream;

            // Set up audio context for level monitoring
            audioContextRef.current = new AudioContext();
            const source = audioContextRef.current.createMediaStreamSource(stream);
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 2048;
            source.connect(analyserRef.current);

            // Set up media recorder for continuous recording
            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                ? 'audio/webm;codecs=opus'
                : MediaRecorder.isTypeSupported('audio/webm')
                    ? 'audio/webm'
                    : 'audio/mp4';

            console.log('[useContinuousCall] Using MIME type:', mimeType);

            mediaRecorderRef.current = new MediaRecorder(stream, {
                mimeType,
                audioBitsPerSecond: 128000,
            });

            // Note: We don't need to handle dataavailable or stop events
            // The continuous recording is managed by the real-time STT hook
            // This just keeps the microphone active

            mediaRecorderRef.current.start();
            isActiveRef.current = true;
            setCallState('active');

            // Start monitoring audio levels
            monitorAudioLevel();

            console.log('[useContinuousCall] Call started successfully');

        } catch (error) {
            console.error('[useContinuousCall] Failed to start call:', error);
            setCallState('idle');
            isActiveRef.current = false;

            // Clean up on error
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }

            throw error;
        }
    }, [monitorAudioLevel]);

    // End the call
    const endCall = useCallback(() => {
        console.log('[useContinuousCall] Ending call...');

        if (!isActiveRef.current) {
            console.log('[useContinuousCall] No active call to end');
            return;
        }

        setCallState('ending');
        isActiveRef.current = false;

        // Stop animation frame
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = undefined;
        }

        // Stop media recorder
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current = null;
        }

        // Stop all audio tracks
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => {
                track.stop();
                console.log('[useContinuousCall] Stopped track:', track.label);
            });
            streamRef.current = null;
        }

        // Close audio context
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }

        analyserRef.current = null;
        setAudioLevel(0);
        setCallState('idle');

        console.log('[useContinuousCall] Call ended successfully');
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (isActiveRef.current) {
                endCall();
            }
        };
    }, [endCall]);

    return {
        callState,
        audioLevel,
        startCall,
        endCall,
        isCallActive: callState === 'active',
    };
}
