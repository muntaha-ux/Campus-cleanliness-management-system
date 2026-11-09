'use client';

import { useEffect, useState } from 'react';
import { Profile } from '@/core/domain/user.types';
import { BAUST_INFO } from '@/config/baust-campus';
import { BaustCard } from '@/components/ui/BaustCard';
import { User, Bell, Mail, Shield, CheckCircle2, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('');
  const [studentOrEmpId, setStudentOrEmpId] = useState('');
  const [emailNotif, setEmailNotif] = useState(true);
  const [inAppNotif, setInAppNotif] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch('/api/profile');
        if (!res.ok) {
          setError('Failed to load profile');
          setLoading(false);
          return;
        }
        const data = await res.json();
        if (data.profile) {
          setProfile(data.profile);
          setFullName(data.profile.full_name || '');
          setDepartment(data.profile.department || '');
          setStudentOrEmpId(data.profile.student_or_employee_id || '');
          setEmailNotif(data.profile.notification_preferences?.email ?? true);
          setInAppNotif(data.profile.notification_preferences?.in_app ?? true);
        }
      } catch {
        setError('Error fetching profile');
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          department: department || null,
          student_or_employee_id: studentOrEmpId || null,
          notification_preferences: {
            email: emailNotif,
            in_app: inAppNotif,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to update profile');
        setSaving(false);
        return;
      }

      setMessage('Profile settings updated successfully!');
      if (data.profile) {
        setProfile(data.profile);
      }
    } catch {
      setError('An error occurred while saving profile');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-16 text-slate-500 text-xs font-semibold">
        Loading BAUST Profile...
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-6">
      <div className="bg-gradient-to-r from-baust-primary-950 via-baust-primary-900 to-baust-primary-800 rounded-2xl p-6 text-white shadow-military flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-baust-gold-500 text-slate-950 uppercase tracking-wider">
              {profile?.role || 'CADET'}
            </span>
            <span className="text-xs text-baust-primary-200">{BAUST_INFO.shortName} Saidpur</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Institutional Profile & Settings
          </h1>
          <p className="text-xs text-baust-primary-100">
            Manage your student/cadet identification, department affiliation, and dispatch notifications.
          </p>
        </div>

        <div className="w-14 h-14 rounded-full bg-baust-gold-500 text-slate-950 font-black text-xl flex items-center justify-center border-2 border-white shadow-gold">
          {fullName ? fullName.charAt(0).toUpperCase() : 'B'}
        </div>
      </div>

      {message && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 text-xs font-semibold rounded-xl">
          {error}
        </div>
      )}

      <BaustCard title="Institutional Identification (#9, #10)" variant="military">
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-baust-primary-600 font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Student / Employee ID
              </label>
              <input
                type="text"
                value={studentOrEmpId}
                onChange={(e) => setStudentOrEmpId(e.target.value)}
                placeholder="e.g. 210101001"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-baust-primary-600 font-mono font-medium"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Department / Faculty
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. CSE / ME / EEE"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-baust-primary-600 font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Official Campus Email
              </label>
              <input
                type="text"
                disabled
                value={profile?.email || ''}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 font-mono cursor-not-allowed"
              />
            </div>
          </div>

          {/* Notification Preferences (#58-#65) */}
          <div className="pt-3 border-t border-slate-100 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-baust-primary-700" />
              Dispatch & Resolution Notifications (#58-#65)
            </h4>

            <div className="space-y-2">
              <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={inAppNotif}
                  onChange={(e) => setInAppNotif(e.target.checked)}
                  className="rounded text-baust-primary-700 focus:ring-baust-primary-600 w-4 h-4"
                />
                <span className="font-semibold">Receive in-app status updates for my reported issues</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailNotif}
                  onChange={(e) => setEmailNotif(e.target.checked)}
                  className="rounded text-baust-primary-700 focus:ring-baust-primary-600 w-4 h-4"
                />
                <span className="font-semibold">Email notification when resolution proof photo is submitted (#62)</span>
              </label>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-baust-primary-700 hover:bg-baust-primary-800 disabled:opacity-50 text-white text-xs font-extrabold uppercase tracking-wider rounded-xl shadow-disciplined transition"
            >
              {saving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving Settings...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Profile Changes
                </>
              )}
            </button>
          </div>
        </form>
      </BaustCard>
    </div>
  );
}
