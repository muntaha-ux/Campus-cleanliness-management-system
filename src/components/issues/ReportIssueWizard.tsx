'use client';

import React, { useState, useEffect } from 'react';
import {
  BAUST_BUILDINGS,
  BAUST_ISSUE_CATEGORIES,
  BaustBuilding,
} from '@/config/baust-campus';
import {
  MapPin,
  Camera,
  AlertTriangle,
  CheckCircle2,
  QrCode,
  ShieldAlert,
  UploadCloud,
  X,
  ArrowRight,
  ArrowLeft,
  EyeOff,
  Clock,
} from 'lucide-react';

interface ReportIssueWizardProps {
  onSuccess?: (referenceNumber: string) => void;
  initialQrCode?: string;
  className?: string;
}

export function ReportIssueWizard({
  onSuccess,
  initialQrCode,
  className = '',
}: ReportIssueWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  const [selectedBuilding, setSelectedBuilding] = useState<BaustBuilding>(BAUST_BUILDINGS[1]);
  const [floor, setFloor] = useState<string>(BAUST_BUILDINGS[1].floors[0]);
  const [specificArea, setSpecificArea] = useState<string>('');
  const [qrCodeInput, setQrCodeInput] = useState<string>(initialQrCode || '');
  const [locationId, setLocationId] = useState<string>('10000000-0000-0000-0000-000000000010');

  const [category, setCategory] = useState<string>('WASHROOM_HYGIENE');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY'>('MEDIUM');
  const [description, setDescription] = useState<string>('');

  const [photos, setPhotos] = useState<{ file?: File; previewUrl: string; uploadedUrl?: string }[]>([]);
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdReferenceNumber, setCreatedReferenceNumber] = useState<string | null>(null);

  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [dismissDuplicateAlert, setDismissDuplicateAlert] = useState(false);

  const handleBuildingChange = (buildingId: string) => {
    const found = BAUST_BUILDINGS.find((b) => b.id === buildingId) || BAUST_BUILDINGS[0];
    setSelectedBuilding(found);
    setFloor(found.floors[0] || 'Ground Floor');
  };

  const handleQrLookup = async (code: string) => {
    if (!code) return;
    try {
      const res = await fetch(`/api/locations?qr=${encodeURIComponent(code)}`);
      const json = await res.json();
      if (json.data && json.data.length > 0) {
        const loc = json.data[0];
        const matchedBldg = BAUST_BUILDINGS.find((b) => b.name === loc.building) || selectedBuilding;
        setSelectedBuilding(matchedBldg);
        setFloor(loc.floor);
        setSpecificArea(loc.specific_area || loc.room || '');
        setLocationId(loc.id);
        if (loc.category === 'WASHROOM') setCategory('WASHROOM_HYGIENE');
        else if (loc.category === 'CANTEEN') setCategory('CANTEEN_HYGIENE');
      }
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    if (step >= 2 && locationId && category) {
      setCheckingDuplicates(true);
      fetch('/api/issues/check-duplicates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location_id: locationId, category }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.duplicates && data.duplicates.length > 0) {
            setDuplicates(data.duplicates);
            setDismissDuplicateAlert(false);
          } else {
            setDuplicates([]);
          }
        })
        .catch(() => {})
        .finally(() => setCheckingDuplicates(false));
    }
  }, [step, locationId, category]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files);

    const validFiles = newFiles.filter((f) => {
      const validMime = ['image/jpeg', 'image/png', 'image/webp'].includes(f.type);
      const validSize = f.size <= 10 * 1024 * 1024;
      return validMime && validSize;
    });

    const newPhotoObjects = validFiles.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setPhotos((prev) => [...prev, ...newPhotoObjects].slice(0, 4));
  };

  const removePhoto = (idx: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!description.trim() || description.trim().length < 10) {
      setSubmitError('Please provide a descriptive incident summary (at least 10 characters).');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const uploadedUrls: string[] = [];
      for (const item of photos) {
        if (item.file) {
          const fd = new FormData();
          fd.append('file', item.file);
          fd.append('location_id', locationId);

          const upRes = await fetch('/api/issues/upload', {
            method: 'POST',
            body: fd,
          });
          const upJson = await upRes.json();
          if (upJson.url) {
            uploadedUrls.push(upJson.url);
          }
        } else if (item.uploadedUrl) {
          uploadedUrls.push(item.uploadedUrl);
        }
      }

      const res = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location_id: locationId,
          category,
          description: `${selectedBuilding.name} [${floor}]: ${description.trim()}${
            specificArea ? ` (Area: ${specificArea})` : ''
          }`,
          priority,
          photo_urls: uploadedUrls,
          is_anonymous: isAnonymous,
        }),
      });

      const resJson = await res.json();
      if (!res.ok || resJson.error) {
        throw new Error(resJson.error || 'Failed to submit incident report');
      }

      const refNo = resJson.data?.reference_number || 'CCMS-REPORTED';
      setCreatedReferenceNumber(refNo);
      setStep(4);
      if (onSuccess) onSuccess(refNo);
    } catch (err) {
      setSubmitError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetWizard = () => {
    setStep(1);
    setDescription('');
    setPhotos([]);
    setCreatedReferenceNumber(null);
    setSubmitError(null);
    setDuplicates([]);
  };

  return (
    <div className={`bg-white rounded-xl border border-slate-200/90 shadow-disciplined overflow-hidden ${className}`}>
      <div className="bg-gradient-to-r from-baust-primary-900 to-baust-primary-800 text-white px-6 py-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-baust-gold-400 animate-pulse" />
            <h2 className="font-semibold text-base sm:text-lg tracking-tight">
              30-Second Campus Cleanliness Intake (#18)
            </h2>
          </div>
          <p className="text-xs text-baust-primary-100 mt-0.5">
            BAUST Saidpur Cantonment Facility & Sanitation Report
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-baust-primary-100">
          <span className={`px-2 py-0.5 rounded ${step === 1 ? 'bg-baust-gold-500 text-slate-950 font-bold' : 'bg-baust-primary-700/60'}`}>
            1. Location
          </span>
          <span>→</span>
          <span className={`px-2 py-0.5 rounded ${step === 2 ? 'bg-baust-gold-500 text-slate-950 font-bold' : 'bg-baust-primary-700/60'}`}>
            2. Details
          </span>
          <span>→</span>
          <span className={`px-2 py-0.5 rounded ${step === 3 ? 'bg-baust-gold-500 text-slate-950 font-bold' : 'bg-baust-primary-700/60'}`}>
            3. Evidence
          </span>
        </div>
      </div>

      <div className="p-6">
        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-baust-primary-700" />
                Step 1: Where is the cleanliness issue?
              </h3>
              <p className="text-xs text-slate-500">
                Select the BAUST campus facility or scan a location QR code tag.
              </p>
            </div>

            <div className="p-3.5 bg-baust-primary-50/70 border border-baust-primary-200/60 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-baust-primary-900">
                <span className="flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-baust-primary-700" />
                  Have a Zone QR Code Tag? (#20)
                </span>
                <span className="text-[11px] text-baust-primary-700 font-normal">Optional instant fill</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. loc_baust_ab1_g_w_male"
                  value={qrCodeInput}
                  onChange={(e) => setQrCodeInput(e.target.value)}
                  className="flex-1 text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-baust-primary-600 font-mono"
                />
                <button
                  type="button"
                  onClick={() => handleQrLookup(qrCodeInput)}
                  className="px-3.5 py-2 bg-baust-primary-700 hover:bg-baust-primary-800 text-white text-xs font-semibold rounded-lg transition"
                >
                  Auto-Fill
                </button>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Campus Facility / Building (#24)
                </label>
                <select
                  value={selectedBuilding.id}
                  onChange={(e) => handleBuildingChange(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-baust-primary-600 text-slate-900 font-medium"
                >
                  {BAUST_BUILDINGS.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.shortName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Floor / Level (#25)
                </label>
                <select
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-baust-primary-600 text-slate-900 font-medium"
                >
                  {selectedBuilding.floors.map((fl) => (
                    <option key={fl} value={fl}>
                      {fl}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Specific Area / Room Reference (#26, #27)
              </label>
              <input
                type="text"
                placeholder="e.g. Male Washroom near Room 204, Software Lab 102, Corridor East Lift"
                value={specificArea}
                onChange={(e) => setSpecificArea(e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-baust-primary-600 text-slate-900"
              />
              <p className="text-[11px] text-slate-500">
                Helps cleaning staff locate the exact corner without delay.
              </p>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-baust-primary-700 hover:bg-baust-primary-800 text-white font-semibold text-sm rounded-xl shadow-sm transition"
              >
                Next: Issue Details
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-baust-gold-600" />
                Step 2: Describe the Cleanliness Hazard
              </h3>
              <p className="text-xs text-slate-500">
                Selected: <span className="font-semibold text-slate-800">{selectedBuilding.name}</span> • {floor} {specificArea && `(${specificArea})`}
              </p>
            </div>

            {duplicates.length > 0 && !dismissDuplicateAlert && (
              <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wide">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Duplicate Alert: Similar Incident Reported Recently (#31)
                  </div>
                  <button
                    type="button"
                    onClick={() => setDismissDuplicateAlert(true)}
                    className="text-amber-700 hover:text-amber-900 text-xs font-semibold"
                  >
                    Dismiss & Proceed
                  </button>
                </div>
                <p className="text-xs text-amber-800">
                  A report for this zone was logged recently. Check if this is the same issue:
                </p>
                <div className="space-y-1.5 pt-1">
                  {duplicates.slice(0, 2).map((dup: any) => (
                    <div key={dup.id} className="text-xs bg-white/80 p-2 rounded border border-amber-200 text-slate-800 flex justify-between">
                      <span className="font-mono font-semibold">{dup.reference_number}</span>
                      <span className="text-slate-600 truncate max-w-xs">{dup.description}</span>
                      <span className="font-semibold text-amber-700 uppercase">{dup.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Category (#19)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {BAUST_ISSUE_CATEGORIES.map((cat) => {
                  const isSelected = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setCategory(cat.id);
                        if (cat.defaultPriority === 'EMERGENCY') setPriority('EMERGENCY');
                      }}
                      className={`text-left p-3 rounded-xl border text-xs font-medium transition-all flex flex-col justify-between h-20 ${
                        isSelected
                          ? 'border-baust-primary-700 bg-baust-primary-50/80 text-baust-primary-900 shadow-sm ring-1 ring-baust-primary-700 font-semibold'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                      }`}
                    >
                      <span className="text-slate-800 line-clamp-2">{cat.label}</span>
                      <span className="text-[10px] text-slate-500 font-mono uppercase">
                        Default: {cat.defaultPriority}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Severity & SLA Priority (#28)
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY'] as const).map((lvl) => {
                  const isSelected = priority === lvl;
                  const labelMap = {
                    LOW: 'Low (72h)',
                    MEDIUM: 'Standard (24h)',
                    HIGH: 'Urgent (6h)',
                    EMERGENCY: 'Emergency (2h)',
                  };
                  return (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setPriority(lvl)}
                      className={`py-2 px-1 text-center rounded-lg text-xs font-bold transition ${
                        isSelected
                          ? lvl === 'EMERGENCY'
                            ? 'bg-red-600 text-white shadow-sm ring-2 ring-red-400'
                            : 'bg-baust-primary-700 text-white shadow-sm'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {labelMap[lvl]}
                    </button>
                  );
                })}
              </div>

              {priority === 'EMERGENCY' && (
                <div className="p-3 bg-red-50 border border-red-300 rounded-xl flex items-start gap-2.5 text-xs text-red-900 font-medium badge-emergency-pulse">
                  <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Emergency Protocol Triggered (#29):</span>
                    <p className="text-[11px] text-red-800 mt-0.5">
                      Triggers instant auto-dispatch to on-duty cantonment cleaning crew with a strict 2-hour SLA deadline.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Incident Description (#18)
                </label>
                <span className="text-[11px] text-slate-500">{description.length} chars</span>
              </div>
              <textarea
                rows={3}
                placeholder="Describe the issue (e.g. Washroom tap broken causing floor overflow)..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-sm p-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-baust-primary-600 text-slate-900"
              />
            </div>

            <div className="pt-2 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-slate-600 hover:text-slate-900 text-sm font-semibold transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>

              <button
                type="button"
                disabled={description.trim().length < 5}
                onClick={() => setStep(3)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-baust-primary-700 hover:bg-baust-primary-800 disabled:opacity-50 text-white font-semibold text-sm rounded-xl shadow-sm transition"
              >
                Next: Photo Evidence
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Camera className="w-5 h-5 text-baust-primary-700" />
                Step 3: Visual Evidence & Privacy
              </h3>
              <p className="text-xs text-slate-500">
                Attach before-photos to help cleaning staff arrive prepared with required tools.
              </p>
            </div>

            <div className="space-y-3">
              <div className="border-2 border-dashed border-slate-300 hover:border-baust-primary-600 rounded-xl p-5 text-center cursor-pointer bg-slate-50/50 hover:bg-baust-primary-50/30 transition relative">
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
                  <div className="w-10 h-10 rounded-full bg-baust-primary-100 text-baust-primary-800 flex items-center justify-center">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-baust-primary-700">
                      Click to upload photos
                    </span>{' '}
                    <span className="text-xs text-slate-500">or drag and drop</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    JPEG, PNG, WebP up to 10MB each (Max 4 photos)
                  </p>
                </div>
              </div>

              {photos.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  {photos.map((item, idx) => (
                    <div key={idx} className="relative rounded-lg overflow-hidden border border-slate-200 aspect-video group">
                      <img
                        src={item.previewUrl}
                        alt={`Evidence ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(idx)}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-slate-900/80 text-white flex items-center justify-center hover:bg-red-600 transition"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
              <button
                type="button"
                onClick={() => setIsAnonymous(!isAnonymous)}
                className={`w-6 h-6 rounded border flex items-center justify-center shrink-0 mt-0.5 transition ${
                  isAnonymous
                    ? 'bg-baust-primary-700 border-baust-primary-700 text-white'
                    : 'bg-white border-slate-300'
                }`}
              >
                {isAnonymous && <CheckCircle2 className="w-4 h-4" />}
              </button>
              <div className="space-y-0.5 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <EyeOff className="w-4 h-4 text-slate-600" />
                  Submit Anonymously (#30)
                </div>
                <p className="text-slate-600">
                  Your identity, student ID, and email will be completely hidden from public boards and staff work sheets.
                </p>
              </div>
            </div>

            {submitError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-medium">
                {submitError}
              </div>
            )}

            <div className="pt-2 flex justify-between">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-slate-600 hover:text-slate-900 text-sm font-semibold transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmit}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-baust-primary-700 hover:bg-baust-primary-800 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-disciplined transition"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting to Dispatch...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Submit Cleanliness Incident
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="py-6 text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Incident Successfully Registered!
              </h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Dispatched to the BAUST Cantonment janitorial triage queue. You will receive live updates as staff picks up and resolves the issue.
              </p>
            </div>

            <div className="bg-baust-primary-50 border border-baust-primary-200 rounded-xl p-4 max-w-sm mx-auto space-y-1">
              <p className="text-[11px] font-semibold text-baust-primary-800 uppercase tracking-wider">
                Official Incident Tracking Code (#32)
              </p>
              <p className="text-xl font-mono font-extrabold text-baust-primary-900">
                {createdReferenceNumber}
              </p>
              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 pt-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>SLA Target: Priority-based automated countdown</span>
              </div>
            </div>

            <div className="pt-4 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={resetWizard}
                className="px-5 py-2.5 bg-baust-primary-700 hover:bg-baust-primary-800 text-white text-xs font-bold rounded-xl transition"
              >
                Submit Another Report
              </button>
              <a
                href="/student"
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition"
              >
                View in Dashboard
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
