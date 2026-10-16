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
- [🧠 Machine Learning & Forecasting Backend (Python + FastAPI)](#-machine-learning--forecasting-backend-python--fastapi)
- [💻 Running the Web Application](#-running-the-web-application)
- [📱 Running the Mobile Application](#-running-the-mobile-application)
- [🔄 Developing Web, Mobile, and Backend Concurrently](#-developing-web-mobile-and-backend-concurrently)
- [🧩 Monorepo Packages](#-monorepo-packages)
- [📜 Complete Scripts Cheatsheet](#-complete-scripts-cheatsheet)
- [🗄️ Database & Production Architecture](#️-database--production-architecture)
- [🛠️ Troubleshooting & FAQs](#️-troubleshooting--faqs)
- [🤝 Git & Branching Workflow](#-git--branching-workflow)

---

## ⚡ Quick Start (Copy & Paste)

### 1. Launch the Frontend (Web Platform on http://localhost:3000)
```bash
# Enter the Frontend monorepo directory
cd MealRelay/Frontend

# Install workspace dependencies
npm install

# Launch Web application
npm run dev:web
```

### 2. Launch the Machine Learning Backend (FastAPI on http://localhost:8000)
```bash
# Open a second terminal and navigate to backend
cd MealRelay/backend

# Synchronize dependencies with uv
uv sync

# Launch the FastAPI server with auto-reload
uv run uvicorn src.api.main:app --reload --port 8000
```

> **Note:** MealRelay comes with an **in-memory high-fidelity demo adapter** (`@mealrelay/api`) for the frontend and an **in-memory auto-trained Random Forest ML service** for the backend. No database setup, no API keys, and no `.env` file are needed to run the full application locally!

---

## 📦 Prerequisites

Ensure you have the following installed on your development machine:

| Requirement | Minimum Version | Recommended Version | Download Link |
| :--- | :--- | :--- | :--- |
| **Node.js** | `v18.17.0+` | `v20.x` or `v22.x` (LTS) | [nodejs.org](https://nodejs.org/) |
| **npm** | `v9.x+` | `v10.x+` | Included with Node.js |
| **Python** | `3.10+` | `3.13` | [python.org](https://python.org/) |
| **uv** (Package Manager) | `0.5+` | Latest | [docs.astral.sh/uv](https://docs.astral.sh/uv/) |
| **Git** | `v2.x+` | Latest | [git-scm.com](https://git-scm.com/) |
| **Expo Go** (Optional for Mobile) | Latest | Latest | [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent) / [App Store](https://apps.apple.com/app/expo-go/id982107779) |

Verify your environment by running:
```bash
node -v
npm -v
python --version
uv --version
git --version
```

---

## 🏗️ Repository Architecture

MealRelay integrates a modern **TypeScript full-stack frontend monorepo** with a **Python machine learning microservice**:

```text
MealRelay/
├── Frontend/                       # Frontend monorepo root (Next.js 15 + Expo React Native)
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
├── backend/                        # High-Performance Python ML Forecasting Microservice
│   ├── src/
│   │   ├── schemas/                # Pydantic data contracts (dish, meal_record, forecast)
│   │   ├── data/                   # 60-day synthetic hostel dataset & feature preprocessor
│   │   ├── models/                 # RandomForestRegressor & HistoricalAverageBaseline models
│   │   ├── services/               # Recommendation safety buffer math & orchestration
│   │   └── api/                    # FastAPI REST server & routing endpoints (/api/forecast, /api/records)
│   │
│   ├── tests/                      # Pytest suite (22 unit & integration tests)
│   ├── pyproject.toml              # Dependencies managed by uv (scikit-learn, pandas, fastapi)
│   ├── PLAN.md                     # Completed backend implementation plan
│   └── README.md                   # In-depth backend architecture and ML specification
│
├── agents.md                       # Antigravity project rules, conventions, and design tokens
├── PLAN.md                         # Master product specification & UX workflow plan
└── README.md                       # Master repository documentation (this file)
```

---

## 🧠 Machine Learning & Forecasting Backend (Python + FastAPI)

The backend (`backend/`) is a dedicated machine learning forecasting engine engineered with **Python 3.13**, **scikit-learn**, and **FastAPI**, managed deterministically via **`uv`**.

### 1. What Is Actually Accomplished:
- **Trained Dual Forecasting Engine**: Combines a tuned `RandomForestRegressor` (learning non-linear interactions across dish types, day-of-week attendance patterns, and 7-day lagged consumption) with an empirical `HistoricalAverageBaseline` benchmark.
- **Measurable +12.6% Accuracy Improvement**: In chronological holdout evaluation over unseen future days (45-day train / 15-day test), Random Forest achieves a **Mean Absolute Error (MAE) of 5.64 portions vs. 6.45 portions for the historical average**.
- **Transparent Sparse-Data Fallback**: When a dish has $< 5$ historical logs, the model refuses to fabricate predictions; it transparently falls back to a 3-tier moving average and alerts the kitchen manager.
- **Safety Buffer Formulation**: Applies ceiling rounding ($\lceil \text{Prediction} \times (1 + \text{buffer}) \rceil$) with a configurable $+10\%$ margin to prevent shortages.
- **Grounded Explainability**: Every recommendation includes plain-language operational factors (student turnout ratio, weekday effect, and recent rolling momentum).

### 2. Inputs & Outputs Overview:
- **Input (`POST /api/forecast`)**: Takes target date, meal session (`breakfast`, `lunch`, `dinner`), expected attendance headcount, planned dishes, and optional safety buffer percentage.
- **Output (`ForecastResponse`)**: Returns predicted demand portions, recommended cooking count (with safety buffer), model applied (`random_forest` vs `baseline_fallback`), and factor explanations.
- **Interactive Documentation**: Interactive OpenAPI Swagger docs available at `http://localhost:8000/docs`.

### 3. Backend Quickstart:
```bash
cd backend
uv sync                                      # Install dependencies into .venv
uv run pytest                                # Run all 22 automated unit & integration tests
uv run python -m src.models.evaluation       # Run chronological holdout benchmark table
uv run uvicorn src.api.main:app --reload --port 8000   # Launch FastAPI server
```

For full details, JSON payloads, and mathematical formulas, see [backend/README.md](backend/README.md).

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

## 🗄️ Database & Production Architecture

### 1. In-Memory Demo Adapter (Active by Default on Frontend)
The frontend works immediately out-of-the-box using `@mealrelay/api`'s `DemoMealRelayApiClient`. You can test, adjust portions, and simulate kitchen approvals with zero database setup.

### 2. Live Python ML Forecasting Microservice (Fully Implemented & Operational)
The Python machine learning service is fully implemented under `backend/`:
- **Frameworks**: FastAPI, scikit-learn, pandas, numpy, pydantic, uvicorn.
- **Model**: `RandomForestRegressor` with `ColumnTransformer` feature pipeline.
- **Benchmark**: Evaluated via chronological holdout validation achieving **5.64 MAE (+12.6% improvement over baseline)**.
- **Quality**: 22 automated unit and integration tests passing (`uv run pytest`).
- **Endpoints**: `POST /api/forecast`, `GET /api/metrics`, `GET/POST /api/records`, `GET /api/dishes`, `GET /health`.

### 3. Supabase PostgreSQL (Ready for Cloud Deployment)
A complete, production-ready PostgreSQL schema with Row-Level Security (RLS) is located at:
📁 `Frontend/packages/api/schema.sql`

To connect to a live Supabase project:
1. Create a free project at [supabase.com](https://supabase.com).
2. Run the SQL script from `Frontend/packages/api/schema.sql` in the Supabase SQL Editor.
3. Create `Frontend/apps/web/.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   NEXT_PUBLIC_BACKEND_API_URL=http://localhost:8000
   ```

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
