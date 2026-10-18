# MealRelay checklist audit — 18 October 2026

Tested revision: 3d757d0. This was an audit, not a declaration that every requested feature is complete.

Legend:
- PASS: exercised against the running app/provider, or explicitly marked as source/build evidence.
- PARTIAL: implemented or partially supported, but the full requested behavior was not verified.
- MISSING: the requested feature is absent.

## 1. Authentication
| Checklist item | Result | Evidence / limit |
|---|---|---|
| User signup works | PARTIAL | Signup UI/server action and invalid-input rejection verified. A fresh account plus its confirmation email were not tested; only the supplied existing account was used. |
| User login works | PASS | Existing confirmed account signed in; incorrect password rejected; external next destination rejected. |
| Logout and session persistence work | PASS for current-device logout and HTTP reload persistence | Persistent HttpOnly cookie issued; repeated authenticated page requests succeeded; logout cleared the session and subsequent dashboard access redirected to login. Browser close/reopen and all-device logout were not exercised. |
| UI matches minimalist theme | PARTIAL: source review | Existing forest/lime/ivory styles and shared auth card reused. Actual desktop/mobile appearance was not visually tested. |

## 2. Menu management
| Checklist item | Result | Evidence / limit |
|---|---|---|
| Dedicated menu page | PASS | Authenticated /menu returned HTTP 200 and correct account identity. |
| Upload multiple menu photos | PARTIAL | Multiple local files can be selected, previewed and removed according to source. Limit: 10 images, 10 MB each. There is no server upload or permanent photo storage. Browser file-picker interaction was not exercised. |
| Manually add items | PASS | Real 80-item batch created and reloaded. |
| Extract items from photos | MISSING | No OCR/vision extraction implementation or configured provider. UI explicitly offers manual entry. |
| Show extracted items in editable table | MISSING | No extracted data pipeline. Editable manual field rows exist; there is no extracted-item table. |
| Validate/correct extracted details | PARTIAL | Manual name/category/price edits passed; blank names, unsupported category, negative price, excessive precision and over-limit batches were rejected. Extraction-specific review is absent. |
| Store name, category, price | PASS | Live creation, editing and fresh reload verified all three fields. |
| Reuse backend/TypeScript item types | PASS: source/type check | Menu category type is derived from existing DishCatalogItem; meal service uses shared MealServiceKey; category values match the FastAPI enum. |
| Save confirmed menu | PASS | Real Supabase persistence verified. Saved item deletion and linked-item protection also passed. |

## 3. Restaurant logs
| Checklist item | Result | Evidence / limit |
|---|---|---|
| Dedicated daily logs page | PASS | /records returned HTTP 200 with correct account identity. |
| Record dishes ordered/prepared | PASS for dishes and prepared/served quantities | A saved dish was linked to an activity log and quantities were edited. A separate ordered-quantity field is not implemented. |
| Attendance/diners served | PASS | Attendance saved, edited and reloaded. It is per log/dish, not a deduplicated daily diner total. |
| Leftover quantities | PASS | Leftover quantity saved/edited/reloaded; negative and inconsistent counts rejected. |
| Save/view daily logs | PASS | Create/edit/reload/date filtering/delete passed against the live database. |

## 4. Existing features and quality
| Checklist item | Result | Evidence / limit |
|---|---|---|
| Preserve friend's dashboard | PASS for source preservation; browser regression pending | Compared against ce56448: existing MetricCards, DishPreparationTable, KeyInsightsPanel, EditQuantitiesModal and DashboardActionBar are unchanged. Main layout/cards remain; header identity/date, saved-record summary and secure activity navigation were intentionally updated. |
| Services tab functional | PASS | Services & Activity navigation points to /records; its route and live activity actions passed. This is a workflow link, not a separate service-configuration editor. |
| Clean/minimal/professional UI | PARTIAL: source review | Existing branding, scoped auth styles and responsive grid classes are used. No browser-based visual or keyboard/touch audit was available. |
| Avoid unnecessary complexity | PASS: code/dependency review | Existing Next.js/Supabase architecture reused; components separated by function; no OCR/vision or other new application dependency added for these workflows. |

## Fresh automated results
- Targeted TypeScript: passed.
- Isolated Next.js production build, lint/type validation and all 18 pages: passed.
- Full backend pytest suite: 39 passed.
- Live app audit: 15 passing check groups, including 80-item menu CRUD, log CRUD/date filtering, validation, route protection and logout.
- Live forecasting health: HTTP 200, models ready.
- Live forecasting request: HTTP 200 with recommendations.
- Analytics totals, empty totals, CSV escaping and formula neutralization: passed.
- Anonymous database reads on both private tables: denied.
- Forged owner insertion and owner reassignment: denied.
- Temporary menu/log fixtures: completely removed.

## What could not be completed or verified here
1. Automatic menu-photo extraction: not implemented.
2. Real server-side photo upload/permanent storage: not implemented; local previews only.
3. Extracted-item table and extraction correction workflow: not implemented.
4. Fresh signup, confirmation email delivery and password-reset email delivery: require a controlled inbox and completing the email flow. Invalid signup input was tested, not a full new signup.
5. Cross-account read/update/delete isolation: requires a second registered account; ownership-spoof and anonymous checks do not prove the full two-account case.
6. Desktop/tablet/mobile visual rendering, actual upload interactions, CSV download clicks, keyboard/touch interactions and browser-restart persistence: no browser-control tool available in this session.
7. All-device logout: not exercised because it would revoke the user's other device sessions.
8. Distinct ordered quantities, team sharing, scheduled email notifications, permanent plan history and private-log model training remain outside the implemented workflows.

## Verification artifact repaired
supabase/tests/account_isolation.sql had been replaced with pasted PostgreSQL error text.
The error was preserved in a temporary backup, and the committed rollback-only SQL test was restored.
It still requires two registered accounts. It has not been run successfully here.

## Relevant commands
From Frontend/apps/web:
- node ../../node_modules/typescript/bin/tsc --noEmit --incremental false
- node ../../node_modules/next/dist/bin/next build <isolated-web-copy>

From repository root:
- backend/.venv/Scripts/python.exe -m pytest backend/tests -q

No new user account, password change, all-device logout, or real user-record overwrite was performed during this audit.
