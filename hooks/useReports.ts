import { useReportStore } from '@/stores/report.store';

export function useReports() {
  const reports = useReportStore((s) => s.reports);
  const isLoading = useReportStore((s) => s.isLoading);
  const fetchReports = useReportStore((s) => s.fetchReports);

  return { reports, isLoading, fetchReports };
}
