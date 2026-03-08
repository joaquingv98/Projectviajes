import { useState, useEffect } from 'react';
import { Shuffle } from 'lucide-react';

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

  const renderBalls = () =>
    displayNames.map((name, index) => (
      <div
        key={index}
        className={`relative transition-all duration-300 ${isAnimating ? 'animate-bounce' : 'animate-none'}`}
        style={{ animationDelay: `${index * 0.1}s`, animationDuration: '0.6s' }}
      >
        <div className="w-24 h-24 relative">
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-20 h-4 bg-black/20 rounded-full blur-md" />
          <div className={`w-full h-full rounded-full bg-gradient-to-br from-white to-gray-200 shadow-xl flex items-center justify-center border-4 ${
            isAnimating ? 'border-blue-300' : 'border-blue-500'
          } transition-all duration-300`}>
            <span className={`text-xs font-bold text-center px-2 ${
              isAnimating ? 'opacity-50 blur-sm' : 'opacity-100 blur-0'
            } transition-all duration-300`}>
              {name}
            </span>
          </div>
        </div>
      </div>
    ));

  const renderMatchups = () => {
    // Usar el orden real del servidor para mostrar los enfrentamientos correctos
    const orderedNames = isAnimating ? displayNames : participants;
    const matchups: string[][] = [];
    for (let i = 0; i < orderedNames.length; i += 2) {
      matchups.push([orderedNames[i], orderedNames[i + 1]]);
    }
    return (
      <div className="mt-8 space-y-4">
        {matchups.map((matchup, index) => (
          <div
            key={index}
            className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 opacity-0 animate-fadeIn"
            style={{ animationDelay: `${index * 0.2}s`, animationFillMode: 'forwards' }}
          >
            <div className="flex items-center justify-between">
              <span className="text-white font-semibold">{matchup[0]}</span>
              <span className="text-blue-300 font-bold mx-4">VS</span>
              <span className="text-white font-semibold">{matchup[1]}</span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#001B44] via-[#002855] to-[#003366] flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-500/20 rounded-full mb-6">
            <Shuffle className={`w-10 h-10 text-blue-400 ${isAnimating ? 'animate-spin' : ''}`} />
          </div>
          <h1 className="text-5xl font-bold text-white mb-3">
            {isAnimating ? 'Sorteando emparejamientos...' : '¡Sorteo completado!'}
          </h1>
          <p className="text-xl text-blue-200">
            {isAnimating ? 'Mezclando participantes' : 'Cuadro del torneo generado'}
          </p>
        </div>

        <div className="relative mb-8">
          <div className="bg-gradient-to-b from-white/10 to-white/5 rounded-3xl border-4 border-white/20 p-8 backdrop-blur-sm overflow-hidden">
            {isAnimating && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 place-items-center">
              {renderBalls()}
            </div>
          </div>
        </div>

        {!isAnimating && (
          <div className="animate-fadeIn">
            <h2 className="text-2xl font-bold text-white text-center mb-4">
              Enfrentamientos de primera ronda
            </h2>
            {renderMatchups()}
          </div>
        )}
      </div>
    </div>
  );
}
