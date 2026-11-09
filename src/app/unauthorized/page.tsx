export default function UnauthorizedPage() {
  return (
    <div className="max-w-md mx-auto py-16 text-center space-y-4">
      <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
        !
      </div>
      <h2 className="text-2xl font-bold text-slate-900">Access Restricted (403)</h2>
      <p className="text-slate-600 text-sm">
        You do not possess the required Role-Based Access Control (RBAC) permissions to view this resource.
      </p>
      <div className="pt-4">
        <a
          href="/"
          className="inline-block bg-slate-900 hover:bg-slate-800 text-white font-medium px-5 py-2.5 rounded-lg text-sm transition"
        >
          Return to Home
        </a>
      </div>
    </div>
  );
}

