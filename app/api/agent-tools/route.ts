import dbConnect from '@/lib/mongodb';
import AgentTool from '@/models/AgentTool';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);
        const agentId = searchParams.get('agentId');
        const userId = searchParams.get('userId') || 'mukul';

        const query: Record<string, unknown> = { userId };
        if (agentId) {
            query.agentId = agentId;
        }

        const tools = await AgentTool.find(query).sort({ createdAt: -1 }).lean();
        return NextResponse.json({ tools });
    } catch (error) {
        console.error('[AgentTools] GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch agent tools' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const payload = await request.json();
        const {
            agentId,
            name,
            description,
            webhookUrl,
            method = 'POST',
            headers = [],
            parameters = [],
            triggerPhrases = [],
            successMessage,
            failureMessage,
            runAfterCall = false,
            userId = 'mukul',
        } = payload;

        if (!name || !webhookUrl) {
            return NextResponse.json({ error: 'Name and webhook URL are required' }, { status: 400 });
        }

        await dbConnect();

        const tool = await AgentTool.create({
            userId,
            agentId,
            name: String(name).trim(),
            description: description ? String(description).trim() : undefined,
            webhookUrl: String(webhookUrl).trim(),
            method,
            headers: Array.isArray(headers)
                ? headers.filter((h: any) => h?.key && h?.value).map((h: any) => ({ key: String(h.key).trim(), value: String(h.value) }))
                : [],
            parameters: Array.isArray(parameters)
                ? parameters.filter((p: any) => p?.name).map((p: any) => ({
                    name: String(p.name).trim(),
                    description: p?.description ? String(p.description).trim() : undefined,
                    type: p?.type ? String(p.type).trim() : 'string',
                    required: Boolean(p?.required),
                }))
                : [],
            triggerPhrases: Array.isArray(triggerPhrases)
                ? triggerPhrases.map((phrase: any) => String(phrase).trim()).filter(Boolean)
                : [],
            successMessage: successMessage ? String(successMessage).trim() : undefined,
            failureMessage: failureMessage ? String(failureMessage).trim() : undefined,
            runAfterCall: Boolean(runAfterCall),
        });

        return NextResponse.json({ tool });
    } catch (error) {
        console.error('[AgentTools] POST error:', error);
        return NextResponse.json({ error: 'Failed to create agent tool' }, { status: 500 });
    }
}
