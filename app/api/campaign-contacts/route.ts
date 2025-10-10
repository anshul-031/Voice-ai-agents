import dbConnect from '@/lib/dbConnect';
import CampaignContact from '@/models/CampaignContact';
import { parse } from 'csv-parse/sync';
import { NextRequest, NextResponse } from 'next/server';

// GET contacts by campaign_id
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaign_id');

    if (!campaignId) {
      return NextResponse.json(
        { success: false, error: 'campaign_id is required' },
        { status: 400 }
      );
    }

    const contacts = await CampaignContact.find({ campaign_id: campaignId });
    return NextResponse.json({ success: true, data: contacts });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
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
        { status: 400 }
      );
    }

    if (!campaignId) {
      return NextResponse.json(
        { success: false, error: 'campaign_id is required' },
        { status: 400 }
      );
    }

    // Read file content
    const fileContent = await file.text();

    // Parse CSV
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    // Create contacts from CSV records
    const contacts = records.map((record: any) => ({
      number: record.number || record.Number || '',
      name: record.name || record.Name || '',
      description: record.description || record.Description || '',
      campaign_id: campaignId,
      call_done: 'no'
    }));

    // Insert all contacts
    const createdContacts = await CampaignContact.insertMany(contacts);

    return NextResponse.json({
      success: true,
      data: createdContacts,
      count: createdContacts.length
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
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
        { status: 400 }
      );
    }

    const deletedContact = await CampaignContact.findByIdAndDelete(contactId);

    if (!deletedContact) {
      return NextResponse.json(
        { success: false, error: 'Contact not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: deletedContact });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
