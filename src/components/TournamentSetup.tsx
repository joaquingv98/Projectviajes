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
  onStart: (
    participants: string[],
    currentUserForMobile?: string,
    tournamentName?: string
  ) => void | Promise<void>;
  onJoin: (tournamentId: string) => void;
}

const PARTICIPANT_OPTIONS = [2, 3, 4, 5, 6, 7, 8];

interface ParticipantSliderProps {
  value: number;
  onChange: (value: number) => void;
  compact?: boolean;
}

function ParticipantSlider({ value, onChange, compact = false }: ParticipantSliderProps) {
  return (
    <div className={compact ? 'mb-4' : 'mb-6'}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-slate-300">Número de participantes</span>
        <span className="rounded-full border border-blue-400/25 bg-blue-500/10 px-3 py-1 text-sm font-bold text-blue-200">
          {value}
        </span>
      </div>

      <div className="card-modern-inner px-4 py-3 sm:px-5">
        <input
          type="range"
          min={2}
          max={8}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label="Número de participantes"
          className="participant-range w-full"
        />
        <div className="mt-2 grid grid-cols-7 text-center text-xs font-semibold text-slate-400">
          {PARTICIPANT_OPTIONS.map((num) => (
            <span key={num} className={num === value ? 'text-blue-200' : undefined}>
              {num}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function TournamentSetup({ onStart, onJoin }: TournamentSetupProps) {
  const isMobile = isMobileDevice();
  const [tab, setTab] = useState<'create' | 'join' | 'solo'>(isMobile ? 'solo' : 'create');
  const [numParticipants, setNumParticipants] = useState(4);
  const [names, setNames] = useState<string[]>(Array(4).fill(''));
  const [joinCode, setJoinCode] = useState('');
  const [soloPlayerName, setSoloPlayerName] = useState('');
  const [soloNumParticipants, setSoloNumParticipants] = useState(4);
  const [soloOpponentNames, setSoloOpponentNames] = useState<string[]>(['', '', '']);
  const [creatingLobby, setCreatingLobby] = useState(false);
  const [tournamentName, setTournamentName] = useState('');
  const [createTournamentName, setCreateTournamentName] = useState('');

  const handleNumChange = (num: number) => {
    setNumParticipants(num);
    setNames(Array(num).fill(''));
  };

  const handleSoloNumChange = (num: number) => {
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
    const filledNames = names.map(name => name.trim()).filter(name => name !== '');
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
      // Extraer hash si pegaron la URL completa (ej. http://.../#uuid o #uuid?voter=1)
      let hashPart = code;
      if (code.includes('#')) {
        hashPart = (code.split('#')[1] || code).trim();
      }
      if (hashPart.length > 10) onJoin(hashPart);
    }
  };

  const allNamesFilled = names.every(name => name.trim() !== '');
  const activeTabClass = 'bg-white/12 text-white shadow-[0_14px_30px_rgba(15,23,42,0.35)] border border-white/10';
  const inactiveTabClass = 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent';

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-4 sm:px-6 sm:py-6 md:px-8 lg:px-10 lg:py-4">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-8rem] top-16 h-64 w-64 rounded-full bg-blue-500/18 blur-3xl" />
        <div className="absolute right-[-6rem] top-24 h-72 w-72 rounded-full bg-cyan-400/14 blur-3xl" />
        <div className="absolute bottom-[-8rem] left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-violet-500/14 blur-3xl" />
      </div>

      <div className="relative mx-auto grid min-h-[calc(100vh-1rem)] max-w-7xl items-start gap-5 sm:min-h-[calc(100vh-2rem)] sm:items-center sm:gap-8 lg:grid-cols-[1fr_0.92fr] lg:gap-10">
        <section className="mx-auto w-full max-w-2xl lg:mx-0">
          <div className="brand-logo mb-4 flex items-center gap-3 sm:mb-5">
            <div className="brand-logo-box flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl sm:h-12 sm:w-12">
              <img
                src="/logo-choose-the-trip.png"
                alt=""
                className="h-7 w-7 object-contain sm:h-8 sm:w-8"
                style={{
                  filter: 'brightness(1.05) contrast(1.08) saturate(0.75)',
                }}
              />
            </div>
            <span
              className="font-bold tracking-tight text-white"
              style={{
                fontSize: 'clamp(1.25rem, 2.5vw, 1.5rem)',
                letterSpacing: '-0.02em',
                fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
              }}
            >
              ChooseTheTrip
            </span>
          </div>

          <div className="eyebrow-badge mb-3 text-slate-100/90 sm:mb-4">
            <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,0.9)]" />
            Crear · Unirse · Modo solo
          </div>

          <div className="hero-title-block mb-4 max-w-xl text-center sm:text-left sm:mb-6">
            <h1 className="hero-title">
              Iros de viaje con <span className="hero-gradient">vuestros amigos.</span>
            </h1>

            <h1 className="hero-title">
              De una p*** vez.
            </h1>

            <p className="hero-subtitle">
              Crea un torneo entre destinos y deja que el grupo decida votando.
            </p>
          </div>

          {!isMobile && (
            <>
              <div className="mb-5 flex flex-wrap gap-2.5">
                <div className="eyebrow-badge text-slate-200/90">Crear sala</div>
                <div className="eyebrow-badge text-slate-200/90">Unirse por código</div>
                <div className="eyebrow-badge text-slate-200/90">Modo solo</div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="card-modern-inner p-3.5">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300/85">1</p>
                  <p className="mt-2 text-base font-semibold text-white">Preparas el torneo</p>
                  <p className="mt-1.5 text-xs leading-5 text-slate-300/78">Define participantes y arranca sin fricción.</p>
                </div>
                <div className="card-modern-inner p-3.5">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-300/85">2</p>
                  <p className="mt-2 text-base font-semibold text-white">Compartes el acceso</p>
                  <p className="mt-1.5 text-xs leading-5 text-slate-300/78">Todos entran con enlace o código del torneo.</p>
                </div>
                <div className="card-modern-inner p-3.5">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-fuchsia-300/85">3</p>
                  <p className="mt-2 text-base font-semibold text-white">Votáis el viaje</p>
                  <p className="mt-1.5 text-xs leading-5 text-slate-300/78">Propuestas, votaciones y viaje ganador entre todos.</p>
                </div>
              </div>
            </>
          )}
        </section>

        <section className="relative mx-auto w-full max-w-2xl lg:mx-0">
          <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-blue-500/10 via-cyan-400/8 to-violet-500/10 blur-2xl" />

          <div className="relative card-modern p-2 sm:p-3 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
            <div className="card-modern-inner p-4 sm:p-5">
              <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300/85">Inicio del torneo</p>
                  <h2 className="mt-1.5 text-xl font-bold tracking-tight text-white sm:text-2xl">
                    {isMobile ? 'Empieza el torneo' : 'Elige cómo quieres empezar'}
                  </h2>
                </div>
                {!isMobile && (
                  <div className="eyebrow-badge self-start text-slate-200/85">
                    <Users className="h-4 w-4 text-blue-300" />
                    Tres formas de empezar
                  </div>
                )}
              </div>

              <div role="tablist" aria-label="Modo de juego" className="tabs-modern mb-4 sm:mb-5">
                <button
                  role="tab"
                  type="button"
                  aria-selected={tab === 'solo'}
                  aria-controls="tabpanel-solo"
                  id="tab-solo"
                  onClick={() => setTab('solo')}
                  className={`min-w-0 flex-1 rounded-xl px-3 py-3 text-sm font-semibold transition-all sm:px-6 sm:text-lg flex items-center justify-center gap-2 ${
                    tab === 'solo' ? activeTabClass : inactiveTabClass
                  }`}
                >
                  {!isMobile && (isMobile ? <Smartphone className="w-5 h-5" /> : <Monitor className="w-5 h-5" />)}
                  {isMobile ? 'Solo' : 'Jugar solo'}
                </button>
                <button
                  role="tab"
                  type="button"
                  aria-selected={tab === 'create'}
                  aria-controls="tabpanel-create"
                  id="tab-create"
                  onClick={() => setTab('create')}
                  className={`min-w-0 flex-1 rounded-xl px-3 py-3 text-sm font-semibold transition-all sm:px-6 sm:text-lg ${
                    tab === 'create' ? activeTabClass : inactiveTabClass
                  }`}
                >
                  {isMobile ? 'Crear' : 'Crear torneo'}
                </button>
                <button
                  role="tab"
                  type="button"
                  aria-selected={tab === 'join'}
                  aria-controls="tabpanel-join"
                  id="tab-join"
                  onClick={() => setTab('join')}
                  className={`min-w-0 flex-1 rounded-xl px-3 py-3 text-sm font-semibold transition-all sm:px-6 sm:text-lg flex items-center justify-center gap-2 ${
                    tab === 'join' ? activeTabClass : inactiveTabClass
                  }`}
                >
                  {!isMobile && <LogIn className="w-5 h-5 flex-shrink-0" />}
                  <span>Unirme</span>
                </button>
              </div>

              <div
                className="card-modern rounded-[1.35rem] p-4 sm:p-6"
                role="tabpanel"
                id={tab === 'solo' ? 'tabpanel-solo' : tab === 'create' ? 'tabpanel-create' : 'tabpanel-join'}
                aria-labelledby={tab === 'solo' ? 'tab-solo' : tab === 'create' ? 'tab-create' : 'tab-join'}
              >
                {tab === 'solo' ? (
                  <div className="mx-auto max-w-lg">
                    {!isMobile && (
                    <p className="mb-4 text-center text-sm text-slate-300/88 sm:text-base">
                      Configura tu nombre, define cuántos rivales habrá y prueba la experiencia completa en modo individual.
                    </p>
                    )}
                    <div className="mb-3 sm:mb-4">
                      <label className="mb-2 block text-sm font-medium text-slate-300 sm:mb-3">Nombre del torneo (opcional)</label>
                      <input
                        type="text"
                        value={tournamentName}
                        onChange={(e) => setTournamentName(e.target.value)}
                        placeholder="Ej: Viaje a Tailandia"
                        className="input-modern w-full px-4 py-3 text-sm text-white placeholder-white/35"
                      />
                    </div>
                    <div className="mb-3 sm:mb-4">
                      <label className="mb-2 block text-sm font-medium text-slate-300 sm:mb-3">Tu nombre</label>
                      <input
                        type="text"
                        value={soloPlayerName}
                        onChange={(e) => setSoloPlayerName(e.target.value)}
                        placeholder="Ej: Joaco"
                        className="input-modern w-full px-5 py-4 text-base text-white placeholder-white/35"
                      />
                    </div>
                    <ParticipantSlider
                      value={soloNumParticipants}
                      onChange={handleSoloNumChange}
                      compact
                    />
                    <div className="mb-5 sm:mb-6">
                      <label className="mb-2 block text-sm font-medium text-slate-300 sm:mb-3">Nombres de los oponentes</label>
                      <div className="space-y-3">
                        {Array.from({ length: soloNumParticipants - 1 }).map((_, i) => (
                          <input
                            key={i}
                            type="text"
                            value={soloOpponentNames[i] ?? ''}
                            onChange={(e) => handleSoloOpponentChange(i, e.target.value)}
                            placeholder={`Oponente ${i + 1}`}
                            className="input-modern w-full px-4 py-3 text-sm text-white placeholder-white/35"
                          />
                        ))}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleSoloStart}
                      disabled={!soloPlayerName.trim() || creatingLobby}
                      aria-label="Jugar contra la máquina"
                      className={`flex w-full items-center justify-center gap-2 rounded-xl py-4 text-lg font-bold transition-all sm:py-5 sm:text-xl ${
                        soloPlayerName.trim() && !creatingLobby
                          ? 'btn-primary'
                          : 'cursor-not-allowed border border-white/5 bg-white/5 text-white/40'
                      }`}
                    >
                      {creatingLobby ? (
                        <><Loader2 className="w-6 h-6 animate-spin" /> Creando sala...</>
                      ) : (
                        <>
                          {isMobile ? <Smartphone className="w-6 h-6" /> : <Monitor className="w-6 h-6" />}
                          Empezar en solo
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  </div>
                ) : tab === 'create' ? (
                  <>
                    {!isMobile && (
                    <p className="mb-4 text-sm text-slate-300/88 sm:text-base">
                      Crea una sala para que todos participen y compartid el enlace antes de empezar el sorteo.
                    </p>
                    )}
                    <div className="mb-3 sm:mb-4">
                      <label className="mb-2 block text-sm font-medium text-slate-300 sm:mb-3 sm:text-base">Nombre del torneo (opcional)</label>
                      <input
                        type="text"
                        value={createTournamentName}
                        onChange={(e) => setCreateTournamentName(e.target.value)}
                        placeholder="Ej: Viaje grupal 2025"
                        className="input-modern w-full px-5 py-4 text-base text-white placeholder-white/35"
                      />
                    </div>
                    <ParticipantSlider
                      value={numParticipants}
                      onChange={handleNumChange}
                    />

                    <div className="mb-5 sm:mb-6">
                      <label className="mb-3 block text-sm font-medium text-slate-300 sm:mb-5 sm:text-base">Nombres de quienes compiten</label>
                      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
                        {names.map((name, index) => (
                          <input
                            key={index}
                            type="text"
                            value={name}
                            onChange={(e) => handleNameChange(index, e.target.value)}
                            placeholder={`Participante ${index + 1}`}
                            className="input-modern px-5 py-4 text-base text-white placeholder-white/35"
                          />
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleStart}
                      disabled={!allNamesFilled || creatingLobby}
                      aria-label="Crear sala de espera"
                      className={`flex w-full items-center justify-center gap-2 rounded-xl py-4 text-lg font-bold transition-all sm:py-5 sm:text-xl ${
                        allNamesFilled && !creatingLobby
                          ? 'btn-primary'
                          : 'cursor-not-allowed border border-white/5 bg-white/5 text-white/40'
                      }`}
                    >
                      {creatingLobby ? (
                        <><Loader2 className="w-5 h-5 animate-spin" /> Creando sala...</>
                      ) : (
                        <>Crear sala de espera <ArrowRight className="w-5 h-5" /></>
                      )}
                    </button>
                    {!isMobile && (
                    <p className="mt-3 text-center text-sm text-slate-400">
                      Después podrás compartir el acceso con todos antes de empezar.
                    </p>
                    )}
                  </>
                ) : (
                  <div className="mx-auto max-w-lg">
                    {!isMobile && (
                    <p className="mb-8 text-center text-lg text-slate-300/88">
                      Introduce el código que te hayan compartido o pega directamente la URL del torneo.
                    </p>
                    )}
                    <div className="mb-5 sm:mb-6">
                      <label className="mb-2 block text-sm font-medium text-slate-300 sm:mb-4 sm:text-base">Código del torneo</label>
                      <input
                        type="text"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value)}
                        placeholder="Pega aquí el código del torneo..."
                        className="input-modern w-full px-5 py-4 text-base text-white placeholder-white/35"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleJoin}
                      disabled={joinCode.trim().length <= 10}
                      aria-label="Unirme al torneo"
                      className={`flex w-full items-center justify-center gap-3 rounded-xl py-4 text-lg font-bold transition-all sm:py-5 sm:text-xl ${
                        joinCode.trim().length > 10
                          ? 'btn-primary'
                          : 'cursor-not-allowed border border-white/5 bg-white/5 text-white/40'
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
        </section>
      </div>
    </div>
  );
}
