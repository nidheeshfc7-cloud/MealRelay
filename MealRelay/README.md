# MealRelay — Enterprise Food Intelligence & Kitchen Forecasting

MealRelay is a professional cross-platform product architecture delivering high-precision demand forecasting, meal prep planning, and closed-loop waste intelligence for institutional dining operations.

---

## Monorepo Architecture

```
MealRelay/
├── apps/
│   ├── web/                    # Next.js 14 App Router, TypeScript, Tailwind CSS
│   └── mobile/                 # React Native Expo SDK 57 application (Android / iOS)
├── packages/
│   ├── core/                   # Shared pure forecasting logic & business calculations
│   ├── types/                  # Shared TypeScript domain models & schemas
│   ├── api/                    # Shared API interfaces, demo adapter, & PostgreSQL RLS schema
│   └── config/                 # Shared brand design tokens & platform settings
├── package.json                # Root npm workspaces script runner
└── README.md                   # System documentation
```

---

## Quick Start: Simultaneous Development

### 1. Install Dependencies
From the `MealRelay/` root directory:
```bash
npm install
```

### 2. Launch the Web Platform
Starts Next.js on `localhost:3000` (bound to `0.0.0.0` for local-network access):
```bash
npm run dev:web
```
* **Local Laptop URL:** [http://localhost:3000](http://localhost:3000)
* **Mobile Phone Web Access:** `http://<YOUR_LAN_IP>:3000` (e.g. `http://192.168.1.15:3000`)

### 3. Launch the Mobile Application (Expo Go)
Starts the Expo development server:
```bash
npm run dev:mobile
```
* **Android / iOS:** Open Expo Go on your mobile phone, ensure you are on the same Wi-Fi network, and scan the QR code printed in the terminal.

---

## Shared vs Platform-Specific Code

| Domain | Shared Package | Web Platform (`apps/web`) | Mobile Platform (`apps/mobile`) |
| :--- | :--- | :--- | :--- |
| **Portion Math & Calculations** | `@mealrelay/core` | Imported directly | Imported directly |
| **Domain Models & Types** | `@mealrelay/types` | Unified TypeScript types | Unified TypeScript types |
| **Brand Palette & Tokens** | `@mealrelay/config` | Tailwind color extensions | React Native style constants |
| **API Client Interface** | `@mealrelay/api` | Demo adapter + Supabase ready | Demo adapter + AsyncStorage cache |
| **User Interface & Layout** | *Platform-specific* | Multi-column desktop layout & responsive web drawer | Native Safe-Area screens, touchable tabs, native video player |

---

## Database & Backend Integration (Supabase PostgreSQL)

The database schema and multi-tenant Row-Level Security (RLS) policies are defined in:
[`packages/api/schema.sql`](file:///c:/Users/nidheesh/Desktop/PROJECT%20FILES/mobile%20application%20testing/MealRelay/packages/api/schema.sql)

### Supabase Setup Steps
1. Create a Supabase project at [supabase.com](https://supabase.com).
2. Paste the contents of `packages/api/schema.sql` into the **SQL Editor** and run it.
3. Configure your environment variables in `apps/web/.env.local`:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```
4. Data remains strictly scoped per organization via `auth.uid()` and `org_id` foreign keys.
