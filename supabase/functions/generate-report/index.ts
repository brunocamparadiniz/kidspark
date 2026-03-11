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
    const { sessionId, language } = await req.json()
    const lang = language ?? 'pt-BR'
    const isPt = lang.startsWith('pt')

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

    const completedCount = session.session_activities.filter((a: { completed: boolean }) => a.completed).length
    const totalCount = session.session_activities.length
    const activitiesList = session.session_activities.map((a: { title: string; activity_type: string; completed: boolean; engagement_score: number }) =>
      `- ${a.title} (${a.activity_type}) — completed: ${a.completed}, engagement: ${a.engagement_score ?? 'n/a'}/5`
    ).join('\n')

    const prompt = `
Analyze this educational session and generate a development report for the parents.
Respond entirely in ${isPt ? 'Brazilian Portuguese (pt-BR)' : 'English'}.

Child: ${session.children.name}
Duration: ${session.duration_minutes} minutes
Initial mood: ${session.mood}
Goals: ${session.goals.join(', ')}
Activities completed: ${completedCount} of ${totalCount}

Activities:
${activitiesList}

Return a JSON with this exact format (no markdown, no extra text):
{
  "summary": "short positive paragraph for parents",
  "skills_practiced": ["skill1", "skill2"],
  "highlights": {
    "best_activity": "name of best activity",
    "engagement_level": "${isPt ? 'alto|medio|baixo' : 'high|medium|low'}",
    "recommendation": "suggestion for next session"
  }
}
`

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''
    const text = raw.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim()
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
