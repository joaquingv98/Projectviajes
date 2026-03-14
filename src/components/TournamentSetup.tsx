import { useState } from 'react';
import { Users, LogIn, Smartphone, Monitor, ArrowRight, Loader2 } from 'lucide-react';
import { isMobileDevice } from '../lib/mobile';

function ensureUniqueNames(names: string[]): string[] {
  const used = new Set<string>();
  return names.map((name) => {
    let unique = name;
    let n = 2;
    while (used.has(unique)) {
      unique = `${name} ${n}`;
      n++;
    }
    used.add(unique);
    return unique;
  });
}

interface TournamentSetupProps {
  onStart: (participants: string[], currentUserForMobile?: string, tournamentName?: string) => void | Promise<void>;
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
  const [creatingLobby, setCreatingLobby] = useState(false);
  const [tournamentName, setTournamentName] = useState('');
  const [createTournamentName, setCreateTournamentName] = useState('');

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

  const handleStart = async () => {
    const filledNames = names.filter(name => name.trim() !== '');
    if (filledNames.length !== numParticipants) return;
    setCreatingLobby(true);
    try {
      await onStart(filledNames, undefined, createTournamentName.trim() || undefined);
    } finally {
      setCreatingLobby(false);
    }
  };

  const handleSoloStart = async () => {
    const myName = soloPlayerName.trim();
    if (!myName) return;
    const rawOpponents = soloOpponentNames.slice(0, soloNumParticipants - 1).map((n, i) => n.trim() || `Oponente ${i + 1}`);
    const participants = ensureUniqueNames([myName, ...rawOpponents]);
    setCreatingLobby(true);
    try {
      await onStart(participants, myName, tournamentName.trim() || undefined);
    } finally {
      setCreatingLobby(false);
    }
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
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6 card-modern-inner">
            <Users className="w-10 h-10 text-blue-400" />
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-3 tracking-tight">Torneo de Viajes</h1>
          <p className="text-lg sm:text-xl text-slate-300/90">Decide el próximo viaje con tus amigos</p>
        </div>

        {/* Tabs */}
        <div role="tablist" aria-label="Modo de juego" className="tabs-modern mb-6">
          <button
            role="tab"
            type="button"
            aria-selected={tab === 'solo'}
            aria-controls="tabpanel-solo"
            id="tab-solo"
            onClick={() => setTab('solo')}
            className={`flex-shrink-0 py-3 px-4 sm:px-6 rounded-xl font-semibold text-base sm:text-lg transition-all flex items-center justify-center gap-2 ${
              tab === 'solo'
                ? 'bg-white/12 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {isMobile ? <Smartphone className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
            Jugar vs máquina
          </button>
          <button
            role="tab"
            type="button"
            aria-selected={tab === 'create'}
            aria-controls="tabpanel-create"
            id="tab-create"
            onClick={() => setTab('create')}
            className={`flex-1 min-w-0 py-3 px-4 sm:px-6 rounded-xl font-semibold text-base sm:text-lg transition-all ${
              tab === 'create'
                ? 'bg-white/12 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Crear torneo
          </button>
          <button
            role="tab"
            type="button"
            aria-selected={tab === 'join'}
            aria-controls="tabpanel-join"
            id="tab-join"
            onClick={() => setTab('join')}
            className={`flex-1 min-w-0 py-3 px-4 sm:px-6 rounded-xl font-semibold text-base sm:text-lg transition-all flex items-center justify-center gap-2 ${
              tab === 'join'
                ? 'bg-white/12 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-5 h-5 flex-shrink-0" />
            <span className="hidden sm:inline">Unirme</span>
          </button>
        </div>

        {/* Card */}
        <div className="card-modern p-6 sm:p-12" role="tabpanel" id={tab === 'solo' ? 'tabpanel-solo' : tab === 'create' ? 'tabpanel-create' : 'tabpanel-join'} aria-labelledby={tab === 'solo' ? 'tab-solo' : tab === 'create' ? 'tab-create' : 'tab-join'}>
          {tab === 'solo' ? (
            <div className="max-w-lg mx-auto">
              <p className="text-slate-300/90 text-base sm:text-lg mb-6 text-center">
                Elige tu nombre y juega contra oponentes simulados. Ideal para probar la aplicación de forma ágil.
              </p>
              <div className="mb-6">
                <label className="block text-slate-300 text-sm font-medium mb-3">Nombre del torneo (opcional)</label>
                <input
                  type="text"
                  value={tournamentName}
                  onChange={(e) => setTournamentName(e.target.value)}
                  placeholder="Ej: Viaje a Tailandia"
                  className="input-modern w-full px-4 py-3 text-white text-sm placeholder-white/40"
                />
              </div>
              <div className="mb-6">
                <label className="block text-slate-300 text-sm font-medium mb-3">Tu nombre</label>
                <input
                  type="text"
                  value={soloPlayerName}
                  onChange={(e) => setSoloPlayerName(e.target.value)}
                  placeholder="Ej: Joaco"
                  className="input-modern w-full px-5 py-4 text-white text-base placeholder-white/40"
                />
              </div>
              <div className="mb-6">
                <label className="block text-slate-300 text-sm font-medium mb-3">Tamaño del torneo</label>
                <div className="grid grid-cols-3 gap-3">
                  {[2, 4, 8].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleSoloNumChange(num as 2 | 4 | 8)}
                      aria-label={`Seleccionar ${num} participantes`}
                      aria-pressed={soloNumParticipants === num}
                      className={`py-4 px-4 rounded-xl font-semibold text-lg transition-all ${
                        soloNumParticipants === num
                          ? 'bg-white/15 text-white border border-white/20'
                          : 'input-modern text-slate-400 hover:text-white'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-8">
                <label className="block text-slate-300 text-sm font-medium mb-3">Nombres de los oponentes</label>
                <div className="space-y-3">
                  {Array.from({ length: soloNumParticipants - 1 }).map((_, i) => (
                    <input
                      key={i}
                      type="text"
                      value={soloOpponentNames[i] ?? ''}
                      onChange={(e) => handleSoloOpponentChange(i, e.target.value)}
                      placeholder={`Oponente ${i + 1}`}
                      className="input-modern w-full px-4 py-3 text-white text-sm placeholder-white/40"
                    />
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={handleSoloStart}
                disabled={!soloPlayerName.trim() || creatingLobby}
                aria-label="Jugar contra la máquina"
                className={`w-full py-5 rounded-xl font-bold text-xl transition-all flex items-center justify-center gap-2 ${
                  soloPlayerName.trim() && !creatingLobby
                    ? 'btn-primary'
                    : 'bg-white/5 text-white/40 cursor-not-allowed border border-white/5'
                }`}
              >
                {creatingLobby ? (
                  <><Loader2 className="w-6 h-6 animate-spin" /> Creando sala...</>
                ) : (
                  <>
                    {isMobile ? <Smartphone className="w-6 h-6" /> : <Monitor className="w-6 h-6" />}
                    ¡Jugar contra la máquina!
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          ) : tab === 'create' ? (
            <>
              <div className="mb-6">
                <label className="block text-slate-300 text-base font-medium mb-3">Nombre del torneo (opcional)</label>
                <input
                  type="text"
                  value={createTournamentName}
                  onChange={(e) => setCreateTournamentName(e.target.value)}
                  placeholder="Ej: Viaje grupal 2025"
                  className="input-modern w-full px-5 py-4 text-white text-base placeholder-white/40"
                />
              </div>
              <div className="mb-10">
                <label className="block text-slate-300 text-base font-medium mb-5">
                  Número de participantes
                </label>
                <div className="grid grid-cols-3 gap-6">
                  {[2, 4, 8].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleNumChange(num as 2 | 4 | 8)}
                      aria-label={`Seleccionar ${num} participantes`}
                      aria-pressed={numParticipants === num}
                      className={`py-5 px-8 rounded-xl font-semibold text-xl transition-all ${
                        numParticipants === num
                          ? 'bg-white/15 text-white border border-white/20'
                          : 'input-modern text-slate-400 hover:text-white'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-10">
                <label className="block text-slate-300 text-base font-medium mb-5">
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
                      className="input-modern px-5 py-4 text-white text-base placeholder-white/40"
                    />
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleStart}
                disabled={!allNamesFilled || creatingLobby}
                aria-label="Crear sala de espera"
                className={`w-full py-5 rounded-xl font-bold text-xl transition-all flex items-center justify-center gap-2 ${
                  allNamesFilled && !creatingLobby
                    ? 'btn-primary'
                    : 'bg-white/5 text-white/40 cursor-not-allowed border border-white/5'
                }`}
              >
                {creatingLobby ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Creando sala...</>
                ) : (
                  <>Crear sala de espera <ArrowRight className="w-5 h-5" /></>
                )}
              </button>
              <p className="text-center text-slate-500 text-sm mt-3">
                Podrás compartir el enlace con todos antes de comenzar el sorteo
              </p>
            </>
          ) : (
            <div className="max-w-lg mx-auto">
              <p className="text-slate-300/90 text-lg mb-8 text-center">
                Pide a quien creó el torneo que te comparta el código, o copia la URL directamente.
              </p>
              <div className="mb-6">
                <label className="block text-slate-300 text-base font-medium mb-4">
                  Código del torneo
                </label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="Pega aquí el código del torneo..."
                  className="input-modern w-full px-5 py-4 text-white text-base placeholder-white/40"
                />
              </div>
              <button
                type="button"
                onClick={handleJoin}
                disabled={joinCode.trim().length <= 10}
                aria-label="Unirme al torneo"
                className={`w-full py-5 rounded-xl font-bold text-xl transition-all flex items-center justify-center gap-3 ${
                  joinCode.trim().length > 10
                    ? 'btn-primary'
                    : 'bg-white/5 text-white/40 cursor-not-allowed border border-white/5'
                }`}
              >
                <LogIn className="w-6 h-6" />
                Unirme
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
