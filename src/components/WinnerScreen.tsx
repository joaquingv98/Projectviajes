import { useState } from 'react';
import { Proposal } from '../lib/supabase';
import { generateTravelImage } from '../lib/generateTravelImage';
import { Trophy, ExternalLink, Plane, Calendar, DollarSign, Sparkles, Loader2, Download, AlertCircle } from 'lucide-react';

interface WinnerScreenProps {
  winningProposal: Proposal;
  participants: string[];
  onNewTournament: () => void;
}

export default function WinnerScreen({ winningProposal, participants, onNewTournament }: WinnerScreenProps) {
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateImage = async () => {
    setLoading(true);
    setError(null);
    try {
      const { url } = await generateTravelImage({
        destination: winningProposal.destination || 'un destino de vacaciones',
        numParticipants: participants.length || 4,
      });
      setGeneratedImageUrl(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo generar la imagen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl mb-6 animate-bounce" style={{ background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)', boxShadow: '0 8px 32px rgba(234, 179, 8, 0.4)' }}>
            <Trophy className="w-12 h-12 text-black" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-3 tracking-tight">¡Viaje ganador!</h1>
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

            {/* Generar foto con IA */}
            <div className="pt-4 border-t border-white/10">
              {generatedImageUrl ? (
                <div className="space-y-4">
                  <p className="text-slate-300 text-sm font-medium">Tu foto generada con IA</p>
                  <div className="rounded-xl overflow-hidden border border-white/10">
                    <img
                      src={generatedImageUrl}
                      alt="Grupo de amigos en el destino"
                      className="w-full h-auto object-cover"
                    />
                  </div>
                  <a
                    href={generatedImageUrl}
                    download="viaje-ganador.png"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary w-full py-3 flex items-center justify-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    Descargar imagen
                  </a>
                </div>
              ) : (
                <>
                  <button
                    onClick={handleGenerateImage}
                    disabled={loading}
                    className={`w-full py-4 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2 ${
                      loading
                        ? 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/5'
                        : 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-400/30 text-white hover:from-purple-500/30 hover:to-blue-500/30'
                    }`}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Generando imagen...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 text-amber-400" />
                        Generar foto con IA
                      </>
                    )}
                  </button>
                  <p className="text-slate-500 text-xs text-center mt-2">
                    Crea una imagen de tu grupo disfrutando en {winningProposal.destination || 'el destino'}
                  </p>
                  {error && (
                    <div className="flex items-center gap-2 mt-2 p-3 rounded-lg bg-red-500/10 border border-red-400/20 text-red-300 text-sm">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {error}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={onNewTournament}
          className="btn-secondary w-full py-4 text-lg"
        >
          Nuevo torneo
        </button>
      </div>
    </div>
  );
}
