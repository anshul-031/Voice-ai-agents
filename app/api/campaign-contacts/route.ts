import dbConnect from '@/lib/dbConnect';
import CampaignContact from '@/models/CampaignContact';
import { parse } from 'csv-parse/sync';
import { NextResponse, type NextRequest } from 'next/server';

// GET contacts by campaign_id
export async function GET(request: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(request.url);
        const campaignId = searchParams.get('campaign_id');

        if (!campaignId) {
            return NextResponse.json(
                { success: false, error: 'campaign_id is required' },
                { status: 400 },
            );
        }

        const contacts = await CampaignContact.find({ campaign_id: campaignId });
        return NextResponse.json({ success: true, data: contacts });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { success: false, error: errorMessage },
            { status: 400 },
        );
    }
}

// POST upload CSV file and create contacts
export async function POST(request: NextRequest) {
    try {
        await dbConnect();

        const formData = await request.formData();
        const file = formData.get('file') as File;
        const campaignId = formData.get('campaign_id') as string;

        if (!file) {
            return NextResponse.json(
                { success: false, error: 'No file uploaded' },
                { status: 400 },
            );
        }

        if (!campaignId) {
            return NextResponse.json(
                { success: false, error: 'campaign_id is required' },
                { status: 400 },
            );
        }

        // Read file content
        const fileContent = await file.text();

        // Parse CSV
        const records = parse(fileContent, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
        }) as Array<Record<string, string>>;

        // Get existing contacts for this campaign to check for duplicates
        const existingContacts = await CampaignContact.find({ campaign_id: campaignId });
        const existingNumbers = new Set(existingContacts.map(c => c.number));

        // Create contacts from CSV records, filtering out duplicates
        const uniqueContacts = records
            .filter((record) => {
                const number = record.number || record.Number || '';
                return number && !existingNumbers.has(number);
            })
            .map((record) => ({
                number: record.number || record.Number || '',
                name: record.name || record.Name || '',
                description: record.description || record.Description || '',
                campaign_id: campaignId,
                call_done: 'no',
            }));

        // If no unique contacts to add, return early
        if (uniqueContacts.length === 0) {
            return NextResponse.json({
                success: true,
                data: [],
                count: 0,
                message: 'No new contacts to add. All numbers already exist in this campaign.',
            }, { status: 200 });
        }

        // Insert all unique contacts
        const createdContacts = await CampaignContact.insertMany(uniqueContacts);

        return NextResponse.json({
            success: true,
            data: createdContacts,
            count: createdContacts.length,
            duplicatesSkipped: records.length - uniqueContacts.length,
        }, { status: 201 });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { success: false, error: errorMessage },
            { status: 400 },
        );
    }
}

// DELETE contact by id
export async function DELETE(request: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(request.url);
        const contactId = searchParams.get('id');

        if (!contactId) {
            return NextResponse.json(
                { success: false, error: 'Contact ID is required' },
                { status: 400 },
            );
        }

        const deletedContact = await CampaignContact.findByIdAndDelete(contactId);

        if (!deletedContact) {
            return NextResponse.json(
                { success: false, error: 'Contact not found' },
                { status: 404 },
            );
        }

        return NextResponse.json({ success: true, data: deletedContact });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { success: false, error: errorMessage },
            { status: 400 },
        );
    }
}
