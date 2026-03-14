import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase, Tournament } from '../lib/supabase';
import { isBot } from '../lib/mobile';
import { getTournamentVoters } from '../lib/tournamentRoles';
import { Play, Copy, Check, Loader2, CheckCircle2, Clock } from 'lucide-react';

interface LobbyScreenProps {
  tournament: Tournament;
  currentUser: string | null;
  onStart: () => void | Promise<void>;
}

export default function LobbyScreen({ tournament, currentUser, onStart }: LobbyScreenProps) {
  const [starting, setStarting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState<string[]>([]);

  const voters = getTournamentVoters(tournament);
  const totalParticipants = voters.length;
  const humanVoters = voters.filter(name => !isBot(name, tournament.id));
  const joinedCount = voters.filter(name => isBot(name, tournament.id) || connectedUsers.includes(name)).length;
  const allJoined = connectedUsers.length >= humanVoters.length;

  useEffect(() => {
    if (!currentUser) return;

    // Canal de presencia compartido con UserIdentification
    const channel = supabase.channel(`lobby-${tournament.id}`);

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<{ name: string }>();
        const present = Object.values(state).flat().map((p) => p.name);
        setConnectedUsers([...new Set(present)]);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ name: currentUser });
        }
      });

    return () => { channel.unsubscribe(); };
  }, [tournament.id, currentUser]);

  const shareUrl = `${window.location.origin}${window.location.pathname}#${tournament.id}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {
      const input = document.getElementById('lobby-url-input') as HTMLInputElement;
      if (input) input.select();
      toast('Selecciona y copia manualmente (Ctrl+C)', { duration: 3000 });
      setCopied(false);
    });
  };

  const handleStart = async () => {
    setStarting(true);
    try {
      await onStart();
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-2xl">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight">
            {tournament.name && tournament.name !== 'Travel Tournament' ? tournament.name : 'Sala de espera'}
          </h1>
          <p className="text-xl text-slate-300/90">
            Que todos los votantes abran el enlace y elijan su nombre antes de empezar
          </p>
        </div>

        {/* Contador */}
        <div className={`rounded-2xl p-5 mb-6 border text-center transition-all card-modern ${
          allJoined
            ? 'border-emerald-500/30 bg-emerald-500/5'
            : ''
        }`}>
          <div className={`text-4xl font-extrabold mb-1 ${allJoined ? 'text-emerald-400' : 'text-white'}`}>
            {joinedCount} / {totalParticipants}
          </div>
          <div className={`text-sm font-medium ${allJoined ? 'text-emerald-300/90' : 'text-slate-400'}`}>
            {allJoined ? '¡Todos listos! Puedes empezar el sorteo' : 'participantes conectados'}
          </div>
        </div>

        {/* Lista de participantes */}
        <div className="card-modern p-6 mb-6">
          <div className="grid grid-cols-2 gap-3">
            {voters.map((name) => {
              const hasJoined = isBot(name, tournament.id) || connectedUsers.includes(name);
              const isMe = name === currentUser;
              const isBotPlayer = isBot(name, tournament.id);
              return (
                <div
                  key={name}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all card-modern-inner ${
                    hasJoined
                      ? isMe
                        ? 'border-blue-400/40 bg-blue-500/10'
                        : 'border-emerald-500/30 bg-emerald-500/5'
                      : 'border-white/5 bg-white/[0.02] opacity-50'
                  }`}
                >
                  {hasJoined
                    ? <CheckCircle2 className={`w-5 h-5 flex-shrink-0 ${isMe ? 'text-blue-400' : 'text-green-400'}`} />
                    : <Clock className="w-5 h-5 flex-shrink-0 text-white/30 animate-pulse" />
                  }
                  <span className={`font-medium text-sm truncate flex-1 ${
                    hasJoined ? (isMe ? 'text-blue-200' : isBotPlayer ? 'text-white/70' : 'text-white') : 'text-white/30'
                  }`}>
                    {name}{isMe ? ' (tú)' : isBotPlayer ? ' 🤖' : ''}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Enlace */}
        <div className="card-modern p-5 mb-6">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-3">
            Comparte este enlace
          </p>
          <div className="flex gap-3">
            <input
              id="lobby-url-input"
              readOnly
              value={shareUrl}
              onClick={e => (e.target as HTMLInputElement).select()}
              aria-label="Enlace del lobby para compartir"
              className="input-modern flex-1 px-3 py-2 text-white text-sm font-mono cursor-text"
            />
            <button
              type="button"
              onClick={handleCopy}
              aria-label={copied ? 'Enlace copiado' : 'Copiar enlace del lobby'}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                copied
                  ? 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-300'
                  : 'btn-secondary'
              }`}
            >
              {copied ? <><Check className="w-4 h-4" /> Copiado</> : <><Copy className="w-4 h-4" /> Copiar</>}
            </button>
          </div>
        </div>

        {/* Botón inicio */}
        {starting ? (
          <div className="flex items-center justify-center gap-3 text-slate-400 text-xl py-4">
            <Loader2 className="w-7 h-7 animate-spin" />
            Sorteando emparejamientos...
          </div>
        ) : (
          <div>
            <button
              type="button"
              onClick={handleStart}
              disabled={!allJoined}
              aria-label={allJoined ? 'Comenzar sorteo de emparejamientos' : 'Esperando a que todos se unan'}
              className={`w-full py-5 font-extrabold text-xl rounded-2xl transition-all flex items-center justify-center gap-3 ${
                allJoined
                  ? 'btn-primary'
                  : 'bg-white/5 text-white/30 cursor-not-allowed border border-white/5'
              }`}
            >
              <Play className={`w-7 h-7 fill-current ${!allJoined ? 'opacity-30' : ''}`} />
              {allJoined ? '¡Comenzar sorteo!' : `Esperando a ${Math.max(0, humanVoters.length - connectedUsers.length)} más...`}
            </button>
            {!allJoined && (
              <p className="text-center text-slate-500 text-sm mt-3">
                El botón se activará cuando todos los votantes hayan elegido su nombre
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
