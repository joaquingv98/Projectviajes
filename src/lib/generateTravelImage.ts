import { supabase } from './supabase';

export interface GenerateTravelImageParams {
  destination: string;
  numParticipants: number;
}

export interface GenerateTravelImageResult {
  url: string;
}

export async function generateTravelImage(
  params: GenerateTravelImageParams
): Promise<GenerateTravelImageResult> {
  const { data, error } = await supabase.functions.invoke('generate-travel-image', {
    body: {
      destination: params.destination,
      numParticipants: params.numParticipants,
    },
  });

  if (error) {
    throw new Error(error.message || 'Error al invocar la función');
  }

  const result = data as { url?: string; error?: string } | null;
  if (result?.error) {
    throw new Error(typeof result.error === 'string' ? result.error : 'Error al generar la imagen');
  }

  const url = result?.url;
  if (!url) {
    throw new Error('No se recibió URL de imagen');
  }

  return { url };
}
