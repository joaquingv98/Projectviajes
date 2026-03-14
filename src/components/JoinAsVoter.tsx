import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { claimParticipant, saveParticipantIdentity } from '../lib/participantIdentity';
import { dedupeNames } from '../lib/tournamentRoles';
import { UserPlus, Loader2 } from 'lucide-react';

interface JoinAsVoterProps {
  tournamentId: string;
  onJoined: (name: string, tournamentId: string, token: string) => void;
}

export default function JoinAsVoter({ tournamentId, onJoined }: JoinAsVoterProps) {
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Escribe tu nombre');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      let tournament: { participants?: string[]; voters?: string[] } | null = null;
      const withVoters = await supabase
        .from('tournaments')
        .select('id, participants, voters')
        .eq('id', tournamentId)
        .maybeSingle();

      if (withVoters.error) {
        const withoutVoters = await supabase
          .from('tournaments')
          .select('id, participants')
          .eq('id', tournamentId)
          .maybeSingle();
        tournament = withoutVoters.data;
        if (!tournament) {
          setError('No se encontró el torneo. Comprueba el enlace.');
          setSubmitting(false);
          return;
        }
      } else {
        tournament = withVoters.data;
      }

      if (!tournament) {
        setError('No se encontró el torneo. Comprueba el enlace.');
        setSubmitting(false);
        return;
      }

      const hasVotersColumn = 'voters' in tournament && Array.isArray(tournament.voters);
      const currentList = hasVotersColumn && (tournament.voters ?? []).length > 0
        ? (tournament.voters ?? [])
        : (tournament.participants ?? []);
      const nextList = dedupeNames([...currentList, trimmed]);

      const updatePayload = hasVotersColumn
        ? { voters: nextList }
        : { participants: nextList };

      const { error: updateError } = await supabase
        .from('tournaments')
        .update(updatePayload)
        .eq('id', tournamentId);

      if (updateError) {
        setError('No se pudo registrar. Inténtalo de nuevo.');
        setSubmitting(false);
        return;
      }

      const token = await claimParticipant(tournamentId, trimmed);
      saveParticipantIdentity({ tournamentId, name: trimmed, token });
      onJoined(trimmed, tournamentId, token);
    } catch (err) {
      console.error('Error al unirse como votante:', err);
      setError('Ese nombre ya está en uso. Prueba con otro.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl card-modern-inner mb-6">
            <UserPlus className="w-12 h-12 text-blue-400" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">Unirse como votante</h1>
          <p className="text-lg text-slate-300/90">
            Escribe tu nombre para votar en los partidos. No competirás en el bracket, solo participarás en las votaciones.
          </p>
        </div>

        <div className="card-modern p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="voter-name" className="block text-slate-300 text-sm font-medium mb-2">
                Tu nombre
              </label>
              <input
                id="voter-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Marta, Pablo..."
                disabled={submitting}
                className="input-modern w-full px-4 py-3 text-white placeholder-white/40"
                autoFocus
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className={`w-full py-4 rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition-all ${
                submitting || !name.trim()
                  ? 'bg-white/5 text-white/40 cursor-not-allowed border border-white/5'
                  : 'btn-primary'
              }`}
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
              {submitting ? 'Uniendo...' : 'Unirme como votante'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
