import Home from '@/app/demo/page';
import { render, screen, waitFor } from '../test-utils';

// Mock hooks
jest.mock('@/hooks/useSpeechRecognition');
jest.mock('@/hooks/useContinuousCall');

describe('Home Page - Split Layout Feature', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        
        // Mock fetch
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
            return Promise.reject(new Error('Not found'));
        }) as jest.Mock;
    });

    describe('Split Layout Rendering', () => {
        it('should show split layout when call is active', async () => {
            const { useContinuousCall } = require('@/hooks/useContinuousCall');
            const { useSpeechRecognition } = require('@/hooks/useSpeechRecognition');

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

            // Check for transcription section
            await waitFor(() => {
                expect(screen.getByText('Live Transcription')).toBeInTheDocument();
            });

            // Check for visualizer section
            expect(screen.getByText('Audio Visualizer')).toBeInTheDocument();
        });

        it('should not show split layout when call is not active', () => {
            const { useContinuousCall } = require('@/hooks/useContinuousCall');
            const { useSpeechRecognition } = require('@/hooks/useSpeechRecognition');

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

            // Split layout should not be visible
            expect(screen.queryByText('Live Transcription')).not.toBeInTheDocument();
            expect(screen.queryByText('Audio Visualizer')).not.toBeInTheDocument();
        });

        it('should show interim transcript in transcription panel', async () => {
            const { useContinuousCall } = require('@/hooks/useContinuousCall');
            const { useSpeechRecognition } = require('@/hooks/useSpeechRecognition');

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
                interimTranscript: 'Hello testing transcript',
                startListening: jest.fn(),
                stopListening: jest.fn(),
                pause: jest.fn(),
                resume: jest.fn(),
            });

            render(<Home />);

            // Check for interim transcript in the panel
            await waitFor(() => {
                expect(screen.getByText('Hello testing transcript')).toBeInTheDocument();
            });
        });

        it('should show placeholder when no transcript', async () => {
            const { useContinuousCall } = require('@/hooks/useContinuousCall');
            const { useSpeechRecognition } = require('@/hooks/useSpeechRecognition');

            useContinuousCall.mockReturnValue({
                callState: 'active',
                audioLevel: 0.5,
                startCall: jest.fn(),
                endCall: jest.fn(),
                isCallActive: true,
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

            // Check for placeholder text
            await waitFor(() => {
                expect(screen.getByText(/Speak to see your words transcribed/i)).toBeInTheDocument();
            });
        });

        it('should render AudioLevelIndicator in visualizer panel', async () => {
            const { useContinuousCall } = require('@/hooks/useContinuousCall');
            const { useSpeechRecognition } = require('@/hooks/useSpeechRecognition');

            useContinuousCall.mockReturnValue({
                callState: 'active',
                audioLevel: 0.7,
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

            const { container } = render(<Home />);

            // Check that canvas (part of AudioLevelIndicator) is rendered
            await waitFor(() => {
                const canvas = container.querySelector('canvas');
                expect(canvas).toBeInTheDocument();
            });
        });
    });

    describe('Split Layout Responsiveness', () => {
        it('should have grid layout classes', async () => {
            const { useContinuousCall } = require('@/hooks/useContinuousCall');
            const { useSpeechRecognition } = require('@/hooks/useSpeechRecognition');

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

            const { container } = render(<Home />);

            // Check for grid layout container
            await waitFor(() => {
                const gridContainer = container.querySelector('.grid');
                expect(gridContainer).toBeInTheDocument();
            });
        });
    });
});
