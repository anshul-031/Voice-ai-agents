/**
 * @jest-environment node
 */
import { GET } from '@/app/api/telephony/ws/[phoneId]/route';
import { NextRequest } from 'next/server';

describe('/api/telephony/ws/[phoneId]', () => {
  const mockParams = { phoneId: 'test-phone-123' };
  const mockContext = { params: Promise.resolve(mockParams) };

  describe('GET', () => {
    it('should return websocket endpoint information', async () => {
      const request = new NextRequest('http://localhost/api/telephony/ws/test-phone-123');

      const response = await GET(request, mockContext);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('application/json');
      expect(data.status).toBe('websocket_endpoint');
      expect(data.phoneId).toBe('test-phone-123');
      expect(data.message).toBe('WebSocket endpoint for real-time audio streaming');
      expect(data.note).toContain('WebSocket upgrade is not directly supported');
      expect(data.alternative).toContain('/api/telephony/webhook/test-phone-123');
      expect(data.documentation).toBe('See TELEPHONY_SETUP.md for detailed setup instructions');
    });
  });
});