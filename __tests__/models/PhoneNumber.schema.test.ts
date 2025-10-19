describe('PhoneNumber schema definition', () => {
  const getSchemaDefinition = () => {
    jest.resetModules();
    jest.clearAllMocks();
    const mockedMongoose = require('mongoose') as { Schema: jest.Mock };
    mockedMongoose.Schema.mockClear();
    require('@/models/PhoneNumber');
    const schemaCall = mockedMongoose.Schema.mock.calls[0];
    if (!schemaCall) {
      throw new Error('PhoneNumber schema was not initialized');
    }
    return schemaCall[0];
  };

  test('requires Exotel credentials only for Exotel provider', () => {
    const definition = getSchemaDefinition();
    const requiredApiKey = definition.exotelConfig.apiKey.required;
    const requiredApiToken = definition.exotelConfig.apiToken.required;
    const requiredSid = definition.exotelConfig.sid.required;

    expect(requiredApiKey.call({ provider: 'exotel' })).toBe(true);
    expect(requiredApiToken.call({ provider: 'exotel' })).toBe(true);
    expect(requiredSid.call({ provider: 'exotel' })).toBe(true);

    expect(requiredApiKey.call({ provider: 'twilio' })).toBe(false);
    expect(requiredApiToken.call({ provider: 'other' })).toBe(false);
    expect(requiredSid.call({ provider: 'other' })).toBe(false);
  });

  test('defines sensible defaults for Exotel configuration', () => {
    const definition = getSchemaDefinition();
    expect(definition.exotelConfig.domain.default).toBe('api.in.exotel.com');
    expect(definition.exotelConfig.region.default).toBe('in');
  });
});
