import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { UserCircle2, Loader2, Lock } from 'lucide-react';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UserIdentificationProps {
  tournamentId: string;
  onIdentify: (name: string, tournamentId: string) => void;
}

export default function UserIdentification({ tournamentId, onIdentify }: UserIdentificationProps) {
  const [participants, setParticipants] = useState<string[]>([]);
  const [takenNames, setTakenNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState<string | null>(null);
  const [error, setError] = useState('');
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    // Cargar participantes del torneo
    const load = async () => {
      const { data, error } = await supabase
        .from('tournaments')
        .select('participants')
        .eq('id', tournamentId)
        .maybeSingle();

      if (error || !data) {
        console.error('Error cargando torneo:', error, 'ID:', tournamentId);
        setError('No se encontró el torneo. Asegúrate de haber copiado el enlace completo.');
      } else {
        setParticipants(data.participants);
      }
      setLoading(false);
    };
    load();

    // Suscribirse al canal de presencia del lobby para ver quién ya ha elegido nombre
    const channel = supabase.channel(`lobby-${tournamentId}`);
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<{ name: string }>();
        const present = Object.values(state).flat().map((p) => p.name);
        setTakenNames(present);
      })
      .subscribe();

    channelRef.current = channel;
    return () => { channel.unsubscribe(); };
  }, [tournamentId]);

  const handleSelect = async (name: string) => {
    setSelecting(name);
    // Unirse al canal de presencia con el nombre elegido
    // (los demás lo verán como "ocupado" en tiempo real)
    if (channelRef.current) {
      await channelRef.current.track({ name });
    }
    onIdentify(name, tournamentId);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-lg">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl card-modern-inner mb-6">
            <UserCircle2 className="w-12 h-12 text-blue-400" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">¿Quién eres tú?</h1>
          <p className="text-lg text-slate-300/90">Selecciona tu nombre para unirte al torneo</p>
        </div>

        <div className="card-modern p-8">
          {loading ? (
            <div className="flex items-center justify-center py-12 gap-3">
              <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
              <span className="text-blue-200 text-lg">Cargando torneo...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-400 text-lg mb-6">{error}</p>
              <button
                type="button"
                onClick={() => { window.location.hash = ''; window.location.reload(); }}
                aria-label="Volver al inicio"
                className="btn-secondary px-6 py-3"
              >
                Volver al inicio
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {participants.map((name) => {
                const isTaken = takenNames.includes(name);
                const isSelecting = selecting === name;

                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => !isTaken && !selecting && handleSelect(name)}
                    disabled={isTaken || !!selecting}
                    aria-label={isTaken ? `${name} (ocupado)` : `Seleccionar ${name}`}
                    className={`w-full py-4 px-6 border rounded-xl text-lg font-semibold transition-all text-left flex items-center gap-3 ${
                      isTaken
                        ? 'card-modern-inner border-white/5 text-slate-500 cursor-not-allowed'
                        : selecting
                        ? 'card-modern-inner text-slate-400 cursor-wait'
                        : 'card-modern-inner hover:border-blue-400/40 hover:bg-blue-500/10 text-white hover:scale-[1.01] cursor-pointer'
                    }`}
                  >
                    <span className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                      isTaken ? 'bg-white/5 text-slate-500' : 'bg-blue-500/20 text-blue-300'
                    }`}>
                      {isSelecting
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : isTaken
                        ? <Lock className="w-4 h-4" />
                        : name.charAt(0).toUpperCase()
                      }
                    </span>
                    <span className="flex-1">{name}</span>
                    {isTaken && (
                      <span className="text-xs text-white/30 font-normal">Ocupado</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
