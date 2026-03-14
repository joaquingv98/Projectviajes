import { useState, useEffect, useRef } from 'react';
import { Music, VolumeX } from 'lucide-react';
import { isMobileDevice } from '../lib/mobile';

export default function MusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio('/champions.mp3');
    audioRef.current.loop = true;
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(prev => !prev);
  };

  const isMobile = isMobileDevice();
  const size = isMobile ? 40 : 56;
  const iconSize = isMobile ? 18 : 24;

  return (
    <div
      className="fixed z-[9998] flex flex-col items-center gap-1"
      style={{
        bottom: isMobile ? 12 : 24,
        right: isMobile ? 12 : 24,
      }}
    >
      {/* Tooltip solo en desktop */}
      {!isMobile && isPlaying && (
        <div className="bg-black/85 text-white text-xs font-semibold px-3 py-1.5 rounded-lg backdrop-blur-sm whitespace-nowrap">
          ♪ Champions League Anthem
        </div>
      )}

      <button
        type="button"
        onClick={togglePlay}
        aria-label={isPlaying ? 'Pausar himno' : 'Reproducir himno de la Champions'}
        title={isPlaying ? 'Pausar himno' : 'Reproducir himno de la Champions'}
        className={`
          rounded-full border-none cursor-pointer flex items-center justify-center transition-all duration-200 relative
          ${isMobile ? 'opacity-75 hover:opacity-100 active:scale-95' : 'hover:scale-110'}
        `}
        style={{
          width: size,
          height: size,
          background: isPlaying
            ? 'linear-gradient(135deg, #facc15, #d97706)'
            : 'linear-gradient(135deg, #1d4ed8, #1e3a8a)',
          boxShadow: isPlaying
            ? '0 0 12px rgba(250,204,21,0.4)'
            : '0 2px 8px rgba(0,0,0,0.3)',
        }}
      >
        {isPlaying && !isMobile && (
          <span
            className="absolute inset-0 rounded-full border-2 border-yellow-400/50 animate-ping"
            style={{ animationDuration: '1.5s' }}
          />
        )}
        {isPlaying ? (
          <Music style={{ width: iconSize, height: iconSize, color: 'white', position: 'relative', zIndex: 1 }} />
        ) : (
          <VolumeX style={{ width: iconSize, height: iconSize, color: 'white', position: 'relative', zIndex: 1 }} />
        )}
      </button>

      {!isMobile && (
        <span className="text-[10px] text-white/50 font-medium">
          {isPlaying ? 'Sonando' : 'Himno'}
        </span>
      )}
    </div>
  );
}
