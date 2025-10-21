jest.mock('@/models/WhatsAppNumber', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
  },
}));

jest.mock('@/models/VoiceAgent', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
    findOne: jest.fn(),
  },
}));

const { __testExports } = require('@/lib/whatsAppService');
const WhatsAppNumber = require('@/models/WhatsAppNumber').default as { findOne: jest.Mock };
const VoiceAgent = require('@/models/VoiceAgent').default as { findById: jest.Mock; findOne: jest.Mock };

const {
  findConfiguredWhatsAppNumber,
  resolveVoiceAgent,
  inferMessageType,
  resolveBusinessNumber,
} = __testExports as {
  findConfiguredWhatsAppNumber: (metadata: any, message: any) => Promise<any>;
  resolveVoiceAgent: (number: any) => Promise<any>;
  inferMessageType: (message: any) => string;
  resolveBusinessNumber: (metadata: any, message: any) => string | undefined;
};

describe('whatsAppService internal helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.WHATSAPP_VOICE_AGENT_ID;
  });

  it('inferMessageType falls back to unsupported when unknown', () => {
    expect(inferMessageType({ type: 'video' })).toBe('unsupported');
    expect(inferMessageType(undefined)).toBe('unsupported');
  });

  it('resolveBusinessNumber prioritises metadata values before message recipient', () => {
    const metadata = { display_phone_number: '+100', phone_number_id: 'meta-1' };
    const message = { to: '+200' };
    expect(resolveBusinessNumber(metadata, message)).toBe('+100');
    expect(resolveBusinessNumber({}, { to: '+200' })).toBe('+200');
    expect(resolveBusinessNumber({}, {})).toBeUndefined();
  });

  it('findConfiguredWhatsAppNumber returns null when no identifiers are present', async () => {
    const result = await findConfiguredWhatsAppNumber({}, {});
    expect(result).toBeNull();
    expect(WhatsAppNumber.findOne).not.toHaveBeenCalled();
  });

  it('findConfiguredWhatsAppNumber queries Mongo when identifiers exist', async () => {
    WhatsAppNumber.findOne.mockResolvedValue({ id: 'match' });

    const result = await findConfiguredWhatsAppNumber({ phone_number_id: 'id-1' }, { to: '+200' });

    expect(WhatsAppNumber.findOne).toHaveBeenCalledWith({
      $or: [
        { phoneNumberId: 'id-1' },
        { phoneNumber: '+200' },
      ],
    });
    expect(result).toEqual({ id: 'match' });
  });

  it('resolveVoiceAgent returns number-linked agent when available', async () => {
    VoiceAgent.findById.mockResolvedValueOnce({ id: 'agent-1' });

    const agent = await resolveVoiceAgent({ linkedAgentId: 'agent-1' });

    expect(VoiceAgent.findById).toHaveBeenCalledWith('agent-1');
    expect(agent).toEqual({ id: 'agent-1' });
  });

  it('resolveVoiceAgent uses env agent when number agent missing', async () => {
    process.env.WHATSAPP_VOICE_AGENT_ID = 'env-agent';
    VoiceAgent.findById
      .mockResolvedValueOnce(null) // linked agent lookup
      .mockResolvedValueOnce({ id: 'env-agent' });

    const agent = await resolveVoiceAgent({ linkedAgentId: 'missing', userId: 'user-1' });

    expect(VoiceAgent.findById).toHaveBeenNthCalledWith(2, 'env-agent');
    expect(agent).toEqual({ id: 'env-agent' });
  });

  it('resolveVoiceAgent falls back to most recent user agent when no direct match', async () => {
    const sort = jest.fn().mockResolvedValue({ id: 'latest', prompt: 'Prompt' });
    VoiceAgent.findById.mockResolvedValue(null);
    VoiceAgent.findOne.mockReturnValue({ sort });

    const agent = await resolveVoiceAgent({ userId: 'user-2' });

    expect(VoiceAgent.findOne).toHaveBeenCalledWith({ userId: 'user-2' });
    expect(sort).toHaveBeenCalledWith({ createdAt: -1 });
    expect(agent).toEqual({ id: 'latest', prompt: 'Prompt' });
  });
});
