# 🥗 MealRelay — Monorepo Architecture & Setup Guide

Welcome to the **MealRelay** monorepo! This workspace hosts both the Next.js web application and the Expo React Native mobile application, alongside shared core packages.

---

## ⚡ Quick Start for Developers

From this directory (`MealRelay/`):

### 1. Install All Dependencies
```bash
npm install
```
*Installs dependencies for all workspaces (`apps/*` and `packages/*`) in one step.*

### 2. Run the Applications

#### Option A: Web Platform (Next.js 15)
```bash
npm run dev:web
# or
npm run dev
```
- **Local:** [http://localhost:3000](http://localhost:3000)
- **Local Network (Phone / Tablet Browser):** `http://<YOUR_LAN_IP>:3000` (e.g. `http://192.168.1.15:3000`)

#### Option B: Mobile Platform (Expo SDK 57)
```bash
npm run dev:mobile
```
- **Physical Phone:** Install **Expo Go** ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) / [iOS](https://apps.apple.com/app/expo-go/id982107779)), connect to the same Wi-Fi, and scan the QR code.
- **Android Emulator:** Press `a` in the terminal.
- **iOS Simulator (Mac):** Press `i` in the terminal.
- **Web Browser:** Press `w` in the terminal.

#### Option C: Simultaneous Development (Two Terminals)
- **Terminal 1:** `npm run dev:web`
- **Terminal 2:** `npm run dev:mobile`

---

## 🏗️ Monorepo Structure

```text
MealRelay/
├── apps/
│   ├── web/                    # Next.js 15 App Router, React 19, Tailwind CSS
│   └── mobile/                 # React Native Expo SDK 57 (Android & iOS)
├── packages/
│   ├── core/                   # Shared pure forecasting logic & business calculations
│   ├── types/                  # Shared TypeScript domain models & schemas
│   ├── api/                    # Shared API interfaces, in-memory demo adapter, & PostgreSQL RLS schema
│   └── config/                 # Shared brand design tokens & platform settings
├── package.json                # Root npm workspaces script runner
└── README.md                   # This monorepo guide
```

---

## 🧩 Shared Packages vs Applications

| Domain | Shared Package | Web Platform (`apps/web`) | Mobile Platform (`apps/mobile`) |
| :--- | :--- | :--- | :--- |
| **Portion Math & Calculations** | `@mealrelay/core` | Imported directly | Imported directly |
| **Domain Models & Types** | `@mealrelay/types` | Unified TypeScript types | Unified TypeScript types |
| **Brand Palette & Tokens** | `@mealrelay/config` | Tailwind color extensions | React Native style constants |
| **API Client Interface** | `@mealrelay/api` | Demo adapter + Supabase ready | Demo adapter + AsyncStorage cache |
| **User Interface & Layout** | *Platform-specific* | Desktop responsive layout, header & sidebar | Native touch tabs, gesture sliders, native video player |

---

## 📜 Available Scripts

| Command | Action |
| :--- | :--- |
| `npm run dev` | Alias for `npm run dev:web` |
| `npm run dev:web` | Starts Next.js on `0.0.0.0:3000` |
| `npm run dev:mobile` | Starts Expo dev server for React Native |
| `npm run build:web` | Builds production bundle for Next.js web app |
| `npm run build:all` | Builds all packages and web platform |
| `npm run typecheck` | Type-checks all 5 workspaces (`types`, `core`, `api`, `web`, `mobile`) |

---

## 🗄️ Database & Supabase Integration (Optional)

The database schema and multi-tenant Row-Level Security (RLS) policies are defined in:
`packages/api/schema.sql`

1. Create a Supabase project at [supabase.com](https://supabase.com).
2. Paste `packages/api/schema.sql` into the **SQL Editor** and run it.
3. Add your credentials to `apps/web/.env.local`:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```
*(Note: MealRelay works 100% in demo mode out-of-the-box without Supabase!)*

---

## 🛠️ Common Troubleshooting

- **Port in use:** `npm --workspace=@mealrelay/web run dev -- -p 3001`
- **Expo tunnel mode (for restricted Wi-Fi):** `cd apps/mobile && npx expo start --tunnel`
- **Typecheck validation:** `npm run typecheck`
