import React from 'react';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { BaustCard } from '@/components/ui/BaustCard';
import { StatKpiCard } from '@/components/ui/StatKpiCard';
import { ReportIssueWizard } from '@/components/issues/ReportIssueWizard';
import { TeacherVerificationQueue, TeacherIssueItem } from '@/components/teacher/TeacherVerificationQueue';
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

  const allIssues = (departmentIssues || []) as unknown as TeacherIssueItem[];
  const pendingVerification = allIssues.filter((i) => i.status === 'RESOLVED');
  const activeClassroomIssues = allIssues.filter((i) => i.status === 'SUBMITTED' || i.status === 'ASSIGNED' || i.status === 'IN_PROGRESS');

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
        {/* Left: Faculty Verification Queue (#78, Figure 3: Review Work -> Approve / Rework) */}
        <div className="lg:col-span-6 space-y-6">
          <TeacherVerificationQueue initialIssues={pendingVerification} />

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
