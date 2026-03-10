import { useEffect } from 'react';
import { useChildStore } from '@/stores/child.store';
import { useAuthStore } from '@/stores/auth.store';

export function useChildProfile() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const children = useChildStore((s) => s.children);
  const selectedChild = useChildStore((s) => s.selectedChild);
  const isLoading = useChildStore((s) => s.isLoading);
  const fetchChildren = useChildStore((s) => s.fetchChildren);
  const addChild = useChildStore((s) => s.addChild);
  const selectChild = useChildStore((s) => s.selectChild);

  useEffect(() => {
    if (isAuthenticated) {
      fetchChildren();
    }
  }, [isAuthenticated]);

  return { children, selectedChild, isLoading, addChild, selectChild };
}
