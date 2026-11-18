'use client';

import React, { useState } from 'react';
import { BaustCard } from '@/components/ui/BaustCard';
import {
  CheckCircle,
  RotateCcw,
  Star,
  X,
  Eye,
  Check,
  AlertTriangle,
  Clock,
  Sparkles,
} from 'lucide-react';

export interface TeacherIssueItem {
  id: string;
  reference_number: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  sla_deadline: string;
  photo_urls?: string[];
  proof_photo_urls?: string[];
  created_at: string;
  location?: {
    building: string;
    floor: string;
    specific_area: string;
  };
}

interface TeacherVerificationQueueProps {
  initialIssues: TeacherIssueItem[];
}

export function TeacherVerificationQueue({ initialIssues }: TeacherVerificationQueueProps) {
  const [issues, setIssues] = useState<TeacherIssueItem[]>(initialIssues);

  // Approval modal state
  const [approveModalIssue, setApproveModalIssue] = useState<TeacherIssueItem | null>(null);
  const [rating, setRating] = useState(5);
  const [notes, setNotes] = useState('');
  const [isApproving, setIsApproving] = useState(false);

  // Rework modal state
  const [reworkModalIssue, setReworkModalIssue] = useState<TeacherIssueItem | null>(null);
  const [reworkReason, setReworkReason] = useState('');
  const [isReworking, setIsReworking] = useState(false);

  // Photo enlargement
  const [viewPhotoUrl, setViewPhotoUrl] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  const handleApprove = async () => {
    if (!approveModalIssue) return;
    setIsApproving(true);
    setFeedbackMsg(null);

    try {
      const res = await fetch('/api/dispatch/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issue_id: approveModalIssue.id,
          rating,
          notes: notes || 'Faculty verified facility hygiene satisfactory.',
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to approve work order');

      setIssues((prev) => prev.filter((i) => i.id !== approveModalIssue.id));
      setFeedbackMsg({
        text: `Work order ${approveModalIssue.reference_number} verified and closed with ${rating}-star rating.`,
      });
      setApproveModalIssue(null);
      setNotes('');
    } catch (err) {
      setFeedbackMsg({ text: (err as Error).message, isError: true });
    } finally {
      setIsApproving(false);
    }
  };

  const handleRework = async () => {
    if (!reworkModalIssue) return;
    if (!reworkReason.trim() || reworkReason.trim().length < 5) {
      setFeedbackMsg({ text: 'Please explain the cleanliness deficiency (min 5 chars).', isError: true });
      return;
    }

    setIsReworking(true);
    setFeedbackMsg(null);

    try {
      const res = await fetch('/api/dispatch/rework', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issue_id: reworkModalIssue.id,
          reason: reworkReason.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to request rework');

      setIssues((prev) => prev.filter((i) => i.id !== reworkModalIssue.id));
      setFeedbackMsg({
        text: `Work order ${reworkModalIssue.reference_number} returned to cleaning staff for rework.`,
      });
      setReworkModalIssue(null);
      setReworkReason('');
    } catch (err) {
      setFeedbackMsg({ text: (err as Error).message, isError: true });
    } finally {
      setIsReworking(false);
    }
  };

  return (
    <div className="space-y-4">
      {feedbackMsg && (
        <div
          className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            feedbackMsg.isError
              ? 'bg-red-50 text-red-800 border border-red-200'
              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
          }`}
        >
          {feedbackMsg.isError ? (
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          ) : (
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      <BaustCard
        title="Faculty Verification Queue (#78)"
        subtitle="Inspect cleaning proof photos and sign off or request rework (Figure 3)"
        variant="accent"
        badge={
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
            {issues.length} Pending Sign-Off
          </span>
        }
      >
        {issues.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto" />
            <p className="text-xs font-semibold text-slate-700">All Academic Work Orders Verified</p>
            <p className="text-[11px] text-slate-500">
              No classroom, lab, or lecture hall issues currently require faculty sign-off.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {issues.map((issue) => {
              const beforePhoto = issue.photo_urls?.[0];
              const afterPhoto = issue.proof_photo_urls?.[0];

              return (
                <div key={issue.id} className="py-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-baust-primary-900">
                          {issue.reference_number}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase">
                          Cleaned & Awaiting Sign-Off
                        </span>
                      </div>
                      <h4 className="text-xs font-semibold text-slate-800 mt-1">
                        {issue.description}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Location: {issue.location?.building} • {issue.location?.floor} ({issue.location?.specific_area}) • Category: {issue.category}
                      </p>
                    </div>
                  </div>

                  {/* Before vs After Photo inspection */}
                  <div className="grid grid-cols-2 gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-[11px] font-bold text-slate-600 block mb-1">Before Report</span>
                      {beforePhoto ? (
                        <div
                          onClick={() => setViewPhotoUrl(beforePhoto)}
                          className="relative cursor-pointer group rounded-lg overflow-hidden border border-slate-300 h-24"
                        >
                          <img
                            src={beforePhoto}
                            alt="Before"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[10px] font-bold">
                            View
                          </div>
                        </div>
                      ) : (
                        <div className="h-24 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] text-slate-400">
                          No initial photo
                        </div>
                      )}
                    </div>

                    <div>
                      <span className="text-[11px] font-bold text-emerald-800 block mb-1">After Cleaned Proof ✓</span>
                      {afterPhoto ? (
                        <div
                          onClick={() => setViewPhotoUrl(afterPhoto)}
                          className="relative cursor-pointer group rounded-lg overflow-hidden border-2 border-emerald-400 h-24"
                        >
                          <img
                            src={afterPhoto}
                            alt="After"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-emerald-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[10px] font-bold">
                            View
                          </div>
                        </div>
                      ) : (
                        <div className="h-24 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] text-slate-400">
                          No proof photo
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setApproveModalIssue(issue);
                        setRating(5);
                        setNotes('');
                      }}
                      className="px-3.5 py-1.5 bg-baust-primary-700 hover:bg-baust-primary-800 text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5 shadow-sm"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Approve & Verify (Fig 3)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setReworkModalIssue(issue);
                        setReworkReason('');
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Request Rework (#81)
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </BaustCard>

      {/* Modal: Faculty Approval */}
      {approveModalIssue && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-military border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-baust-primary-800">
                  {approveModalIssue.reference_number}
                </span>
                <h3 className="font-extrabold text-slate-900 text-base">
                  Faculty Hygiene Sign-Off
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setApproveModalIssue(null)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Faculty Cleanliness Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setRating(star)}
                    className="p-1"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= rating
                          ? 'text-baust-gold-500 fill-baust-gold-500'
                          : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Faculty Inspection Notes</label>
              <input
                type="text"
                placeholder="e.g. Whiteboard cleaned, armchairs sanitized, no dust observed."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-baust-primary-600"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setApproveModalIssue(null)}
                className="flex-1 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isApproving}
                onClick={handleApprove}
                className="flex-1 py-2 rounded-xl bg-baust-primary-700 hover:bg-baust-primary-800 disabled:opacity-50 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                {isApproving ? 'Verifying...' : 'Sign-Off & Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Faculty Rework */}
      {reworkModalIssue && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-military border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-amber-800">
                  {reworkModalIssue.reference_number}
                </span>
                <h3 className="font-extrabold text-slate-900 text-base">
                  Request Rework from Staff
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setReworkModalIssue(null)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Deficiency Details *</label>
              <textarea
                rows={3}
                placeholder="e.g. Floor sticky near lecture dais; wastebasket not emptied."
                value={reworkReason}
                onChange={(e) => setReworkReason(e.target.value)}
                className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReworkModalIssue(null)}
                className="flex-1 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isReworking}
                onClick={handleRework}
                className="flex-1 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                {isReworking ? 'Submitting...' : 'Return to Cleaner'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enlarged photo view */}
      {viewPhotoUrl && (
        <div
          onClick={() => setViewPhotoUrl(null)}
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="max-w-2xl max-h-[80vh] relative" onClick={(e) => e.stopPropagation()}>
            <img
              src={viewPhotoUrl}
              alt="Evidence"
              className="max-h-[75vh] w-auto rounded-xl object-contain border-2 border-white/20 shadow-2xl"
            />
            <button
              type="button"
              onClick={() => setViewPhotoUrl(null)}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-slate-900/80 text-white flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

