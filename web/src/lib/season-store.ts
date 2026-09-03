import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SeasonListItem = {
  id: string;
  name: string;
  startDate: string;
  endDate?: string | null;
  isActive: boolean;
  entryCount: number;
  clientCount: number;
};

type SeasonState = {
  viewSeasonId: string | null;
  viewSeasonName: string | null;
  setViewSeason: (id: string, name: string) => void;
  clearViewSeason: () => void;
};

export const useSeasonStore = create<SeasonState>()(
  persist(
    (set) => ({
      viewSeasonId: null,
      viewSeasonName: null,
      setViewSeason: (id, name) => set({ viewSeasonId: id, viewSeasonName: name }),
      clearViewSeason: () => set({ viewSeasonId: null, viewSeasonName: null }),
    }),
    { name: 'oilix_view_season' },
  ),
);
