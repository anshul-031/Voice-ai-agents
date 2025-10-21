import dbConnect from '@/lib/mongodb';
import type { MessageHistory } from '@/lib/voiceAgentPipeline';
import { generateAgentReply } from '@/lib/voiceAgentPipeline';
import VoiceAgent, { type IVoiceAgent } from '@/models/VoiceAgent';
import WhatsAppMessage, { type WhatsAppMessageDirection, type WhatsAppMessageType } from '@/models/WhatsAppMessage';
import WhatsAppNumber, { type IWhatsAppNumber } from '@/models/WhatsAppNumber';

// TypeScript interfaces for MetaMessageRequest and MetaMessageResponse
export interface MetaMessageRequest {
    messaging_product: string;
    recipient_type: string;
    to: string;
    type: string;
    text?: MetaTextMessageRequest;
    image?: MetaImageMessageRequest;
    interactive?: MetaInteractiveMessageRequest;
    template?: MetaTemplateMessageRequest;
}

export interface MetaTextMessageRequest {
    preview_url?: boolean;
    body: string;
}
export interface MetaImageMessageRequest {
    id?: string;
    link: string;
    caption?: string;
}
export interface MetaInteractiveMessageRequest {
    type: string;
    header?: InteractiveMessageHeader;
    body?: InteractiveMessageBody;
    footer?: InteractiveMessageFooter;
    action?: InteractiveMessageAction;
}

export interface InteractiveMessageHeader {
    type: string;
    text?: string;
    image?: InteractiveMessageImage;
}

export interface InteractiveMessageImage {
    link: string;
}

export interface InteractiveMessageBody {
    text: string;
}

export interface InteractiveMessageFooter {
    text: string;
}

export interface InteractiveMessageAction {
    name?: string;
    button?: string;
    buttons?: InteractiveMessageButton[];
    sections?: InteractiveMessageSection[];
    parameters?: InteractiveMessageParameter;
}

export interface InteractiveMessageButton {
    type: string;
    reply?: InteractiveMessageReply;
}

export interface InteractiveMessageReply {
    id: string;
    title: string;
}

export interface InteractiveMessageSection {
    title?: string;
    rows?: InteractiveMessageRow[];
}

export interface InteractiveMessageRow {
    id: string;
    title: string;
    description?: string;
}

export interface InteractiveMessageParameter {
    displayText?: string;
    url?: string;
}
export interface MetaTemplateMessageRequest {
    name: string;
    language: TemplateMessageLanguage;
    components: Component[];
}

export interface TemplateMessageLanguage {
    code: string;
}

export interface Component {
    type: string;
    parameters: Parameter[];
}

export interface Parameter {
    type: string;
    text?: string;
    image?: Image;
}

export interface Image {
    link: string;
}

export interface MetaMessageResponse {
    messaging_product: string;
    contacts: Array<{
        input: string;
        wa_id: string;
    }>;
    messages: Array<{
        id: string;
        message_status: string;
    }>;
}

/**
 * Sends a message to the Meta WhatsApp API.
 * @param metaMessageRequest The message request object
 * @returns The parsed MetaMessageResponse or null on error
 */
export async function sendMessage(metaMessageRequest: MetaMessageRequest): Promise<MetaMessageResponse | null> {
    console.info('Entering sendMessage method');
    try {
        const url = process.env.NEXT_PUBLIC_META_WHATSAPP_API_URL;
        const token = process.env.NEXT_PUBLIC_META_WHATSAPP_API_TOKEN;
        if (!url || !token) {
            console.error('Meta WhatsApp API URL or Token is not set in environment variables');
            return null;
        }
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(metaMessageRequest),
        });
        console.info('Meta API call completed');
        if (!response.ok) {
            const errorText = await response.text();
            console.info('Error in sendMessage:', response.status, errorText);
            console.error('Error in sendMessage:', response.status, errorText);
            console.warn('Error in sendMessage:', response.status, errorText);
            return null;
        }
        const metaResponse = await response.json();
        if (metaResponse.response) {
            console.info('MetaMessageResponse with response field:', metaResponse.response);
            console.warn('MetaMessageResponse with response field:', metaResponse.response);
            return metaResponse.response as MetaMessageResponse;
        }
        return metaResponse as MetaMessageResponse;
    } catch (e: any) {
        console.error('Exception in sendMessage', e?.message);
        return null;
    }
}

