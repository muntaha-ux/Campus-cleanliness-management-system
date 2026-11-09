'use client';

import { useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { IssueStatus } from '@/types/database.types';

export interface CleanlinessCounters {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
  overdue: number;
}

export function useRealtimeCounters(initialCounters?: CleanlinessCounters) {
  const [counters, setCounters] = useState<CleanlinessCounters>(
    initialCounters || {
      total: 0,
      pending: 0,
      inProgress: 0,
      resolved: 0,
      overdue: 0,
    }
  );
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    // 1. Initial count fetch
    async function fetchCounts() {
      const { data, error } = await supabase
        .from('issues')
        .select('status, sla_deadline');

      if (!error && data) {
        const rows = data as unknown as { status: IssueStatus; sla_deadline: string }[];
        const now = new Date();
        let total = 0;
        let pending = 0;
        let inProgress = 0;
        let resolved = 0;
        let overdue = 0;

        for (const row of rows) {
          total++;
          const status = row.status;
          if (status === 'SUBMITTED' || status === 'ASSIGNED') pending++;
          else if (status === 'IN_PROGRESS') inProgress++;
          else if (status === 'RESOLVED' || status === 'VERIFIED') resolved++;

          // Overdue calculation
          if (
            status !== 'RESOLVED' &&
            status !== 'VERIFIED' &&
            status !== 'CANCELLED' &&
            new Date(row.sla_deadline) < now
          ) {
            overdue++;
          }
        }

        setCounters({ total, pending, inProgress, resolved, overdue });
      }
    }

    fetchCounts();

    // 2. Realtime Postgres Changes Subscription (#53-#56)
    const channel = supabase
      .channel('live-issue-counters')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'issues' },
        () => {
          fetchCounts();
        }
      )
      .subscribe((status: string) => {
        setIsLive(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { counters, isLive };
}
