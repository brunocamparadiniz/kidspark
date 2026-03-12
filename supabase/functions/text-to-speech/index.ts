const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ELEVENLABS_VOICE_ID = 'Z3R5wn05IrDiVCyEkUrK'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { text } = await req.json()

    if (!text || typeof text !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid "text" field' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const apiKey = Deno.env.get('ELEVENLABS_API_KEY')
    if (!apiKey) {
      console.error('[text-to-speech] ELEVENLABS_API_KEY not found in environment')
      return new Response(
        JSON.stringify({ error: 'ELEVENLABS_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    console.log(`[text-to-speech] Requesting TTS for ${text.length} chars`)

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.4,
          },
        }),
      },
    )

    console.log(`[text-to-speech] ElevenLabs response status: ${response.status}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[text-to-speech] ElevenLabs error (${response.status}): ${errorText}`)
      throw new Error(`ElevenLabs API error: ${response.status}`)
    }

    const audioBuffer = await response.arrayBuffer()
    const bytes = new Uint8Array(audioBuffer)
    console.log(`[text-to-speech] Received ${bytes.length} bytes of audio`)

    // Convert to base64 in chunks to avoid stack overflow on large buffers
    let binary = ''
    const chunkSize = 8192
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize)
      binary += String.fromCharCode(...chunk)
    }
    const base64 = btoa(binary)

    return new Response(
      JSON.stringify({ audio: base64 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('[text-to-speech] Error:', (err as Error).message)
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
