import { createSupabaseServerClient } from '@/config/supabase';

export default async function TeacherDashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Faculty & Teacher Portal (#50)
          </h1>
          <p className="text-sm text-slate-500">
            Departmental hygiene status, priority reporting, and resolution verification
          </p>
        </div>
        <div className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-100 text-blue-800 uppercase">
          Role: TEACHER
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-semibold text-slate-900">Department Overview (#10)</h3>
        <p className="text-sm text-slate-600">
          Faculty accounts can monitor department facilities and report urgent cleanliness issues.
        </p>
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs font-mono text-slate-700">
          User ID: {user?.id} | Email: {user?.email}
        </div>
      </div>
    </div>
  );
}

