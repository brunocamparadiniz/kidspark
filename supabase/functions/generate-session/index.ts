import Anthropic from 'npm:@anthropic-ai/sdk'

const SESSION_SYSTEM_PROMPT = `
Voce e um educador especialista em desenvolvimento infantil de 2 a 5 anos.
Sua tarefa e criar sessoes de aprendizado interativas, ludicas e adaptadas.

Regras:
- Sempre retorne JSON valido, sem markdown, sem texto extra
- Atividades devem ser curtas: 2-5 minutos cada
- Linguagem simples, frases curtas, muita positividade
- Variar tipos de atividade para manter engajamento
- Adaptar ao humor informado (agitada = mais estrutura, sonolenta = mais calma)
`

Deno.serve(async (req: Request) => {
  try {
    const { config, childName } = await req.json()

    const client = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') })

    const prompt = `
Crie uma sessao educativa para ${childName}.

Configuracao:
- Duracao total: ${config.durationMinutes} minutos
- Humor atual da crianca: ${config.mood}
- Objetivos de aprendizado: ${config.goals.join(', ')}

Retorne um JSON com este formato exato:
{
  "activities": [
    {
      "type": "story" | "song" | "minigame" | "question" | "drawing",
      "title": "string",
      "duration_minutes": number,
      "content": {
        // para story: { "text": "...", "pages": [...] }
        // para song: { "lyrics": "...", "rhythm": "slow|fast" }
        // para minigame: { "instructions": "...", "elements": [...] }
        // para question: { "question": "...", "hint": "..." }
        // para drawing: { "prompt": "...", "colors": [...] }
      }
    }
  ]
}
`

    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 2048,
      system: SESSION_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const parsed = JSON.parse(text)

    return new Response(JSON.stringify(parsed), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
