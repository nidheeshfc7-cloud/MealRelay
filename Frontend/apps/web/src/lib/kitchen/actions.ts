"use server";

import { revalidatePath } from "next/cache";
import { createAuthClient } from "@/lib/auth/server";
import { MENU_CATEGORIES, type MenuInput, type MenuItem, type ActivityInput, type ActivityLog, type KitchenResult } from "./types";

const uuid = (value: unknown): value is string => typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
const invalid = (error: string) => ({ ok: false as const, error });
const menuColumns = "id,name,category,price,created_at";
const logColumns = "id,menu_item_id,service_date,meal_service,prepared,served,leftover,attendance,notes,created_at";

async function account() {
  const client = await createAuthClient();
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) throw new Error("UNAUTHENTICATED");
  return { client, owner: data.user.id };
}
function failure(error: unknown) {
  if (error instanceof Error && error.message === "UNAUTHENTICATED") return invalid("Please sign in to manage your kitchen.");
  const code = error && typeof error === "object" && "code" in error ? error.code : null;
  return invalid(code === "42P01" || code === "PGRST205" ? "Kitchen storage is not set up. Apply the account kitchen records migration."
    : code === "23503" ? "This item is linked to activity logs, or is unavailable in your account."
    : "Unable to save or load kitchen records. Check database setup and retry.");
}
function validDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0,10) === value;
}
export async function listMenuItems(): Promise<KitchenResult<MenuItem[]>> {
  try {
    const { client, owner } = await account();
    const { data, error } = await client.from("account_menu_items").select(menuColumns).eq("owner_id", owner).order("created_at").limit(500);
    if (error) throw error;
    return { ok: true, data: data as MenuItem[] };
  } catch (error) { return failure(error); }
}
export async function saveMenuItems(items: MenuInput[], id?: string): Promise<KitchenResult<MenuItem[]>> {
  if (!Array.isArray(items) || !items.length || items.length > 200 || (id !== undefined && (!uuid(id) || items.length !== 1)))
    return invalid("Save between 1 and 200 items at a time.");
  if (items.some(item => !item || typeof item.name !== "string" || !item.name.trim() || item.name.trim().length > 100
    || !MENU_CATEGORIES.includes(item.category) || typeof item.price !== "number" || !Number.isFinite(item.price)
    || item.price <= 0 || item.price > 9999999999.99 || Math.abs(item.price * 100 - Math.round(item.price * 100)) > 0.0001))
    return invalid("Each item needs a name, supported category, and positive price with at most two decimal places.");
  try {
    const { client, owner } = await account();
    const rows = items.map(item => ({ owner_id: owner, name: item.name.trim(), category: item.category, price: item.price }));
    const query = id ? client.from("account_menu_items").update(rows[0]).eq("id",id).eq("owner_id",owner) : client.from("account_menu_items").insert(rows);
    const { data, error } = await query.select(menuColumns);
    if (error) throw error;
    if (id && !data.length) return invalid("Menu item not found in your account.");
    revalidatePath("/menu");
    return { ok: true, data: data as MenuItem[] };
  } catch (error) { return failure(error); }
}
export async function deleteMenuItem(id: string): Promise<KitchenResult<null>> {
  if (!uuid(id)) return invalid("Choose a valid menu item.");
  try {
    const { client, owner } = await account();
    const { data, error } = await client.from("account_menu_items").delete().eq("id",id).eq("owner_id",owner).select("id");
    if (error) throw error;
    if (!data.length) return invalid("Menu item not found in your account.");
    revalidatePath("/menu");
    return { ok: true, data: null };
  } catch (error) { return failure(error); }
}
export async function listActivityLogs(date?: string, offset = 0): Promise<KitchenResult<ActivityLog[]>> {
  if ((date !== undefined && !validDate(date)) || !Number.isSafeInteger(offset) || offset < 0) return invalid("Choose a valid date and page.");
  try {
    const { client, owner } = await account();
    let query = client.from("account_activity_logs").select(logColumns).eq("owner_id",owner);
    if (date) query = query.eq("service_date",date);
    const { data, error } = await query.order("service_date",{ ascending:false }).order("id").range(offset,offset+99);
    if (error) throw error;
    return { ok: true, data: data as ActivityLog[] };
  } catch (error) { return failure(error); }
}
export async function saveActivityLog(input: ActivityInput, id?: string): Promise<KitchenResult<ActivityLog>> {
  if (!input || !uuid(input.menu_item_id) || (id !== undefined && !uuid(id)) || !validDate(input.service_date)
    || !["breakfast","lunch","dinner"].includes(input.meal_service)
    || [input.prepared,input.served,input.leftover,input.attendance].some(n=>!Number.isSafeInteger(n)||n<0||n>2147483647)
    || input.prepared !== input.served + input.leftover || typeof input.notes !== "string" || input.notes.length > 2000)
    return invalid("Use nonnegative whole quantities. Prepared must equal served plus leftover. Include a valid menu item, date and service.");
  try {
    const { client, owner } = await account();
    // Copy allowed fields only; never trust owner IDs or arbitrary properties from forms.
    const row = { owner_id:owner, menu_item_id:input.menu_item_id, service_date:input.service_date, meal_service:input.meal_service,
      prepared:input.prepared, served:input.served, leftover:input.leftover, attendance:input.attendance, notes:input.notes.trim() };
    const query = id ? client.from("account_activity_logs").update(row).eq("id",id).eq("owner_id",owner) : client.from("account_activity_logs").insert(row);
    const { data,error } = await query.select(logColumns).maybeSingle();
    if (error) throw error;
    if (!data) return invalid("Log not found in your account.");
    revalidatePath("/records");
    revalidatePath("/dashboard");
    return { ok:true, data:data as ActivityLog };
  } catch (error) { return failure(error); }
}
export async function deleteActivityLog(id: string): Promise<KitchenResult<null>> {
  if (!uuid(id)) return invalid("Choose a valid activity log.");
  try {
    const {client,owner} = await account();
    const {data,error} = await client.from("account_activity_logs").delete().eq("owner_id",owner).eq("id",id).select("id");
    if(error) throw error;
    if(!data.length) return invalid("Log not found in your account.");
    revalidatePath("/records");
    revalidatePath("/dashboard");
    return {ok:true,data:null};
  } catch(error) { return failure(error); }
}

