import { useCallback, useEffect, useRef } from 'react';

interface CampaignStatus {
    _id: string;
    title: string;
    status: 'running' | 'stopped' | 'completed';
    total_contacts?: number;
    calls_completed?: number;
    calls_failed?: number;
    started_at?: string;
    updated_at?: string;
}

interface UseCampaignPollingOptions {
    campaignId: string | null;
    enabled: boolean;
    onUpdate: (campaign: CampaignStatus) => void;
    onComplete?: () => void;
    onError?: (error: Error) => void;
}

/**
 * Custom hook to poll campaign status at regular intervals
 *
 * @param options - Configuration options for polling
 * @param options.campaignId - The ID of the campaign to poll
 * @param options.enabled - Whether polling is enabled
 * @param options.onUpdate - Callback when campaign status is updated
 * @param options.onComplete - Optional callback when campaign is completed
 * @param options.onError - Optional callback when an error occurs
 *
 * @example
 * ```tsx
 * useCampaignPolling({
 *   campaignId: 'abc123',
 *   enabled: true,
 *   onUpdate: (campaign) => setCampaigns(prev =>
 *     prev.map(c => c._id === campaign._id ? campaign : c)
 *   ),
 *   onComplete: () => console.log('Campaign completed'),
 * });
 * ```
 */
export function useCampaignPolling({
    campaignId,
    enabled,
    onUpdate,
    onComplete,
    onError,
}: UseCampaignPollingOptions): void {
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const onUpdateRef = useRef(onUpdate);
    const onCompleteRef = useRef(onComplete);
    const onErrorRef = useRef(onError);

    // Keep callbacks up to date
    useEffect(() => {
        onUpdateRef.current = onUpdate;
        onCompleteRef.current = onComplete;
        onErrorRef.current = onError;
    }, [onUpdate, onComplete, onError]);

    const fetchCampaignStatus = useCallback(async () => {
        if (!campaignId) {
            return;
        }

        try {
            const response = await fetch(`/api/campaigns/${campaignId}/status`);
            const data = await response.json();

            if (!response.ok || !data?.success) {
                throw new Error(data?.error || 'Failed to fetch campaign status');
            }

            const campaign = data.data as CampaignStatus;
            onUpdateRef.current(campaign);

            // Stop polling if campaign is completed
            if (campaign.status === 'completed') {
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                }
                onCompleteRef.current?.();
            }
        } catch (error) {
            console.error('Error fetching campaign status:', error);
            onErrorRef.current?.(error instanceof Error ? error : new Error('Unknown error'));
        }
    }, [campaignId]);

    useEffect(() => {
        // Clear any existing interval
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        // Start polling if enabled and campaignId is provided
        if (enabled && campaignId) {
            // Fetch immediately
            fetchCampaignStatus();

            // Get polling interval from environment variable or use default (10 seconds)
            const pollingInterval = parseInt(
                process.env.NEXT_PUBLIC_CAMPAIGN_STATUS_POLL_INTERVAL || '10000',
                10,
            );

            // Set up interval for subsequent fetches
            intervalRef.current = setInterval(fetchCampaignStatus, pollingInterval);
        }

        // Cleanup on unmount or when dependencies change
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [enabled, campaignId, fetchCampaignStatus]);
}
