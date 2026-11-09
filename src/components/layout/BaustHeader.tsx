'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { BAUST_INFO } from '@/config/baust-campus';
import { useRealtimeCounters } from '@/hooks/useRealtimeCounters';
import { useNotifications } from '@/hooks/useNotifications';
import { UserRole } from '@/types/database.types';

export function BaustHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { counters, isLive } = useRealtimeCounters();

  const [campusTime, setCampusTime] = useState<string>('');
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string; role: UserRole; full_name?: string } | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);

  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(currentUser?.id);

  // Live Asia/Dhaka clock
  useEffect(() => {
    function updateClock() {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Dhaka',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      };
      setCampusTime(new Intl.DateTimeFormat('en-US', options).format(now));
    }
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch current profile
  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch('/api/profile');
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setCurrentUser({
              id: data.user.id,
              email: data.user.email,
              role: data.user.role,
              full_name: data.profile?.full_name,
            });
          }
        }
      } catch {
        // Not logged in or error
      }
    }
    loadUser();
  }, [pathname]);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setCurrentUser(null);
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="w-full sticky top-0 z-50 shadow-military">
      {/* 1. BAUST Cantonment Utility Strip */}
      <div className="bg-[#072A18] text-white text-xs border-b-2 border-[#D4AF37] px-4 sm:px-6 lg:px-8 py-1.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-semibold tracking-wider text-slate-100">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#D4AF37]"></span>
            <span>{BAUST_INFO.name.toUpperCase()}</span>
            <span className="hidden md:inline text-slate-400">|</span>
            <span className="hidden md:inline text-[#D4AF37] font-serif tracking-widest">{BAUST_INFO.campus}</span>
          </div>
          <span className="hidden lg:inline text-emerald-300/40">/</span>
          <span className="hidden lg:inline text-[#D4AF37] baust-motto text-[11px] font-bold">
            &ldquo;{BAUST_INFO.motto}&rdquo;
          </span>
        </div>

        <div className="flex items-center gap-4 text-[11px]">
          {/* Campus Time (Asia/Dhaka) */}
          <div className="hidden sm:flex items-center gap-1.5 text-emerald-200/90 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Saidpur Time: {campusTime || 'Syncing...'}</span>
          </div>

          {/* Emergency Hotline Quick-Trigger (#29) */}
          <a
            href={`tel:${BAUST_INFO.emergencyCleanlinessHotline}`}
            className="flex items-center gap-1 bg-red-700 hover:bg-red-800 text-white font-medium px-2.5 py-0.5 rounded transition shadow-sm"
            title="Campus Cleanliness Emergency Dispatch Hotline"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
            <span className="font-bold">HOTLINE:</span> {BAUST_INFO.emergencyCleanlinessHotline}
          </a>
        </div>
      </div>

      {/* 2. Main Navigation Bar */}
      <div className="bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between py-2.5">
          {/* Brand Logo & Title */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-xl bg-[#0B4627] border-2 border-[#D4AF37] p-1 flex items-center justify-center text-white font-extrabold shadow-sm group-hover:bg-[#126137] transition">
              <div className="text-center leading-none">
                <span className="block text-xs font-black tracking-tighter text-[#D4AF37]">BAUST</span>
                <span className="block text-[8px] tracking-widest text-emerald-200">ARMY</span>
              </div>
            </div>
            <div>
              <div className="font-extrabold text-base tracking-tight text-[#072A18] flex items-center gap-2">
                <span>BAUST Cleanliness System</span>
                <span className="hidden sm:inline-block text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-50 text-[#0B4627] border border-emerald-200">
                  Saidpur
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Estate & Hygiene Directorate • Facility Management Portal
              </p>
            </div>
          </Link>

          {/* Center: Live Realtime Counter Badges (#53-#56) */}
          <div className="hidden xl:flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-700">
              <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-500' : 'bg-amber-400'}`}></span>
              <span className="text-slate-500">Live Issues:</span>
              <span className="font-bold text-[#0B4627]">{counters.total}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg text-xs font-medium text-amber-900">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span>Pending:</span>
              <span className="font-bold">{counters.pending}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg text-xs font-medium text-emerald-900">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Resolved:</span>
              <span className="font-bold">{counters.resolved}</span>
            </div>
            {counters.overdue > 0 && (
              <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg text-xs font-medium text-red-700 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-red-600"></span>
                <span>Overdue:</span>
                <span className="font-bold">{counters.overdue}</span>
              </div>
            )}
          </div>

          {/* Right Navigation & Profile Controls */}
          <div className="flex items-center gap-3">
            <Link
              href="/leaderboard"
              className="text-xs font-semibold text-slate-700 hover:text-[#0B4627] px-3 py-2 rounded-lg hover:bg-slate-50 transition flex items-center gap-1.5"
            >
              <span className="text-[#D4AF37]">🏆</span>
              <span className="hidden sm:inline">Cleanliness Honor Roll</span>
            </Link>

            {currentUser ? (
              <div className="flex items-center gap-2">
                {/* Notification Bell with Dropdown (#65) */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 relative transition"
                    aria-label="Notifications"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 bg-red-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Dropdown Drawer */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-military border border-slate-200 py-2 z-50">
                      <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900">Notifications</span>
                        {unreadCount > 0 && (
                          <button
                            onClick={() => markAllAsRead()}
                            className="text-[11px] text-[#0B4627] hover:underline"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                        {notifications.length === 0 ? (
                          <div className="px-4 py-6 text-center text-xs text-slate-400">
                            No notifications yet
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n.id}
                              onClick={() => markAsRead(n.id)}
                              className={`px-4 py-2.5 text-xs hover:bg-slate-50 cursor-pointer ${
                                !n.is_read ? 'bg-emerald-50/50' : ''
                              }`}
                            >
                              <div className="font-semibold text-slate-900">{n.title}</div>
                              <div className="text-slate-600 line-clamp-2">{n.message}</div>
                              <div className="text-[10px] text-slate-400 mt-1">
                                {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <Link
                  href={`/${currentUser.role.toLowerCase()}`}
                  className="bg-[#0B4627] text-white hover:bg-[#126137] px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  <span>Portal</span>
                  <span className="text-[10px] bg-[#D4AF37] text-slate-950 px-1 rounded uppercase font-black">
                    {currentUser.role}
                  </span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="text-xs text-slate-500 hover:text-red-700 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition font-medium"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="text-xs font-semibold text-slate-700 hover:text-[#0B4627] px-3 py-1.5 rounded-lg transition"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="bg-[#0B4627] text-white hover:bg-[#126137] px-3.5 py-1.5 rounded-lg text-xs font-bold transition shadow-sm"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

