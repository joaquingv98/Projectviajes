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
    <div className="min-h-screen bg-gradient-to-br from-[#001B44] via-[#002855] to-[#003366] flex items-center justify-center p-8">
      <div className="w-full max-w-lg">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-blue-500/20 rounded-full mb-6">
            <UserCircle2 className="w-12 h-12 text-blue-400" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">¿Quién eres tú?</h1>
          <p className="text-lg text-blue-200">Selecciona tu nombre para unirte al torneo</p>
        </div>

        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
          {loading ? (
            <div className="flex items-center justify-center py-12 gap-3">
              <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
              <span className="text-blue-200 text-lg">Cargando torneo...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-400 text-lg mb-6">{error}</p>
              <button
                onClick={() => { window.location.hash = ''; window.location.reload(); }}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold transition-all"
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
                    onClick={() => !isTaken && !selecting && handleSelect(name)}
                    disabled={isTaken || !!selecting}
                    className={`w-full py-4 px-6 border rounded-xl text-lg font-semibold transition-all text-left flex items-center gap-3 ${
                      isTaken
                        ? 'bg-white/3 border-white/10 text-white/30 cursor-not-allowed'
                        : selecting
                        ? 'bg-white/5 border-white/10 text-white/50 cursor-wait'
                        : 'bg-white/10 hover:bg-blue-500 border-white/20 hover:border-blue-400 text-white hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/30 cursor-pointer'
                    }`}
                  >
                    <span className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                      isTaken ? 'bg-white/5 text-white/20' : 'bg-blue-500/30 text-blue-300'
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
