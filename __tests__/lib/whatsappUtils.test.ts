import { normalizeWhatsAppNumber } from '@/lib/whatsappUtils';

describe('normalizeWhatsAppNumber', () => {
  it('returns empty string for nullish input', () => {
    expect(normalizeWhatsAppNumber(undefined)).toBe('');
    expect(normalizeWhatsAppNumber('   ')).toBe('');
  });

  it('preserves leading plus and strips formatting characters', () => {
    expect(normalizeWhatsAppNumber(' +91 (123) 456-7890 ')).toBe('+911234567890');
  });

  it('returns plus when only plus sign is provided', () => {
    expect(normalizeWhatsAppNumber('+')).toBe('+');
  });

  it('drops non-numeric characters when no digits exist', () => {
    expect(normalizeWhatsAppNumber('abc')).toBe('');
  });

  it('removes non-digit characters while keeping digits', () => {
    expect(normalizeWhatsAppNumber('meta-phone-42')).toBe('42');
  });
});
