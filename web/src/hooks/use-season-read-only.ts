'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useSeasonStore } from '@/lib/season-store';

export type SeasonContext = {
  activeSeason: { id: string; name: string } | null;
  viewSeason: { id: string; name: string } | null;
  viewSeasonId: string;
  activeSeasonId: string;
  readOnly: boolean;
};

export function useSeasonReadOnly() {
  const viewSeasonId = useSeasonStore((s) => s.viewSeasonId);
  const viewSeasonName = useSeasonStore((s) => s.viewSeasonName);
  const clearViewSeason = useSeasonStore((s) => s.clearViewSeason);

  const { data: context, isLoading } = useQuery({
    queryKey: ['season-context', viewSeasonId],
    queryFn: async () => (await api.get<SeasonContext>('/seasons/context')).data,
  });

  const readOnly = context?.readOnly ?? Boolean(viewSeasonId);
  const displaySeasonName =
    context?.viewSeason?.name ?? viewSeasonName ?? 'موسم سابق';
  const activeSeasonName = context?.activeSeason?.name ?? 'الموسم الحالي';

  return {
    readOnly,
    isLoading,
    context,
    viewSeasonId,
    viewSeasonName: displaySeasonName,
    activeSeasonName,
    clearViewSeason,
  };
}
