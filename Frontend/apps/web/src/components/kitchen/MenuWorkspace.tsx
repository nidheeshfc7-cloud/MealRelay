"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Sparkles,
  Upload,
  Plus,
  Trash2,
  Edit3,
  RefreshCw,
  Search,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  Camera,
} from "lucide-react";
import { listMenuItems, saveMenuItems, deleteMenuItem } from "@/lib/kitchen/actions";
import { MENU_CATEGORIES, type MenuInput, type MenuItem } from "@/lib/kitchen/types";
import { WorkspaceShell } from "./WorkspaceShell";
import { OcrMenuImportModal } from "./OcrMenuImportModal";

const blank = (): MenuInput => ({ name: "", category: "main", price: 0 });

const MAX_PHOTOS = 10;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

type PhotoPreviewProps = {
  file: File;
  onScan: () => void;
  remove: () => void;
};

const PhotoPreview: React.FC<PhotoPreviewProps> = ({ file, onScan, remove }) => {
  const [photoUrl, setPhotoUrl] = useState<string>("");

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPhotoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <figure className="group relative rounded-2xl border border-line-light bg-white p-3 flex flex-col justify-between overflow-hidden shadow-xs hover:border-forest/30 transition-all">
      <div className="w-full h-36 rounded-xl bg-canvas flex items-center justify-center overflow-hidden">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={`Menu photo: ${file.name}`}
            className="w-full h-full object-contain"
          />
        ) : (
          <Camera size={24} className="text-ink-secondary" />
        )}
      </div>

      <figcaption className="mt-2 text-xs font-semibold text-ink truncate" title={file.name}>
        {file.name}
      </figcaption>
      <p className="text-[10px] text-ink-secondary mb-2">
        {(file.size / (1024 * 1024)).toFixed(1)} MB
      </p>

      <div className="flex items-center justify-between gap-2 pt-2 border-t border-line-light text-xs font-bold">
        <button
          type="button"
          onClick={onScan}
          className="flex items-center gap-1 text-forest hover:text-forest-dark hover:underline"
        >
          <Sparkles size={12} />
          <span>Scan OCR</span>
        </button>
        <button
          type="button"
          onClick={remove}
          className="text-red-700 hover:text-red-900 hover:underline"
        >
          Remove
        </button>
      </div>
    </figure>
  );
};

