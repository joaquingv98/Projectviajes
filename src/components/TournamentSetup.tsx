import { useState } from 'react';
import { Users, LogIn, Smartphone, Monitor } from 'lucide-react';
import { isMobileDevice } from '../lib/mobile';

interface TournamentSetupProps {
  onStart: (participants: string[], currentUserForMobile?: string) => void;
  onJoin: (tournamentId: string) => void;
}

export default function TournamentSetup({ onStart, onJoin }: TournamentSetupProps) {
  const isMobile = isMobileDevice();
  const [tab, setTab] = useState<'create' | 'join' | 'solo'>(isMobile ? 'solo' : 'create');
  const [numParticipants, setNumParticipants] = useState<2 | 4 | 8>(4);
  const [names, setNames] = useState<string[]>(Array(4).fill(''));
  const [joinCode, setJoinCode] = useState('');
  const [soloPlayerName, setSoloPlayerName] = useState('');
  const [soloNumParticipants, setSoloNumParticipants] = useState<2 | 4 | 8>(4);
  const [soloOpponentNames, setSoloOpponentNames] = useState<string[]>(['', '', '']);

  const handleNumChange = (num: 2 | 4 | 8) => {
    setNumParticipants(num);
    setNames(Array(num).fill(''));
  };

  const handleSoloNumChange = (num: 2 | 4 | 8) => {
    setSoloNumParticipants(num);
    const count = num - 1;
    setSoloOpponentNames(prev => {
      const next = prev.slice(0, count);
      while (next.length < count) next.push('');
      return next;
    });
  };

  const handleSoloOpponentChange = (index: number, value: string) => {
    const next = [...soloOpponentNames];
    next[index] = value;
    setSoloOpponentNames(next);
  };

  const handleNameChange = (index: number, value: string) => {
    const newNames = [...names];
    newNames[index] = value;
    setNames(newNames);
  };

  const handleStart = () => {
    const filledNames = names.filter(name => name.trim() !== '');
    if (filledNames.length === numParticipants) {
      onStart(filledNames);
    }
  };

  const handleSoloStart = () => {
    const myName = soloPlayerName.trim();
    if (!myName) return;
    const opponents = soloOpponentNames.slice(0, soloNumParticipants - 1).map((n, i) => n.trim() || `Oponente ${i + 1}`);
    const participants = [myName, ...opponents];
    onStart(participants, myName);
  };

  const handleJoin = () => {
    const code = joinCode.trim();
    if (code.length > 10) {
      onJoin(code);
    }
  };

  const allNamesFilled = names.every(name => name.trim() !== '');

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center justify-center w-28 h-28 bg-blue-500/20 rounded-full mb-8">
            <Users className="w-14 h-14 text-blue-400" />
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4">Torneo de Viajes</h1>
          <p className="text-lg sm:text-xl md:text-2xl text-blue-200">Decide el próximo viaje con tus amigos</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white/5 p-1.5 rounded-2xl border border-white/10 overflow-x-auto">
          <button
            onClick={() => setTab('solo')}
            className={`flex-shrink-0 py-3 px-4 sm:px-6 rounded-xl font-semibold text-base sm:text-lg transition-all flex items-center justify-center gap-2 ${
              tab === 'solo'
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/40'
                : 'text-white/60 hover:text-white'
            }`}
          >
            {isMobile ? <Smartphone className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
            Jugar vs máquina
          </button>
          <button
            onClick={() => setTab('create')}
            className={`flex-1 min-w-0 py-3 px-4 sm:px-6 rounded-xl font-semibold text-base sm:text-lg transition-all ${
              tab === 'create'
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/40'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Crear torneo
          </button>
          <button
            onClick={() => setTab('join')}
            className={`flex-1 min-w-0 py-3 px-4 sm:px-6 rounded-xl font-semibold text-base sm:text-lg transition-all flex items-center justify-center gap-2 ${
              tab === 'join'
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/40'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <LogIn className="w-5 h-5 flex-shrink-0" />
            <span className="hidden sm:inline">Unirme</span>
          </button>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 sm:p-12 border border-white/10">
          {tab === 'solo' ? (
            <div className="max-w-lg mx-auto">
              <p className="text-blue-200 text-base sm:text-lg mb-6 text-center">
                Elige tu nombre y juega contra oponentes simulados. Ideal para probar la aplicación de forma ágil.
              </p>
              <div className="mb-6">
                <label className="block text-white text-sm font-medium mb-3">Tu nombre</label>
                <input
                  type="text"
                  value={soloPlayerName}
                  onChange={(e) => setSoloPlayerName(e.target.value)}
                  placeholder="Ej: Joaco"
                  className="w-full px-5 py-4 bg-white/10 border border-white/20 rounded-xl text-white text-base placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div className="mb-6">
                <label className="block text-white text-sm font-medium mb-3">Tamaño del torneo</label>
                <div className="grid grid-cols-3 gap-3">
                  {[2, 4, 8].map((num) => (
                    <button
                      key={num}
                      onClick={() => handleSoloNumChange(num as 2 | 4 | 8)}
                      className={`py-4 px-4 rounded-xl font-semibold text-lg transition-all ${
                        soloNumParticipants === num
                          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/50'
                          : 'bg-white/10 text-white/60 hover:bg-white/15'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-8">
                <label className="block text-white text-sm font-medium mb-3">Nombres de los oponentes</label>
                <div className="space-y-3">
                  {Array.from({ length: soloNumParticipants - 1 }).map((_, i) => (
                    <input
                      key={i}
                      type="text"
                      value={soloOpponentNames[i] ?? ''}
                      onChange={(e) => handleSoloOpponentChange(i, e.target.value)}
                      placeholder={`Oponente ${i + 1}`}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white text-sm placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  ))}
                </div>
              </div>
              <button
                onClick={handleSoloStart}
                disabled={!soloPlayerName.trim()}
                className={`w-full py-5 rounded-xl font-bold text-xl transition-all flex items-center justify-center gap-2 ${
                  soloPlayerName.trim()
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:shadow-xl hover:shadow-emerald-500/50 hover:scale-[1.02]'
                    : 'bg-white/10 text-white/40 cursor-not-allowed'
                }`}
              >
                {isMobile ? <Smartphone className="w-6 h-6" /> : <Monitor className="w-6 h-6" />}
                ¡Jugar contra la máquina!
              </button>
            </div>
          ) : tab === 'create' ? (
            <>
              <div className="mb-10">
                <label className="block text-white text-base font-medium mb-5">
                  Número de participantes
                </label>
                <div className="grid grid-cols-3 gap-6">
                  {[2, 4, 8].map((num) => (
                    <button
                      key={num}
                      onClick={() => handleNumChange(num as 2 | 4 | 8)}
                      className={`py-5 px-8 rounded-xl font-semibold text-xl transition-all ${
                        numParticipants === num
                          ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50'
                          : 'bg-white/10 text-white/60 hover:bg-white/15'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-10">
                <label className="block text-white text-base font-medium mb-5">
                  Nombres de los participantes
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {names.map((name, index) => (
                    <input
                      key={index}
                      type="text"
                      value={name}
                      onChange={(e) => handleNameChange(index, e.target.value)}
                      placeholder={`Participante ${index + 1}`}
                      className="px-5 py-4 bg-white/10 border border-white/20 rounded-xl text-white text-base placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ))}
                </div>
              </div>

              <button
                onClick={handleStart}
                disabled={!allNamesFilled}
                className={`w-full py-5 rounded-xl font-bold text-xl transition-all ${
                  allNamesFilled
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-xl hover:shadow-blue-500/50 hover:scale-[1.02]'
                    : 'bg-white/10 text-white/40 cursor-not-allowed'
                }`}
              >
                Crear sala de espera
              </button>
              <p className="text-center text-white/40 text-sm mt-3">
                Podrás compartir el enlace con todos antes de comenzar el sorteo
              </p>
            </>
          ) : (
            <div className="max-w-lg mx-auto">
              <p className="text-blue-200 text-lg mb-8 text-center">
                Pide a quien creó el torneo que te comparta el código, o copia la URL directamente.
              </p>
              <div className="mb-6">
                <label className="block text-white text-base font-medium mb-4">
                  Código del torneo
                </label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="Pega aquí el código del torneo..."
                  className="w-full px-5 py-4 bg-white/10 border border-white/20 rounded-xl text-white text-base placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={handleJoin}
                disabled={joinCode.trim().length <= 10}
                className={`w-full py-5 rounded-xl font-bold text-xl transition-all flex items-center justify-center gap-3 ${
                  joinCode.trim().length > 10
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-xl hover:shadow-blue-500/50 hover:scale-[1.02]'
                    : 'bg-white/10 text-white/40 cursor-not-allowed'
                }`}
              >
                <LogIn className="w-6 h-6" />
                Unirme
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
