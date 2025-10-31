/**
 * @jest-environment node
 */
import { DELETE, GET, POST } from '@/app/api/campaign-contacts/route'
import { NextRequest } from 'next/server'

// Mock dependencies
jest.mock('@/lib/dbConnect')
jest.mock('@/models/CampaignContact')

import dbConnect from '@/lib/dbConnect'
import CampaignContact from '@/models/CampaignContact'

describe('API: /api/campaign-contacts', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET Request - Get contacts by campaign_id', () => {
    it('should return contacts for a specific campaign', async () => {
      const mockContacts = [
        {
          _id: 'contact-1',
          number: '1234567890',
          name: 'John Doe',
          description: 'Customer',
          campaign_id: 'campaign-123',
          call_done: 'no'
        },
        {
          _id: 'contact-2',
          number: '0987654321',
          name: 'Jane Smith',
          description: 'Lead',
          campaign_id: 'campaign-123',
          call_done: 'no'
        }
      ]

      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
      ;(CampaignContact.find as jest.Mock).mockResolvedValue(mockContacts)

      const request = new NextRequest('http://localhost:3000/api/campaign-contacts?campaign_id=campaign-123')

      const response = await GET(request)
      const data = await response.json()

      expect(dbConnect).toHaveBeenCalled()
      expect(CampaignContact.find).toHaveBeenCalledWith({ campaign_id: 'campaign-123' })
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockContacts)
      expect(data.data).toHaveLength(2)
    })

    it('should return empty array when no contacts found for campaign', async () => {
      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
      ;(CampaignContact.find as jest.Mock).mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/campaign-contacts?campaign_id=empty-campaign')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual([])
    })

    it('should return error when campaign_id is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/campaign-contacts')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('campaign_id is required')
      expect(CampaignContact.find).not.toHaveBeenCalled()
    })

    it('should handle database errors', async () => {
      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
      ;(CampaignContact.find as jest.Mock).mockRejectedValue(new Error('Database query failed'))

      const request = new NextRequest('http://localhost:3000/api/campaign-contacts?campaign_id=campaign-123')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Database query failed')
    })

    it('should fall back to a generic error when thrown value is not an Error', async () => {
      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
      ;(CampaignContact.find as jest.Mock).mockRejectedValue('boom')

      const request = new NextRequest('http://localhost:3000/api/campaign-contacts?campaign_id=campaign-123')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Unknown error')
    })
  })

  describe('POST Request - Upload CSV and create contacts', () => {
    it('should successfully upload CSV and create contacts', async () => {
      const csvContent = `number,name,description
1234567890,John Doe,Customer
0987654321,Jane Smith,Lead
5555555555,Bob Johnson,Prospect`

      const mockCreatedContacts = [
        { _id: '1', number: '1234567890', name: 'John Doe', description: 'Customer', campaign_id: 'campaign-123', call_done: 'no' },
        { _id: '2', number: '0987654321', name: 'Jane Smith', description: 'Lead', campaign_id: 'campaign-123', call_done: 'no' },
        { _id: '3', number: '5555555555', name: 'Bob Johnson', description: 'Prospect', campaign_id: 'campaign-123', call_done: 'no' }
      ]

      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
      ;(CampaignContact.find as jest.Mock).mockResolvedValue([])
      ;(CampaignContact.insertMany as jest.Mock).mockResolvedValue(mockCreatedContacts)

      const formData = new FormData()
      const file = new File([csvContent], 'contacts.csv', { type: 'text/csv' })
      formData.append('file', file)
      formData.append('campaign_id', 'campaign-123')

      const request = new NextRequest('http://localhost:3000/api/campaign-contacts', {
        method: 'POST',
        body: formData
      })

      const response = await POST(request)
      const data = await response.json()

      expect(dbConnect).toHaveBeenCalled()
      expect(CampaignContact.insertMany).toHaveBeenCalledWith([
        { number: '1234567890', name: 'John Doe', description: 'Customer', campaign_id: 'campaign-123', call_done: 'no' },
        { number: '0987654321', name: 'Jane Smith', description: 'Lead', campaign_id: 'campaign-123', call_done: 'no' },
        { number: '5555555555', name: 'Bob Johnson', description: 'Prospect', campaign_id: 'campaign-123', call_done: 'no' }
      ])
      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.count).toBe(3)
      expect(data.data).toEqual(mockCreatedContacts)
    })

    it('should handle CSV with capitalized headers', async () => {
      const csvContent = `Number,Name,Description
1234567890,John Doe,Customer`

      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
      ;(CampaignContact.find as jest.Mock).mockResolvedValue([])
      ;(CampaignContact.insertMany as jest.Mock).mockResolvedValue([
        { _id: '1', number: '1234567890', name: 'John Doe', description: 'Customer', campaign_id: 'campaign-123', call_done: 'no' }
      ])

      const formData = new FormData()
      const file = new File([csvContent], 'contacts.csv', { type: 'text/csv' })
      formData.append('file', file)
      formData.append('campaign_id', 'campaign-123')

      const request = new NextRequest('http://localhost:3000/api/campaign-contacts', {
        method: 'POST',
        body: formData
      })

      const response = await POST(request)
      const data = await response.json()

      expect(CampaignContact.insertMany).toHaveBeenCalledWith([
        { number: '1234567890', name: 'John Doe', description: 'Customer', campaign_id: 'campaign-123', call_done: 'no' }
      ])
      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
    })

    it('should handle missing optional fields in CSV', async () => {
      const csvContent = `number,name
1234567890,John Doe`

      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
      ;(CampaignContact.find as jest.Mock).mockResolvedValue([])
      ;(CampaignContact.insertMany as jest.Mock).mockResolvedValue([
        { _id: '1', number: '1234567890', name: 'John Doe', description: '', campaign_id: 'campaign-123', call_done: 'no' }
      ])

      const formData = new FormData()
      const file = new File([csvContent], 'contacts.csv', { type: 'text/csv' })
      formData.append('file', file)
      formData.append('campaign_id', 'campaign-123')

      const request = new NextRequest('http://localhost:3000/api/campaign-contacts', {
        method: 'POST',
        body: formData
      })

      const response = await POST(request)
      const data = await response.json()

      expect(CampaignContact.insertMany).toHaveBeenCalledWith([
        { number: '1234567890', name: 'John Doe', description: '', campaign_id: 'campaign-123', call_done: 'no' }
      ])
      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
    })

    it('should skip empty lines in CSV', async () => {
      const csvContent = `number,name,description
1234567890,John Doe,Customer

0987654321,Jane Smith,Lead`

      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
      ;(CampaignContact.find as jest.Mock).mockResolvedValue([])
      ;(CampaignContact.insertMany as jest.Mock).mockResolvedValue([
        { _id: '1', number: '1234567890', name: 'John Doe', description: 'Customer', campaign_id: 'campaign-123', call_done: 'no' },
        { _id: '2', number: '0987654321', name: 'Jane Smith', description: 'Lead', campaign_id: 'campaign-123', call_done: 'no' }
      ])

      const formData = new FormData()
      const file = new File([csvContent], 'contacts.csv', { type: 'text/csv' })
      formData.append('file', file)
      formData.append('campaign_id', 'campaign-123')

      const request = new NextRequest('http://localhost:3000/api/campaign-contacts', {
        method: 'POST',
        body: formData
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.count).toBe(2)
      expect(response.status).toBe(201)
    })

    it('should return error when file is missing', async () => {
      const formData = new FormData()
      formData.append('campaign_id', 'campaign-123')

      const request = new NextRequest('http://localhost:3000/api/campaign-contacts', {
        method: 'POST',
        body: formData
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('No file uploaded')
      expect(CampaignContact.insertMany).not.toHaveBeenCalled()
    })

    it('should return error when campaign_id is missing', async () => {
      const csvContent = 'number,name\n1234567890,John'
      const formData = new FormData()
      const file = new File([csvContent], 'contacts.csv', { type: 'text/csv' })
      formData.append('file', file)

      const request = new NextRequest('http://localhost:3000/api/campaign-contacts', {
        method: 'POST',
        body: formData
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('campaign_id is required')
      expect(CampaignContact.insertMany).not.toHaveBeenCalled()
    })

    it('should handle CSV parsing errors', async () => {
      const invalidCsv = 'invalid,csv,format\n"unclosed quote'
      const formData = new FormData()
      const file = new File([invalidCsv], 'contacts.csv', { type: 'text/csv' })
      formData.append('file', file)
      formData.append('campaign_id', 'campaign-123')

      const request = new NextRequest('http://localhost:3000/api/campaign-contacts', {
        method: 'POST',
        body: formData
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })

    it('should handle contacts missing the number field', async () => {
      const csvContent = `name,description\nJohn Doe,Customer`

      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
      ;(CampaignContact.find as jest.Mock).mockResolvedValue([])
      ;(CampaignContact.insertMany as jest.Mock).mockResolvedValue([])

      const formData = new FormData()
      const file = new File([csvContent], 'contacts.csv', { type: 'text/csv' })
      formData.append('file', file)
      formData.append('campaign_id', 'campaign-123')

      const request = new NextRequest('http://localhost:3000/api/campaign-contacts', {
        method: 'POST',
        body: formData
      })

      const response = await POST(request)
      const data = await response.json()

      // Empty numbers are filtered out, so insertMany should not be called
      expect(CampaignContact.insertMany).not.toHaveBeenCalled()
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.count).toBe(0)
      expect(data.message).toContain('No new contacts to add')
    })

    it('should return generic error when insertion rejects with non-error value', async () => {
      const csvContent = 'number,name\n1234567890,John'
      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
      ;(CampaignContact.find as jest.Mock).mockResolvedValue([])
      ;(CampaignContact.insertMany as jest.Mock).mockRejectedValue('failed')

      const formData = new FormData()
      const file = new File([csvContent], 'contacts.csv', { type: 'text/csv' })
      formData.append('file', file)
      formData.append('campaign_id', 'campaign-123')

      const request = new NextRequest('http://localhost:3000/api/campaign-contacts', {
        method: 'POST',
        body: formData
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Unknown error')
    })

    it('should handle database insertion errors', async () => {
      const csvContent = 'number,name\n1234567890,John'
      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
      ;(CampaignContact.find as jest.Mock).mockResolvedValue([])
      ;(CampaignContact.insertMany as jest.Mock).mockRejectedValue(new Error('Database insertion failed'))

      const formData = new FormData()
      const file = new File([csvContent], 'contacts.csv', { type: 'text/csv' })
      formData.append('file', file)
      formData.append('campaign_id', 'campaign-123')

      const request = new NextRequest('http://localhost:3000/api/campaign-contacts', {
        method: 'POST',
        body: formData
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Database insertion failed')
    })

    it('should trim whitespace from CSV values', async () => {
      const csvContent = `number,name,description
  1234567890  ,  John Doe  ,  Customer  `

      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
      ;(CampaignContact.find as jest.Mock).mockResolvedValue([])
      ;(CampaignContact.insertMany as jest.Mock).mockResolvedValue([
        { _id: '1', number: '1234567890', name: 'John Doe', description: 'Customer', campaign_id: 'campaign-123', call_done: 'no' }
      ])

      const formData = new FormData()
      const file = new File([csvContent], 'contacts.csv', { type: 'text/csv' })
      formData.append('file', file)
      formData.append('campaign_id', 'campaign-123')

      const request = new NextRequest('http://localhost:3000/api/campaign-contacts', {
        method: 'POST',
        body: formData
      })

      const response = await POST(request)

      expect(CampaignContact.insertMany).toHaveBeenCalledWith([
        { number: '1234567890', name: 'John Doe', description: 'Customer', campaign_id: 'campaign-123', call_done: 'no' }
      ])
      expect(response.status).toBe(201)
    })

    it('should handle mixed case headers and partial missing fields', async () => {
      const csvContent = `number,Name,description
1234567890,John Doe,Customer
0987654321,,Lead
5555555555,Bob Johnson,`

      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
      ;(CampaignContact.find as jest.Mock).mockResolvedValue([])
      ;(CampaignContact.insertMany as jest.Mock).mockResolvedValue([
        { _id: '1', number: '1234567890', name: 'John Doe', description: 'Customer', campaign_id: 'campaign-123', call_done: 'no' },
        { _id: '2', number: '0987654321', name: '', description: 'Lead', campaign_id: 'campaign-123', call_done: 'no' },
        { _id: '3', number: '5555555555', name: 'Bob Johnson', description: '', campaign_id: 'campaign-123', call_done: 'no' }
      ])

      const formData = new FormData()
      const file = new File([csvContent], 'contacts.csv', { type: 'text/csv' })
      formData.append('file', file)
      formData.append('campaign_id', 'campaign-123')

      const request = new NextRequest('http://localhost:3000/api/campaign-contacts', {
        method: 'POST',
        body: formData
      })

      const response = await POST(request)
      const data = await response.json()

      expect(CampaignContact.insertMany).toHaveBeenCalledWith([
        { number: '1234567890', name: 'John Doe', description: 'Customer', campaign_id: 'campaign-123', call_done: 'no' },
        { number: '0987654321', name: '', description: 'Lead', campaign_id: 'campaign-123', call_done: 'no' },
        { number: '5555555555', name: 'Bob Johnson', description: '', campaign_id: 'campaign-123', call_done: 'no' }
      ])
      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.count).toBe(3)
    })
  })

  describe('DELETE Request - Delete contact by id', () => {
    it('should successfully delete a contact', async () => {
      const mockDeletedContact = {
        _id: 'contact-123',
        number: '1234567890',
        name: 'John Doe',
        description: 'Customer',
        campaign_id: 'campaign-123',
        call_done: 'no'
      }

      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
      ;(CampaignContact.findByIdAndDelete as jest.Mock).mockResolvedValue(mockDeletedContact)

      const request = new NextRequest('http://localhost:3000/api/campaign-contacts?id=contact-123')

      const response = await DELETE(request)
      const data = await response.json()

      expect(dbConnect).toHaveBeenCalled()
      expect(CampaignContact.findByIdAndDelete).toHaveBeenCalledWith('contact-123')
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockDeletedContact)
    })

    it('should return error when contact ID is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/campaign-contacts')

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Contact ID is required')
      expect(CampaignContact.findByIdAndDelete).not.toHaveBeenCalled()
    })

    it('should return 404 when contact not found', async () => {
      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
      ;(CampaignContact.findByIdAndDelete as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/campaign-contacts?id=non-existent-id')

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Contact not found')
    })

    it('should handle database deletion errors', async () => {
      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
      ;(CampaignContact.findByIdAndDelete as jest.Mock).mockRejectedValue(new Error('Database deletion failed'))

      const request = new NextRequest('http://localhost:3000/api/campaign-contacts?id=contact-123')

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Database deletion failed')
    })

    it('should return generic error when deletion throws a non-error value', async () => {
      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
      ;(CampaignContact.findByIdAndDelete as jest.Mock).mockRejectedValue('not good')

      const request = new NextRequest('http://localhost:3000/api/campaign-contacts?id=contact-123')

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Unknown error')
    })

    it('should handle invalid contact ID format', async () => {
      ;(dbConnect as jest.Mock).mockResolvedValue(undefined)
      ;(CampaignContact.findByIdAndDelete as jest.Mock).mockRejectedValue(
        new Error('Cast to ObjectId failed for value "invalid-id"')
      )

      const request = new NextRequest('http://localhost:3000/api/campaign-contacts?id=invalid-id')

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Cast to ObjectId failed')
    })
  })
})
