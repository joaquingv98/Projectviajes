import { useState, useRef, useEffect } from 'react';
import { Match, Proposal } from '../lib/supabase';
import { Plane, Send, Clock, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';

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
    <div className="w-72">
      <div className="text-center text-white font-bold mb-3 text-lg">
        {MONTHS[month]} {year}
      </div>
      <div className="grid grid-cols-7 mb-2">
        {DAYS.map(d => (
          <div key={d} className="text-center text-xs text-blue-300/60 font-bold py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((date, i) => {
          if (!date) return <div key={i} />;

          const isPast = date < today;
          const isStart = date === dateFrom;
          const isEnd = date === dateTo || (date === hovered && !dateTo && dateFrom && date > dateFrom);
          const inRange = !!(dateFrom && effectiveEnd && date > dateFrom && date < effectiveEnd && date >= dateFrom);

          let cellClass = 'relative flex items-center justify-center h-9 text-sm transition-all ';

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
              className={`${inRange ? 'bg-blue-500/15' : ''} ${
                isStart ? 'rounded-l-full' : ''
              } ${isEnd && dateTo ? 'rounded-r-full' : ''}`}
            >
              <button
                type="button"
                disabled={isPast}
                onClick={() => !isPast && onSelect(date)}
                onMouseEnter={() => !isPast && onHover(date)}
                className={`${cellClass} w-full h-9 rounded-full ${
                  isStart || isEnd
                    ? 'bg-blue-400 shadow-lg shadow-blue-400/50'
                    : ''
                }`}
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

  const month2 = viewMonth === 11 ? 0 : viewMonth + 1;
  const year2  = viewMonth === 11 ? viewYear + 1 : viewYear;

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
            className="ml-auto text-white/40 hover:text-white text-lg leading-none"
          >
            ×
          </button>
        )}
      </button>

      {/* Dropdown calendario */}
      {open && (
        <div className="absolute z-50 mt-2 left-1/2 -translate-x-1/2 bg-[#001B44] border border-blue-500/30 rounded-2xl shadow-2xl shadow-black/60 p-6"
          style={{ minWidth: 620 }}
        >
          {/* Instrucción */}
          <p className="text-blue-300/70 text-xs text-center mb-4 uppercase tracking-widest">
            {!dateFrom ? 'Selecciona la fecha de ida' : !dateTo ? 'Selecciona la fecha de vuelta' : '¡Fechas seleccionadas!'}
          </p>

          {/* Navegación */}
          <div className="flex items-start gap-8">
            <button type="button" onClick={prevM} className="text-white/50 hover:text-white mt-1 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>

            <CalendarMonth
              year={viewYear} month={viewMonth}
              dateFrom={dateFrom} dateTo={dateTo}
              hovered={hovered} today={today}
              onSelect={handleSelect}
              onHover={setHovered}
            />

            <div className="w-px bg-blue-500/20 self-stretch mx-1" />

            <CalendarMonth
              year={year2} month={month2}
              dateFrom={dateFrom} dateTo={dateTo}
              hovered={hovered} today={today}
              onSelect={handleSelect}
              onHover={setHovered}
            />

            <button type="button" onClick={nextM} className="text-white/50 hover:text-white mt-1 transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
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
    await onSubmit({ flight_link: flightLink, price: parseFloat(price), destination, dates: datesLabel });
    setSubmitting(false);
  };

  const myProposal    = proposals.find(p => p.player_name === currentUser);
  const otherPlayerName = currentUser === match.player1_name ? match.player2_name : match.player1_name;
  const otherProposal = proposals.find(p => p.player_name === otherPlayerName);
  const isMyTurn      = currentUser === match.player1_name || currentUser === match.player2_name;

  // Ya envié propuesta
  if (myProposal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#001B44] via-[#002855] to-[#003366] p-6">
        <div className="max-w-2xl mx-auto">
          <button onClick={onBack} className="text-blue-300 hover:text-white mb-6 transition-colors">← Volver al cuadro</button>
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/20 rounded-full mb-5">
              <Send className="w-10 h-10 text-green-400" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-3">¡Propuesta enviada!</h1>
            <p className="text-xl text-blue-200">
              {otherProposal
                ? 'Los dos habéis enviado vuestra propuesta. ¡Que empiece la votación!'
                : `Esperando a que ${otherPlayerName} envíe la suya...`}
            </p>
          </div>
          <div className="bg-green-500/10 border border-green-400/40 rounded-2xl p-8 mb-6">
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
          <div className={`rounded-2xl p-6 border flex items-center gap-4 ${otherProposal ? 'bg-green-500/10 border-green-400/40' : 'bg-white/5 border-white/10'}`}>
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
      <div className="min-h-screen bg-gradient-to-br from-[#001B44] via-[#002855] to-[#003366] flex items-center justify-center p-6">
        <div className="text-center max-w-lg">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-blue-500/20 rounded-full mb-6">
            <Clock className="w-12 h-12 text-blue-400 animate-pulse" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Fase de propuestas</h1>
          <p className="text-xl text-blue-200 mb-8">
            <span className="font-bold text-white">{match.player1_name}</span> y{' '}
            <span className="font-bold text-white">{match.player2_name}</span> están preparando sus propuestas de viaje.
          </p>
          <button onClick={onBack} className="text-blue-300 hover:text-white transition-colors">← Volver al cuadro</button>
        </div>
      </div>
    );
  }

  // Formulario del jugador
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#001B44] via-[#002855] to-[#003366] p-6">
      <div className="max-w-4xl mx-auto">
        <button onClick={onBack} className="text-blue-300 hover:text-white mb-6 transition-colors">← Volver al cuadro</button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/20 rounded-full mb-4">
            <Plane className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">{match.player1_name} vs {match.player2_name}</h1>
          <p className="text-blue-200">Envía tu propuesta de viaje</p>
        </div>

        <div className={`rounded-xl p-4 border mb-8 flex items-center gap-3 ${otherProposal ? 'bg-green-500/10 border-green-400/40' : 'bg-white/5 border-white/10'}`}>
          <div className={`w-3 h-3 rounded-full flex-shrink-0 ${otherProposal ? 'bg-green-400' : 'bg-white/20 animate-pulse'}`} />
          <span className="text-white/70 text-sm">
            {otherPlayerName}: {otherProposal ? '✓ Propuesta enviada' : 'Preparando su propuesta...'}
          </span>
        </div>

        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10">
          <h2 className="text-2xl font-bold text-white mb-6">Tu propuesta</h2>
          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Enlace al vuelo <span className="text-red-400">*</span>
              </label>
              <input
                type="url"
                value={flightLink}
                onChange={e => setFlightLink(e.target.value)}
                placeholder="https://www.skyscanner.com/..."
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Precio (€) <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder="450"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Destino <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={destination}
                onChange={e => setDestination(e.target.value)}
                placeholder="Bangkok, Tailandia"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">
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
                  ? 'bg-white/10 text-white/40 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-xl hover:shadow-blue-500/50 hover:scale-[1.02]'
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
