import Anthropic from 'npm:@anthropic-ai/sdk'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SESSION_SYSTEM_PROMPT = `
You are an expert educator in child development for ages 2-5.
Create interactive, playful learning sessions.

Rules:
- Always return valid JSON, no markdown, no extra text
- Each activity: 2-5 minutes
- Simple language, short sentences, positivity
- Vary activity types for engagement
- Adapt to mood (energetic = more structure, sleepy = calmer activities)
- Respond in the language specified in the "language" field (default: pt-BR)
`

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { sessionId, config, childName } = await req.json()

    const client = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') })

    const language = config.language ?? 'pt-BR'

    const prompt = `
Create an educational session for ${childName}.

Configuration:
- Total duration: ${config.durationMinutes} minutes
- Child's current mood: ${config.mood}
- Learning goals: ${config.goals.join(', ')}
- Language: ${language}

Return a JSON with this exact format:
{
  "activities": [
    {
      "type": "story" | "song" | "minigame" | "question" | "drawing",
      "title": "string",
      "duration_minutes": number,
      "content": {
        // for story: { "text": "...", "pages": [...] }
        // for song: { "lyrics": "...", "rhythm": "slow|fast" }
        // for minigame: { "instructions": "...", "elements": [...] }
        // for question: { "question": "...", "hint": "..." }
        // for drawing: { "prompt": "...", "colors": [...] }
      }
    }
  ]
}
`

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      system: SESSION_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const parsed = JSON.parse(text)

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
