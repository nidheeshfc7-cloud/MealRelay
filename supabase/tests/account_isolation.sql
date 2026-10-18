-- Run in Supabase SQL Editor as the database administrator.
-- Requires the supplied test account plus one other registered account.
-- Creates temporary fixtures only. ROLLBACK removes all test changes.
begin;
do $$
declare a uuid; b uuid;
begin
  select id into a from auth.users where email = 'nidheeshfc7@gmail.com';
  select id into b from auth.users where id <> a order by created_at limit 1;
  if a is null or b is null then
    raise exception 'Two registered test accounts are required before running this check.';
  end if;
  perform set_config('mealrelay.test_a',a::text,true);
  perform set_config('mealrelay.test_b',b::text,true);
  perform set_config('mealrelay.menu_a',gen_random_uuid()::text,true);
  perform set_config('mealrelay.menu_b',gen_random_uuid()::text,true);
  perform set_config('mealrelay.log_a',gen_random_uuid()::text,true);
end $$;
set local role authenticated;
do $$
begin
  perform set_config('request.jwt.claim.sub',current_setting('mealrelay.test_a'),true);
  insert into public.account_menu_items(id,name,category,price)
    values(current_setting('mealrelay.menu_a')::uuid,'Rollback isolation test A','main',1);
  insert into public.account_activity_logs(id,menu_item_id,service_date,meal_service,prepared,served,leftover,attendance)
    values(current_setting('mealrelay.log_a')::uuid,current_setting('mealrelay.menu_a')::uuid,current_date,'lunch',10,8,2,10);
end $$;
do $$
declare n integer;
begin
  perform set_config('request.jwt.claim.sub',current_setting('mealrelay.test_b'),true);
  insert into public.account_menu_items(id,name,category,price)
    values(current_setting('mealrelay.menu_b')::uuid,'Rollback isolation test B','main',1);
  if exists(select 1 from public.account_menu_items where id=current_setting('mealrelay.menu_a')::uuid)
    or exists(select 1 from public.account_activity_logs where id=current_setting('mealrelay.log_a')::uuid) then
    raise exception 'FAIL: another account can read fixtures';
  end if;
  update public.account_menu_items set price=2 where id=current_setting('mealrelay.menu_a')::uuid;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: cross-account menu update'; end if;
  update public.account_activity_logs set notes='unauthorized' where id=current_setting('mealrelay.log_a')::uuid;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: cross-account activity update'; end if;
  delete from public.account_activity_logs where id=current_setting('mealrelay.log_a')::uuid;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: cross-account activity deletion'; end if;
  delete from public.account_menu_items where id=current_setting('mealrelay.menu_a')::uuid;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: cross-account menu deletion'; end if;
  begin
    insert into public.account_menu_items(owner_id,name,category,price)
      values(current_setting('mealrelay.test_a')::uuid,'Forged owner test','main',1);
    raise exception 'FAIL: forged menu ownership accepted';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.account_activity_logs(owner_id,menu_item_id,service_date,meal_service,prepared,served,leftover,attendance)
      values(current_setting('mealrelay.test_a')::uuid,current_setting('mealrelay.menu_a')::uuid,current_date,'lunch',1,1,0,1);
    raise exception 'FAIL: forged log ownership accepted';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.account_menu_items set owner_id=current_setting('mealrelay.test_a')::uuid
      where id=current_setting('mealrelay.menu_b')::uuid;
    raise exception 'FAIL: owner reassignment accepted';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.account_activity_logs(menu_item_id,service_date,meal_service,prepared,served,leftover,attendance)
      values(current_setting('mealrelay.menu_a')::uuid,current_date,'lunch',1,1,0,1);
    raise exception 'FAIL: activity accepted a different account menu';
  exception when foreign_key_violation then null;
  end;
  update public.account_menu_items set price=2 where id=current_setting('mealrelay.menu_b')::uuid;
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'FAIL: owner cannot edit own menu'; end if;
end $$;
reset role;
set local role anon;
do $$
begin
  perform set_config('request.jwt.claim.sub','',true);
  begin
    perform 1 from public.account_menu_items limit 1;
    raise exception 'FAIL: anonymous menu reads allowed';
  exception when insufficient_privilege then null;
  end;
  begin
    perform 1 from public.account_activity_logs limit 1;
    raise exception 'FAIL: anonymous activity reads allowed';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;
set local role authenticated;
do $$
declare n integer;
begin
  perform set_config('request.jwt.claim.sub',current_setting('mealrelay.test_a'),true);
  if not exists(select 1 from public.account_activity_logs where id=current_setting('mealrelay.log_a')::uuid and notes='') then
    raise exception 'FAIL: owner fixture changed or hidden';
  end if;
  delete from public.account_activity_logs where id=current_setting('mealrelay.log_a')::uuid;
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'FAIL: owner cannot delete own activity'; end if;
  delete from public.account_menu_items where id=current_setting('mealrelay.menu_a')::uuid;
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'FAIL: owner cannot delete own menu'; end if;
end $$;
reset role;
select 'PASS: account isolation, ownership checks and anonymous denial; test changes rolled back' as result;
rollback;
