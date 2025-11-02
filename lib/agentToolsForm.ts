export interface HeaderInput {
    key?: string;
    value?: string;
}

export interface ParameterInput {
    name?: string;
    description?: string | null;
    type?: string | null;
    required?: boolean | null;
}

export interface SanitizedHeader {
    key: string;
    value: string;
}

export interface SanitizedParameter {
    name: string;
    description?: string;
    type: 'string' | 'number' | 'boolean';
    required: boolean;
}

const ALLOWED_PARAMETER_TYPES = new Set(['string', 'number', 'boolean']);

export const sanitizeHeaders = (headers: HeaderInput[]): SanitizedHeader[] =>
    headers
        .map(({ key, value }) => ({
            key: String(key ?? '').trim(),
            value: String(value ?? '').trim(),
        }))
        .filter(({ key, value }) => Boolean(key) && Boolean(value));

export const sanitizeParameters = (parameters: ParameterInput[]): SanitizedParameter[] =>
    parameters
        .map(({ name, description, type, required }) => {
            const normalizedType = String(type ?? '').trim().toLowerCase();
            const safeType = ALLOWED_PARAMETER_TYPES.has(normalizedType)
                ? (normalizedType as SanitizedParameter['type'])
                : 'string';

            const trimmedName = String(name ?? '').trim();
            const trimmedDescription = description?.trim?.();

            return {
                name: trimmedName,
                description: trimmedDescription ? trimmedDescription : undefined,
                type: safeType,
                required: Boolean(required),
            };
        })
        .filter(({ name }) => Boolean(name));

export const parseTriggerPhrases = (rawValue: string): string[] =>
    rawValue
        .split(/[\n,]/)
        .map(part => part.trim())
        .filter(Boolean);
