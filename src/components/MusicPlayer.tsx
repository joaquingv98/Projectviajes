import { useState, useEffect, useRef } from 'react';
import { Music, VolumeX } from 'lucide-react';

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

  return (
    <>

      {/* Botón flotante */}
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        {/* Tooltip */}
        {isPlaying && (
          <div style={{
            background: 'rgba(0,0,0,0.85)',
            color: 'white',
            fontSize: 12,
            fontWeight: 600,
            padding: '6px 12px',
            borderRadius: 8,
            whiteSpace: 'nowrap',
            backdropFilter: 'blur(4px)',
          }}>
            ♪ Champions League Anthem
          </div>
        )}

        <button
          onClick={togglePlay}
          title={isPlaying ? 'Pausar himno' : 'Reproducir himno de la Champions'}
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: isPlaying
              ? 'linear-gradient(135deg, #facc15, #d97706)'
              : 'linear-gradient(135deg, #1d4ed8, #1e3a8a)',
            boxShadow: isPlaying
              ? '0 0 24px rgba(250,204,21,0.6), 0 4px 16px rgba(0,0,0,0.4)'
              : '0 4px 16px rgba(0,0,0,0.4)',
            transition: 'all 0.3s ease',
            transform: 'scale(1)',
            position: 'relative',
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          {/* Anillos pulsantes cuando suena */}
          {isPlaying && (
            <span style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: '2px solid rgba(250,204,21,0.5)',
              animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite',
            }} />
          )}
          {isPlaying
            ? <Music style={{ width: 24, height: 24, color: 'white', position: 'relative', zIndex: 1 }} />
            : <VolumeX style={{ width: 24, height: 24, color: 'white', position: 'relative', zIndex: 1 }} />
          }
        </button>

        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
          {isPlaying ? 'Sonando' : 'Himno'}
        </span>
      </div>
    </>
  );
}
