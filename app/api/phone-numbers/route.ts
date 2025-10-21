import dbConnect from '@/lib/mongodb';
import PhoneNumber, { type IPhoneNumber } from '@/models/PhoneNumber';
import type { Types } from 'mongoose';
import { NextResponse, type NextRequest } from 'next/server';

// GET - Fetch all phone numbers for a user
export async function GET(request: NextRequest) {
    console.log('[Phone Numbers API] GET request received');

    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId') || 'mukul';

        await dbConnect();
        console.log('[Phone Numbers API] Connected to MongoDB');

        const phoneNumbers = await PhoneNumber.find({ userId })
            .sort({ createdAt: -1 })
            .lean()
            .exec();

        console.log('[Phone Numbers API] Found', phoneNumbers.length, 'phone numbers for user:', userId);

        return NextResponse.json({
            success: true,
            userId,
            phoneNumbers: phoneNumbers.map(phone => ({
                id: (phone._id as Types.ObjectId).toString(),
                userId: phone.userId,
                phoneNumber: phone.phoneNumber,
                provider: phone.provider,
                displayName: phone.displayName,
                exotelConfig: phone.exotelConfig ? {
                    ...phone.exotelConfig,
                    // Don't expose sensitive data in GET response
                    apiKey: phone.exotelConfig.apiKey ? `***${phone.exotelConfig.apiKey.slice(-4)}` : undefined,
                    apiToken: phone.exotelConfig.apiToken ? `***${phone.exotelConfig.apiToken.slice(-4)}` : undefined,
                    sid: phone.exotelConfig.sid,
                    appId: phone.exotelConfig.appId,
                    domain: phone.exotelConfig.domain,
                    region: phone.exotelConfig.region,
                } : undefined,
                linkedAgentId: phone.linkedAgentId,
                webhookUrl: phone.webhookUrl,
                websocketUrl: phone.websocketUrl,
                status: phone.status,
                lastUsed: phone.lastUsed,
                createdAt: phone.createdAt,
                updatedAt: phone.updatedAt,
            })),
            count: phoneNumbers.length,
        });

    } catch (error) {
        console.error('[Phone Numbers API] Error fetching phone numbers:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch phone numbers',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 },
        );
    }
}

