/**
 * @jest-environment node
 */
import { POST } from '@/app/api/campaign-contacts/route';
import dbConnect from '@/lib/dbConnect';
import CampaignContact from '@/models/CampaignContact';
import { NextRequest } from 'next/server';

jest.mock('@/lib/dbConnect');
jest.mock('@/models/CampaignContact');

describe('POST /api/campaign-contacts - Duplicate Prevention', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should filter out duplicate phone numbers when uploading contacts', async () => {
        const existingContacts = [
            { number: '+1234567890', campaign_id: 'campaign-1' },
            { number: '+9876543210', campaign_id: 'campaign-1' },
        ];

        const csvContent = `number,name,description
+1234567890,John Doe,Existing customer
+1111111111,Jane Smith,New customer
+9876543210,Bob Johnson,Another existing
+2222222222,Alice Brown,New customer`;

        (dbConnect as jest.Mock).mockResolvedValue(undefined);
        (CampaignContact.find as jest.Mock).mockResolvedValue(existingContacts);
        (CampaignContact.insertMany as jest.Mock).mockResolvedValue([
            {
                _id: 'contact-1',
                number: '+1111111111',
                name: 'Jane Smith',
                description: 'New customer',
                campaign_id: 'campaign-1',
                call_done: 'no',
            },
            {
                _id: 'contact-2',
                number: '+2222222222',
                name: 'Alice Brown',
                description: 'New customer',
                campaign_id: 'campaign-1',
                call_done: 'no',
            },
        ]);

        const formData = new FormData();
        formData.append('file', new Blob([csvContent], { type: 'text/csv' }), 'contacts.csv');
        formData.append('campaign_id', 'campaign-1');

        const request = new NextRequest('http://localhost:3000/api/campaign-contacts', {
            method: 'POST',
            body: formData,
        });

        const response = await POST(request);
        const data = await response.json();

        expect(dbConnect).toHaveBeenCalled();
        expect(CampaignContact.find).toHaveBeenCalledWith({ campaign_id: 'campaign-1' });
        expect(CampaignContact.insertMany).toHaveBeenCalled();

        // Check that only 2 new contacts were inserted (duplicates filtered)
        const insertedContacts = (CampaignContact.insertMany as jest.Mock).mock.calls[0][0];
        expect(insertedContacts).toHaveLength(2);
        expect(insertedContacts.map((c: any) => c.number)).toEqual(['+1111111111', '+2222222222']);

        expect(response.status).toBe(201);
        expect(data.success).toBe(true);
        expect(data.count).toBe(2);
        expect(data.duplicatesSkipped).toBe(2);
    });

    it('should handle case when all contacts are duplicates', async () => {
        const existingContacts = [
            { number: '+1234567890', campaign_id: 'campaign-1' },
            { number: '+9876543210', campaign_id: 'campaign-1' },
        ];

        const csvContent = `number,name,description
+1234567890,John Doe,Existing customer
+9876543210,Bob Johnson,Another existing`;

        (dbConnect as jest.Mock).mockResolvedValue(undefined);
        (CampaignContact.find as jest.Mock).mockResolvedValue(existingContacts);

        const formData = new FormData();
        formData.append('file', new Blob([csvContent], { type: 'text/csv' }), 'contacts.csv');
        formData.append('campaign_id', 'campaign-1');

        const request = new NextRequest('http://localhost:3000/api/campaign-contacts', {
            method: 'POST',
            body: formData,
        });

        const response = await POST(request);
        const data = await response.json();

        expect(CampaignContact.insertMany).not.toHaveBeenCalled();
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.count).toBe(0);
        expect(data.message).toBe('No new contacts to add. All numbers already exist in this campaign.');
    });

    it('should add all contacts when no duplicates exist', async () => {
        const csvContent = `number,name,description
+1111111111,Jane Smith,New customer
+2222222222,Alice Brown,New customer`;

        (dbConnect as jest.Mock).mockResolvedValue(undefined);
        (CampaignContact.find as jest.Mock).mockResolvedValue([]);
        (CampaignContact.insertMany as jest.Mock).mockResolvedValue([
            {
                _id: 'contact-1',
                number: '+1111111111',
                name: 'Jane Smith',
                description: 'New customer',
                campaign_id: 'campaign-1',
                call_done: 'no',
            },
            {
                _id: 'contact-2',
                number: '+2222222222',
                name: 'Alice Brown',
                description: 'New customer',
                campaign_id: 'campaign-1',
                call_done: 'no',
            },
        ]);

        const formData = new FormData();
        formData.append('file', new Blob([csvContent], { type: 'text/csv' }), 'contacts.csv');
        formData.append('campaign_id', 'campaign-1');

        const request = new NextRequest('http://localhost:3000/api/campaign-contacts', {
            method: 'POST',
            body: formData,
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data.success).toBe(true);
        expect(data.count).toBe(2);
        expect(data.duplicatesSkipped).toBe(0);
    });

    it('should handle empty numbers in CSV gracefully', async () => {
        const csvContent = `number,name,description
+1111111111,Jane Smith,New customer
,Alice Brown,Missing number
+2222222222,Bob Johnson,Valid customer`;

        (dbConnect as jest.Mock).mockResolvedValue(undefined);
        (CampaignContact.find as jest.Mock).mockResolvedValue([]);
        (CampaignContact.insertMany as jest.Mock).mockResolvedValue([
            {
                _id: 'contact-1',
                number: '+1111111111',
                name: 'Jane Smith',
                description: 'New customer',
                campaign_id: 'campaign-1',
                call_done: 'no',
            },
            {
                _id: 'contact-2',
                number: '+2222222222',
                name: 'Bob Johnson',
                description: 'Valid customer',
                campaign_id: 'campaign-1',
                call_done: 'no',
            },
        ]);

        const formData = new FormData();
        formData.append('file', new Blob([csvContent], { type: 'text/csv' }), 'contacts.csv');
        formData.append('campaign_id', 'campaign-1');

        const request = new NextRequest('http://localhost:3000/api/campaign-contacts', {
            method: 'POST',
            body: formData,
        });

        const response = await POST(request);
        const data = await response.json();

        // Verify that contact with empty number was filtered out
        const insertedContacts = (CampaignContact.insertMany as jest.Mock).mock.calls[0][0];
        expect(insertedContacts).toHaveLength(2);
        expect(insertedContacts.every((c: any) => c.number)).toBe(true);
    });
});
