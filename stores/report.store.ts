import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { DevelopmentReport } from '@/types';

interface ReportRow {
  id: string;
  child_id: string;
  session_id: string;
  summary: string;
  skills_practiced: string[];
  highlights: Record<string, unknown>;
  created_at: string;
}

interface ReportState {
  reports: DevelopmentReport[];
  isLoading: boolean;
  isGenerating: boolean;
  setGenerating: (val: boolean) => void;
  fetchReports: (childId: string) => Promise<void>;
  addReport: (report: DevelopmentReport) => void;
}

export const useReportStore = create<ReportState>((set) => ({
  reports: [],
  isLoading: false,
  isGenerating: false,
  setGenerating: (val) => set({ isGenerating: val }),

  fetchReports: async (childId) => {
    set({ isLoading: true });

    const { data, error } = await supabase
      .from('development_reports')
      .select('*')
      .eq('child_id', childId)
      .order('created_at', { ascending: false });

    if (error || !data) {
      set({ isLoading: false });
      return;
    }

    const reports: DevelopmentReport[] = data.map((row: ReportRow) => ({
      id: row.id,
      childId: row.child_id,
      sessionId: row.session_id,
      summary: row.summary,
      skillsPracticed: row.skills_practiced,
      highlights: row.highlights,
      createdAt: row.created_at,
    }));

    set({ reports, isLoading: false });
  },

  addReport: (report) => {
    set((state) => ({
      reports: [report, ...state.reports],
    }));
  },
}));
