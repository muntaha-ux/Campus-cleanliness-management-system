import { createSupabaseServerClient } from '@/config/supabase';

export default async function AdminDashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Admin Operations Center (#48)
          </h1>
          <p className="text-sm text-slate-500">
            System Administration, Role Access Control, and Immutable Audit Logs
          </p>
        </div>
        <div className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-100 text-purple-800 uppercase">
          Role: ADMIN
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <h3 className="font-semibold text-slate-900">User Management (#11, #12, #16)</h3>
          <p className="text-sm text-slate-500">
            View all campus registered users, modify role assignments, and activate or suspend accounts.
          </p>
          <div className="pt-2">
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
              API: /api/admin/users
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <h3 className="font-semibold text-slate-900">System Activity Audit Log (#87)</h3>
          <p className="text-sm text-slate-500">
            Immutable, append-only security logs recording authentication, role changes, and incidents.
          </p>
          <div className="pt-2">
            <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2.5 py-1 rounded-md">
              API: /api/admin/audit-logs
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <h3 className="font-semibold text-slate-900">Runtime Configuration (#141)</h3>
          <p className="text-sm text-slate-500">
            Configure campus timezone, public leaderboard visibility, and scoring parameters.
          </p>
          <div className="pt-2">
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
              Table: public.system_settings
            </span>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 text-slate-100 p-6 rounded-2xl space-y-3">
        <h4 className="font-semibold text-white">Current Authenticated Session</h4>
        <pre className="text-xs bg-slate-800 p-4 rounded-xl overflow-x-auto text-emerald-400 font-mono">
          {JSON.stringify({ id: user?.id, email: user?.email, role: 'ADMIN' }, null, 2)}
        </pre>
      </div>
    </div>
  );
}

