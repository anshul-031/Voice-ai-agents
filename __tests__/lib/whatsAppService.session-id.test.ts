import { __testExports } from '@/lib/whatsAppService';

describe('buildSessionId', () => {
  const { buildSessionId } = __testExports;

  it('keeps alphanumeric business identifiers intact', () => {
    expect(buildSessionId('919876543210', 'meta-phone-42')).toBe('whatsapp_meta-phone-42_919876543210');
  });

  it('normalizes numeric WhatsApp numbers with formatting', () => {
    expect(buildSessionId(' +1 234 ', '+91 555-0000')).toBe('whatsapp_+915550000_+1234');
  });

  it('handles missing values by emitting empty components', () => {
    expect(buildSessionId('', '')).toBe('whatsapp__');
  });
});
