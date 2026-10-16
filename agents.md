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

## 7. Visual Design

Use this exact palette consistently:

- **Background:** `#0f1012`
- **Primary text:** `#f2f2ef`
- **Secondary text:** `#8f949b`
- **Accent:** `#f07734`

Keep the UI minimal, professional, and high-contrast. Reserve orange for primary actions and important highlights. Use grey for secondary information.

- Maximum three font families; preferably one.
- Maintain consistent typography, spacing, components, borders, and icon styles.
- Use subtle, purposeful animations.
- Avoid excessive colors, gradients, charts, and decorative elements.

## 8. Responsive Design

- Optimize desktop layouts for 16:9 screens without forcing a fixed aspect ratio.
- Ensure full usability on tablets and mobile browsers.
- Prevent overflow, clipping, and overlapping elements.
- Adapt tables, navigation, and controls to smaller screens.
- Keep all essential workflows functional across screen sizes.

## 9. Development Rules

- Inspect the existing codebase before making changes.
- Build reusable components and maintain clear frontend/backend separation.
- Validate inputs and handle errors, loading states, and empty states properly.
- Never expose secrets or service credentials in client-side code.
- Do not invent customer data, pilot results, savings, or model accuracy.
- Keep this document focused on persistent MVP requirements. Put detailed architecture, tasks, database schemas, APIs, and implementation phases in `PLAN.md`.

**Core principle:** Build a reliable, explainable, minimal meal-planning web app first. Future mobile apps and production-scale features are outside the current MVP scope.
