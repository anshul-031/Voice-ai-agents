export interface WhatsAppMetaConfig {
    appId: string;
    appSecret: string;
    businessId: string;
    accessToken: string;
    graphApiVersion?: string;
}

export function normalizeWhatsAppNumber(input: string | undefined | null): string {
    if (!input) {
        return '';
    }
    const trimmed = input.trim();
    if (!trimmed) {
        return '';
    }
    const hasPlus = trimmed.startsWith('+');
    const digitsOnly = trimmed.replace(/[^0-9]/g, '');
    if (!digitsOnly) {
        return hasPlus ? '+' : '';
    }
    return `${hasPlus ? '+' : ''}${digitsOnly}`;
}
