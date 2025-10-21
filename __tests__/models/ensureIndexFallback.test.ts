describe('Schema ensureIndex fallback', () => {
  const findIndexMetadata = (schemaInstance: Record<string | symbol, unknown>) => {
    const symbols = Object.getOwnPropertySymbols(schemaInstance);
    for (const symbol of symbols) {
      const value = schemaInstance[symbol];
      if (Array.isArray(value) && value.every((entry) => Array.isArray(entry))) {
        return value as Array<[Record<string, unknown>, Record<string, unknown> | undefined]>;
      }
    }
    return undefined;
  };

  const runWithIndexesDisabled = (modulePath: string, expectedIndexes: Array<[Record<string, unknown>, Record<string, unknown> | undefined]>) => {
    jest.resetModules();
    jest.isolateModules(() => {
      const mongoose = require('mongoose');
      const Schema = mongoose.Schema as jest.Mock & { prototype: Record<string, unknown> };
      const originalIndexes = Schema.prototype.indexes;
      delete Schema.prototype.indexes;

      try {
        expect(Schema.prototype.indexes).toBeUndefined();

        const model = require(modulePath).default;
        expect(model).toBeDefined();

        const schemaInstance = (Schema.mock.instances.at(-1) ?? {}) as Record<string | symbol, unknown>;
        const metadata = findIndexMetadata(schemaInstance);

        expect(metadata).toEqual(expectedIndexes);
      } finally {
        Schema.prototype.indexes = originalIndexes;
      }
    });
  };

  it('records WhatsAppNumber indexes when schema lacks indexes()', () => {
    runWithIndexesDisabled('@/models/WhatsAppNumber', [
      [{ phoneNumber: 1 }, { unique: true }],
      [{ phoneNumberId: 1 }, { sparse: true }],
    ]);
  });

  it('records PhoneNumber indexes when schema lacks indexes()', () => {
    runWithIndexesDisabled('@/models/PhoneNumber', [
      [{ userId: 1, status: 1 }, undefined],
      [{ linkedAgentId: 1 }, undefined],
      [{ phoneNumber: 1 }, { unique: true, background: true }],
      [{ webhookIdentifier: 1 }, { unique: true, sparse: true }],
    ]);
  });
});
