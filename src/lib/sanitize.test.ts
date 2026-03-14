import { describe, it, expect } from 'vitest';
import { sanitizeUrl, sanitizeText, validatePrice, validateProposal } from './sanitize';

describe('sanitize', () => {
  describe('sanitizeUrl', () => {
    it('acepta URLs http y https', () => {
      expect(sanitizeUrl('https://www.skyscanner.com/flights')).toBe('https://www.skyscanner.com/flights');
      expect(sanitizeUrl('http://example.com')).toBe('http://example.com');
    });
    it('rechaza javascript y otros protocolos', () => {
      expect(sanitizeUrl('javascript:alert(1)')).toBeNull();
      expect(sanitizeUrl('file:///etc/passwd')).toBeNull();
    });
    it('rechaza cadenas vacías o demasiado largas', () => {
      expect(sanitizeUrl('')).toBeNull();
      expect(sanitizeUrl('   ')).toBeNull();
      expect(sanitizeUrl('x'.repeat(2001))).toBeNull();
    });
  });

  describe('sanitizeText', () => {
    it('hace trim y elimina caracteres de control', () => {
      expect(sanitizeText('  París  ')).toBe('París');
      expect(sanitizeText('a\x00b\x1Fc')).toBe('abc');
    });
    it('trunca a maxLen', () => {
      expect(sanitizeText('a'.repeat(300), 100).length).toBe(100);
    });
  });

  describe('validatePrice', () => {
    it('acepta precios válidos', () => {
      expect(validatePrice(99.99)).toBe(99.99);
      expect(validatePrice('450')).toBe(450);
    });
    it('rechaza negativos y NaN', () => {
      expect(validatePrice(-1)).toBeNull();
      expect(validatePrice(NaN)).toBeNull();
      expect(validatePrice('abc')).toBeNull();
    });
    it('redondea a 2 decimales', () => {
      expect(validatePrice(99.999)).toBe(100);
      expect(validatePrice(99.994)).toBe(99.99);
    });
  });

  describe('validateProposal', () => {
    it('devuelve objeto sanitizado para datos válidos', () => {
      const r = validateProposal({
        flight_link: 'https://skyscanner.com',
        price: 299,
        destination: 'Bangkok',
        dates: '1-15 Mar',
      });
      expect(r).toEqual({
        flight_link: 'https://skyscanner.com',
        price: 299,
        destination: 'Bangkok',
        dates: '1-15 Mar',
      });
    });
    it('devuelve null para URL inválida', () => {
      expect(validateProposal({
        flight_link: 'javascript:evil()',
        price: 100,
        destination: 'Paris',
      })).toBeNull();
    });
    it('devuelve null para precio inválido', () => {
      expect(validateProposal({
        flight_link: 'https://example.com',
        price: -50,
        destination: 'Paris',
      })).toBeNull();
    });
  });
});
