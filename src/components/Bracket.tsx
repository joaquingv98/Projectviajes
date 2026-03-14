import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { toast } from 'sonner';
import { Match, Proposal, Vote as VoteType, TIEBREAKER_PHASES } from '../lib/supabase';
import { Trophy, Clock, CheckCircle, Vote, Play, Eye, Flame, UserPlus, Copy, Check } from 'lucide-react';
import { isMobileDevice } from '../lib/mobile';
const ROUND_ORDER: Record<string, number> = { quarterfinals: 1, semifinals: 2, final: 3 };

interface BracketProps {
  matches: Match[];
  proposals: Proposal[];
  votes: VoteType[];
  tournamentSize: number;
  currentUser: string | null;
  tournamentId: string;
  tournamentName?: string;
  onMatchClick: (match: Match) => void;
  onStartMatch: (match: Match) => void;
  onAddVoters: (names: string[]) => Promise<{ added: number; total: number }>;
  recentWinner?: { name: string; round: string } | null;
}

function getMatchResult(match: Match, proposals: Proposal[], votes: VoteType[]): string | null {
  if (match.status !== 'completed' || !match.winner_name) return null;
  const matchProposals = proposals.filter(p => p.match_id === match.id);
  if (matchProposals.length < 2) return null;
  const matchVotes = votes.filter(v => v.match_id === match.id);
  const p1Proposal = matchProposals.find(p => p.player_name === match.player1_name);
  const p2Proposal = matchProposals.find(p => p.player_name === (match.player2_name ?? ''));
  if (!p1Proposal || !p2Proposal) return null;
  const p1Count = matchVotes.filter(v => v.proposal_id === p1Proposal.id).length;
  const p2Count = matchVotes.filter(v => v.proposal_id === p2Proposal.id).length;
  const [winnerVotes, loserVotes] = match.winner_name === match.player1_name
    ? [p1Count, p2Count]
    : [p2Count, p1Count];
  return `${winnerVotes}-${loserVotes}`;
}

