import { useEffect } from 'react';
import { useChildStore } from '@/stores/child.store';
import { useAuthStore } from '@/stores/auth.store';

export function useChildProfile() {
  const { children, selectedChild, isLoading, fetchChildren, addChild, selectChild } =
    useChildStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      fetchChildren();
    }
  }, [isAuthenticated]);

  return {
    children,
    selectedChild,
    isLoading,
    fetchChildren,
    addChild,
    selectChild,
  };
}
