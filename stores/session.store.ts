import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { useChildStore } from '@/stores/child.store';
import type { Session, SessionConfig, Activity } from '@/types';

interface SessionState {
  currentSession: Session | null;
  recentSessions: Session[];
  isLoading: boolean;
  createSession: (config: SessionConfig) => Promise<{ error: string | null }>;
  fetchRecentSessions: (childId: string) => Promise<void>;
}

export const useSessionStore = create<SessionState>((set) => ({
  currentSession: null,
  recentSessions: [],
  isLoading: false,

  createSession: async (config) => {
    set({ isLoading: true });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      set({ isLoading: false });
      return { error: 'Não autenticado' };
    }

    // Create session row
    const { data: sessionRow, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        child_id: config.childId,
        parent_id: user.id,
        duration_minutes: config.durationMinutes,
        mood: config.mood,
        goals: config.goals,
        status: 'pending',
      })
      .select()
      .single();

    if (sessionError || !sessionRow) {
      set({ isLoading: false });
      return { error: sessionError?.message ?? 'Erro ao criar sessão' };
    }

    // Get child name for the edge function prompt
    const childState = useChildStore.getState();
    const child = childState.children.find((c) => c.id === config.childId);
    const childName = child?.name ?? 'Crianca';

    // Call Edge Function to generate activities
    const { data: generatedData, error: fnError } = await supabase.functions.invoke(
      'generate-session',
      {
        body: {
          sessionId: sessionRow.id,
          config,
          childName,
        },
      },
    );

    if (fnError) {
      set({ isLoading: false });
      return { error: `Erro ao gerar atividades: ${fnError.message}` };
    }

    // Save generated activities to session_activities
    const activities: Activity[] = [];
    const generatedActivities = generatedData?.activities ?? [];

    for (let i = 0; i < generatedActivities.length; i++) {
      const act = generatedActivities[i];
      const { data: actRow, error: actError } = await supabase
        .from('session_activities')
        .insert({
          session_id: sessionRow.id,
          activity_type: act.type,
          title: act.title,
          content: act.content,
          order_index: i,
          completed: false,
        })
        .select()
        .single();

      if (!actError && actRow) {
        activities.push({
          id: actRow.id,
          sessionId: actRow.session_id,
          type: actRow.activity_type,
          title: actRow.title,
          content: actRow.content,
          completed: actRow.completed,
          orderIndex: actRow.order_index,
        });
      }
    }

    const session: Session = {
      id: sessionRow.id,
      childId: sessionRow.child_id,
      parentId: sessionRow.parent_id,
      config,
      activities,
      status: 'pending',
      createdAt: sessionRow.created_at,
    };

    set({ currentSession: session, isLoading: false });
    return { error: null };
  },

  fetchRecentSessions: async (childId) => {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('child_id', childId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error || !data) return;

    const sessions: Session[] = data.map((row: Record<string, string | number | string[]>) => ({
      id: row.id,
      childId: row.child_id,
      parentId: row.parent_id,
      config: {
        childId: row.child_id,
        durationMinutes: row.duration_minutes,
        mood: row.mood,
        goals: row.goals,
      },
      activities: [],
      status: row.status,
      startedAt: row.started_at ?? undefined,
      endedAt: row.ended_at ?? undefined,
      createdAt: row.created_at,
    }));

    set({ recentSessions: sessions });
  },
}));
