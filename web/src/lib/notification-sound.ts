import {
  DEFAULT_NOTIFICATION_VOLUME,
  useNotificationSoundStore,
} from './notification-sound-store';

const SOUND_URL = '/sounds/notification.wav';
/** Légèrement supérieur à la durée du fichier (~3 s) pour éviter les chevauchements */
const DEBOUNCE_MS = 3_200;
const MAX_TRACKED_IDS = 200;

let audio: HTMLAudioElement | null = null;
let unlocked = false;
let lastPlayedAt = 0;
const playedIds = new Set<string>();

function effectiveVolume(): number {
  const { volume } = useNotificationSoundStore.getState();
  return typeof volume === 'number' ? volume : DEFAULT_NOTIFICATION_VOLUME;
}

function applyVolumeToElement(el: HTMLAudioElement) {
  el.volume = Math.max(0, Math.min(1, effectiveVolume()));
}

function getAudio(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;
  if (!audio) {
    audio = new Audio(SOUND_URL);
    audio.preload = 'auto';
    applyVolumeToElement(audio);
  } else {
    applyVolumeToElement(audio);
  }
  return audio;
}

/** Débloque la lecture après une interaction utilisateur (Chrome, Edge, Firefox). */
export function unlockNotificationSound() {
  if (unlocked || typeof window === 'undefined') return;
  const el = getAudio();
  if (!el) return;
  const savedVol = el.volume;
  el.volume = 0;
  const p = el.play();
  if (p && typeof p.then === 'function') {
    p.then(() => {
      el.pause();
      el.currentTime = 0;
      el.volume = savedVol;
      unlocked = true;
    }).catch(() => {
      el.volume = savedVol;
    });
  }
}

function prunePlayedIds() {
  if (playedIds.size <= MAX_TRACKED_IDS) return;
  const keep = [...playedIds].slice(-100);
  playedIds.clear();
  keep.forEach((id) => playedIds.add(id));
}

/**
 * Joue le son pour une nouvelle notification (temps réel ou polling).
 * @param notificationId — évite les doublons ; utiliser `__test__` pour l’aperçu
 * @param options.skipDebounce — pour le bouton « تجربة الصوت »
 */
export function playNotificationSound(
  notificationId?: string,
  options?: { skipDebounce?: boolean },
) {
  if (!useNotificationSoundStore.getState().enabled) return;
  if (typeof window === 'undefined') return;

  const isTest = notificationId === '__test__';

  if (notificationId && !isTest) {
    if (playedIds.has(notificationId)) return;
    playedIds.add(notificationId);
    prunePlayedIds();
  }

  if (!options?.skipDebounce && !isTest) {
    const now = Date.now();
    if (now - lastPlayedAt < DEBOUNCE_MS) return;
    lastPlayedAt = now;
  } else if (!isTest) {
    lastPlayedAt = Date.now();
  }

  const el = getAudio();
  if (!el) return;

  applyVolumeToElement(el);
  el.currentTime = 0;
  void el.play().catch(() => {
    /* Autoplay bloqué — unlockNotificationSound() */
  });
}

export function setupNotificationSoundUnlock() {
  if (typeof window === 'undefined') return () => {};

  const onInteract = () => unlockNotificationSound();

  window.addEventListener('pointerdown', onInteract, { once: true, passive: true });
  window.addEventListener('keydown', onInteract, { once: true });

  return () => {
    window.removeEventListener('pointerdown', onInteract);
    window.removeEventListener('keydown', onInteract);
  };
}

/** Réapplique le volume sur l’élément audio (slider paramètres). */
export function syncNotificationSoundVolume() {
  if (audio) applyVolumeToElement(audio);
}
