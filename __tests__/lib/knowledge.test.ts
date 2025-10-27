import { getKnowledgeStats, sanitizeKnowledgeItems } from '@/lib/knowledge';

describe('Knowledge Utility Functions', () => {
    describe('sanitizeKnowledgeItems', () => {
        it('should return empty array for non-array input', () => {
            expect(sanitizeKnowledgeItems(null)).toEqual([]);
            expect(sanitizeKnowledgeItems(undefined)).toEqual([]);
            expect(sanitizeKnowledgeItems('not an array')).toEqual([]);
            expect(sanitizeKnowledgeItems(123)).toEqual([]);
            expect(sanitizeKnowledgeItems({})).toEqual([]);
        });

        it('should filter out invalid items without required fields', () => {
            const items = [
                { itemId: 'id1', name: 'Test', type: 'text', content: 'Valid' },
                { name: 'Missing itemId', type: 'text', content: 'Content' },
                { itemId: 'id2', type: 'text', content: 'Missing name' },
                { itemId: 'id3', name: 'Missing type', content: 'Content' }, // Will get default type
                { itemId: 'id4', name: 'Missing content', type: 'text' },
            ];

            const result = sanitizeKnowledgeItems(items);
            expect(result).toHaveLength(2); // id1 and id3 are valid
            expect(result[0].itemId).toBe('id1');
            expect(result[1].itemId).toBe('id3');
            expect(result[1].type).toBe('text'); // Defaulted type
        });

        it('should sanitize valid knowledge items', () => {
            const now = new Date();
            const items = [
                {
                    itemId: 'test-id-1',
                    name: 'Test File',
                    type: 'csv',
                    size: 1024,
                    content: 'CSV content here',
                    preview: 'CSV preview',
                    createdAt: now.toISOString(),
                },
            ];

            const result = sanitizeKnowledgeItems(items);
            expect(result).toHaveLength(1);
            expect(result[0]).toMatchObject({
                itemId: 'test-id-1',
                name: 'Test File',
                type: 'csv',
                size: 1024,
                content: 'CSV content here',
                preview: 'CSV preview',
            });
            expect(result[0].createdAt).toBeInstanceOf(Date);
        });

        it('should trim and truncate name to max length', () => {
            const longName = 'A'.repeat(200);
            const items = [
                {
                    itemId: 'id1',
                    name: `  ${longName}  `,
                    type: 'text',
                    content: 'Content',
                },
            ];

            const result = sanitizeKnowledgeItems(items);
            expect(result[0].name.length).toBe(120);
            expect(result[0].name.startsWith('AAA')).toBe(true);
        });

        it('should default type to "text" for invalid types', () => {
            const items = [
                { itemId: 'id1', name: 'File', type: 'invalid', content: 'Content' },
                { itemId: 'id2', name: 'File2', type: 123, content: 'Content' },
            ];

            const result = sanitizeKnowledgeItems(items);
            expect(result).toHaveLength(2);
            expect(result[0].type).toBe('text');
            expect(result[1].type).toBe('text');
        });

        it('should accept "csv" type', () => {
            const items = [
                { itemId: 'id1', name: 'CSV File', type: 'csv', content: 'CSV data' },
            ];

            const result = sanitizeKnowledgeItems(items);
            expect(result[0].type).toBe('csv');
        });

        it('should default size to 0 for invalid sizes', () => {
            const items = [
                { itemId: 'id1', name: 'File1', type: 'text', content: 'Content', size: -10 },
                { itemId: 'id2', name: 'File2', type: 'text', content: 'Content', size: 'invalid' },
                { itemId: 'id3', name: 'File3', type: 'text', content: 'Content', size: NaN },
            ];

            const result = sanitizeKnowledgeItems(items);
            expect(result[0].size).toBe(0);
            expect(result[1].size).toBe(0);
            expect(result[2].size).toBe(0);
        });

        it('should parse string size to number', () => {
            const items = [
                { itemId: 'id1', name: 'File', type: 'text', content: 'Content', size: '2048' },
            ];

            const result = sanitizeKnowledgeItems(items);
            expect(result[0].size).toBe(2048);
        });

        it('should generate preview from content if not provided', () => {
            const longContent = 'A'.repeat(300);
            const items = [
                { itemId: 'id1', name: 'File', type: 'text', content: longContent },
            ];

            const result = sanitizeKnowledgeItems(items);
            expect(result[0].preview).toBe(longContent.slice(0, 240));
        });

        it('should use provided preview and truncate if needed', () => {
            const longPreview = 'P'.repeat(300);
            const items = [
                {
                    itemId: 'id1',
                    name: 'File',
                    type: 'text',
                    content: 'Short content',
                    preview: longPreview,
                },
            ];

            const result = sanitizeKnowledgeItems(items);
            expect(result[0].preview).toBe(longPreview.slice(0, 240));
        });

        it('should handle Date objects for createdAt', () => {
            const date = new Date('2024-01-01T00:00:00Z');
            const items = [
                {
                    itemId: 'id1',
                    name: 'File',
                    type: 'text',
                    content: 'Content',
                    createdAt: date,
                },
            ];

            const result = sanitizeKnowledgeItems(items);
            expect(result[0].createdAt).toEqual(date);
        });

        it('should parse timestamp for createdAt', () => {
            const timestamp = 1704067200000; // 2024-01-01
            const items = [
                {
                    itemId: 'id1',
                    name: 'File',
                    type: 'text',
                    content: 'Content',
                    createdAt: timestamp,
                },
            ];

            const result = sanitizeKnowledgeItems(items);
            expect(result[0].createdAt).toEqual(new Date(timestamp));
        });

        it('should default to current date for invalid createdAt', () => {
            const beforeTest = Date.now();
            const items = [
                {
                    itemId: 'id1',
                    name: 'File',
                    type: 'text',
                    content: 'Content',
                    createdAt: 'invalid-date',
                },
            ];

            const result = sanitizeKnowledgeItems(items);
            const afterTest = Date.now();
            const resultTime = result[0].createdAt.getTime();

            expect(resultTime).toBeGreaterThanOrEqual(beforeTest);
            expect(resultTime).toBeLessThanOrEqual(afterTest);
        });

        it('should filter out items with empty strings after trimming', () => {
            const items = [
                { itemId: '  ', name: 'Name', type: 'text', content: 'Content' },
                { itemId: 'id1', name: '  ', type: 'text', content: 'Content' },
                { itemId: 'id2', name: 'Name', type: 'text', content: '  ' },
                { itemId: 'id3', name: 'Valid', type: 'text', content: 'Valid' },
            ];

            const result = sanitizeKnowledgeItems(items);
            expect(result).toHaveLength(1);
            expect(result[0].itemId).toBe('id3');
        });

        it('should handle preview with empty string gracefully', () => {
            const items = [
                {
                    itemId: 'id1',
                    name: 'File',
                    type: 'text',
                    content: 'Content here',
                    preview: '',
                },
            ];

            const result = sanitizeKnowledgeItems(items);
            expect(result[0].preview).toBe('Content here');
        });

        it('should coerce non-string content to string', () => {
            const items = [
                { itemId: 'id1', name: 'File', type: 'text', content: 123 },
            ];

            const result = sanitizeKnowledgeItems(items);
            expect(result).toHaveLength(0); // Filtered because content is not a string
        });

        it('should handle complex mixed valid/invalid items', () => {
            const items = [
                { itemId: 'valid-1', name: 'First', type: 'text', content: 'Content 1', size: 100 },
                null,
                { itemId: 'valid-2', name: 'Second', type: 'csv', content: 'Content 2' },
                undefined,
                { name: 'Missing ID' },
                { itemId: 'valid-3', name: 'Third', type: 'text', content: 'Content 3', size: '200' },
                'not an object',
                [],
            ];

            const result = sanitizeKnowledgeItems(items);
            expect(result).toHaveLength(3);
            expect(result[0].itemId).toBe('valid-1');
            expect(result[1].itemId).toBe('valid-2');
            expect(result[2].itemId).toBe('valid-3');
            expect(result[2].size).toBe(200);
        });
    });

    describe('getKnowledgeStats', () => {
        it('should return zero stats for empty array', () => {
            const stats = getKnowledgeStats([]);
            expect(stats).toEqual({
                totalItems: 0,
                totalSize: 0,
                csvCount: 0,
                textCount: 0,
                lastUpdated: null,
            });
        });

        it('should calculate total items and size', () => {
            const items = [
                { itemId: 'id1', name: 'File1', type: 'text' as const, content: 'Content', size: 100, createdAt: new Date() },
                { itemId: 'id2', name: 'File2', type: 'csv' as const, content: 'CSV', size: 200, createdAt: new Date() },
                { itemId: 'id3', name: 'File3', type: 'text' as const, content: 'Text', size: 150, createdAt: new Date() },
            ];

            const stats = getKnowledgeStats(items);
            expect(stats.totalItems).toBe(3);
            expect(stats.totalSize).toBe(450);
        });

        it('should count CSV and text items separately', () => {
            const items = [
                { itemId: 'id1', name: 'File1', type: 'text' as const, content: 'Content', size: 100, createdAt: new Date() },
                { itemId: 'id2', name: 'File2', type: 'csv' as const, content: 'CSV', size: 200, createdAt: new Date() },
                { itemId: 'id3', name: 'File3', type: 'csv' as const, content: 'CSV2', size: 150, createdAt: new Date() },
            ];

            const stats = getKnowledgeStats(items);
            expect(stats.csvCount).toBe(2);
            expect(stats.textCount).toBe(1);
        });

        it('should find the most recent createdAt date', () => {
            const date1 = new Date('2024-01-01');
            const date2 = new Date('2024-06-15');
            const date3 = new Date('2024-03-10');

            const items = [
                { itemId: 'id1', name: 'File1', type: 'text' as const, content: 'Content', size: 100, createdAt: date1 },
                { itemId: 'id2', name: 'File2', type: 'csv' as const, content: 'CSV', size: 200, createdAt: date2 },
                { itemId: 'id3', name: 'File3', type: 'text' as const, content: 'Text', size: 150, createdAt: date3 },
            ];

            const stats = getKnowledgeStats(items);
            expect(stats.lastUpdated).toEqual(date2);
        });

        it('should sanitize items before calculating stats', () => {
            const items = [
                { itemId: 'id1', name: 'Valid', type: 'text', content: 'Content', size: 100 },
                { name: 'Invalid - missing itemId', type: 'text', content: 'Content', size: 200 },
                { itemId: 'id2', name: 'Valid2', type: 'csv', content: 'CSV', size: 150 },
            ];

            const stats = getKnowledgeStats(items);
            expect(stats.totalItems).toBe(2);
            expect(stats.totalSize).toBe(250);
            expect(stats.textCount).toBe(1);
            expect(stats.csvCount).toBe(1);
        });

        it('should handle items with missing size', () => {
            const items = [
                { itemId: 'id1', name: 'File1', type: 'text' as const, content: 'Content', size: 100, createdAt: new Date() },
                { itemId: 'id2', name: 'File2', type: 'text' as const, content: 'Content', createdAt: new Date() },
            ];

            const stats = getKnowledgeStats(items);
            expect(stats.totalSize).toBe(100);
        });

        it('should return stats for non-array input as empty', () => {
            expect(getKnowledgeStats(null)).toEqual({
                totalItems: 0,
                totalSize: 0,
                csvCount: 0,
                textCount: 0,
                lastUpdated: null,
            });

            expect(getKnowledgeStats(undefined)).toEqual({
                totalItems: 0,
                totalSize: 0,
                csvCount: 0,
                textCount: 0,
                lastUpdated: null,
            });
        });

        it('should handle items with only createdAt in the first position', () => {
            const date1 = new Date('2024-01-01');

            const items = [
                { itemId: 'id1', name: 'File1', type: 'text' as const, content: 'Content', size: 100, createdAt: date1 },
            ];

            const stats = getKnowledgeStats(items);
            expect(stats.lastUpdated).toEqual(date1);
        });
    });
});
