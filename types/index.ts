export interface Message {
    id: string;
    text: string;
    source: 'user' | 'assistant';
    timestamp: Date;
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
}

export interface TTSResponse {
    audioUrl?: string;
    audioData?: string; // base64 encoded audio
}