import React from 'react';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { StatKpiCard } from '@/components/ui/StatKpiCard';
import { ReportIssueWizard } from '@/components/issues/ReportIssueWizard';
import { StudentIssueTracker } from '@/components/issues/StudentIssueTracker';
import { BaustCard } from '@/components/ui/BaustCard';
import {
  Trophy,
  PlusCircle,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function StudentDashboardPage() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch student's own reported issues
  const { data: myIssuesData } = await supabase
    .from('issues')
    .select('*, location:locations(*)')
    .eq('reporter_id', user?.id || '')
    .order('created_at', { ascending: false })
    .limit(20);

  const myIssues = (myIssuesData || []) as any[];

  const totalReported = myIssues.length;
  const resolvedCount = myIssues.filter((i) => i.status === 'RESOLVED' || i.status === 'VERIFIED').length;
  const pendingCount = myIssues.filter((i) => i.status === 'SUBMITTED' || i.status === 'ASSIGNED' || i.status === 'IN_PROGRESS').length;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Student Welcome Banner */}
      <div className="bg-gradient-to-r from-baust-primary-900 to-baust-primary-800 rounded-2xl p-6 text-white shadow-military flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-baust-gold-500 text-slate-950 uppercase tracking-wider">
              Student Cleanliness Portal
            </span>
            <span className="text-xs text-baust-primary-200">BAUST Saidpur</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome, {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Cadet/Student'}
          </h1>
          <p className="text-xs sm:text-sm text-baust-primary-100 max-w-xl">
            Help maintain the cleanliness and discipline of our campus. Spot an issue, submit a 30-second report with photo evidence, and track verified resolution in real time.
          </p>
        </div>

        <Link
          href="/leaderboard"
          className="inline-flex items-center gap-2 px-4 py-2 bg-baust-gold-500 hover:bg-baust-gold-400 text-slate-950 font-bold text-xs rounded-xl shadow-gold transition"
        >
          <Trophy className="w-4 h-4" />
          Campus Honor Roll
        </Link>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatKpiCard
          title="My Submissions"
          count={totalReported}
          color="blue"
          subtitle="Total incidents reported by you"
          icon={<PlusCircle className="w-5 h-5 text-sky-700" />}
        />
        <StatKpiCard
          title="In Progress / Triage"
          count={pendingCount}
          color="amber"
          subtitle="Currently assigned to cleaning staff"
          icon={<Clock className="w-5 h-5 text-amber-700" />}
        />
        <StatKpiCard
          title="Verified Cleaned"
          count={resolvedCount}
          color="emerald"
          subtitle="Issues resolved and closed"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-700" />}
        />
      </div>

      {/* Main Grid: Reporting Wizard & Interactive Issue Tracker */}
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: 30-Second Reporting Wizard (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <ReportIssueWizard />
        </div>

        {/* Right Column: Interactive Issue Tracker & Verification (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <StudentIssueTracker initialIssues={myIssues} />

          {/* Quick Institutional Notice Card */}
          <BaustCard
            title="Cleanliness Code of Conduct"
            subtitle="BAUST Saidpur Cantonment Regulations"
            variant="gold"
          >
            <div className="text-xs text-slate-600 space-y-2">
              <p>
                • <strong>Waste Segregation:</strong> Dispose organic waste and plastic packaging in designated color-coded bins on each building floor.
              </p>
              <p>
                • <strong>Restroom Hygiene:</strong> Ensure water taps are closed tightly after use to prevent overflow and slip hazards.
              </p>
              <p>
                • <strong>Emergency Hotline:</strong> For severe chemical spills or hazardous materials, trigger the emergency hotline: <strong className="text-baust-primary-900 font-mono">+880 1769 662555</strong>.
              </p>
            </div>
          </BaustCard>
        </div>
      </div>
    </div>
  );
}
