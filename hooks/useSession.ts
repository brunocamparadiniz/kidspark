import { useSessionStore } from '@/stores/session.store';

export function useSession() {
  const currentSession = useSessionStore((s) => s.currentSession);
  const recentSessions = useSessionStore((s) => s.recentSessions);
  const isLoading = useSessionStore((s) => s.isLoading);
  const createSession = useSessionStore((s) => s.createSession);
  const completeActivity = useSessionStore((s) => s.completeActivity);
  const completeSession = useSessionStore((s) => s.completeSession);
  const fetchRecentSessions = useSessionStore((s) => s.fetchRecentSessions);

  return {
    currentSession,
    recentSessions,
    isLoading,
    createSession,
    completeActivity,
    completeSession,
    fetchRecentSessions,
  };
}
