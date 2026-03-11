// Supabase Edge Function: genera una imagen con DALL-E 3 de un grupo disfrutando en el destino
// Requiere: OPENAI_API_KEY en los secrets del proyecto

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'OPENAI_API_KEY no configurada. Configúrala en Supabase: Project Settings > Edge Functions > Secrets.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { destination, numParticipants } = (await req.json()) as { destination?: string; numParticipants?: number };
    const dest = destination?.trim() || 'un destino de vacaciones';
    const n = typeof numParticipants === 'number' && numParticipants > 0 ? numParticipants : 4;

    const prompt = `Un grupo de ${n} amigos disfrutando de sus vacaciones en ${dest}. Foto de viaje alegre, estilo fotográfico realista, ambiente festivo, calidad alta.`;

    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size: '1024x1024',
        response_format: 'url',
        quality: 'standard',
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      const errMsg = data.error?.message || data.message || 'Error de OpenAI';
      return new Response(
        JSON.stringify({ error: errMsg }),
        { status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = data.data?.[0]?.url;
    if (!url) {
      return new Response(
        JSON.stringify({ error: 'OpenAI no devolvió URL de imagen' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ url }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'Error inesperado' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
