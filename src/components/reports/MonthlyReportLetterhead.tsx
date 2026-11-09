'use client';

import React from 'react';
import { BAUST_INFO } from '@/config/baust-campus';
import { Printer, ShieldCheck, FileText } from 'lucide-react';

export interface MonthlyReportData {
  month: string;
  totalIssues: number;
  resolvedIssues: number;
  slaAdherenceRate: number;
  reopenRate: number;
  cleanlinessIndex: number;
  departmentBreakdown: {
    name: string;
    total: number;
    resolved: number;
    slaMet: number;
    grade: string;
  }[];
}

interface MonthlyReportLetterheadProps {
  data?: MonthlyReportData;
  className?: string;
}

export function MonthlyReportLetterhead({ data, className = '' }: MonthlyReportLetterheadProps) {
  const now = new Date();
  const currentMonthStr = `${now.toLocaleString('default', { month: 'long' })} ${now.getFullYear()}`;

  const report = data || {
    month: currentMonthStr,
    totalIssues: 148,
    resolvedIssues: 142,
    slaAdherenceRate: 95.9,
    reopenRate: 2.1,
    cleanlinessIndex: 94.2,
    departmentBreakdown: [
      { name: 'Academic Building 1 (ECE Faculty: CSE, EEE)', total: 42, resolved: 41, slaMet: 40, grade: 'A+' },
      { name: 'Academic Building 2 (ME & Civil Faculty)', total: 36, resolved: 34, slaMet: 33, grade: 'A' },
      { name: 'Faculty of Business Studies & Humanities', total: 18, resolved: 18, slaMet: 17, grade: 'A+' },
      { name: 'Administration Building & VC Secretariat', total: 12, resolved: 12, slaMet: 12, grade: 'A+' },
      { name: 'Central Library & Auditorium Complex', total: 14, resolved: 14, slaMet: 14, grade: 'A+' },
      { name: 'Abbasuddin Ahmed Hall (Male Hostel)', total: 15, resolved: 13, slaMet: 12, grade: 'B+' },
      { name: 'Bir Protik Taramon Bibi Hall (Female Hostel)', total: 11, resolved: 10, slaMet: 10, grade: 'A' },
    ],
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
          <FileText className="w-4 h-4 text-baust-primary-700" />
          <span>Official Monthly Cleanliness Compliance Record (#86)</span>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-baust-primary-700 hover:bg-baust-primary-800 text-white rounded-lg text-xs font-bold shadow-sm transition"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Official Copy
          </button>
        </div>
      </div>

      <div className="bg-white border-2 border-slate-300 rounded-2xl p-8 sm:p-12 shadow-disciplined space-y-8 text-slate-900 font-sans print:border-none print:shadow-none print:p-0">
        <div className="text-center border-b-2 border-baust-primary-900 pb-6 space-y-2 relative">
          <div className="flex items-center justify-center gap-4">
            <div className="w-14 h-14 rounded-full bg-baust-primary-900 text-baust-gold-400 flex items-center justify-center font-black text-2xl border-2 border-baust-gold-500 shadow-sm">
              ★
            </div>
            <div className="text-center">
              <h1 className="text-xl sm:text-2xl font-black text-baust-primary-950 uppercase tracking-tight font-serif">
                {BAUST_INFO.name}
              </h1>
              <p className="text-xs sm:text-sm font-bold text-baust-primary-800 tracking-wide">
                {BAUST_INFO.campus} • Nilphamari-5311, Bangladesh
              </p>
              <p className="text-xs font-semibold text-baust-gold-700 italic tracking-wider pt-0.5 font-serif">
                &quot;{BAUST_INFO.motto}&quot;
              </p>
            </div>
          </div>

          <div className="pt-3 flex flex-wrap justify-between items-center text-xs text-slate-600 border-t border-slate-200 mt-4">
            <span>
              <strong className="text-slate-800">Office of the Estate & Hygiene Officer</strong>
            </span>
            <span className="font-mono text-slate-700">
              Ref: BAUST/EST/HYGIENE/{new Date().getFullYear()}/M-{new Date().getMonth() + 1}
            </span>
            <span>Date: {now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
        </div>

        <div className="text-center space-y-1">
          <h2 className="text-lg sm:text-xl font-bold uppercase tracking-wider text-slate-900 underline decoration-baust-gold-500 decoration-2 underline-offset-4">
            Monthly Campus Cleanliness Governance & Quality Report
          </h2>
          <p className="text-xs text-slate-600">
            Reporting Period: <strong className="text-slate-900">{report.month}</strong>
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
          <div className="space-y-0.5">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Reports</p>
            <p className="text-2xl font-black text-slate-900">{report.totalIssues}</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Resolved</p>
            <p className="text-2xl font-black text-emerald-800">{report.resolvedIssues}</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">SLA Adherence</p>
            <p className="text-2xl font-black text-baust-primary-800">{report.slaAdherenceRate}%</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Campus Hygiene Index</p>
            <p className="text-2xl font-black text-baust-gold-700">{report.cleanlinessIndex} / 100</p>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Departmental & Facility Breakdown
          </h3>
          <table className="w-full text-left text-xs border border-slate-300">
            <thead>
              <tr className="bg-baust-primary-900 text-white font-bold">
                <th className="py-2.5 px-3 border border-baust-primary-800">Facility / Sector</th>
                <th className="py-2.5 px-3 border border-baust-primary-800 text-center">Incidents</th>
                <th className="py-2.5 px-3 border border-baust-primary-800 text-center">Resolved</th>
                <th className="py-2.5 px-3 border border-baust-primary-800 text-center">SLA Met</th>
                <th className="py-2.5 px-3 border border-baust-primary-800 text-center">Compliance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {report.departmentBreakdown.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="py-2 px-3 font-semibold text-slate-900 border border-slate-200">
                    {row.name}
                  </td>
                  <td className="py-2 px-3 text-center border border-slate-200">{row.total}</td>
                  <td className="py-2 px-3 text-center font-bold text-emerald-700 border border-slate-200">
                    {row.resolved}
                  </td>
                  <td className="py-2 px-3 text-center border border-slate-200">{row.slaMet}</td>
                  <td className="py-2 px-3 text-center font-bold text-baust-primary-900 border border-slate-200">
                    {row.grade}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="text-xs text-slate-700 space-y-1 bg-amber-50/50 p-4 rounded-xl border border-amber-200">
          <p className="font-bold text-slate-900 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            Institutional Quality Assurance Certification
          </p>
          <p className="text-[11px] text-slate-600">
            This document certifies that all reported cleanliness and sanitation incidents across BAUST Saidpur Cantonment facilities have been triaged according to the Standard Operating Procedures (SOP), with photographic proof and multi-party verification securely archived in the immutable database audit ledger.
          </p>
        </div>

        <div className="pt-12 grid grid-cols-3 gap-6 text-center text-xs">
          <div className="space-y-1">
            <div className="border-t border-slate-400 pt-2 font-bold text-slate-900">
              Campus Hygiene Supervisor
            </div>
            <div className="text-[10px] text-slate-500">Estate Branch, BAUST</div>
          </div>

          <div className="space-y-1">
            <div className="border-t border-slate-400 pt-2 font-bold text-slate-900">
              Director of Students&apos; Welfare (DSW)
            </div>
            <div className="text-[10px] text-slate-500">BAUST Saidpur Cantonment</div>
          </div>

          <div className="space-y-1">
            <div className="border-t border-slate-400 pt-2 font-bold text-slate-900">
              Registrar / Estate Officer
            </div>
            <div className="text-[10px] text-slate-500">BAUST Saidpur</div>
          </div>
        </div>
      </div>
    </div>
  );
}

