# MealRelay — OCR Menu & Records Import Plan (`OCR-PLAN.md`)

## Executive Summary
This feature enables hostel and canteen supervisors to digitize printed, handwritten, or whiteboard menus and daily kitchen records by uploading photos directly in the browser. 

Using **client-side Tesseract.js in a Web Worker**, text is extracted on the user's device without any external paid APIs or backend server load (protecting free-tier hosting limits). Images undergo canvas-based contrast enhancement and orientation correction. A deterministic parsing engine categorizes dishes (main, curry, rice, bread, etc.), extracts prices, and detects portion metrics. Users inspect and edit the extracted data in an interactive staging interface with ambiguity highlights before committing confirmed items to Supabase via existing Server Actions (`saveMenuItems`, `saveActivityLog`).

---

## Commit Convention Rule
Before making a commit at the end of any phase, inspect the git history (`git log -n 5 --oneline`) to verify the latest sequential integer prefix. Every commit must strictly follow the repository convention: `<next_number>: <concise description>` (e.g., `105: install tesseract.js and setup ocr dependencies`). Never duplicate or skip prefix numbers.

---

## Phased Implementation Checklist

### Phase 1: Environment & Dependency Setup
- [x] Install `tesseract.js` in `@mealrelay/web` (`npm install tesseract.js`).
- [x] Configure Next.js dynamic client import to guarantee zero SSR issues.
- [x] Verify build and type compatibility with existing React 19 / Next.js 15 stack.
- **Commit:** Follow convention with next prefix (`<N>: install tesseract.js and setup ocr dependencies`)

### Phase 2: Preprocessing & OCR Extraction Engine
- [x] Create `frontend/apps/web/src/lib/ocr/preprocess.ts`:
  - Canvas downscaling (max 2000px dimension) for speed.
  - EXIF / 90-degree manual rotation controls.
  - Contrast filters: Auto-Adaptive, High-Contrast B&W (for whiteboards), Natural.
- [x] Create `frontend/apps/web/src/lib/ocr/engine.ts`:
  - Dynamic client-only Tesseract Web Worker runner (`eng` language pack).
  - Real-time progress streaming (`recognizing text: XX%`).
  - 30-second watchdog timeout and error recovery.
- [x] Create `frontend/apps/web/src/lib/ocr/parser.ts`:
  - Dish name cleanup and price regex extractor (`₹`, `Rs.`, `/-`).
  - Indian mess category classifier (rice, bread, curry, main, side, beverage, dessert).
  - Fuzzy duplicate matcher against existing saved catalog (`account_menu_items`).
  - Kitchen register log parser (dates, shift, prepared, served, leftover, attendance).
  - Word-level confidence scoring (<65% flagged for review).
- **Commit:** Follow convention with next prefix (`<N>: implement ocr preprocessing engine and parser`)

### Phase 3: Interactive Staging & Review UI
- [x] Create `frontend/apps/web/src/components/kitchen/OcrMenuImportModal.tsx`:
  - Drag-and-drop dropzone supporting PNG, JPEG, WebP.
  - Image preview bar with 90° rotation, filter presets, and crop tools.
  - Animated progress bar with percentage and stage status.
  - Side-by-side or stacked review grid with inline editable fields (Name, Category, Price).
  - Low-confidence word highlighting and duplicate dish badges.
  - Bulk actions toolbar: Select All, Set Category, Apply Price, Remove Noise.
  - Direct paste fallback tab (parses raw text from WhatsApp/email menus).
  - Validation banner for missing required fields.
- **Commit:** Follow convention with next prefix (`<N>: add interactive ocr review modal and staging grid`)

### Phase 4: Menu & Kitchen Workspace Integration
- [x] Update `frontend/apps/web/src/components/kitchen/MenuWorkspace.tsx`:
  - Replace static "OCR is not configured" placeholder with "Scan Menu Photo (OCR)" button.
  - Wire confirmed dishes into verified Server Action `saveMenuItems`.
  - Add instant catalog refresh and success toast notifications.
- [x] Update `frontend/apps/web/src/components/kitchen/ActivityWorkspace.tsx`:
  - Add OCR register import trigger to populate daily activity logs.
- **Commit:** Follow convention with next prefix (`<N>: integrate ocr import into menu and activity workspaces`)

### Phase 5: Verification & Quality Assurance
- [ ] Test end-to-end flow with sample whiteboard photo, printed rate sheet, and raw text.
- [ ] Test edge cases: blurry images, large files (>10MB), network failure recovery.
- [ ] Verify Supabase database persistence in `account_menu_items` and `account_activity_logs`.
- [ ] Run `npm run typecheck` and `npm run build` to verify zero lint or bundle errors.
- **Commit:** Follow convention with next prefix (`<N>: complete ocr menu import end-to-end verification`)
