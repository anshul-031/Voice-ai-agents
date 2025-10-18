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
}

export interface TTSResponse {
    audioUrl?: string;
    audioData?: string; // base64 encoded audio
}
