'use client';

import { NotificationSoundSettings } from '@/components/notifications/notification-sound-settings';

type Props = {
  className?: string;
};

/** Version compacte dans قائمة الإشعارات */
export function NotificationSoundToggle({ className }: Props) {
  return <NotificationSoundSettings className={className} compact />;
}
