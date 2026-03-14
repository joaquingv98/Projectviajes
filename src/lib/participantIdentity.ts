import { supabase } from './supabase';

const STORAGE_KEY = 'tournament_identity';

export interface ParticipantIdentity {
  tournamentId: string;
  name: string;
  token: string;
  botTokens?: Record<string, string>;
}

function readStoredIdentity(): ParticipantIdentity | null {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ParticipantIdentity;
  } catch {
    return null;
  }
}

export function getParticipantIdentity(tournamentId?: string): ParticipantIdentity | null {
  const identity = readStoredIdentity();
  if (!identity) return null;
  if (tournamentId && identity.tournamentId !== tournamentId) return null;
  return identity;
}

export function saveParticipantIdentity(identity: ParticipantIdentity) {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
}

export function clearParticipantIdentity() {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.removeItem(STORAGE_KEY);
}

export function getParticipantToken(tournamentId: string, participantName: string): string | null {
  const identity = getParticipantIdentity(tournamentId);
  if (!identity) return null;
  if (identity.name === participantName) return identity.token;
  return identity.botTokens?.[participantName] ?? null;
}

export async function claimParticipant(tournamentId: string, participantName: string): Promise<string> {
  const { data, error } = await supabase.rpc('claim_participant', {
    p_tournament_id: tournamentId,
    p_participant_name: participantName,
  });

  if (error || typeof data !== 'string' || !data) {
    throw error ?? new Error('No se pudo reclamar el participante');
  }

  return data;
}

export async function claimSoloIdentity(
  tournamentId: string,
  currentUser: string,
  botNames: string[]
): Promise<ParticipantIdentity> {
  const token = await claimParticipant(tournamentId, currentUser);
  const botTokens: Record<string, string> = {};

  for (const botName of botNames) {
    botTokens[botName] = await claimParticipant(tournamentId, botName);
  }

  const identity: ParticipantIdentity = {
    tournamentId,
    name: currentUser,
    token,
    botTokens,
  };

  saveParticipantIdentity(identity);
  return identity;
}
