'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BAUST_INFO } from '@/config/baust-campus';
import { ShieldCheck, Lock, Mail, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to sign in');
        setLoading(false);
        return;
      }

      // Role-based redirect
      const role = data.user?.role;
      if (role === 'ADMIN') router.push('/admin');
      else if (role === 'STAFF') router.push('/staff');
      else if (role === 'TEACHER') router.push('/teacher');
      else router.push('/student');
    } catch {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto py-8 sm:py-12 px-4">
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-military overflow-hidden">
        {/* Top Header Strip */}
        <div className="bg-gradient-to-r from-baust-primary-950 to-baust-primary-800 text-white p-6 text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-baust-primary-850 text-baust-gold-400 border-2 border-baust-gold-500 flex items-center justify-center mx-auto text-xl font-black shadow-sm">
            ★
          </div>
          <div className="space-y-0.5">
            <h2 className="text-xl font-extrabold tracking-tight font-serif uppercase">
              BAUST Institutional Portal
            </h2>
            <p className="text-xs text-baust-gold-400 italic">
              {BAUST_INFO.motto}
            </p>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-5">
          <div className="space-y-1 text-center">
            <h3 className="text-lg font-bold text-slate-900">Sign In to Dashboard</h3>
            <p className="text-xs text-slate-500">
              Enter your official campus credentials to access your stakeholder workstation
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Official Campus Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. cadet.2023@baust.edu.bd"
                  className="w-full text-xs pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-baust-primary-600 font-medium"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-baust-primary-700 hover:text-baust-primary-900 font-semibold"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
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
                  Authenticating...
                </>
              ) : (
                <>
                  Sign In to Portal
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 text-center border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Do not have an account?{' '}
              <Link
                href="/register"
                className="font-bold text-baust-primary-700 hover:text-baust-primary-900"
              >
                Register Campus Profile
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
