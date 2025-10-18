import dbConnect from '@/lib/dbConnect';
import Campaign from '@/models/Campaign';
import { NextResponse, type NextRequest } from 'next/server';

// GET all campaigns
export async function GET() {
    try {
        await dbConnect();
        const campaigns = await Campaign.find({}).sort({ updated_at: -1 });
        return NextResponse.json({ success: true, data: campaigns });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { success: false, error: errorMessage },
            { status: 400 },
        );
    }
}

// POST create new campaign
export async function POST(request: NextRequest) {
    try {
        await dbConnect();
        const body = await request.json();

        const campaign = await Campaign.create({
            title: body.title,
            start_date: body.start_date,
            updated_at: new Date(),
            status: body.status || 'running',
            agent_id: body.agent_id || 'emi reminder',
            user_id: body.user_id,
        });

        return NextResponse.json({ success: true, data: campaign }, { status: 201 });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { success: false, error: errorMessage },
            { status: 400 },
        );
    }
}

// PUT update campaign
export async function PUT(request: NextRequest) {
    try {
        await dbConnect();
        const body = await request.json();
        const { id, ...updateData } = body;

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'Campaign ID is required' },
                { status: 400 },
            );
        }

        // Update the updated_at timestamp
        updateData.updated_at = new Date();

        const campaign = await Campaign.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true },
        );

        if (!campaign) {
            return NextResponse.json(
                { success: false, error: 'Campaign not found' },
                { status: 404 },
            );
        }

        return NextResponse.json({ success: true, data: campaign });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { success: false, error: errorMessage },
            { status: 400 },
        );
    }
}
