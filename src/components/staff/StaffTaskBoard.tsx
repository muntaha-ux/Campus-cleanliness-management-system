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
  CheckSquare,
  Square,
  AlertTriangle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { getChecklistForCategory, ChecklistItem } from '@/config/cleaning-checklists';

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
    reopen_count?: number;
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

  // Start Task (Before-Photo) State
  const [selectedTaskForStart, setSelectedTaskForStart] = useState<StaffTask | null>(null);
  const [beforeFile, setBeforeFile] = useState<File | null>(null);
  const [beforePreview, setBeforePreview] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  // Complete Task (Checklist & After-Photo) State
  const [selectedTaskForResolution, setSelectedTaskForResolution] = useState<StaffTask | null>(null);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
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

  // Open Commence Modal
  const openStartModal = (task: StaffTask) => {
    setSelectedTaskForStart(task);
    setBeforeFile(null);
    setBeforePreview(null);
    setActionError(null);
  };

  // Submit Task Commencement (with optional Before-Photo)
  const handleConfirmStartTask = async () => {
    if (!selectedTaskForStart) return;
    setIsStarting(true);
    setActionError(null);

    try {
      let beforePhotoUrl: string | undefined = undefined;
      if (beforeFile) {
        const fd = new FormData();
        fd.append('file', beforeFile);
        fd.append('location_id', selectedTaskForStart.issue.id);

        const upRes = await fetch('/api/issues/upload', {
          method: 'POST',
          body: fd,
        });
        const upJson = await upRes.json();
        if (upJson.url) beforePhotoUrl = upJson.url;
      }

      const res = await fetch('/api/dispatch/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'START',
          issue_id: selectedTaskForStart.issue.id,
          before_photo_url: beforePhotoUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start task');

      setTasks((prev) =>
        prev.map((t) =>
          t.id === selectedTaskForStart.id
            ? {
                ...t,
                issue: {
                  ...t.issue,
                  status: 'IN_PROGRESS',
                  photo_urls: beforePhotoUrl
                    ? [...(t.issue.photo_urls || []), beforePhotoUrl]
                    : t.issue.photo_urls,
                },
              }
            : t
        )
      );

      setSelectedTaskForStart(null);
      setBeforeFile(null);
      setBeforePreview(null);
    } catch (err) {
      setActionError((err as Error).message);
    } finally {
      setIsStarting(false);
    }
  };

  // Open Resolution Modal & Load Dynamic Checklist
  const openResolutionModal = (task: StaffTask) => {
    setSelectedTaskForResolution(task);
    const categoryChecklist = getChecklistForCategory(task.issue.category);
    const initialCheckState: Record<string, boolean> = {};
    categoryChecklist.forEach((item) => {
      initialCheckState[item.id] = false;
    });
    setCheckedItems(initialCheckState);
    setProofFile(null);
    setProofPreview(null);
    setResolutionNotes('');
    setActionError(null);
  };

  const toggleCheckItem = (id: string) => {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const checkAllItems = (items: ChecklistItem[]) => {
    const allChecked: Record<string, boolean> = {};
    items.forEach((item) => {
      allChecked[item.id] = true;
    });
    setCheckedItems(allChecked);
  };

  const handleProofFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    setProofFile(file);
    setProofPreview(URL.createObjectURL(file));
  };

  const handleBeforeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    setBeforeFile(file);
    setBeforePreview(URL.createObjectURL(file));
  };

  // Submit Resolution with Checklist & After-Photo
  const handleResolveTask = async () => {
    if (!selectedTaskForResolution) return;

    if (!proofFile && !proofPreview) {
      setActionError('Photographic proof (After Photo) is strictly mandatory before closing work order (#46).');
      return;
    }

    const currentChecklist = getChecklistForCategory(selectedTaskForResolution.issue.category);
    const mandatoryUnchecked = currentChecklist.filter((item) => item.isMandatory && !checkedItems[item.id]);

    if (mandatoryUnchecked.length > 0) {
      setActionError(`Please complete all mandatory checklist items before submitting (${mandatoryUnchecked.length} remaining).`);
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

      const completedChecklistLabels = currentChecklist
        .filter((item) => checkedItems[item.id])
        .map((item) => item.label);

      const res = await fetch('/api/dispatch/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RESOLVE',
          issue_id: selectedTaskForResolution.issue.id,
          proof_photo_urls: [uploadedUrl],
          resolution_notes: resolutionNotes || 'Clean-up checklist completed with verification proof.',
          checklist_items: completedChecklistLabels,
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

  const currentCategoryChecklist = selectedTaskForResolution
    ? getChecklistForCategory(selectedTaskForResolution.issue.category)
    : [];

  return (
    <div className="space-y-6">
      {/* Shift / Duty Status Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-disciplined flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-3.5 h-3.5 rounded-full ${
              isOnDuty ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
            }`}
          />
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              Staff Shift Status: {isOnDuty ? 'ON DUTY (Active Cantonment Dispatch)' : 'OFF DUTY (Paused)'}
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

      {/* Tab Navigation */}
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
          <span>Active & Pending Tasks</span>
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
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl font-medium flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{actionError}</span>
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
            const isRework = (task.issue.reopen_count || 0) > 0 && isInProgress;

            return (
              <div
                key={task.id}
                className={`bg-white rounded-xl border p-5 shadow-disciplined space-y-4 flex flex-col justify-between ${
                  isRework
                    ? 'border-red-500 bg-red-50/30'
                    : isEmergency
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
                    <div className="flex flex-wrap gap-1.5 items-center">
                      {isRework && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-600 text-white flex items-center gap-1 uppercase tracking-wider animate-pulse">
                          <RotateCcw className="w-3 h-3" />
                          Rework Required
                        </span>
                      )}
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
                            ? 'bg-sky-100 text-sky-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {task.issue.status}
                      </span>
                    </div>
                  </div>

                  {isRework && (
                    <div className="p-2.5 bg-red-100 border border-red-200 rounded-lg text-xs text-red-900 font-medium">
                      ⚠️ <strong>Supervisor Inspection Alert:</strong> This task requires rework. Please re-clean the area and capture updated proof photos.
                    </div>
                  )}

                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                      <MapPin className="w-4 h-4 text-baust-primary-700 shrink-0" />
                      <span>{task.issue.location?.building || 'Facility Area'}</span>
                    </div>
                    <p className="text-xs text-slate-600 pl-5.5">
                      Level: {task.issue.location?.floor} • {task.issue.location?.specific_area} • Category: <strong className="text-baust-primary-800">{task.issue.category}</strong>
                    </p>
                  </div>

                  <p className="text-xs text-slate-700 line-clamp-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {task.issue.description}
                  </p>

                  {task.issue.photo_urls && task.issue.photo_urls.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-slate-500">Incident Photos:</span>
                      <div className="flex gap-2">
                        {task.issue.photo_urls.map((u, i) => (
                          <img
                            key={i}
                            src={u}
                            alt="Incident Before"
                            className="w-14 h-12 object-cover rounded border border-slate-200"
                          />
                        ))}
                      </div>
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
                      onClick={() => openStartModal(task)}
                      className="flex-1 min-h-[48px] px-4 py-2.5 bg-baust-primary-700 hover:bg-baust-primary-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Play className="w-4 h-4" />
                      Commence Task (Before-Photo)
                    </button>
                  )}

                  {isInProgress && (
                    <button
                      type="button"
                      onClick={() => openResolutionModal(task)}
                      className="flex-1 min-h-[48px] px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Camera className="w-4 h-4" />
                      Complete Checklist & Upload Proof (#46)
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal 1: Commence Task & On-site Before Photo (Figure 1 & 3) */}
      {selectedTaskForStart && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-military border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-baust-primary-800">
                  {selectedTaskForStart.issue.reference_number}
                </span>
                <h3 className="font-extrabold text-slate-900 text-base">
                  Commence On-Site Cleaning
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTaskForStart(null)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              You are arriving at <strong>{selectedTaskForStart.issue.location?.building}</strong> ({selectedTaskForStart.issue.location?.floor}). You may capture an initial on-site Before Photo to document condition prior to sanitation.
            </p>

            <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center relative hover:bg-slate-50 transition">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleBeforeFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              {beforePreview ? (
                <div className="space-y-2">
                  <img
                    src={beforePreview}
                    alt="Before Preview"
                    className="max-h-36 mx-auto rounded-lg object-cover"
                  />
                  <p className="text-xs text-baust-primary-700 font-bold">Before Photo Captured ✓</p>
                </div>
              ) : (
                <div className="space-y-1 py-3">
                  <Camera className="w-7 h-7 text-baust-primary-700 mx-auto" />
                  <p className="text-xs font-bold text-slate-800">Snap On-Site Before Photo (Optional)</p>
                  <p className="text-[11px] text-slate-500">Tap to take photo or choose file</p>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedTaskForStart(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isStarting}
                onClick={handleConfirmStartTask}
                className="flex-1 py-2.5 rounded-xl bg-baust-primary-700 hover:bg-baust-primary-800 disabled:opacity-50 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                {isStarting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Commencing...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Commence Task
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Checklist & After-Photo Resolution (Figure 1, 3, 4) */}
      {selectedTaskForResolution && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-military border border-slate-200 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-baust-primary-800">
                  {selectedTaskForResolution.issue.reference_number}
                </span>
                <h3 className="font-extrabold text-slate-900 text-base">
                  Cleaning Checklist & Proof of Resolution (#46)
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

            {/* Category Cleaning Checklist (Figure 4: Checklist & ChecklistItem) */}
            <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-baust-gold-600" />
                  <h4 className="text-xs font-bold text-slate-900">
                    {selectedTaskForResolution.issue.category} Cleaning Checklist
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => checkAllItems(currentCategoryChecklist)}
                  className="text-[11px] font-bold text-baust-primary-700 hover:text-baust-primary-800"
                >
                  Check All Completed
                </button>
              </div>

              <div className="space-y-1.5 pt-1">
                {currentCategoryChecklist.map((item) => {
                  const isChecked = Boolean(checkedItems[item.id]);
                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => toggleCheckItem(item.id)}
                      className={`w-full flex items-center gap-2 p-2 rounded-lg text-left text-xs transition border ${
                        isChecked
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-medium'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <span className="flex-1">{item.label}</span>
                      {item.isMandatory && (
                        <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded">
                          Mandatory
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* After-Photo Mandatory Upload (Figure 1, 3, 4) */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-800">
                Mandatory After-Cleaning Photographic Proof *
              </label>
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
                      className="max-h-44 mx-auto rounded-lg object-cover border border-emerald-300"
                    />
                    <p className="text-xs text-emerald-700 font-bold">After-Photo Attached ✓</p>
                  </div>
                ) : (
                  <div className="space-y-1 py-3">
                    <Camera className="w-8 h-8 text-emerald-700 mx-auto" />
                    <p className="text-xs font-bold text-slate-800">Take or Upload After-Photo</p>
                    <p className="text-[11px] text-slate-500">JPG, PNG, or WebP up to 10MB</p>
                  </div>
                )}
              </div>
            </div>

            {/* Resolution Notes */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Resolution Notes</label>
              <input
                type="text"
                placeholder="e.g. Floor sanitized, disinfectant mop applied, waste bins emptied."
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
                    Submit & Notify Supervisor
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
