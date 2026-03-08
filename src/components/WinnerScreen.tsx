import { Proposal } from '../lib/supabase';
import { Trophy, ExternalLink, Plane, Calendar, DollarSign } from 'lucide-react';

interface WinnerScreenProps {
  winningProposal: Proposal;
  onNewTournament: () => void;
}

export default function WinnerScreen({ winningProposal, onNewTournament }: WinnerScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#001B44] via-[#002855] to-[#003366] flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full mb-6 animate-bounce">
            <Trophy className="w-16 h-16 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-3">¡Viaje ganador!</h1>
          <p className="text-2xl text-blue-200">
            ¡Enhorabuena, {winningProposal.player_name}!
          </p>
        </div>

        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-2xl p-8 border-2 border-yellow-400/50 shadow-2xl shadow-yellow-400/20 mb-8">
          <div className="space-y-6">
            {winningProposal.destination && (
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-500/20 rounded-lg">
                  <Plane className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <div className="text-sm text-blue-200 mb-1">Destino</div>
                  <div className="text-3xl font-bold text-white">{winningProposal.destination}</div>
                </div>
              </div>
            )}

            {winningProposal.dates && (
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-500/20 rounded-lg">
                  <Calendar className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <div className="text-sm text-blue-200 mb-1">Fechas</div>
                  <div className="text-xl font-semibold text-white">{winningProposal.dates}</div>
                </div>
              </div>
            )}

            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-500/20 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <div className="text-sm text-blue-200 mb-1">Precio</div>
                <div className="text-4xl font-bold text-white">{winningProposal.price} €</div>
              </div>
            </div>

            <a
              href={winningProposal.flight_link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold text-lg rounded-xl hover:shadow-xl hover:shadow-blue-500/50 hover:scale-[1.02] transition-all"
            >
              <ExternalLink className="w-5 h-5" />
              Ver reserva del vuelo
            </a>
          </div>
        </div>

        <button
          onClick={onNewTournament}
          className="w-full py-4 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 text-white font-bold text-lg rounded-xl transition-all"
        >
          Nuevo torneo
        </button>
      </div>
    </div>
  );
}
