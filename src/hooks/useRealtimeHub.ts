'use client';

export * from './useRealtimeCounters';
export * from './useNotifications';

import { useRealtimeCounters } from './useRealtimeCounters';
import { useNotifications } from './useNotifications';

/**
 * Composite Realtime Hub Hook
 * Combines live issue counters (#53-#56) and user in-app notifications (#58-#65).
 */
export function useRealtimeHub(userId?: string | null) {
  const { counters, isLive } = useRealtimeCounters();
  const notificationState = useNotifications(userId);

  return {
    counters,
    isCountersLive: isLive,
    ...notificationState,
  };
}

