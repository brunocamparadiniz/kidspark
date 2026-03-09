import { useAuthStore } from '@/stores/auth.store';

export function useAuth() {
  const {
    user,
    profile,
    isLoading,
    isAuthenticated,
    initialize,
    signIn,
    signUp,
    signOut,
  } = useAuthStore();

  return {
    user,
    profile,
    isLoading,
    isAuthenticated,
    initialize,
    signIn,
    signUp,
    signOut,
  };
}
