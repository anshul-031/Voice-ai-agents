import { parseTriggerPhrases, sanitizeHeaders, sanitizeParameters } from '@/lib/agentToolsForm';

describe('agentToolsForm helpers', () => {
    describe('sanitizeHeaders', () => {
        it('trims values and removes empties', () => {
            const result = sanitizeHeaders([
                { key: ' Authorization ', value: ' Bearer token ' },
                { key: '  ', value: 'ignored' },
                { key: 'X-Trace', value: '' },
                { key: undefined, value: undefined },
            ]);

            expect(result).toEqual([
                { key: 'Authorization', value: 'Bearer token' },
            ]);
        });
    });

    describe('sanitizeParameters', () => {
        it('normalizes types and removes nameless entries', () => {
            const result = sanitizeParameters([
                { name: ' count ', description: ' total ', type: 'Number', required: true },
                { name: 'enabled', description: 'flag', type: 'BOOLEAN', required: undefined },
                { name: 'meta', description: '   ', type: 'string', required: false },
                { name: 'notes', description: null, type: 'unknown', required: null },
                { name: '   ', description: 'ignore', type: 'string', required: true },
            ]);

            expect(result).toEqual([
                { name: 'count', description: 'total', type: 'number', required: true },
                { name: 'enabled', description: 'flag', type: 'boolean', required: false },
                { name: 'meta', type: 'string', required: false },
                { name: 'notes', type: 'string', required: false },
            ]);
        });
    });

    describe('parseTriggerPhrases', () => {
        it('splits by commas and new lines, trimming blanks', () => {
            const result = parseTriggerPhrases(' run report,\n send summary ,  ,notify ');
            expect(result).toEqual(['run report', 'send summary', 'notify']);
        });
    });
});
