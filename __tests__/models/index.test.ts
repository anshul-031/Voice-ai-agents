import Campaign from '@/models/Campaign';
import CampaignContact from '@/models/CampaignContact';
import Chat from '@/models/Chat';
import PhoneNumber from '@/models/PhoneNumber';
import VoiceAgent from '@/models/VoiceAgent';
import WhatsAppMessage from '@/models/WhatsAppMessage';
import WhatsAppNumber from '@/models/WhatsAppNumber';

describe('Models', () => {
  test('imports all models successfully', () => {
    expect(Campaign).toBeDefined();
    expect(CampaignContact).toBeDefined();
    expect(Chat).toBeDefined();
    expect(PhoneNumber).toBeDefined();
    expect(VoiceAgent).toBeDefined();
    expect(WhatsAppMessage).toBeDefined();
    expect(WhatsAppNumber).toBeDefined();
  });
});