'use client';

import React, { useState } from 'react';
import { BaustCard } from '@/components/ui/BaustCard';
import {
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Star,
  RotateCcw,
  X,
  ShieldCheck,
  Eye,
} from 'lucide-react';

export interface StudentIssueItem {
  id: string;
  reference_number: string;
  category: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';
  status: 'SUBMITTED' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'VERIFIED' | 'REOPENED';
  photo_urls: string[];
  proof_photo_urls?: string[];
  created_at: string;
  sla_deadline: string;
  reopen_count: number;
  location?: {
    building: string;
    floor: string;
    specific_area: string;
  };
}

interface StudentIssueTrackerProps {
  initialIssues: StudentIssueItem[];
}

export function StudentIssueTracker({ initialIssues }: StudentIssueTrackerProps) {
  const [issues, setIssues] = useState<StudentIssueItem[]>(initialIssues);
  const [selectedIssueForVerification, setSelectedIssueForVerification] = useState<StudentIssueItem | null>(null);
  const [selectedIssueForDetails, setSelectedIssueForDetails] = useState<StudentIssueItem | null>(null);

  const [rating, setRating] = useState<number>(5);
  const [feedback, setFeedback] = useState<string>('');
  const [isReopenMode, setIsReopenMode] = useState<boolean>(false);
  const [reopenReason, setReopenReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const statusColors: Record<string, string> = {
    SUBMITTED: 'bg-amber-100 text-amber-800 border-amber-300',
    ASSIGNED: 'bg-sky-100 text-sky-800 border-sky-300',
    IN_PROGRESS: 'bg-sky-100 text-sky-800 border-sky-300 animate-pulse',
    RESOLVED: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    VERIFIED: 'bg-emerald-200 text-emerald-950 border-emerald-400 font-bold',
    REOPENED: 'bg-red-100 text-red-800 border-red-300',
  };

  const handleVerifyOrReopen = async (satisfactory: boolean) => {
    if (!selectedIssueForVerification) return;
    if (!satisfactory && (!reopenReason.trim() || reopenReason.trim().length < 5)) {
      setModalError('Please state why the cleanliness is unsatisfactory (min 5 characters).');
      return;
    }

    setIsSubmitting(true);
    setModalError(null);

    try {
      const res = await fetch('/api/issues/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issue_id: selectedIssueForVerification.id,
          is_satisfactory: satisfactory,
          student_rating: satisfactory ? rating : 1,
          feedback_notes: feedback || (satisfactory ? 'Cleanliness verified satisfactory.' : reopenReason),
          reopen_reason: satisfactory ? undefined : reopenReason,
        }),
      });

      const resJson = await res.json();
      if (!res.ok) throw new Error(resJson.error || 'Failed to submit verification');

      setIssues((prev) =>
        prev.map((item) =>
          item.id === selectedIssueForVerification.id
            ? {
                ...item,
                status: satisfactory ? 'VERIFIED' : 'REOPENED',
                reopen_count: satisfactory ? item.reopen_count : item.reopen_count + 1,
              }
            : item
        )
      );

      setSelectedIssueForVerification(null);
      setIsReopenMode(false);
      setReopenReason('');
      setFeedback('');
    } catch (err) {
      setModalError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <BaustCard
        title="My Reported Incidents & Tracking"
        subtitle="Review work orders, inspect proof photos, and rate hygiene quality (#78-#81)"
        variant="military"
      >
        {issues.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs text-slate-500">
              You have not submitted any cleanliness reports yet. Use the intake wizard on the left whenever you spot an unhygienic area.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {issues.map((issue) => (
              <div key={issue.id} className="py-4 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-baust-primary-950">
                        {issue.reference_number}
                      </span>
                      {issue.reopen_count > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-800">
                          Reopened ×{issue.reopen_count}
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs font-bold text-slate-800 line-clamp-1 mt-0.5">
                      {issue.description}
                    </h4>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                      statusColors[issue.status] || 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {issue.status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {issue.location?.building || 'Facility Area'} • {issue.location?.floor}
                    </span>
                  </div>
                  <span>{new Date(issue.created_at).toLocaleDateString()}</span>
                </div>

                <div className="pt-1 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setSelectedIssueForDetails(issue)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-baust-primary-800"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View Details & Photos
                  </button>

                  {issue.status === 'RESOLVED' && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedIssueForVerification(issue);
                        setIsReopenMode(false);
                        setModalError(null);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition"
                    >
                      <Star className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                      Verify & Rate Cleaning (#79)
                    </button>
                  )}

                  {issue.status === 'VERIFIED' && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Closed & Verified
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </BaustCard>

      {selectedIssueForVerification && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-military border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-baust-primary-800">
                  {selectedIssueForVerification.reference_number}
                </span>
                <h3 className="font-extrabold text-slate-900 text-base">
                  Cleaning Quality Verification (#78)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedIssueForVerification(null)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Photographic Proof of Resolution (#46)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold text-slate-500">Before (Reported)</p>
                  {selectedIssueForVerification.photo_urls && selectedIssueForVerification.photo_urls.length > 0 ? (
                    <img
                      src={selectedIssueForVerification.photo_urls[0]}
                      alt="Before"
                      className="w-full h-28 object-cover rounded-lg border border-slate-200"
                    />
                  ) : (
                    <div className="w-full h-28 bg-slate-100 rounded-lg flex items-center justify-center text-[10px] text-slate-400">
                      No photo attached
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <p className="text-[11px] font-semibold text-emerald-700">After (Staff Resolution Proof)</p>
                  {selectedIssueForVerification.proof_photo_urls && selectedIssueForVerification.proof_photo_urls.length > 0 ? (
                    <img
                      src={selectedIssueForVerification.proof_photo_urls[0]}
                      alt="Proof"
                      className="w-full h-28 object-cover rounded-lg border-2 border-emerald-400"
                    />
                  ) : (
                    <div className="w-full h-28 bg-emerald-50 rounded-lg flex items-center justify-center text-[10px] text-emerald-700 font-semibold">
                      Proof Uploaded ✓
                    </div>
                  )}
                </div>
              </div>
            </div>

            {modalError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl font-medium">
                {modalError}
              </div>
            )}

            {!isReopenMode ? (
              <div className="space-y-4">
                <div className="space-y-1.5 text-center">
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Rate Cleanliness Satisfaction (1 to 5 Stars) (#79)
                  </p>
                  <div className="flex justify-center gap-2 pt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="p-1 hover:scale-110 transition"
                      >
                        <Star
                          className={`w-7 h-7 ${
                            star <= rating
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-200 fill-slate-200'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Feedback or Notes (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Area thoroughly cleaned and disinfected."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-baust-primary-600"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsReopenMode(true)}
                    className="flex-1 py-2.5 rounded-xl border border-red-300 text-red-700 hover:bg-red-50 text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Not Clean? Reopen (#81)
                  </button>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleVerifyOrReopen(true)}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Approve & Verify
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-1 text-xs text-red-900">
                  <span className="font-bold">Request Rework Protocol (#81):</span>
                  <p className="text-[11px] text-red-700">
                    Reopens the work order and alerts the cleaning supervisor with elevated priority.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Why is the area still unsatisfactory? *
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Trash bin was emptied but liquid spill was not mopped..."
                    value={reopenReason}
                    onChange={(e) => setReopenReason(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsReopenMode(false)}
                    className="flex-1 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleVerifyOrReopen(false)}
                    className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Confirm Reopen
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedIssueForDetails && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-military border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-baust-primary-800">
                  {selectedIssueForDetails.reference_number}
                </span>
                <h3 className="font-extrabold text-slate-900 text-base">
                  Incident Information & Status
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedIssueForDetails(null)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="font-bold text-slate-700 uppercase text-[10px]">Location:</span>
                <p className="font-semibold text-slate-900">
                  {selectedIssueForDetails.location?.building} • {selectedIssueForDetails.location?.floor}
                </p>
                <p className="text-slate-600">{selectedIssueForDetails.location?.specific_area}</p>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-slate-700 uppercase text-[10px]">Description:</span>
                <p className="text-slate-800 bg-white p-2.5 rounded border border-slate-200">
                  {selectedIssueForDetails.description}
                </p>
              </div>

              {selectedIssueForDetails.photo_urls && selectedIssueForDetails.photo_urls.length > 0 && (
                <div className="space-y-1">
                  <span className="font-bold text-slate-700 uppercase text-[10px]">Attached Photos:</span>
                  <div className="flex gap-2">
                    {selectedIssueForDetails.photo_urls.map((u, i) => (
                      <img
                        key={i}
                        src={u}
                        alt="Evidence"
                        className="w-20 h-16 object-cover rounded-lg border border-slate-200"
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 flex justify-between text-slate-500 text-[11px]">
                <span>Logged: {new Date(selectedIssueForDetails.created_at).toLocaleString()}</span>
                <span>Priority: {selectedIssueForDetails.priority}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedIssueForDetails(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
