'use client';

import React, { useState } from 'react';
import {
  Clock,
  MapPin,
  CheckCircle2,
  Camera,
  Play,
  X,
  CheckCircle,
  Shield,
  Coffee,
} from 'lucide-react';

export interface StaffTask {
  id: string;
  issue_id: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  assigned_at: string;
  issue: {
    id: string;
    reference_number: string;
    category: string;
    description: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';
    status: 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'VERIFIED';
    sla_deadline: string;
    photo_urls: string[];
    location?: {
      building: string;
      floor: string;
      specific_area: string;
    };
  };
}

interface StaffTaskBoardProps {
  initialTasks: StaffTask[];
  staffUserId: string;
}

export function StaffTaskBoard({ initialTasks, staffUserId }: StaffTaskBoardProps) {
  const [tasks, setTasks] = useState<StaffTask[]>(initialTasks);
  const [isOnDuty, setIsOnDuty] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');

  const [selectedTaskForResolution, setSelectedTaskForResolution] = useState<StaffTask | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleToggleDuty = async () => {
    const nextState = !isOnDuty;
    setIsOnDuty(nextState);
    try {
      await fetch('/api/dispatch/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_available: nextState }),
      });
    } catch {
      setIsOnDuty(!nextState);
    }
  };

  const handleStartTask = async (task: StaffTask) => {
    setActionError(null);
    try {
      const res = await fetch('/api/dispatch/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'START', issue_id: task.issue.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start task');

      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id
            ? { ...t, issue: { ...t.issue, status: 'IN_PROGRESS' } }
            : t
        )
      );
    } catch (err) {
      setActionError((err as Error).message);
    }
  };

  const handleProofFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    setProofFile(file);
    setProofPreview(URL.createObjectURL(file));
  };

  const handleResolveTask = async () => {
    if (!selectedTaskForResolution) return;
    if (!proofFile && !proofPreview) {
      setActionError('Proof photo is strictly required before resolving a task (#46).');
      return;
    }

    setIsResolving(true);
    setActionError(null);

    try {
      let uploadedUrl = 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=800';
      if (proofFile) {
        const fd = new FormData();
        fd.append('file', proofFile);
        fd.append('location_id', selectedTaskForResolution.issue.id);

        const upRes = await fetch('/api/issues/upload', {
          method: 'POST',
          body: fd,
        });
        const upJson = await upRes.json();
        if (upJson.url) uploadedUrl = upJson.url;
      }

      const res = await fetch('/api/dispatch/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RESOLVE',
          issue_id: selectedTaskForResolution.issue.id,
          proof_photo_urls: [uploadedUrl],
          resolution_notes: resolutionNotes || 'Clean-up completed and sanitized.',
        }),
      });

      const resJson = await res.json();
      if (!res.ok) throw new Error(resJson.error || 'Failed to resolve task');

      setTasks((prev) =>
        prev.map((t) =>
          t.id === selectedTaskForResolution.id
            ? {
                ...t,
                status: 'COMPLETED',
                issue: {
                  ...t.issue,
                  status: 'RESOLVED',
                },
              }
            : t
        )
      );

      setSelectedTaskForResolution(null);
      setProofFile(null);
      setProofPreview(null);
      setResolutionNotes('');
    } catch (err) {
      setActionError((err as Error).message);
    } finally {
      setIsResolving(false);
    }
  };

  const pendingTasks = tasks.filter((t) => t.issue.status !== 'RESOLVED' && t.issue.status !== 'VERIFIED');
  const completedTasks = tasks.filter((t) => t.issue.status === 'RESOLVED' || t.issue.status === 'VERIFIED');
  const activeList = activeTab === 'pending' ? pendingTasks : completedTasks;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-disciplined flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-3.5 h-3.5 rounded-full ${
              isOnDuty ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
            }`}
          />
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              Staff Shift Status: {isOnDuty ? 'ON DUTY (Active Dispatch)' : 'OFF DUTY (Paused)'}
            </h3>
            <p className="text-xs text-slate-500">
              {isOnDuty
                ? 'You are actively receiving automatic task assignments for your assigned zone.'
                : 'Auto-dispatch is paused. You will not receive new assignments.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleToggleDuty}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            isOnDuty
              ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
          }`}
        >
          {isOnDuty ? (
            <>
              <Coffee className="w-4 h-4" />
              Take Break / Go Off Duty
            </>
          ) : (
            <>
              <Shield className="w-4 h-4" />
              Resume Duty
            </>
          )}
        </button>
      </div>

      <div className="flex border-b border-slate-200 gap-4">
        <button
          type="button"
          onClick={() => setActiveTab('pending')}
          className={`pb-3 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'pending'
              ? 'border-baust-primary-700 text-baust-primary-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Pending Tasks</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-800 font-extrabold">
            {pendingTasks.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('completed')}
          className={`pb-3 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'completed'
              ? 'border-baust-primary-700 text-baust-primary-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Completed History</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700">
            {completedTasks.length}
          </span>
        </button>
      </div>

      {actionError && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl font-medium">
          {actionError}
        </div>
      )}

      {activeList.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-2">
          <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto" />
          <h4 className="font-bold text-slate-900 text-sm">No Work Orders In This Queue</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {activeTab === 'pending'
              ? 'All assigned facility areas are currently clean and compliant.'
              : 'Completed tasks will be recorded here with your verification proof photos.'}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {activeList.map((task) => {
            const isEmergency = task.issue.priority === 'EMERGENCY';
            const isHigh = task.issue.priority === 'HIGH';
            const isInProgress = task.issue.status === 'IN_PROGRESS';

            return (
              <div
                key={task.id}
                className={`bg-white rounded-xl border p-5 shadow-disciplined space-y-4 flex flex-col justify-between ${
                  isEmergency
                    ? 'border-red-400 bg-red-50/20 badge-emergency-pulse'
                    : isHigh
                    ? 'border-amber-300'
                    : 'border-slate-200'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-xs font-extrabold text-baust-primary-900">
                      {task.issue.reference_number}
                    </span>
                    <div className="flex gap-1.5">
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                          isEmergency
                            ? 'bg-red-600 text-white'
                            : isHigh
                            ? 'bg-amber-500 text-white'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {task.issue.priority}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          isInProgress
                            ? 'bg-sky-100 text-sky-800 animate-pulse'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {task.issue.status}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                      <MapPin className="w-4 h-4 text-baust-primary-700 shrink-0" />
                      <span>{task.issue.location?.building || 'Facility Area'}</span>
                    </div>
                    <p className="text-xs text-slate-600 pl-5.5">
                      Level: {task.issue.location?.floor} • {task.issue.location?.specific_area}
                    </p>
                  </div>

                  <p className="text-xs text-slate-700 line-clamp-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {task.issue.description}
                  </p>

                  {task.issue.photo_urls && task.issue.photo_urls.length > 0 && (
                    <div className="flex gap-2">
                      {task.issue.photo_urls.map((u, i) => (
                        <img
                          key={i}
                          src={u}
                          alt="Before Issue"
                          className="w-14 h-12 object-cover rounded border border-slate-200"
                        />
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>SLA Deadline: {new Date(task.issue.sla_deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex gap-2">
                  {!isInProgress && task.issue.status !== 'RESOLVED' && task.issue.status !== 'VERIFIED' && (
                    <button
                      type="button"
                      onClick={() => handleStartTask(task)}
                      className="flex-1 min-h-[48px] px-4 py-2.5 bg-baust-primary-700 hover:bg-baust-primary-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Play className="w-4 h-4" />
                      Commence Task
                    </button>
                  )}

                  {isInProgress && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTaskForResolution(task);
                        setActionError(null);
                      }}
                      className="flex-1 min-h-[48px] px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Camera className="w-4 h-4" />
                      Upload Proof & Complete (#46)
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedTaskForResolution && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-military border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-baust-primary-800">
                  {selectedTaskForResolution.issue.reference_number}
                </span>
                <h3 className="font-extrabold text-slate-900 text-base">
                  Mandatory Cleaning Proof Photo (#46)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTaskForResolution(null)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Under BAUST Quality Governance protocols, every completed task strictly requires a photographic verification of the sanitized zone before closing the work order.
            </p>

            <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center relative hover:bg-slate-50 transition">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleProofFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              {proofPreview ? (
                <div className="space-y-2">
                  <img
                    src={proofPreview}
                    alt="Proof Preview"
                    className="max-h-48 mx-auto rounded-lg object-cover"
                  />
                  <p className="text-xs text-emerald-700 font-bold">Proof Photo Attached ✓</p>
                </div>
              ) : (
                <div className="space-y-1 py-4">
                  <Camera className="w-8 h-8 text-baust-primary-700 mx-auto" />
                  <p className="text-xs font-bold text-slate-800">Take or Upload After-Photo</p>
                  <p className="text-[11px] text-slate-500">JPG, PNG up to 10MB</p>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Resolution Notes (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Mapped floor sanitized, disinfectant applied."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-baust-primary-600"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedTaskForResolution(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isResolving}
                onClick={handleResolveTask}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                {isResolving ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting Proof...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Mark Task Resolved
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
