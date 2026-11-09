import React from 'react';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { BaustCard } from '@/components/ui/BaustCard';
import { StatKpiCard } from '@/components/ui/StatKpiCard';
import { ReportIssueWizard } from '@/components/issues/ReportIssueWizard';
import {
  Trophy,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Star,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function StudentDashboardPage() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch student's own reported issues
  const { data: myIssues } = await supabase
    .from('issues')
    .select('*, location:locations(*)')
    .eq('reporter_id', user?.id || '')
    .order('created_at', { ascending: false })
    .limit(10);

  const totalReported = myIssues?.length || 0;
  const resolvedCount = myIssues?.filter((i) => i.status === 'RESOLVED' || i.status === 'VERIFIED').length || 0;
  const pendingCount = myIssues?.filter((i) => i.status === 'SUBMITTED' || i.status === 'ASSIGNED' || i.status === 'IN_PROGRESS').length || 0;

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

      {/* Main Grid: Reporting Wizard & Recent Reports */}
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: 30-Second Reporting Wizard (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <ReportIssueWizard />
        </div>

        {/* Right Column: My Reported Issues & Tracking (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <BaustCard
            title="My Recent Incident Reports"
            subtitle="Track progress and verify resolution photos (#78)"
            variant="military"
          >
            {(!myIssues || myIssues.length === 0) ? (
              <div className="py-8 text-center space-y-2">
                <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500">
                  You have not submitted any cleanliness reports yet. Use the intake wizard on the left whenever you spot an unhygienic area.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {myIssues.map((issue: any) => {
                  const statusColors: Record<string, string> = {
                    SUBMITTED: 'bg-amber-100 text-amber-800 border-amber-300',
                    ASSIGNED: 'bg-sky-100 text-sky-800 border-sky-300',
                    IN_PROGRESS: 'bg-sky-100 text-sky-800 border-sky-300 animate-pulse',
                    RESOLVED: 'bg-emerald-100 text-emerald-800 border-emerald-300',
                    VERIFIED: 'bg-emerald-200 text-emerald-950 border-emerald-400 font-bold',
                    REOPENED: 'bg-red-100 text-red-800 border-red-300',
                  };

                  return (
                    <div key={issue.id} className="py-3.5 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-mono text-xs font-bold text-baust-primary-900">
                            {issue.reference_number}
                          </span>
                          <h4 className="text-xs font-semibold text-slate-800 line-clamp-1 mt-0.5">
                            {issue.description}
                          </h4>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                            statusColors[issue.status] || 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {issue.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {issue.location?.building || 'Campus Zone'} • {issue.location?.floor}
                        </span>
                      </div>

                      {/* If Resolved, Prompt for Star Rating (#79, #80) */}
                      {issue.status === 'RESOLVED' && (
                        <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 flex items-center justify-between text-xs">
                          <span className="font-bold text-emerald-900">Cleaning Complete! Inspect Proof:</span>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 hover:text-emerald-950 underline"
                          >
                            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                            Rate / Verify (#79)
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </BaustCard>

          {/* Quick Institutional Notice Card */}
          <BaustCard
            title="Cleanliness Code of Conduct"
            subtitle="BAUST Saidpur Cantonment Regulations"
            variant="gold"
          >
            <div className="text-xs text-slate-600 space-y-2">
              <p>
                • <strong>Waste Segregation:</strong> Dispose organic waste and plastic packaging in the designated color-coded bins located on each building floor.
              </p>
              <p>
                • <strong>Restroom Hygiene:</strong> Ensure water taps are closed tightly after use to prevent water overflow and slip hazards.
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
