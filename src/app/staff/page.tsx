import { createSupabaseServerClient } from '@/config/supabase';

export default async function StaffDashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Cleaning Staff Task Board (#51)
          </h1>
          <p className="text-sm text-slate-500">
            Assigned clean-up work orders, shift schedules, and proof submission
          </p>
        </div>
        <div className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-100 text-amber-800 uppercase">
          Role: STAFF
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-semibold text-slate-900">Operational Profile (#43-#45)</h3>
        <p className="text-sm text-slate-600">
          Staff profile data, on-shift availability toggle, and task load metrics will connect to
          Milestone 3 dispatch workflows.
        </p>
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs font-mono text-slate-700">
          User ID: {user?.id} | Email: {user?.email}
        </div>
      </div>
    </div>
  );
}

