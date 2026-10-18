# MealRelay kitchen-record integration

## Implemented locally
- `/menu`: review up to 200 menu rows per save, edit/delete persisted items, category and price validation.
- Menu photo selection, preview and removal (10 files maximum, 10 MB each). Photos remain local. No OCR provider is configured; manual entry is explicit.
- `/records`: add/edit/delete daily activity, date filtering, 100-row pages.
- Prepared = served + leftover; nonnegative integer portions and attendance.
- Protected layouts and middleware; ownership is derived server-side from verified Supabase Auth.
- Account-specific dashboard saved-record summary and navigation. Existing forecasts remain separate and illustrative.

## Database deployment — applied by the user and verified through the app
The user applied `supabase/migrations/202610180001_account_kitchen_records.sql` in the SQL Editor. Real authenticated app actions verified the tables are usable.
This adds account_menu_items and account_activity_logs without changing existing organizations, kitchens or records.
This MVP gives each authenticated user a single private workspace. Organization display metadata does not grant access.
Shared-team membership is not implemented.
The composite foreign key prevents a log referencing another account's menu item.
RLS and explicit authenticated-only CRUD grants follow [Supabase's RLS guidance](https://supabase.com/docs/guides/database/postgres/row-level-security).
Ensure public is an exposed Data API schema; no anon CRUD grant is needed.
No service-role key is used by these actions.

The plugin MCP connection remains unavailable, so database administration cannot be inspected directly here. Application access with the configured public key and verified user session works.
Forms show an honest storage-setup error if the tables are missing in another environment.
Live menu/log CRUD, anonymous denial and ownership-spoofing rejection have been verified. Direct read/update/delete attempts from a second authenticated account remain unverified.
Before publishing, verify two accounts cannot select/update/delete each other's rows or insert another owner_id, and cannot attach a log to another account's menu.

## Frontend API
Import from `@/lib/kitchen/actions`:
- listMenuItems()
- saveMenuItems(items, optionalExistingItemId)
- deleteMenuItem(id)
- listActivityLogs(optionalISODate, optionalOffset)
- saveActivityLog(input, optionalExistingLogId)
- deleteActivityLog(id)

Every action returns `{ ok: true, data }` or `{ ok: false, error }`.
Types live in `src/lib/kitchen/types.ts`; category values reuse the existing FastAPI contract.
Menu amounts are numeric prices in the restaurant's chosen currency; currency configuration is not implemented.
Use pagination for activity logs; the menu list currently supports 500 saved items.

## Authentication
Confirmed accounts sign in directly; confirmation is required only once for new accounts when enabled.
Set AUTH_SITE_URL to the real application origin.
In Supabase Authentication → URL Configuration:
- Local Site URL: http://localhost:3000
- Allowed redirect: http://localhost:3000/auth/callback
- Add the exact deployment callback when hosting. Do not use 0.0.0.0 as a browser origin.
Keep email confirmation enabled. Invalid confirmation links show a login error.
Environment: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or legacy ANON_KEY), AUTH_SITE_URL.
NEXT_PUBLIC_API_URL continues to configure the existing demonstration forecasting engine.

## Remaining limitations
- New signup/email delivery and a fresh successful callback require a new email confirmation flow; no new mailbox was created in this check.
- Private logs are not fed into the old shared FastAPI singleton/model. Its legacy records endpoints are not private account storage and remain outside these new RLS-backed workflows.
- Dashboard Log Outcomes now navigates to account-owned Daily Activity. Shared FastAPI POST /records and /records/batch return HTTP 410; shared GET /records returns synthetic rows only.
- Deploy/restart the FastAPI service to activate the retired shared-write endpoints; an already-running process may still serve the old code. Private activity must use the new Supabase-backed actions.
- No OCR, permanent photo storage, team sharing, or per-account model training is claimed.
- Browser rendering at desktop/mobile widths remains to be checked in an available browser environment.


## Actual verification results
- Targeted TypeScript check: passed.
- Isolated Next.js production build including lint/type validation: passed.
- App server actions: sample account login, intended destination and logout passed; HTTP-only cookies created and cleared.
- Authenticated dashboard/menu/records responses: HTTP 200 and correct account email.
- Anonymous menu/records responses: HTTP 307 to localhost login.
- Server-side rejection passed for negative prices, invalid categories, invalid date and inconsistent quantities.
- Initial listMenuItems check reported missing tables; after the user applied the migration, live CRUD passed.

## Shared record boundary regression checks
- Targeted backend regressions: 3 passed (shared single/batch writes denied before storage access; private rows omitted from shared reads).
- TypeScript after dashboard navigation change: passed.

- Complete backend suite after updating the intentionally retired shared-write contract: 39 passed.
- Supabase management connector remains unavailable. Live app CRUD is now verified; full two-account isolation verification remains pending.

## Live verification after SQL Editor deployment
- Authenticated menu creation, price/category/name editing and fresh reload passed.
- Activity creation, editing and date-filtered reload passed.
- Deleting a menu referenced by activity was rejected.
- Activity and menu deletions passed; all temporary verification rows were removed.
- Public anonymous SELECT on both tables was denied (42501).
- Direct public-key requests with a verified user JWT could not insert another owner_id, reassign an existing menu owner, or forge activity ownership (42501).
- No administrative/service-role key was used.
- Full second-account read/update/delete checks, fresh email confirmation and browser viewport checks remain unverified.

## Final account-isolation verification
Run supabase/tests/account_isolation.sql in SQL Editor with at least two registered accounts. It checks cross-account SELECT/UPDATE/DELETE denial for both tables, spoofed ownership, menu/log ownership consistency, anonymous denial and allowed owner operations. It uses temporary fixtures and rolls back all changes. This script has been prepared but has NOT been run here because administrative MCP SQL is unavailable.
