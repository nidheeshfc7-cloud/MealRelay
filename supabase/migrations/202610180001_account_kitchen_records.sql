-- Single-owner restaurant workspace MVP. Existing organization/kitchen tables are untouched.
begin;
create table public.account_menu_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 100),
  category text not null check (category in ('main','curry','rice','bread','side','beverage','dessert')),
  price numeric(12,2) not null check (price > 0),
  created_at timestamptz not null default now(),
  unique (owner_id, id)
);
create index account_menu_owner_idx on public.account_menu_items(owner_id, created_at);
create table public.account_activity_logs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  menu_item_id uuid not null,
  service_date date not null,
  meal_service text not null check (meal_service in ('breakfast','lunch','dinner')),
  prepared integer not null check (prepared >= 0),
  served integer not null check (served >= 0),
  leftover integer not null check (leftover >= 0),
  attendance integer not null check (attendance >= 0),
  notes text not null default '' check (length(notes) <= 2000),
  created_at timestamptz not null default now(),
  constraint consistent_portions check (prepared = served + leftover),
  foreign key (owner_id, menu_item_id) references public.account_menu_items(owner_id, id) on delete restrict
);
create index account_logs_owner_date_idx on public.account_activity_logs(owner_id, service_date desc, id);
alter table public.account_menu_items enable row level security;
alter table public.account_activity_logs enable row level security;
revoke all on public.account_menu_items, public.account_activity_logs from anon, authenticated;
grant select, insert, update, delete on public.account_menu_items, public.account_activity_logs to authenticated;
create policy menu_select on public.account_menu_items for select to authenticated using (owner_id = (select auth.uid()));
create policy menu_insert on public.account_menu_items for insert to authenticated with check (owner_id = (select auth.uid()));
create policy menu_update on public.account_menu_items for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy menu_delete on public.account_menu_items for delete to authenticated using (owner_id = (select auth.uid()));
create policy logs_select on public.account_activity_logs for select to authenticated using (owner_id = (select auth.uid()));
create policy logs_insert on public.account_activity_logs for insert to authenticated with check (owner_id = (select auth.uid()));
create policy logs_update on public.account_activity_logs for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy logs_delete on public.account_activity_logs for delete to authenticated using (owner_id = (select auth.uid()));
commit;

