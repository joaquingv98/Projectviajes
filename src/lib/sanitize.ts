/**
 * Utilidades de sanitización y validación de inputs para prevenir XSS e inyección.
 */

const MAX_URL_LENGTH = 2000;
const MAX_TEXT_LENGTH = 200;
const MAX_PRICE = 999999;
const MIN_PRICE = 0;

function stripControlChars(value: string): string {
  return Array.from(value)
    .filter((char) => {
      const code = char.charCodeAt(0);
      return code >= 32 && code !== 127;
    })
    .join('');
}

/**
 * Sanitiza una URL: solo permite http/https, longitud máxima.
 * @returns URL válida o null si no es válida
 */
export function sanitizeUrl(url: string): string | null {
  const trimmed = stripControlChars(url.trim());
  if (trimmed.length === 0 || trimmed.length > MAX_URL_LENGTH) return null;

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    return trimmed;
  } catch {
    return null;
  }
}

/**
 * Sanitiza texto: trim, elimina caracteres de control, limita longitud.
 */
export function sanitizeText(text: string, maxLen = MAX_TEXT_LENGTH): string {
  return stripControlChars(text.trim()).slice(0, maxLen);
}

/**
 * Valida y redondea precio: >= 0, <= MAX_PRICE, 2 decimales.
 * @returns número válido o null
 */
export function validatePrice(value: number | string): number | null {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  if (Number.isNaN(n) || n < MIN_PRICE || n > MAX_PRICE) return null;
  return Math.round(n * 100) / 100;
}

/**
 * Valida datos de propuesta antes de enviar.
 */
export function validateProposal(data: {
  flight_link: string;
  price: number | string;
  destination?: string;
  dates?: string;
}): { flight_link: string; price: number; destination: string | null; dates: string | null } | null {
  const url = sanitizeUrl(data.flight_link);
  if (!url) return null;

  const price = validatePrice(data.price);
  if (price === null) return null;

  const destination = data.destination != null
    ? sanitizeText(data.destination, 150)
    : null;

  const dates = data.dates != null
    ? sanitizeText(data.dates, 100)
    : null;

  return { flight_link: url, price, destination: destination || null, dates: dates || null };
}
