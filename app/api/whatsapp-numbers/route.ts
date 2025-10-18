/* eslint-disable no-console */

import dbConnect from '@/lib/mongodb';
import { sendTextMessage } from '@/lib/whatsAppService';
import WhatsAppNumber from '@/models/WhatsAppNumber';
import { NextRequest, NextResponse } from 'next/server';

const GRAPH_VERSION = process.env.META_GRAPH_API_VERSION || 'v21.0';
const DEFAULT_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.com';

interface MetaPhoneNumberEntry {
    id: string;
    display_phone_number?: string;
    verified_name?: string;
}

function normalizePhoneNumber(value: string): string {
    return value.replace(/[^0-9]/g, '');
}

async function fetchPhoneNumberId(
    businessId: string,
    accessToken: string,
    phoneNumber: string
): Promise<{ id: string; display: string } | null> {
    try {
        const url = `https://graph.facebook.com/${GRAPH_VERSION}/${businessId}/phone_numbers`;
        const res = await fetch(url, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error('[WhatsApp Numbers API] Failed to fetch phone numbers from Meta:', res.status, errorText);
            return null;
        }

        const payload = await res.json();
        const entries: MetaPhoneNumberEntry[] = payload?.data || [];
        const normalized = normalizePhoneNumber(phoneNumber);

        for (const entry of entries) {
            if (!entry.display_phone_number) continue;
            const candidate = normalizePhoneNumber(entry.display_phone_number);
            if (candidate === normalized) {
                return {
                    id: entry.id,
                    display: entry.display_phone_number,
                };
            }
        }

        console.warn('[WhatsApp Numbers API] No matching phone number found in Meta account');
        return null;
    } catch (error) {
        console.error('[WhatsApp Numbers API] Exception fetching phone number ID:', error);
        return null;
    }
}

