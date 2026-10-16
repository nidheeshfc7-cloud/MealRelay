Here’s a smaller `AGENTS.md` focused only on the context Antigravity must consistently follow while building the MealRelay MVP.

# MealRelay — AGENTS.md

## 1. Project Context

**MealRelay:** Predict Tomorrow. Prepare Smarter. Waste Less.

MealRelay forecasts next-day food demand for hostel kitchens and recommends preparation quantities to reduce avoidable food waste while minimizing shortages.

**Primary SDG:** 12 — Responsible Consumption and Production.\
**Supporting SDGs:** 2 — Zero Hunger; 13 — Climate Action.

## 2. Target Audience

- **Primary users:** Kitchen managers and mess supervisors.
- **Target customers:** Privately operated hostels and third-party hostel operators.
- **Potential buyers:** Hostel owners and operators seeking better food-cost control.
- **Secondary segment:** College canteens.

Private and third-party hostel operators are the initial market hypothesis, not yet validated customers.

## 3. MVP Workflow

1. Enter historical meal records, including prepared, served, and leftover quantities.
2. Provide expected attendance, planned dishes, and relevant events.
3. Forecast next-day demand for each dish.
4. Recommend preparation quantities using a configurable safety buffer.
5. Explain important factors behind recommendations.
6. Let managers review, edit, and confirm the plan.
7. Compare predictions against actual outcomes.

Prevent avoidable surplus before cooking. Never automatically enforce preparation recommendations.

## 4. Technology Stack

- **Frontend:** Next.js, React, TypeScript.
- **Styling:** Tailwind CSS and shadcn/ui.
- **Backend:** Python with FastAPI.
- **ML:** scikit-learn, using Random Forest Regression.
- **Database:** Supabase PostgreSQL.
- **Deployment:** Vercel for Next.js; suitable Python hosting for FastAPI.

**MVP scope:** Build a web application using Next.js. Do not use React Native now. React Native is a possible future direction for a dedicated mobile application.

**Authentication:** Not required for the MVP. Keep the architecture extensible for future authentication and multi-tenant access.

## 5. ML Approach

**Inputs:** Historical dish demand, attendance, weekday, menu, and relevant holidays or events.

**Output:** Predicted portions needed per dish for the following day.

Apply a configurable safety buffer to generate recommended preparation quantities.

Compare Random Forest against a historical-average baseline. Use transparent fallbacks when data is insufficient. Clearly label synthetic data and illustrative predictions. Never claim unverified accuracy or waste reduction.

## 6. Core MVP Screens

- Dashboard — tomorrow's plan, key forecasts, and important insights.
- Meal Records — prepared, served, and leftover quantities.
- Menu Management — dishes and planned menus.
- Forecasts — predicted demand and recommended quantities.
- Reports — forecast accuracy and waste trends.
- Settings — kitchen configuration and safety buffer.

Prioritize a functional preparation workflow over extra features.

## 7. Visual Design & Brand Identity

Follow the official MealRelay design system and tokens consistently:

### Color Palette
- **Forest Green (Primary Brand):**
  - DEFAULT: `#003F2F`
  - Dark: `#002F24`
  - Mid: `#143928`
  - Light: `#245C40`
- **Electric Lime (Signature Accent):**
  - DEFAULT: `#D5FB53`
  - Soft: `#E6FCA8`
- **Canvas & Surface:**
  - Canvas: `#F6F7F1` (warm off-white page background)
  - Ivory Pure: `#FFFFFF` (card surfaces)
  - Sage: `#EDF2E7` (soft pill badges & subtle fills)
- **Ink (Typography):**
  - Primary: `#172A21` (deep forest ink for high contrast)
  - Secondary: `#718078` (muted slate ink)
  - Muted: `#8B9C92`
- **Lines & Borders:**
  - Light: `#E5EBE1` (clean borders on canvas)
  - Dark: `#123D2E` (subtle dividers on forest background)
  - Dark Glass: `rgba(255, 255, 255, 0.10)` (`border-white/10`)

### CinematicIntro Color Exception (Intentional — DO NOT ALTER)
- The rapid-cut cinematic introduction (`frontend/apps/web/src/components/CinematicIntro.tsx`) intentionally features high-energy, eclectic colors (including `#EF693C` Burnt Orange, `#245BFF` Vibrant Cobalt, `#080A09` Near Black, `#D5FB53` Electric Lime, and `#003F2F` Forest Green) to deliver high visual momentum and punchy brand impact.
- **Never modify, homogenize, or strip down the colors in `CinematicIntro.tsx` during future color refactors or palette consolidations.** Its vibrant multi-color sequence is deliberately designed this way on purpose.

### Brand Logo & Typography
- **Font Family:** `Inter, system-ui, sans-serif`. Use heavy/black weights (`font-black`, `font-extrabold`) for editorial headlines and clean semibold weights for data/controls.
- **Brand Mark:** A `-rotate-6` rounded square emblem in Electric Lime (`#D5FB53`) or Forest Green with a Lucide `Leaf` icon (`stroke-[2.5]`).
- **Wordmark:** `mealrelay.` in lowercase bold, with the trailing period highlighted in Electric Lime (`.` on dark) or Forest Green (`.` on light). Supports an `iconOnly` prop when collapsed.

