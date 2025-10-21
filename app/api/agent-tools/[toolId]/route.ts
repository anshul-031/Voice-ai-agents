import dbConnect from '@/lib/mongodb';
import AgentTool from '@/models/AgentTool';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(request: NextRequest, context: unknown) {
    try {
        const { toolId } = (context as { params: { toolId: string } }).params;
        const payload = await request.json();

        await dbConnect();

        const tool = await AgentTool.findById(toolId);
        if (!tool) {
            return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
        }

        const {
            name,
            description,
            webhookUrl,
            method,
            headers,
            parameters,
            triggerPhrases,
            successMessage,
            failureMessage,
            runAfterCall,
        } = payload;

        if (name !== undefined) tool.name = String(name).trim();
        if (description !== undefined) tool.description = description ? String(description).trim() : undefined;
        if (webhookUrl !== undefined) tool.webhookUrl = String(webhookUrl).trim();
        if (method !== undefined) tool.method = method;
        if (headers !== undefined && Array.isArray(headers)) {
            tool.headers = headers.filter((h: any) => h?.key && h?.value).map((h: any) => ({ key: String(h.key).trim(), value: String(h.value) }));
        }
        if (parameters !== undefined && Array.isArray(parameters)) {
            tool.parameters = parameters.filter((p: any) => p?.name).map((p: any) => ({
                name: String(p.name).trim(),
                description: p?.description ? String(p.description).trim() : undefined,
                type: p?.type ? String(p.type).trim() : 'string',
                required: Boolean(p?.required),
            }));
        }
        if (triggerPhrases !== undefined && Array.isArray(triggerPhrases)) {
            tool.triggerPhrases = triggerPhrases.map((phrase: any) => String(phrase).trim()).filter(Boolean);
        }
        if (successMessage !== undefined) {
            tool.successMessage = successMessage ? String(successMessage).trim() : undefined;
        }
        if (failureMessage !== undefined) {
            tool.failureMessage = failureMessage ? String(failureMessage).trim() : undefined;
        }
        if (runAfterCall !== undefined) {
            tool.runAfterCall = Boolean(runAfterCall);
        }

        await tool.save();

        return NextResponse.json({ tool });
    } catch (error) {
        console.error('[AgentTools] PUT error:', error);
        return NextResponse.json({ error: 'Failed to update agent tool' }, { status: 500 });
    }
}

export async function DELETE(_request: NextRequest, context: unknown) {
    try {
        const { toolId } = (context as { params: { toolId: string } }).params;
        await dbConnect();

        const tool = await AgentTool.findById(toolId);
        if (!tool) {
            return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
        }

        await tool.deleteOne();
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[AgentTools] DELETE error:', error);
        return NextResponse.json({ error: 'Failed to delete agent tool' }, { status: 500 });
    }
}
