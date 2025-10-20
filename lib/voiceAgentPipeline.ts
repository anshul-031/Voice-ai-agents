import { GoogleGenerativeAI } from '@google/generative-ai';

export interface MessageHistory {
    text: string;
    source: 'user' | 'assistant';
}

function ensureUserText(userText: string): string {
    const trimmed = userText?.trim();
    if (!trimmed) {
        throw new Error('No user text provided');
    }
    return trimmed;
}

export function formatConversationHistory(messages: MessageHistory[], systemPrompt: string, currentUserText: string, maxMessages: number = 20): string {
    const recentMessages = messages.slice(-Math.max(maxMessages, 1));
    let formattedPrompt = `${(systemPrompt || '').trim()}\n\n`;

    if (recentMessages.length > 0) {
        formattedPrompt += '## Previous Conversation:\n';
        for (const msg of recentMessages) {
            const role = msg.source === 'user' ? 'User' : 'Assistant';
            formattedPrompt += `${role}: ${msg.text}\n`;
        }
        formattedPrompt += '\n';
    }

    formattedPrompt += `User: ${ensureUserText(currentUserText)}`;
    return formattedPrompt;
}

async function initialiseGeminiModel() {
    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (!geminiApiKey) {
        throw new Error('LLM service not configured');
    }

    const genAI = new GoogleGenerativeAI(geminiApiKey);

    try {
        return {
            modelName: 'gemini-2.0-flash',
            model: genAI.getGenerativeModel({ model: 'gemini-2.0-flash' }),
        };
    } catch (primaryError) {
        try {
            return {
                modelName: 'gemini-pro',
                model: genAI.getGenerativeModel({ model: 'gemini-pro' }),
            };
        } catch (fallbackError) {
            const error = fallbackError instanceof Error ? fallbackError : new Error(String(fallbackError));
            error.message = `Failed to initialise Gemini model: ${error.message}`;
            throw error;
        }
    }
}

async function extractText(raw: any): Promise<string | null> {
    if (!raw) {
        return null;
    }

    if (raw.response && typeof raw.response.text === 'function') {
        return await raw.response.text();
    }

    if (typeof raw.text === 'function') {
        return await raw.text();
    }

    if (Array.isArray(raw.output) && raw.output[0]) {
        const first = raw.output[0];
        if (typeof first.content === 'string') {
            return first.content;
        }
        if (Array.isArray(first.content) && first.content[0] && typeof first.content[0].text === 'string') {
            return first.content[0].text;
        }
    }

    if (Array.isArray(raw.candidates) && raw.candidates[0]) {
        const candidate = raw.candidates[0];
        if (typeof candidate.output === 'string') {
            return candidate.output;
        }
        if (candidate.content && typeof candidate.content === 'string') {
            return candidate.content;
        }
    }

    if (typeof raw === 'string') {
        return raw;
    }

    if (raw && typeof raw.text === 'string') {
        return raw.text;
    }

    return null;
}

interface GenerateAgentReplyOptions {
    systemPrompt: string;
    userText: string;
    history?: MessageHistory[];
    maxMessages?: number;
}

export interface AgentReplyResult {
    text: string;
    fullPrompt: string;
    rawResult: unknown;
    modelName: string;
}

export async function generateAgentReply(options: GenerateAgentReplyOptions): Promise<AgentReplyResult> {
    const { systemPrompt, userText, history = [], maxMessages } = options;

    const trimmedUserText = ensureUserText(userText);
    const fullPrompt = formatConversationHistory(history, systemPrompt || '', trimmedUserText, maxMessages);

    const { model, modelName } = await initialiseGeminiModel();
    const generativeModel = model as unknown as {
        generateContent?: (input: unknown) => Promise<unknown>;
        generate?: ((input: unknown) => Promise<unknown>) & ((input: string) => Promise<unknown>);
    };

    let rawResult: any;

    if (typeof generativeModel.generateContent === 'function') {
        rawResult = await generativeModel.generateContent(fullPrompt);
    } else if (typeof generativeModel.generate === 'function') {
        try {
            rawResult = await generativeModel.generate({ prompt: fullPrompt });
        } catch (err) {
            rawResult = await generativeModel.generate(fullPrompt);
        }
    } else {
        throw new Error('Model does not support content generation');
    }

    const llmText = await extractText(rawResult);

    if (!llmText) {
        throw new Error('Received empty response from LLM');
    }

    return {
        text: llmText.trim(),
        fullPrompt,
        rawResult,
        modelName,
    };
}
