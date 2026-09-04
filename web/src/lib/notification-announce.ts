import { toast } from 'sonner';
import { playNotificationSound } from '@/lib/notification-sound';

const announcedIds = new Set<string>();
const MAX_TRACKED = 400;

function prune() {
  if (announcedIds.size <= MAX_TRACKED) return;
  const keep = [...announcedIds].slice(-200);
  announcedIds.clear();
  keep.forEach((id) => announcedIds.add(id));
}

/**
 * Show toast + sound for a new unread notification (WS or poll).
 * Dedupes by id so realtime + polling never double-notify.
 */
export function announceNotification(n: {
  id: string;
  title: string;
  message: string;
  read?: boolean;
}) {
  if (n.read) return;
  if (!n.id || announcedIds.has(n.id)) return;
  announcedIds.add(n.id);
  prune();
  // Toast immediately; sound is non-blocking.
  toast.info(n.title, {
    description: n.message,
    duration: 12_000,
  });
  playNotificationSound(n.id);
}

/** Mark ids as already seen (initial list load — no toast storm). */
export function markNotificationsSeen(ids: string[]) {
  for (const id of ids) announcedIds.add(id);
  prune();
}
