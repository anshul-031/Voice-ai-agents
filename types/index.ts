export interface PDFAttachment {
    fileName: string;
    pdfData: string; // base64 data URI
    title: string;
}

export interface Message {
    id: string;
    text: string;
    source: 'user' | 'assistant';
    timestamp: Date;
    pdfAttachment?: PDFAttachment;
}

export interface ModelConfig {
    llmModel: string;
    sttModel: string;
    ttsModel: string;
}

export interface VoiceRecorderState {
    isListening: boolean;
    isProcessing: boolean;
    audioLevel: number;
}

export interface TranscriptionResponse {
    text: string;
    transcriptId?: string;
}

export interface LLMResponse {
    llmText: string;
    pdfCommand?: {
        title: string;
        sections: Array<{
            type: 'heading' | 'text' | 'list' | 'table';
            content: string | string[] | string[][];
            level?: number;
        }>;
        fileName?: string;
    };
    toolInvocation?: ToolInvocationResult;
}

export interface TTSResponse {
    audioUrl?: string;
    audioData?: string; // base64 encoded audio
}

export interface AgentToolHeader {
    key: string;
    value: string;
}

export interface AgentToolParameter {
    name: string;
    description?: string;
    type?: string;
    required?: boolean;
}

export interface AgentToolDefinition {
    _id?: string;
    agentId?: string;
    name: string;
    description?: string;
    webhookUrl: string;
    method: 'GET' | 'POST';
    headers: AgentToolHeader[];
    parameters: AgentToolParameter[];
    triggerPhrases: string[];
    successMessage?: string;
    failureMessage?: string;
    runAfterCall?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface ToolInvocationResult {
    toolId: string;
    toolName: string;
    success: boolean;
    reason?: string;
    payload?: Record<string, unknown> | null;
    responseStatus?: number;
    responseBody?: unknown;
    error?: string | null;
}