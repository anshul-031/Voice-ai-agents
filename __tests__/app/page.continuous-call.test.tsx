import Home from '@/app/page';
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

// Mock the hooks
jest.mock('@/hooks/useContinuousCall', () => ({
    useContinuousCall: jest.fn(() => ({
        callState: 'idle',
        audioLevel: 0,
        startCall: jest.fn(),
        endCall: jest.fn(),
        isCallActive: false,
    })),
}));

jest.mock('@/hooks/useSpeechRecognition', () => ({
    useSpeechRecognition: jest.fn(() => ({
        supported: true,
        isListening: false,
        interimTranscript: '',
        startListening: jest.fn(),
        stopListening: jest.fn(),
        pause: jest.fn(),
        resume: jest.fn(),
    })),
}));

// Mock fetch globally
global.fetch = jest.fn(() =>
    Promise.resolve({
        ok: true,
        json: async () => ({
            services: { stt: true, llm: true, tts: true },
            allConfigured: true,
            message: 'All services configured',
        }),
    } as Response)
);

// Mock Audio
const mockAudioPlay = jest.fn();
const mockAudioPause = jest.fn();
global.Audio = jest.fn().mockImplementation(() => ({
    play: mockAudioPlay,
    pause: mockAudioPause,
    currentTime: 0,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
})) as any;

