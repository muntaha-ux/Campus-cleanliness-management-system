import React from 'react';
import Link from 'next/link';
import { BAUST_INFO, BAUST_BUILDINGS } from '@/config/baust-campus';
import {
  ShieldCheck,
  Trophy,
  Camera,
  Clock,
  Sparkles,
  ArrowRight,
  Building2,
  FileText,
  PhoneCall,
  CheckCircle2,
  Award,
  Users,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="space-y-16">
      {/* Institutional Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-baust-primary-950 via-baust-primary-900 to-baust-primary-800 text-white p-8 sm:p-14 shadow-military border border-baust-gold-500/30">
        <div className="absolute top-0 right-0 w-96 h-96 bg-baust-gold-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl space-y-6">
          {/* Cantonment Accreditation Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-baust-primary-800/80 border border-baust-gold-500/40 text-baust-gold-300 text-xs font-bold tracking-wide uppercase shadow-sm">
            <span className="w-2 h-2 rounded-full bg-baust-gold-400 animate-pulse" />
            <span>Saidpur Cantonment • {BAUST_INFO.motto}</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-white font-serif">
            Campus Cleanliness & Facility Governance
          </h1>

          <p className="text-base sm:text-lg text-baust-primary-100 font-normal leading-relaxed max-w-2xl">
            Official cleanliness intake, real-time workload dispatch, and tamper-evident quality governance across all academic faculties, engineering labs, and residential halls of <strong>BAUST Saidpur</strong>.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <Link
              href="/student"
              className="px-6 py-3.5 bg-baust-gold-500 hover:bg-baust-gold-400 text-slate-950 font-black text-sm rounded-xl shadow-gold transition flex items-center gap-2"
            >
              <Camera className="w-4 h-4 text-slate-950" />
              Report Cleanliness Issue (#18)
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/leaderboard"
              className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold text-sm rounded-xl border border-white/20 transition flex items-center gap-2 backdrop-blur-sm"
            >
              <Trophy className="w-4 h-4 text-baust-gold-400" />
              Campus Honor Roll (#85)
            </Link>

            <Link
              href="/login"
              className="px-6 py-3.5 bg-baust-primary-700 hover:bg-baust-primary-600 text-white font-bold text-sm rounded-xl transition flex items-center gap-2"
            >
              Portal Sign In
            </Link>
          </div>
        </div>

        {/* Live Cantonment Ticker */}
        <div className="relative z-10 mt-10 pt-6 border-t border-baust-primary-700/60 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <p className="text-baust-gold-400 font-bold uppercase tracking-wider text-[11px]">SLA Standard</p>
            <p className="text-white font-black text-lg">2h - 24h</p>
            <p className="text-baust-primary-200 text-[10px]">Strict military urgency</p>
          </div>
          <div>
            <p className="text-baust-gold-400 font-bold uppercase tracking-wider text-[11px]">Mandatory Proof</p>
            <p className="text-white font-black text-lg">100% Photos</p>
            <p className="text-baust-primary-200 text-[10px]">Photo verified resolution (#46)</p>
          </div>
          <div>
            <p className="text-baust-gold-400 font-bold uppercase tracking-wider text-[11px]">Audit Ledger</p>
            <p className="text-white font-black text-lg">Append-Only</p>
            <p className="text-baust-primary-200 text-[10px]">Immutable security logs (#87)</p>
          </div>
          <div>
            <p className="text-baust-gold-400 font-bold uppercase tracking-wider text-[11px]">Emergency Hotline</p>
            <p className="text-white font-mono font-bold text-sm">{BAUST_INFO.emergencyCleanlinessHotline}</p>
            <p className="text-baust-primary-200 text-[10px]">24/7 Cantonment Dispatch</p>
          </div>
        </div>
      </section>

      {/* Role Navigation Grid (4 Stakeholder Portals) */}
      <section className="space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-1">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Institutional Role Portals
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Tailored workflows engineered for university students, faculty, cleaning personnel, and administrators.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Student Portal Card */}
          <Link
            href="/student"
            className="group bg-white rounded-2xl border border-slate-200/90 p-6 shadow-disciplined hover:shadow-military hover:border-baust-primary-700 transition flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-baust-primary-50 text-baust-primary-800 flex items-center justify-center font-bold group-hover:bg-baust-primary-700 group-hover:text-white transition">
                <Camera className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-baust-gold-600 tracking-wider">
                  Role: Cadet & Student (#49)
                </span>
                <h3 className="font-extrabold text-slate-900 text-lg group-hover:text-baust-primary-800 transition">
                  30-Second Incident Intake
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Report washroom, canteen, or classroom sanitation issues with photos. Rate cleaning satisfaction upon verified resolution.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-baust-primary-700 group-hover:translate-x-1 transition">
              <span>Open Student Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Teacher Portal Card */}
          <Link
            href="/teacher"
            className="group bg-white rounded-2xl border border-slate-200/90 p-6 shadow-disciplined hover:shadow-military hover:border-baust-primary-700 transition flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-800 flex items-center justify-center font-bold group-hover:bg-sky-700 group-hover:text-white transition">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-sky-700 tracking-wider">
                  Role: Faculty & Teacher (#50)
                </span>
                <h3 className="font-extrabold text-slate-900 text-lg group-hover:text-baust-primary-800 transition">
                  Academic Sanitation Oversight
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Elevated priority reporting for labs, lecture galleries, and seminar rooms. Sign off or request rework on resolved tasks.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-baust-primary-700 group-hover:translate-x-1 transition">
              <span>Open Faculty Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Staff Portal Card */}
          <Link
            href="/staff"
            className="group bg-white rounded-2xl border border-slate-200/90 p-6 shadow-disciplined hover:shadow-military hover:border-baust-primary-700 transition flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold group-hover:bg-amber-600 group-hover:text-white transition">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-amber-700 tracking-wider">
                  Role: Cleaning Staff (#51)
                </span>
                <h3 className="font-extrabold text-slate-900 text-lg group-hover:text-baust-primary-800 transition">
                  Field Task Board
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Mobile-first touch interface with SLA countdowns. Mandatory before-and-after proof photo uploads for task completion.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-baust-primary-700 group-hover:translate-x-1 transition">
              <span>Open Staff Board</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Admin Portal Card */}
          <Link
            href="/admin"
            className="group bg-white rounded-2xl border border-slate-200/90 p-6 shadow-disciplined hover:shadow-military hover:border-baust-primary-700 transition flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-800 flex items-center justify-center font-bold group-hover:bg-purple-700 group-hover:text-white transition">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-purple-700 tracking-wider">
                  Role: Directorate Admin (#48)
                </span>
                <h3 className="font-extrabold text-slate-900 text-lg group-hover:text-baust-primary-800 transition">
                  Command & Dispatch Triage
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Automated workload dispatch algorithm, dynamic multi-facet search, and monthly governance letterhead generation.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-baust-primary-700 group-hover:translate-x-1 transition">
              <span>Open Admin Center</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        </div>
      </section>

      {/* Campus Facility Zones Showcase */}
      <section className="bg-white rounded-3xl border border-slate-200/90 p-8 sm:p-10 shadow-disciplined space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <span className="text-xs font-bold text-baust-gold-600 uppercase tracking-wider">
              Cantonment Spatial Registry
            </span>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Monitored Campus Sectors
            </h2>
          </div>
          <Link
            href="/leaderboard"
            className="text-xs font-bold text-baust-primary-700 hover:text-baust-primary-900 flex items-center gap-1"
          >
            <span>View Cleanliness Honor Roll</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {BAUST_BUILDINGS.slice(0, 8).map((b) => (
            <div
              key={b.id}
              className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-baust-primary-50/40 transition space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-baust-primary-100 text-baust-primary-800 uppercase">
                  {b.category}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">{b.floors.length} Levels</span>
              </div>
              <h4 className="font-bold text-slate-900 text-sm">{b.name}</h4>
              <p className="text-[11px] text-slate-500 line-clamp-1">{b.departments.join(', ')}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
