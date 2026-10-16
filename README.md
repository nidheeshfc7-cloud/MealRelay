<div align="center">

# 🥗 MealRelay
### Enterprise Food Intelligence & Kitchen Demand Forecasting

*Predict Tomorrow. Prepare Smarter. Waste Less.*

[![Next.js](https://img.shields.io/badge/Next.js-15.0-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Expo](https://img.shields.io/badge/Expo-SDK_57-000020?style=for-the-badge&logo=expo)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

<br/>

**MealRelay** is a cross-platform food intelligence system engineered for hostel messes, campus dining halls, and institutional kitchens. It forecasts portion demand for upcoming services, recommends preparation quantities with a configurable safety buffer, and tracks waste reduction metrics in real time.

</div>

---

## 📑 Table of Contents

- [⚡ Quick Start (Copy & Paste)](#-quick-start-copy--paste)
- [📦 Prerequisites](#-prerequisites)
- [🏗️ Repository Architecture](#️-repository-architecture)
- [💻 Running the Web Application](#-running-the-web-application)
- [📱 Running the Mobile Application](#-running-the-mobile-application)
- [🔄 Developing Web and Mobile Concurrently](#-developing-web-and-mobile-concurrently)
- [🧩 Monorepo Packages](#-monorepo-packages)
- [📜 Complete Scripts Cheatsheet](#-complete-scripts-cheatsheet)
- [🗄️ Database & Backend Plan](#️-database--backend-plan)
- [🛠️ Troubleshooting & FAQs](#️-troubleshooting--faqs)
- [🤝 Git & Branching Workflow](#-git--branching-workflow)

---

## ⚡ Quick Start (Copy & Paste)

Get both Web and Mobile running on your machine in under 2 minutes:

```bash
# 1. Clone the repository
git clone https://github.com/nidheeshfc7-cloud/MealRelay.git

# 2. Enter the Frontend monorepo directory
cd MealRelay/Frontend

# 3. Install all workspace dependencies (one command for all packages and apps)
npm install

# 4. Launch the Web platform (opens on http://localhost:3000)
npm run dev:web

# --- OR ---

# 5. Launch the Mobile app (starts Expo Metro bundler)
npm run dev:mobile
```

> **Note:** MealRelay comes with an **in-memory high-fidelity demo adapter** (`@mealrelay/api`). No database setup, no API keys, and no `.env` file are needed to run the full application locally!

---

## 📦 Prerequisites

Ensure you have the following installed on your development machine:

| Requirement | Minimum Version | Recommended Version | Download Link |
| :--- | :--- | :--- | :--- |
| **Node.js** | `v18.17.0+` | `v20.x` or `v22.x` (LTS) | [nodejs.org](https://nodejs.org/) |
| **npm** | `v9.x+` | `v10.x+` | Included with Node.js |
| **Git** | `v2.x+` | Latest | [git-scm.com](https://git-scm.com/) |
| **Expo Go** (Optional for Mobile) | Latest | Latest | [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent) / [App Store](https://apps.apple.com/app/expo-go/id982107779) |

Verify your environment by running:
```bash
node -v
npm -v
git --version
```

---

## 🏗️ Repository Architecture

The project is structured as an npm workspaces monorepo:

```text
MealRelay/
├── Frontend/                       # Frontend monorepo root (where npm install is run)
│   ├── apps/
│   │   ├── web/                    # Next.js 15 (App Router), React 19, Tailwind CSS
│   │   └── mobile/                 # React Native, Expo SDK 57, Expo Video
│   │
│   ├── packages/
│   │   ├── core/                   # Pure business logic: portion math, safety buffers, waste formulas
│   │   ├── types/                  # Shared TypeScript interfaces & domain schemas
│   │   ├── api/                    # Client interface, in-memory demo adapter, Supabase schema
│   │   └── config/                 # Brand palette tokens & cross-platform design constants
│   │
│   ├── package.json                # Root npm workspaces runner & scripts
│   └── README.md                   # Monorepo-specific docs
│
├── backend/
│   └── PLAN.md                     # Technical roadmap for FastAPI + scikit-learn ML service
│
├── agents.md                       # Antigravity project rules & design constraints
├── PLAN.md                         # Product specification & UX workflow plan
└── README.md                       # Repository master documentation (this file)
```

---

## 💻 Running the Web Application

The web interface is tailored for kitchen managers, dining directors, and supervisors on laptops or tablets.

### 1. Start the Dev Server
From `Frontend`:
```bash
npm run dev:web
```
*(Alternatively, from inside `Frontend/apps/web`: `npm run dev`)*

### 2. Open in Browser
- **Local Machine:** [http://localhost:3000](http://localhost:3000)
- **Local Network / Phone Browser:** `http://<YOUR_LAN_IP>:3000` (e.g. `http://192.168.1.15:3000`)

### 3. Available Web Routes
| Route | Description |
| :--- | :--- |
| `/` | **Cinematic Video Intro** — High-impact brand video with immediate "Skip Intro" option |
| `/dashboard` | **Kitchen Command Center** — Tomorrow's meal service cards, portion counters, approval switch, quick stats |
| `/planner` | **Preparation Planner** — Interactive portion modifier (+/- steppers), safety buffer slider (0-15%), breakdown calculation |
| `/forecasts` | **Demand Forecasting** — Machine learning vs baseline comparisons, weather adjustments, confidence scores |
| `/analytics` | **Waste Intelligence** — Avoidable waste prevented (kg), leftover rates, 7-day volume trends |
| `/onboarding` | **Setup Wizard** — Step-by-step kitchen onboarding workflow |
| `/settings` | **Kitchen Parameters** — Default buffer percentage, dining service hours, meal configuration |

---

## 📱 Running the Mobile Application

The mobile app is built with **React Native** and **Expo SDK 57**, featuring bottom-tab navigation, native touch gestures, smooth animations, and video onboarding.

### 1. Start Expo
From `Frontend`:
```bash
npm run dev:mobile
```
*(Alternatively, from inside `Frontend/apps/mobile`: `npm start`)*

### 2. Choose How to View the App

#### Option A: On Your Physical Phone (Recommended & Fastest)
1. Install **Expo Go** on your device:
   - [Android (Google Play)](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - [iOS (App Store)](https://apps.apple.com/app/expo-go/id982107779)
2. Ensure your phone and laptop are connected to the **same Wi-Fi network**.
3. Scan the QR code shown in your terminal:
   - **Android:** Scan using the Expo Go app.
   - **iOS:** Scan using the native Camera app, then tap the prompt to open in Expo Go.

#### Option B: Android Emulator / iOS Simulator
- In the active terminal where Expo is running:
  - Press `a` to open in an Android Emulator.
  - Press `i` to open in an iOS Simulator (macOS only).

#### Option C: Web Browser Preview
- In the active terminal where Expo is running:
  - Press `w` to open the mobile layout in your browser.

---

## 🔄 Developing Web and Mobile Concurrently

Because MealRelay uses an integrated monorepo, you can run both the Web platform and the Mobile app simultaneously:

```bash
# Terminal 1 (Web Platform)
cd Frontend
npm run dev:web

# Terminal 2 (Mobile App)
cd Frontend
npm run dev:mobile
```

Any modification to shared logic in `packages/core/` or `packages/types/` will instantly hot-reload in both apps!

---

## 🧩 Monorepo Packages

| Package | Workspace Name | Purpose |
| :--- | :--- | :--- |
| **`packages/core`** | `@mealrelay/core` | Pure, framework-agnostic algorithms: portion safety buffer math (`calculateBuffer`), waste reduction estimation (`calculateWasteReduction`), and demand calculation. |
| **`packages/types`** | `@mealrelay/types` | Unified TypeScript definitions (`DemandForecast`, `PreparationPlan`, `MealServiceConfig`, `KitchenMetrics`). |
| **`packages/config`** | `@mealrelay/config` | Brand design tokens (colors, palettes, safe margins, and shared constants). |
| **`packages/api`** | `@mealrelay/api` | API contract interface, in-memory `DemoMealRelayApiClient` for offline demoing, and PostgreSQL RLS schema. |

---

## 📜 Complete Scripts Cheatsheet

Run all commands from the `Frontend/` root:

```bash
# Development
npm run dev              # Alias for npm run dev:web
npm run dev:web          # Starts Next.js web application (0.0.0.0:3000)
npm run dev:mobile       # Starts Expo development server for mobile

# Production Build
npm run build:web        # Compiles Next.js production bundle
npm run build:all        # Builds all web assets

# Quality & Type Checking
npm run typecheck        # Runs TypeScript type checking across all 5 workspaces
```

---

## 🗄️ Database & Backend Plan

### 1. In-Memory Demo Adapter (Active by Default)
The application works immediately out-of-the-box using `@mealrelay/api`'s `DemoMealRelayApiClient`. You can test, adjust portions, and simulate kitchen approvals with zero database setup.

### 2. Supabase PostgreSQL (Ready for Deployment)
A complete, production-ready PostgreSQL schema with Row-Level Security (RLS) is located at:
📁 `Frontend/packages/api/schema.sql`

To connect to a live Supabase project:
1. Create a free project at [supabase.com](https://supabase.com).
2. Run the SQL script from `Frontend/packages/api/schema.sql` in the Supabase SQL Editor.
3. Create `Frontend/apps/web/.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### 3. Python ML Microservice (FastAPI + scikit-learn)
A comprehensive technical specification for the planned Python demand forecasting service using Random Forest regression is documented in:
📄 `backend/PLAN.md`

---

## 🛠️ Troubleshooting & FAQs

### Q1: `npm install` fails or gives workspace errors
**Solution:** Make sure you are in the monorepo root (`Frontend`) where the root `package.json` with the `workspaces` field is located.
```bash
cd Frontend
npm install
```

### Q2: Port 3000 is already in use
**Solution:** Either kill the process on port 3000 or run Next.js on a different port:
```bash
# Run Next.js on port 3001
npm --workspace=@mealrelay/web run dev -- -p 3001
```

### Q3: Expo Go on my phone says "Could not connect to the server"
**Solutions:**
1. **Same Network:** Make sure your mobile phone and development machine are connected to the exact same Wi-Fi network.
2. **Firewall:** Ensure Windows Defender / macOS Firewall allows inbound connections to Node.js.
3. **Tunnel Mode:** If your Wi-Fi has client isolation (common on college/office Wi-Fi), use Expo's tunnel mode:
   ```bash
   cd Frontend/apps/mobile
   npx expo start --tunnel
   ```

### Q4: Windows PowerShell says "running scripts is disabled on this system"
**Solution:** Open PowerShell as Administrator or run:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

### Q5: How do I clear build caches?
```bash
# Clear Next.js cache
cd Frontend/apps/web
rm -rf .next

# Clear Expo Metro cache
cd Frontend/apps/mobile
npx expo start -c
```

---

## 🤝 Git & Branching Workflow

When collaborating on this repository:

1. **Pull the latest changes:**
   ```bash
   git pull origin frontend-branch
   ```
2. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Validate types before committing:**
   ```bash
   npm run typecheck
   ```
4. **Push and create a Pull Request:**
   ```bash
   git push -u origin feature/your-feature-name
   ```

---

<div align="center">
Built with 💚 for responsible dining operations & zero food waste.
</div>