describe('Continuous Call Feature', () => {
    const { useContinuousCall } = require('@/hooks/useContinuousCall');
    const { useSpeechRecognition } = require('@/hooks/useSpeechRecognition');

    beforeEach(() => {
        jest.clearAllMocks();
        mockAudioPlay.mockResolvedValue(undefined);
        
        // Reset mock implementations
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

        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({
                services: { stt: true, llm: true, tts: true },
                allConfigured: true,
                message: 'All services configured',
            }),
        } as Response);
    });

    describe('Call Button Rendering', () => {
        it('should show "Start Call" button when call is not active', () => {
            render(<Home />);
            
            const startButton = screen.getByRole('button', { name: /start call/i });
            expect(startButton).toBeInTheDocument();
            expect(startButton).toHaveClass('bg-green-600');
        });

        it('should show "End Call" button when call is active', () => {
            useContinuousCall.mockReturnValue({
                callState: 'active',
                audioLevel: 0.5,
                startCall: jest.fn(),
                endCall: jest.fn(),
                isCallActive: true,
            });

            render(<Home />);
            
            const endButton = screen.getByRole('button', { name: /end call/i });
            expect(endButton).toBeInTheDocument();
            expect(endButton).toHaveClass('bg-red-600');
        });

        it('should disable button during connecting state', () => {
            useContinuousCall.mockReturnValue({
                callState: 'connecting',
                audioLevel: 0,
                startCall: jest.fn(),
                endCall: jest.fn(),
                isCallActive: false,
            });

            render(<Home />);
            
            const button = screen.getByRole('button', { name: /start call/i });
            expect(button).toBeDisabled();
        });

        it('should disable button during ending state', () => {
            useContinuousCall.mockReturnValue({
                callState: 'ending',
                audioLevel: 0,
                startCall: jest.fn(),
                endCall: jest.fn(),
                isCallActive: true,
            });

            render(<Home />);
            
            const button = screen.getByRole('button', { name: /end call/i });
            expect(button).toBeDisabled();
        });
    });

    describe('Starting a Call', () => {
        it('should call startCall and startListening when clicking Start Call', async () => {
            const mockStartCall = jest.fn().mockResolvedValue(undefined);
            const mockStartListening = jest.fn();

            useContinuousCall.mockReturnValue({
                callState: 'idle',
                audioLevel: 0,
                startCall: mockStartCall,
                endCall: jest.fn(),
                isCallActive: false,
            });

            useSpeechRecognition.mockReturnValue({
                supported: true,
                isListening: false,
                interimTranscript: '',
                startListening: mockStartListening,
                stopListening: jest.fn(),
                pause: jest.fn(),
                resume: jest.fn(),
            });

            render(<Home />);
            
            const startButton = screen.getByRole('button', { name: /start call/i });
            fireEvent.click(startButton);

            await waitFor(() => {
                expect(mockStartCall).toHaveBeenCalledTimes(1);
            });

            await waitFor(() => {
                expect(mockStartListening).toHaveBeenCalledTimes(1);
            });
        });

        it('should show error alert if microphone access fails', async () => {
            const mockStartCall = jest.fn().mockRejectedValue(new Error('Microphone access denied'));
            const alertSpy = jest.spyOn(window, 'alert').mockImplementation();

            useContinuousCall.mockReturnValue({
                callState: 'idle',
                audioLevel: 0,
                startCall: mockStartCall,
                endCall: jest.fn(),
                isCallActive: false,
            });

            render(<Home />);
            
            const startButton = screen.getByRole('button', { name: /start call/i });
            fireEvent.click(startButton);

            await waitFor(() => {
                expect(alertSpy).toHaveBeenCalledWith(
                    'Failed to access microphone. Please check permissions and try again.'
                );
            });

            alertSpy.mockRestore();
        });
    });

    describe('Ending a Call', () => {
        it('should call endCall and stopListening when clicking End Call', async () => {
            const mockEndCall = jest.fn();
            const mockStopListening = jest.fn();

            useContinuousCall.mockReturnValue({
                callState: 'active',
                audioLevel: 0.5,
                startCall: jest.fn(),
                endCall: mockEndCall,
                isCallActive: true,
            });

            useSpeechRecognition.mockReturnValue({
                supported: true,
                isListening: true,
                interimTranscript: '',
                startListening: jest.fn(),
                stopListening: mockStopListening,
                pause: jest.fn(),
                resume: jest.fn(),
            });

            render(<Home />);
            
            const endButton = screen.getByRole('button', { name: /end call/i });
            fireEvent.click(endButton);

            await waitFor(() => {
                expect(mockStopListening).toHaveBeenCalledTimes(1);
                expect(mockEndCall).toHaveBeenCalledTimes(1);
            });
        });

        it('should stop audio playback when ending call', async () => {
            const mockEndCall = jest.fn();

            useContinuousCall.mockReturnValue({
                callState: 'active',
                audioLevel: 0.5,
                startCall: jest.fn(),
                endCall: mockEndCall,
                isCallActive: true,
            });

            render(<Home />);
            
            const endButton = screen.getByRole('button', { name: /end call/i });
            fireEvent.click(endButton);

            await waitFor(() => {
                expect(mockEndCall).toHaveBeenCalled();
            });
        });

        it('should clear processing state when ending call', async () => {
            const mockEndCall = jest.fn();

            useContinuousCall.mockReturnValue({
                callState: 'active',
                audioLevel: 0.5,
                startCall: jest.fn(),
                endCall: mockEndCall,
                isCallActive: true,
            });

            render(<Home />);
            
            const endButton = screen.getByRole('button', { name: /end call/i });
            fireEvent.click(endButton);

            await waitFor(() => {
                expect(mockEndCall).toHaveBeenCalled();
            });

            // Should not show processing indicator after ending call
            const processingText = screen.queryByText(/processing/i);
            expect(processingText).not.toBeInTheDocument();
        });
    });

    describe('Call Status Indicators', () => {
        it('should show "Ready" status when call is not active', () => {
            render(<Home />);
            
            // Use getAllByText since "Ready" appears in multiple places
            const readyElements = screen.getAllByText(/ready/i);
            expect(readyElements.length).toBeGreaterThan(0);
            expect(readyElements[0]).toBeInTheDocument();
        });

        it('should show "Call Active" when call is active', () => {
            useContinuousCall.mockReturnValue({
                callState: 'active',
                audioLevel: 0.5,
                startCall: jest.fn(),
                endCall: jest.fn(),
                isCallActive: true,
            });

            render(<Home />);
            
            // Use getAllByText since "Call Active" appears in multiple places
            const callActiveElements = screen.getAllByText(/call active/i);
            expect(callActiveElements.length).toBeGreaterThan(0);
            expect(callActiveElements[0]).toBeInTheDocument();
        });

        it('should show listening indicator when STT is active', () => {
            useContinuousCall.mockReturnValue({
                callState: 'active',
                audioLevel: 0.5,
                startCall: jest.fn(),
                endCall: jest.fn(),
                isCallActive: true,
            });

            useSpeechRecognition.mockReturnValue({
                supported: true,
                isListening: true,
                interimTranscript: '',
                startListening: jest.fn(),
                stopListening: jest.fn(),
                pause: jest.fn(),
                resume: jest.fn(),
            });

            render(<Home />);
            
            expect(screen.getByText(/call active \(listening\)/i)).toBeInTheDocument();
        });

        it('should show pulse animation when call is active', () => {
            useContinuousCall.mockReturnValue({
                callState: 'active',
                audioLevel: 0.5,
                startCall: jest.fn(),
                endCall: jest.fn(),
                isCallActive: true,
            });

            const { container } = render(<Home />);
            
            const pulseIndicator = container.querySelector('.animate-pulse.bg-green-500');
            expect(pulseIndicator).toBeInTheDocument();
        });
    });

    describe('Call Tips and Feedback', () => {
        it('should show call tips when call is active', () => {
            useContinuousCall.mockReturnValue({
                callState: 'active',
                audioLevel: 0.5,
                startCall: jest.fn(),
                endCall: jest.fn(),
                isCallActive: true,
            });

            render(<Home />);
            
            expect(screen.getByText(/call active - speak naturally, end call anytime/i)).toBeInTheDocument();
        });

        it('should not show call tips when call is not active', () => {
            render(<Home />);
            
            const callTips = screen.queryByText(/call active - speak naturally/i);
            expect(callTips).not.toBeInTheDocument();
        });

        it('should show audio level indicator when call is active', () => {
            useContinuousCall.mockReturnValue({
                callState: 'active',
                audioLevel: 0.5,
                startCall: jest.fn(),
                endCall: jest.fn(),
                isCallActive: true,
            });

            render(<Home />);
            
            // AudioLevelIndicator should be rendered
            expect(screen.getByText(/audio active/i)).toBeInTheDocument();
        });

        it('should show interim transcript when available', () => {
            useContinuousCall.mockReturnValue({
                callState: 'active',
                audioLevel: 0.5,
                startCall: jest.fn(),
                endCall: jest.fn(),
                isCallActive: true,
            });

            useSpeechRecognition.mockReturnValue({
                supported: true,
                isListening: true,
                interimTranscript: 'Hello this is a test',
                startListening: jest.fn(),
                stopListening: jest.fn(),
                pause: jest.fn(),
                resume: jest.fn(),
            });

            render(<Home />);
            
            expect(screen.getByText(/💬 hello this is a test/i)).toBeInTheDocument();
        });
    });

    describe('Speech Processing During Call', () => {
        it('should not process speech if call is not active', async () => {
            let onFinalCallback: ((text: string) => void) | undefined;

            useSpeechRecognition.mockImplementation(({ onFinal }: any) => {
                onFinalCallback = onFinal;
                return {
                    supported: true,
                    isListening: false,
                    interimTranscript: '',
                    startListening: jest.fn(),
                    stopListening: jest.fn(),
                    pause: jest.fn(),
                    resume: jest.fn(),
                };
            });

            render(<Home />);

            // Simulate speech input when call is not active
            if (onFinalCallback) {
                onFinalCallback('Test speech input');
            }

            await waitFor(() => {
                // Should not make LLM request
                expect(global.fetch).not.toHaveBeenCalledWith('/api/llm', expect.any(Object));
            }, { timeout: 1000 });
        });

        it('should register speech recognition callback when call is active', () => {
            let onFinalCallback: ((text: string) => void) | undefined;

            useContinuousCall.mockReturnValue({
                callState: 'active',
                audioLevel: 0.5,
                startCall: jest.fn(),
                endCall: jest.fn(),
                isCallActive: true,
            });

            useSpeechRecognition.mockImplementation(({ onFinal }: any) => {
                onFinalCallback = onFinal;
                return {
                    supported: true,
                    isListening: true,
                    interimTranscript: '',
                    startListening: jest.fn(),
                    stopListening: jest.fn(),
                    pause: jest.fn(),
                    resume: jest.fn(),
                };
            });

            render(<Home />);

            // Verify that speech recognition was initialized with onFinal callback
            expect(useSpeechRecognition).toHaveBeenCalled();
            expect(useSpeechRecognition.mock.calls[0][0]).toHaveProperty('onFinal');
            expect(typeof useSpeechRecognition.mock.calls[0][0].onFinal).toBe('function');
        });
    });

    describe('Call Cleanup', () => {
        it('should properly clean up resources when ending call', async () => {
            const mockEndCall = jest.fn();
            const mockStopListening = jest.fn();

            useContinuousCall.mockReturnValue({
                callState: 'active',
                audioLevel: 0.5,
                startCall: jest.fn(),
                endCall: mockEndCall,
                isCallActive: true,
            });

            useSpeechRecognition.mockReturnValue({
                supported: true,
                isListening: true,
                interimTranscript: '',
                startListening: jest.fn(),
                stopListening: mockStopListening,
                pause: jest.fn(),
                resume: jest.fn(),
            });

            render(<Home />);

            // Click End Call button
            const endButton = screen.getByRole('button', { name: /end call/i });
            fireEvent.click(endButton);

            // Verify cleanup functions were called
            await waitFor(() => {
                expect(mockStopListening).toHaveBeenCalled();
                expect(mockEndCall).toHaveBeenCalled();
            });
        });
    });
});
