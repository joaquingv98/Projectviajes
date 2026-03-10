import { useState, useEffect } from 'react';
import { Shuffle } from 'lucide-react';
import { isMobileDevice } from '../lib/mobile';

interface DrawAnimationProps {
  participants: string[];
  onComplete: () => void;
}

export default function DrawAnimation({ participants, onComplete }: DrawAnimationProps) {
  const [isAnimating, setIsAnimating] = useState(true);
  // El orden ya viene barajado desde el servidor; aquí solo lo animamos
  const [displayNames, setDisplayNames] = useState<string[]>([...participants]);

  useEffect(() => {
    // Animar el sorteo visualmente (mezcla aleatoria local solo para la animación)
    const shuffleInterval = setInterval(() => {
      setDisplayNames(prev => [...prev].sort(() => Math.random() - 0.5));
    }, 100);

    const stopTimer = setTimeout(() => {
      clearInterval(shuffleInterval);
      // Al final mostrar el orden real (el que vino del servidor)
      setDisplayNames([...participants]);
      setIsAnimating(false);
    }, 3000);

    return () => {
      clearInterval(shuffleInterval);
      clearTimeout(stopTimer);
    };
  }, [participants]);

  useEffect(() => {
    if (!isAnimating) {
      const proceedTimer = setTimeout(() => {
        onComplete();
      }, 2500);
      return () => clearTimeout(proceedTimer);
    }
  }, [isAnimating, onComplete]);

  const isMobile = isMobileDevice();
  const ballSize = isMobile ? 'w-14 h-14' : 'w-24 h-24';
  const ballShadow = isMobile ? 'w-14 h-2' : 'w-20 h-4';

  const renderBalls = () =>
    displayNames.map((name, index) => (
      <div
        key={index}
        className={`relative transition-all duration-300 ${isAnimating ? 'animate-bounce' : 'animate-none'}`}
        style={{ animationDelay: `${index * 0.1}s`, animationDuration: '0.6s' }}
      >
        <div className={`${ballSize} relative`}>
          <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 ${ballShadow} bg-black/20 rounded-full blur-md`} />
          <div className={`w-full h-full rounded-full bg-gradient-to-br from-white to-gray-200 shadow-xl flex items-center justify-center border-2 sm:border-4 ${
            isAnimating ? 'border-blue-300' : 'border-blue-500'
          } transition-all duration-300`}>
            <span className={`${isMobile ? 'text-[10px]' : 'text-xs'} font-bold text-center px-1 truncate max-w-full ${
              isAnimating ? 'opacity-50 blur-sm' : 'opacity-100 blur-0'
            } transition-all duration-300`}>
              {name}
            </span>
          </div>
        </div>
      </div>
    ));

  const renderMatchups = () => {
    const orderedNames = isAnimating ? displayNames : participants;
    const matchups: string[][] = [];
    for (let i = 0; i < orderedNames.length; i += 2) {
      matchups.push([orderedNames[i], orderedNames[i + 1]]);
    }
    return matchups.map((matchup, index) => (
      <div
        key={index}
        className={`card-modern-inner opacity-0 animate-fadeIn ${isMobile ? 'p-3' : 'p-4'}`}
        style={{ animationDelay: `${index * 0.2}s`, animationFillMode: 'forwards' }}
      >
        <div className="flex items-center justify-between">
          <span className={`text-white font-semibold truncate flex-1 ${isMobile ? 'text-sm' : ''}`}>{matchup[0]}</span>
          <span className={`text-slate-400 font-bold flex-shrink-0 ${isMobile ? 'mx-2 text-xs' : 'mx-4'}`}>VS</span>
          <span className={`text-white font-semibold truncate flex-1 text-right ${isMobile ? 'text-sm' : ''}`}>{matchup[1]}</span>
        </div>
      </div>
    ));
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className={`w-full max-w-4xl ${isMobile ? 'py-2' : ''}`}>
        <div className={`text-center ${isMobile ? 'mb-4' : 'mb-12'}`}>
          <div className={`inline-flex items-center justify-center rounded-2xl card-modern-inner ${isMobile ? 'w-14 h-14 mb-4' : 'w-20 h-20 mb-6'}`}>
            <Shuffle className={`text-blue-400 ${isMobile ? 'w-7 h-7' : 'w-10 h-10'} ${isAnimating ? 'animate-spin' : ''}`} />
          </div>
          <h1 className={`font-bold text-white tracking-tight ${isMobile ? 'text-2xl mb-1' : 'text-5xl mb-3'}`}>
            {isAnimating ? 'Sorteando emparejamientos...' : '¡Sorteo completado!'}
          </h1>
          <p className={`text-slate-300/90 ${isMobile ? 'text-sm' : 'text-xl'}`}>
            {isAnimating ? 'Mezclando participantes' : 'Cuadro del torneo generado'}
          </p>
        </div>

        <div className={`relative ${isMobile ? 'mb-4' : 'mb-8'}`}>
          <div className={`card-modern overflow-hidden ${isMobile ? 'p-4' : 'p-8'}`}>
            {isAnimating && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
            )}
            <div className={`grid grid-cols-2 md:grid-cols-4 place-items-center ${isMobile ? 'gap-3' : 'gap-6'}`}>
              {renderBalls()}
            </div>
          </div>
        </div>

        {!isAnimating && (
          <div className="animate-fadeIn">
            <h2 className={`font-bold text-white text-center ${isMobile ? 'text-lg mb-3' : 'text-2xl mb-4'}`}>
              Enfrentamientos de primera ronda
            </h2>
            <div className={isMobile ? 'space-y-2' : 'mt-8 space-y-4'}>
              {renderMatchups()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
