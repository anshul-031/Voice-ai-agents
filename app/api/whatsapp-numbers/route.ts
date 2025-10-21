import dbConnect from '@/lib/mongodb';
import { normalizeWhatsAppNumber } from '@/lib/whatsappUtils';
import WhatsAppNumber, { type IWhatsAppNumber } from '@/models/WhatsAppNumber';
import type { Types } from 'mongoose';
import { NextResponse, type NextRequest } from 'next/server';

const MOCK_PHONE_RAW = '+91-98730 16484';
const MOCK_PHONE_ID = 'mock-phone-number-id';
const DEFAULT_GRAPH_VERSION = 'v20.0';

type MutableWhatsAppNumber = Partial<IWhatsAppNumber> & { updatedAt?: Date };

interface SanitizedWhatsAppNumber {
    id: string;
    userId: string;
    phoneNumber: string;
    phoneNumberId?: string;
    displayName?: string;
    linkedAgentId?: string;
    webhookUrl?: string;
    status: string;
    lastInteractionAt?: Date;
    settings?: Record<string, unknown>;
    metaConfig?: {
        appId?: string;
        appSecret?: string;
        businessId?: string;
        accessToken?: string;
        graphApiVersion?: string;
    };
    createdAt: Date;
    updatedAt: Date;
}

function maskSecret(secret?: string | null): string | undefined {
    if (!secret) {
        return undefined;
    }
    const trimmed = secret.trim();
    if (!trimmed) {
        return undefined;
    }
    return trimmed.length <= 4 ? '****' : `***${trimmed.slice(-4)}`;
}

function sanitizeMetaConfig(meta?: IWhatsAppNumber['metaConfig']): SanitizedWhatsAppNumber['metaConfig'] {
    if (!meta) {
        return undefined;
    }
    return {
        appId: maskSecret(meta.appId),
        appSecret: maskSecret(meta.appSecret),
        businessId: maskSecret(meta.businessId),
        accessToken: maskSecret(meta.accessToken),
        graphApiVersion: meta.graphApiVersion,
    };
}

function getWebhookPath(): string {
    return '/api/meta-webhook';
}

function ensureRelativeWebhook(url?: string | null): string | undefined {
    if (!url) {
        return undefined;
    }

    if (url.startsWith('/')) {
        return url;
    }

    try {
        const parsed = new URL(url);
        return `${parsed.pathname}${parsed.search || ''}`;
    } catch {
        return url;
    }
}

async function ensureMockWhatsAppNumber(userId: string) {
    const normalizedMock = normalizeWhatsAppNumber(MOCK_PHONE_RAW);
    if (!normalizedMock) {
        return;
    }

    const exists = await WhatsAppNumber.exists({ phoneNumber: normalizedMock });
    if (exists) {
        return;
    }

    const webhookUrl = getWebhookPath();

    await WhatsAppNumber.create({
        userId,
        phoneNumber: normalizedMock,
        phoneNumberId: MOCK_PHONE_ID,
        displayName: 'Mock WhatsApp Contact',
        status: 'inactive',
        webhookUrl,
        settings: {
            isMock: true,
            originalInput: MOCK_PHONE_RAW,
        },
        metaConfig: {
            appId: 'mock-app-id',
            appSecret: 'mock-app-secret',
            businessId: 'mock-business-id',
            accessToken: 'mock-access-token',
            graphApiVersion: DEFAULT_GRAPH_VERSION,
        },
    });
}

function toSanitizedResponse(doc: IWhatsAppNumber): SanitizedWhatsAppNumber {
    return {
        id: ((doc._id as Types.ObjectId) || doc._id)?.toString(),
        userId: doc.userId,
        phoneNumber: doc.phoneNumber,
        phoneNumberId: doc.phoneNumberId,
        displayName: doc.displayName,
        linkedAgentId: doc.linkedAgentId,
        webhookUrl: ensureRelativeWebhook(doc.webhookUrl),
        status: doc.status,
        lastInteractionAt: doc.lastInteractionAt,
        settings: doc.settings || undefined,
        metaConfig: sanitizeMetaConfig(doc.metaConfig),
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
    };
}

function sanitizeString(value: unknown): string | undefined {
    if (typeof value !== 'string') {
        return undefined;
    }
    const trimmed = value.trim();
    return trimmed || undefined;
}

function buildMetaConfig(bodyMeta: unknown, normalizeEmpty = false): IWhatsAppNumber['metaConfig'] | undefined {
    if (!bodyMeta || typeof bodyMeta !== 'object') {
        return undefined;
    }

    const meta = bodyMeta as Record<string, unknown>;

    const appId = sanitizeString(meta.appId);
    const appSecret = sanitizeString(meta.appSecret);
    const businessId = sanitizeString(meta.businessId);
    const accessToken = sanitizeString(meta.accessToken);
    const graphApiVersion = sanitizeString(meta.graphApiVersion) || DEFAULT_GRAPH_VERSION;

    const hasValues = Boolean(appId || appSecret || businessId || accessToken || meta.graphApiVersion);

    if (!hasValues && !normalizeEmpty) {
        return undefined;
    }

    return {
        appId: appId ?? '',
        appSecret: appSecret ?? '',
        businessId: businessId ?? '',
        accessToken: accessToken ?? '',
        graphApiVersion,
    };
}

