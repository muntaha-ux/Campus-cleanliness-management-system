'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BAUST_INFO } from '@/config/baust-campus';
import { Lock, ArrowRight } from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, confirmPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to update password');
        setLoading(false);
        return;
      }

      router.push('/login?message=Password updated successfully. Please sign in.');
    } catch {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-military overflow-hidden">
        {/* Institutional Top Strip */}
        <div className="bg-gradient-to-r from-baust-primary-950 to-baust-primary-800 text-white p-6 text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-baust-primary-850 text-baust-gold-400 border-2 border-baust-gold-500 flex items-center justify-center mx-auto text-xl font-black shadow-sm">
            ★
          </div>
          <div className="space-y-0.5">
            <h2 className="text-xl font-extrabold tracking-tight font-serif uppercase">
              Update Password
            </h2>
            <p className="text-xs text-baust-gold-400 italic">
              {BAUST_INFO.shortName} Saidpur Cantonment
            </p>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-5">
          <div className="space-y-1 text-center">
            <h3 className="text-lg font-bold text-slate-900">Set New Password</h3>
            <p className="text-xs text-slate-500">
              Provide a robust passphrase meeting university security standards
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                New Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full text-xs pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-baust-primary-600 font-medium"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full text-xs pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-baust-primary-600 font-medium"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-baust-primary-700 hover:bg-baust-primary-800 disabled:opacity-50 text-white text-xs font-extrabold uppercase tracking-wider shadow-disciplined transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Updating Password...
                </>
              ) : (
                <>
                  Save New Password
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 text-center border-t border-slate-100">
            <Link
              href="/login"
              className="text-xs font-bold text-baust-primary-700 hover:text-baust-primary-900"
            >
              Cancel and return to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
