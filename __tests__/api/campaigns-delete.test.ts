/**
 * @jest-environment node
 */
import { DELETE } from '@/app/api/campaigns/route';
import dbConnect from '@/lib/dbConnect';
import Campaign from '@/models/Campaign';
import { NextRequest } from 'next/server';

jest.mock('@/lib/dbConnect');
jest.mock('@/models/Campaign');

describe('DELETE /api/campaigns', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should delete a campaign successfully', async () => {
        const mockCampaign = {
            _id: 'campaign-123',
            title: 'Test Campaign',
            start_date: '2025-01-01',
            status: 'stopped',
            agent_id: 'agent-1',
            user_id: 'user-1',
        };

        (dbConnect as jest.Mock).mockResolvedValue(undefined);
        (Campaign.findByIdAndDelete as jest.Mock).mockResolvedValue(mockCampaign);

        const request = new NextRequest('http://localhost:3000/api/campaigns?id=campaign-123');
        const response = await DELETE(request);
        const data = await response.json();

        expect(dbConnect).toHaveBeenCalled();
        expect(Campaign.findByIdAndDelete).toHaveBeenCalledWith('campaign-123');
        expect(response.status).toBe(200);
        expect(data).toEqual({
            success: true,
            data: mockCampaign,
        });
    });

    it('should return 400 when campaign ID is missing', async () => {
        (dbConnect as jest.Mock).mockResolvedValue(undefined);

        const request = new NextRequest('http://localhost:3000/api/campaigns');
        const response = await DELETE(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data).toEqual({
            success: false,
            error: 'Campaign ID is required',
        });
        expect(Campaign.findByIdAndDelete).not.toHaveBeenCalled();
    });

    it('should return 404 when campaign is not found', async () => {
        (dbConnect as jest.Mock).mockResolvedValue(undefined);
        (Campaign.findByIdAndDelete as jest.Mock).mockResolvedValue(null);

        const request = new NextRequest('http://localhost:3000/api/campaigns?id=nonexistent-id');
        const response = await DELETE(request);
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data).toEqual({
            success: false,
            error: 'Campaign not found',
        });
    });

    it('should handle database errors gracefully', async () => {
        const errorMessage = 'Database connection failed';
        (dbConnect as jest.Mock).mockRejectedValue(new Error(errorMessage));

        const request = new NextRequest('http://localhost:3000/api/campaigns?id=campaign-123');
        const response = await DELETE(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data).toEqual({
            success: false,
            error: errorMessage,
        });
    });
});
