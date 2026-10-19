"use client";
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { listMenuItems, saveMenuItems, deleteMenuItem } from "@/lib/kitchen/actions";
import { MENU_CATEGORIES, type MenuInput, type MenuItem } from "@/lib/kitchen/types";
import { WorkspaceShell } from "./WorkspaceShell";
import { OcrMenuImportModal } from "./OcrMenuImportModal";

const blank = (): MenuInput => ({ name:"", category:"main", price:0 });
const control = "w-full min-w-0 rounded-xl border border-line-light bg-white p-3 text-base";
const button = "rounded-xl bg-forest text-lime px-4 py-3 font-semibold disabled:opacity-50";
type Photo = { name:string; url:string };
function PhotoPreview({ file, remove }: { file:File; remove:()=>void }) {
  const [photo,setPhoto] = useState<Photo|null>(null);
  useEffect(()=>{const url=URL.createObjectURL(file);setPhoto({name:file.name,url});return()=>URL.revokeObjectURL(url);},[file]);
  return <figure className="rounded-xl border border-line-light bg-white p-3 min-w-0">
    {photo && <img src={photo.url} alt={"Menu photo: "+photo.name} className="w-full h-40 object-contain" />}
    <figcaption className="text-sm break-words mt-2">{file.name}</figcaption>
    <button type="button" className="text-forest font-semibold py-3" onClick={remove}>Remove photo</button>
  </figure>;
}
export function MenuWorkspace() {
  const [saved,setSaved] = useState<MenuItem[]>([]);
  const [draft,setDraft] = useState<MenuInput[]>([blank()]);
  const [editing,setEditing] = useState<string>();
  const [photos,setPhotos] = useState<File[]>([]);
  const [busy,setBusy] = useState(true);
  const [message,setMessage] = useState("");
  const [error,setError] = useState("");
  const [isOcrOpen,setIsOcrOpen] = useState(false);
  async function load() {try {const result=await listMenuItems();if(result.ok){setSaved(result.data);return true;}setError(result.error);} catch {setError("Unable to reach the server. Please refresh to retry.");}return false;}
  useEffect(()=>{void load().finally(()=>setBusy(false));},[]);
  function change(index:number,key:keyof MenuInput,value:string) {
    setDraft(rows=>rows.map((row,i)=>i===index?{...row,[key]:key==="price"?Number(value):value}:row));
  }
  async function save(event:React.FormEvent) {
    event.preventDefault(); setBusy(true);setError("");setMessage("");
    try {const result=await saveMenuItems(draft,editing);if(!result.ok){setError(result.error);return;}setDraft([blank()]);setEditing(undefined);await load();setMessage("Menu saved to your account.");}
    catch {setError("Unable to reach the server. Your draft is still available.");}
    finally {setBusy(false);}
  }
  const handleOcrConfirm = async (extracted: Array<{ name: string; category: MenuInput["category"]; price: number }>) => {
    setBusy(true); setError(""); setMessage("");
    try {
      const result = await saveMenuItems(extracted);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      await load();
      setMessage(`Successfully imported ${extracted.length} dish${extracted.length === 1 ? "" : "es"} using OCR.`);
    } catch {
      setError("Unable to reach the server. Please retry.");
    } finally {
      setBusy(false);
    }
  };
  async function remove(id:string) {
    if(!confirm("Delete this menu item? Items used in activity logs cannot be deleted."))return;
    setBusy(true);setError("");setMessage("");
    try{const result=await deleteMenuItem(id);if(result.ok){await load();setMessage("Menu item deleted.");}else setError(result.error);}
    catch{setError("Unable to reach the server.");}finally{setBusy(false);}
  }
  return <WorkspaceShell title="Menu management" description="Review your dishes and prices, then save a menu belonging to your account.">
    {message && <p role="status" className="p-4 bg-sage rounded-xl text-forest">{message}</p>}
    {error && <p role="alert" className="p-4 bg-red-50 text-red-800 rounded-xl">{error}</p>}
    <section className="rounded-2xl bg-white border border-line-light p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Menu photographs &amp; OCR import</h2>
          <p className="text-ink-secondary text-sm">
            Upload whiteboard photos, weekly cycle sheets, or paper menus to automatically extract dishes and prices.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsOcrOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-forest text-lime px-4 py-3 font-bold hover:bg-forest-dark transition-all shadow-sm"
        >
          <Sparkles size={16} />
          <span>Launch OCR Digitizer</span>
        </button>
      </div>

      <label className="block font-semibold">Choose menu photos
        <input className="block mt-2 max-w-full" type="file" multiple accept="image/png,image/jpeg,image/webp" onChange={event=>{
          const incoming=Array.from(event.target.files||[]);
          if(incoming.some(file=>!["image/png","image/jpeg","image/webp"].includes(file.type)||file.size>10*1024*1024)||photos.length+incoming.length>10){setError("Choose up to 10 PNG, JPEG or WebP photos, each under 10 MB.");return;}
          setPhotos(items=>[...items,...incoming]);event.target.value="";
        }}/>
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">{photos.map((file,i)=><PhotoPreview key={file.name+file.lastModified+i} file={file} remove={()=>setPhotos(items=>items.filter((_,j)=>i!==j))}/>)}</div>
      <div className="flex flex-wrap gap-3">
        <button type="button" className={button} onClick={() => setIsOcrOpen(true)}>
          <span className="flex items-center gap-2">
            <Sparkles size={15} />
            <span>Scan Menu Photos with OCR</span>
          </span>
        </button>
        {photos.length > 0 && (
          <button type="button" className="px-4 py-3 font-semibold text-ink-secondary hover:text-ink" onClick={()=>setMessage("Use the photographs above to enter or adjust your menu items below.")}>
            Use photos for manual entry
          </button>
        )}
      </div>
    </section>
    <OcrMenuImportModal
      isOpen={isOcrOpen}
      onClose={() => setIsOcrOpen(false)}
      onConfirmDishes={handleOcrConfirm}
      existingCatalog={saved}
    />
    <form onSubmit={save} className="rounded-2xl bg-white border border-line-light p-5 space-y-4">
      <h2 className="text-xl font-bold">{editing?"Edit menu item":"Review and confirm menu"}</h2>
      <p className="text-sm text-ink-secondary">Prices use your restaurant's currency. Up to 200 items can be confirmed together.</p>
      {draft.map((row,i)=><fieldset key={i} className="grid grid-cols-1 sm:grid-cols-12 gap-3 border border-line-light rounded-xl p-3">
        <legend className="text-sm font-semibold px-2">Item {i+1}</legend>
        <label className="sm:col-span-5 text-sm font-semibold">Item name<input required maxLength={100} className={control} value={row.name} onChange={e=>change(i,"name",e.target.value)}/></label>
        <label className="sm:col-span-3 text-sm font-semibold">Category<select className={control} value={row.category} onChange={e=>change(i,"category",e.target.value)}>{MENU_CATEGORIES.map(category=><option key={category}>{category}</option>)}</select></label>
        <label className="sm:col-span-2 text-sm font-semibold">Price<input required type="number" min="0.01" max="9999999999.99" step="0.01" className={control} value={row.price||""} onChange={e=>change(i,"price",e.target.value)}/></label>
        <button type="button" className="sm:col-span-2 text-forest font-semibold self-end py-3 disabled:opacity-50" disabled={draft.length===1||busy} onClick={()=>setDraft(rows=>rows.filter((_,j)=>i!==j))}>Remove</button>
      </fieldset>)}
      <div className="flex flex-wrap gap-3">
        {!editing && <button type="button" className="rounded-xl border border-line-light px-4 py-3 font-semibold" disabled={busy||draft.length>=200} onClick={()=>setDraft(rows=>[...rows,blank()])}>Add item</button>}
        <button type="submit" className={button} disabled={busy}>{busy?"Saving / loading…":"Confirm and save menu"}</button>
        {editing && <button type="button" disabled={busy} onClick={()=>{setEditing(undefined);setDraft([blank()]);}} className="px-4 py-3">Cancel edit</button>}
      </div>
    </form>
    <section className="rounded-2xl bg-white border border-line-light p-5 space-y-4" aria-busy={busy}>
      <div className="flex items-center justify-between gap-3"><h2 className="text-xl font-bold">Saved menu ({saved.length})</h2><button type="button" disabled={busy} className="py-3 text-forest font-semibold" onClick={()=>{setBusy(true);setError("");void load().finally(()=>setBusy(false));}}>Refresh</button></div>
      {!saved.length && !busy && <p className="text-ink-secondary">No saved items yet. Confirm your menu above to get started.</p>}
      <ul className="divide-y divide-line-light">{saved.map(item=><li key={item.id} className="flex flex-wrap items-center gap-3 py-3">
        <div className="flex-1 min-w-0"><p className="font-semibold break-words">{item.name}</p><p className="text-sm text-ink-secondary">{item.category} · {Number(item.price).toFixed(2)}</p></div>
        <button disabled={busy} className="px-3 py-3 text-forest font-semibold" onClick={()=>{setEditing(item.id);setDraft([{name:item.name,category:item.category,price:Number(item.price)}]);setMessage("Editing "+item.name+". Review the form above.");}}>Edit</button>
        <button disabled={busy} className="px-3 py-3 text-red-800 font-semibold" onClick={()=>void remove(item.id)}>Delete</button>
      </li>)}</ul>
    </section>
  </WorkspaceShell>;
}
