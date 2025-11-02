import dbConnect from '@/lib/mongodb';
import AgentTool from '@/models/AgentTool';
import { NextResponse, type NextRequest } from 'next/server';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ toolId: string }> }) {
    try {
        const { toolId } = await params;
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
        if (Array.isArray(headers)) {
            tool.headers = headers
                .filter((header: { key?: string; value?: string }) => header?.key && header?.value)
                .map((header: { key: string; value: string }) => ({
                    key: String(header.key).trim(),
                    value: String(header.value),
                }));
        }
        if (Array.isArray(parameters)) {
            tool.parameters = parameters
                .filter((param: { name?: string }) => param?.name)
                .map((param: { name: string; description?: string; type?: string; required?: boolean }) => ({
                    name: String(param.name).trim(),
                    description: param?.description ? String(param.description).trim() : undefined,
                    type: param?.type ? String(param.type).trim() : 'string',
                    required: Boolean(param?.required),
                }));
        }
        if (Array.isArray(triggerPhrases)) {
            tool.triggerPhrases = triggerPhrases
                .map((phrase: string) => String(phrase).trim())
                .filter(Boolean);
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

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ toolId: string }> }) {
    try {
        const { toolId } = await params;
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
