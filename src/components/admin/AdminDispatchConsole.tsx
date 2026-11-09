'use client';

import React, { useState } from 'react';
import { BaustCard } from '@/components/ui/BaustCard';
import { MonthlyReportLetterhead } from '@/components/reports/MonthlyReportLetterhead';
import {
  Zap,
  Search,
  AlertTriangle,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { BAUST_BUILDINGS } from '@/config/baust-campus';

export interface AdminIssue {
  id: string;
  reference_number: string;
  category: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';
  status: string;
  sla_deadline: string;
  created_at: string;
  is_anonymous: boolean;
  location?: {
    building: string;
    floor: string;
    specific_area: string;
  };
}

interface AdminDispatchConsoleProps {
  initialIssues: AdminIssue[];
  staffProfiles: { id: string; full_name: string; shift_type: string; is_available: boolean }[];
}

export function AdminDispatchConsole({ initialIssues, staffProfiles }: AdminDispatchConsoleProps) {
  const [issues, setIssues] = useState<AdminIssue[]>(initialIssues);
  const [activeTab, setActiveTab] = useState<'dispatch' | 'all' | 'monthly_report'>('dispatch');

  const [searchTerm, setSearchTerm] = useState('');
  const [filterBuilding, setFilterBuilding] = useState('ALL');
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const [selectedStaffMap, setSelectedStaffMap] = useState<Record<string, string>>({});
  const [loadingIssueId, setLoadingIssueId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  const handleAutoDispatch = async (issueId: string) => {
    setLoadingIssueId(issueId);
    setActionMessage(null);
    try {
      const res = await fetch('/api/dispatch/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issue_id: issueId, auto_dispatch: true }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Auto-dispatch failed');

      setActionMessage({ text: 'Auto-dispatch triggered successfully (#41)' });
      setIssues((prev) =>
        prev.map((i) => (i.id === issueId ? { ...i, status: 'ASSIGNED' } : i))
      );
    } catch (err) {
      setActionMessage({ text: (err as Error).message, isError: true });
    } finally {
      setLoadingIssueId(null);
    }
  };

  const handleManualAssign = async (issueId: string) => {
    const staffId = selectedStaffMap[issueId];
    if (!staffId) {
      setActionMessage({ text: 'Please select a staff member first.', isError: true });
      return;
    }

    setLoadingIssueId(issueId);
    setActionMessage(null);
    try {
      const res = await fetch('/api/dispatch/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issue_id: issueId, staff_id: staffId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Assignment failed');

      setActionMessage({ text: 'Task successfully assigned to staff (#38)' });
      setIssues((prev) =>
        prev.map((i) => (i.id === issueId ? { ...i, status: 'ASSIGNED' } : i))
      );
    } catch (err) {
      setActionMessage({ text: (err as Error).message, isError: true });
    } finally {
      setLoadingIssueId(null);
    }
  };

  const filteredIssues = issues.filter((item) => {
    const matchSearch =
      searchTerm.trim() === '' ||
      item.reference_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.location?.building && item.location.building.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchBuilding = filterBuilding === 'ALL' || item.location?.building === filterBuilding;
    const matchPriority = filterPriority === 'ALL' || item.priority === filterPriority;
    const matchStatus = filterStatus === 'ALL' || item.status === filterStatus;

    return matchSearch && matchBuilding && matchPriority && matchStatus;
  });

  const unassignedIssues = filteredIssues.filter((i) => i.status === 'SUBMITTED');

  return (
    <div className="space-y-6">
      <div className="flex border-b border-slate-200 gap-6">
        <button
          type="button"
          onClick={() => setActiveTab('dispatch')}
          className={`pb-3 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'dispatch'
              ? 'border-baust-primary-700 text-baust-primary-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Zap className="w-4 h-4 text-baust-gold-600" />
          <span>Real-Time Dispatch Queue (#38-#42)</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-800 font-extrabold">
            {unassignedIssues.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`pb-3 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'all'
              ? 'border-baust-primary-700 text-baust-primary-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Search className="w-4 h-4 text-slate-500" />
          <span>Multi-Facet Search & Dynamic Triage (#68-#75)</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700">
            {filteredIssues.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('monthly_report')}
          className={`pb-3 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'monthly_report'
              ? 'border-baust-primary-700 text-baust-primary-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4 text-emerald-700" />
          <span>Official Monthly Report Preview (#86)</span>
        </button>
      </div>

      {actionMessage && (
        <div
          className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            actionMessage.isError
              ? 'bg-red-50 text-red-800 border border-red-200'
              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
          }`}
        >
          {actionMessage.isError ? (
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {activeTab === 'dispatch' && (
        <BaustCard
          title="Triage & Staff Workload Dispatch Queue"
          subtitle="Assign pending cleanliness reports to available cantonment staff"
          variant="accent"
          actions={
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Realtime changes active</span>
            </div>
          }
        >
          {unassignedIssues.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h4 className="font-bold text-slate-900 text-sm">Dispatch Queue Clear</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                All submitted incidents across BAUST facilities have been assigned to cleaning personnel.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {unassignedIssues.map((issue) => {
                const isEmergency = issue.priority === 'EMERGENCY';
                return (
                  <div key={issue.id} className="py-4 space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1 max-w-xl">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black text-baust-primary-950">
                            {issue.reference_number}
                          </span>
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                              isEmergency ? 'bg-red-600 text-white animate-pulse' : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {issue.priority}
                          </span>
                          {issue.is_anonymous && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                              ANONYMOUS (#30)
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs font-bold text-slate-900">{issue.description}</h4>
                        <p className="text-xs text-slate-500">
                          Zone: <strong>{issue.location?.building}</strong> • {issue.location?.floor}{' '}
                          {issue.location?.specific_area && `(${issue.location.specific_area})`}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          disabled={loadingIssueId === issue.id}
                          onClick={() => handleAutoDispatch(issue.id)}
                          className="px-3.5 py-2 bg-baust-gold-500 hover:bg-baust-gold-600 disabled:opacity-50 text-slate-950 text-xs font-extrabold rounded-xl transition flex items-center gap-1.5 shadow-sm"
                        >
                          <Zap className="w-3.5 h-3.5 text-slate-950 fill-slate-950" />
                          Auto Dispatch (#41)
                        </button>

                        <div className="flex items-center gap-1.5">
                          <select
                            value={selectedStaffMap[issue.id] || ''}
                            onChange={(e) =>
                              setSelectedStaffMap((prev) => ({ ...prev, [issue.id]: e.target.value }))
                            }
                            className="text-xs px-2.5 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-baust-primary-600 font-medium"
                          >
                            <option value="">Select Staff...</option>
                            {staffProfiles.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.full_name} ({s.shift_type}) {s.is_available ? '✓' : '(Off)'}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            disabled={loadingIssueId === issue.id || !selectedStaffMap[issue.id]}
                            onClick={() => handleManualAssign(issue.id)}
                            className="px-3 py-2 bg-baust-primary-700 hover:bg-baust-primary-800 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition"
                          >
                            Assign
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </BaustCard>
      )}

      {activeTab === 'all' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-disciplined space-y-3">
            <div className="grid sm:grid-cols-4 gap-3">
              <div className="sm:col-span-1 relative">
                <input
                  type="text"
                  placeholder="Search Ref, keyword..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-baust-primary-600 text-slate-900"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>

              <div>
                <select
                  value={filterBuilding}
                  onChange={(e) => setFilterBuilding(e.target.value)}
                  className="w-full text-xs px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-baust-primary-600 text-slate-900 font-medium"
                >
                  <option value="ALL">All Campus Buildings</option>
                  {BAUST_BUILDINGS.map((b) => (
                    <option key={b.id} value={b.name}>
                      {b.shortName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="w-full text-xs px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-baust-primary-600 text-slate-900 font-medium"
                >
                  <option value="ALL">All Priorities</option>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="EMERGENCY">Emergency</option>
                </select>
              </div>

              <div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full text-xs px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-baust-primary-600 text-slate-900 font-medium"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="SUBMITTED">Submitted</option>
                  <option value="ASSIGNED">Assigned</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="VERIFIED">Verified</option>
                  <option value="REOPENED">Reopened</option>
                </select>
              </div>
            </div>
          </div>

          <BaustCard title="Incident Audit Ledger (#68-#75)" variant="military">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-2.5 px-3">Reference ID (#32)</th>
                    <th className="py-2.5 px-3">Zone / Facility</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3 text-center">Priority</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredIssues.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-3 font-mono font-bold text-baust-primary-900">
                        {item.reference_number}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-slate-900">{item.location?.building}</span>
                        <div className="text-[11px] text-slate-500">{item.location?.floor}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-700 max-w-xs truncate">
                        {item.description}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                            item.priority === 'EMERGENCY'
                              ? 'bg-red-600 text-white'
                              : item.priority === 'HIGH'
                              ? 'bg-amber-500 text-white'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {item.priority}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 uppercase">
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right text-slate-500">
                        {new Date(item.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </BaustCard>
        </div>
      )}

      {activeTab === 'monthly_report' && (
        <div className="space-y-4">
          <MonthlyReportLetterhead />
        </div>
      )}
    </div>
  );
}
