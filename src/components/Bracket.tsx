import { useState, useEffect } from 'react';
import { Match } from '../lib/supabase';
import { Trophy, Clock, CheckCircle, Copy, Check } from 'lucide-react';

interface BracketProps {
  matches: Match[];
  tournamentSize: number;
  currentUser: string | null;
  tournamentId: string;
  onMatchClick: (match: Match) => void;
  onStartMatch: (match: Match) => void;
  recentWinner?: { name: string; round: string } | null;
}

export default function Bracket({
  matches,
  tournamentSize,
  currentUser,
  tournamentId,
  onMatchClick,
  onStartMatch,
  recentWinner,
}: BracketProps) {
  const [copied, setCopied] = useState(false);
  const [starting, setStarting] = useState(false);

  const [advanceNotif, setAdvanceNotif] = useState<{ name: string; toRound: string } | null>(null);
  const [notifVisible, setNotifVisible] = useState(false);
  const [highlightedNames, setHighlightedNames] = useState<Set<string>>(new Set());

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

  const quarterMatches = matches.filter(m => m.round === 'quarterfinals');
  const semiMatches = matches.filter(m => m.round === 'semifinals');
  const finalMatch = matches.find(m => m.round === 'final');

  const hasActiveMatch = matches.some(m => m.status === 'proposing' || m.status === 'voting');

  // Siguiente partido a jugar: primero en orden (cuartos < semis < final) con jugadores conocidos
  const roundOrder: Record<string, number> = { quarterfinals: 1, semifinals: 2, final: 3 };
  const nextMatch = !hasActiveMatch
    ? matches
        .filter(m => m.status === 'pending' && m.player1_name !== 'TBD' && m.player2_name && m.player2_name !== 'TBD')
        .sort((a, b) => (roundOrder[a.round] - roundOrder[b.round]) || (a.match_number - b.match_number))[0]
    : undefined;

  const handleStart = async () => {
    if (!nextMatch) return;
    setStarting(true);
    await onStartMatch(nextMatch);
    setStarting(false);
  };

  const shareUrl = `${window.location.origin}${window.location.pathname}#${tournamentId}`;

  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }).catch(() => {
        // Fallback: seleccionar el texto del input
        const input = document.getElementById('share-url-input') as HTMLInputElement;
        if (input) { input.select(); document.execCommand('copy'); }
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
    } catch {
      setCopied(false);
    }
  };

  const isMyMatch = (match: Match) =>
    currentUser &&
    (match.player1_name === currentUser || match.player2_name === currentUser);

  const getStatusIcon = (match: Match) => {
    if (match.status === 'completed') return <CheckCircle style={{ width: 20, height: 20, color: '#4ade80' }} />;
    if (match.status === 'voting' || match.status === 'proposing') return <Clock style={{ width: 20, height: 20, color: '#facc15' }} />;
    return null;
  };

  const renderCard = (match: Match) => {
    const isActive = match.status !== 'pending' && match.status !== 'completed';
    const isCompleted = match.status === 'completed';
    const isPending = match.status === 'pending';
    const mine = isMyMatch(match);

    // ¿Alguno de los jugadores de esta tarjeta acaba de avanzar aquí?
    const p1Highlighted = match.player1_name && highlightedNames.has(match.player1_name);
    const p2Highlighted = match.player2_name && highlightedNames.has(match.player2_name);
    const anyHighlighted = p1Highlighted || p2Highlighted;

    const cardStyle: React.CSSProperties = {
      position: 'relative',
      width: '100%',
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
      padding: '24px 28px',
    };

    const nameStyle = (isWinner: boolean, name?: string | null): React.CSSProperties => ({
      fontSize: 22,
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

    return (
      <button
        key={match.id}
        onClick={() => !isPending && onMatchClick(match)}
        style={cardStyle}
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

        <div style={{ textAlign: 'center', padding: '12px 0', fontSize: 14, fontWeight: 900, color: 'rgba(147,197,253,0.6)', letterSpacing: 6 }}>VS</div>

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
  };

  const labelStyle = (color = '#93c5fd'): React.CSSProperties => ({
    textAlign: 'center',
    fontSize: 13,
    fontWeight: 700,
    color,
    textTransform: 'uppercase',
    letterSpacing: 4,
    marginBottom: 24,
  });

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #001B44 0%, #002855 50%, #003366 100%)', display: 'flex', flexDirection: 'column', padding: '20px 16px', paddingBottom: 80 }}>
      <style>{`
        @media (max-width: 768px) {
          .bracket-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        }
      `}</style>
      {/* Cabecera */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 style={{ fontSize: 'clamp(28px, 6vw, 48px)', fontWeight: 800, color: 'white', marginBottom: 8, letterSpacing: 1 }}>
          Cuadro del Torneo
        </h1>
        {currentUser && (
          <p style={{ fontSize: 18, color: '#93c5fd', marginBottom: 16 }}>
            Jugando como: <span style={{ color: '#facc15', fontWeight: 700 }}>{currentUser}</span>
          </p>
        )}

        {/* Botón Comenzar siguiente partido */}
        {nextMatch && (
          <button
            onClick={handleStart}
            disabled={starting}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              background: starting ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #eab308, #ca8a04)',
              color: starting ? 'rgba(255,255,255,0.4)' : '#000',
              fontWeight: 800, fontSize: 18,
              padding: '14px 32px', borderRadius: 16, border: 'none',
              cursor: starting ? 'wait' : 'pointer', marginBottom: 20,
              boxShadow: starting ? 'none' : '0 0 30px rgba(234,179,8,0.5)',
              transition: 'all 0.2s',
            }}
          >
            {starting ? '⏳ Iniciando...' : `▶ Comenzar: ${nextMatch.player1_name} vs ${nextMatch.player2_name}`}
          </button>
        )}

        {/* Botón "Ir a mi partido" si hay un partido activo para este usuario */}
        {hasActiveMatch && (() => {
          const myMatch = matches.find(
            m => (m.player1_name === currentUser || m.player2_name === currentUser) &&
                 (m.status === 'proposing' || m.status === 'voting')
          );
          if (!myMatch) return null;
          return (
            <button
              onClick={() => onMatchClick(myMatch)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                background: 'linear-gradient(135deg, #eab308, #ca8a04)',
                color: '#000', fontWeight: 800, fontSize: 18,
                padding: '14px 32px', borderRadius: 16, border: 'none',
                cursor: 'pointer', marginBottom: 20,
                boxShadow: '0 0 30px rgba(234,179,8,0.5)',
              }}
            >
              ▶ Ir a mi partido
            </button>
          );
        })()}

        {/* Caja para compartir */}
        <div style={{
          display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 16, padding: '14px 20px', maxWidth: 520, width: '100%',
        }}>
          <span style={{ fontSize: 12, color: '#93c5fd', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2 }}>
            Comparte este enlace con tus amigos
          </span>
          <div style={{ display: 'flex', gap: 8, width: '100%', alignItems: 'center' }}>
            <input
              id="share-url-input"
              readOnly
              value={shareUrl}
              onClick={e => (e.target as HTMLInputElement).select()}
              style={{
                flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 8, padding: '8px 12px', color: 'white', fontSize: 13,
                fontFamily: 'monospace', cursor: 'text', outline: 'none',
              }}
            />
            <button
              onClick={handleCopy}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0,
                background: copied ? 'rgba(74,222,128,0.2)' : 'rgba(59,130,246,0.4)',
                border: `1px solid ${copied ? '#4ade80' : 'rgba(59,130,246,0.6)'}`,
                color: 'white', borderRadius: 8, padding: '8px 14px', cursor: 'pointer',
                fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
              }}
            >
              {copied
                ? <><Check style={{ width: 14, height: 14, color: '#4ade80' }} /> Copiado</>
                : <><Copy style={{ width: 14, height: 14 }} /> Copiar</>
              }
            </button>
          </div>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
            También puedes seleccionar y copiar el enlace manualmente
          </span>
        </div>
      </div>

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
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 0 }}>
        <div className="bracket-scroll" style={{ display: 'flex', alignItems: 'center', width: '100%', gap: 0, minWidth: 'min-content' }}>

          {tournamentSize === 8 && quarterMatches.length > 0 && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={labelStyle()}>Cuartos de Final</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {quarterMatches.map(m => <div key={m.id}>{renderCard(m)}</div>)}
              </div>
            </div>
          )}

          {tournamentSize === 8 && quarterMatches.length > 0 && (
            <div style={{ width: 48, display: 'flex', flexDirection: 'column', justifyContent: 'space-around', alignSelf: 'stretch', marginTop: 40, paddingTop: 60, paddingBottom: 20 }}>
              <div style={{ height: 80, borderTop: '2px solid rgba(255,255,255,0.25)', borderRight: '2px solid rgba(255,255,255,0.25)', borderRadius: '0 8px 0 0' }} />
              <div style={{ height: 80, borderRight: '2px solid rgba(255,255,255,0.25)', borderBottom: '2px solid rgba(255,255,255,0.25)', borderRadius: '0 0 8px 0' }} />
              <div style={{ height: 80, borderTop: '2px solid rgba(255,255,255,0.25)', borderRight: '2px solid rgba(255,255,255,0.25)', borderRadius: '0 8px 0 0' }} />
              <div style={{ height: 80, borderRight: '2px solid rgba(255,255,255,0.25)', borderBottom: '2px solid rgba(255,255,255,0.25)', borderRadius: '0 0 8px 0' }} />
            </div>
          )}

          {semiMatches.length > 0 && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={labelStyle()}>Semifinales</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
                {semiMatches.map(m => <div key={m.id}>{renderCard(m)}</div>)}
              </div>
            </div>
          )}

          {semiMatches.length > 0 && (
            <div style={{ width: 48, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignSelf: 'stretch', marginTop: 40 }}>
              <div style={{ height: 90, borderTop: '2px solid rgba(255,255,255,0.25)', borderRight: '2px solid rgba(255,255,255,0.25)', borderRadius: '0 8px 0 0' }} />
              <div style={{ height: 90, borderRight: '2px solid rgba(255,255,255,0.25)', borderBottom: '2px solid rgba(255,255,255,0.25)', borderRadius: '0 0 8px 0' }} />
            </div>
          )}

          {finalMatch && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={labelStyle('#facc15')}>✦ Final ✦</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{ flex: 1 }}>{renderCard(finalMatch)}</div>
                <Trophy style={{ width: 64, height: 64, color: '#facc15', flexShrink: 0, filter: 'drop-shadow(0 0 16px rgba(250,204,21,0.7))' }} />
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
