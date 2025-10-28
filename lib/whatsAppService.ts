import dbConnect from '@/lib/mongodb';
import type { MessageHistory } from '@/lib/voiceAgentPipeline';
import { generateAgentReply } from '@/lib/voiceAgentPipeline';
import { normalizeWhatsAppNumber } from '@/lib/whatsappUtils';
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

const DEFAULT_GRAPH_API_VERSION = 'v20.0';

interface SendMessageOptions {
    accessToken?: string;
    phoneNumberId?: string;
    graphApiVersion?: string;
    apiUrl?: string;
}

interface ResolvedSendContext {
    url: string;
    token: string;
}

/**
 * Sends a message to the Meta WhatsApp API.
 * @param metaMessageRequest The message request object
 * @returns The parsed MetaMessageResponse or null on error
 */
function resolveSendContext(options?: SendMessageOptions): ResolvedSendContext | null {
    const trimmedToken = options?.accessToken?.trim();
    
    // Priority 1: Use provided API URL with token
    if (options?.apiUrl && trimmedToken) {
        console.log('[WhatsApp Send] Using custom API URL');
        return {
            url: options.apiUrl,
            token: trimmedToken,
        };
    }

    // Priority 2: Use phoneNumberId with token (MOST COMMON - from configured number)
    if (options?.phoneNumberId && trimmedToken) {
        const version = options.graphApiVersion?.trim() || DEFAULT_GRAPH_API_VERSION;
        const url = `https://graph.facebook.com/${version}/${options.phoneNumberId}/messages`;
        console.log('[WhatsApp Send] Using phoneNumberId:', options.phoneNumberId);
        console.log('[WhatsApp Send] URL:', url);
        return {
            url,
            token: trimmedToken,
        };
    }

    // Priority 3: Fallback to env variables (ONLY if no options provided)
    const envUrl = process.env.NEXT_PUBLIC_META_WHATSAPP_API_URL?.trim();
    const envToken = process.env.NEXT_PUBLIC_META_WHATSAPP_API_TOKEN?.trim();

    if (envUrl && envToken) {
        console.warn('[WhatsApp Send] WARNING: Using fallback env variables - this may send from wrong number!');
        console.log('[WhatsApp Send] Env URL:', envUrl);
        return {
            url: envUrl,
            token: envToken,
        };
    }

    console.error('[WhatsApp Send] ERROR: No valid configuration found for sending message');
    return null;
}

