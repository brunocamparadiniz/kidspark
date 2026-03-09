import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { Child } from '@/types';

interface ChildState {
  children: Child[];
  selectedChild: Child | null;
  isLoading: boolean;
  fetchChildren: () => Promise<void>;
  addChild: (name: string, birthDate: string) => Promise<{ error: string | null }>;
  selectChild: (child: Child) => void;
}

export const useChildStore = create<ChildState>((set) => ({
  children: [],
  selectedChild: null,
  isLoading: false,

  fetchChildren: async () => {
    set({ isLoading: true });
    const { data, error } = await supabase
      .from('children')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      set({ isLoading: false });
      return;
    }

    const children: Child[] = (data ?? []).map((row: Record<string, string>) => ({
      id: row.id,
      parentId: row.parent_id,
      name: row.name,
      birthDate: row.birth_date,
      avatarUrl: row.avatar_url ?? undefined,
    }));

    set({ children, isLoading: false });

    // Auto-select first child if none selected
    const current = useChildStore.getState().selectedChild;
    if (!current && children.length > 0) {
      set({ selectedChild: children[0] });
    }
  },

  addChild: async (name, birthDate) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Não autenticado' };

    const { data, error } = await supabase
      .from('children')
      .insert({ parent_id: user.id, name, birth_date: birthDate })
      .select()
      .single();

    if (error) return { error: error.message };

    const child: Child = {
      id: data.id,
      parentId: data.parent_id,
      name: data.name,
      birthDate: data.birth_date,
      avatarUrl: data.avatar_url ?? undefined,
    };

    set((state) => ({
      children: [...state.children, child],
      selectedChild: state.selectedChild ?? child,
    }));

    return { error: null };
  },

  selectChild: (child) => set({ selectedChild: child }),
}));
