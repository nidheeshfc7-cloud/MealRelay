# MealRelay development changelog — Day 3 UI

## Branch and publication
Target: day-3-UI (the existing local branch). Its existing commits are preserved.
origin/main has separate teammate commits; this publication does not merge, modify or push main.
The existing development history is published as one dependency-complete checkpoint, followed by this changelog commit. Earlier stages are retained for inspection, not represented as independently complete releases.

## Actual commits, in chronological order
| Commit | Features and affected files | Verification scope |
|---|---|---|
| 4f70ac7 — 53: add Supabase authentication backend and integration contract | Phase 1: Supabase SSR clients, auth actions, callback, middleware, adapter, dependency lockfile and AUTH_INTEGRATION.md under Frontend/apps/web. | Foundation checkpoint. Earlier demo login UI was not yet connected; not a complete authentication UI release. |
| a054798 — 54: repair account identity and add private kitchen workflows | Phase 1/3/4: verified-user layouts/context, sidebar identity, menu/log pages and components, kitchen types/actions, ownership migration and integration notes. | Backend/CRUD foundation; depends on the later authentication UI integration for the complete user journey. |
| 073bf00 — 55: retire shared activity writes and use account-owned logging | Phase 4/5: shared FastAPI write retirement, synthetic-only reads, dashboard activity navigation and regression tests. | Regression tests cover denial before shared storage and private-row exclusion. |
| 6da4b2b — 56: verify live kitchen storage and prepare account isolation checks | Phase 3/4: menu refresh error handling, Services navigation, rollback-only SQL test and recorded live persistence verification. | Menu/log CRUD, anonymous denial and owner-spoof rejection verified against configured Supabase. Two-account test pending. |
| 3d757d0 — 57: finish account controls and real activity analytics | Phase 2/5: login/signup UI, sidebar/mobile logout, persistent profile settings, recovery/resend flows, real analytics/CSV, onboarding, current dates and honest demo labels. Files in src/components/auth, src/components/kitchen, src/lib/auth and corresponding app routes. | Complete implementation checkpoint; TypeScript/build, 39 backend tests and live auth/profile/menu/log checks passed. Email inbox delivery and browser visual checks remain manual. |
| 019f1ad — 58: document verified MVP checklist and remaining gaps | CHECKLIST_AUDIT.md: actual tested behavior and missing OCR/upload capabilities. | Fresh audit: 80-item menu batch, 15 live check groups, real forecasting response, TypeScript/build and 39 backend tests. |
| This changelog commit — 59: document verified Day 3 UI publication | DEVELOPMENT_CHANGELOG.md records the actual history, setup, checks and limitations. Its hash is available from git log; it cannot contain its own final hash. | Final publication is verified from a clean tracked-file snapshot. Earlier commits are not relabeled or rewritten as new phase commits. |

Requested phases overlap in the actual commits. Authentication UI was finalized after CRUD development; this existing order is preserved instead of fabricating an alternate history.

## Setup
Frontend:
1. Install dependencies from Frontend with npm ci.
2. Create Frontend/apps/web/.env.local locally using the tracked .env.example template.
3. Set NEXT_PUBLIC_SUPABASE_URL to the project root URL (without /rest/v1/).
4. Set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or legacy NEXT_PUBLIC_SUPABASE_ANON_KEY) and AUTH_SITE_URL.
5. Set NEXT_PUBLIC_API_URL for the FastAPI forecasting engine.
6. From Frontend, run npm --workspace @mealrelay/web run dev.

Backend:
1. From backend, run uv sync.
2. Run uv run uvicorn src.api.main:app --host 127.0.0.1 --port 8000.
3. Optional backend persistence/CORS settings are described in backend/.env.example.

Database:
- Apply supabase/migrations/202610180001_account_kitchen_records.sql only to environments where it has not already been applied.
- The current project was migrated through SQL Editor and live application CRUD passed.
- Configure Supabase Site URL and allowed auth callback URLs for the actual local/deployed origin.
- See Frontend/apps/web/AUTH_INTEGRATION.md and MVP_INTEGRATION.md.

## Verification before this publication
A clean git archive is used so local-only or generated files cannot mask missing tracked dependencies.
Installed dependencies and the configured local environment are supplied to that temporary snapshot solely for checks; neither is committed.
Checks:
- Next.js route type generation and targeted tsc --noEmit --incremental false.
- Full backend pytest suite.
- Next.js production build with lint/type validation.
- Credential/generated-file scan of the commits being published.

Final results (2026-10-18): route type generation passed; targeted TypeScript check passed; 39 backend tests passed; production build passed with 18 generated pages; outgoing history credential/generated-file scan passed. Build emitted webpack cache-size warnings only. Checks ran against tracked HEAD 019f1ad in a clean temporary snapshot. This commit changes documentation only.

## Remaining limitations
- Photo input provides local multi-image previews only; there is no server upload, permanent storage or OCR extraction.
- No extracted-item review table. Manual item review/edit/save works.
- Fresh signup/confirmation and recovery-email delivery need inbox verification.
- Two-account isolation test needs a second registered account.
- All-device logout, browser-restart persistence and desktop/mobile visual interaction need manual checks.
- No separate ordered-quantity field, team sharing, scheduled notifications or durable preparation-plan history.
- Private activity is not fed into the existing demonstration forecasting model.
- Main has separate teammate changes that are intentionally not overwritten by this branch.

## Preserved local-only files
Not included in this publication:
- The user's modified Frontend/apps/web/.env.example (contains project-specific values).
- Root AUTH_INTEGRATION.md (an outdated pre-integration draft; the current contract is under Frontend/apps/web).
- .agents/ and skills-lock.json (local skill installation artifacts).
- .env.local, virtual environments, node_modules, build outputs and caches.

## Teammate commands
Fetch and use the published branch:
    git fetch origin
    git switch day-3-UI
If no local copy exists:
    git switch --track origin/day-3-UI

Inspect a specific immutable checkpoint without changing a branch:
    git show 3d757d0 --stat
    git switch --detach 3d757d0
Return to the branch:
    git switch day-3-UI

Preserve any teammate working changes before switching checkouts.