// POST - Create a new phone number
export async function POST(request: NextRequest) {
    console.log('[Phone Numbers API] POST request received');

    try {
        await dbConnect();
        console.log('[Phone Numbers API] Connected to MongoDB');

        const body = await request.json();
        const {
            userId,
            phoneNumber,
            provider,
            displayName,
            exotelConfig,
            linkedAgentId,
        } = body;

        console.log('[Phone Numbers API] Request data:', {
            userId,
            phoneNumber,
            provider,
            displayName,
            hasExotelConfig: !!exotelConfig,
            linkedAgentId,
        });

        if (!phoneNumber || !displayName) {
            console.error('[Phone Numbers API] Missing required fields');
            return NextResponse.json(
                { error: 'Missing required fields: phoneNumber, displayName' },
                { status: 400 },
            );
        }

        // Check if phone number already exists
        const existing = await PhoneNumber.findOne({ phoneNumber });
        if (existing) {
            return NextResponse.json(
                { error: 'Phone number already exists' },
                { status: 400 },
            );
        }

        // Generate webhook URLs
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.com';
        const phoneId = `phone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const webhookUrl = `${baseUrl}/api/telephony/webhook/${phoneId}`;
        const websocketUrl = `${baseUrl.replace('https://', 'wss://').replace('http://', 'ws://')}/api/telephony/ws/${phoneId}`;

        const phoneNumberDoc = new PhoneNumber({
            userId: userId || 'mukul',
            phoneNumber: phoneNumber.trim(),
            provider: provider || 'exotel',
            displayName: displayName.trim(),
            exotelConfig: provider === 'exotel' ? exotelConfig : undefined,
            linkedAgentId: linkedAgentId || undefined,
            webhookUrl,
            websocketUrl,
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        await phoneNumberDoc.save();
        console.log('[Phone Numbers API] Phone number saved successfully, ID:', phoneNumberDoc._id);

        return NextResponse.json({
            success: true,
            phoneNumber: {
                id: phoneNumberDoc._id.toString(),
                userId: phoneNumberDoc.userId,
                phoneNumber: phoneNumberDoc.phoneNumber,
                provider: phoneNumberDoc.provider,
                displayName: phoneNumberDoc.displayName,
                exotelConfig: phoneNumberDoc.exotelConfig,
                linkedAgentId: phoneNumberDoc.linkedAgentId,
                webhookUrl: phoneNumberDoc.webhookUrl,
                websocketUrl: phoneNumberDoc.websocketUrl,
                status: phoneNumberDoc.status,
                createdAt: phoneNumberDoc.createdAt,
                updatedAt: phoneNumberDoc.updatedAt,
            },
        });

    } catch (error) {
        console.error('[Phone Numbers API] Error creating phone number:', error);
        return NextResponse.json(
            {
                error: 'Failed to create phone number',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 },
        );
    }
}

// PUT - Update a phone number
export async function PUT(request: NextRequest) {
    console.log('[Phone Numbers API] PUT request received');

    try {
        await dbConnect();

        const body = await request.json();
        const {
            id,
            displayName,
            exotelConfig,
            linkedAgentId,
            status,
        } = body;

        console.log('[Phone Numbers API] Update request:', {
            id,
            displayName,
            hasExotelConfig: !!exotelConfig,
            linkedAgentId,
            status,
        });

        if (!id) {
            return NextResponse.json(
                { error: 'Missing required field: id' },
                { status: 400 },
            );
        }

        const updateData: Partial<IPhoneNumber> = { updatedAt: new Date() };
        if (displayName) updateData.displayName = displayName.trim();
        if (exotelConfig) updateData.exotelConfig = exotelConfig;
        if (linkedAgentId !== undefined) updateData.linkedAgentId = linkedAgentId;
        if (status) updateData.status = status;

        const phoneNumber = await PhoneNumber.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true },
        );

        if (!phoneNumber) {
            return NextResponse.json(
                { error: 'Phone number not found' },
                { status: 404 },
            );
        }

        console.log('[Phone Numbers API] Phone number updated successfully');

        return NextResponse.json({
            success: true,
            phoneNumber: {
                id: phoneNumber._id.toString(),
                userId: phoneNumber.userId,
                phoneNumber: phoneNumber.phoneNumber,
                provider: phoneNumber.provider,
                displayName: phoneNumber.displayName,
                exotelConfig: phoneNumber.exotelConfig,
                linkedAgentId: phoneNumber.linkedAgentId,
                webhookUrl: phoneNumber.webhookUrl,
                websocketUrl: phoneNumber.websocketUrl,
                status: phoneNumber.status,
                lastUsed: phoneNumber.lastUsed,
                createdAt: phoneNumber.createdAt,
                updatedAt: phoneNumber.updatedAt,
            },
        });

    } catch (error) {
        console.error('[Phone Numbers API] Error updating phone number:', error);
        return NextResponse.json(
            {
                error: 'Failed to update phone number',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 },
        );
    }
}

// DELETE - Delete a phone number
export async function DELETE(request: NextRequest) {
    console.log('[Phone Numbers API] DELETE request received');

    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { error: 'Phone number ID is required' },
                { status: 400 },
            );
        }

        const result = await PhoneNumber.findByIdAndDelete(id);

        if (!result) {
            return NextResponse.json(
                { error: 'Phone number not found' },
                { status: 404 },
            );
        }

        console.log('[Phone Numbers API] Phone number deleted successfully');

        return NextResponse.json({
            success: true,
            message: 'Phone number deleted successfully',
        });

    } catch (error) {
        console.error('[Phone Numbers API] Error deleting phone number:', error);
        return NextResponse.json(
            {
                error: 'Failed to delete phone number',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 },
        );
    }
}