### Surface & Component Language
- High-contrast editorial aesthetic combining light canvas views (`bg-canvas text-ink`) with moody dark-green operational blocks (`bg-forest text-white`).
- Generous card radiuses: `rounded-2xl` for internal widgets/cards, `rounded-3xl` for high-level feature sections.
- Pill badges for buffer and status indicators (`bg-lime/20 text-lime border border-lime/30` or `bg-sage text-forest`).

## 8. Awwwards-Tier Animation & Interaction Principles

To maintain a polished, award-winning feel, follow these animation standards across all interactive components:

1. **Luxury Easing Curves**:
   - Use the Apple/Awwwards ease-out exponential curve: `cubic-bezier(0.16, 1, 0.3, 1)` rather than standard linear or generic `ease-in-out`.
   - Standard transitions: `duration-300` for structural layout and drawer/sidebar expansion; `duration-150` to `duration-200` for micro-interactions (hover, active scale).

2. **Fixed Geometric Padding (Zero Lateral Wobble)**:
   - When components expand or collapse (e.g., sidebars, drawers, accordions), keep container horizontal padding constant (e.g., `px-3.5`).
   - Never animate padding simultaneously with width. Changing padding causes icons to drift and wobble laterally.

3. **Masked Overflow Reveals Over Jarring DOM Swaps**:
   - Avoid abruptly unmounting/mounting text elements with React ternaries during animated transitions.
   - Keep items in the DOM and use masked container unveils: `overflow-hidden`, `max-w-0` to `max-w-[Npx]`, `opacity-0` to `opacity-100`, and `translate-x-[-8px]` to `translate-x-0`.

4. **Aspect Ratio Protection on Circular Elements**:
   - Always enforce `aspect-square`, `shrink-0`, and exact dimensions on circular elements (user avatars, badges, indicator dots):
     `w-10 h-10 min-w-[40px] min-h-[40px] aspect-square rounded-full shrink-0`.
   - This prevents flexbox or grid stretching from distorting circles into ovals/ellipses during animation.

5. **Desktop Collapsible Sidebar Standards**:
   - **Default/Unpinned Behavior:** Collapses to an ultra-minimalist icon-only rail (`w-[72px]`). Expands to full width (`w-[260px]`) on hover (`onMouseEnter`), and collapses back on mouse leave (`onMouseLeave`).
   - **Sticky Pin Button:** A `<Pin />` toggle button on the top right allows users to lock the sidebar open permanently. When unpinned, it resumes hover-on/hover-off behavior. State persists in `localStorage` (`mealrelay_sidebar_pinned`).
   - **Clean Account Divider:** The user profile footer must sit directly on the sidebar's natural background with a subtle top divider (`border-t border-white/10`)—avoid heavy dark box wrappers (`bg-forest-dark/40`).
   - **Fluid Flex Reflow:** Sidebars must be in-flow flex items next to `<main className="flex-1">`, smoothly pushing and resizing adjacent content in real-time.

6. **Strict Sidebar Preservation Rule (Do NOT Mess With Sidebar in Dashboard or Any Screen):**
   - The user currently very much likes the sidebar: **DO NOT mess with the sidebar in the dashboard or any other screen**.
   - The desktop and mobile sidebar styling, colors, luxury easing curves, fixed geometric padding (`px-3.5`), header logo mark, facility status widget, user profile footer, and hover/pinned interaction mechanics must NEVER be altered, redesigned, or broken during dashboard or page refactors.
   - When restructuring dashboard workflows or navigation, only the navigation items array (`NAV_ITEMS` labels, icons, and target routes) may be streamlined or re-routed to avoid unnecessary tabs. The visual shell, Tailwind classes, and interaction mechanics of `Sidebar.tsx` must remain completely untouched.

## 9. Responsive Design

- Optimize desktop layouts for 16:9 screens without forcing a fixed aspect ratio.
- Ensure full usability on tablets and mobile browsers with dedicated drawer navigation.
- Prevent overflow, clipping, and overlapping elements.
- Adapt tables, navigation, and controls to smaller screens.
- Keep all essential workflows functional across screen sizes.

## 10. Development Rules

- Inspect the existing codebase before making changes.
- Build reusable components and maintain clear frontend/backend separation.
- Validate inputs and handle errors, loading states, and empty states properly.
- Never expose secrets or service credentials in client-side code.
- Do not invent customer data, pilot results, savings, or model accuracy.
- Commit message convention: Inspect previous git commit records and strictly follow the established sequential two-digit numbered prefix format (e.g., `01: initial commit`, `02: fixed something`, `03: ...`). After completing each successful step, make a commit following this exact format.
- Keep this document focused on persistent MVP requirements. Put detailed architecture, tasks, database schemas, APIs, and implementation phases in `PLAN.md`.

**Core principle:** Build a reliable, explainable, minimal meal-planning web app first. Future mobile apps and production-scale features are outside the current MVP scope.