export async function GET(request: NextRequest) {
    console.log('[WhatsApp Numbers API] GET request received');

    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId') || 'mukul';

        await dbConnect();

        const numbers = await WhatsAppNumber.find({ userId })
            .sort({ createdAt: -1 })
            .lean()
            .exec();

        return NextResponse.json({
            success: true,
            userId,
            numbers: numbers.map((num) => ({
                id: (num._id as any).toString(),
                displayName: num.displayName,
                phoneNumber: num.phoneNumber,
                phoneNumberId: num.phoneNumberId ? `${num.phoneNumberId.slice(0, 6)}***${num.phoneNumberId.slice(-4)}` : undefined,
                appId: num.appId,
                businessId: num.businessId,
                linkedAgentId: num.linkedAgentId,
                status: num.status,
                lastUsed: num.lastUsed,
                webhookUrl: num.webhookUrl,
                createdAt: num.createdAt,
                updatedAt: num.updatedAt,
            })),
            count: numbers.length,
        });
    } catch (error) {
        console.error('[WhatsApp Numbers API] Error fetching numbers:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch WhatsApp numbers',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    console.log('[WhatsApp Numbers API] POST request received');

    try {
        await dbConnect();

        const body = await request.json();
        const {
            userId,
            displayName,
            phoneNumber,
            appId,
            appSecret,
            businessId,
            accessToken,
            linkedAgentId,
        } = body;

        if (!displayName || !phoneNumber || !appId || !appSecret || !businessId || !accessToken) {
            return NextResponse.json(
                { error: 'Missing required fields: displayName, phoneNumber, appId, appSecret, businessId, accessToken' },
                { status: 400 }
            );
        }

        const normalizedNumber = normalizePhoneNumber(phoneNumber);
        if (!normalizedNumber) {
            return NextResponse.json(
                { error: 'Invalid phone number' },
                { status: 400 }
            );
        }

        const existing = await WhatsAppNumber.findOne({ phoneNumber: normalizedNumber });
        if (existing) {
            return NextResponse.json(
                { error: 'WhatsApp number already exists' },
                { status: 400 }
            );
        }

        const metaNumber = await fetchPhoneNumberId(businessId, accessToken, normalizedNumber);
        if (!metaNumber) {
            return NextResponse.json(
                { error: 'Unable to locate phone number inside Meta account. Verify credentials and number.' },
                { status: 400 }
            );
        }

        const webhookUrl = `${DEFAULT_BASE_URL}/api/meta-webhook`;

        const doc = new WhatsAppNumber({
            userId: userId || 'mukul',
            displayName: displayName.trim(),
            phoneNumber: normalizedNumber,
            phoneNumberId: metaNumber.id,
            appId: appId.trim(),
            appSecret: appSecret.trim(),
            businessId: businessId.trim(),
            accessToken: accessToken.trim(),
            linkedAgentId: linkedAgentId || undefined,
            webhookUrl,
            status: 'pending',
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        await doc.save();

        try {
            const sendResult = await sendTextMessage(
                normalizedNumber,
                'hi check',
                {
                    accessToken: doc.accessToken,
                    phoneNumberId: doc.phoneNumberId,
                }
            );

            if (sendResult) {
                doc.status = 'active';
                doc.lastUsed = new Date();
            } else {
                doc.status = 'error';
            }
            await doc.save();
        } catch (sendError) {
            console.error('[WhatsApp Numbers API] Failed to send verification message:', sendError);
            doc.status = 'error';
            await doc.save();
        }

        return NextResponse.json({
            success: true,
            number: {
                id: doc._id.toString(),
                displayName: doc.displayName,
                phoneNumber: doc.phoneNumber,
                phoneNumberId: doc.phoneNumberId,
                appId: doc.appId,
                businessId: doc.businessId,
                linkedAgentId: doc.linkedAgentId,
                status: doc.status,
                webhookUrl: doc.webhookUrl,
                createdAt: doc.createdAt,
                updatedAt: doc.updatedAt,
            },
        });
    } catch (error) {
        console.error('[WhatsApp Numbers API] Error creating number:', error);
        return NextResponse.json(
            {
                error: 'Failed to create WhatsApp number',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    console.log('[WhatsApp Numbers API] PUT request received');

    try {
        await dbConnect();

        const body = await request.json();
        const {
            id,
            displayName,
            appId,
            appSecret,
            businessId,
            accessToken,
            linkedAgentId,
            status,
        } = body;

        if (!id) {
            return NextResponse.json(
                { error: 'Missing required field: id' },
                { status: 400 }
            );
        }

        const doc = await WhatsAppNumber.findById(id);
        if (!doc) {
            return NextResponse.json(
                { error: 'WhatsApp number not found' },
                { status: 404 }
            );
        }

        let requireMetaRefresh = false;

        if (displayName) doc.displayName = displayName.trim();
        if (appId) doc.appId = appId.trim();
        if (appSecret) doc.appSecret = appSecret.trim();
        if (businessId) {
            doc.businessId = businessId.trim();
            requireMetaRefresh = true;
        }
        if (accessToken) {
            doc.accessToken = accessToken.trim();
            requireMetaRefresh = true;
        }
        if (linkedAgentId !== undefined) doc.linkedAgentId = linkedAgentId || undefined;
        if (status) doc.status = status;

        if (requireMetaRefresh) {
            const metaNumber = await fetchPhoneNumberId(doc.businessId, doc.accessToken, doc.phoneNumber);
            if (!metaNumber) {
                return NextResponse.json(
                    { error: 'Unable to verify WhatsApp number with updated credentials' },
                    { status: 400 }
                );
            }
            doc.phoneNumberId = metaNumber.id;
        }

        doc.updatedAt = new Date();
        await doc.save();

        return NextResponse.json({
            success: true,
            number: {
                id: doc._id.toString(),
                displayName: doc.displayName,
                phoneNumber: doc.phoneNumber,
                phoneNumberId: doc.phoneNumberId,
                appId: doc.appId,
                businessId: doc.businessId,
                linkedAgentId: doc.linkedAgentId,
                status: doc.status,
                webhookUrl: doc.webhookUrl,
                createdAt: doc.createdAt,
                updatedAt: doc.updatedAt,
            },
        });
    } catch (error) {
        console.error('[WhatsApp Numbers API] Error updating number:', error);
        return NextResponse.json(
            {
                error: 'Failed to update WhatsApp number',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    console.log('[WhatsApp Numbers API] DELETE request received');

    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { error: 'WhatsApp number ID is required' },
                { status: 400 }
            );
        }

        const result = await WhatsAppNumber.findByIdAndDelete(id);

        if (!result) {
            return NextResponse.json(
                { error: 'WhatsApp number not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'WhatsApp number deleted successfully',
        });
    } catch (error) {
        console.error('[WhatsApp Numbers API] Error deleting number:', error);
        return NextResponse.json(
            {
                error: 'Failed to delete WhatsApp number',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
