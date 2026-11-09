'use client';

import { useEffect, useState } from 'react';
import { Profile } from '@/core/domain/user.types';

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

      setMessage('Profile updated successfully!');
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
    return <div className="text-center py-12 text-slate-500">Loading profile...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              User Profile (#9–#11)
            </h2>
            <p className="text-sm text-slate-500">
              Manage personal details, department, and notification preferences
            </p>
          </div>
          {profile && (
            <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase bg-slate-100 text-slate-700">
              {profile.role}
            </span>
          )}
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-800">
            {message}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              disabled
              value={profile?.email || ''}
              className="w-full px-3.5 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 text-sm cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Department
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Student / Employee ID
              </label>
              <input
                type="text"
                value={studentOrEmpId}
                onChange={(e) => setStudentOrEmpId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>
          </div>

          <div className="pt-2">
            <h4 className="text-sm font-medium text-slate-900 mb-2">
              Notification Preferences (#67)
            </h4>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={emailNotif}
                  onChange={(e) => setEmailNotif(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                Receive Email Notifications
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={inAppNotif}
                  onChange={(e) => setInAppNotif(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                Receive In-App Notifications
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium px-5 py-2.5 rounded-lg transition shadow-sm"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}

