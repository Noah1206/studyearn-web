'use client';

import { useState, useEffect, useCallback } from 'react';

export function useUnreadCount(enabled: boolean = true) {
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?unread_only=true&limit=1');
      if (!res.ok) return;
      const data = await res.json();
      setUnreadCount(data.unread_count ?? 0);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30_000);
    return () => clearInterval(interval);
  }, [enabled, fetchUnreadCount]);

  return { unreadCount, refetch: fetchUnreadCount };
}
