import { createSupabaseServerClient } from '@/config/supabase';

export default async function StudentDashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Student Cleanliness Dashboard (#49)
          </h1>
          <p className="text-sm text-slate-500">
            Report issues, track progress, and inspect area cleanliness rankings
          </p>
        </div>
        <div className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 uppercase">
          Role: STUDENT
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-semibold text-slate-900">Welcome to Campus Cleanliness (#9)</h3>
        <p className="text-sm text-slate-600">
          Your account is active and ready to submit cleanliness reports in Milestone 2.
        </p>
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs font-mono text-slate-700">
          User ID: {user?.id} | Email: {user?.email}
        </div>
      </div>
    </div>
  );
}

