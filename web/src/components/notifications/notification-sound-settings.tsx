'use client';

import { Volume2, VolumeX, Play } from 'lucide-react';
import { useNotificationSoundStore } from '@/lib/notification-sound-store';
import {
  playNotificationSound,
  syncNotificationSoundVolume,
  unlockNotificationSound,
} from '@/lib/notification-sound';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type Props = {
  className?: string;
  compact?: boolean;
};

export function NotificationSoundSettings({ className, compact }: Props) {
  const enabled = useNotificationSoundStore((s) => s.enabled);
  const volume = useNotificationSoundStore((s) => s.volume);
  const setEnabled = useNotificationSoundStore((s) => s.setEnabled);
  const setVolume = useNotificationSoundStore((s) => s.setVolume);

  const volumePercent = Math.round(volume * 100);

  return (
    <div
      className={cn(
        'space-y-4 rounded-2xl border border-[var(--app-border)] bg-[var(--app-bg-muted)] p-4',
        className,
      )}
    >
      <label className="flex cursor-pointer items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-sm font-bold text-[var(--app-text)]">
          {enabled ? (
            <Volume2 className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
          ) : (
            <VolumeX className="h-5 w-5 text-[var(--app-text-dim)]" />
          )}
          تفعيل صوت الإشعارات
        </span>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => {
            const on = e.target.checked;
            setEnabled(on);
            if (on) unlockNotificationSound();
          }}
          className="h-4 w-4 rounded border-[var(--app-border-strong)] text-emerald-700 focus:ring-emerald-500/30"
        />
      </label>

      <div className={cn('space-y-2', !enabled && 'pointer-events-none opacity-50')}>
        <div className="flex items-center justify-between text-xs font-semibold text-[var(--app-text-muted)]">
          <span>مستوى الصوت</span>
          <span dir="ltr">{volumePercent}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={volumePercent}
          onChange={(e) => {
            const v = Number(e.target.value) / 100;
            setVolume(v);
            syncNotificationSoundVolume();
          }}
          className="h-2 w-full cursor-pointer accent-emerald-700"
          aria-label="مستوى صوت الإشعارات"
        />
        <p className="text-[11px] leading-relaxed text-[var(--app-text-dim)]">
          نغمة تنبيه مدتها حوالي 3 ثوانٍ — واضحة للعمل اليومي دون إزعاج. يعمل على Chrome و
          Edge و Firefox بعد أول نقرة على الصفحة.
        </p>
      </div>

      {!compact ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={!enabled}
          onClick={() => {
            unlockNotificationSound();
            playNotificationSound('__test__', { skipDebounce: true });
          }}
        >
          <Play className="h-4 w-4" />
          تجربة الصوت
        </Button>
      ) : null}
    </div>
  );
}
