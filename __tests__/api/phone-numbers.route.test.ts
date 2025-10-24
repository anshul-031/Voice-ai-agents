/**
 * @jest-environment node
 */

import { GET, POST } from '@/app/api/phone-numbers/route'
import { NextRequest } from 'next/server'

jest.mock('@/lib/mongodb', () => jest.fn())

jest.mock('@/models/PhoneNumber', () => {
  const saveMock = jest.fn()
  const findMock = jest.fn()
  const findOneMock = jest.fn()
  const findByIdAndUpdateMock = jest.fn()
  const findByIdAndDeleteMock = jest.fn()

  const PhoneNumberMock = function (this: any, data: any) {
    Object.assign(this, data)
    this._id = this._id ?? 'mock-phone-id'
    this.save = saveMock
  }

  PhoneNumberMock.find = findMock
  PhoneNumberMock.findOne = findOneMock
  PhoneNumberMock.findByIdAndUpdate = findByIdAndUpdateMock
  PhoneNumberMock.findByIdAndDelete = findByIdAndDeleteMock

  return {
    __esModule: true,
    default: PhoneNumberMock,
    saveMock,
    findMock,
    findOneMock,
    findByIdAndUpdateMock,
    findByIdAndDeleteMock
  }
})

const mockDbConnect = require('@/lib/mongodb') as jest.Mock
const phoneNumberModule = require('@/models/PhoneNumber') as {
  default: any
  saveMock: jest.Mock
  findMock: jest.Mock
  findOneMock: jest.Mock
}

const mockPhoneFindResult = (records: any[]) => {
  const execMock = jest.fn().mockResolvedValue(records)
  const leanMock = jest.fn(() => ({ exec: execMock }))
  const sortMock = jest.fn(() => ({ lean: leanMock }))

  phoneNumberModule.findMock.mockReturnValue({ sort: sortMock })
  return { execMock, leanMock, sortMock }
}

describe('Phone Numbers API route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockDbConnect.mockResolvedValue(undefined)
    delete process.env.NEXT_PUBLIC_APP_URL
  })

  const createRequest = (
    url: string,
    init: {
      method?: string
      headers?: Record<string, string>
      body?: string
    } = {}
  ) => new NextRequest(url, init as any)

  const createJsonRequest = (url: string, body: any) =>
    createRequest(url, {
      method: 'POST',
      body: JSON.stringify(body)
    })

  it('returns masked Exotel keys and uses configured origin', async () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://app.example.com/base/'

    mockPhoneFindResult([
      {
        _id: 'phone-1',
        userId: 'user-1',
        phoneNumber: '+1555000',
        provider: 'exotel',
        displayName: 'Primary',
        exotelConfig: { apiKey: 'abcd1234', apiToken: 'xyz9876', sid: 'sid', appId: 'app', domain: 'singapore', region: 'apac' },
        linkedAgentId: 'agent-1',
        webhookIdentifier: 'webhook-1',
        status: 'active',
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-02')
      }
    ])

    const request = createRequest('https://api.test.local/api/phone-numbers?userId=user-1')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.phoneNumbers[0].webhookUrl).toBe('https://app.example.com/base/api/telephony/webhook/webhook-1')
    expect(data.phoneNumbers[0].websocketUrl).toBe('wss://app.example.com/base/api/telephony/ws/webhook-1')
    expect(data.phoneNumbers[0].exotelConfig.apiKey).toBe('***1234')
    expect(data.phoneNumbers[0].exotelConfig.apiToken).toBe('***9876')
  })

  it('derives identifier from existing URLs when placeholder origin detected', async () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://your-domain.com/'

    mockPhoneFindResult([
      {
        _id: 'phone-2',
        userId: 'user-2',
        phoneNumber: '+1555011',
        provider: 'exotel',
        displayName: 'Secondary',
        webhookUrl: 'https://old.app/api/telephony/webhook/legacy-identifier',
        websocketUrl: 'wss://old.app/api/telephony/ws/legacy-identifier',
        status: 'inactive',
        createdAt: new Date('2025-01-03'),
        updatedAt: new Date('2025-01-04')
      }
    ])

    const request = createRequest('http://placeholder/api/phone-numbers', {
      headers: {
        'x-forwarded-host': 'example.test',
        'x-forwarded-proto': 'https'
      }
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.phoneNumbers[0].webhookUrl).toBe('https://example.test/api/telephony/webhook/legacy-identifier')
    expect(data.phoneNumbers[0].websocketUrl).toBe('wss://example.test/api/telephony/ws/legacy-identifier')
  })

  it('returns 400 when required fields are missing on POST', async () => {
    const request = createJsonRequest('https://api.test/api/phone-numbers', {
      displayName: '',
      phoneNumber: ''
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Missing required fields: phoneNumber, displayName')
    expect(phoneNumberModule.findOneMock).not.toHaveBeenCalled()
  })

  it('returns 400 when phone number already exists', async () => {
    phoneNumberModule.findOneMock.mockResolvedValueOnce({ _id: 'existing-phone' })

    const request = createJsonRequest('https://api.test/api/phone-numbers', {
      phoneNumber: '+1555000',
      displayName: 'Primary'
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Phone number already exists')
  })

  it('creates phone number and returns generated URLs', async () => {
    phoneNumberModule.findOneMock.mockResolvedValueOnce(null)
    phoneNumberModule.saveMock.mockResolvedValueOnce(undefined)

    const request = createJsonRequest('https://api.test/api/phone-numbers', {
      userId: 'user-1',
      phoneNumber: '+1555666',
      displayName: 'Sales',
      provider: 'exotel',
      exotelConfig: { apiKey: 'secret', apiToken: 'token', sid: 'sid', appId: 'app', domain: 'singapore', region: 'apac' },
      linkedAgentId: 'agent-9'
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.phoneNumber.phoneNumber).toBe('+1555666')
    expect(data.phoneNumber.webhookUrl).toContain('/api/telephony/webhook/phone_')
    expect(data.phoneNumber.websocketUrl).toContain('/api/telephony/ws/phone_')
    expect(phoneNumberModule.saveMock).toHaveBeenCalled()
  })
})
