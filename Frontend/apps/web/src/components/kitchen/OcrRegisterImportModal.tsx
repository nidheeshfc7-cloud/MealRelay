"use client";

import React, { useState, useEffect } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Camera,
  Check,
  CheckCircle2,
  FileText,
  Loader2,
  RotateCw,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import type { ActivityInput, MenuItem } from "@/lib/kitchen/types";
import type { ExtractedActivityRecord, OcrFilterPreset, OcrProgress } from "@/lib/ocr/types";
import { preprocessImage } from "@/lib/ocr/preprocess";
import { recognizeText } from "@/lib/ocr/engine";
import { parseKitchenRegisterText } from "@/lib/ocr/parser";

export interface OcrRegisterImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmLogs: (logs: ActivityInput[]) => Promise<boolean | void>;
  menu: MenuItem[];
}

export const OcrRegisterImportModal: React.FC<OcrRegisterImportModalProps> = ({
  isOpen,
  onClose,
  onConfirmLogs,
  menu,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [rotation, setRotation] = useState<0 | 90 | 180 | 270>(0);
  const [filterPreset, setFilterPreset] = useState<OcrFilterPreset>("adaptive");

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<OcrProgress>({ status: "", progress: 0 });
  const [extractedRows, setExtractedRows] = useState<ExtractedActivityRecord[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [pastedText, setPastedText] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"photo" | "paste">("photo");

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl("");
      return;
    }

    let isMounted = true;
    void preprocessImage(selectedFile, { rotation, filter: filterPreset }).then((url) => {
      if (isMounted) setPreviewUrl(url);
    });

    return () => {
      isMounted = false;
    };
  }, [selectedFile, rotation, filterPreset]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null);
      setPreviewUrl("");
      setRotation(0);
      setFilterPreset("adaptive");
      setIsProcessing(false);
      setProgress({ status: "", progress: 0 });
      setExtractedRows([]);
      setErrorMessage("");
      setPastedText("");
      setIsSaving(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRunOcr = async () => {
    if (!previewUrl) return;

    setIsProcessing(true);
    setErrorMessage("");
    setProgress({ status: "Preparing register image...", progress: 5 });

    try {
      const ocrResult = await recognizeText(previewUrl, (p) => setProgress(p));
      const parsedRecords = parseKitchenRegisterText(ocrResult.text, menu);

      if (!parsedRecords.length) {
        setErrorMessage(
          "Could not detect structured portion logs from this photo. Check that the image contains dish names and numbers for prepared, served, and leftovers."
        );
        setExtractedRows([]);
        return;
      }

      setExtractedRows(parsedRecords);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "OCR recognition failed.";
      setErrorMessage(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleParsePaste = () => {
    if (!pastedText.trim()) {
      setErrorMessage("Please paste register text first.");
      return;
    }

    const parsed = parseKitchenRegisterText(pastedText, menu);
    if (!parsed.length) {
      setErrorMessage("Could not parse register records. Ensure lines include dish name, prepared, served, and leftover numbers.");
      return;
    }

    setExtractedRows(parsed);
  };

  const handleRowChange = (
    id: string,
    field: keyof ExtractedActivityRecord,
    val: any
  ) => {
    setExtractedRows((rows) =>
      rows.map((row) => {
        if (row.id !== id) return row;
        const updated = { ...row, [field]: val };
        const prep = field === "prepared" ? Number(val) : row.prepared;
        const served = field === "served" ? Number(val) : row.served;
        const left = field === "leftover" ? Number(val) : row.leftover;
        updated.isValid = prep === served + left;
        return updated;
      })
    );
  };

  const handleSaveConfirmed = async () => {
    const selected = extractedRows.filter((r) => r.selected);
    if (!selected.length) {
      setErrorMessage("Select at least one activity log to save.");
      return;
    }

    const invalid = selected.find(
      (r) => !r.menu_item_id || !r.service_date || r.prepared !== r.served + r.leftover
    );

    if (invalid) {
      setErrorMessage("Every selected record must be linked to a saved dish and satisfy: Prepared = Served + Leftover.");
      return;
    }

    setIsSaving(true);
    setErrorMessage("");

    try {
      const payload: ActivityInput[] = selected.map((s) => ({
        menu_item_id: s.menu_item_id,
        service_date: s.service_date,
        meal_service: s.meal_service,
        prepared: s.prepared,
        served: s.served,
        leftover: s.leftover,
        attendance: s.attendance,
        notes: s.notes,
      }));

      await onConfirmLogs(payload);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save logs to account.";
      setErrorMessage(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const selectedCount = extractedRows.filter((r) => r.selected).length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs overflow-y-auto"
    >
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-white border border-line-light shadow-2xl overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line-light bg-canvas/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-forest text-lime flex items-center justify-center shrink-0">
              <Sparkles size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-lg font-black text-ink">OCR Kitchen Register Digitizer</h2>
              <p className="text-xs text-ink-secondary">
                Scan kitchen register sheets to quickly import daily prep, served, and leftover counts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-2 rounded-xl text-ink-secondary hover:text-ink hover:bg-canvas transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-line-light bg-canvas/20 px-6 pt-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("photo")}
            className={`flex items-center gap-2 px-4 py-2.5 font-bold text-sm border-b-2 transition-all ${
              activeTab === "photo"
                ? "border-forest text-forest"
                : "border-transparent text-ink-secondary hover:text-ink"
            }`}
          >
            <Camera size={16} />
            <span>Upload Register Photo</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("paste")}
            className={`flex items-center gap-2 px-4 py-2.5 font-bold text-sm border-b-2 transition-all ${
              activeTab === "paste"
                ? "border-forest text-forest"
                : "border-transparent text-ink-secondary hover:text-ink"
            }`}
          >
            <FileText size={16} />
            <span>Paste Register Text</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMessage && (
            <div
              role="alert"
              className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-3"
            >
              <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-600" />
              <div className="flex-1 min-w-0 font-medium">{errorMessage}</div>
              <button type="button" onClick={() => setErrorMessage("")} className="text-red-500 hover:text-red-800">
                <X size={16} />
              </button>
            </div>
          )}

          {activeTab === "photo" ? (
            <div className="space-y-4">
              {!selectedFile ? (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files?.[0];
                    if (file) setSelectedFile(file);
                  }}
                  onClick={() => document.getElementById("ocr-reg-file")?.click()}
                  className="rounded-3xl border-2 border-dashed border-line-light bg-canvas/30 hover:bg-canvas/60 p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all"
                >
                  <Upload size={28} className="text-forest mb-3" />
                  <h4 className="font-extrabold text-ink text-sm">Upload photo of daily kitchen log sheet</h4>
                  <p className="text-xs text-ink-secondary mt-1">PNG, JPEG or WebP up to 10 MB</p>
                  <input
                    id="ocr-reg-file"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) setSelectedFile(f);
                    }}
                  />
                </div>
              ) : (
                <div className="rounded-2xl border border-line-light p-4 bg-canvas/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-ink">{selectedFile.name}</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setRotation((r) => (r === 270 ? 0 : ((r + 90) as any)))}
                        className="px-3 py-1 rounded-xl bg-white border border-line-light text-xs font-semibold flex items-center gap-1"
                      >
                        <RotateCw size={12} />
                        <span>Rotate ({rotation}°)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedFile(null)}
                        className="text-xs text-red-600 font-semibold"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  {previewUrl && (
                    <img
                      src={previewUrl}
                      alt="Register preview"
                      className="max-h-60 w-auto mx-auto object-contain rounded-xl border border-line-light"
                    />
                  )}
                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={handleRunOcr}
                      className="px-5 py-2.5 rounded-xl bg-forest text-lime font-bold text-sm flex items-center gap-2 disabled:opacity-50"
                    >
                      {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                      <span>{isProcessing ? "Scanning..." : "Scan Register Records"}</span>
                    </button>
                  </div>
                </div>
              )}

              {isProcessing && (
                <div className="rounded-2xl border border-line-light bg-canvas/50 p-4 space-y-2">
                  <div className="flex justify-between text-xs font-bold text-ink">
                    <span>{progress.status}</span>
                    <span>{progress.progress}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-line-light overflow-hidden">
                    <div className="h-full bg-forest transition-all" style={{ width: `${progress.progress}%` }} />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-ink-secondary">
                Paste log rows with quantities: <code>Yellow Dal Tadka 180 165 15 170</code> (Prepared Served Leftover Attendance)
              </p>
              <textarea
                rows={6}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="2026-10-19 lunch&#10;Yellow Dal Tadka 180 165 15 170&#10;Steamed Basmati Rice 200 185 15 170"
                className="w-full rounded-2xl border border-line-light p-4 text-xs font-mono"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleParsePaste}
                  className="px-5 py-2 rounded-xl bg-forest text-lime font-bold text-xs"
                >
                  Parse Register Text
                </button>
              </div>
            </div>
          )}

          {/* Staging rows */}
          {extractedRows.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-line-light">
              <h3 className="font-extrabold text-sm text-ink">
                Extracted Daily Logs ({extractedRows.length})
              </h3>
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {extractedRows.map((row) => (
                  <div
                    key={row.id}
                    className={`rounded-2xl border p-3 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center text-xs ${
                      !row.isValid
                        ? "bg-amber-500/5 border-amber-300"
                        : "bg-white border-line-light"
                    }`}
                  >
                    <div className="sm:col-span-1 flex items-center">
                      <input
                        type="checkbox"
                        checked={row.selected}
                        onChange={() =>
                          setExtractedRows((items) =>
                            items.map((i) => (i.id === row.id ? { ...i, selected: !i.selected } : i))
                          )
                        }
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <select
                        value={row.menu_item_id}
                        onChange={(e) => handleRowChange(row.id, "menu_item_id", e.target.value)}
                        className="w-full rounded-lg border border-line-light p-1.5 font-bold"
                      >
                        <option value="">Select dish ({row.dish_name})</option>
                        {menu.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <input
                        type="date"
                        value={row.service_date}
                        onChange={(e) => handleRowChange(row.id, "service_date", e.target.value)}
                        className="w-full rounded-lg border border-line-light p-1.5"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <select
                        value={row.meal_service}
                        onChange={(e) => handleRowChange(row.id, "meal_service", e.target.value)}
                        className="w-full rounded-lg border border-line-light p-1.5"
                      >
                        {["breakfast", "lunch", "dinner"].map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-3 grid grid-cols-3 gap-1">
                      <input
                        type="number"
                        title="Prepared"
                        placeholder="Prep"
                        value={row.prepared}
                        onChange={(e) => handleRowChange(row.id, "prepared", e.target.value)}
                        className="rounded border border-line-light p-1 text-center font-bold"
                      />
                      <input
                        type="number"
                        title="Served"
                        placeholder="Serv"
                        value={row.served}
                        onChange={(e) => handleRowChange(row.id, "served", e.target.value)}
                        className="rounded border border-line-light p-1 text-center"
                      />
                      <input
                        type="number"
                        title="Leftover"
                        placeholder="Left"
                        value={row.leftover}
                        onChange={(e) => handleRowChange(row.id, "leftover", e.target.value)}
                        className="rounded border border-line-light p-1 text-center"
                      />
                    </div>

                    <div className="sm:col-span-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setExtractedRows((r) => r.filter((i) => i.id !== row.id))}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-line-light bg-canvas/40 flex items-center justify-between shrink-0">
          <span className="text-xs text-ink-secondary">{selectedCount} records selected</span>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl border border-line-light text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSaving || selectedCount === 0}
              onClick={handleSaveConfirmed}
              className="px-5 py-2 rounded-xl bg-forest text-lime font-black text-xs flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              <span>Save {selectedCount} Activity Logs</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
