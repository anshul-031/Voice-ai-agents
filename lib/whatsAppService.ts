/* eslint-disable no-console */

import dbConnect from '@/lib/mongodb';
import Chat from '@/models/Chat';
import VoiceAgent from '@/models/VoiceAgent';
import WhatsAppNumber from '@/models/WhatsAppNumber';
import { GoogleGenerativeAI } from '@google/generative-ai';

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

export interface WhatsAppCredentials {
    accessToken: string;
    phoneNumberId: string;
    apiVersion?: string;
}

const DEFAULT_GRAPH_VERSION = process.env.META_GRAPH_API_VERSION || 'v21.0';
const DEFAULT_ASSISTANT_PROMPT = 'You are a helpful assistant responding to customers on WhatsApp. Provide concise, friendly answers and keep the conversation focused on assisting the user.';

function resolveMessagesUrl(credentials?: WhatsAppCredentials): { url: string; token: string } | null {
    if (credentials) {
        const version = credentials.apiVersion || DEFAULT_GRAPH_VERSION;
        const url = `https://graph.facebook.com/${version}/${credentials.phoneNumberId}/messages`;
        return {
            url,
            token: credentials.accessToken,
        };
    }

    const fallbackUrl = process.env.NEXT_PUBLIC_META_WHATSAPP_API_URL;
    const fallbackToken = process.env.NEXT_PUBLIC_META_WHATSAPP_API_TOKEN;
    if (!fallbackUrl || !fallbackToken) {
        return null;
    }

    return {
        url: fallbackUrl,
        token: fallbackToken,
    };
}

/**
 * Sends a message to the Meta WhatsApp API.
 * @param metaMessageRequest The message request object
 * @param credentials Optional per-number credentials
 * @returns The parsed MetaMessageResponse or null on error
 */
