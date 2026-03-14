import { useState } from 'react';
import { toast } from 'sonner';
import { Proposal } from '../lib/supabase';
import { Trophy, ExternalLink, Plane, Calendar, DollarSign, Share2 } from 'lucide-react';

interface WinnerScreenProps {
  winningProposal: Proposal;
  participants: string[];
  tournamentName?: string;
  onNewTournament: () => void;
}

export default function WinnerScreen({ winningProposal, tournamentName, onNewTournament }: WinnerScreenProps) {
  const [shared, setShared] = useState(false);

  const handleShareResult = () => {
    const text = `¡Viaje ganador! 🏆\n${winningProposal.destination || 'Destino'} - ${winningProposal.player_name}\n${winningProposal.price} €${winningProposal.dates ? `\n${winningProposal.dates}` : ''}\n${winningProposal.flight_link}`;
    navigator.clipboard.writeText(text).then(() => {
      setShared(true);
      toast.success('Resultado copiado al portapapeles');
      setTimeout(() => setShared(false), 2500);
    }).catch(() => {
      toast.error('No se pudo copiar');
    });
  };
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl mb-6 animate-bounce" style={{ background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)', boxShadow: '0 8px 32px rgba(234, 179, 8, 0.4)' }}>
            <Trophy className="w-12 h-12 text-black" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-3 tracking-tight">
            {tournamentName && tournamentName !== 'Travel Tournament' ? `${tournamentName} — ¡Ganador!` : '¡Viaje ganador!'}
          </h1>
          <p className="text-2xl text-slate-300/90">
            ¡Enhorabuena, {winningProposal.player_name}!
          </p>
        </div>

        <div className="card-modern p-8 mb-8 border-yellow-400/30">
          <div className="space-y-6">
            {winningProposal.destination && (
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl card-modern-inner">
                  <Plane className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <div className="text-sm text-slate-400 mb-1">Destino</div>
                  <div className="text-3xl font-bold text-white">{winningProposal.destination}</div>
                </div>
              </div>
            )}

            {winningProposal.dates && (
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl card-modern-inner">
                  <Calendar className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <div className="text-sm text-slate-400 mb-1">Fechas</div>
                  <div className="text-xl font-semibold text-white">{winningProposal.dates}</div>
                </div>
              </div>
            )}

            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl card-modern-inner">
                <DollarSign className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <div className="text-sm text-slate-400 mb-1">Precio</div>
                <div className="text-4xl font-bold text-white">{winningProposal.price} €</div>
              </div>
            </div>

            <a
              href={winningProposal.flight_link}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary w-full py-4 text-lg"
            >
              <ExternalLink className="w-5 h-5" />
              Ver reserva del vuelo
            </a>
          </div>
        </div>

        <button
          type="button"
          onClick={handleShareResult}
          aria-label="Compartir resultado del torneo"
          className="w-full py-4 text-lg mb-4 flex items-center justify-center gap-2 rounded-xl font-semibold bg-white/10 hover:bg-white/15 border border-white/20 text-white transition-all"
        >
          <Share2 className="w-5 h-5" />
          {shared ? '¡Copiado!' : 'Compartir resultado'}
        </button>

        <button
          type="button"
          onClick={onNewTournament}
          aria-label="Crear nuevo torneo"
          className="btn-secondary w-full py-4 text-lg"
        >
          Nuevo torneo
        </button>
      </div>
    </div>
  );
}
