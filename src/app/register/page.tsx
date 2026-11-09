'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserRole } from '@/core/domain/user.types';
import { BAUST_INFO } from '@/config/baust-campus';
import { ArrowRight, User, Mail, Lock, Building, Hash } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('STUDENT');
  const [department, setDepartment] = useState('CSE');
  const [studentOrEmpId, setStudentOrEmpId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName,
          role,
          department: department || undefined,
          student_or_employee_id: studentOrEmpId || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed');
        setLoading(false);
        return;
      }

      // If registered successfully, navigate to appropriate dashboard
      const userRole = data.user?.role || role;
      if (userRole === 'ADMIN') router.push('/admin');
      else if (userRole === 'STAFF') router.push('/staff');
      else if (userRole === 'TEACHER') router.push('/teacher');
      else router.push('/student');
    } catch {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto py-8 sm:py-12 px-4">
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-military overflow-hidden">
        {/* Institutional Top Strip */}
        <div className="bg-gradient-to-r from-baust-primary-950 to-baust-primary-800 text-white p-6 text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-baust-primary-850 text-baust-gold-400 border-2 border-baust-gold-500 flex items-center justify-center mx-auto text-xl font-black shadow-sm">
            ★
          </div>
          <div className="space-y-0.5">
            <h2 className="text-xl font-extrabold tracking-tight font-serif uppercase">
              {BAUST_INFO.shortName} Saidpur Registration
            </h2>
            <p className="text-xs text-baust-gold-400 italic">
              {BAUST_INFO.motto}
            </p>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          <div className="space-y-1 text-center">
            <h3 className="text-lg font-bold text-slate-900">Create Campus Account</h3>
            <p className="text-xs text-slate-500">
              Join the official campus cleanliness monitoring and facility quality network
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selection Pills */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Select Your Campus Role (#11)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['STUDENT', 'TEACHER', 'STAFF', 'ADMIN'] as const).map((r) => {
                  const isSelected = role === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition border ${
                        isSelected
                          ? 'bg-baust-primary-700 text-white border-baust-primary-700 shadow-sm'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {r}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Full Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Cadet Shidratul"
                    className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-baust-primary-600 font-medium"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Student / Employee ID
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={studentOrEmpId}
                    onChange={(e) => setStudentOrEmpId(e.target.value)}
                    placeholder="e.g. 200101001"
                    className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-baust-primary-600 font-medium"
                  />
                  <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Department / Wing
                </label>
                <div className="relative">
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-baust-primary-600 font-medium bg-white"
                  >
                    <option value="CSE">CSE (Computer Science & Eng)</option>
                    <option value="EEE">EEE (Electrical & Electronic)</option>
                    <option value="ME">ME (Mechanical Engineering)</option>
                    <option value="CE">CE (Civil Engineering)</option>
                    <option value="IPE">IPE (Industrial & Production)</option>
                    <option value="DBA">DBA (Business Administration)</option>
                    <option value="English">English & Humanities</option>
                    <option value="Administration">Cantonment Administration</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Campus Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@baust.edu.bd"
                    className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-baust-primary-600 font-medium"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Create Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-baust-primary-600 font-medium"
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
                  Registering Account...
                </>
              ) : (
                <>
                  Complete Registration
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 text-center border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-bold text-baust-primary-700 hover:text-baust-primary-900"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
