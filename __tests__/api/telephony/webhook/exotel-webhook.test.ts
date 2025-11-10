/**
 * @jest-environment node
 */
import { GET, POST } from '@/app/api/telephony/webhook/[phoneId]/route';
import { NextRequest } from 'next/server';

jest.mock('@/lib/mongodb', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/models/Chat', () => ({
  __esModule: true,
  default: { create: jest.fn().mockResolvedValue({ _id: 'chat1' }) },
}));

jest.mock('@/models/PhoneNumber', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
  },
}));

jest.mock('@/models/VoiceAgent', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
    findOne: jest.fn().mockReturnValue({ sort: jest.fn().mockResolvedValue(null) }),
  },
}));

const PhoneNumberModel = require('@/models/PhoneNumber').default;
const VoiceAgentModel = require('@/models/VoiceAgent').default;
const ChatModel = require('@/models/Chat').default;

describe('Exotel Telephony Webhook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 404 when phone number not found', async () => {
    PhoneNumberModel.findOne.mockResolvedValue(null);

    const req = new NextRequest('http://localhost/api/telephony/webhook/ph-1', {
      method: 'POST',
      body: JSON.stringify({ CallSid: 'sid1', From: '+100', To: '+200', Status: 'ringing' }),
    });

    const res = await POST(req as any, { params: Promise.resolve({ phoneId: 'ph-1' }) } as any);
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe('Phone number not found');
  });

  it('returns 500 when no agent available', async () => {
    PhoneNumberModel.findOne.mockResolvedValue({
      _id: 'ph-2',
      userId: 'u1',
      save: jest.fn().mockResolvedValue(true),
      linkedAgentId: undefined,
    });

    VoiceAgentModel.findOne = jest.fn().mockReturnValue({ sort: jest.fn().mockResolvedValue(null) });

    const req = new NextRequest('http://localhost/api/telephony/webhook/ph-2', {
      method: 'POST',
      body: JSON.stringify({ CallSid: 'sid2', From: '+111', To: '+222', Status: 'ringing' }),
    });

    const res = await POST(req as any, { params: Promise.resolve({ phoneId: 'ph-2' }) } as any);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe('No agent configured');
  });

  it('returns XML with websocket fallback when websocketUrl missing', async () => {
    PhoneNumberModel.findOne.mockResolvedValue({
      _id: 'ph-3',
      userId: 'u1',
      save: jest.fn().mockResolvedValue(true),
      linkedAgentId: 'agent-1',
      websocketUrl: undefined,
    });

    VoiceAgentModel.findById.mockResolvedValue({ _id: 'agent-1', prompt: 'Hello there' });

    const req = new NextRequest('http://localhost/api/telephony/webhook/ph-3', {
      method: 'POST',
      body: JSON.stringify({ CallSid: 'sid3', From: '+123', To: '+234', Status: 'in-progress' }),
    });

    const res = await POST(req as any, { params: Promise.resolve({ phoneId: 'ph-3' }) } as any);
    const text = await res.text();

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('application/xml');
    expect(text).toContain('<Response>');
    expect(ChatModel.create).toHaveBeenCalled();
  });

  it('returns XML streaming block when websocketUrl present', async () => {
    PhoneNumberModel.findOne.mockResolvedValue({
      _id: 'ph-4',
      userId: 'u2',
      save: jest.fn().mockResolvedValue(true),
      linkedAgentId: 'agent-2',
      websocketUrl: 'wss://example/ws',
    });

    VoiceAgentModel.findById.mockResolvedValue({ _id: 'agent-2', prompt: 'नमस्ते' });

    const req = new NextRequest('http://localhost/api/telephony/webhook/ph-4', {
      method: 'POST',
      body: JSON.stringify({ CallSid: 'sid4', From: '+345', To: '+456', Status: 'completed' }),
    });

    const res = await POST(req as any, { params: Promise.resolve({ phoneId: 'ph-4' }) } as any);
    const text = await res.text();

    expect(res.status).toBe(200);
    expect(text).toContain('<Stream url="wss://example/ws">');
  });

  it('handles form-urlencoded body path', async () => {
    PhoneNumberModel.findOne.mockResolvedValue({
      _id: 'ph-5',
      userId: 'u3',
      save: jest.fn().mockResolvedValue(true),
      linkedAgentId: 'agent-3',
    });

    VoiceAgentModel.findById.mockResolvedValue({ _id: 'agent-3', prompt: 'Hello' });

    const form = new FormData();
    form.append('CallSid', 'sid5');
    form.append('From', '+777');
    form.append('To', '+888');
    form.append('Status', 'ringing');

    const req = new NextRequest('http://localhost/api/telephony/webhook/ph-5', {
      method: 'POST',
      body: form as any,
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
    } as any);

    const res = await POST(req as any, { params: Promise.resolve({ phoneId: 'ph-5' }) } as any);
    expect(res.status).toBe(200);
  });

  it('catches unexpected errors and returns 500', async () => {
    const db = require('@/lib/mongodb').default as jest.Mock;
    db.mockRejectedValueOnce(new Error('db down'));

    const req = new NextRequest('http://localhost/api/telephony/webhook/ph-6', {
      method: 'POST',
      body: JSON.stringify({ CallSid: 'sid6', From: '+999', To: '+000', Status: 'ringing' }),
    });

    const res = await POST(req as any, { params: Promise.resolve({ phoneId: 'ph-6' }) } as any);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe('Failed to process webhook');
    expect(data.details).toBe('db down');
  });

  it('GET returns active status', async () => {
    const res = await GET(new NextRequest('http://localhost/api/telephony/webhook/ph-7') as any, { params: Promise.resolve({ phoneId: 'ph-7' }) } as any);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.status).toBe('active');
    expect(data.phoneId).toBe('ph-7');
  });
});
