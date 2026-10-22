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
  CheckCircle2,
  AlertCircle,
  X,
  Camera,
} from "lucide-react";
import { listMenuItems, saveMenuItems, deleteMenuItem } from "@/lib/kitchen/actions";
import { MENU_CATEGORIES, type MenuInput, type MenuItem } from "@/lib/kitchen/types";
import styles from "./MenuWorkspace.module.css";
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
  const [ocrTab, setOcrTab] = useState<"photo" | "direct_paste">("photo");

  // Search & category filter states for saved menu
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortOrder, setSortOrder] = useState("name");
  const [excludedRows, setExcludedRows] = useState<Set<number>>(new Set());
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
      setExcludedRows(new Set());
      return;
    }
    setExcludedRows((excluded) => new Set([...excluded].filter((i) => i !== index).map((i) => i > index ? i - 1 : i)));
    setDraft((rows) => rows.filter((_, j) => j !== index));
  };

  const clearDraft = (): void => {
    setDraft([blank()]);
    setExcludedRows(new Set());
    setEditingId(undefined);
  };

  const save = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();

    // Validate draft
    const selectedDraft = draft.filter((_, index) => !excludedRows.has(index));
    if (!selectedDraft.length) { setError("Select at least one dish to save."); return; }
    const hasEmptyName = selectedDraft.some((item) => !item.name.trim());
    if (hasEmptyName) {
      setError("Each dish in the table must have a name.");
      return;
    }

    const hasInvalidPrice = selectedDraft.some((item) => !Number.isFinite(item.price) || item.price <= 0);
    if (hasInvalidPrice) {
      setError("Each dish must have a positive price greater than zero.");
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");

    try {
      const result = await saveMenuItems(selectedDraft, editingId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDraft([blank()]);
      setExcludedRows(new Set());
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
    setExcludedRows(new Set());
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
    return [...result].sort((a, b) => sortOrder === "price" ? Number(a.price) - Number(b.price) : a.name.localeCompare(b.name));
  }, [saved, categoryFilter, searchQuery, sortOrder]);

  const openOcr = (file: File | null = null, tab: "photo" | "direct_paste" = "photo") => {
    setOcrTab(tab);
    setActiveOcrPhoto(file);
    setIsOcrOpen(true);
  };
  const pendingCount = draft.filter((row) => row.name.trim() || row.price > 0).length;

  return (
    <WorkspaceShell title="Menu Management" description="Manage your kitchen menu." customHeader>
      <div className={styles.workspace}>
        <header className={styles.header}>
          <div><p className={styles.eyebrow}>Kitchen Operations Workspace</p><h1>Menu Management</h1><p>Upload menus, review extracted dishes and keep your kitchen’s digital menu up to date.</p></div>
        </header>
        {message && <div role="status" className={styles.notice}><CheckCircle2 size={18} /><span>{message}</span><button type="button" aria-label="Dismiss message" onClick={() => setMessage("")}><X size={16} /></button></div>}
        {error && <div role="alert" className={styles.error}><AlertCircle size={18} /><span>{error}</span><button type="button" aria-label="Dismiss error" onClick={() => setError("")}><X size={16} /></button></div>}
        <section className={styles.card}>
          <div className={styles.sectionHeading}><div className={styles.numberedHeading} data-step="1"><h2>Upload menu photos</h2><p>Upload your menu, then scan a photo to extract dishes for review.</p></div><span className={styles.badge}>Up to {MAX_PHOTOS} photos</span></div>
          <div className={styles.dropzone} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); handlePhotoUpload(Array.from(event.dataTransfer.files)); }}>
            <Upload size={28} /><strong>Drag and drop menu photos here</strong><p>PNG, JPEG or WebP · Up to 10 MB per photo</p>
            <label className={styles.browse}>Browse files<input aria-label="Upload menu photos" type="file" multiple accept="image/png,image/jpeg,image/webp" onChange={(event) => { handlePhotoUpload(Array.from(event.target.files || [])); event.target.value = ""; }} /></label>
          </div>
          {photos.length > 0 && <><div className={styles.uploadCount}><span>{photos.length} photos selected</span><button type="button" onClick={() => setPhotos([])}>Clear all photos</button></div><div className={styles.photos}>{photos.map((file, index) => <PhotoPreview key={file.name + file.lastModified + index} file={file} onScan={() => openOcr(file)} remove={() => setPhotos((items) => items.filter((_, i) => i !== index))} />)}</div></>}
        </section>
        <form id="menu-review-table" onSubmit={save} className={styles.card}>
          <div className={styles.sectionHeading}><div className={styles.numberedHeading} data-step="2"><h2>{editingId ? "Edit menu item" : "Review and confirm extracted items"}</h2><p>Check dish names, categories and prices before saving to your menu.</p></div><button type="button" disabled={busy || draft.length >= 200 || !!editingId} onClick={addDraftRow}><Plus size={16} />Add Item Manually</button></div>
          <div className={styles.tableScroll}><table className={styles.table}><thead><tr><th><input type="checkbox" aria-label="Select all review items" checked={excludedRows.size === 0} onChange={(event) => setExcludedRows(event.target.checked ? new Set() : new Set(draft.map((_, i) => i)))} /></th><th>#</th><th>Dish name</th><th>Category</th><th>Price (₹)</th><th>Actions</th></tr></thead>
          <tbody>{draft.map((row, index) => <tr key={index}>
            <td><input type="checkbox" aria-label={`Select item ${index + 1}`} checked={!excludedRows.has(index)} onChange={(event) => setExcludedRows((previous) => { const next = new Set(previous); if (event.target.checked) next.delete(index); else next.add(index); return next; })} /></td><td>{index + 1}</td>
            <td><input aria-label={`Dish name ${index + 1}`} disabled={excludedRows.has(index)} required={!excludedRows.has(index)} maxLength={100} placeholder="Enter dish name" value={row.name} onChange={(event) => changeDraft(index, "name", event.target.value)} />{(!row.name.trim() || !Number.isFinite(row.price) || row.price <= 0) && <small className={styles.review}>Needs review</small>}</td>
            <td><select disabled={excludedRows.has(index)} aria-label={`Category ${index + 1}`} value={row.category} onChange={(event) => changeDraft(index, "category", event.target.value)}>{MENU_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}</select></td>
            <td><input aria-label={`Price ${index + 1}`} disabled={excludedRows.has(index)} required={!excludedRows.has(index)} type="number" min="0.01" max="9999999999.99" step="0.01" placeholder="0.00" value={row.price || ""} onChange={(event) => changeDraft(index, "price", event.target.value)} /></td>
            <td><div className={styles.actions}><button type="button" aria-label={`Edit item ${index + 1}`} disabled={excludedRows.has(index)} onClick={() => (document.querySelector(`[aria-label="Dish name ${index + 1}"]`) as HTMLInputElement | null)?.focus()}><Edit3 size={15} /></button><button type="button" aria-label={`Delete item ${index + 1}`} disabled={busy} onClick={() => removeDraftRow(index)}><Trash2 size={16} /></button></div></td>
          </tr>)}</tbody></table></div>
          <div className={styles.formFooter}><span>{pendingCount} item{pendingCount === 1 ? "" : "s"} in review · {draft.length - excludedRows.size} selected</span><div className={styles.actions}><button type="button" disabled={busy} onClick={() => { if (editingId || confirm("Discard all items in the review table?")) clearDraft(); }}>{editingId ? "Cancel edit" : "Discard All"}</button><button type="submit" className={styles.primary} disabled={busy}><CheckCircle2 size={16} />{busy ? "Please wait…" : editingId ? "Update menu item" : "Confirm and Save to Menu"}</button></div></div>
        </form>
        <section className={styles.card} aria-busy={busy}>
          <div className={styles.sectionHeading}><div><h2>Saved Menu</h2><p>Manage the dishes available for your kitchen’s daily service.</p></div><div className={styles.actions}><button type="button" disabled={busy} onClick={() => { setBusy(true); setError(""); void load().finally(() => setBusy(false)); }}><RefreshCw size={16} />Refresh</button><button type="button" className={styles.primary} disabled={busy} onClick={() => { clearDraft(); document.getElementById("menu-review-table")?.scrollIntoView({ behavior: "smooth" }); }}><Plus size={16} />Add Dish</button></div></div>
          <div className={styles.filters}><label className={styles.search}><Search size={16} /><input aria-label="Search dishes" placeholder="Search dishes…" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} /></label><select aria-label="Filter by category" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}><option value="all">All categories</option>{MENU_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}</select><select aria-label="Sort dishes" value={sortOrder} onChange={(event) => setSortOrder(event.target.value)}><option value="name">Name: A–Z</option><option value="price">Price: low to high</option></select></div>
          <div className={styles.tableScroll}><table className={styles.table}><thead><tr><th>#</th><th>Dish name</th><th>Category</th><th>Price (₹)</th><th>Actions</th></tr></thead><tbody>{filteredSaved.map((item, index) => <tr key={item.id}><td>{index + 1}</td><td className={styles.dish}>{item.name}</td><td><span className={styles.badge}>{item.category}</span></td><td>₹{Number(item.price).toFixed(2)}</td><td><div className={styles.actions}><button type="button" disabled={busy} aria-label={`Edit ${item.name}`} onClick={() => { setExcludedRows(new Set()); startEditSavedItem(item); }}><Edit3 size={15} />Edit</button><button type="button" disabled={busy} aria-label={`Delete ${item.name}`} onClick={() => void removeSavedItem(item.id)}><Trash2 size={15} /></button></div></td></tr>)}{!filteredSaved.length && <tr><td colSpan={5} className={styles.empty}>{busy ? "Loading your menu…" : saved.length ? "No dishes match your search or category." : "No saved dishes yet. Upload a menu or add your first dish manually."}</td></tr>}</tbody></table></div><div className={styles.caption}>{filteredSaved.length} of {saved.length} saved dishes</div>
        </section>
      </div>
      <OcrMenuImportModal isOpen={isOcrOpen} initialTab={ocrTab} onClose={() => { setIsOcrOpen(false); setActiveOcrPhoto(null); }} onConfirmDishes={handleOcrDirectConfirm} onLoadToDraft={handleOcrLoadToDraft} existingCatalog={saved} initialFile={activeOcrPhoto} />
    </WorkspaceShell>
  );
};
