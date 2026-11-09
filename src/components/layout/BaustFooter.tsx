import React from 'react';
import Link from 'next/link';
import { BAUST_INFO } from '@/config/baust-campus';

export function BaustFooter() {
  return (
    <footer className="w-full bg-[#072A18] text-white border-t-4 border-[#D4AF37] mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Institutional Crest & Identity */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#0B4627] border border-[#D4AF37] flex items-center justify-center text-[#D4AF37] font-black text-xs">
                ★
              </div>
              <div>
                <h4 className="font-extrabold text-sm tracking-tight text-white uppercase">
                  {BAUST_INFO.shortName} Saidpur
                </h4>
                <p className="text-[10px] text-emerald-200/80 font-mono">Cantonment Campus</p>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Bangladesh Army University of Science and Technology. A premier military-administered university upholding academic excellence, hygiene, and discipline.
            </p>
            <div className="text-[11px] text-[#D4AF37] italic font-serif">
              &ldquo;{BAUST_INFO.motto}&rdquo;
            </div>
          </div>

          {/* Quick Portal Links */}
          <div className="space-y-2 text-xs">
            <h5 className="font-bold text-[#D4AF37] uppercase tracking-wider text-[11px]">
              Stakeholder Portals
            </h5>
            <ul className="space-y-1.5 text-slate-300">
              <li>
                <Link href="/student" className="hover:text-white transition">
                  Cadet & Student Portal (#49)
                </Link>
              </li>
              <li>
                <Link href="/teacher" className="hover:text-white transition">
                  Faculty & Department Oversight (#50)
                </Link>
              </li>
              <li>
                <Link href="/staff" className="hover:text-white transition">
                  Cleaning Staff Task Board (#51)
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-white transition">
                  Admin Command & Dispatch (#48)
                </Link>
              </li>
              <li>
                <Link href="/leaderboard" className="hover:text-white transition">
                  Campus Cleanliness Honor Roll (#85)
                </Link>
              </li>
            </ul>
          </div>

          {/* Monitored Campus Sectors */}
          <div className="space-y-2 text-xs">
            <h5 className="font-bold text-[#D4AF37] uppercase tracking-wider text-[11px]">
              Campus Sectors
            </h5>
            <ul className="space-y-1.5 text-slate-300">
              <li>Academic Building 1 (ECE Faculty)</li>
              <li>Academic Building 2 (ME & Civil)</li>
              <li>Business Studies & Humanities</li>
              <li>Central Library & Auditorium</li>
              <li>Abbasuddin Ahmed Hall (Male)</li>
              <li>Bir Protik Taramon Bibi Hall (Female)</li>
              <li>Central Cafeteria & Canteen</li>
            </ul>
          </div>

          {/* Directorate Contact & Emergency */}
          <div className="space-y-2 text-xs">
            <h5 className="font-bold text-[#D4AF37] uppercase tracking-wider text-[11px]">
              Estate & Maintenance
            </h5>
            <div className="text-slate-300 space-y-1">
              <p>Saidpur Cantonment, Nilphamari-5311</p>
              <p>Email: <a href={`mailto:${BAUST_INFO.estateOfficeEmail}`} className="text-emerald-300 hover:underline">{BAUST_INFO.estateOfficeEmail}</a></p>
              <p>Hotline: <span className="font-mono text-white font-bold">{BAUST_INFO.hotline}</span></p>
              <div className="pt-2">
                <div className="p-2.5 rounded-lg bg-red-950/80 border border-red-800 text-red-100">
                  <div className="font-bold text-[11px] text-red-200">Emergency Cleanliness Hotline (#29)</div>
                  <div className="font-mono text-xs text-white font-bold">{BAUST_INFO.emergencyCleanlinessHotline}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Strip */}
        <div className="mt-8 pt-6 border-t border-emerald-900/60 flex flex-wrap items-center justify-between text-[11px] text-emerald-300/70 gap-2">
          <div>
            &copy; {new Date().getFullYear()} Bangladesh Army University of Science and Technology (BAUST), Saidpur. All rights reserved.
          </div>
          <div className="flex gap-4">
            <span>Discipline • Knowledge • Morality</span>
            <span>•</span>
            <a href="https://www.baust.edu.bd" target="_blank" rel="noopener noreferrer" className="hover:text-white">
              Official Website
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