export const MenuWorkspace: React.FC = () => {
  const [saved, setSaved] = useState<MenuItem[]>([]);
  const [draft, setDraft] = useState<MenuInput[]>([blank()]);
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [photos, setPhotos] = useState<File[]>([]);
  const [busy, setBusy] = useState<boolean>(true);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isOcrOpen, setIsOcrOpen] = useState<boolean>(false);
  const [activeOcrPhoto, setActiveOcrPhoto] = useState<File | null>(null);

  // Search & category filter states for saved menu
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const load = async (): Promise<boolean> => {
    try {
      const result = await listMenuItems();
      if (!result.ok) {
        setError(result.error);
        return false;
      }
      setSaved(result.data);
      return true;
    } catch {
      setError("Unable to reach the server. Please refresh to retry.");
      return false;
    }
  };

  useEffect(() => {
    void load().finally(() => setBusy(false));
  }, []);

  const changeDraft = (index: number, key: keyof MenuInput, value: string): void => {
    setDraft((rows) =>
      rows.map((row, i) =>
        i === index
          ? { ...row, [key]: key === "price" ? (value === "" ? 0 : Number(value)) : value }
          : row
      )
    );
  };

  const addDraftRow = (): void => {
    if (draft.length >= 200) {
      setError("Maximum of 200 items can be drafted simultaneously.");
      return;
    }
    setDraft((rows) => [...rows, blank()]);
  };

  const removeDraftRow = (index: number): void => {
    if (draft.length <= 1) {
      setDraft([blank()]);
      return;
    }
    setDraft((rows) => rows.filter((_, j) => j !== index));
  };

  const clearDraft = (): void => {
    setDraft([blank()]);
    setEditingId(undefined);
  };

  const save = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();

    // Validate draft
    const hasEmptyName = draft.some((item) => !item.name.trim());
    if (hasEmptyName) {
      setError("Each dish in the table must have a name.");
      return;
    }

    const hasInvalidPrice = draft.some((item) => !item.price || item.price <= 0);
    if (hasInvalidPrice) {
      setError("Each dish must have a positive price greater than zero.");
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");

    try {
      const result = await saveMenuItems(draft, editingId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDraft([blank()]);
      setEditingId(undefined);
      await load();
      setMessage(
        editingId ? "Menu item updated successfully." : "Menu saved to your account."
      );
    } catch {
      setError("Unable to reach the server. Your draft is still available.");
    } finally {
      setBusy(false);
    }
  };

  // Direct save confirmation from OCR Modal
  const handleOcrDirectConfirm = async (
    extracted: Array<{ name: string; category: MenuInput["category"]; price: number }>
  ): Promise<void> => {
    if (!extracted.length) return;
    setBusy(true);
    setError("");
    setMessage("");

    try {
      const result = await saveMenuItems(extracted);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      await load();
      setMessage(
        `Saved ${extracted.length} dish${extracted.length === 1 ? "" : "es"} to your menu directly from OCR.`
      );
    } catch {
      setError("Unable to reach the server. Please retry.");
    } finally {
      setBusy(false);
    }
  };

  // Load OCR results directly into the page's editable table
  const handleOcrLoadToDraft = (
    extracted: Array<{ name: string; category: MenuInput["category"]; price: number }>
  ): void => {
    if (!extracted.length) return;
    // Filter out completely blank initial row if present
    setDraft((prev) => {
      const cleanPrev = prev.filter((r) => r.name.trim().length > 0 && r.price > 0);
      return [...cleanPrev, ...extracted];
    });
    setEditingId(undefined);
    setMessage(
      `Loaded ${extracted.length} dish${
        extracted.length === 1 ? "" : "es"
      } from OCR into the review table. Check details and confirm below.`
    );
    // Smooth scroll down to review table
    const tableEl = document.getElementById("menu-review-table");
    if (tableEl) {
      tableEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  const removeSavedItem = async (id: string): Promise<void> => {
    if (!confirm("Delete this menu item? Items used in activity logs cannot be deleted.")) {
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");

    try {
      const result = await deleteMenuItem(id);
      if (result.ok) {
        await load();
        setMessage("Menu item deleted.");
      } else {
        setError(result.error);
      }
    } catch {
      setError("Unable to reach the server.");
    } finally {
      setBusy(false);
    }
  };

  const startEditSavedItem = (item: MenuItem): void => {
    setEditingId(item.id);
    setDraft([{ name: item.name, category: item.category, price: Number(item.price) }]);
    setMessage(`Editing "${item.name}". Make changes in the table below and confirm.`);
    const tableEl = document.getElementById("menu-review-table");
    if (tableEl) {
      tableEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handlePhotoUpload = (incomingFiles: File[]): void => {
    if (!incomingFiles.length) return;

    const invalidType = incomingFiles.some(
      (f) => !["image/png", "image/jpeg", "image/webp"].includes(f.type)
    );
    if (invalidType) {
      setError("Photos must be PNG, JPEG, or WebP images.");
      return;
    }

    const overSize = incomingFiles.some((f) => f.size > MAX_FILE_SIZE);
    if (overSize) {
      setError("Each photo must be under 10 MB in size.");
      return;
    }

    if (photos.length + incomingFiles.length > MAX_PHOTOS) {
      setError(`You can upload a maximum of ${MAX_PHOTOS} photos at once.`);
      return;
    }

    setError("");
    setPhotos((items) => [...items, ...incomingFiles]);
  };

  // Filtered saved dishes
  const filteredSaved = useMemo(() => {
    let result = saved;
    if (categoryFilter !== "all") {
      result = result.filter((item) => item.category === categoryFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((item) => item.name.toLowerCase().includes(q));
    }
    return result;
  }, [saved, categoryFilter, searchQuery]);

  // Counts by category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: saved.length };
    MENU_CATEGORIES.forEach((cat) => {
      counts[cat] = saved.filter((item) => item.category === cat).length;
    });
    return counts;
  }, [saved]);

  return (
    <WorkspaceShell
      title="Menu management"
      description="Review your dishes and prices, extract items with client-side OCR, and maintain a verified menu for your kitchen."
    >
      {message && (
        <div
          role="status"
          className="flex items-center gap-3 p-4 bg-sage rounded-2xl text-forest text-sm font-semibold border border-forest/10 animate-fadeIn"
        >
          <CheckCircle2 size={18} className="shrink-0 text-forest" />
          <span className="flex-1">{message}</span>
          <button
            type="button"
            onClick={() => setMessage("")}
            className="text-forest/60 hover:text-forest"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="flex items-center gap-3 p-4 bg-red-50 text-red-800 rounded-2xl text-sm font-semibold border border-red-200 animate-fadeIn"
        >
          <AlertCircle size={18} className="shrink-0 text-red-700" />
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={() => setError("")}
            className="text-red-700/60 hover:text-red-900"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* SECTION 1: Menu Photographs & OCR Digitizer */}
      <section className="rounded-3xl bg-white border border-line-light p-6 space-y-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-ink">Menu photographs</h2>
              <span className="px-2 py-0.5 rounded-md bg-sage text-forest text-[11px] font-bold">
                Tesseract.js OCR
              </span>
            </div>
            <p className="text-ink-secondary text-sm mt-0.5">
              Upload photos of printed weekly cycles, handwritten boards, or rate sheets to extract
              dishes automatically.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                setActiveOcrPhoto(photos[0] || null);
                setIsOcrOpen(true);
              }}
              className="flex items-center gap-2 rounded-xl bg-forest text-lime px-4 py-2.5 font-bold text-sm hover:bg-forest-dark transition-all shadow-xs"
            >
              <Sparkles size={16} />
              <span>{photos.length > 0 ? "Scan with OCR" : "Open OCR Digitizer"}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveOcrPhoto(null);
                setIsOcrOpen(true);
              }}
              className="flex items-center gap-2 rounded-xl border border-line-light px-3.5 py-2.5 font-bold text-sm text-forest hover:bg-canvas transition-colors"
              title="Paste text from WhatsApp, email or notice boards"
            >
              <FileText size={15} />
              <span>Paste Text</span>
            </button>
          </div>
        </div>

        {/* Drag and Drop Zone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handlePhotoUpload(Array.from(e.dataTransfer.files || []));
          }}
          className="rounded-2xl border-2 border-dashed border-line-light bg-canvas/30 hover:bg-canvas/60 p-6 flex flex-col items-center justify-center text-center transition-all cursor-pointer"
          onClick={() => document.getElementById("menu-photo-input")?.click()}
        >
          <div className="w-12 h-12 rounded-2xl bg-forest/10 text-forest flex items-center justify-center mb-2">
            <Upload size={22} />
          </div>
          <p className="text-sm font-bold text-ink">
            Drop menu photos here, or <span className="text-forest underline">browse</span>
          </p>
          <p className="text-xs text-ink-secondary mt-1">
            PNG, JPEG, WebP up to 10 MB each (max {MAX_PHOTOS} photos)
          </p>
          <input
            id="menu-photo-input"
            type="file"
            multiple
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              handlePhotoUpload(Array.from(e.target.files || []));
              e.target.value = "";
            }}
          />
        </div>

        {/* Photo Gallery Previews */}
        {photos.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-ink-secondary">
              <span>
                {photos.length} photo{photos.length === 1 ? "" : "s"} selected
              </span>
              <button
                type="button"
                onClick={() => setPhotos([])}
                className="text-red-700 hover:underline"
              >
                Clear all photos
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {photos.map((file, i) => (
                <PhotoPreview
                  key={file.name + file.lastModified + i}
                  file={file}
                  onScan={() => {
                    setActiveOcrPhoto(file);
                    setIsOcrOpen(true);
                  }}
                  remove={() => setPhotos((items) => items.filter((_, j) => i !== j))}
                />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* SECTION 2: Review and Confirm Menu (Editable Table) */}
      <form
        id="menu-review-table"
        onSubmit={save}
        className="rounded-3xl bg-white border border-line-light p-6 space-y-5 shadow-xs"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-line-light">
          <div>
            <h2 className="text-xl font-black text-ink">
              {editingId ? "Edit menu item" : "Review and confirm menu"}
            </h2>
            <p className="text-sm text-ink-secondary">
              {editingId
                ? "Update this dish's name, category, or price and save changes."
                : "Enter dishes manually, or import them from photos with OCR above. Up to 200 items per batch."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!editingId && (
              <button
                type="button"
                onClick={addDraftRow}
                disabled={busy || draft.length >= 200}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-line-light text-sm font-bold text-forest hover:bg-canvas transition-colors disabled:opacity-50"
              >
                <Plus size={16} />
                <span>Add Row</span>
              </button>
            )}
            {draft.length > 1 && !editingId && (
              <button
                type="button"
                onClick={clearDraft}
                disabled={busy}
                className="px-3 py-2 text-xs font-bold text-ink-secondary hover:text-red-700 transition-colors"
              >
                Clear Rows
              </button>
            )}
          </div>
        </div>

        {/* High-Density Editable Table */}
        <div className="overflow-x-auto rounded-2xl border border-line-light">
          <table className="w-full text-left text-sm">
            <thead className="bg-canvas/50 text-xs font-bold text-ink-secondary border-b border-line-light">
              <tr>
                <th className="py-3 px-3 w-12 text-center">#</th>
                <th className="py-3 px-3">Dish Name</th>
                <th className="py-3 px-3 w-48">Category</th>
                <th className="py-3 px-3 w-36">Price (₹)</th>
                <th className="py-3 px-3 w-16 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-light">
              {draft.map((row, i) => (
                <tr key={i} className="hover:bg-canvas/20 transition-colors">
                  <td className="py-2.5 px-3 text-center text-xs text-ink-secondary font-bold">
                    {i + 1}
                  </td>
                  <td className="py-2.5 px-3">
                    <input
                      required
                      maxLength={100}
                      placeholder="e.g. Masala Dosa, Dal Makhani"
                      value={row.name}
                      onChange={(e) => changeDraft(i, "name", e.target.value)}
                      className="w-full rounded-xl border border-line-light bg-white px-3 py-2 text-sm font-medium text-ink focus:border-forest focus:outline-none"
                    />
                  </td>
                  <td className="py-2.5 px-3">
                    <select
                      value={row.category}
                      onChange={(e) => changeDraft(i, "category", e.target.value)}
                      className="w-full rounded-xl border border-line-light bg-white px-3 py-2 text-sm font-medium text-ink focus:border-forest focus:outline-none capitalize"
                    >
                      {MENU_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2.5 px-3">
                    <input
                      required
                      type="number"
                      min="0.01"
                      max="9999999999.99"
                      step="0.01"
                      placeholder="40.00"
                      value={row.price || ""}
                      onChange={(e) => changeDraft(i, "price", e.target.value)}
                      className="w-full rounded-xl border border-line-light bg-white px-3 py-2 text-sm font-medium text-ink focus:border-forest focus:outline-none"
                    />
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      type="button"
                      disabled={draft.length === 1 || busy}
                      onClick={() => removeDraftRow(i)}
                      className="p-2 text-ink-secondary hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-20"
                      title="Remove row"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Form Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="text-xs text-ink-secondary">
            {draft.length} item{draft.length === 1 ? "" : "s"} in batch
          </div>

          <div className="flex items-center gap-3">
            {editingId && (
              <button
                type="button"
                disabled={busy}
                onClick={clearDraft}
                className="px-4 py-2.5 rounded-xl border border-line-light font-bold text-sm text-ink-secondary hover:text-ink transition-colors"
              >
                Cancel edit
              </button>
            )}
            <button
              type="submit"
              disabled={busy}
              className="flex items-center gap-2 rounded-xl bg-forest text-lime px-6 py-2.5 font-black text-sm hover:bg-forest-dark transition-all disabled:opacity-50 shadow-xs"
            >
              <CheckCircle2 size={16} />
              <span>
                {busy
                  ? "Saving to catalog..."
                  : editingId
                  ? "Update menu item"
                  : `Confirm and save ${draft.length} dish${draft.length === 1 ? "" : "es"}`}
              </span>
            </button>
          </div>
        </div>
      </form>

      {/* SECTION 3: Saved Menu Catalog */}
      <section
        className="rounded-3xl bg-white border border-line-light p-6 space-y-5 shadow-xs"
        aria-busy={busy}
      >
        <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-line-light">
          <div>
            <h2 className="text-xl font-black text-ink">Saved menu ({saved.length})</h2>
            <p className="text-sm text-ink-secondary">
              Dishes registered to your account available for daily service activity logging.
            </p>
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setBusy(true);
              setError("");
              void load().finally(() => setBusy(false));
            }}
            className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl border border-line-light text-sm font-bold text-forest hover:bg-canvas transition-colors"
          >
            <RefreshCw size={14} className={busy ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Filter and Search Toolbar */}
        {saved.length > 0 && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                <button
                  type="button"
                  onClick={() => setCategoryFilter("all")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    categoryFilter === "all"
                      ? "bg-forest text-lime shadow-xs"
                      : "bg-canvas text-ink-secondary hover:text-ink"
                  }`}
                >
                  All ({categoryCounts.all || 0})
                </button>
                {MENU_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all shrink-0 ${
                      categoryFilter === cat
                        ? "bg-forest text-lime shadow-xs"
                        : "bg-canvas text-ink-secondary hover:text-ink"
                    }`}
                  >
                    {cat} ({categoryCounts[cat] || 0})
                  </button>
                ))}
              </div>

              {/* Dish Search Input */}
              <div className="relative min-w-[200px] max-w-xs w-full">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-secondary"
                />
                <input
                  type="text"
                  placeholder="Search saved dishes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-line-light bg-canvas/40 pl-9 pr-3 py-1.5 text-xs font-medium text-ink focus:border-forest focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-secondary hover:text-ink"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Saved Items List */}
        {!saved.length && !busy ? (
          <div className="text-center py-10 bg-canvas/30 rounded-2xl border border-dashed border-line-light">
            <p className="font-bold text-ink text-sm">No saved dishes in your account yet</p>
            <p className="text-xs text-ink-secondary mt-1 max-w-sm mx-auto">
              Use the OCR digitizer above to scan a photo menu, or add dishes in the table to get
              started.
            </p>
          </div>
        ) : filteredSaved.length === 0 && saved.length > 0 ? (
          <div className="text-center py-8 text-ink-secondary text-sm">
            <p>No dishes match your current filter or search.</p>
            <button
              type="button"
              onClick={() => {
                setCategoryFilter("all");
                setSearchQuery("");
              }}
              className="text-forest underline text-xs font-bold mt-2"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-line-light rounded-2xl border border-line-light overflow-hidden bg-white">
            {filteredSaved.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-canvas/20 transition-colors"
              >
                <div className="flex-1 min-w-[200px]">
                  <p className="font-bold text-ink text-sm break-words">{item.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 rounded-md bg-sage text-forest text-[10px] font-black uppercase tracking-wider">
                      {item.category}
                    </span>
                    <span className="text-xs font-semibold text-ink-secondary">
                      ₹{Number(item.price).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => startEditSavedItem(item)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-line-light text-xs font-bold text-forest hover:bg-canvas transition-colors disabled:opacity-50"
                  >
                    <Edit3 size={13} />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void removeSavedItem(item.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    <Trash2 size={13} />
                    <span>Delete</span>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* OCR Menu Import Modal */}
      <OcrMenuImportModal
        isOpen={isOcrOpen}
        onClose={() => {
          setIsOcrOpen(false);
          setActiveOcrPhoto(null);
        }}
        onConfirmDishes={handleOcrDirectConfirm}
        onLoadToDraft={handleOcrLoadToDraft}
        existingCatalog={saved}
        initialFile={activeOcrPhoto}
      />
    </WorkspaceShell>
  );
};
