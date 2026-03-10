/** Prefijo de los jugadores bot en modo solo móvil */
export const BOT_PREFIX = 'Oponente ';

const SOLO_BOTS_KEY = 'soloModeBots_';

export function isBot(name: string, tournamentId?: string): boolean {
  if (name.startsWith(BOT_PREFIX)) return true;
  if (tournamentId && typeof sessionStorage !== 'undefined') {
    try {
      const stored = sessionStorage.getItem(SOLO_BOTS_KEY + tournamentId);
      if (stored) {
        const bots: string[] = JSON.parse(stored);
        return bots.includes(name);
      }
    } catch { /* ignore */ }
  }
  return false;
}

export function setSoloModeBots(tournamentId: string, botNames: string[]) {
  try {
    sessionStorage.setItem(SOLO_BOTS_KEY + tournamentId, JSON.stringify(botNames));
  } catch { /* ignore */ }
}

export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    return (
      window.innerWidth < 768 ||
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)
    );
  } catch {
    return window.innerWidth < 768;
  }
}

/** Genera nombres de bots: Oponente 1, Oponente 2, ... */
export function getBotNames(count: number): string[] {
  return Array.from({ length: count }, (_, i) => `${BOT_PREFIX}${i + 1}`);
}

/** Destinos para propuestas mock de bots */
const MOCK_DESTINOS = [
  'Bangkok, Tailandia', 'Tokio, Japón', 'París, Francia', 'Barcelona, España',
  'Lisboa, Portugal', 'Roma, Italia', 'Londres, Reino Unido', 'Dubái, Emiratos Árabes',
  'Nueva York, EE.UU.', 'Buenos Aires, Argentina', 'Miami, EE.UU.', 'Santorini, Grecia',
  'Islandia', 'Croacia', 'Ámsterdam', 'Berlín, Alemania', 'Praga, República Checa',
];

export function generateMockProposal(playerName: string): {
  flight_link: string;
  price: number;
  destination: string;
  dates: string;
} {
  const dest = MOCK_DESTINOS[Math.floor(Math.random() * MOCK_DESTINOS.length)];
  const basePrice = [299, 349, 399, 450, 520, 599, 699, 799][Math.floor(Math.random() * 8)];
  const price = basePrice + Math.floor(Math.random() * 80);
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre'];
  const m1 = months[Math.floor(Math.random() * months.length)];
  const m2 = months[(months.indexOf(m1) + 1) % months.length] || m1;
  const d1 = 5 + Math.floor(Math.random() * 20);
  const d2 = d1 + 4 + Math.floor(Math.random() * 5);
  return {
    flight_link: 'https://www.skyscanner.com',
    price,
    destination: dest,
    dates: `${d1} ${m1.slice(0, 3)} → ${d2} ${m2.slice(0, 3)}`,
  };
}
