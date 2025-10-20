/**
 * @jest-environment node
 */
import type { MessageHistory } from '@/lib/voiceAgentPipeline';
import { formatConversationHistory, generateAgentReply } from '@/lib/voiceAgentPipeline';

jest.mock('@google/generative-ai', () => {
  const mockGetGenerativeModel = jest.fn();
  const GoogleGenerativeAI = jest.fn().mockImplementation(() => ({
    getGenerativeModel: mockGetGenerativeModel,
  }));

  return {
    __esModule: true,
    GoogleGenerativeAI,
    __mock__: {
      mockGetGenerativeModel,
    },
  };
});

const { GoogleGenerativeAI, __mock__ } = jest.requireMock('@google/generative-ai');
const mockGetGenerativeModel = __mock__.mockGetGenerativeModel as jest.Mock;

const buildTextResponse = (text: string) => ({
  response: {
    text: jest.fn().mockResolvedValue(text),
  },
});

describe('voiceAgentPipeline', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetGenerativeModel.mockReset();
    process.env = { ...originalEnv, GEMINI_API_KEY: 'test-key' };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('formatConversationHistory', () => {
    it('includes system prompt, conversation snippets, and current user text', () => {
      const history: MessageHistory[] = [
        { source: 'user', text: 'Hello bot' },
        { source: 'assistant', text: 'Hi there!' },
        { source: 'user', text: 'How are you?' },
      ];

      const result = formatConversationHistory(history, 'You are helpful.', 'Tell me a joke', 2);

      expect(result).toContain('You are helpful.');
      expect(result).toContain('## Previous Conversation:');
      expect(result).not.toContain('Hello bot');
      expect(result).toContain('Assistant: Hi there!');
      expect(result).toContain('User: How are you?');
      expect(result.trim().endsWith('User: Tell me a joke')).toBe(true);
    });
  });

  describe('generateAgentReply', () => {
    it('generates a reply using generateContent', async () => {
      const generateContent = jest.fn().mockResolvedValue(buildTextResponse('  Hello there  '));
      mockGetGenerativeModel.mockReturnValue({ generateContent });

      const result = await generateAgentReply({
        systemPrompt: 'Be concise.',
        userText: 'Hi',
        history: [{ source: 'user', text: 'Earlier message' }],
      });

      expect(GoogleGenerativeAI).toHaveBeenCalledWith('test-key');
      expect(mockGetGenerativeModel).toHaveBeenCalledWith({ model: 'gemini-2.0-flash' });
      expect(generateContent).toHaveBeenCalled();
      expect(result.text).toBe('Hello there');
      expect(result.modelName).toBe('gemini-2.0-flash');
      expect(result.fullPrompt).toContain('Earlier message');
    });

    it('extracts text when raw result exposes text() directly', async () => {
      const generateContent = jest.fn().mockResolvedValue({ text: jest.fn().mockResolvedValue('direct stream') });
      mockGetGenerativeModel.mockReturnValue({ generateContent });

      const result = await generateAgentReply({
        systemPrompt: 'Be friendly',
        userText: 'Hi there',
      });

      expect(result.text).toBe('direct stream');
    });

    it('extracts text when output content is a string', async () => {
      const generateContent = jest.fn().mockResolvedValue({ output: [{ content: 'string body' }] });
      mockGetGenerativeModel.mockReturnValue({ generateContent });

      const result = await generateAgentReply({
        systemPrompt: 'system',
        userText: 'User input',
      });

      expect(result.text).toBe('string body');
    });

    it('extracts text from candidate content fallback', async () => {
      const generateContent = jest.fn().mockResolvedValue({ candidates: [{ content: 'candidate copy' }] });
      mockGetGenerativeModel.mockReturnValue({ generateContent });

      const result = await generateAgentReply({
        systemPrompt: 'system',
        userText: 'Candidate please',
      });

      expect(result.text).toBe('candidate copy');
    });

    it('extracts text from candidate output string', async () => {
      const generateContent = jest.fn().mockResolvedValue({ candidates: [{ output: 'candidate output' }] });
      mockGetGenerativeModel.mockReturnValue({ generateContent });

      const result = await generateAgentReply({
        systemPrompt: 'system',
        userText: 'Candidate please',
      });

      expect(result.text).toBe('candidate output');
    });

    it('extracts text from plain string payloads', async () => {
      const generateContent = jest.fn().mockResolvedValue('  loose text  ');
      mockGetGenerativeModel.mockReturnValue({ generateContent });

      const result = await generateAgentReply({
        systemPrompt: '',
        userText: 'just text',
      });

      expect(result.text).toBe('loose text');
    });

    it('extracts text from string property on result object', async () => {
      const generateContent = jest.fn().mockResolvedValue({ text: 'string field' });
      mockGetGenerativeModel.mockReturnValue({ generateContent });

      const result = await generateAgentReply({
        systemPrompt: '',
        userText: 'text field case',
      });

      expect(result.text).toBe('string field');
    });

    it('falls back to alternate model and uses generate with retry', async () => {
      const generate = jest
        .fn()
        .mockRejectedValueOnce(new Error('bad payload'))
        .mockResolvedValue({ output: [{ content: [{ text: 'Fallback says hi' }] }] });

      mockGetGenerativeModel
        .mockImplementationOnce(() => {
          throw new Error('primary failure');
        })
        .mockImplementationOnce(() => ({ generate }));

      const result = await generateAgentReply({
        systemPrompt: 'Fallback prompt',
        userText: 'Primary failed',
      });

      expect(mockGetGenerativeModel).toHaveBeenNthCalledWith(1, { model: 'gemini-2.0-flash' });
      expect(mockGetGenerativeModel).toHaveBeenNthCalledWith(2, { model: 'gemini-pro' });
      expect(generate).toHaveBeenCalledTimes(2);
      expect(generate).toHaveBeenNthCalledWith(1, expect.objectContaining({ prompt: expect.any(String) }));
      expect(generate).toHaveBeenNthCalledWith(2, expect.any(String));
      expect(result.text).toBe('Fallback says hi');
      expect(result.modelName).toBe('gemini-pro');
    });

    it('throws when model does not expose generation methods', async () => {
      mockGetGenerativeModel.mockReturnValue({});

      await expect(
        generateAgentReply({
          systemPrompt: 'system',
          userText: 'no methods',
        }),
      ).rejects.toThrow('Model does not support content generation');
    });

    it('throws when both model initialisation attempts fail', async () => {
      mockGetGenerativeModel
        .mockImplementationOnce(() => {
          throw new Error('primary down');
        })
        .mockImplementationOnce(() => {
          throw 'offline';
        });

      await expect(
        generateAgentReply({
          systemPrompt: 'system',
          userText: 'hi',
        }),
      ).rejects.toThrow('Failed to initialise Gemini model: offline');
    });

    it('throws when LLM returns empty text', async () => {
      mockGetGenerativeModel.mockReturnValue({ generateContent: jest.fn().mockResolvedValue({}) });

      await expect(
        generateAgentReply({
          systemPrompt: 'system',
          userText: '  hi ',
        }),
      ).rejects.toThrow('Received empty response from LLM');
    });

    it('throws when GEMINI_API_KEY is missing', async () => {
  const envWithoutKey: NodeJS.ProcessEnv = { ...originalEnv };
  delete envWithoutKey.GEMINI_API_KEY;
  process.env = envWithoutKey;

      await expect(
        generateAgentReply({
          systemPrompt: 'system',
          userText: 'hi',
        }),
      ).rejects.toThrow('LLM service not configured');
    });

    it('throws when user text is blank', async () => {
      await expect(
        generateAgentReply({
          systemPrompt: '',
          userText: '   ',
        }),
      ).rejects.toThrow('No user text provided');
    });
  });
});
