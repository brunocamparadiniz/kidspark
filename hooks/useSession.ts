import { useSessionStore } from '@/stores/session.store';

export function useSession() {
  const { currentSession, recentSessions, isLoading, createSession, fetchRecentSessions } =
    useSessionStore();

  return {
    currentSession,
    recentSessions,
    isLoading,
    createSession,
    fetchRecentSessions,
  };
}
