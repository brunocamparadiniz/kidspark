import Anthropic from 'npm:@anthropic-ai/sdk'
import { createClient } from 'npm:@supabase/supabase-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { sessionId } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: session } = await supabase
      .from('sessions')
      .select('*, session_activities(*), children(name, birth_date)')
      .eq('id', sessionId)
      .single()

    if (!session) {
      return new Response(JSON.stringify({ error: 'Session not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const client = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') })

    const prompt = `
Analise esta sessao educativa e gere um relatorio de desenvolvimento para os pais.

Crianca: ${session.children.name}
Duracao: ${session.duration_minutes} minutos
Humor inicial: ${session.mood}
Objetivos: ${session.goals.join(', ')}
Atividades completadas: ${session.session_activities.filter((a: { completed: boolean }) => a.completed).length} de ${session.session_activities.length}

Atividades:
${session.session_activities.map((a: { title: string; activity_type: string; completed: boolean; engagement_score: number }) => `- ${a.title} (${a.activity_type}) — completada: ${a.completed}, engajamento: ${a.engagement_score ?? 'n/a'}/5`).join('\n')}

Retorne um JSON com este formato:
{
  "summary": "paragrafo curto e positivo para os pais",
  "skills_practiced": ["habilidade1", "habilidade2"],
  "highlights": {
    "best_activity": "nome da melhor atividade",
    "engagement_level": "alto|medio|baixo",
    "recommendation": "sugestao para proxima sessao"
  }
}
`

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const parsed = JSON.parse(text)

    const { data: report } = await supabase
      .from('development_reports')
      .insert({
        child_id: session.child_id,
        session_id: sessionId,
        summary: parsed.summary,
        skills_practiced: parsed.skills_practiced,
        highlights: parsed.highlights,
      })
      .select()
      .single()

    return new Response(JSON.stringify(report), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
