/**
 * @jest-environment node
 */

/**
 * Unit Tests for Telephony STT (Speech-to-Text) Handler
 * Tests audio transcription for Exotel recordings
 */

import { POST } from '@/app/api/telephony/stt/route';
import { NextRequest } from 'next/server';

// Mock global fetch
global.fetch = jest.fn();

describe('Telephony STT API', () => {
    const mockRecordingUrl = 'https://exotel.com/recordings/rec123.wav';
    const mockAudioBuffer = new ArrayBuffer(1024);

    beforeEach(() => {
        jest.clearAllMocks();
        process.env.ASSEMBLYAI_API_KEY = 'test-api-key';
    });

    describe('POST - Transcribe Audio', () => {
        it('should successfully transcribe audio from Exotel recording', async () => {
            const mockTranscriptId = 'transcript-123';
            const mockTranscriptText = 'मुझे लोन चाहिए';

            (global.fetch as jest.Mock)
                // Download audio
                .mockResolvedValueOnce({
                    ok: true,
                    arrayBuffer: () => Promise.resolve(mockAudioBuffer),
                })
                // Upload to AssemblyAI
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({ upload_url: 'https://cdn.assemblyai.com/upload/123' }),
                })
                // Request transcription
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({ id: mockTranscriptId }),
                })
                // Poll status - completed
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({
                        status: 'completed',
                        text: mockTranscriptText,
                        confidence: 0.95,
                        language_code: 'hi',
                    }),
                });

            const request = new NextRequest('https://example.com/api/telephony/stt', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({
                    recordingUrl: mockRecordingUrl,
                    language: 'hi',
                }),
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.text).toBe(mockTranscriptText);
            expect(data.confidence).toBe(0.95);
            expect(data.language).toBe('hi');

            // Verify API calls
            expect(global.fetch).toHaveBeenCalledWith(mockRecordingUrl);
            expect(global.fetch).toHaveBeenCalledWith(
                'https://api.assemblyai.com/v2/upload',
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        'authorization': 'test-api-key',
                    }),
                })
            );
            expect(global.fetch).toHaveBeenCalledWith(
                'https://api.assemblyai.com/v2/transcript',
                expect.objectContaining({
                    method: 'POST',
                    body: expect.stringContaining('"language_code":"hi"'),
                })
            );
        });

        it('should poll multiple times until transcription completes', async () => {
            const mockTranscriptId = 'transcript-456';

            (global.fetch as jest.Mock)
                // Download audio
                .mockResolvedValueOnce({
                    ok: true,
                    arrayBuffer: () => Promise.resolve(mockAudioBuffer),
                })
                // Upload
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({ upload_url: 'https://cdn.assemblyai.com/upload/456' }),
                })
                // Request transcription
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({ id: mockTranscriptId }),
                })
                // Poll 1 - queued
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({ status: 'queued' }),
                })
                // Poll 2 - processing
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({ status: 'processing' }),
                })
                // Poll 3 - completed
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({
                        status: 'completed',
                        text: 'Hello world',
                        confidence: 0.98,
                        language_code: 'en',
                    }),
                });

            const request = new NextRequest('https://example.com/api/telephony/stt', {
                method: 'POST',
                body: JSON.stringify({
                    recordingUrl: mockRecordingUrl,
                    language: 'en',
                }),
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.text).toBe('Hello world');
            
            // Should have polled 3 times
            const statusCalls = (global.fetch as jest.Mock).mock.calls.filter(call =>
                call[0].includes(`/v2/transcript/${mockTranscriptId}`)
            );
            expect(statusCalls.length).toBe(3);
        });

        it('should return 400 when recordingUrl is missing', async () => {
            const request = new NextRequest('https://example.com/api/telephony/stt', {
                method: 'POST',
                body: JSON.stringify({ language: 'hi' }),
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.error).toBe('recordingUrl is required');
        });

        it('should return 500 when AssemblyAI API key is not configured', async () => {
            delete process.env.ASSEMBLYAI_API_KEY;

            const request = new NextRequest('https://example.com/api/telephony/stt', {
                method: 'POST',
                body: JSON.stringify({ recordingUrl: mockRecordingUrl }),
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data.error).toBe('STT service not configured');
        });

        it('should handle audio download failure', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                statusText: 'Not Found',
            });

            const request = new NextRequest('https://example.com/api/telephony/stt', {
                method: 'POST',
                body: JSON.stringify({ recordingUrl: mockRecordingUrl }),
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data.error).toBe('Failed to transcribe audio');
            expect(data.details).toContain('Failed to download audio');
        });

        it('should handle AssemblyAI upload failure', async () => {
            (global.fetch as jest.Mock)
                .mockResolvedValueOnce({
                    ok: true,
                    arrayBuffer: () => Promise.resolve(mockAudioBuffer),
                })
                .mockResolvedValueOnce({
                    ok: false,
                    statusText: 'Service Unavailable',
                });

            const request = new NextRequest('https://example.com/api/telephony/stt', {
                method: 'POST',
                body: JSON.stringify({ recordingUrl: mockRecordingUrl }),
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data.details).toContain('Failed to upload to AssemblyAI');
        });

        it('should handle transcription request failure', async () => {
            (global.fetch as jest.Mock)
                .mockResolvedValueOnce({
                    ok: true,
                    arrayBuffer: () => Promise.resolve(mockAudioBuffer),
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({ upload_url: 'https://cdn.assemblyai.com/upload/123' }),
                })
                .mockResolvedValueOnce({
                    ok: false,
                    statusText: 'Bad Request',
                });

            const request = new NextRequest('https://example.com/api/telephony/stt', {
                method: 'POST',
                body: JSON.stringify({ recordingUrl: mockRecordingUrl }),
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data.details).toContain('Failed to request transcription');
        });

        it('should handle transcription error status', async () => {
            (global.fetch as jest.Mock)
                .mockResolvedValueOnce({
                    ok: true,
                    arrayBuffer: () => Promise.resolve(mockAudioBuffer),
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({ upload_url: 'https://cdn.assemblyai.com/upload/123' }),
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({ id: 'transcript-789' }),
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({
                        status: 'error',
                        error: 'Audio file is corrupt',
                    }),
                });

            const request = new NextRequest('https://example.com/api/telephony/stt', {
                method: 'POST',
                body: JSON.stringify({ recordingUrl: mockRecordingUrl }),
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data.details).toContain('Transcription failed');
            expect(data.details).toContain('corrupt');
        });

        it('should use default language when not specified', async () => {
            (global.fetch as jest.Mock)
                .mockResolvedValueOnce({
                    ok: true,
                    arrayBuffer: () => Promise.resolve(mockAudioBuffer),
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({ upload_url: 'https://cdn.assemblyai.com/upload/123' }),
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({ id: 'transcript-123' }),
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({
                        status: 'completed',
                        text: 'Test',
                        confidence: 0.9,
                        language_code: 'hi',
                    }),
                });

            const request = new NextRequest('https://example.com/api/telephony/stt', {
                method: 'POST',
                body: JSON.stringify({ recordingUrl: mockRecordingUrl }), // No language specified
            });

            const response = await POST(request);
            
            expect(response.status).toBe(200);
            
            // Check that default language (hi) was used
            const transcriptCall = (global.fetch as jest.Mock).mock.calls.find(call =>
                call[0] === 'https://api.assemblyai.com/v2/transcript'
            );
            const requestBody = JSON.parse(transcriptCall[1].body);
            expect(requestBody.language_code).toBe('hi');
        });
    });

    describe('Integration', () => {
        it('should work with complete flow from Exotel recording URL', async () => {
            const realRecordingUrl = 'https://s3.amazonaws.com/exotel-recordings/call_recording.wav';
            
            (global.fetch as jest.Mock)
                .mockResolvedValueOnce({
                    ok: true,
                    arrayBuffer: () => Promise.resolve(new ArrayBuffer(5000)),
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({ upload_url: 'https://cdn.assemblyai.com/upload/abc' }),
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({ id: 'transcript-real' }),
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({
                        status: 'completed',
                        text: 'मुझे व्यक्तिगत लोन चाहिए',
                        confidence: 0.92,
                        language_code: 'hi',
                    }),
                });

            const request = new NextRequest('https://example.com/api/telephony/stt', {
                method: 'POST',
                body: JSON.stringify({
                    recordingUrl: realRecordingUrl,
                    language: 'hi',
                }),
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.text).toBe('मुझे व्यक्तिगत लोन चाहिए');
        });
    });
});
