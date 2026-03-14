import { useState, useRef, useEffect } from 'react';
import { Match, Proposal } from '../lib/supabase';
import { Plane, Send, Clock, ChevronLeft, ChevronRight, CalendarDays, Globe } from 'lucide-react';
interface MatchSubmissionProps {
  match: Match;
  proposals: Proposal[];
  currentUser: string | null;
  onSubmit: (proposal: {
    flight_link: string;
    price: number;
    destination?: string;
    dates?: string;
  }) => void;
  onBack: () => void;
}

// ─── Ruleta de destinos ────────────────────────────────────────────────────
const DESTINOS_RULETA = [
  'Bangkok, Tailandia', 'Tokio, Japón', 'Nueva York, EE.UU.', 'París, Francia',
  'Barcelona, España', 'Lisboa, Portugal', 'Roma, Italia', 'Londres, Reino Unido',
  'Ámsterdam, Países Bajos', 'Dubái, Emiratos Árabes', 'Sídney, Australia',
  'Ciudad de México, México', 'Buenos Aires, Argentina', 'Berlín, Alemania',
  'Praga, República Checa', 'Seúl, Corea del Sur', 'Singapur', 'Estambul, Turquía',
  'Miami, EE.UU.', 'Los Ángeles, EE.UU.', 'Marrakech, Marruecos', 'Cairo, Egipto',
  'Moscú, Rusia', 'Copenhague, Dinamarca', 'Edimburgo, Reino Unido', 'Dublin, Irlanda',
  'Atenas, Grecia', 'Croacia', 'Islandia', 'Noruega', 'Malta', 'Santorini, Grecia',
];

// ─── Mini calendario ───────────────────────────────────────────────────────
const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DAYS   = ['L','M','X','J','V','S','D'];

function toYMD(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}

interface CalendarMonthProps {
  year: number;
  month: number; // 0-11
  dateFrom: string;
  dateTo: string;
  hovered: string;
  today: string;
  onSelect: (date: string) => void;
  onHover: (date: string) => void;
}