function Bracket({
  matches,
  proposals,
  votes,
  tournamentSize,
  currentUser,
  tournamentId,
  tournamentName,
  onMatchClick,
  onStartMatch,
  onAddVoters: _onAddVoters,
  recentWinner,
}: BracketProps) {
  void tournamentId; // prop de API; uso futuro
  void tournamentSize; // el layout se adapta a las rondas existentes
  const [starting, setStarting] = useState(false);

  const [advanceNotif, setAdvanceNotif] = useState<{ name: string; toRound: string } | null>(null);
  const [notifVisible, setNotifVisible] = useState(false);
  const [highlightedNames, setHighlightedNames] = useState<Set<string>>(new Set());
  const [showAddVoters, setShowAddVoters] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // Disparar animación cuando llegamos al bracket con un ganador reciente
  useEffect(() => {
    if (!recentWinner) return;
    const { name, round } = recentWinner;
    setAdvanceNotif({ name, toRound: round });
    setNotifVisible(true);
    setHighlightedNames(new Set([name]));

    setTimeout(() => setNotifVisible(false), 3200);
    setTimeout(() => setAdvanceNotif(null), 3700);
    setTimeout(() => {
      setHighlightedNames(prev => {
        const next = new Set(prev);
        next.delete(name);
        return next;
      });
    }, 7000);
  }, [recentWinner]);

  const quarterMatches = useMemo(
    () => matches.filter(m => m.round === 'quarterfinals'),
    [matches]
  );
  const semiMatches = useMemo(
    () => matches.filter(m => m.round === 'semifinals'),
    [matches]
  );
  const finalMatch = useMemo(
    () => matches.find(m => m.round === 'final'),
    [matches]
  );

  const hasActiveMatch = useMemo(
    () => matches.some(m =>
      m.status === 'proposing' || m.status === 'voting' ||
      TIEBREAKER_PHASES.includes(m.status as typeof TIEBREAKER_PHASES[number])
    ),
    [matches]
  );

  const votingMatch = useMemo(
    () => matches.find(m => m.status === 'voting'),
    [matches]
  );
  const tiebreakerMatch = useMemo(
    () => matches.find(m => TIEBREAKER_PHASES.includes(m.status as typeof TIEBREAKER_PHASES[number])),
    [matches]
  );
  const proposingMatch = useMemo(
    () => matches.find(m => m.status === 'proposing'),
    [matches]
  );

  const nextMatch = useMemo(() => {
    if (hasActiveMatch) return undefined;
    return matches
      .filter(m => m.status === 'pending' && m.player1_name !== 'TBD' && m.player2_name && m.player2_name !== 'TBD')
      .sort((a, b) => (ROUND_ORDER[a.round] - ROUND_ORDER[b.round]) || (a.match_number - b.match_number))[0];
  }, [matches, hasActiveMatch]);

  const handleStart = useCallback(async () => {
    if (!nextMatch) return;
    setStarting(true);
    await onStartMatch(nextMatch);
    setStarting(false);
  }, [nextMatch, onStartMatch]);

  const voterLink = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}#${tournamentId}?voter=1`
    : '';

  const handleCopyVoterLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(voterLink);
      setLinkCopied(true);
      toast.success('Enlace copiado. Compártelo con tus amigos.');
      setTimeout(() => setLinkCopied(false), 2500);
    } catch {
      toast.error('No se pudo copiar. Comparte el enlace manualmente.');
    }
  }, [voterLink]);
  const isMobile = isMobileDevice();

  const getActionButtonStyle = useCallback((
    variant: 'gold' | 'green' | 'orange' | 'ghost',
    disabled = false
  ): React.CSSProperties => {
    const variants = {
      gold: {
        background: 'linear-gradient(135deg, rgba(255,191,36,0.96) 0%, rgba(255,140,55,0.96) 100%)',
        color: '#08111f',
        border: '1px solid rgba(255,226,148,0.35)',
        boxShadow: '0 16px 38px rgba(255,176,32,0.25), inset 0 1px 0 rgba(255,255,255,0.35)',
      },
      green: {
        background: 'linear-gradient(135deg, rgba(34,197,94,0.96) 0%, rgba(20,184,166,0.96) 100%)',
        color: '#f8fbff',
        border: '1px solid rgba(134,239,172,0.28)',
        boxShadow: '0 16px 38px rgba(16,185,129,0.24), inset 0 1px 0 rgba(255,255,255,0.22)',
      },
      orange: {
        background: 'linear-gradient(135deg, rgba(249,115,22,0.96) 0%, rgba(239,68,68,0.96) 100%)',
        color: '#fff7ed',
        border: '1px solid rgba(253,186,116,0.28)',
        boxShadow: '0 16px 38px rgba(249,115,22,0.24), inset 0 1px 0 rgba(255,255,255,0.18)',
      },
      ghost: {
        background: 'linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))',
        color: '#eff6ff',
        border: '1px solid rgba(148,163,184,0.26)',
        boxShadow: '0 14px 32px rgba(2,8,23,0.22), inset 0 1px 0 rgba(255,255,255,0.08)',
      },
    } as const;

    return {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      minHeight: variant === 'gold' ? 62 : 54,
      padding: isMobile ? '13px 18px' : '14px 22px',
      borderRadius: 18,
      fontWeight: variant === 'gold' ? 900 : 800,
      fontSize: variant === 'gold' ? (isMobile ? 16 : 18) : (isMobile ? 14 : 15),
      letterSpacing: 0.2,
      cursor: disabled ? 'wait' : 'pointer',
      transition: 'transform 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease',
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
      width: isMobile ? '100%' : (variant === 'gold' ? 'min(100%, 640px)' : 'auto'),
      maxWidth: '100%',
      opacity: disabled ? 0.55 : 1,
      ...variants[variant],
    };
  }, [isMobile]);

  const isMyMatch = useCallback((match: Match) =>
    currentUser &&
    (match.player1_name === currentUser || match.player2_name === currentUser),
  [currentUser]);

  const getStatusIcon = useCallback((match: Match) => {
    if (match.status === 'completed') return <CheckCircle style={{ width: 20, height: 20, color: '#4ade80' }} />;
    if (match.status === 'voting' || match.status === 'proposing') return <Clock style={{ width: 20, height: 20, color: '#facc15' }} />;
    return null;
  }, []);

  const renderCard = useCallback((match: Match) => {
    const isActive = match.status !== 'pending' && match.status !== 'completed';
    const isCompleted = match.status === 'completed';
    const isPending = match.status === 'pending';
    const mine = isMyMatch(match);
    const resultText = isCompleted ? getMatchResult(match, proposals, votes) : null;

    // ¿Alguno de los jugadores de esta tarjeta acaba de avanzar aquí?
    const p1Highlighted = match.player1_name && highlightedNames.has(match.player1_name);
    const p2Highlighted = match.player2_name && highlightedNames.has(match.player2_name);
    const anyHighlighted = p1Highlighted || p2Highlighted;

    const cardStyle: React.CSSProperties = {
      position: 'relative',
      width: '100%',
      minWidth: 180,
      borderRadius: 16,
      border: anyHighlighted
        ? '2px solid #facc15'
        : mine && isActive
        ? '2px solid #facc15'
        : isActive
        ? '2px solid #60a5fa'
        : isCompleted
        ? '2px solid rgba(255,255,255,0.25)'
        : '2px solid rgba(255,255,255,0.1)',
      background: anyHighlighted
        ? 'rgba(250,204,21,0.12)'
        : mine && isActive
        ? 'rgba(250,204,21,0.1)'
        : isActive
        ? 'rgba(59,130,246,0.2)'
        : 'rgba(255,255,255,0.05)',
      opacity: isPending && !anyHighlighted ? 0.5 : 1,
      cursor: isPending ? 'default' : 'pointer',
      transition: 'transform 0.2s, box-shadow 0.2s',
      animation: anyHighlighted ? 'goldPulse 1.2s ease-in-out infinite' : undefined,
      boxShadow: anyHighlighted
        ? '0 0 40px rgba(250,204,21,0.6)'
        : mine && isActive
        ? '0 0 30px rgba(250,204,21,0.3)'
        : isActive
        ? '0 0 30px rgba(96,165,250,0.3)'
        : 'none',
      padding: '16px 20px',
    };

    const nameStyle = (isWinner: boolean, name?: string | null): React.CSSProperties => ({
      fontSize: 'clamp(16px, 4vw, 22px)',
      fontWeight: 700,
      color: name && highlightedNames.has(name) ? '#facc15'
           : isWinner ? '#4ade80'
           : 'white',
      maxWidth: '80%',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      textShadow: name && highlightedNames.has(name) ? '0 0 20px rgba(250,204,21,0.8)' : 'none',
      transition: 'color 0.4s, text-shadow 0.4s',
      // Deslizamiento desde la izquierda cuando el nombre aparece por primera vez en este slot
      animation: name && highlightedNames.has(name) ? 'nameSlideIn 0.6s cubic-bezier(0.34,1.56,0.64,1)' : undefined,
    });

    const statusText = isPending ? 'pendiente' : isCompleted ? 'completado' : isActive ? 'en curso' : '';
    const ariaLabel = `Partido: ${match.player1_name} vs ${match.player2_name || 'Por definir'}, ${statusText}`;

    return (
      <button
        type="button"
        key={match.id}
        onClick={() => !isPending && onMatchClick(match)}
        style={cardStyle}
        aria-label={ariaLabel}
        onMouseEnter={e => { if (isActive) (e.currentTarget as HTMLElement).style.transform = 'scale(1.03)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
      >
        {mine && isActive && (
          <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#facc15', color: '#000', fontSize: 11, fontWeight: 800, padding: '2px 10px', borderRadius: 20, whiteSpace: 'nowrap' }}>
            ★ Tu partido
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 16, borderBottom: match.winner_name === match.player1_name ? '2px solid rgba(74,222,128,0.5)' : '2px solid rgba(255,255,255,0.1)' }}>
          <span style={nameStyle(match.winner_name === match.player1_name, match.player1_name)}>{match.player1_name}</span>
          {match.winner_name === match.player1_name && <Trophy style={{ width: 22, height: 22, color: '#facc15', flexShrink: 0 }} />}
        </div>

        <div style={{ textAlign: 'center', padding: '12px 0', fontSize: 14, fontWeight: 900, color: 'rgba(147,197,253,0.6)', letterSpacing: 6 }}>
          {resultText ? (
            <span style={{ color: '#4ade80', letterSpacing: 2 }}>{resultText}</span>
          ) : (
            'VS'
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, borderTop: match.winner_name === match.player2_name ? '2px solid rgba(74,222,128,0.5)' : '2px solid rgba(255,255,255,0.1)' }}>
          <span style={nameStyle(match.winner_name === match.player2_name && !!match.player2_name, match.player2_name)}>
            <span style={{ color: match.player2_name && highlightedNames.has(match.player2_name) ? '#facc15' : match.player2_name ? (match.winner_name === match.player2_name ? '#4ade80' : 'white') : 'rgba(255,255,255,0.3)', fontStyle: match.player2_name ? 'normal' : 'italic' }}>
              {match.player2_name || 'Por definir'}
            </span>
          </span>
          {match.winner_name === match.player2_name && <Trophy style={{ width: 22, height: 22, color: '#facc15', flexShrink: 0 }} />}
        </div>

        <div style={{ position: 'absolute', top: 12, right: 12 }}>{getStatusIcon(match)}</div>
      </button>
    );
  }, [onMatchClick, highlightedNames, isMyMatch, getStatusIcon, proposals, votes]);

  const labelStyle = (color = '#93c5fd'): React.CSSProperties => ({
    textAlign: 'center',
    fontSize: 'clamp(11px, 2.5vw, 13px)',
    fontWeight: 700,
    color,
    textTransform: 'uppercase',
    letterSpacing: 3,
    marginBottom: 16,
  });

  return (
    <div style={{ minHeight: '100vh', background: 'transparent', display: 'flex', flexDirection: 'column', padding: '20px 16px', paddingBottom: 80 }}>
      <style>{`
        @media (max-width: 768px) {
          .bracket-mobile { flex-direction: column !important; align-items: stretch !important; width: 100% !important; gap: 20px !important; }
          .bracket-mobile .bracket-round { flex: none !important; width: 100% !important; min-width: 0 !important; }
          .bracket-mobile .bracket-connectors { display: none !important; }
          .bracket-mobile .bracket-card { min-width: auto !important; }
          .bracket-header-mobile { padding: 0 8px 16px !important; margin-bottom: 16px !important; }
          .share-box-mobile { padding: 10px 14px !important; }
          .bracket-card button { padding: 14px 18px !important; min-height: 48px; font-size: 1rem; }
        }
      `}</style>
      {/* Cabecera */}
      <div className="bracket-header-mobile" style={{ textAlign: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 'clamp(28px, 6vw, 48px)', fontWeight: 800, color: 'white', marginBottom: 8, letterSpacing: 1 }}>
          {tournamentName && tournamentName !== 'Travel Tournament' ? tournamentName : 'Cuadro del Torneo'}
        </h1>
        {currentUser && (
          <p style={{ fontSize: 18, color: '#93c5fd', marginBottom: 16 }}>
            Jugando como: <span style={{ color: '#facc15', fontWeight: 700 }}>{currentUser}</span>
          </p>
        )}

        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'stretch',
          gap: 12,
          margin: '0 auto 18px',
          width: '100%',
          maxWidth: isMobile ? 560 : 920,
        }}>
          {nextMatch && (
            <button
              type="button"
              onClick={handleStart}
              disabled={starting}
              aria-label={starting ? 'Iniciando partido' : `Comenzar partido ${nextMatch.player1_name} vs ${nextMatch.player2_name}`}
              style={getActionButtonStyle('gold', starting)}
            >
              <Play style={{ width: 18, height: 18 }} />
              {starting ? 'Iniciando partido...' : `Comenzar ${nextMatch.player1_name} vs ${nextMatch.player2_name}`}
            </button>
          )}

          {votingMatch && (
            <button
              type="button"
              onClick={() => onMatchClick(votingMatch)}
              aria-label={`Ir a votar en partido ${votingMatch.player1_name} vs ${votingMatch.player2_name}`}
              style={getActionButtonStyle('green')}
            >
              <Vote style={{ width: 18, height: 18 }} />
              Votar ahora: {votingMatch.player1_name} vs {votingMatch.player2_name}
            </button>
          )}

          {tiebreakerMatch && !votingMatch && (
            <button
              type="button"
              onClick={() => onMatchClick(tiebreakerMatch)}
              aria-label={`Ir a minuto de oro entre ${tiebreakerMatch.player1_name} y ${tiebreakerMatch.player2_name}`}
              style={getActionButtonStyle('orange')}
            >
              <Flame style={{ width: 18, height: 18 }} />
              Minuto de oro / Tiebreak
            </button>
          )}

          {proposingMatch && (() => {
            const isMine = currentUser && (proposingMatch.player1_name === currentUser || proposingMatch.player2_name === currentUser);
            if (!isMine) return null;
            return (
              <button
                type="button"
                onClick={() => onMatchClick(proposingMatch)}
                aria-label="Ir a mi partido para enviar propuesta"
                style={getActionButtonStyle('gold')}
              >
                <Play style={{ width: 18, height: 18 }} />
                Ir a mi partido
              </button>
            );
          })()}

          {proposingMatch && !(currentUser && (proposingMatch.player1_name === currentUser || proposingMatch.player2_name === currentUser)) && (
            <button
              type="button"
              onClick={() => onMatchClick(proposingMatch)}
              aria-label="Ver partido en curso"
              style={getActionButtonStyle('ghost')}
            >
              <Eye style={{ width: 18, height: 18 }} />
              Ver partido en curso
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowAddVoters(true)}
            aria-label="Anadir amigos para las votaciones"
            style={getActionButtonStyle('ghost')}
          >
            <UserPlus style={{ width: 18, height: 18 }} />
            Anadir amigos para votar
          </button>
        </div>
      </div>

      {showAddVoters && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1100,
          background: 'rgba(2, 8, 23, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
        }}>
          <div style={{
            width: 'min(100%, 560px)',
            borderRadius: 24,
            border: '1px solid rgba(148,163,184,0.25)',
            background: 'linear-gradient(180deg, rgba(15,23,42,0.98), rgba(2,6,23,0.96))',
            boxShadow: '0 28px 80px rgba(2,8,23,0.48)',
            padding: isMobile ? 20 : 28,
          }}>
            <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: 16, marginBottom: 18 }}>
              <div>
                <h2 style={{ margin: 0, color: '#f8fbff', fontSize: isMobile ? 22 : 28, fontWeight: 800 }}>
                  Anadir amigos para votar
                </h2>
                <p style={{ margin: '8px 0 0', color: 'rgba(191,219,254,0.9)', fontSize: 14, lineHeight: 1.5 }}>
                  Comparte este enlace. Tus amigos lo abriran, escribiran su nombre y quedaran registrados como votantes (no competiran en el bracket).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddVoters(false)}
                aria-label="Cerrar anadir amigos"
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: '#cbd5e1',
                  fontSize: 28,
                  lineHeight: 1,
                  cursor: 'pointer',
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 16 }}>
              <input
                type="text"
                readOnly
                value={voterLink}
                aria-label="Enlace para votantes"
                style={{
                  flex: 1,
                  borderRadius: 12,
                  border: '1px solid rgba(96,165,250,0.24)',
                  background: 'rgba(255,255,255,0.06)',
                  color: '#e2e8f0',
                  padding: '12px 16px',
                  fontSize: 14,
                  fontFamily: 'monospace',
                }}
              />
              <button
                type="button"
                onClick={handleCopyVoterLink}
                aria-label="Copiar enlace"
                style={{
                  ...getActionButtonStyle('green', false),
                  padding: '12px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {linkCopied ? <Check style={{ width: 18, height: 18 }} /> : <Copy style={{ width: 18, height: 18 }} />}
                {linkCopied ? 'Copiado' : 'Copiar'}
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowAddVoters(false)}
              style={{ ...getActionButtonStyle('ghost', false), marginTop: 18 }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Overlay animación de avance */}
      {advanceNotif && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
          transition: 'opacity 0.5s',
          opacity: notifVisible ? 1 : 0,
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(0,20,60,0.97) 0%, rgba(0,40,90,0.97) 100%)',
            border: '2px solid #facc15',
            borderRadius: 28,
            padding: '48px 72px',
            textAlign: 'center',
            boxShadow: '0 0 80px rgba(250,204,21,0.5), 0 0 200px rgba(250,204,21,0.2)',
            animation: notifVisible ? 'advanceIn 0.4s cubic-bezier(0.34,1.56,0.64,1)' : undefined,
          }}>
            <div style={{ fontSize: 64, marginBottom: 8 }}>🏆</div>
            <div style={{
              fontSize: 48, fontWeight: 900, color: '#facc15',
              letterSpacing: 1, marginBottom: 12,
              textShadow: '0 0 30px rgba(250,204,21,0.8)',
            }}>
              {advanceNotif.name}
            </div>
            <div style={{ fontSize: 22, color: 'white', fontWeight: 600, marginBottom: 4 }}>
              avanza a
            </div>
            <div style={{
              fontSize: 30, fontWeight: 800,
              color: '#93c5fd', letterSpacing: 3, textTransform: 'uppercase',
            }}>
              {advanceNotif.toRound}
            </div>
          </div>
        </div>
      )}

      {/* Bracket */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 0, overflow: 'auto' }}>
        <div className="bracket-mobile" style={{ display: 'flex', alignItems: 'center', width: '100%', gap: 0, minWidth: 'min-content', justifyContent: 'center' }}>

          {quarterMatches.length > 0 && (
            <div className="bracket-round" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 200 }}>
              <div style={labelStyle()}>Cuartos de Final</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {quarterMatches.map(m => <div key={m.id} className="bracket-card">{renderCard(m)}</div>)}
              </div>
            </div>
          )}

          {quarterMatches.length > 0 && (
            <div className="bracket-connectors" style={{ width: 48, display: 'flex', flexDirection: 'column', justifyContent: 'space-around', alignSelf: 'stretch', marginTop: 40, paddingTop: 60, paddingBottom: 20 }}>
              <div style={{ height: 80, borderTop: '2px solid rgba(255,255,255,0.25)', borderRight: '2px solid rgba(255,255,255,0.25)', borderRadius: '0 8px 0 0' }} />
              <div style={{ height: 80, borderRight: '2px solid rgba(255,255,255,0.25)', borderBottom: '2px solid rgba(255,255,255,0.25)', borderRadius: '0 0 8px 0' }} />
              <div style={{ height: 80, borderTop: '2px solid rgba(255,255,255,0.25)', borderRight: '2px solid rgba(255,255,255,0.25)', borderRadius: '0 8px 0 0' }} />
              <div style={{ height: 80, borderRight: '2px solid rgba(255,255,255,0.25)', borderBottom: '2px solid rgba(255,255,255,0.25)', borderRadius: '0 0 8px 0' }} />
            </div>
          )}

          {semiMatches.length > 0 && (
            <div className="bracket-round" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 200 }}>
              <div style={labelStyle()}>Semifinales</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {semiMatches.map(m => <div key={m.id} className="bracket-card">{renderCard(m)}</div>)}
              </div>
            </div>
          )}

          {semiMatches.length > 0 && (
            <div className="bracket-connectors" style={{ width: 48, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignSelf: 'stretch', marginTop: 40 }}>
              <div style={{ height: 90, borderTop: '2px solid rgba(255,255,255,0.25)', borderRight: '2px solid rgba(255,255,255,0.25)', borderRadius: '0 8px 0 0' }} />
              <div style={{ height: 90, borderRight: '2px solid rgba(255,255,255,0.25)', borderBottom: '2px solid rgba(255,255,255,0.25)', borderRadius: '0 0 8px 0' }} />
            </div>
          )}

          {finalMatch && (
            <div className="bracket-round" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 200 }}>
              <div style={labelStyle('#facc15')}>✦ Final ✦</div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <div style={{ width: '100%' }}>{renderCard(finalMatch)}</div>
                <Trophy style={{ width: 40, height: 40, color: '#facc15', flexShrink: 0, filter: 'drop-shadow(0 0 16px rgba(250,204,21,0.7))' }} />
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default memo(Bracket);
