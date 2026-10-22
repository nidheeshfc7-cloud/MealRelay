"use client";

import React, { useState, useEffect, useId } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Camera,
  Check,
  CheckCircle2,
  FileText,
  Loader2,
  Plus,
  RefreshCw,
  RotateCw,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import type { DishCatalogItem } from "@/lib/types/api";
import { MENU_CATEGORIES, type MenuItem } from "@/lib/kitchen/types";
import type { ExtractedMenuItem, OcrFilterPreset, OcrProgress } from "@/lib/ocr/types";
import { preprocessImage } from "@/lib/ocr/preprocess";
import { recognizeText } from "@/lib/ocr/engine";
import { parseMenuDishes } from "@/lib/ocr/parser";

export interface OcrMenuImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDishes: (
    dishes: Array<{ name: string; category: DishCatalogItem["category"]; price: number }>
  ) => Promise<boolean | void>;
  onLoadToDraft?: (
    dishes: Array<{ name: string; category: DishCatalogItem["category"]; price: number }>
  ) => void;
  existingCatalog?: MenuItem[];
  initialFile?: File | null;
}

type ActiveTab = "photo" | "direct_paste";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export const OcrMenuImportModal: React.FC<OcrMenuImportModalProps> = ({
  isOpen,
  onClose,
  onConfirmDishes,
  onLoadToDraft,
  existingCatalog = [],
  initialFile = null,
}) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>("photo");
  const [selectedFile, setSelectedFile] = useState<File | null>(initialFile);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [rotation, setRotation] = useState<0 | 90 | 180 | 270>(0);
  const [filterPreset, setFilterPreset] = useState<OcrFilterPreset>("adaptive");

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<OcrProgress>({ status: "", progress: 0 });
  const [extractedRows, setExtractedRows] = useState<ExtractedMenuItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Direct paste tab state
  const [pastedText, setPastedText] = useState<string>("");

  // Bulk actions state
  const [bulkCategory, setBulkCategory] = useState<DishCatalogItem["category"]>("main");
  const [bulkPrice, setBulkPrice] = useState<string>("");

  // Generate preview when file, rotation, or filter changes
  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl("");
      return;
    }

    let isMounted = true;
    void preprocessImage(selectedFile, { rotation, filter: filterPreset }).then((url) => {
      if (isMounted) {
        setPreviewUrl(url);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [selectedFile, rotation, filterPreset]);

  // Reset state when modal is opened or closed
  useEffect(() => {
    if (isOpen) {
      if (initialFile) {
        setSelectedFile(initialFile);
        setActiveTab("photo");
      }
    } else {
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
  }, [isOpen, initialFile]);

  if (!isOpen) {
    return null;
  }

  const handleFileDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setErrorMessage("");
    const file = event.dataTransfer.files?.[0];
    if (!file) return;

    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setErrorMessage("Please upload a PNG, JPEG, or WebP photo.");
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage("Image exceeds 10 MB limit. Choose a smaller image.");
      return;
    }

    setSelectedFile(file);
    setExtractedRows([]);
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage("");
    const file = event.target.files?.[0];
    if (!file) return;

    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setErrorMessage("Please upload a PNG, JPEG, or WebP photo.");
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage("Image exceeds 10 MB limit. Choose a smaller image.");
      return;
    }

    setSelectedFile(file);
    setExtractedRows([]);
    event.target.value = "";
  };

  const handleRotate = () => {
    setRotation((prev) => {
      if (prev === 0) return 90;
      if (prev === 90) return 180;
      if (prev === 180) return 270;
      return 0;
    });
  };

  const handleRunOcr = async () => {
    if (!previewUrl) return;

    setIsProcessing(true);
    setErrorMessage("");
    setProgress({ status: "Preparing image...", progress: 5 });

    try {
      const ocrResult = await recognizeText(previewUrl, (p) => setProgress(p));
      const dishes = parseMenuDishes(ocrResult, existingCatalog);

      if (!dishes.length) {
        setErrorMessage(
          "No readable dish items were found. Try rotating 90°, switching to High-Contrast filter, or pasting text directly."
        );
        setExtractedRows([]);
        return;
      }

      setExtractedRows(dishes);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "OCR recognition failed.";
      setErrorMessage(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleParsePastedText = () => {
    if (!pastedText.trim()) {
      setErrorMessage("Please paste menu text into the box first.");
      return;
    }

    setErrorMessage("");
    const fakeOcrResult = {
      text: pastedText,
      confidence: 90,
      words: pastedText.split(/\s+/).map((w) => ({ text: w, confidence: 90 })),
    };

    const dishes = parseMenuDishes(fakeOcrResult, existingCatalog);
    if (!dishes.length) {
      setErrorMessage("Could not detect any dish names from pasted text. Please check format.");
      return;
    }

    setExtractedRows(dishes);
  };

  const handleToggleRowSelection = (id: string) => {
    setExtractedRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, selected: !row.selected } : row))
    );
  };

  const handleRowChange = (
    id: string,
    key: "name" | "category" | "price",
    value: string | number
  ) => {
    setExtractedRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        return {
          ...row,
          [key]: key === "price" ? Math.max(0, Number(value)) : value,
        };
      })
    );
  };

  const handleRemoveRow = (id: string) => {
    setExtractedRows((prev) => prev.filter((row) => row.id !== id));
  };

  const handleAddManualRow = () => {
    const newDish: ExtractedMenuItem = {
      id: crypto.randomUUID(),
      name: "",
      category: "main",
      price: 50.0,
      confidence: "high",
      confidenceScore: 100,
      isExistingMatch: false,
      selected: true,
    };
    setExtractedRows((prev) => [newDish, ...prev]);
  };

  const handleSelectAll = (select: boolean) => {
    setExtractedRows((prev) => prev.map((row) => ({ ...row, selected: select })));
  };

  const handleApplyBulkCategory = () => {
    setExtractedRows((prev) =>
      prev.map((row) => (row.selected ? { ...row, category: bulkCategory } : row))
    );
  };

  const handleApplyBulkPrice = () => {
    const num = parseFloat(bulkPrice);
    if (!Number.isFinite(num) || num <= 0) return;
    setExtractedRows((prev) =>
      prev.map((row) => (row.selected ? { ...row, price: num } : row))
    );
  };

  const handleSaveConfirmed = async () => {
    const selectedItems = extractedRows.filter((r) => r.selected);
    if (!selectedItems.length) {
      setErrorMessage("Select at least one dish to save.");
      return;
    }

    // Validate selected rows
    const invalidRow = selectedItems.find(
      (r) => !r.name.trim() || r.name.trim().length > 100 || !r.price || r.price <= 0
    );

    if (invalidRow) {
      setErrorMessage("All selected dishes must have a valid name and positive price.");
      return;
    }

    setIsSaving(true);
    setErrorMessage("");

    try {
      const payload = selectedItems.map((item) => ({
        name: item.name.trim(),
        category: item.category,
        price: Number(item.price.toFixed(2)),
      }));

      await onConfirmDishes(payload);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save dishes to menu.";
      setErrorMessage(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadToDraft = (): void => {
    const selectedItems = extractedRows.filter((r) => r.selected);
    if (!selectedItems.length) {
      setErrorMessage("Select at least one dish to load into the review form.");
      return;
    }

    const invalidRow = selectedItems.find(
      (r) => !r.name.trim() || r.name.trim().length > 100 || !r.price || r.price <= 0
    );

    if (invalidRow) {
      setErrorMessage("All selected dishes must have a valid name and positive price.");
      return;
    }

    const payload = selectedItems.map((item) => ({
      name: item.name.trim(),
      category: item.category,
      price: Number(item.price.toFixed(2)),
    }));

    if (onLoadToDraft) {
      onLoadToDraft(payload);
    }
    onClose();
  };

  const selectedCount = extractedRows.filter((r) => r.selected).length;
  const reviewNeededCount = extractedRows.filter((r) => r.confidence === "review_needed").length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs overflow-y-auto"
    >
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-white border border-line-light shadow-2xl overflow-hidden animate-fadeIn">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line-light bg-canvas/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-forest text-lime flex items-center justify-center shrink-0">
              <Sparkles size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-lg font-black text-ink">OCR Menu Digitizer</h2>
              <p className="text-xs text-ink-secondary">
                Scan whiteboard photos, printed rate lists, or paste text into your menu
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-2 rounded-xl text-ink-secondary hover:text-ink hover:bg-canvas transition-colors"
            aria-label="Close OCR modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Selection */}
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
            <span>Upload &amp; Scan Photo</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("direct_paste")}
            className={`flex items-center gap-2 px-4 py-2.5 font-bold text-sm border-b-2 transition-all ${
              activeTab === "direct_paste"
                ? "border-forest text-forest"
                : "border-transparent text-ink-secondary hover:text-ink"
            }`}
          >
            <FileText size={16} />
            <span>Paste Text Directly</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMessage && (
            <div
              role="alert"
              className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-3"
            >
              <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-600" />
              <div className="flex-1 min-w-0 font-medium">{errorMessage}</div>
              <button
                type="button"
                onClick={() => setErrorMessage("")}
                className="text-red-500 hover:text-red-800"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {activeTab === "photo" ? (
            <div className="space-y-5">
              {!selectedFile ? (
                /* Upload Dropzone */
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleFileDrop}
                  className="rounded-3xl border-2 border-dashed border-line-light bg-canvas/30 hover:bg-canvas/60 p-8 sm:p-12 flex flex-col items-center justify-center text-center transition-all cursor-pointer group"
                  onClick={() => document.getElementById("ocr-file-picker")?.click()}
                >
                  <div className="w-16 h-16 rounded-3xl bg-forest/10 text-forest flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                    <Upload size={28} />
                  </div>
                  <h3 className="font-extrabold text-base text-ink mb-1">
                    Drag and drop your menu photo here
                  </h3>
                  <p className="text-xs text-ink-secondary max-w-sm mb-4">
                    Supports PNG, JPEG, WebP up to 10 MB. Ideal for whiteboards, weekly mess cycle sheets, and canteen rate boards.
                  </p>
                  <label
                    htmlFor="ocr-file-picker"
                    onClick={(e) => e.stopPropagation()}
                    className="px-5 py-2.5 rounded-xl bg-forest text-lime font-bold text-sm cursor-pointer shadow-sm hover:bg-forest-dark transition-all"
                  >
                    Select Photo from Device
                  </label>
                  <input
                    id="ocr-file-picker"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleFileInputChange}
                  />
                </div>
              ) : (
                /* Selected Photo & Preprocessing Toolbar */
                <div className="rounded-2xl border border-line-light bg-canvas/30 p-4 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-line-light">
                    <div className="flex items-center gap-2">
                      <Camera size={16} className="text-forest" />
                      <span className="text-sm font-bold text-ink truncate max-w-xs">
                        {selectedFile.name}
                      </span>
                      <span className="text-xs text-ink-secondary">
                        ({(selectedFile.size / (1024 * 1024)).toFixed(1)} MB)
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={handleRotate}
                        title="Rotate 90 degrees clockwise"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-line-light text-xs font-semibold hover:bg-canvas transition-colors"
                      >
                        <RotateCw size={14} />
                        <span>Rotate 90° ({rotation}°)</span>
                      </button>

                      {/* Filter Presets */}
                      <div className="flex items-center rounded-xl bg-white border border-line-light p-1 text-xs">
                        {(["adaptive", "high_contrast", "natural"] as const).map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setFilterPreset(preset)}
                            className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                              filterPreset === preset
                                ? "bg-forest text-lime font-bold"
                                : "text-ink-secondary hover:text-ink"
                            }`}
                          >
                            {preset === "adaptive"
                              ? "Adaptive"
                              : preset === "high_contrast"
                                ? "B&W Board"
                                : "Natural"}
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedFile(null)}
                        className="px-3 py-1.5 rounded-xl text-xs text-red-700 hover:bg-red-50 transition-colors font-semibold"
                      >
                        Change Photo
                      </button>
                    </div>
                  </div>

                  {/* Canvas Preview Box */}
                  <div className="relative rounded-xl border border-line-light bg-black/5 overflow-hidden flex items-center justify-center max-h-64 sm:max-h-72">
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Preprocessed OCR preview"
                        className="max-h-64 sm:max-h-72 w-auto object-contain"
                      />
                    ) : (
                      <div className="p-8 text-center text-xs text-ink-secondary">
                        Rendering preprocessed photo...
                      </div>
                    )}
                  </div>

                  {/* Scan Trigger Button */}
                  <div className="flex items-center justify-end gap-3 pt-1">
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={handleRunOcr}
                      className="px-6 py-3 rounded-xl bg-forest text-lime font-extrabold text-sm flex items-center gap-2 hover:bg-forest-dark transition-all disabled:opacity-50 shadow-sm"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>Scanning with PaddleOCR...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={16} />
                          <span>Scan Menu Dishes (OCR)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Live Progress Bar */}
              {isProcessing && (
                <div className="rounded-2xl border border-line-light bg-canvas/50 p-4 space-y-2 animate-fadeIn">
                  <div className="flex justify-between text-xs font-bold text-ink">
                    <span>{progress.status || "Scanning text in image..."}</span>
                    <span>{progress.progress}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-line-light overflow-hidden">
                    <div
                      className="h-full bg-forest transition-all duration-300"
                      style={{ width: `${progress.progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Direct Text Paste Tab */
            <div className="space-y-4">
              <p className="text-xs text-ink-secondary">
                Paste menu listings from WhatsApp messages, committee circulars, or cycle spreadsheets. Each dish can include category and price (e.g. <code>Paneer Butter Masala - Rs 120</code>).
              </p>
              <textarea
                rows={7}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="1. Yellow Dal Tadka ₹60&#10;2. Steamed Basmati Rice 50&#10;3. Paneer Butter Masala 120&#10;4. Butter Phulka 15"
                className="w-full rounded-2xl border border-line-light bg-canvas/30 p-4 text-sm font-mono text-ink focus:outline-none focus:ring-2 focus:ring-forest"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleParsePastedText}
                  className="px-5 py-2.5 rounded-xl bg-forest text-lime font-bold text-sm flex items-center gap-2 hover:bg-forest-dark transition-all"
                >
                  <Sparkles size={15} />
                  <span>Parse Text into Dishes</span>
                </button>
              </div>
            </div>
          )}

          {/* Staging & Review Table */}
          {extractedRows.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-line-light">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-extrabold text-base text-ink">
                    Extracted Dishes ({extractedRows.length})
                  </h3>
                  <p className="text-xs text-ink-secondary">
                    {selectedCount} selected to import ·{" "}
                    {reviewNeededCount > 0 ? (
                      <span className="text-amber-700 font-semibold">
                        {reviewNeededCount} marked for manual review
                      </span>
                    ) : (
                      <span className="text-forest font-semibold">All dishes high confidence</span>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAddManualRow}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-line-light bg-white text-xs font-bold hover:bg-canvas transition-colors text-ink"
                  >
                    <Plus size={14} />
                    <span>Add Dish</span>
                  </button>
                </div>
              </div>

              {/* Bulk Actions Toolbar */}
              <div className="rounded-2xl bg-canvas/60 border border-line-light p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectAll(true)}
                    className="font-bold text-forest hover:underline"
                  >
                    Select All
                  </button>
                  <span className="text-ink-secondary">|</span>
                  <button
                    type="button"
                    onClick={() => handleSelectAll(false)}
                    className="font-bold text-ink-secondary hover:text-ink hover:underline"
                  >
                    Deselect All
                  </button>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className="text-ink-secondary font-medium">Category:</span>
                    <select
                      value={bulkCategory}
                      onChange={(e) => setBulkCategory(e.target.value as DishCatalogItem["category"])}
                      className="rounded-lg border border-line-light bg-white px-2 py-1 text-xs"
                    >
                      {MENU_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleApplyBulkCategory}
                      disabled={selectedCount === 0}
                      className="px-2.5 py-1 rounded-lg bg-forest text-lime font-bold disabled:opacity-40"
                    >
                      Apply
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-ink-secondary font-medium">Price:</span>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      placeholder="₹50"
                      value={bulkPrice}
                      onChange={(e) => setBulkPrice(e.target.value)}
                      className="w-16 rounded-lg border border-line-light bg-white px-2 py-1 text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleApplyBulkPrice}
                      disabled={selectedCount === 0 || !bulkPrice}
                      className="px-2.5 py-1 rounded-lg bg-forest text-lime font-bold disabled:opacity-40"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>

              {/* Rows List */}
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {extractedRows.map((row, index) => (
                  <div
                    key={row.id}
                    className={`rounded-2xl border p-3 flex flex-col sm:flex-row sm:items-center gap-3 transition-all ${
                      row.selected
                        ? row.confidence === "review_needed"
                          ? "bg-amber-500/5 border-amber-300"
                          : "bg-white border-line-light"
                        : "bg-canvas/30 border-dashed border-line-light opacity-60"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={row.selected}
                        onChange={() => handleToggleRowSelection(row.id)}
                        className="w-4 h-4 rounded text-forest focus:ring-forest cursor-pointer"
                      />
                      <span className="text-xs text-ink-secondary font-bold w-5">{index + 1}.</span>
                    </div>

                    {/* Dish Name */}
                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        value={row.name}
                        placeholder="Enter dish name"
                        onChange={(e) => handleRowChange(row.id, "name", e.target.value)}
                        className="w-full rounded-xl border border-line-light bg-white px-3 py-2 text-sm font-semibold text-ink focus:outline-none focus:ring-1 focus:ring-forest"
                      />
                    </div>

                    {/* Category Select */}
                    <div className="w-full sm:w-36">
                      <select
                        value={row.category}
                        onChange={(e) =>
                          handleRowChange(row.id, "category", e.target.value as DishCatalogItem["category"])
                        }
                        className="w-full rounded-xl border border-line-light bg-white px-3 py-2 text-xs font-semibold text-ink capitalize"
                      >
                        {MENU_CATEGORIES.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Price Input */}
                    <div className="w-full sm:w-28 flex items-center gap-1">
                      <span className="text-xs text-ink-secondary font-semibold">₹</span>
                      <input
                        type="number"
                        min="0.01"
                        max="99999"
                        step="0.01"
                        value={row.price || ""}
                        placeholder="0.00"
                        onChange={(e) => handleRowChange(row.id, "price", e.target.value)}
                        className="w-full rounded-xl border border-line-light bg-white px-3 py-2 text-xs font-semibold text-ink"
                      />
                    </div>

                    {/* Badges */}
                    <div className="flex items-center gap-2 shrink-0">
                      {row.isExistingMatch && (
                        <span
                          title="Matches an existing dish in your menu"
                          className="px-2 py-1 rounded-lg text-[10px] font-black bg-sage text-forest uppercase tracking-wider"
                        >
                          In Menu
                        </span>
                      )}

                      {row.confidence === "review_needed" ? (
                        <span
                          title={`Confidence: ${row.confidenceScore}%. Check spelling and price.`}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300"
                        >
                          <AlertTriangle size={11} className="text-amber-700" />
                          <span>Review</span>
                        </span>
                      ) : (
                        <span
                          title={`Confidence: ${row.confidenceScore}%`}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200"
                        >
                          <Check size={11} className="text-emerald-700" />
                          <span>Verified</span>
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => handleRemoveRow(row.id)}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete item"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-line-light bg-canvas/40 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-ink-secondary">
            {selectedCount > 0 ? (
              <span>
                Ready to commit <strong>{selectedCount}</strong> dish{selectedCount === 1 ? "" : "es"} to your account menu.
              </span>
            ) : (
              <span>No dishes selected</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={isSaving}
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-line-light font-bold text-sm text-ink-secondary hover:text-ink hover:bg-canvas transition-colors"
            >
              Cancel
            </button>
            {onLoadToDraft && (
              <button
                type="button"
                disabled={isSaving || selectedCount === 0}
                onClick={handleLoadToDraft}
                className="px-4 py-2.5 rounded-xl border border-forest text-forest font-bold text-sm hover:bg-forest/5 transition-colors disabled:opacity-50"
              >
                Load {selectedCount} to Review Form
              </button>
            )}
            <button
              type="button"
              disabled={isSaving || selectedCount === 0}
              onClick={handleSaveConfirmed}
              className="px-6 py-2.5 rounded-xl bg-forest text-lime font-black text-sm flex items-center gap-2 hover:bg-forest-dark transition-all disabled:opacity-50 shadow-sm"
            >
              {isSaving ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Saving to Menu...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Confirm and Save {selectedCount} Dishes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