/**
 * Builds a MetaMessageRequest object for WhatsApp API
 * @param mobileNo - recipient's mobile number
 * @param message - message body
 * @returns MetaMessageRequest object
 */
function getMetaMessageRequest(mobileNo: string, message: string): MetaMessageRequest {
    return {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: mobileNo,
        type: "text",
        text: {
            preview_url: false,
            body: message
        }
    };
}

/**
 * Sends a WhatsApp text message to the given mobile number.
 * @param mobileNo - recipient's mobile number
 * @param message - message body
 * @returns MetaMessageResponse or null on error
 */
export async function sendTextMessage(mobileNo: string, message: string): Promise<MetaMessageResponse | null> {
    const request = getMetaMessageRequest(mobileNo, message);
    console.info('MetaMessageRequest:', request);
    return await sendMessage(request);
}
/**
 * Processes WhatsApp webhook callback and extracts user phone number and message.
 * @param callbackResponse The parsed webhook JSON object
 */
export async function processWhatsAppCallback(callbackResponse: any): Promise<void> {
    try {
        const entry = callbackResponse?.entry?.[0];
        const change = entry?.changes?.[0];
        const value = change?.value;
        const message = value?.messages?.[0];

        if (!message) {
            console.warn('WhatsApp callback received with no message payload');
            return;
        }

        const metadata = value?.metadata;
        const messageType = inferMessageType(message);
        const customerNumber = message?.from as string | undefined;
        const businessNumber = resolveBusinessNumber(metadata, message);
        const inboundContent = extractInboundContent(message);
        const shouldProcessAsText = messageType === 'text' && typeof inboundContent === 'string' && inboundContent.length > 0;

        if (!customerNumber || !businessNumber) {
            console.error('Unable to resolve WhatsApp numbers from payload');
            return;
        }

        await dbConnect();

        const configuredNumber = await findConfiguredWhatsAppNumber(metadata, message);
        const agent = await resolveVoiceAgent(configuredNumber);

        const sessionId = buildSessionId(customerNumber, businessNumber);

        const previousMessages = await WhatsAppMessage.find({ sessionId })
            .sort({ createdAt: 1 })
            .limit(40)
            .lean();

        if (inboundContent) {
            await WhatsAppMessage.create({
                sessionId,
                phoneNumber: customerNumber,
                direction: 'inbound',
                messageType,
                content: inboundContent,
                messageId: message.id,
                agentId: agent?.id,
                metadata: { metadata, message },
            });
        }

        if (!agent) {
            console.error('No voice agent configured for WhatsApp number');
            if (customerNumber) {
                const fallback = 'Sorry, we are unable to process your request right now.';
                await sendAndPersistOutbound(sessionId, customerNumber, fallback, 'text', undefined);
            }
            return;
        }

        if (!shouldProcessAsText) {
            console.warn('Received non-text message. Responding with unsupported notice.');
            const unsupported = 'This channel currently supports text messages only. Please send your query as text.';
            await sendAndPersistOutbound(sessionId, customerNumber, unsupported, 'unsupported', agent.id);
            return;
        }

        const history: MessageHistory[] = previousMessages.map(mapStoredMessageToHistory);

        try {
            const agentReply = await generateAgentReply({
                systemPrompt: agent.prompt,
                userText: inboundContent,
                history,
            });

            await sendAndPersistOutbound(
                sessionId,
                customerNumber,
                agentReply.text,
                'text',
                agent.id,
                {
                    model: agentReply.modelName,
                },
            );
        } catch (pipelineError) {
            console.error('Voice agent pipeline error:', pipelineError instanceof Error ? pipelineError.message : pipelineError);
            const failure = 'I am facing an issue generating a response right now. Please try again later.';
            await sendAndPersistOutbound(sessionId, customerNumber, failure, 'unsupported', agent.id);
        }
    } catch (e: any) {
        console.error('Error in processWhatsAppCallback:', e?.message || e);
    }
}

