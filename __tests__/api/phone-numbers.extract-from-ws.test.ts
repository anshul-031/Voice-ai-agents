/**
 * @jest-environment node
 */

import { GET } from '@/app/api/phone-numbers/route';
import { NextRequest } from 'next/server';

jest.mock('@/lib/mongodb', () => jest.fn());

// Minimal PhoneNumber mock to support GET with .find().sort().lean().exec()
jest.mock('@/models/PhoneNumber', () => {
  const findMock = jest.fn();
  const PhoneNumberMock = function () {} as any;
  PhoneNumberMock.find = findMock;
  return { __esModule: true, default: PhoneNumberMock, findMock };
});

const phoneModule = require('@/models/PhoneNumber') as { findMock: jest.Mock };

const returnFindWith = (records: any[]) => {
  const execMock = jest.fn().mockResolvedValue(records);
  const leanMock = jest.fn(() => ({ exec: execMock }));
  const sortMock = jest.fn(() => ({ lean: leanMock }));
  phoneModule.findMock.mockReturnValue({ sort: sortMock });
};

describe('Phone Numbers API - extract identifier from websocketUrl fallback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.NEXT_PUBLIC_APP_URL; // force resolveOrigins to derive from request
  });

  it('uses identifier derived from websocketUrl when webhookIdentifier and webhookUrl are missing', async () => {
    // Provide only websocketUrl with trailing slash to also exercise stripTrailingSlash path
    returnFindWith([
      {
        _id: 'id-3',
        userId: 'u-3',
        phoneNumber: '+1555033',
        provider: 'exotel',
        displayName: 'WS only',
        websocketUrl: 'wss://old.app/api/telephony/ws/from-ws-only',
        status: 'active',
        createdAt: new Date('2025-01-05'),
        updatedAt: new Date('2025-01-06'),
      },
    ]);

    const req = new NextRequest('http://host.test/api/phone-numbers', {
      headers: { 'x-forwarded-host': 'edge.example', 'x-forwarded-proto': 'https' },
    } as any);

    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();

    // Identifier should be derived from websocketUrl
    expect(data.phoneNumbers[0].webhookUrl).toBe(
      'https://edge.example/api/telephony/webhook/from-ws-only'
    );
    expect(data.phoneNumbers[0].websocketUrl).toBe(
      'wss://edge.example/api/telephony/ws/from-ws-only'
    );
  });
});
