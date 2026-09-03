import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const DEFAULT_NOTIFICATION_VOLUME = 0.72;

type NotificationSoundState = {
  enabled: boolean;
  /** 0–1 */
  volume: number;
  setEnabled: (enabled: boolean) => void;
  setVolume: (volume: number) => void;
  toggle: () => void;
};

export const useNotificationSoundStore = create<NotificationSoundState>()(
  persist(
    (set, get) => ({
      enabled: true,
      volume: DEFAULT_NOTIFICATION_VOLUME,
      setEnabled: (enabled) => set({ enabled }),
      setVolume: (volume) =>
        set({ volume: Math.max(0, Math.min(1, volume)) }),
      toggle: () => set({ enabled: !get().enabled }),
    }),
    {
      name: 'oilix-notification-sound',
      version: 1,
      migrate: (persisted) => {
        const state = persisted as Partial<NotificationSoundState>;
        return {
          enabled: state.enabled ?? true,
          volume:
            typeof state.volume === 'number'
              ? Math.max(0, Math.min(1, state.volume))
              : DEFAULT_NOTIFICATION_VOLUME,
        };
      },
    },
  ),
);
