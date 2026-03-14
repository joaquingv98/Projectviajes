import { useState, useEffect } from 'react';
import { Trophy } from 'lucide-react';
import { isMobileDevice } from '../lib/mobile';

interface FinalRevealScreenProps {
  player1Name: string;
  player2Name: string;
  onComplete: () => void;
}

export default function FinalRevealScreen({
  player1Name,
  player2Name,
  onComplete,
}: FinalRevealScreenProps) {
  const [phase, setPhase] = useState<'title' | 'names' | 'ready'>('title');
  const [showButton, setShowButton] = useState(false);
  const isMobile = isMobileDevice();

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('names'), 1200);
    const t2 = setTimeout(() => setPhase('ready'), 2400);
    const t3 = setTimeout(() => setShowButton(true), 3200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6 overflow-hidden relative"
      style={{
        background: 'linear-gradient(180deg, #0a0e1a 0%, #0f1729 30%, #1a1f35 60%, #0a0e1a 100%)',
        boxShadow: 'inset 0 0 200px rgba(250, 204, 21, 0.03)',
      }}
    >
      <style>{`
        @keyframes finalTitleIn {
          0% {
            opacity: 0;
            transform: scale(0.3) translateY(-60px);
            filter: blur(12px);
          }
          60% {
            opacity: 1;
            transform: scale(1.08) translateY(0);
            filter: blur(0);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
            filter: blur(0);
          }
        }
        @keyframes finalNameIn {
          0% {
            opacity: 0;
            transform: translateX(-80px) scale(0.8);
          }
          70% {
            opacity: 1;
            transform: translateX(4px) scale(1.02);
          }
          100% {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
        @keyframes finalNameInRight {
          0% {
            opacity: 0;
            transform: translateX(80px) scale(0.8);
          }
          70% {
            opacity: 1;
            transform: translateX(-4px) scale(1.02);
          }
          100% {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
        @keyframes finalGlow {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes finalButtonIn {
          0% {
            opacity: 0;
            transform: translateY(24px) scale(0.95);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>

      {/* Partículas doradas de fondo */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        aria-hidden
      >
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-amber-400/20"
            style={{
              width: 4 + (i % 3) * 4,
              height: 4 + (i % 3) * 4,
              left: `${10 + (i * 7) % 80}%`,
              top: `${5 + (i * 11) % 90}%`,
              animation: 'finalGlow 2.5s ease-in-out infinite',
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center max-w-2xl w-full">
        {/* Trofeo */}
        <div
          className="mb-6"
          style={{
            opacity: phase !== 'title' ? 1 : 0,
            animation: phase === 'title' ? 'finalTitleIn 1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' : 'none',
          }}
        >
          <div
            className="flex items-center justify-center rounded-full p-6"
            style={{
              background: 'linear-gradient(135deg, rgba(250, 204, 21, 0.25) 0%, rgba(234, 179, 8, 0.15) 100%)',
              border: '3px solid rgba(250, 204, 21, 0.5)',
              boxShadow: '0 0 60px rgba(250, 204, 21, 0.4), 0 0 120px rgba(250, 204, 21, 0.15)',
            }}
          >
            <Trophy
              className={isMobile ? 'w-16 h-16' : 'w-24 h-24'}
              style={{ color: '#facc15', filter: 'drop-shadow(0 0 12px rgba(250, 204, 21, 0.8))' }}
            />
          </div>
        </div>

        {/* Título */}
        <h1
          className="font-black text-center text-white mb-2 tracking-tight"
          style={{
            fontSize: isMobile ? 'clamp(28px, 8vw, 42px)' : 'clamp(36px, 5vw, 56px)',
            opacity: phase === 'title' ? 1 : 0,
            animation: phase === 'title' ? 'finalTitleIn 1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' : 'none',
            textShadow: '0 0 40px rgba(250, 204, 21, 0.6), 0 0 80px rgba(250, 204, 21, 0.3)',
            color: '#facc15',
          }}
        >
          ¡LA GRAN FINAL!
        </h1>

        {/* Subtítulo */}
        <p
          className="text-slate-400 font-semibold text-center mb-10"
          style={{
            fontSize: isMobile ? 14 : 18,
            opacity: phase === 'title' ? undefined : 1,
            animation: phase === 'title' ? 'finalTitleIn 1s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both' : 'none',
          }}
        >
          El destino del viaje se decide ahora
        </p>

        {/* Nombres de finalistas */}
        <div
          className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8 mb-12"
          style={{ minHeight: isMobile ? 100 : 80 }}
        >
          <span
            className="font-bold text-white truncate max-w-[200px] sm:max-w-[240px] text-center"
            style={{
              fontSize: isMobile ? 22 : 28,
              opacity: phase === 'names' || phase === 'ready' ? 1 : 0,
              animation: phase === 'names' || phase === 'ready' ? 'finalNameIn 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' : 'none',
              textShadow: '0 0 20px rgba(250, 204, 21, 0.4)',
            }}
          >
            {player1Name}
          </span>
          <span
            className="font-black text-amber-400/90 text-lg sm:text-xl"
            style={{
              opacity: phase === 'names' || phase === 'ready' ? 1 : 0,
              animation: phase === 'names' || phase === 'ready' ? 'fadeIn 0.5s 0.4s forwards' : 'none',
            }}
          >
            VS
          </span>
          <span
            className="font-bold text-white truncate max-w-[200px] sm:max-w-[240px] text-center"
            style={{
              fontSize: isMobile ? 22 : 28,
              opacity: phase === 'names' || phase === 'ready' ? 1 : 0,
              animation: phase === 'names' || phase === 'ready' ? 'finalNameInRight 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s forwards' : 'none',
              textShadow: '0 0 20px rgba(250, 204, 21, 0.4)',
            }}
          >
            {player2Name}
          </span>
        </div>

        {/* Botón */}
        {showButton && (
          <button
            type="button"
            onClick={onComplete}
            className="btn-primary px-12 py-4 text-lg sm:text-xl"
            style={{
              animation: 'finalButtonIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
            }}
          >
            Entrar a la final
          </button>
        )}
      </div>
    </div>
  );
}
