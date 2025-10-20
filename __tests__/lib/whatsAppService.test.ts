/**
 * @jest-environment node
 */
import dbConnect from '@/lib/mongodb';
import { generateAgentReply } from '@/lib/voiceAgentPipeline';
import * as whatsAppService from '@/lib/whatsAppService';
import VoiceAgent from '@/models/VoiceAgent';
import WhatsAppMessage from '@/models/WhatsAppMessage';
import WhatsAppNumber from '@/models/WhatsAppNumber';

jest.mock('@/lib/mongodb', () => jest.fn());

jest.mock('@/models/VoiceAgent', () => {
  const mockModel = {
    findById: jest.fn(),
    findOne: jest.fn(),
  };
  return { __esModule: true, default: mockModel };
});

jest.mock('@/models/WhatsAppNumber', () => {
  const mockModel = {
    findOne: jest.fn(),
  };
  return { __esModule: true, default: mockModel };
});

jest.mock('@/models/WhatsAppMessage', () => {
  const mockModel = {
    find: jest.fn(),
    create: jest.fn(),
  };
  return { __esModule: true, default: mockModel };
});

jest.mock('@/lib/voiceAgentPipeline', () => ({
  generateAgentReply: jest.fn(),
}));

describe('lib/whatsAppService', () => {
  const originalEnv = process.env;
  const mockVoiceAgent = VoiceAgent as unknown as { findById: jest.Mock; findOne: jest.Mock };
  const mockWhatsAppNumber = WhatsAppNumber as unknown as { findOne: jest.Mock };
  const mockWhatsAppMessage = WhatsAppMessage as unknown as { find: jest.Mock; create: jest.Mock };
  const mockGenerateAgentReply = generateAgentReply as unknown as jest.Mock;
  const mockDbConnect = dbConnect as unknown as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDbConnect.mockReset();
    mockVoiceAgent.findById.mockReset();
    mockVoiceAgent.findOne.mockReset();
    mockWhatsAppNumber.findOne.mockReset();
    mockWhatsAppMessage.find.mockReset();
    mockWhatsAppMessage.create.mockReset();
    mockGenerateAgentReply.mockReset();
    process.env = { ...originalEnv };
    process.env.NEXT_PUBLIC_META_WHATSAPP_API_URL = 'https://api.meta.test/messages';
    process.env.NEXT_PUBLIC_META_WHATSAPP_API_TOKEN = 'test-token';
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('sendMessage / sendTextMessage', () => {
    beforeEach(() => {
      (global as any).fetch = jest.fn();
    });

    afterEach(() => {
      jest.clearAllMocks();
      delete (global as any).fetch;
    });

    it('sendMessage returns parsed response when ok and has response field', async () => {
      const serverResp = { response: { messaging_product: 'whatsapp', contacts: [], messages: [] } };
      (global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => serverResp });

      const resp = await whatsAppService.sendMessage({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: '919876543210',
        type: 'text',
        text: { body: 'hi' },
      });

      expect(resp).not.toBeNull();
      expect(resp?.messaging_product).toBe('whatsapp');
    });

    it('sendMessage returns null when env vars missing', async () => {
      delete process.env.NEXT_PUBLIC_META_WHATSAPP_API_URL;
      delete process.env.NEXT_PUBLIC_META_WHATSAPP_API_TOKEN;

      const resp = await whatsAppService.sendMessage({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: '1',
        type: 'text',
      });

      expect(resp).toBeNull();
    });

    it('sendTextMessage delegates to sendMessage', async () => {
      const mockResp = { messaging_product: 'whatsapp', contacts: [], messages: [] };
      (global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => mockResp });

      const resp = await whatsAppService.sendTextMessage('919876543210', 'hello');
      expect((global as any).fetch).toHaveBeenCalled();
      expect(resp).toEqual(mockResp);
      const body = (global as any).fetch.mock.calls[0][1].body;
      expect(body).toContain('"to":"919876543210"');
      expect(body).toContain('"body":"hello"');
    });

    it('sendMessage returns null when response is not ok', async () => {
      (global as any).fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'server error',
      });

      const resp = await whatsAppService.sendMessage({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: '1',
        type: 'text',
      });

      expect(resp).toBeNull();
    });

    it('sendMessage returns null when fetch throws', async () => {
      (global as any).fetch = jest.fn().mockRejectedValue(new Error('network down'));

      const resp = await whatsAppService.sendMessage({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: '1',
        type: 'text',
      });

      expect(resp).toBeNull();
    });
  });

  describe('processWhatsAppCallback', () => {
    beforeEach(() => {
      (global as any).fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ messaging_product: 'whatsapp', contacts: [], messages: [] }),
      });
    });

    afterEach(() => {
      delete (global as any).fetch;
    });

    const baseMessageTemplate = {
      entry: [
        {
          changes: [
            {
              value: {
                metadata: {
                  phone_number_id: 'phone-1',
                  display_phone_number: '+1999888777',
                },
                messages: [
                  {
                    id: 'wamid.ABCD',
                    from: '919876543210',
                    to: '+1999888777',
                    type: 'text',
                    text: { body: 'Hello there' },
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const cloneMessageTemplate = () => JSON.parse(JSON.stringify(baseMessageTemplate));

    it('skips processing when no message is present', async () => {
      mockDbConnect.mockResolvedValue(undefined);
      mockWhatsAppMessage.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      await whatsAppService.processWhatsAppCallback({ entry: [{ changes: [{ value: { messages: [] } }] }] });

      expect(mockWhatsAppMessage.create).not.toHaveBeenCalled();
      expect((global as any).fetch).not.toHaveBeenCalled();
    });

    it('returns early when numbers cannot be resolved', async () => {
      mockDbConnect.mockResolvedValue(undefined);

      await whatsAppService.processWhatsAppCallback({
        entry: [
          {
            changes: [
              {
                value: {
                  metadata: {},
                  messages: [
                    {
                      id: 'wamid.NOPE',
                      type: 'text',
                      text: { body: 'Hi there' },
                    },
                  ],
                },
              },
            ],
          },
        ],
      });

      expect(mockDbConnect).not.toHaveBeenCalled();
      expect(mockWhatsAppMessage.create).not.toHaveBeenCalled();
      expect((global as any).fetch).not.toHaveBeenCalled();
    });

    it('uses WHATSAPP_VOICE_AGENT_ID when number has no linked agent', async () => {
      const messageTemplate = cloneMessageTemplate();
      process.env.WHATSAPP_VOICE_AGENT_ID = 'env-agent-id';
      mockDbConnect.mockResolvedValue(undefined);
      mockWhatsAppNumber.findOne.mockResolvedValue({ userId: 'user-1' });
      mockVoiceAgent.findById.mockImplementation(async (id: string) => {
        if (id === 'env-agent-id') {
          return { id: 'env-agent-id', prompt: 'Env prompt' };
        }
        return null;
      });
      mockVoiceAgent.findOne.mockResolvedValue(null);
      setupHistory([]);
      mockWhatsAppMessage.create.mockResolvedValue(undefined);
      mockGenerateAgentReply.mockResolvedValue({
        text: 'Env agent reply',
        fullPrompt: 'prompt',
        rawResult: null,
        modelName: 'gemini-2.0-flash',
      });

      await whatsAppService.processWhatsAppCallback(messageTemplate);

      expect(mockVoiceAgent.findById).toHaveBeenCalledWith('env-agent-id');
      expect((global as any).fetch).toHaveBeenCalledWith(
        'https://api.meta.test/messages',
        expect.objectContaining({
          body: expect.stringContaining('Env agent reply'),
        }),
      );

      delete process.env.WHATSAPP_VOICE_AGENT_ID;
    });

    it('sends failure message when pipeline throws an error', async () => {
      const messageTemplate = cloneMessageTemplate();
      mockDbConnect.mockResolvedValue(undefined);
      mockWhatsAppNumber.findOne.mockResolvedValue({ userId: 'user-1', linkedAgentId: 'agent-123' });
      mockVoiceAgent.findById.mockResolvedValue({ id: 'agent-123', prompt: 'Prompt' });
      setupHistory([]);
      mockWhatsAppMessage.create.mockResolvedValue(undefined);
      mockGenerateAgentReply.mockRejectedValue(new Error('Model timeout'));

      await whatsAppService.processWhatsAppCallback(messageTemplate);

      expect((global as any).fetch).toHaveBeenCalledWith(
        'https://api.meta.test/messages',
        expect.objectContaining({
          body: expect.stringContaining('I am facing an issue generating a response right now'),
        }),
      );
    });

    function setupHistory(messages: Array<{ direction: string; content: string }>) {
      const lean = jest.fn().mockResolvedValue(messages);
      const limit = jest.fn().mockReturnValue({ lean });
      const sort = jest.fn().mockReturnValue({ limit });
      mockWhatsAppMessage.find.mockReturnValue({ sort });
      return { sort, limit, lean };
    }

    it('routes text messages through the voice agent pipeline', async () => {
  const messageTemplate = cloneMessageTemplate();
  mockDbConnect.mockResolvedValue(undefined);
      mockWhatsAppNumber.findOne.mockResolvedValue({ userId: 'user-1', linkedAgentId: 'agent-123' });
      mockVoiceAgent.findById.mockResolvedValue({ id: 'agent-123', prompt: 'You are helpful.' });
      setupHistory([{ direction: 'outbound', content: 'Previous bot message' }]);
      mockWhatsAppMessage.create.mockResolvedValue(undefined);
      mockGenerateAgentReply.mockResolvedValue({
        text: 'Agent reply',
        fullPrompt: 'prompt',
        rawResult: null,
        modelName: 'gemini-2.0-flash',
      });

      await whatsAppService.processWhatsAppCallback(messageTemplate);

      expect(mockDbConnect).toHaveBeenCalled();
      expect(mockVoiceAgent.findById).toHaveBeenCalledWith('agent-123');
      expect(mockGenerateAgentReply).toHaveBeenCalledWith(
        expect.objectContaining({
          systemPrompt: 'You are helpful.',
          userText: 'Hello there',
          history: [
            {
              source: 'assistant',
              text: 'Previous bot message',
            },
          ],
        }),
      );
      expect((global as any).fetch).toHaveBeenCalledWith(
        'https://api.meta.test/messages',
        expect.objectContaining({
          body: expect.stringContaining('Agent reply'),
        }),
      );
      expect(mockWhatsAppMessage.create).toHaveBeenCalledWith(
        expect.objectContaining({ direction: 'inbound', content: 'Hello there' }),
      );
      expect(mockWhatsAppMessage.create).toHaveBeenCalledWith(
        expect.objectContaining({ direction: 'outbound', content: 'Agent reply' }),
      );
    });

    it('sends fallback when no agent is configured', async () => {
  const messageTemplate = cloneMessageTemplate();
  mockDbConnect.mockResolvedValue(undefined);
      mockWhatsAppNumber.findOne.mockResolvedValue(null);
      mockVoiceAgent.findById.mockResolvedValue(null);
      mockVoiceAgent.findOne.mockResolvedValue(null);
      setupHistory([]);
      mockWhatsAppMessage.create.mockResolvedValue(undefined);
      mockGenerateAgentReply.mockResolvedValue(null);

      await whatsAppService.processWhatsAppCallback(messageTemplate);

      expect(mockGenerateAgentReply).not.toHaveBeenCalled();
      expect((global as any).fetch).toHaveBeenCalledWith(
        'https://api.meta.test/messages',
        expect.objectContaining({
          body: expect.stringContaining('Sorry, we are unable to process your request right now.'),
        }),
      );
      expect(mockWhatsAppMessage.create).toHaveBeenCalledWith(
        expect.objectContaining({ direction: 'inbound' }),
      );
      expect(mockWhatsAppMessage.create).toHaveBeenCalledWith(
        expect.objectContaining({ direction: 'outbound' }),
      );
    });

    it('returns unsupported notice for non-text messages', async () => {
      const imageTemplate = cloneMessageTemplate();
      imageTemplate.entry[0].changes[0].value.messages[0] = {
        id: 'wamid.IMAGE',
        from: '919876543210',
        to: '+1999888777',
        type: 'image',
        image: { caption: 'Invoice photo' },
      };

      mockDbConnect.mockResolvedValue(undefined);
      mockWhatsAppNumber.findOne.mockResolvedValue({ userId: 'user-1', linkedAgentId: 'agent-123' });
      mockVoiceAgent.findById.mockResolvedValue({ id: 'agent-123', prompt: 'You are helpful.' });
      setupHistory([]);
      mockWhatsAppMessage.create.mockResolvedValue(undefined);

      await whatsAppService.processWhatsAppCallback(imageTemplate);

      expect(mockGenerateAgentReply).not.toHaveBeenCalled();
      expect((global as any).fetch).toHaveBeenCalledWith(
        'https://api.meta.test/messages',
        expect.objectContaining({
          body: expect.stringContaining('This channel currently supports text messages only'),
        }),
      );
      expect(mockWhatsAppMessage.create).toHaveBeenCalledWith(
        expect.objectContaining({ direction: 'inbound', content: '[image] Invoice photo' }),
      );
    });

    it('stores minimal placeholder when image contains no caption', async () => {
      const imageTemplate = cloneMessageTemplate();
      imageTemplate.entry[0].changes[0].value.messages[0] = {
        id: 'wamid.IMAGE2',
        from: '919876543210',
        to: '+1999888777',
        type: 'image',
        image: {},
      };

      mockDbConnect.mockResolvedValue(undefined);
      mockWhatsAppNumber.findOne.mockResolvedValue({ userId: 'user-1', linkedAgentId: 'agent-123' });
      mockVoiceAgent.findById.mockResolvedValue({ id: 'agent-123', prompt: 'Prompt' });
      setupHistory([]);
      mockWhatsAppMessage.create.mockResolvedValue(undefined);

      await whatsAppService.processWhatsAppCallback(imageTemplate);

      expect(mockWhatsAppMessage.create).toHaveBeenCalledWith(
        expect.objectContaining({ direction: 'inbound', content: '[image]' }),
      );
      expect((global as any).fetch).toHaveBeenCalled();
    });

    it('captures audio content and still sends unsupported notice', async () => {
      const audioTemplate = cloneMessageTemplate();
      audioTemplate.entry[0].changes[0].value.messages[0] = {
        id: 'wamid.AUDIO',
        from: '919876543210',
        to: '+1999888777',
        type: 'audio',
      };

      mockDbConnect.mockResolvedValue(undefined);
      mockWhatsAppNumber.findOne.mockResolvedValue({ userId: 'user-1', linkedAgentId: 'agent-123' });
      mockVoiceAgent.findById.mockResolvedValue({ id: 'agent-123', prompt: 'Prompt' });
      setupHistory([]);
      mockWhatsAppMessage.create.mockResolvedValue(undefined);

      await whatsAppService.processWhatsAppCallback(audioTemplate);

      expect(mockGenerateAgentReply).not.toHaveBeenCalled();
      expect(mockWhatsAppMessage.create).toHaveBeenCalledWith(
        expect.objectContaining({ direction: 'inbound', content: '[audio]' }),
      );
      expect((global as any).fetch).toHaveBeenCalledWith(
        'https://api.meta.test/messages',
        expect.objectContaining({
          body: expect.stringContaining('text messages only'),
        }),
      );
    });

    it('captures document caption content when informing user', async () => {
      const documentTemplate = cloneMessageTemplate();
      documentTemplate.entry[0].changes[0].value.messages[0] = {
        id: 'wamid.DOC',
        from: '919876543210',
        to: '+1999888777',
        type: 'document',
        document: { caption: 'Invoice PDF' },
      };

      mockDbConnect.mockResolvedValue(undefined);
      mockWhatsAppNumber.findOne.mockResolvedValue({ userId: 'user-1', linkedAgentId: 'agent-123' });
      mockVoiceAgent.findById.mockResolvedValue({ id: 'agent-123', prompt: 'Prompt' });
      setupHistory([]);
      mockWhatsAppMessage.create.mockResolvedValue(undefined);

      await whatsAppService.processWhatsAppCallback(documentTemplate);

      expect(mockWhatsAppMessage.create).toHaveBeenCalledWith(
        expect.objectContaining({ direction: 'inbound', content: '[document] Invoice PDF' }),
      );
      expect(mockGenerateAgentReply).not.toHaveBeenCalled();
    });

    it('stores placeholder when document lacks caption', async () => {
      const documentTemplate = cloneMessageTemplate();
      documentTemplate.entry[0].changes[0].value.messages[0] = {
        id: 'wamid.DOC2',
        from: '919876543210',
        to: '+1999888777',
        type: 'document',
        document: {},
      };

      mockDbConnect.mockResolvedValue(undefined);
      mockWhatsAppNumber.findOne.mockResolvedValue({ userId: 'user-1', linkedAgentId: 'agent-123' });
      mockVoiceAgent.findById.mockResolvedValue({ id: 'agent-123', prompt: 'Prompt' });
      setupHistory([]);
      mockWhatsAppMessage.create.mockResolvedValue(undefined);

      await whatsAppService.processWhatsAppCallback(documentTemplate);

      expect(mockWhatsAppMessage.create).toHaveBeenCalledWith(
        expect.objectContaining({ direction: 'inbound', content: '[document]' }),
      );
      expect((global as any).fetch).toHaveBeenCalled();
    });

    it('stores unsupported placeholder for unknown message type', async () => {
      const unsupportedTemplate = cloneMessageTemplate();
      unsupportedTemplate.entry[0].changes[0].value.messages[0] = {
        id: 'wamid.UNKNOWN',
        from: '919876543210',
        to: '+1999888777',
        type: 'sticker',
      };

      mockDbConnect.mockResolvedValue(undefined);
      mockWhatsAppNumber.findOne.mockResolvedValue({ userId: 'user-1', linkedAgentId: 'agent-123' });
      mockVoiceAgent.findById.mockResolvedValue({ id: 'agent-123', prompt: 'Prompt' });
      setupHistory([]);
      mockWhatsAppMessage.create.mockResolvedValue(undefined);

      await whatsAppService.processWhatsAppCallback(unsupportedTemplate);

      expect(mockWhatsAppMessage.create).toHaveBeenCalledWith(
        expect.objectContaining({ direction: 'inbound', content: '[unsupported]' }),
      );
    });

    it('derives session id from phone number id when display number missing', async () => {
      const messageTemplate = cloneMessageTemplate();
      delete messageTemplate.entry[0].changes[0].value.metadata.display_phone_number;
      messageTemplate.entry[0].changes[0].value.metadata.phone_number_id = 'meta-phone-42';

      mockDbConnect.mockResolvedValue(undefined);
      mockWhatsAppNumber.findOne.mockResolvedValue({ userId: 'user-1', linkedAgentId: 'agent-123' });
      mockVoiceAgent.findById.mockResolvedValue({ id: 'agent-123', prompt: 'Prompt' });
      setupHistory([]);
      mockWhatsAppMessage.create.mockResolvedValue(undefined);
      mockGenerateAgentReply.mockResolvedValue({
        text: 'Session test reply',
        fullPrompt: 'prompt',
        rawResult: null,
        modelName: 'gemini-2.0-flash',
      });

      await whatsAppService.processWhatsAppCallback(messageTemplate);

      const sessionIds = mockWhatsAppMessage.create.mock.calls.map((call) => call[0].sessionId);
      expect(sessionIds).toEqual([
        'whatsapp_meta-phone-42_919876543210',
        'whatsapp_meta-phone-42_919876543210',
      ]);
    });

    it('derives session id from message recipient when metadata lacks numbers', async () => {
      const messageTemplate = cloneMessageTemplate();
      messageTemplate.entry[0].changes[0].value.metadata = {};
      messageTemplate.entry[0].changes[0].value.messages[0].to = 'wa-recipient-55';

      mockDbConnect.mockResolvedValue(undefined);
      mockWhatsAppNumber.findOne.mockResolvedValue({ userId: 'user-1', linkedAgentId: 'agent-123' });
      mockVoiceAgent.findById.mockResolvedValue({ id: 'agent-123', prompt: 'Prompt' });
      setupHistory([]);
      mockWhatsAppMessage.create.mockResolvedValue(undefined);
      mockGenerateAgentReply.mockResolvedValue({
        text: 'Metadata fallback reply',
        fullPrompt: 'prompt',
        rawResult: null,
        modelName: 'gemini-2.0-flash',
      });

      await whatsAppService.processWhatsAppCallback(messageTemplate);

      const sessionIds = mockWhatsAppMessage.create.mock.calls.map((call) => call[0].sessionId);
      expect(sessionIds).toEqual([
        'whatsapp_wa-recipient-55_919876543210',
        'whatsapp_wa-recipient-55_919876543210',
      ]);
    });

    it('falls back to most recent agent for user when env and linked agent absent', async () => {
      const messageTemplate = cloneMessageTemplate();
      delete process.env.WHATSAPP_VOICE_AGENT_ID;
      mockDbConnect.mockResolvedValue(undefined);
      mockWhatsAppNumber.findOne.mockResolvedValue({ userId: 'user-1' });
      mockVoiceAgent.findById.mockResolvedValue(null);
      const sort = jest.fn().mockResolvedValue({ id: 'latest-agent', prompt: 'Latest prompt' });
      mockVoiceAgent.findOne.mockReturnValue({ sort });
      setupHistory([]);
      mockWhatsAppMessage.create.mockResolvedValue(undefined);
      mockGenerateAgentReply.mockResolvedValue({
        text: 'Latest reply',
        fullPrompt: 'prompt',
        rawResult: null,
        modelName: 'gemini-2.0-flash',
      });

      await whatsAppService.processWhatsAppCallback(messageTemplate);

      expect(mockVoiceAgent.findOne).toHaveBeenCalledWith({ userId: 'user-1' });
      expect(sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(mockGenerateAgentReply).toHaveBeenCalled();
      expect((global as any).fetch).toHaveBeenCalledWith(
        'https://api.meta.test/messages',
        expect.objectContaining({
          body: expect.stringContaining('Latest reply'),
        }),
      );
    });

    it('falls back to recent agent when linked agent lookup returns null', async () => {
      const messageTemplate = cloneMessageTemplate();
      mockDbConnect.mockResolvedValue(undefined);
      mockWhatsAppNumber.findOne.mockResolvedValue({ userId: 'user-1', linkedAgentId: 'agent-123' });
      mockVoiceAgent.findById.mockResolvedValue(null);
      const sort = jest.fn().mockResolvedValue({ id: 'latest-agent', prompt: 'Recovered prompt' });
      mockVoiceAgent.findOne.mockReturnValue({ sort });
      setupHistory([]);
      mockWhatsAppMessage.create.mockResolvedValue(undefined);
      mockGenerateAgentReply.mockResolvedValue({
        text: 'Recovered reply',
        fullPrompt: 'prompt',
        rawResult: null,
        modelName: 'gemini-2.0-flash',
      });

      await whatsAppService.processWhatsAppCallback(messageTemplate);

      expect(mockVoiceAgent.findById).toHaveBeenCalledWith('agent-123');
      expect(mockVoiceAgent.findOne).toHaveBeenCalledWith({ userId: 'user-1' });
      expect(sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect((global as any).fetch).toHaveBeenCalledWith(
        'https://api.meta.test/messages',
        expect.objectContaining({
          body: expect.stringContaining('Recovered reply'),
        }),
      );
    });

    it('uses most recent agent when env agent lookup fails', async () => {
      const messageTemplate = cloneMessageTemplate();
      process.env.WHATSAPP_VOICE_AGENT_ID = 'env-agent';
      mockDbConnect.mockResolvedValue(undefined);
      mockWhatsAppNumber.findOne.mockResolvedValue({ userId: 'user-1' });
      mockVoiceAgent.findById.mockResolvedValue(null);
      const sort = jest.fn().mockResolvedValue({ id: 'fallback-agent', prompt: 'Fallback prompt' });
      mockVoiceAgent.findOne.mockReturnValue({ sort });
      setupHistory([]);
      mockWhatsAppMessage.create.mockResolvedValue(undefined);
      mockGenerateAgentReply.mockResolvedValue({
        text: 'Fallback reply',
        fullPrompt: 'prompt',
        rawResult: null,
        modelName: 'gemini-2.0-flash',
      });

      await whatsAppService.processWhatsAppCallback(messageTemplate);

      expect(mockVoiceAgent.findById).toHaveBeenCalledWith('env-agent');
      expect(mockVoiceAgent.findOne).toHaveBeenCalledWith({ userId: 'user-1' });
      expect(sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect((global as any).fetch).toHaveBeenCalledWith(
        'https://api.meta.test/messages',
        expect.objectContaining({
          body: expect.stringContaining('Fallback reply'),
        }),
      );

      delete process.env.WHATSAPP_VOICE_AGENT_ID;
    });

    it('ignores blank text payloads and sends unsupported notice', async () => {
      const blankTemplate = cloneMessageTemplate();
      blankTemplate.entry[0].changes[0].value.messages[0].text.body = '   ';

      mockDbConnect.mockResolvedValue(undefined);
      mockWhatsAppNumber.findOne.mockResolvedValue({ userId: 'user-1', linkedAgentId: 'agent-123' });
      mockVoiceAgent.findById.mockResolvedValue({ id: 'agent-123', prompt: 'Prompt' });
      setupHistory([]);
      mockWhatsAppMessage.create.mockResolvedValue(undefined);

      await whatsAppService.processWhatsAppCallback(blankTemplate);

      expect(mockGenerateAgentReply).not.toHaveBeenCalled();
      expect(mockWhatsAppMessage.create.mock.calls.some((call) => call[0]?.direction === 'inbound')).toBe(false);
      expect((global as any).fetch).toHaveBeenCalledWith(
        'https://api.meta.test/messages',
        expect.objectContaining({
          body: expect.stringContaining('text messages only'),
        }),
      );
    });

    it('logs errors from unexpected exceptions without throwing', async () => {
      const messageTemplate = cloneMessageTemplate();
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
      mockDbConnect.mockRejectedValue(new Error('db offline'));

      await expect(whatsAppService.processWhatsAppCallback(messageTemplate)).resolves.toBeUndefined();

      expect(consoleError.mock.calls.some((call) => call[0] === 'Error in processWhatsAppCallback:' && call[1] === 'db offline')).toBe(true);
      consoleError.mockRestore();
    });
  });
});