// GET - Fetch all WhatsApp numbers for a user
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId') || 'mukul';

        await dbConnect();

        await ensureMockWhatsAppNumber(userId);

        const numbers = await WhatsAppNumber.find<IWhatsAppNumber>({ userId })
            .sort({ createdAt: -1 })
            .lean()
            .exec();

        return NextResponse.json({
            success: true,
            userId,
            whatsappNumbers: numbers.map((number) => toSanitizedResponse(number as unknown as IWhatsAppNumber)),
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
            { status: 500 },
        );
    }
}

// POST - Create a new WhatsApp number configuration
export async function POST(request: NextRequest) {
    try {
        await dbConnect();

        const body = await request.json();
        const {
            userId,
            phoneNumber,
            phoneNumberId,
            displayName,
            linkedAgentId,
            status,
            metaConfig,
        } = body ?? {};

        const normalizedNumber = normalizeWhatsAppNumber(phoneNumber);
        if (!normalizedNumber) {
            return NextResponse.json(
                { error: 'Missing or invalid phoneNumber' },
                { status: 400 },
            );
        }

        const requiredMeta = buildMetaConfig(metaConfig, true);
        if (!requiredMeta?.appId || !requiredMeta?.appSecret || !requiredMeta?.businessId || !requiredMeta?.accessToken) {
            return NextResponse.json(
                { error: 'Missing required meta configuration fields: appId, appSecret, businessId, accessToken' },
                { status: 400 },
            );
        }

        if (!sanitizeString(phoneNumberId)) {
            return NextResponse.json(
                { error: 'phoneNumberId is required' },
                { status: 400 },
            );
        }

        const existing = await WhatsAppNumber.findOne({ phoneNumber: normalizedNumber });
        if (existing) {
            return NextResponse.json(
                { error: 'WhatsApp number already exists' },
                { status: 400 },
            );
        }

        const webhookUrl = getWebhookPath();

        const doc = new WhatsAppNumber({
            userId: sanitizeString(userId) || 'mukul',
            phoneNumber: normalizedNumber,
            phoneNumberId: sanitizeString(phoneNumberId),
            displayName: sanitizeString(displayName),
            linkedAgentId: sanitizeString(linkedAgentId),
            status: sanitizeString(status) || 'active',
            webhookUrl,
            metaConfig: requiredMeta,
            settings: {
                originalInput: phoneNumber,
            },
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        await doc.save();

        return NextResponse.json({
            success: true,
            whatsappNumber: toSanitizedResponse(doc),
        });
    } catch (error) {
        console.error('[WhatsApp Numbers API] Error creating number:', error);
        return NextResponse.json(
            {
                error: 'Failed to create WhatsApp number',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 },
        );
    }
}

// PUT - Update an existing WhatsApp number
export async function PUT(request: NextRequest) {
    try {
        await dbConnect();

        const body = await request.json();
        const {
            id,
            displayName,
            linkedAgentId,
            status,
            phoneNumberId,
            metaConfig,
        } = body ?? {};

        if (!sanitizeString(id)) {
            return NextResponse.json(
                { error: 'Missing required field: id' },
                { status: 400 },
            );
        }

        const update: MutableWhatsAppNumber = {
            updatedAt: new Date(),
        };

        const safeDisplayName = sanitizeString(displayName);
        if (safeDisplayName !== undefined) {
            update.displayName = safeDisplayName;
        }

        if (typeof linkedAgentId !== 'undefined') {
            update.linkedAgentId = sanitizeString(linkedAgentId);
        }

        if (typeof status !== 'undefined') {
            const safeStatus = sanitizeString(status);
            if (safeStatus === 'active' || safeStatus === 'inactive') {
                update.status = safeStatus;
            }
        }

        if (typeof phoneNumberId !== 'undefined') {
            update.phoneNumberId = sanitizeString(phoneNumberId);
        }

        const metaUpdate = buildMetaConfig(metaConfig);
        if (metaUpdate) {
            update.metaConfig = metaUpdate;
        }

        const updated = await WhatsAppNumber.findByIdAndUpdate(
            id,
            update,
            { new: true, runValidators: true },
        );

        if (!updated) {
            return NextResponse.json(
                { error: 'WhatsApp number not found' },
                { status: 404 },
            );
        }

        return NextResponse.json({
            success: true,
            whatsappNumber: toSanitizedResponse(updated),
        });
    } catch (error) {
        console.error('[WhatsApp Numbers API] Error updating number:', error);
        return NextResponse.json(
            {
                error: 'Failed to update WhatsApp number',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 },
        );
    }
}

// DELETE - Remove a WhatsApp number
export async function DELETE(request: NextRequest) {
    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);
        const id = sanitizeString(searchParams.get('id'));

        if (!id) {
            return NextResponse.json(
                { error: 'WhatsApp number ID is required' },
                { status: 400 },
            );
        }

        const result = await WhatsAppNumber.findByIdAndDelete(id);

        if (!result) {
            return NextResponse.json(
                { error: 'WhatsApp number not found' },
                { status: 404 },
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
            { status: 500 },
        );
    }
}
