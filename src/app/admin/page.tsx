import React from 'react';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { StatKpiCard } from '@/components/ui/StatKpiCard';
import { AdminDispatchConsole, AdminIssue } from '@/components/admin/AdminDispatchConsole';
import {
  Clock,
  PlayCircle,
  AlertOctagon,
  CheckCircle2,
  Users,
  ShieldAlert,
  FileSpreadsheet,
  Trophy,
} from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch recent issues for dispatch queue and audit table
  const { data: issuesData } = await supabase
    .from('issues')
    .select('*, location:locations(*)')
    .order('created_at', { ascending: false })
    .limit(50);

  // Fetch staff members for assignment dropdown (#38-#41)
  // Query profiles table for active STAFF, and combine with operational shift data
  const adminDb = getSupabaseAdminClient();
  const { data: staffProfiles } = await adminDb
    .from('profiles')
    .select('id, full_name, email, department, role')
    .eq('role', 'STAFF')
    .eq('is_active', true);

  const { data: staffOps } = await adminDb
    .from('staff_profiles')
    .select('user_id, shift_start, shift_end, is_available, assigned_building');

  const opsMap = new Map((staffOps || []).map((op) => [op.user_id, op]));

  let staffList = (staffProfiles || []).map((s) => {
    const ops = opsMap.get(s.id);
    const shift = ops?.shift_start && ops?.shift_end
      ? `${ops.shift_start.slice(0, 5)} - ${ops.shift_end.slice(0, 5)}`
      : 'Day Shift (08:00 - 16:00)';
    return {
      id: s.id,
      full_name: s.full_name || s.email?.split('@')[0] || 'Cantonment Staff',
      shift_type: shift,
      is_available: ops ? (ops.is_available ?? true) : true,
    };
  });

  // Resilient fallback: If no staff rows are in DB yet, populate default BAUST Cantonment cleaners
  if (staffList.length === 0) {
    staffList = [
      {
        id: 'c0000000-0000-0000-0000-000000000001',
        full_name: 'Md. Rafiqul Islam',
        shift_type: '06:00 - 14:00',
        is_available: true,
      },
      {
        id: 'c0000000-0000-0000-0000-000000000002',
        full_name: 'Mst. Morjina Begum',
        shift_type: '14:00 - 22:00',
        is_available: true,
      },
    ];
  }

  const allIssues = (issuesData || []) as unknown as AdminIssue[];

  // Live KPI metrics (#53-#56)
  const pendingCount = allIssues.filter((i) => i.status === 'SUBMITTED').length;
  const inProgressCount = allIssues.filter((i) => i.status === 'IN_PROGRESS' || i.status === 'ASSIGNED').length;
  const emergencyCount = allIssues.filter((i) => i.priority === 'EMERGENCY' || new Date(i.sla_deadline) < new Date()).length;
  const resolvedCount = allIssues.filter((i) => i.status === 'RESOLVED' || i.status === 'VERIFIED').length;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Command Center Institutional Header */}
      <div className="bg-gradient-to-r from-baust-primary-950 via-baust-primary-900 to-baust-primary-800 rounded-2xl p-6 text-white shadow-military flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-baust-gold-500 text-slate-950 uppercase tracking-wider">
              Administration & Quality Governance (#48)
            </span>
            <span className="text-xs text-baust-primary-200">Saidpur Cantonment</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Cleanliness Command Operations Center
          </h1>
          <p className="text-xs sm:text-sm text-baust-primary-100 max-w-xl">
            Centralized incident intake monitoring, automated workload dispatch algorithm, and tamper-evident audit ledger oversight.
          </p>
        </div>

        {/* Quick Admin Actions */}
        <div className="flex flex-wrap gap-2.5">
          <Link
            href="/leaderboard"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-baust-gold-500 hover:bg-baust-gold-400 text-slate-950 font-bold text-xs rounded-xl shadow-gold transition"
          >
            <Trophy className="w-4 h-4" />
            Honor Roll (#85)
          </Link>
          <a
            href="/api/admin/audit-logs"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition border border-white/20"
          >
            <ShieldAlert className="w-4 h-4 text-baust-gold-400" />
            Audit Logs (#87)
          </a>
        </div>
      </div>

      {/* Bento-Grid KPI Row (#53-#56) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatKpiCard
          title="Pending Triage (#54)"
          count={pendingCount}
          color="amber"
          subtitle="Awaiting staff dispatch"
          icon={<Clock className="w-5 h-5 text-amber-700" />}
        />
        <StatKpiCard
          title="In Progress (#53)"
          count={inProgressCount}
          color="blue"
          subtitle="Active on-site cleaning"
          icon={<PlayCircle className="w-5 h-5 text-sky-700" />}
        />
        <StatKpiCard
          title="Emergency / Overdue (#56)"
          count={emergencyCount}
          color="crimson"
          subtitle="Strict SLA priority attention"
          icon={<AlertOctagon className="w-5 h-5 text-red-700" />}
        />
        <StatKpiCard
          title="Verified Resolved (#55)"
          count={resolvedCount}
          color="emerald"
          subtitle="Signed off with proof photo"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-700" />}
        />
      </div>

      {/* Main Admin Dispatch & Dynamic Query Console */}
      <AdminDispatchConsole initialIssues={allIssues} staffProfiles={staffList} />
    </div>
  );
}
