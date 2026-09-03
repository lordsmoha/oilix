'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useEffect, useState } from 'react';
import { ThemeProvider } from '@/components/theme/theme-provider';
import { RealtimeProvider } from '@/components/realtime/realtime-provider';
import { NotificationSoundListener } from '@/components/notifications/notification-sound-listener';
import { setupNotificationSoundUnlock } from '@/lib/notification-sound';

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => setupNotificationSoundUnlock(), []);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: (failureCount, error) => {
              const status = (error as { response?: { status?: number } })?.response?.status;
              if (status === 401 || status === 403) return false;
              return failureCount < 1;
            },
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <RealtimeProvider>
          <NotificationSoundListener />
          {children}
          <Toaster position="top-left" dir="rtl" richColors closeButton />
        </RealtimeProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
