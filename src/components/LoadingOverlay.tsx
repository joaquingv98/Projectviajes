import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export default function LoadingOverlay({ visible, message = 'Cargando...' }: LoadingOverlayProps) {
  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-4 rounded-2xl bg-[#001B44]/95 border border-blue-500/30 px-8 py-6 shadow-2xl">
        <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
        <p className="text-white font-medium text-lg">{message}</p>
      </div>
    </div>
  );
}
