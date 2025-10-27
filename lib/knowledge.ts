import type { IAgentKnowledgeItem } from '@/models/VoiceAgent';

type KnowledgeInput = Partial<Record<keyof IAgentKnowledgeItem, unknown>> & Record<string, unknown>;

const KNOWN_TYPES = new Set<IAgentKnowledgeItem['type']>(['text', 'csv']);
const MAX_NAME_LENGTH = 120;
const MAX_PREVIEW_LENGTH = 240;

const isPlainObject = (value: unknown): value is KnowledgeInput => (
    typeof value === 'object' && value !== null && !Array.isArray(value)
);

const coerceType = (value: unknown): IAgentKnowledgeItem['type'] => (
    typeof value === 'string' && KNOWN_TYPES.has(value as IAgentKnowledgeItem['type'])
        ? value as IAgentKnowledgeItem['type']
        : 'text'
);

const coerceDate = (value: unknown): Date => {
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
    if (typeof value === 'number' && Number.isFinite(value)) return new Date(value);
    if (typeof value === 'string') {
        const parsed = new Date(value);
        if (!Number.isNaN(parsed.getTime())) return parsed;
    }
    return new Date();
};

const coercePreview = (content: string, preview: unknown): string | undefined => {
    if (typeof preview === 'string' && preview.trim()) {
        return preview.slice(0, MAX_PREVIEW_LENGTH);
    }
    if (content) {
        return content.slice(0, MAX_PREVIEW_LENGTH);
    }
    return undefined;
};

const coerceName = (value: unknown): string | null => {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    return trimmed.slice(0, MAX_NAME_LENGTH);
};

const coerceItemId = (value: unknown): string | null => {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed || null;
};

const coerceSize = (value: unknown): number => {
    if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
        return value;
    }
    if (typeof value === 'string') {
        const parsed = Number(value);
        if (Number.isFinite(parsed) && parsed >= 0) return parsed;
    }
    return 0;
};

const coerceContent = (value: unknown): string | null => {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
};

const sanitizeItem = (value: unknown): IAgentKnowledgeItem | null => {
    if (!isPlainObject(value)) return null;

    const itemId = coerceItemId(value.itemId);
    const name = coerceName(value.name);
    const content = coerceContent(value.content);

    if (!itemId || !name || !content) return null;

    const size = coerceSize(value.size);
    const type = coerceType(value.type);
    const createdAt = coerceDate(value.createdAt);
    const preview = coercePreview(content, value.preview);

    return {
        itemId,
        name,
        content,
        size,
        type,
        preview,
        createdAt,
    };
};

export const sanitizeKnowledgeItems = (items: unknown): IAgentKnowledgeItem[] => {
    if (!Array.isArray(items)) return [];

    return items
        .map(sanitizeItem)
        .filter((item): item is IAgentKnowledgeItem => Boolean(item));
};

export const getKnowledgeStats = (items: unknown) => {
    const sanitized = sanitizeKnowledgeItems(items);
    const totalSize = sanitized.reduce((sum, item) => sum + (item.size || 0), 0);
    const csvCount = sanitized.filter(item => item.type === 'csv').length;
    const textCount = sanitized.length - csvCount;
    const lastUpdated = sanitized.reduce<Date | null>((latest, item) => {
        if (!latest || item.createdAt > latest) return item.createdAt;
        return latest;
    }, null);

    return {
        totalItems: sanitized.length,
        totalSize,
        csvCount,
        textCount,
        lastUpdated,
    };
};

export type KnowledgeStats = ReturnType<typeof getKnowledgeStats>;
