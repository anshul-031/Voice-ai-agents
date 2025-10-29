import { useCampaignPolling } from '@/hooks/useCampaignPolling';
import { renderHook, waitFor } from '@testing-library/react';

// Mock fetch
global.fetch = jest.fn();

describe('useCampaignPolling', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
        process.env.NEXT_PUBLIC_CAMPAIGN_STATUS_POLL_INTERVAL = '10000';
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should not start polling when enabled is false', () => {
        const onUpdate = jest.fn();
        
        renderHook(() =>
            useCampaignPolling({
                campaignId: 'campaign123',
                enabled: false,
                onUpdate,
            }),
        );

        expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should not start polling when campaignId is null', () => {
        const onUpdate = jest.fn();
        
        renderHook(() =>
            useCampaignPolling({
                campaignId: null,
                enabled: true,
                onUpdate,
            }),
        );

        expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should start polling when enabled and campaignId are provided', async () => {
        const mockData = {
            _id: 'campaign123',
            title: 'Test Campaign',
            status: 'running' as const,
            total_contacts: 10,
            calls_completed: 5,
            calls_failed: 0,
            updated_at: new Date().toISOString(),
        };

        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({ success: true, data: mockData }),
        });

        const onUpdate = jest.fn();

        renderHook(() =>
            useCampaignPolling({
                campaignId: 'campaign123',
                enabled: true,
                onUpdate,
            }),
        );

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith('/api/campaigns/campaign123/status');
        });
    });

    it('should call onUpdate callback when status is fetched', async () => {
        const mockData = {
            _id: 'campaign123',
            title: 'Test Campaign',
            status: 'running' as const,
            total_contacts: 10,
            calls_completed: 5,
            calls_failed: 0,
            updated_at: new Date().toISOString(),
        };

        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({ success: true, data: mockData }),
        });

        const onUpdate = jest.fn();

        renderHook(() =>
            useCampaignPolling({
                campaignId: 'campaign123',
                enabled: true,
                onUpdate,
            }),
        );

        await waitFor(() => {
            expect(onUpdate).toHaveBeenCalledWith(mockData);
        });
    });

    it('should stop polling and call onComplete when campaign is completed', async () => {
        const mockData = {
            _id: 'campaign123',
            title: 'Test Campaign',
            status: 'completed' as const,
            total_contacts: 10,
            calls_completed: 10,
            calls_failed: 0,
            updated_at: new Date().toISOString(),
        };

        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({ success: true, data: mockData }),
        });

        const onUpdate = jest.fn();
        const onComplete = jest.fn();

        renderHook(() =>
            useCampaignPolling({
                campaignId: 'campaign123',
                enabled: true,
                onUpdate,
                onComplete,
            }),
        );

        await waitFor(() => {
            expect(onComplete).toHaveBeenCalled();
        });

        await waitFor(() => {
            expect(onUpdate).toHaveBeenCalledWith(mockData);
        });
    });

    it('should call onError callback on fetch error', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: false,
            json: async () => ({ success: false, error: 'Failed to fetch' }),
        });

        const onUpdate = jest.fn();
        const onError = jest.fn();

        renderHook(() =>
            useCampaignPolling({
                campaignId: 'campaign123',
                enabled: true,
                onUpdate,
                onError,
            }),
        );

        await waitFor(() => {
            expect(onError).toHaveBeenCalledWith(expect.any(Error));
        });
    });

    it('should poll at specified interval', async () => {
        const mockData = {
            _id: 'campaign123',
            title: 'Test Campaign',
            status: 'running' as const,
            total_contacts: 10,
            calls_completed: 5,
            calls_failed: 0,
            updated_at: new Date().toISOString(),
        };

        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({ success: true, data: mockData }),
        });

        const onUpdate = jest.fn();

        renderHook(() =>
            useCampaignPolling({
                campaignId: 'campaign123',
                enabled: true,
                onUpdate,
            }),
        );

        // Initial fetch
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledTimes(1);
        });

        // Advance timers and wait for next poll
        jest.advanceTimersByTime(10000);
        
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledTimes(2);
        });
    });

    it('should use custom polling interval from environment variable', async () => {
        process.env.NEXT_PUBLIC_CAMPAIGN_STATUS_POLL_INTERVAL = '5000';

        const mockData = {
            _id: 'campaign123',
            title: 'Test Campaign',
            status: 'running' as const,
            total_contacts: 10,
            calls_completed: 5,
            calls_failed: 0,
            updated_at: new Date().toISOString(),
        };

        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({ success: true, data: mockData }),
        });

        const onUpdate = jest.fn();

        renderHook(() =>
            useCampaignPolling({
                campaignId: 'campaign123',
                enabled: true,
                onUpdate,
            }),
        );

        // Initial fetch
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledTimes(1);
        });

        // Wait for 5 seconds
        jest.advanceTimersByTime(5000);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledTimes(2);
        });
    });

    it('should cleanup interval on unmount', async () => {
        const mockData = {
            _id: 'campaign123',
            title: 'Test Campaign',
            status: 'running' as const,
            total_contacts: 10,
            calls_completed: 5,
            calls_failed: 0,
            updated_at: new Date().toISOString(),
        };

        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({ success: true, data: mockData }),
        });

        const onUpdate = jest.fn();

        const { unmount } = renderHook(() =>
            useCampaignPolling({
                campaignId: 'campaign123',
                enabled: true,
                onUpdate,
            }),
        );

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledTimes(1);
        });

        unmount();

        // Wait for interval - should not call fetch after unmount
        jest.advanceTimersByTime(10000);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledTimes(1);
        });
    });

    it('should handle network error', async () => {
        (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

        const onUpdate = jest.fn();
        const onError = jest.fn();

        renderHook(() =>
            useCampaignPolling({
                campaignId: 'campaign123',
                enabled: true,
                onUpdate,
                onError,
            }),
        );

        await waitFor(() => {
            expect(onError).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Network error',
            }));
        });
    });

    it('should stop polling when campaign status changes to completed', async () => {
        const mockRunningData = {
            _id: 'campaign123',
            title: 'Test Campaign',
            status: 'running' as const,
            total_contacts: 10,
            calls_completed: 8,
            calls_failed: 0,
            updated_at: new Date().toISOString(),
        };

        const mockCompletedData = {
            ...mockRunningData,
            status: 'completed' as const,
            calls_completed: 10,
        };

        (global.fetch as jest.Mock)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, data: mockRunningData }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, data: mockCompletedData }),
            });

        const onUpdate = jest.fn();
        const onComplete = jest.fn();

        renderHook(() =>
            useCampaignPolling({
                campaignId: 'campaign123',
                enabled: true,
                onUpdate,
                onComplete,
            }),
        );

        // First fetch - running status
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledTimes(1);
        });

        // Advance timer for second poll
        jest.advanceTimersByTime(10000);

        // Second fetch - completed status
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledTimes(2);
            expect(onComplete).toHaveBeenCalled();
        });

        // Advance timer again - should not fetch anymore
        jest.advanceTimersByTime(10000);
        
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledTimes(2);
        });
    });
});
