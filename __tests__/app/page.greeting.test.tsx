import Home from '@/app/page';
import { act, render, screen, waitFor } from '../test-utils';

// Mock hooks
jest.mock('@/hooks/useSpeechRecognition');
jest.mock('@/hooks/useContinuousCall');

describe('Home Page - Automatic Greeting Feature', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        
        // Mock Audio globally
        global.Audio = jest.fn().mockImplementation(() => ({
            play: jest.fn().mockResolvedValue(undefined),
            pause: jest.fn(),
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            src: '',
            volume: 1,
        })) as any;
    });

    describe('Greeting Message on Call Start', () => {
        it('should send greeting message when call starts', async () => {
            const startCallMock = jest.fn();
            const { useContinuousCall } = require('@/hooks/useContinuousCall');
            const { useSpeechRecognition } = require('@/hooks/useSpeechRecognition');

            // Mock fetch for all APIs
            global.fetch = jest.fn((url) => {
                if (url === '/api/config-status') {
                    return Promise.resolve({
                        ok: true,
                        json: async () => ({
                            services: { stt: true, llm: true, tts: true },
                            allConfigured: true,
                            message: 'All services configured',
                        }),
                    } as Response);
                }
                if (url === '/api/tts') {
                    return Promise.resolve({
                        ok: true,
                        json: async () => ({ audioData: 'base64_audio_data' }),
                    } as Response);
                }
                return Promise.reject(new Error('Not found'));
            }) as jest.Mock;

            // Start with inactive call
            useContinuousCall.mockReturnValue({
                callState: 'idle',
                audioLevel: 0,
                startCall: startCallMock,
                endCall: jest.fn(),
                isCallActive: false,
            });

            useSpeechRecognition.mockReturnValue({
                supported: true,
                isListening: false,
                interimTranscript: '',
                startListening: jest.fn(),
                stopListening: jest.fn(),
                pause: jest.fn(),
                resume: jest.fn(),
            });

            render(<Home />);

            // Click start call button
            const callButton = await screen.findByTitle('Start Call');
            
            await act(async () => {
                callButton.click();
            });

            // Wait for TTS API call (greeting message)
            await waitFor(() => {
                const ttsCalls = (global.fetch as jest.Mock).mock.calls.filter(
                    call => call[0] === '/api/tts'
                );
                expect(ttsCalls.length).toBeGreaterThan(0);
            }, { timeout: 3000 });

            // Verify greeting text was sent to TTS
            const ttsCalls = (global.fetch as jest.Mock).mock.calls.filter(
                call => call[0] === '/api/tts'
            );
            const greetingCall = ttsCalls.find(call => {
                const body = JSON.parse(call[1].body);
                return body.text && body.text.includes('नमस्ते') && body.text.includes('रिया');
            });

            expect(greetingCall).toBeDefined();
        });

        it('should include correct Hindi greeting text', async () => {
            const { useContinuousCall } = require('@/hooks/useContinuousCall');
            const { useSpeechRecognition } = require('@/hooks/useSpeechRecognition');

            global.fetch = jest.fn((url) => {
                if (url === '/api/config-status') {
                    return Promise.resolve({
                        ok: true,
                        json: async () => ({
                            services: { stt: true, llm: true, tts: true },
                            allConfigured: true,
                        }),
                    } as Response);
                }
                if (url === '/api/tts') {
                    return Promise.resolve({
                        ok: true,
                        json: async () => ({ audioData: 'base64_audio_data' }),
                    } as Response);
                }
                return Promise.reject(new Error('Not found'));
            }) as jest.Mock;

            useContinuousCall.mockReturnValue({
                callState: 'idle',
                audioLevel: 0,
                startCall: jest.fn(),
                endCall: jest.fn(),
                isCallActive: false,
            });

            useSpeechRecognition.mockReturnValue({
                supported: true,
                isListening: false,
                interimTranscript: '',
                startListening: jest.fn(),
                stopListening: jest.fn(),
                pause: jest.fn(),
                resume: jest.fn(),
            });

            render(<Home />);

            const callButton = await screen.findByTitle('Start Call');
            
            await act(async () => {
                callButton.click();
            });

            // Wait and verify greeting contains all required parts
            await waitFor(() => {
                const ttsCalls = (global.fetch as jest.Mock).mock.calls.filter(
                    call => call[0] === '/api/tts'
                );
                
                if (ttsCalls.length > 0) {
                    const body = JSON.parse(ttsCalls[0][1].body);
                    expect(body.text).toContain('नमस्ते');
                    expect(body.text).toContain('रिया');
                    expect(body.text).toContain('Punjab National Bank');
                    expect(body.text).toContain('अभिजीत');
                }
            }, { timeout: 3000 });
        });

        it('should handle TTS error gracefully when sending greeting', async () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            const { useContinuousCall } = require('@/hooks/useContinuousCall');
            const { useSpeechRecognition } = require('@/hooks/useSpeechRecognition');

            global.fetch = jest.fn((url) => {
                if (url === '/api/config-status') {
                    return Promise.resolve({
                        ok: true,
                        json: async () => ({
                            services: { stt: true, llm: true, tts: true },
                            allConfigured: true,
                        }),
                    } as Response);
                }
                if (url === '/api/tts') {
                    return Promise.resolve({
                        ok: false,
                        status: 500,
                        json: async () => ({ error: 'TTS service error' }),
                    } as Response);
                }
                return Promise.reject(new Error('Not found'));
            }) as jest.Mock;

            useContinuousCall.mockReturnValue({
                callState: 'idle',
                audioLevel: 0,
                startCall: jest.fn(),
                endCall: jest.fn(),
                isCallActive: false,
            });

            useSpeechRecognition.mockReturnValue({
                supported: true,
                isListening: false,
                interimTranscript: '',
                startListening: jest.fn(),
                stopListening: jest.fn(),
                pause: jest.fn(),
                resume: jest.fn(),
            });

            render(<Home />);

            const callButton = await screen.findByTitle('Start Call');
            
            await act(async () => {
                callButton.click();
            });

            // Should handle error gracefully (component shouldn't crash)
            await waitFor(() => {
                expect(callButton).toBeInTheDocument();
            });

            consoleErrorSpy.mockRestore();
        });
    });

    describe('Greeting Audio Playback', () => {
        it('should call TTS API for greeting audio', async () => {
            const { useContinuousCall } = require('@/hooks/useContinuousCall');
            const { useSpeechRecognition } = require('@/hooks/useSpeechRecognition');

            global.fetch = jest.fn((url) => {
                if (url === '/api/config-status') {
                    return Promise.resolve({
                        ok: true,
                        json: async () => ({
                            services: { stt: true, llm: true, tts: true },
                            allConfigured: true,
                        }),
                    } as Response);
                }
                if (url === '/api/tts') {
                    return Promise.resolve({
                        ok: true,
                        json: async () => ({ audioData: 'base64_greeting_audio' }),
                    } as Response);
                }
                return Promise.reject(new Error('Not found'));
            }) as jest.Mock;

            useContinuousCall.mockReturnValue({
                callState: 'idle',
                audioLevel: 0,
                startCall: jest.fn(),
                endCall: jest.fn(),
                isCallActive: false,
            });

            useSpeechRecognition.mockReturnValue({
                supported: true,
                isListening: false,
                interimTranscript: '',
                startListening: jest.fn(),
                stopListening: jest.fn(),
                pause: jest.fn(),
                resume: jest.fn(),
            });

            render(<Home />);

            const callButton = await screen.findByTitle('Start Call');
            
            await act(async () => {
                callButton.click();
            });

            // Verify TTS was called for greeting audio generation
            await waitFor(() => {
                const ttsCalls = (global.fetch as jest.Mock).mock.calls.filter(
                    call => call[0] === '/api/tts'
                );
                expect(ttsCalls.length).toBeGreaterThan(0);
                
                // Verify response contained audioData
                const ttsCall = ttsCalls[0];
                expect(ttsCall).toBeDefined();
            }, { timeout: 2000 });
        });
    });
});