export async function sendMessage(
    metaMessageRequest: MetaMessageRequest,
    credentials?: WhatsAppCredentials
): Promise<MetaMessageResponse | null> {
    try {
        const resolved = resolveMessagesUrl(credentials);
        if (!resolved) {
            console.error('Meta WhatsApp credentials or URL missing');
            return null;
        }

        const response = await fetch(resolved.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${resolved.token}`,
            },
            body: JSON.stringify(metaMessageRequest),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error in sendMessage:', response.status, errorText);
            return null;
        }

        const metaResponse = await response.json();
        if (metaResponse.response) {
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
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: mobileNo,
        type: 'text',
        text: {
            preview_url: false,
            body: message,
        },
    };
}

/**
 * Sends a WhatsApp text message to the given mobile number.
 * @param mobileNo - recipient's mobile number
 * @param message - message body
 * @param credentials Optional per-number credentials
 * @returns MetaMessageResponse or null on error
 */
export async function sendTextMessage(
    mobileNo: string,
    message: string,
    credentials?: WhatsAppCredentials
): Promise<MetaMessageResponse | null> {
    const request = getMetaMessageRequest(mobileNo, message);
    return await sendMessage(request, credentials);
}

interface ConversationRecord {
    role: 'user' | 'assistant';
    content: string;
}

function normalizePhone(value?: string): string {
    if (!value) return '';
    return value.replace(/[^0-9]/g, '');
}

function buildConversationPrompt(
    agentPrompt: string,
    history: ConversationRecord[],
    userMessage: string
): string {
    const trimmedPrompt = agentPrompt?.trim() || DEFAULT_ASSISTANT_PROMPT;
    const promptLines = [trimmedPrompt, '', '## Previous Conversation:'];

    history.forEach((entry) => {
        const role = entry.role === 'user' ? 'User' : 'Assistant';
        promptLines.push(`${role}: ${entry.content}`);
    });

    promptLines.push('', `User: ${userMessage}`);
    promptLines.push('Assistant:');

    return promptLines.join('\n');
}

async function extractTextFromResult(result: any): Promise<string | null> {
    if (!result) return null;

    try {
        if (result.response && typeof result.response.text === 'function') {
            return await result.response.text();
        }
        if (typeof result.text === 'function') {
            return await result.text();
        }
        if (Array.isArray(result.candidates) && result.candidates[0]) {
            const candidate = result.candidates[0];
            if (typeof candidate.output === 'string') return candidate.output;
            if (candidate.content && typeof candidate.content === 'string') return candidate.content;
            const parts = candidate.content?.parts;
            if (Array.isArray(parts) && parts[0]?.text) {
                return parts[0].text;
            }
        }
        if (Array.isArray(result.output) && result.output[0]) {
            const output = result.output[0];
            if (typeof output.content === 'string') return output.content;
            if (Array.isArray(output.content) && output.content[0]?.text) {
                return output.content[0].text;
            }
        }
        if (typeof result === 'string') return result;
        if (typeof result.text === 'string') return result.text;
        return JSON.stringify(result);
    } catch (error) {
        console.error('Failed to extract text from LLM result', error);
        return null;
    }
}

async function generateAgentReply(
    agentPrompt: string,
    history: ConversationRecord[],
    userMessage: string
): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('GEMINI_API_KEY is not configured');
        return 'Apologies, I am unable to respond right now.';
    }

    const fullPrompt = buildConversationPrompt(agentPrompt, history, userMessage);
    const genAI = new GoogleGenerativeAI(apiKey);

    let model: any;
    try {
        model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    } catch (primaryError) {
        console.warn('Failed to load gemini-2.0-flash, falling back to gemini-pro');
        model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    }

    let result: any;
    if (typeof model.generateContent === 'function') {
        result = await model.generateContent(fullPrompt);
    } else if (typeof model.generate === 'function') {
        try {
            result = await model.generate({ prompt: fullPrompt });
        } catch (err) {
            result = await model.generate(fullPrompt);
        }
    } else {
        throw new Error('No compatible generate method available on Gemini client');
    }

    const text = await extractTextFromResult(result);
    if (!text) {
        console.error('LLM returned empty response');
        return 'I am having trouble formulating a response right now.';
    }
    return text.trim();
}

/**
 * Processes WhatsApp webhook callback and routes the message through a voice agent pipeline.
 * @param callbackResponse The parsed webhook JSON object
 */
export async function processWhatsAppCallback(callbackResponse: any): Promise<void> {
    try {
        await dbConnect();

        const entries: any[] = callbackResponse?.entry || [];
        for (const entry of entries) {
            const changes: any[] = entry?.changes || [];
            for (const change of changes) {
                const value = change?.value;
                if (!value) continue;

                const messages: any[] = value.messages || [];
                if (!Array.isArray(messages) || messages.length === 0) continue;

                const phoneNumberId: string | undefined = value.metadata?.phone_number_id;
                if (!phoneNumberId) continue;

                const whatsappNumber = await WhatsAppNumber.findOne({ phoneNumberId });
                if (!whatsappNumber) {
                    console.warn('No WhatsApp number configuration found for phone_number_id:', phoneNumberId);
                    continue;
                }

                for (const message of messages) {
                    if (message.type !== 'text') continue;

                    const userMobile: string | undefined = message.from;
                    const userMessage: string | undefined = message.text?.body?.trim();
                    if (!userMobile || !userMessage) continue;

                    const normalizedFrom = normalizePhone(userMobile);
                    if (!normalizedFrom) continue;

                    try {
                        const linkedAgent = whatsappNumber.linkedAgentId
                            ? await VoiceAgent.findById(whatsappNumber.linkedAgentId)
                            : await VoiceAgent.findOne({ userId: whatsappNumber.userId }).sort({ createdAt: -1 });

                        if (!linkedAgent) {
                            console.warn('No voice agent linked or available for WhatsApp number:', whatsappNumber._id.toString());
                            await sendTextMessage(
                                normalizedFrom,
                                'Thanks for your message. We will get back to you shortly.',
                                {
                                    accessToken: whatsappNumber.accessToken,
                                    phoneNumberId: whatsappNumber.phoneNumberId,
                                }
                            );
                            continue;
                        }

                        const sessionId = `wa_${whatsappNumber._id.toString()}_${normalizedFrom}`;
                        const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

                        const historyDocs = await Chat.find({
                            sessionId,
                            timestamp: { $gte: cutoff },
                        })
                            .sort({ timestamp: 1 })
                            .lean()
                            .exec();

                        const history: ConversationRecord[] = historyDocs.map((doc) => ({
                            role: doc.role === 'assistant' ? 'assistant' : 'user',
                            content: doc.content,
                        }));

                        await Chat.create({
                            userId: whatsappNumber.userId,
                            sessionId,
                            role: 'user',
                            content: userMessage,
                            timestamp: new Date(),
                            systemPrompt: linkedAgent.prompt,
                        });

                        const assistantReply = await generateAgentReply(linkedAgent.prompt, history, userMessage);

                        await Chat.create({
                            userId: whatsappNumber.userId,
                            sessionId,
                            role: 'assistant',
                            content: assistantReply,
                            timestamp: new Date(),
                        });

                        await sendTextMessage(
                            normalizedFrom,
                            assistantReply,
                            {
                                accessToken: whatsappNumber.accessToken,
                                phoneNumberId: whatsappNumber.phoneNumberId,
                            }
                        );

                        whatsappNumber.status = 'active';
                        whatsappNumber.lastUsed = new Date();
                        await whatsappNumber.save();

                        await Chat.deleteMany({ sessionId, timestamp: { $lt: cutoff } });
                    } catch (messageError) {
                        console.error('Failed to process WhatsApp message:', messageError);
                        whatsappNumber.status = 'error';
                        await whatsappNumber.save();
                    }
                }
            }
        }
    } catch (e: any) {
        console.error('Error in processWhatsAppCallback:', e?.message);
    }
}