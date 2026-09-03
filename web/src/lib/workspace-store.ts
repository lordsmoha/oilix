import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type WorkspaceId = 'mill' | 'sales';

type WorkspaceState = {
  workspace: WorkspaceId | null;
  setWorkspace: (w: WorkspaceId) => void;
  clearWorkspace: () => void;
};

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      workspace: null,
      setWorkspace: (workspace) => set({ workspace }),
      clearWorkspace: () => set({ workspace: null }),
    }),
    { name: 'oilix_workspace' },
  ),
);

export function workspaceHome(w: WorkspaceId) {
  return w === 'sales' ? '/sales' : '/dashboard';
}

export function workspaceLoginPath(w: WorkspaceId) {
  return `/login?workspace=${w}`;
}
