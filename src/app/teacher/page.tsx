import React from 'react';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { BaustCard } from '@/components/ui/BaustCard';
import { StatKpiCard } from '@/components/ui/StatKpiCard';
import { ReportIssueWizard } from '@/components/issues/ReportIssueWizard';
import {
  GraduationCap,
  Building,
  CheckCircle,
  AlertTriangle,
  Clock,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function TeacherDashboardPage() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch departmental pending & resolved issues for faculty review
  const { data: departmentIssues } = await supabase
    .from('issues')
    .select('*, location:locations(*)')
    .order('created_at', { ascending: false })
    .limit(10);

  const pendingVerification = departmentIssues?.filter((i) => i.status === 'RESOLVED') || [];
  const activeClassroomIssues = departmentIssues?.filter((i) => i.status === 'SUBMITTED' || i.status === 'ASSIGNED' || i.status === 'IN_PROGRESS') || [];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Teacher Portal Banner */}
      <div className="bg-gradient-to-r from-baust-primary-950 via-baust-primary-900 to-baust-primary-800 rounded-2xl p-6 text-white shadow-military flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-baust-gold-500 text-slate-950 uppercase tracking-wider">
              Faculty & Academic Portal
            </span>
            <span className="text-xs text-baust-primary-200">BAUST Saidpur Cantonment</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Academic Sanitation Oversight
          </h1>
          <p className="text-xs sm:text-sm text-baust-primary-100 max-w-xl">
            Monitor lecture galleries, computer labs, and engineering workshops. Teachers hold elevated priority dispatch rights and final sign-off authority on classroom hygiene.
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/leaderboard"
            className="inline-flex items-center gap-2 px-4 py-2 bg-baust-gold-500 hover:bg-baust-gold-400 text-slate-950 font-bold text-xs rounded-xl shadow-gold transition"
          >
            Academic Honor Roll
          </Link>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatKpiCard
          title="Awaiting Faculty Sign-Off (#78)"
          count={pendingVerification.length}
          color="amber"
          subtitle="Staff resolved; awaiting inspection"
          icon={<Clock className="w-5 h-5 text-amber-700" />}
        />
        <StatKpiCard
          title="Active Academic Reports"
          count={activeClassroomIssues.length}
          color="blue"
          subtitle="Labs & lecture halls under maintenance"
          icon={<Building className="w-5 h-5 text-sky-700" />}
        />
        <StatKpiCard
          title="Compliance Score"
          count="94.2%"
          color="emerald"
          subtitle="Departmental SLA adherence rate"
          icon={<ShieldCheck className="w-5 h-5 text-emerald-700" />}
        />
      </div>

      {/* Verification Queue & Issue Intake */}
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Left: Faculty Verification Queue (#78) */}
        <div className="lg:col-span-6 space-y-6">
          <BaustCard
            title="Faculty Verification Queue (#78)"
            subtitle="Inspect cleaning proof photos and sign off or request rework"
            variant="accent"
            badge={
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                {pendingVerification.length} Pending
              </span>
            }
          >
            {pendingVerification.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto" />
                <p className="text-xs font-semibold text-slate-700">All Academic Work Orders Verified</p>
                <p className="text-[11px] text-slate-500">
                  No classroom or laboratory issues currently require faculty sign-off.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingVerification.map((issue: any) => (
                  <div key={issue.id} className="py-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono text-xs font-bold text-baust-primary-900">
                          {issue.reference_number}
                        </span>
                        <h4 className="text-xs font-semibold text-slate-800 mt-0.5">
                          {issue.description}
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Location: {issue.location?.building} • {issue.location?.floor}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase">
                        Cleaned
                      </span>
                    </div>

                    {/* Proof Photos Preview */}
                    {issue.proof_photo_urls && issue.proof_photo_urls.length > 0 && (
                      <div className="flex gap-2">
                        {issue.proof_photo_urls.map((url: string, i: number) => (
                          <img
                            key={i}
                            src={url}
                            alt="Resolution Proof"
                            className="w-16 h-12 object-cover rounded border border-slate-200"
                          />
                        ))}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        className="px-3 py-1.5 bg-baust-primary-700 hover:bg-baust-primary-800 text-white text-xs font-bold rounded-lg transition"
                      >
                        Approve & Verify
                      </button>
                      <button
                        type="button"
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition"
                      >
                        Request Rework (#81)
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </BaustCard>

          {/* Departmental Hygiene Protocol Notice */}
          <BaustCard
            title="Departmental Hygiene Protocol"
            subtitle="Faculty Executive Instructions"
            variant="military"
          >
            <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
              <p>
                <strong>Priority Dispatch Privileges:</strong> Reports submitted by faculty accounts carry elevated routing priority to prevent instructional interruptions in lecture galleries and computer labs.
              </p>
              <p>
                <strong>Workshop & Lab Safety:</strong> Chemical spills or electrical hazard debris must be designated as <em>HIGH</em> or <em>EMERGENCY</em> priority to trigger immediate supervisor dispatch.
              </p>
            </div>
          </BaustCard>
        </div>

        {/* Right: Rapid Faculty Intake Wizard */}
        <div className="lg:col-span-6 space-y-6">
          <ReportIssueWizard />
        </div>
      </div>
    </div>
  );
}
