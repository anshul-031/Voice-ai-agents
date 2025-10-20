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

    const messageTemplate = {
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

    function setupHistory(messages: Array<{ direction: string; content: string }>) {
      const lean = jest.fn().mockResolvedValue(messages);
      const limit = jest.fn().mockReturnValue({ lean });
      const sort = jest.fn().mockReturnValue({ limit });
      mockWhatsAppMessage.find.mockReturnValue({ sort });
      return { sort, limit, lean };
    }

    it('routes text messages through the voice agent pipeline', async () => {
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
      const imageTemplate = JSON.parse(JSON.stringify(messageTemplate));
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
  });
});