function inferMessageType(message: any): WhatsAppMessageType {
    if (!message) return 'unsupported';
    switch (message.type) {
        case 'text':
            return 'text';
        case 'image':
            return 'image';
        case 'audio':
            return 'audio';
        case 'document':
            return 'document';
        default:
            return 'unsupported';
    }
}

function resolveBusinessNumber(metadata: any, message: any): string | undefined {
    return metadata?.display_phone_number || metadata?.phone_number_id || message?.to;
}

async function findConfiguredWhatsAppNumber(metadata: any, message: any): Promise<IWhatsAppNumber | null> {
    const matchers: Array<Record<string, unknown>> = [];

    if (metadata?.phone_number_id) {
        matchers.push({ phoneNumberId: metadata.phone_number_id });
    }

    if (metadata?.display_phone_number) {
        matchers.push({ phoneNumber: metadata.display_phone_number });
    }

    if (message?.to) {
        matchers.push({ phoneNumber: message.to });
    }

    if (!matchers.length) {
        return null;
    }

    return await WhatsAppNumber.findOne({ $or: matchers });
}

async function resolveVoiceAgent(number: IWhatsAppNumber | null): Promise<IVoiceAgent | null> {
    if (number?.linkedAgentId) {
        const agent = await VoiceAgent.findById(number.linkedAgentId);
        if (agent) {
            return agent;
        }
    }

    const envAgentId = process.env.WHATSAPP_VOICE_AGENT_ID;
    if (envAgentId) {
        const agent = await VoiceAgent.findById(envAgentId);
        if (agent) {
            return agent;
        }
    }

    if (number) {
        return await VoiceAgent.findOne({ userId: number.userId }).sort({ createdAt: -1 });
    }

    return null;
}

function buildSessionId(customerNumber: string, businessNumber: string): string {
    return `whatsapp_${businessNumber}_${customerNumber}`;
}

function mapStoredMessageToHistory(message: any): MessageHistory {
    const direction = message.direction as WhatsAppMessageDirection | undefined;
    const source: 'user' | 'assistant' = direction === 'outbound' ? 'assistant' : 'user';
    return {
        text: message.content,
        source,
    };
}

async function sendAndPersistOutbound(
    sessionId: string,
    customerNumber: string,
    message: string,
    messageType: WhatsAppMessageType,
    agentId?: string,
    metadata?: Record<string, unknown>,
) {
    await sendTextMessage(customerNumber, message);

    await WhatsAppMessage.create({
        sessionId,
        phoneNumber: customerNumber,
        direction: 'outbound',
        messageType,
        content: message,
        agentId,
        metadata,
    });
}

function extractInboundContent(message: any): string | undefined {
    if (!message) return undefined;
    if (message.type === 'text') {
        const body = message?.text?.body?.trim();
        return body || undefined;
    }
    if (message.type === 'image') {
        return message.image?.caption ? `[image] ${message.image.caption}` : '[image]';
    }
    if (message.type === 'audio') {
        return '[audio]';
    }
    if (message.type === 'document') {
        return message.document?.caption ? `[document] ${message.document.caption}` : '[document]';
    }
    return '[unsupported]';
}

// Export internal helpers for targeted unit testing without duplicating logic.
export const __testExports = {
    findConfiguredWhatsAppNumber,
    resolveVoiceAgent,
    inferMessageType,
    resolveBusinessNumber,
    buildSessionId,
    mapStoredMessageToHistory,
    extractInboundContent,
};