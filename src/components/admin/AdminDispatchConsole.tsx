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
  ShieldCheck,
  RotateCcw,
  X,
  Star,
  Check,
  Eye,
  Camera,
  MapPin,
  Clock,
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
  photo_urls?: string[];
  proof_photo_urls?: string[];
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
  const [activeTab, setActiveTab] = useState<'dispatch' | 'review_work' | 'all' | 'monthly_report'>('dispatch');

  const [searchTerm, setSearchTerm] = useState('');
  const [filterBuilding, setFilterBuilding] = useState('ALL');
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const [selectedStaffMap, setSelectedStaffMap] = useState<Record<string, string>>({});
  const [loadingIssueId, setLoadingIssueId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  // Supervisor Triage: Reject Modal (Figure 3: Supervisor Review -> Legitimate? -> No)
  const [rejectIssueModal, setRejectIssueModal] = useState<AdminIssue | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  // Supervisor Review Work: Approval Modal (Figure 3: Review Work -> Approved? -> Yes)
  const [approveWorkModal, setApproveWorkModal] = useState<AdminIssue | null>(null);
  const [approvalRating, setApprovalRating] = useState(5);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [isApproving, setIsApproving] = useState(false);

  // Supervisor Review Work: Rework Modal (Figure 3: Review Work -> Approved? -> No)
  const [reworkModal, setReworkModal] = useState<AdminIssue | null>(null);
  const [reworkReason, setReworkReason] = useState('');
  const [isSubmittingRework, setIsSubmittingRework] = useState(false);

  // Photo Full View Modal
  const [viewPhotoUrl, setViewPhotoUrl] = useState<string | null>(null);

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

  // Supervisor Triage: Reject & Close Issue
  const handleConfirmReject = async () => {
    if (!rejectIssueModal) return;
    if (!rejectReason.trim() || rejectReason.trim().length < 5) {
      setActionMessage({ text: 'Please provide a valid rejection explanation (min 5 chars).', isError: true });
      return;
    }

    setIsRejecting(true);
    try {
      const res = await fetch('/api/issues/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issue_id: rejectIssueModal.id,
          reason: rejectReason.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to reject issue');

      setIssues((prev) =>
        prev.map((i) => (i.id === rejectIssueModal.id ? { ...i, status: 'CANCELLED' } : i))
      );
      setActionMessage({ text: `Report ${rejectIssueModal.reference_number} marked non-actionable and closed.` });
      setRejectIssueModal(null);
      setRejectReason('');
    } catch (err) {
      setActionMessage({ text: (err as Error).message, isError: true });
    } finally {
      setIsRejecting(false);
    }
  };

  // Supervisor: Approve Work
  const handleConfirmApproveWork = async () => {
    if (!approveWorkModal) return;
    setIsApproving(true);
    try {
      const res = await fetch('/api/dispatch/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issue_id: approveWorkModal.id,
          notes: approvalNotes || 'Supervisor verified sanitation satisfactory.',
          rating: approvalRating,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to approve work');

      setIssues((prev) =>
        prev.map((i) => (i.id === approveWorkModal.id ? { ...i, status: 'VERIFIED' } : i))
      );
      setActionMessage({ text: `Work Order ${approveWorkModal.reference_number} verified and closed with ${approvalRating}-star rating.` });
      setApproveWorkModal(null);
      setApprovalNotes('');
    } catch (err) {
      setActionMessage({ text: (err as Error).message, isError: true });
    } finally {
      setIsApproving(false);
    }
  };

  // Supervisor: Request Rework
  const handleConfirmRework = async () => {
    if (!reworkModal) return;
    if (!reworkReason.trim() || reworkReason.trim().length < 5) {
      setActionMessage({ text: 'Please explain what needs rework (min 5 characters).', isError: true });
      return;
    }

    setIsSubmittingRework(true);
    try {
      const res = await fetch('/api/dispatch/rework', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issue_id: reworkModal.id,
          reason: reworkReason.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to request rework');

      setIssues((prev) =>
        prev.map((i) => (i.id === reworkModal.id ? { ...i, status: 'IN_PROGRESS' } : i))
      );
      setActionMessage({ text: `Work Order ${reworkModal.reference_number} sent back to cleaner for rework.` });
      setReworkModal(null);
      setReworkReason('');
    } catch (err) {
      setActionMessage({ text: (err as Error).message, isError: true });
    } finally {
      setIsSubmittingRework(false);
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
  const resolvedIssues = filteredIssues.filter((i) => i.status === 'RESOLVED');

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-6 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('dispatch')}
          className={`pb-3 text-sm font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'dispatch'
              ? 'border-baust-primary-700 text-baust-primary-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Zap className="w-4 h-4 text-baust-gold-600" />
          <span>Real-Time Dispatch Queue</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-800 font-extrabold">
            {unassignedIssues.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('review_work')}
          className={`pb-3 text-sm font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'review_work'
              ? 'border-baust-primary-700 text-baust-primary-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-700" />
          <span>Supervisor Work Review</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-800 font-extrabold">
            {resolvedIssues.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`pb-3 text-sm font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'all'
              ? 'border-baust-primary-700 text-baust-primary-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Search className="w-4 h-4 text-slate-500" />
          <span>Incident Ledger & Triage</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700">
            {filteredIssues.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('monthly_report')}
          className={`pb-3 text-sm font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'monthly_report'
              ? 'border-baust-primary-700 text-baust-primary-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4 text-emerald-700" />
          <span>Official Monthly Report Preview</span>
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

      {/* Tab 1: Dispatch Queue (Figure 1 & 3: Triage & Assignment) */}
      {activeTab === 'dispatch' && (
        <BaustCard
          title="Triage & Staff Workload Dispatch Queue"
          subtitle="Review submitted reports, verify legitimacy, and assign to cleaning personnel"
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

                        {issue.photo_urls && issue.photo_urls.length > 0 && (
                          <div className="flex gap-2 pt-1">
                            {issue.photo_urls.map((url, i) => (
                              <button
                                type="button"
                                key={i}
                                onClick={() => setViewPhotoUrl(url)}
                                className="relative group rounded border border-slate-200 overflow-hidden"
                              >
                                <img
                                  src={url}
                                  alt="Report Attachment"
                                  className="w-12 h-10 object-cover"
                                />
                                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                  <Eye className="w-3.5 h-3.5 text-white" />
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* Auto Dispatch Button */}
                        <button
                          type="button"
                          disabled={loadingIssueId === issue.id}
                          onClick={() => handleAutoDispatch(issue.id)}
                          className="px-3.5 py-2 bg-baust-gold-500 hover:bg-baust-gold-600 disabled:opacity-50 text-slate-950 text-xs font-extrabold rounded-xl transition flex items-center gap-1.5 shadow-sm"
                        >
                          <Zap className="w-3.5 h-3.5 text-slate-950 fill-slate-950" />
                          Auto Dispatch (#41)
                        </button>

                        {/* Manual Assignment */}
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

                        {/* Supervisor Triage: Reject Report (Figure 3: Review Issue -> Legitimate? No -> Reject & Close) */}
                        <button
                          type="button"
                          onClick={() => {
                            setRejectIssueModal(issue);
                            setRejectReason('');
                          }}
                          className="px-3 py-2 border border-red-200 text-red-700 hover:bg-red-50 text-xs font-bold rounded-lg transition"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </BaustCard>
      )}

      {/* Tab 2: Supervisor Work Review (Figure 1 & 3: Review Work -> Approved? Yes/No) */}
      {activeTab === 'review_work' && (
        <BaustCard
          title="Supervisor Work Review & Quality Sign-Off"
          subtitle="Compare initial report photos against cleaner after-photos and sign off or request rework"
          variant="accent"
        >
          {resolvedIssues.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h4 className="font-bold text-slate-900 text-sm">All Completed Tasks Verified</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No cleaning work orders are currently awaiting supervisor inspection.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {resolvedIssues.map((issue) => {
                const initialPhoto = issue.photo_urls?.[0];
                const proofPhoto = issue.proof_photo_urls?.[0];
                const isOverdue = new Date() > new Date(issue.sla_deadline);

                return (
                  <div
                    key={issue.id}
                    className="p-5 bg-white border border-slate-200 rounded-xl shadow-disciplined space-y-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black text-baust-primary-950">
                            {issue.reference_number}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase">
                            Cleaning Completed
                          </span>
                          {isOverdue && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800">
                              SLA Breached
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 mt-1">{issue.description}</h4>
                        <p className="text-xs text-slate-500">
                          Facility: <strong>{issue.location?.building}</strong> ({issue.location?.floor} • {issue.location?.specific_area}) • Category: {issue.category}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setReworkModal(issue);
                            setReworkReason('');
                          }}
                          className="px-3.5 py-2 border border-amber-300 text-amber-900 hover:bg-amber-50 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Request Rework (Fig 3)
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setApproveWorkModal(issue);
                            setApprovalRating(5);
                            setApprovalNotes('');
                          }}
                          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold rounded-xl transition flex items-center gap-1.5 shadow-sm"
                        >
                          <Check className="w-4 h-4" />
                          Approve Work & Sign-Off
                        </button>
                      </div>
                    </div>

                    {/* Photographic Comparison: Before vs After (Figure 1 & 4) */}
                    <div className="grid sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <div>
                        <span className="text-xs font-bold text-slate-700 block mb-1.5">
                          Initial Incident Report (Before Photo)
                        </span>
                        {initialPhoto ? (
                          <div
                            onClick={() => setViewPhotoUrl(initialPhoto)}
                            className="relative cursor-pointer group rounded-lg overflow-hidden border border-slate-300 max-h-48"
                          >
                            <img
                              src={initialPhoto}
                              alt="Before Incident"
                              className="w-full h-44 object-cover"
                            />
                            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold">
                              Click to Enlarge
                            </div>
                          </div>
                        ) : (
                          <div className="h-44 rounded-lg bg-slate-100 flex items-center justify-center text-xs text-slate-400">
                            No Initial Photo Provided
                          </div>
                        )}
                      </div>

                      <div>
                        <span className="text-xs font-bold text-emerald-800 block mb-1.5">
                          Sanitization Proof (After Photo) ✓
                        </span>
                        {proofPhoto ? (
                          <div
                            onClick={() => setViewPhotoUrl(proofPhoto)}
                            className="relative cursor-pointer group rounded-lg overflow-hidden border-2 border-emerald-400 max-h-48"
                          >
                            <img
                              src={proofPhoto}
                              alt="After Cleaned Proof"
                              className="w-full h-44 object-cover"
                            />
                            <div className="absolute inset-0 bg-emerald-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold">
                              Click to Enlarge
                            </div>
                          </div>
                        ) : (
                          <div className="h-44 rounded-lg bg-slate-100 flex items-center justify-center text-xs text-slate-400">
                            Awaiting Cleaner After Photo
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </BaustCard>
      )}

      {/* Tab 3: All Incidents Ledger */}
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
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          <BaustCard title="Incident Audit Ledger (#68-#75)" variant="military">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-2.5 px-3">Reference ID</th>
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

      {/* Tab 4: Monthly Report */}
      {activeTab === 'monthly_report' && (
        <div className="space-y-4">
          <MonthlyReportLetterhead />
        </div>
      )}

      {/* Modal 1: Supervisor Reject Report (Figure 3: Review Issue -> Legitimate? No -> Reject & Close) */}
      {rejectIssueModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-military border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-red-700">
                  {rejectIssueModal.reference_number}
                </span>
                <h3 className="font-extrabold text-slate-900 text-base">
                  Reject Cleanliness Report (Figure 3)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRejectIssueModal(null)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Provide the institutional reason for marking this report non-legitimate or non-actionable. The reporter will be notified.
            </p>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Rejection Reason *</label>
              <textarea
                rows={3}
                placeholder="e.g. Area already serviced, non-verifiable report, or duplicate submission."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectIssueModal(null)}
                className="flex-1 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isRejecting}
                onClick={handleConfirmReject}
                className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                {isRejecting ? 'Rejecting...' : 'Reject & Close Issue'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Supervisor Approve Work (Figure 3: Review Work -> Approved? Yes -> Approve Work) */}
      {approveWorkModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-military border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-emerald-800">
                  {approveWorkModal.reference_number}
                </span>
                <h3 className="font-extrabold text-slate-900 text-base">
                  Supervisor Work Approval & Sign-Off
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setApproveWorkModal(null)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Sanitation Quality Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setApprovalRating(star)}
                    className="p-1 text-slate-300 hover:text-baust-gold-500 transition"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= approvalRating
                          ? 'text-baust-gold-500 fill-baust-gold-500'
                          : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Supervisor Inspection Notes (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Area inspected, compliant with BAUST hygiene standards."
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-baust-primary-600"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setApproveWorkModal(null)}
                className="flex-1 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isApproving}
                onClick={handleConfirmApproveWork}
                className="flex-1 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                {isApproving ? 'Approving...' : 'Sign-Off & Close Work Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Supervisor Request Rework (Figure 3: Review Work -> Approved? No -> Return to Cleaner) */}
      {reworkModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-military border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-amber-800">
                  {reworkModal.reference_number}
                </span>
                <h3 className="font-extrabold text-slate-900 text-base">
                  Request Rework from Cleaning Staff
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setReworkModal(null)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Specify what deficiencies were found during inspection. The work order will be returned to the cleaning staff as <strong>In Progress</strong>.
            </p>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Deficiency Details *</label>
              <textarea
                rows={3}
                placeholder="e.g. Dust behind podium remained uncleaned; washroom mirror has streaks."
                value={reworkReason}
                onChange={(e) => setReworkReason(e.target.value)}
                className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReworkModal(null)}
                className="flex-1 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingRework}
                onClick={handleConfirmRework}
                className="flex-1 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                {isSubmittingRework ? 'Submitting...' : 'Return to Cleaner'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Enlarge Photo */}
      {viewPhotoUrl && (
        <div
          onClick={() => setViewPhotoUrl(null)}
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="max-w-3xl max-h-[85vh] relative" onClick={(e) => e.stopPropagation()}>
            <img
              src={viewPhotoUrl}
              alt="Enlarged Photographic Evidence"
              className="max-h-[80vh] w-auto rounded-xl object-contain border-2 border-white/20 shadow-2xl"
            />
            <button
              type="button"
              onClick={() => setViewPhotoUrl(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-900/80 text-white flex items-center justify-center hover:bg-slate-900"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
