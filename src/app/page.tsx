export default function HomePage() {
  return (
    <div className="space-y-12">
      <section className="text-center py-12 px-4 max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold tracking-wide uppercase">
          Milestone 1 Complete & Verified
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
          Campus Cleanliness Management System
        </h1>
        <p className="text-lg text-slate-600">
          Automated cleanliness monitoring, spatial incident intake, real-time staff dispatch,
          and tamper-evident quality governance across all campus facilities.
        </p>
        <div className="flex flex-wrap justify-center gap-4 pt-4">
          <a
            href="/register"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-6 py-3 rounded-xl shadow-sm transition"
          >
            Create Campus Account
          </a>
          <a
            href="/login"
            className="border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium px-6 py-3 rounded-xl transition"
          >
            Sign In to Dashboard
          </a>
        </div>
      </section>

      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            01
          </div>
          <h3 className="font-semibold text-slate-900">Supabase Core DDL</h3>
          <p className="text-sm text-slate-500">
            PostgreSQL schemas for locations, profiles, issues, assignments, snapshots, and reports.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            02
          </div>
          <h3 className="font-semibold text-slate-900">Multi-Role RBAC</h3>
          <p className="text-sm text-slate-500">
            Granular access policies for Students, Teachers, Cleaning Staff, and System Admins.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            03
          </div>
          <h3 className="font-semibold text-slate-900">Immutable Audit Log</h3>
          <p className="text-sm text-slate-500">
            Append-only trigger-locked audit trail prohibiting mutation and redaction of credentials.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            04
          </div>
          <h3 className="font-semibold text-slate-900">Next.js Edge Middleware</h3>
          <p className="text-sm text-slate-500">
            Automatic session verification, role routing, and proactive protection against deactivated users.
          </p>
        </div>
      </section>
    </div>
  );
}

