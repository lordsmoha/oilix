'use client';

import { useCallback, useEffect, useState } from 'react';

function getFullscreenElement(): Element | null {
  const doc = document as Document & {
    webkitFullscreenElement?: Element | null;
    msFullscreenElement?: Element | null;
  };
  return doc.fullscreenElement ?? doc.webkitFullscreenElement ?? doc.msFullscreenElement ?? null;
}

function isFullscreenSupported() {
  if (typeof document === 'undefined') return false;
  const el = document.documentElement as HTMLElement & {
    requestFullscreen?: () => Promise<void>;
    webkitRequestFullscreen?: () => Promise<void>;
    msRequestFullscreen?: () => Promise<void>;
  };
  return !!(el.requestFullscreen ?? el.webkitRequestFullscreen ?? el.msRequestFullscreen);
}

async function requestFullscreen() {
  const el = document.documentElement as HTMLElement & {
    requestFullscreen?: () => Promise<void>;
    webkitRequestFullscreen?: () => Promise<void>;
    msRequestFullscreen?: () => Promise<void>;
  };
  const fn = el.requestFullscreen ?? el.webkitRequestFullscreen ?? el.msRequestFullscreen;
  if (!fn) throw new Error('unsupported');
  await fn.call(el);
}

async function exitFullscreen() {
  const doc = document as Document & {
    exitFullscreen?: () => Promise<void>;
    webkitExitFullscreen?: () => Promise<void>;
    msExitFullscreen?: () => Promise<void>;
  };
  const fn = doc.exitFullscreen ?? doc.webkitExitFullscreen ?? doc.msExitFullscreen;
  if (!fn) throw new Error('unsupported');
  await fn.call(doc);
}

export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(isFullscreenSupported());

    const sync = () => {
      const active = !!getFullscreenElement();
      setIsFullscreen(active);
      document.documentElement.classList.toggle('app-fullscreen', active);
    };

    sync();

    document.addEventListener('fullscreenchange', sync);
    document.addEventListener('webkitfullscreenchange', sync);
    document.addEventListener('MSFullscreenChange', sync);

    return () => {
      document.removeEventListener('fullscreenchange', sync);
      document.removeEventListener('webkitfullscreenchange', sync);
      document.removeEventListener('MSFullscreenChange', sync);
      document.documentElement.classList.remove('app-fullscreen');
    };
  }, []);

  const toggle = useCallback(async () => {
    if (!isFullscreenSupported()) return false;
    try {
      if (getFullscreenElement()) {
        await exitFullscreen();
      } else {
        await requestFullscreen();
      }
      return true;
    } catch {
      return false;
    }
  }, []);

  const enter = useCallback(async () => {
    if (!isFullscreenSupported() || getFullscreenElement()) return false;
    try {
      await requestFullscreen();
      return true;
    } catch {
      return false;
    }
  }, []);

  const exit = useCallback(async () => {
    if (!getFullscreenElement()) return false;
    try {
      await exitFullscreen();
      return true;
    } catch {
      return false;
    }
  }, []);

  return { isFullscreen, supported, toggle, enter, exit };
}
