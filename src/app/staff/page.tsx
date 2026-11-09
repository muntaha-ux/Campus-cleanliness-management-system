import React from 'react';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { StaffTaskBoard } from '@/components/staff/StaffTaskBoard';
import { ShieldCheck, Calendar, PhoneCall, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { BAUST_INFO } from '@/config/baust-campus';

export const dynamic = 'force-dynamic';

export default async function StaffDashboardPage() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch tasks assigned to this staff member with issues and locations
  const { data: assignments } = await supabase
    .from('task_assignments')
    .select('*, issue:issues(*, location:locations(*))')
    .eq('staff_id', user?.id || '')
    .order('assigned_at', { ascending: false });

  // Map into typed tasks
  const tasks = (assignments || []).map((a: any) => ({
    id: a.id,
    issue_id: a.issue_id,
    status: a.status,
    assigned_at: a.assigned_at,
    issue: a.issue || {
      id: a.issue_id,
      reference_number: 'CCMS-ASSIGNED',
      category: 'GENERAL',
      description: 'Clean-up assignment',
      priority: 'MEDIUM',
      status: 'ASSIGNED',
      sla_deadline: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      photo_urls: [],
      location: {
        building: 'Campus Facility',
        floor: 'Ground Floor',
        specific_area: 'General Sector',
      },
    },
  }));

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Staff Header Banner */}
      <div className="bg-gradient-to-r from-baust-primary-950 to-baust-primary-900 rounded-2xl p-6 text-white shadow-military flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-baust-gold-500 text-slate-950 uppercase tracking-wider">
              Cleaning Staff Operations (#51)
            </span>
            <span className="text-xs text-baust-primary-200">Saidpur Cantonment</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Janitorial Work Order Board
          </h1>
          <p className="text-xs sm:text-sm text-baust-primary-100 max-w-lg">
            High daylight contrast interface for mobile campus cleaning operations. Touch targets are calibrated to at least 48px for seamless field usability.
          </p>
        </div>

        <div className="flex flex-col sm:items-end text-xs text-baust-primary-200 space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-white">
            <PhoneCall className="w-3.5 h-3.5 text-baust-gold-400" />
            <span>Duty Hotline: {BAUST_INFO.emergencyCleanlinessHotline}</span>
          </div>
          <span>Estate Maintenance Directorate</span>
        </div>
      </div>

      {/* Interactive Staff Task Board Component */}
      <StaffTaskBoard initialTasks={tasks} staffUserId={user?.id || ''} />
    </div>
  );
}
