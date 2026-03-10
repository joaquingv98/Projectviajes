import { useState, useEffect } from 'react';
import { supabase, Tournament } from '../lib/supabase';
import { isBot } from '../lib/mobile';
import { Play, Copy, Check, Loader2, CheckCircle2, Clock } from 'lucide-react';

interface LobbyScreenProps {
  tournament: Tournament;
  currentUser: string | null;
  onStart: () => void;
}

export default function LobbyScreen({ tournament, currentUser, onStart }: LobbyScreenProps) {
  const [starting, setStarting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState<string[]>([]);

  const hasBots = tournament.participants.some(p => isBot(p));
  const totalParticipants = tournament.participants.length;
  const allJoined = hasBots
    ? true
    : connectedUsers.length >= totalParticipants;

  useEffect(() => {
    if (!currentUser || hasBots) return;

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
  }, [tournament.id, currentUser, hasBots]);

  const shareUrl = `${window.location.origin}${window.location.pathname}#${tournament.id}`;

  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
    } catch {
      const input = document.getElementById('lobby-url-input') as HTMLInputElement;
      if (input) { input.select(); document.execCommand('copy'); }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleStart = async () => {
    setStarting(true);
    await onStart();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#001B44] via-[#002855] to-[#003366] flex items-center justify-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-2xl">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3">Sala de espera</h1>
          <p className="text-xl text-blue-200">
            Que todos abran el enlace y elijan su nombre antes de empezar
          </p>
        </div>

        {/* Contador */}
        <div className={`rounded-2xl p-5 mb-6 border text-center transition-all ${
          allJoined
            ? 'bg-green-500/10 border-green-400/40'
            : 'bg-white/5 border-white/10'
        }`}>
          <div className={`text-4xl font-extrabold mb-1 ${allJoined ? 'text-green-400' : 'text-white'}`}>
            {connectedUsers.length} / {totalParticipants}
          </div>
          <div className={`text-sm font-medium ${allJoined ? 'text-green-300' : 'text-blue-200'}`}>
            {allJoined ? '¡Todos listos! Puedes empezar el sorteo' : 'participantes conectados'}
          </div>
        </div>

        {/* Lista de participantes */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
          <div className="grid grid-cols-2 gap-3">
            {tournament.participants.map((name) => {
              const hasJoined = hasBots || connectedUsers.includes(name);
              const isMe = name === currentUser;
              const isBotPlayer = isBot(name);
              return (
                <div
                  key={name}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                    hasJoined
                      ? isMe
                        ? 'bg-blue-500/20 border-blue-400/50'
                        : 'bg-green-500/10 border-green-400/30'
                      : 'bg-white/3 border-white/10 opacity-50'
                  }`}
                >
                  {hasJoined
                    ? <CheckCircle2 className={`w-5 h-5 flex-shrink-0 ${isMe ? 'text-blue-400' : 'text-green-400'}`} />
                    : <Clock className="w-5 h-5 flex-shrink-0 text-white/30 animate-pulse" />
                  }
                  <span className={`font-medium text-sm truncate ${
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
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6">
          <p className="text-blue-300 text-xs font-bold uppercase tracking-widest mb-3">
            Comparte este enlace
          </p>
          <div className="flex gap-3">
            <input
              id="lobby-url-input"
              readOnly
              value={shareUrl}
              onClick={e => (e.target as HTMLInputElement).select()}
              className="flex-1 bg-black/30 border border-white/20 rounded-lg px-3 py-2 text-white text-sm font-mono cursor-text focus:outline-none"
            />
            <button
              onClick={handleCopy}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                copied
                  ? 'bg-green-500/20 border border-green-400/50 text-green-300'
                  : 'bg-blue-500/30 border border-blue-400/50 text-white hover:bg-blue-500/50'
              }`}
            >
              {copied ? <><Check className="w-4 h-4" /> Copiado</> : <><Copy className="w-4 h-4" /> Copiar</>}
            </button>
          </div>
        </div>

        {/* Botón inicio */}
        {starting ? (
          <div className="flex items-center justify-center gap-3 text-blue-300 text-xl py-4">
            <Loader2 className="w-7 h-7 animate-spin" />
            Sorteando emparejamientos...
          </div>
        ) : (
          <div>
            <button
              onClick={handleStart}
              disabled={!allJoined}
              className={`w-full py-5 font-extrabold text-xl rounded-2xl transition-all flex items-center justify-center gap-3 ${
                allJoined
                  ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black hover:scale-[1.02] hover:shadow-2xl hover:shadow-yellow-500/40 cursor-pointer'
                  : 'bg-white/10 text-white/30 cursor-not-allowed'
              }`}
            >
              <Play className={`w-7 h-7 fill-current ${!allJoined ? 'opacity-30' : ''}`} />
              {allJoined ? '¡Comenzar sorteo!' : hasBots ? '¡Comenzar sorteo!' : `Esperando a ${totalParticipants - connectedUsers.length} más...`}
            </button>
            {!allJoined && (
              <p className="text-center text-white/30 text-sm mt-3">
                El botón se activará cuando todos hayan elegido su nombre
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
