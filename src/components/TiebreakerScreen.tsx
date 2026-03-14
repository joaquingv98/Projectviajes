import { useState, useEffect } from 'react';
import { Match, Proposal, Vote } from '../lib/supabase';
import { isBot } from '../lib/mobile';
import { RotateCcw, Clock } from 'lucide-react';

interface TiebreakerScreenProps {
  match: Match;
  proposals: Proposal[];
  votes: Vote[];
  participants: string[];
  currentUser: string | null;
  onAdvancePhase: () => void;
  onVote: (proposalId: string) => void;
  onEnsureBotsVoted: () => void;
  onBack: () => void;
}

export default function TiebreakerScreen({
  match,
  proposals,
  votes,
  participants,
  currentUser,
  onAdvancePhase,
  onVote,
  onEnsureBotsVoted,
  onBack,
}: TiebreakerScreenProps) {
  const [timeRemaining, setTimeRemaining] = useState(0);

  // Los bots votan automáticamente en la fase tiebreak_vote
  useEffect(() => {
    if (match.status === 'tiebreak_vote') onEnsureBotsVoted();
  }, [match.id, match.status, onEnsureBotsVoted]);

  // Roulette animation
  const [rouletteDisplay, setRouletteDisplay] = useState('');
  const [rouletteFinished, setRouletteFinished] = useState(false);

  const phase = match.status; // 'tiebreak_d1' | 'tiebreak_d2' | 'tiebreak_vote' | 'tiebreak_roulette'
  const p1 = match.player1_name;
  const p2 = match.player2_name ?? '';

  const p1Proposal = proposals.find(p => p.player_name === p1);
  const p2Proposal = proposals.find(p => p.player_name === p2);
  const myVote = currentUser ? votes.find(v => v.voter_name === currentUser) : null;

  useEffect(() => {
    if (!match.voting_ends_at) return;
    const calc = () =>
      setTimeRemaining(Math.max(0, Math.floor((new Date(match.voting_ends_at!).getTime() - Date.now()) / 1000)));
    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [match.voting_ends_at]);

  // Auto-avanzar fase de defensa cuando el defensor es un bot
  useEffect(() => {
    if (phase !== 'tiebreak_d1' && phase !== 'tiebreak_d2') return;
    const defendingPlayer = phase === 'tiebreak_d1' ? p1 : p2;
    if (!isBot(defendingPlayer, match.tournament_id)) return;
    const t = setTimeout(() => onAdvancePhase(), 2500);
    return () => clearTimeout(t);
  }, [phase, p1, p2, match.tournament_id, onAdvancePhase]);

  // Reset roulette state when phase changes to roulette
  useEffect(() => {
    if (phase !== 'tiebreak_roulette') return;
    setRouletteFinished(false);
    setRouletteDisplay('');
    if (!match.winner_name) return;

    const names = [p1, p2];
    let count = 0;
    let delay = 80;
    const spin = () => {
      setRouletteDisplay(names[count % 2]);
      count++;
      if (count < 22) {
        delay = Math.min(delay * 1.18, 550);
        setTimeout(spin, delay);
      } else {
        setRouletteDisplay(match.winner_name!);
        setTimeout(() => setRouletteFinished(true), 700);
      }
    };
    const t = setTimeout(spin, 500);
    return () => clearTimeout(t);
  }, [phase, p1, p2, match.winner_name]);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  // ─────────────────────────────────────────
  // FASES DE DEFENSA  (tiebreak_d1 / d2)
  // ─────────────────────────────────────────
  if (phase === 'tiebreak_d1' || phase === 'tiebreak_d2') {
    const defendingPlayer = phase === 'tiebreak_d1' ? p1 : p2;
    const isMyTurn = currentUser === defendingPlayer;

    return (
      <div className="min-h-screen p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <button type="button" onClick={onBack} aria-label="Volver al cuadro del torneo" className="text-blue-300 hover:text-white transition-colors">
              ← Volver al cuadro
            </button>
            <button
              type="button"
              onClick={onAdvancePhase}
              aria-label="Saltar minuto de defensa"
              className="btn-secondary px-4 py-2 text-sm flex items-center gap-2"
            >
              ⏭ Saltar minuto de defensa
            </button>
          </div>

          {/* Cabecera */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 bg-yellow-500/20 border border-yellow-400/50 rounded-2xl px-8 py-4 mb-6">
              <span className="text-4xl">⚡</span>
              <div>
                <div className="text-yellow-300 font-black text-xl tracking-widest uppercase">
                  Minuto de Oro
                </div>
                <div className="text-white/70 text-sm">¡Empate! Cada jugador defiende su viaje verbalmente</div>
              </div>
            </div>

            <h1 className="text-3xl font-bold text-white mb-4">
              Turno de <span className="text-yellow-400">{defendingPlayer}</span>
            </h1>

            {/* Cuenta atrás */}
            <div
              className={`text-8xl font-black mb-3 transition-colors ${
                timeRemaining < 15 ? 'text-red-400 animate-pulse' : 'text-yellow-400'
              }`}
            >
              {formatTime(timeRemaining)}
            </div>
            <div className="text-white/40 text-sm uppercase tracking-widest mb-8">
              {isMyTurn ? 'es tu turno — habla ahora' : 'escucha atentamente'}
            </div>
          </div>

          {/* Área central */}
          {isMyTurn ? (
            <div className="bg-yellow-500/10 border-2 border-yellow-400/40 rounded-xl p-8 mb-6 text-center">
              <div className="text-5xl mb-4">🎙️</div>
              <div className="text-yellow-300 font-bold text-xl mb-3">
                ¡Convence a todos de que tu viaje es el mejor!
              </div>
              <p className="text-white/60 mb-6">
                Tienes {formatTime(timeRemaining)} para argumentar el precio, las fechas y la experiencia.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                <button
                  type="button"
                  onClick={onAdvancePhase}
                  aria-label="He terminado mi defensa"
                  className="btn-primary px-8 py-4 text-lg"
                >
                  He terminado mi defensa ➤
                </button>
                <button
                  type="button"
                  onClick={onAdvancePhase}
                  aria-label="Saltar defensa"
                  className="btn-secondary px-6 py-3 text-sm"
                >
                  ⏭ Saltar defensa
                </button>
              </div>
            </div>
          ) : (
            <div className="card-modern p-10 mb-6 text-center">
              <div className="text-5xl mb-4">👂</div>
              <div className="text-white text-2xl font-bold mb-2">
                {defendingPlayer} está defendiendo su viaje
              </div>
              <p className="text-slate-400">Escucha su argumento...</p>
              {phase === 'tiebreak_d2' && (
                <p className="text-white/40 text-sm mt-2">
                  Fase 2 de 2 — después vendrá la segunda votación
                </p>
              )}
              <button
                type="button"
                onClick={onAdvancePhase}
                aria-label="Saltar defensa"
                className="mt-4 px-6 py-3 bg-white/10 border border-white/30 text-white/80 text-sm font-semibold rounded-xl hover:bg-white/20 hover:text-white transition-all"
              >
                ⏭ Saltar defensa
              </button>
            </div>
          )}

          {/* Mini tarjetas de propuestas */}
          <div className="grid grid-cols-2 gap-4">
            {[p1Proposal, p2Proposal].filter(Boolean).map(p => p && (
              <div key={p.id} className="card-modern-inner rounded-xl p-4 opacity-60">
                <div className="text-white font-bold">{p.player_name}</div>
                {p.destination && <div className="text-blue-300 text-xl font-bold">{p.destination}</div>}
                <div className="text-white/60 text-lg">{p.price} €</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────
  // SEGUNDA VOTACIÓN (tiebreak_vote)
  // ─────────────────────────────────────────
  if (phase === 'tiebreak_vote') {
    const votingTimeExpired = match.voting_ends_at
      ? Date.now() >= new Date(match.voting_ends_at).getTime()
      : false;
    const everyoneVoted = votes.length >= participants.length;
    const canResolve = everyoneVoted || votingTimeExpired;
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-6xl mx-auto">
          <button type="button" onClick={onBack} aria-label="Volver al cuadro del torneo" className="text-blue-300 hover:text-white mb-6 transition-colors">
            ← Volver al cuadro
          </button>

          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 bg-orange-500/20 border border-orange-400/50 rounded-2xl px-8 py-4 mb-4">
              <RotateCcw className="w-8 h-8 text-orange-400" />
              <div>
                <div className="text-orange-300 font-black text-xl tracking-widest uppercase">
                  Segunda Votación
                </div>
                <div className="text-white/70 text-sm">Voto directo — ¡haz clic para votar!</div>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">{p1} vs {p2}</h1>
            <p className="text-blue-200">
              {votingTimeExpired
                ? '⏱ Tiempo agotado — resuelve para continuar'
                : everyoneVoted
                ? '¡Todos han votado!'
                : myVote
                ? 'Voto registrado — puedes cambiar hasta que todos voten'
                : '¡Elige ahora!'}
            </p>
            {canResolve && (
              <button
                type="button"
                onClick={onAdvancePhase}
                className="mt-4 btn-primary px-6 py-3"
              >
                Resolver y continuar →
              </button>
            )}
          </div>

          {/* Tarjetas de voto directo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {[p1Proposal, p2Proposal].filter(Boolean).map(p => p && (
              <div
                key={p.id}
                className={`bg-white/5 border rounded-xl p-6 transition-all ${
                  myVote?.proposal_id === p.id
                    ? 'border-green-400 bg-green-500/10 shadow-lg shadow-green-500/30'
                    : 'border-white/20'
                }`}
              >
                <div className="text-white font-bold text-2xl mb-1">{p.player_name}</div>
                {p.destination && <div className="text-blue-300 text-2xl font-bold mb-1">{p.destination}</div>}
                {p.dates && <div className="text-blue-200 text-sm mb-2">{p.dates}</div>}
                <div className="text-white text-3xl font-bold mb-4">{p.price} €</div>
                <button
                  type="button"
                  onClick={() => onVote(p.id)}
                  disabled={everyoneVoted}
                  aria-label={myVote?.proposal_id === p.id ? 'Tu voto' : `Votar por ${p.destination || p.player_name}`}
                  className={`w-full py-3 rounded-lg font-bold transition-all ${
                    myVote?.proposal_id === p.id
                      ? 'bg-green-500 text-white'
                      : everyoneVoted
                      ? 'bg-white/10 text-white/40 cursor-not-allowed'
                      : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:shadow-xl hover:shadow-orange-500/50 hover:scale-[1.02] cursor-pointer'
                  }`}
                >
                  {myVote?.proposal_id === p.id
                    ? '✓ Tu voto'
                    : everyoneVoted
                    ? 'Ya has votado'
                    : 'Votar por este'}
                </button>
              </div>
            ))}
          </div>

          {/* Estado de votos */}
          <div className="card-modern p-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {participants.map(name => {
                const voted = votes.some(v => v.voter_name === name);
                return (
                  <div
                    key={name}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                      voted ? 'bg-green-500/20 border border-green-400/50' : 'bg-white/5 border border-white/10'
                    }`}
                  >
                    {voted
                      ? <span className="text-green-400 text-sm">✅</span>
                      : <Clock className="w-4 h-4 text-white/40 flex-shrink-0" />
                    }
                    <span className={`text-sm ${name === currentUser ? 'text-blue-300 font-bold' : 'text-white'}`}>
                      {name}{name === currentUser ? ' (tú)' : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────
  // RULETA (tiebreak_roulette)
  // ─────────────────────────────────────────
  if (phase === 'tiebreak_roulette') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center max-w-2xl mx-auto">
          <div className="text-7xl mb-6">🎰</div>
          <div className="text-white/60 text-lg font-bold uppercase tracking-widest mb-2" style={{ letterSpacing: 8 }}>
            Ruleta del Destino
          </div>
          <p className="text-blue-300 text-xl mb-12">
            ¡Segundo empate! La suerte tiene la última palabra...
          </p>

          <div
            className={`text-7xl font-black transition-all duration-300 min-h-[100px] flex items-center justify-center ${
              rouletteFinished ? 'text-yellow-400 scale-110 animate-pulse' : 'text-white'
            }`}
            style={{
              textShadow: rouletteFinished
                ? '0 0 60px rgba(250,204,21,0.9), 0 0 120px rgba(250,204,21,0.4)'
                : 'none',
            }}
          >
            {rouletteDisplay || '...'}
          </div>

          {rouletteFinished && (
            <div className="mt-10 animate-fadeIn">
              <div className="text-5xl mb-4">🏆</div>
              <div className="text-2xl text-white font-bold">
                <span className="text-yellow-400">{rouletteDisplay}</span> pasa de ronda
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