function CalendarMonth({ year, month, dateFrom, dateTo, hovered, today, onSelect, onHover }: CalendarMonthProps) {
  const firstDay = (new Date(year, month, 1).getDay() + 6) % 7; // lun=0
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (string | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(`${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`);
  }

  const effectiveEnd = dateTo || hovered;

  return (
    <div className="w-full min-w-0 shrink-0 overflow-visible">
      <div className="text-center text-white font-bold mb-3 text-base sm:text-lg truncate">
        {MONTHS[month]} {year}
      </div>
      <div
        className="grid mb-2 gap-0.5"
        style={{ gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}
      >
        {DAYS.map(d => (
          <div key={d} className="text-center text-xs text-blue-300/60 font-bold py-1 min-w-0 truncate">{d}</div>
        ))}
      </div>
      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}
      >
        {cells.map((date, i) => {
          if (!date) return <div key={i} className="aspect-square" />;

          const isPast = date < today;
          const isStart = date === dateFrom;
          const isEnd = date === dateTo || (date === hovered && !dateTo && dateFrom && date > dateFrom);
          const inRange = !!(dateFrom && effectiveEnd && date > dateFrom && date < effectiveEnd && date >= dateFrom);

          let cellClass = 'relative flex items-center justify-center text-sm transition-all aspect-square min-w-0 w-full overflow-hidden ';

          if (isPast) {
            cellClass += 'text-white/20 cursor-not-allowed ';
          } else if (isStart || isEnd) {
            cellClass += 'text-black font-bold cursor-pointer z-10 ';
          } else if (inRange) {
            cellClass += 'bg-blue-500/20 text-white cursor-pointer ';
          } else {
            cellClass += 'text-white hover:text-blue-300 cursor-pointer ';
          }

          return (
            <div
              key={date}
              className={`${inRange ? 'bg-blue-500/15' : ''} ${isStart ? 'rounded-l-full' : ''} ${isEnd && dateTo ? 'rounded-r-full' : ''}`}
            >
              <button
                type="button"
                disabled={isPast}
                onClick={() => !isPast && onSelect(date)}
                onMouseEnter={() => !isPast && onHover(date)}
                onTouchEnd={() => !isPast && onHover(date)}
                className={`${cellClass} w-full rounded-full ${isStart || isEnd ? 'bg-blue-400 shadow-lg shadow-blue-400/50' : ''}`}
              >
                {parseInt(date.split('-')[2])}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface DateRangePickerProps {
  dateFrom: string;
  dateTo: string;
  onChange: (from: string, to: string) => void;
}

function DateRangePicker({ dateFrom, dateTo, onChange }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState('');
  const today = toYMD(new Date());

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const ref = useRef<HTMLDivElement>(null);

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Al abrir, mostrar el mes de la fecha seleccionada o el actual
  useEffect(() => {
    if (open) {
      if (dateFrom) {
        const [y, m] = dateFrom.split('-').map(Number);
        setViewYear(y);
        setViewMonth(m - 1);
      } else {
        const now = new Date();
        setViewYear(now.getFullYear());
        setViewMonth(now.getMonth());
      }
    }
  }, [open, dateFrom]);

  const prevM = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextM = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const handleSelect = (date: string) => {
    if (!dateFrom || (dateFrom && dateTo)) {
      onChange(date, '');
    } else if (date > dateFrom) {
      onChange(dateFrom, date);
      setOpen(false);
    } else {
      onChange(date, '');
    }
  };

  const formatDisplay = (iso: string) => {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    return `${d} ${MONTHS[parseInt(m)-1].slice(0,3)} ${y}`;
  };

  const label = dateFrom
    ? dateTo
      ? `${formatDisplay(dateFrom)} → ${formatDisplay(dateTo)}`
      : `${formatDisplay(dateFrom)} → ?`
    : '';

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-label="Seleccionar fechas del viaje"
        aria-expanded={open}
        aria-haspopup="dialog"
        className={`w-full px-4 py-3 rounded-lg border text-left flex items-center gap-3 transition-all ${
          open
            ? 'bg-blue-500/20 border-blue-400 ring-2 ring-blue-500/40'
            : 'bg-white/10 border-white/20 hover:border-blue-400'
        }`}
      >
        <CalendarDays className="w-5 h-5 text-blue-300 flex-shrink-0" />
        <span className={label ? 'text-white font-medium' : 'text-white/40'}>
          {label || 'Selecciona las fechas del viaje'}
        </span>
        {(dateFrom || dateTo) && (
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onChange('', ''); }}
            aria-label="Borrar fechas seleccionadas"
            className="ml-auto text-white/40 hover:text-white text-lg leading-none"
          >
            ×
          </button>
        )}
      </button>

      {/* Dropdown calendario - z-[10001] para quedar encima del MusicPlayer */}
      {open && (
        <div className="absolute z-[10001] mt-2 inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[min(calc(100vw-2rem),320px)] bg-[#001B44] border border-blue-500/30 rounded-2xl shadow-2xl shadow-black/60 p-4 sm:p-6 overflow-visible"
        >
          {/* Instrucción */}
          <p className="text-blue-300/70 text-xs text-center mb-4 uppercase tracking-widest">
            {!dateFrom ? 'Selecciona la fecha de ida' : !dateTo ? 'Selecciona la fecha de vuelta' : '¡Fechas seleccionadas!'}
          </p>

          {/* Navegación - un único mes */}
          <div className="flex min-w-0 flex-col items-center">
            <div className="flex items-center justify-between w-full mb-2">
              <button type="button" onClick={prevM} aria-label="Mes anterior" className="text-white/50 hover:text-white p-2 transition-colors">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button type="button" onClick={nextM} aria-label="Mes siguiente" className="text-white/50 hover:text-white p-2 transition-colors">
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
            <CalendarMonth
              year={viewYear}
              month={viewMonth}
              dateFrom={dateFrom}
              dateTo={dateTo}
              hovered={hovered}
              today={today}
              onSelect={handleSelect}
              onHover={setHovered}
            />
          </div>

          {/* Resumen */}
          {dateFrom && dateTo && (
            <div className="mt-4 pt-4 border-t border-blue-500/20 flex items-center justify-between">
              <span className="text-blue-200 text-sm">
                📅 {formatDisplay(dateFrom)} → {formatDisplay(dateTo)}
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="bg-blue-500 hover:bg-blue-400 text-white text-sm font-bold px-5 py-2 rounded-lg transition-colors"
              >
                Confirmar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Componente principal ──────────────────────────────────────────────────
export default function MatchSubmission({
  match, proposals, currentUser, onSubmit, onBack,
}: MatchSubmissionProps) {
  const [flightLink, setFlightLink]   = useState('');
  const [price, setPrice]             = useState('');
  const [destination, setDestination] = useState('');
  const [dateFrom, setDateFrom]       = useState('');
  const [dateTo, setDateTo]           = useState('');
  const [submitting, setSubmitting]   = useState(false);
  const [spinning, setSpinning]       = useState(false);
  const [roulettePreview, setRoulettePreview] = useState<string | null>(null);

  const handleRouletteClick = () => {
    if (spinning) return;
    setSpinning(true);
    setRoulettePreview(null);

    const duration = 1800;
    const interval = 60;
    let elapsed = 0;

    const tick = () => {
      elapsed += interval;
      const randomIdx = Math.floor(Math.random() * DESTINOS_RULETA.length);
      setRoulettePreview(DESTINOS_RULETA[randomIdx]);

      if (elapsed < duration) {
        setTimeout(tick, interval);
      } else {
        const finalIdx = Math.floor(Math.random() * DESTINOS_RULETA.length);
        const finalDest = DESTINOS_RULETA[finalIdx];
        setDestination(finalDest);
        setRoulettePreview(null);
        setSpinning(false);
      }
    };
    tick();
  };

  const formatDate = (iso: string) => {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  };

  const datesLabel = dateFrom && dateTo
    ? `${formatDate(dateFrom)} → ${formatDate(dateTo)}`
    : '';

  const canSubmit = flightLink && price && destination && dateFrom && dateTo;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await onSubmit({ flight_link: flightLink, price: parseFloat(price), destination, dates: datesLabel });
    } finally {
      setSubmitting(false);
    }
  };

  const myProposal    = proposals.find(p => p.player_name === currentUser);
  const otherPlayerName = currentUser === match.player1_name ? match.player2_name : match.player1_name;
  const otherProposal = proposals.find(p => p.player_name === otherPlayerName);
  const isMyTurn      = currentUser === match.player1_name || currentUser === match.player2_name;

  // Ya envié propuesta
  if (myProposal) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-2xl mx-auto">
          <button type="button" onClick={onBack} aria-label="Volver al cuadro del torneo" className="text-blue-300 hover:text-white mb-6 transition-colors">← Volver al cuadro</button>
          <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl card-modern-inner mb-5 border-emerald-500/30">
            <Send className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">¡Propuesta enviada!</h1>
          <p className="text-xl text-slate-300/90">
              {otherProposal
                ? 'Los dos habéis enviado vuestra propuesta. ¡Que empiece la votación!'
                : `Esperando a que ${otherPlayerName} envíe la suya...`}
            </p>
          </div>
          <div className="card-modern border-emerald-500/30 bg-emerald-500/5 p-8 mb-6">
            <h3 className="text-lg font-bold text-green-400 mb-4">Tu propuesta</h3>
            <div className="space-y-3">
              {myProposal.destination && (
                <div className="flex justify-between">
                  <span className="text-blue-200">Destino</span>
                  <span className="text-white font-semibold">{myProposal.destination}</span>
                </div>
              )}
              {myProposal.dates && (
                <div className="flex justify-between">
                  <span className="text-blue-200">Fechas</span>
                  <span className="text-white">{myProposal.dates}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-blue-200">Precio</span>
                <span className="text-white font-bold text-xl">{myProposal.price} €</span>
              </div>
            </div>
          </div>
          <div className={`rounded-2xl p-6 border flex items-center gap-4 card-modern-inner ${otherProposal ? 'border-emerald-500/30 bg-emerald-500/5' : ''}`}>
            <Clock className={`w-8 h-8 flex-shrink-0 ${otherProposal ? 'text-green-400' : 'text-blue-400 animate-pulse'}`} />
            <div>
              <p className="text-white font-semibold text-lg">{otherPlayerName}</p>
              <p className={`text-sm ${otherProposal ? 'text-green-400' : 'text-white/50'}`}>
                {otherProposal ? '✓ Propuesta enviada' : 'Preparando su propuesta...'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No es jugador de este partido
  if (!isMyTurn) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center max-w-lg">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl card-modern-inner mb-6">
            <Clock className="w-12 h-12 text-blue-400 animate-pulse" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">Fase de propuestas</h1>
          <p className="text-xl text-slate-300/90 mb-8">
            <span className="font-bold text-white">{match.player1_name}</span> y{' '}
            <span className="font-bold text-white">{match.player2_name}</span> están preparando sus propuestas de viaje.
          </p>
          <button type="button" onClick={onBack} aria-label="Volver al cuadro del torneo" className="text-blue-300 hover:text-white transition-colors">← Volver al cuadro</button>
        </div>
      </div>
    );
  }

  // Formulario del jugador
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <button type="button" onClick={onBack} aria-label="Volver al cuadro del torneo" className="text-blue-300 hover:text-white mb-6 transition-colors">← Volver al cuadro</button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl card-modern-inner mb-4">
            <Plane className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">{match.player1_name} vs {match.player2_name}</h1>
          <p className="text-slate-300/90">Envía tu propuesta de viaje</p>
        </div>

        <div className={`rounded-xl p-4 border mb-8 flex items-center gap-3 card-modern-inner ${otherProposal ? 'border-emerald-500/30 bg-emerald-500/5' : ''}`}>
          <div className={`w-3 h-3 rounded-full flex-shrink-0 ${otherProposal ? 'bg-green-400' : 'bg-white/20 animate-pulse'}`} />
          <span className="text-white/70 text-sm">
            {otherPlayerName}: {otherProposal ? '✓ Propuesta enviada' : 'Preparando su propuesta...'}
          </span>
        </div>

        <div className="card-modern p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Tu propuesta</h2>
          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Enlace al vuelo <span className="text-red-400">*</span>
              </label>
              <input
                type="url"
                value={flightLink}
                onChange={e => setFlightLink(e.target.value)}
                placeholder="https://www.skyscanner.com/..."
                className="input-modern w-full px-4 py-3 text-white placeholder-white/40"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Precio (€) <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder="450"
                className="input-modern w-full px-4 py-3 text-white placeholder-white/40"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Destino <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={spinning ? (roulettePreview ?? '') : destination}
                onChange={e => !spinning && setDestination(e.target.value)}
                placeholder="Bangkok, Tailandia"
                readOnly={spinning}
                className="input-modern w-full px-4 py-3 text-white placeholder-white/40"
                required
              />
              <div className="mt-3 flex items-center justify-center gap-2">
                <span className="text-sm text-blue-300/80">¿No lo tienes claro?</span>
                <button
                  type="button"
                  onClick={handleRouletteClick}
                  disabled={spinning}
                  aria-label={spinning ? 'Ruleta girando' : 'Elegir destino al azar con la ruleta'}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    spinning
                      ? 'bg-blue-500/30 text-blue-300 cursor-wait'
                      : 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/40 hover:text-white hover:scale-105 border border-blue-400/40'
                  }`}
                >
                  <Globe
                    className={`w-5 h-5 ${spinning ? 'animate-spin' : ''}`}
                  />
                  {spinning ? '¡Girando...!' : '¡Juega la ruleta!'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Fechas del viaje <span className="text-red-400">*</span>
              </label>
              <DateRangePicker
                dateFrom={dateFrom}
                dateTo={dateTo}
                onChange={(from, to) => { setDateFrom(from); setDateTo(to); }}
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !canSubmit}
              className={`w-full py-4 rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition-all mt-2 ${
                submitting || !canSubmit
                  ? 'bg-white/5 text-white/40 cursor-not-allowed border border-white/5'
                  : 'btn-primary'
              }`}
            >
              <Send className="w-5 h-5" />
              {submitting ? 'Enviando...' : 'Enviar propuesta'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
