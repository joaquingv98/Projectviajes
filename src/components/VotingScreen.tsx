import { useState, useEffect } from 'react';
import { Match, Proposal, Vote } from '../lib/supabase';
import { ExternalLink, Clock, CheckCircle2, Lock } from 'lucide-react';
import { isMobileDevice } from '../lib/mobile';

interface VotingScreenProps {
  match: Match;
  proposals: Proposal[];
  votes: Vote[];
  participants: string[];
  currentUser: string | null;
  onConfirmVote: (proposalId: string) => void;
  onEnsureBotsVoted: () => void;
  onBack: () => void;
}

export default function VotingScreen({
  match,
  proposals,
  votes,
  participants,
  currentUser,
  onConfirmVote,
  onEnsureBotsVoted,
  onBack,
}: VotingScreenProps) {
  const [timeRemaining, setTimeRemaining] = useState(0);
  // Selección provisional (local) — no escribe en BD hasta confirmar
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null);

  // Los bots votan automáticamente al abrir la pantalla
  useEffect(() => {
    if (match.status === 'voting') onEnsureBotsVoted();
  }, [match.id, match.status, onEnsureBotsVoted]);

  useEffect(() => {
    if (!match.voting_ends_at) return;
    const calculateTimeRemaining = () => {
      const endTime = new Date(match.voting_ends_at!).getTime();
      setTimeRemaining(Math.max(0, Math.floor((endTime - Date.now()) / 1000)));
    };
    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);
    return () => clearInterval(interval);
  }, [match.voting_ends_at]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const player1Proposal = proposals.find(p => p.player_name === match.player1_name);
  const player2Proposal = proposals.find(p => p.player_name === match.player2_name);
  const player1Votes = player1Proposal ? votes.filter(v => v.proposal_id === player1Proposal.id).length : 0;
  const player2Votes = player2Proposal ? votes.filter(v => v.proposal_id === player2Proposal.id).length : 0;

  // Voto confirmado = escrito en BD
  const myConfirmedVote = currentUser ? votes.find(v => v.voter_name === currentUser) : null;
  const canSelect = match.status === 'voting' && timeRemaining > 0 && !myConfirmedVote;
  const everyoneVoted = votes.length >= participants.length;

  const handleConfirm = () => {
    if (!selectedProposalId || myConfirmedVote) return;
    onConfirmVote(selectedProposalId);
  };

  const renderProposalCard = (proposal: Proposal | undefined, voteCount: number) => {
    if (!proposal) return null;

    const isConfirmedVote = myConfirmedVote?.proposal_id === proposal.id;
    const isSelected = selectedProposalId === proposal.id;
    const isPlayer = proposal.player_name === currentUser;

    let borderClass = 'border-white/20';
    let bgClass = 'bg-white/5';
    if (isConfirmedVote) { borderClass = 'border-green-400'; bgClass = 'bg-green-500/10'; }
    else if (isSelected) { borderClass = 'border-yellow-400'; bgClass = 'bg-yellow-500/10'; }

    return (
      <div className={`relative backdrop-blur-sm rounded-xl border transition-all ${bgClass} ${borderClass} ${isConfirmedVote ? 'shadow-lg shadow-green-500/30' : isSelected ? 'shadow-lg shadow-yellow-500/30' : ''} ${isMobileDevice() ? 'p-4' : 'p-6'}`}>
        {isConfirmedVote && (
          <div className="absolute top-4 right-4">
            <Lock className="w-5 h-5 text-green-400" />
          </div>
        )}
        {isSelected && !isConfirmedVote && (
          <div className="absolute top-4 right-4 bg-yellow-500/30 text-yellow-300 text-xs font-bold px-2 py-1 rounded-full">
            Seleccionado
          </div>
        )}
        {isPlayer && (
          <div className="absolute top-4 left-4 bg-blue-500/30 text-blue-300 text-xs font-bold px-2 py-1 rounded-full">
            Tu propuesta
          </div>
        )}

        <div className={`${isPlayer ? 'mt-6' : ''} ${isMobileDevice() ? 'mb-4' : 'mb-6'}`}>
          <h3 className={`font-bold text-white mb-1 ${isMobileDevice() ? 'text-lg' : 'text-2xl'}`}>{proposal.player_name}</h3>
          {proposal.destination && (
            <p className={`font-bold text-blue-300 mb-1 ${isMobileDevice() ? 'text-xl' : 'text-3xl mb-2'}`}>{proposal.destination}</p>
          )}
          {proposal.dates && (
            <p className={`text-blue-200 ${isMobileDevice() ? 'mb-2 text-sm' : 'mb-4'}`}>{proposal.dates}</p>
          )}
          <p className={`font-bold text-white ${isMobileDevice() ? 'text-2xl' : 'text-4xl'}`}>{proposal.price} €</p>
        </div>

        <a
          href={proposal.flight_link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-blue-300 hover:text-blue-200 mb-6 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Ver enlace del vuelo
        </a>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/60">Votos confirmados</span>
            <span className="text-2xl font-bold text-white">{voteCount}</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
              style={{
                width: `${player1Votes + player2Votes > 0
                  ? (voteCount / (player1Votes + player2Votes)) * 100
                  : 0}%`,
              }}
            />
          </div>
        </div>

        {/* Botón de selección provisional */}
        <button
          onClick={() => canSelect && setSelectedProposalId(proposal.id)}
          disabled={!!myConfirmedVote}
          className={`w-full py-3 rounded-lg font-bold transition-all ${
            isConfirmedVote
              ? 'bg-green-500 text-white cursor-default'
              : isSelected
              ? 'bg-yellow-500 text-black'
              : canSelect
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-xl hover:shadow-blue-500/50 hover:scale-[1.02]'
              : 'bg-white/10 text-white/40 cursor-not-allowed'
          }`}
        >
          {isConfirmedVote
            ? '🔒 Voto confirmado'
            : myConfirmedVote
            ? 'Ya has confirmado tu voto'
            : isSelected
            ? '✓ Seleccionado'
            : 'Seleccionar este viaje'}
        </button>
      </div>
    );
  };

  const selectedProposal = proposals.find(p => p.id === selectedProposalId);

  const isMobile = isMobileDevice();
  return (
    <div className={`min-h-screen ${isMobile ? 'p-4 pb-28' : 'p-6'}`}>
      <div className="max-w-6xl mx-auto">
        <button onClick={onBack} className={`text-blue-300 hover:text-white transition-colors ${isMobile ? 'mb-4' : 'mb-6'}`}>
          ← Volver al cuadro
        </button>

        {/* Encabezado */}
        <div className={`text-center ${isMobile ? 'mb-4' : 'mb-8'}`}>
          {everyoneVoted ? (
            <div className="inline-flex items-center justify-center gap-3 bg-green-500/20 backdrop-blur-sm rounded-2xl px-8 py-4 border border-green-400/50 mb-4 animate-pulse">
              <CheckCircle2 className="w-8 h-8 text-green-400" />
              <div>
                <div className="text-sm text-green-300 mb-1">Votación cerrada</div>
                <div className="text-2xl font-bold text-green-400">¡Todos han confirmado!</div>
                <div className="text-sm text-green-300/70 mt-1">Calculando ganador...</div>
              </div>
            </div>
          ) : (
            <div className="inline-flex items-center justify-center gap-3 bg-white/5 backdrop-blur-sm rounded-2xl px-8 py-4 border border-white/20 mb-4">
              <Clock className="w-8 h-8 text-blue-400" />
              <div>
                <div className="text-sm text-blue-200 mb-1">Tiempo restante</div>
                <div className={`text-5xl font-bold ${timeRemaining < 60 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                  {formatTime(timeRemaining)}
                </div>
              </div>
            </div>
          )}
          <h1 className="text-3xl font-bold text-white mb-2">
            {match.player1_name} vs {match.player2_name}
          </h1>
          <p className="text-blue-200">
            {everyoneVoted
              ? `Ganador: ${player1Votes >= player2Votes ? match.player1_name : match.player2_name} 🏆`
              : !myConfirmedVote
              ? '¡Selecciona tu viaje favorito y confirma tu voto!'
              : 'Voto confirmado — esperando al resto...'}
          </p>
        </div>

        {/* Tarjetas de votación */}
        <div className={`grid grid-cols-1 md:grid-cols-2 ${isMobile ? 'gap-4 mb-4' : 'gap-8 mb-6'}`}>
          {renderProposalCard(player1Proposal, player1Votes)}
          {renderProposalCard(player2Proposal, player2Votes)}
        </div>

        {/* Confirmar voto - compacto en móvil, integrado */}
        {selectedProposalId && !myConfirmedVote && (
          <div className={`fixed left-1/2 -translate-x-1/2 z-[100] ${isMobileDevice() ? 'bottom-20' : 'bottom-8'}`}>
            <div className={`flex items-center gap-3 backdrop-blur-md bg-[#001B44]/95 border border-yellow-400/40 rounded-2xl shadow-xl ${isMobileDevice() ? 'px-4 py-3' : 'px-6 py-4'}`}>
              <div className="min-w-0 flex-1">
                <div className="text-yellow-300 text-xs font-semibold truncate">
                  {selectedProposal?.destination || selectedProposal?.player_name}
                </div>
                {!isMobileDevice() && (
                  <div className="text-white/60 text-xs mt-0.5">Puedes cambiar hasta confirmar</div>
                )}
              </div>
              <button
                onClick={handleConfirm}
                className={`flex-shrink-0 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl transition-all active:scale-95 ${
                  isMobileDevice() ? 'px-5 py-2.5 text-sm' : 'px-6 py-3 text-base'
                }`}
              >
                ✓ Confirmar
              </button>
            </div>
          </div>
        )}

        {/* Estado de votaciones */}
        <div className={`bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 ${isMobile ? 'p-4' : 'p-6'}`}>
          <h3 className={`font-bold text-white ${isMobile ? 'text-base mb-3' : 'text-lg mb-4'}`}>Estado de votaciones</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {participants.map((participant) => {
              const hasConfirmed = votes.some(v => v.voter_name === participant);
              const isMe = participant === currentUser;
              return (
                <div
                  key={participant}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                    hasConfirmed
                      ? 'bg-green-500/20 border border-green-400/50'
                      : 'bg-white/5 border border-white/10'
                  }`}
                >
                  {hasConfirmed
                    ? <Lock className="w-4 h-4 text-green-400 flex-shrink-0" />
                    : <Clock className="w-4 h-4 text-white/40 flex-shrink-0" />
                  }
                  <span className={`text-sm ${isMe ? 'text-blue-300 font-bold' : 'text-white'}`}>
                    {participant}{isMe ? ' (tú)' : ''}
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