export async function sendMessage(metaMessageRequest: MetaMessageRequest, options?: SendMessageOptions): Promise<MetaMessageResponse | null> {
    console.info('Entering sendMessage method');
    try {
        const context = resolveSendContext(options);
        if (!context) {
            console.error('Meta WhatsApp API configuration is missing. Cannot send WhatsApp message.');
            return null;
        }
        const response = await fetch(context.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${context.token}`,
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
export async function sendTextMessage(mobileNo: string, message: string, options?: SendMessageOptions): Promise<MetaMessageResponse | null> {
    const request = getMetaMessageRequest(mobileNo, message);
    console.info('MetaMessageRequest:', request);
    return await sendMessage(request, options);
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

        const normalizedCustomerForStorage = normalizeWhatsAppNumber(customerNumber) || customerNumber;

        await dbConnect();

        const configuredNumber = await findConfiguredWhatsAppNumber(metadata, message);
        const agent = await resolveVoiceAgent(configuredNumber);
        const sendOptions = buildSendMessageOptions(configuredNumber);

        const configuredNumberId = configuredNumber?._id
            ? (typeof configuredNumber._id === 'string' ? configuredNumber._id : configuredNumber._id.toString())
            : undefined;

        const sessionId = buildSessionId(customerNumber, businessNumber);

        const previousMessages = await WhatsAppMessage.find({ sessionId })
            .sort({ createdAt: 1 })
            .limit(40)
            .lean();

        if (inboundContent) {
            await WhatsAppMessage.create({
                sessionId,
                phoneNumber: normalizedCustomerForStorage,
                direction: 'inbound',
                messageType,
                content: inboundContent,
                messageId: message.id,
                agentId: agent?.id,
                metadata: {
                    metadata,
                    message,
                    configuredWhatsAppNumberId: configuredNumberId,
                },
            });
        }

        if (!agent) {
            console.error('No voice agent configured for WhatsApp number');
            if (customerNumber) {
                const fallback = 'Sorry, we are unable to process your request right now.';
                await sendAndPersistOutbound(sessionId, customerNumber, fallback, 'text', undefined, undefined, sendOptions);
            }
            return;
        }

        if (!shouldProcessAsText) {
            console.warn('Received non-text message. Responding with unsupported notice.');
            const unsupported = 'This channel currently supports text messages only. Please send your query as text.';
            await sendAndPersistOutbound(sessionId, customerNumber, unsupported, 'unsupported', agent.id, undefined, sendOptions);
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
                    voiceAgentId: agent.id,
                },
                sendOptions,
            );
        } catch (pipelineError) {
            console.error('Voice agent pipeline error:', pipelineError instanceof Error ? pipelineError.message : pipelineError);
            const failure = 'I am facing an issue generating a response right now. Please try again later.';
            await sendAndPersistOutbound(sessionId, customerNumber, failure, 'unsupported', agent.id, undefined, sendOptions);
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

function pushMatcher(matchers: Array<Record<string, unknown>>, matcher: Record<string, unknown>) {
    const serialized = JSON.stringify(matcher);
    if (!matchers.some(existing => JSON.stringify(existing) === serialized)) {
        matchers.push(matcher);
    }
}

function addPhoneMatchers(matchers: Array<Record<string, unknown>>, value?: string) {
    if (!value) {
        return;
    }
    const trimmed = value.trim();
    if (!trimmed) {
        return;
    }
    pushMatcher(matchers, { phoneNumber: trimmed });
    const normalized = normalizeWhatsAppNumber(trimmed);
    if (normalized && normalized !== trimmed) {
        pushMatcher(matchers, { phoneNumber: normalized });
    }
}

async function findConfiguredWhatsAppNumber(metadata: any, message: any): Promise<IWhatsAppNumber | null> {
    const matchers: Array<Record<string, unknown>> = [];

    if (metadata?.phone_number_id) {
        pushMatcher(matchers, { phoneNumberId: metadata.phone_number_id });
    }

    addPhoneMatchers(matchers, metadata?.display_phone_number);
    addPhoneMatchers(matchers, message?.to);

    if (!matchers.length) {
        console.warn('[WhatsApp] No matchers found for configured number');
        return null;
    }

    console.log('[WhatsApp] Searching for configured number with matchers:', JSON.stringify(matchers));
    const foundNumber = await WhatsAppNumber.findOne({ $or: matchers });
    
    if (foundNumber) {
        console.log('[WhatsApp] Found configured number:', {
            phoneNumber: foundNumber.phoneNumber,
            phoneNumberId: foundNumber.phoneNumberId,
            displayName: foundNumber.displayName,
            linkedAgentId: foundNumber.linkedAgentId,
            hasMetaConfig: !!foundNumber.metaConfig
        });
    } else {
        console.error('[WhatsApp] No configured number found in database for this message');
    }
    
    return foundNumber;
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

function normalizeSessionComponent(value: string): string {
    const trimmed = value?.trim?.() ?? '';
    if (!trimmed) {
        return '';
    }

    if (/[a-zA-Z]/.test(trimmed)) {
        return trimmed;
    }

    return normalizeWhatsAppNumber(trimmed) || trimmed;
}

function buildSessionId(customerNumber: string, businessNumber: string): string {
    const normalizedCustomer = normalizeSessionComponent(customerNumber);
    const normalizedBusiness = normalizeSessionComponent(businessNumber);
    return `whatsapp_${normalizedBusiness}_${normalizedCustomer}`;
}

function mapStoredMessageToHistory(message: any): MessageHistory {
    const direction = message.direction as WhatsAppMessageDirection | undefined;
    const source: 'user' | 'assistant' = direction === 'outbound' ? 'assistant' : 'user';
    return {
        text: message.content,
        source,
    };
}

function buildSendMessageOptions(number: IWhatsAppNumber | null): SendMessageOptions | undefined {
    if (!number?.metaConfig) {
        console.warn('[WhatsApp Send] No metaConfig found for WhatsApp number');
        return undefined;
    }

    const accessToken = number.metaConfig.accessToken?.trim();
    const phoneNumberId = number.phoneNumberId?.trim();
    const graphApiVersion = number.metaConfig.graphApiVersion?.trim();

    if (!accessToken || !phoneNumberId) {
        console.error('[WhatsApp Send] Missing accessToken or phoneNumberId in metaConfig');
        console.error('[WhatsApp Send] Has accessToken:', !!accessToken);
        console.error('[WhatsApp Send] Has phoneNumberId:', !!phoneNumberId);
        return undefined;
    }

    console.log('[WhatsApp Send] Built send options for phoneNumberId:', phoneNumberId);
    return {
        accessToken,
        phoneNumberId,
        graphApiVersion,
    };
}

async function sendAndPersistOutbound(
    sessionId: string,
    customerNumber: string,
    message: string,
    messageType: WhatsAppMessageType,
    agentId?: string,
    metadata?: Record<string, unknown>,
    options?: SendMessageOptions,
) {
    await sendTextMessage(customerNumber, message, options);

    await WhatsAppMessage.create({
        sessionId,
        phoneNumber: normalizeWhatsAppNumber(customerNumber) || customerNumber,
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
    buildSendMessageOptions,
};