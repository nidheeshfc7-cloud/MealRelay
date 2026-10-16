# MealRelay — PLAN.md

> Product and execution plan for the **MVP web app only**. `AGENTS.md` contains the persistent project rules and design constraints.

## 1. Purpose

MealRelay helps hostel kitchens decide **how much of each dish to prepare for tomorrow**. It uses past meal records and expected attendance to forecast demand, suggest preparation quantities, and learn from actual outcomes.

The goal is to reduce **avoidable** food surplus and operating costs without increasing food shortages. MealRelay supports kitchen managers' decisions; it does not replace their judgement or guarantee zero waste.

## 2. Problem to Validate

Kitchen teams must plan portions before actual demand is known. Depending on intuition or inconsistent records can cause either over-preparation or shortages. Leftover tracking alone happens too late to prevent food from being cooked unnecessarily.

MealRelay focuses on prevention: use available records before preparation, show a useful recommendation, and compare it with what actually happened. The existence and scale of this problem must be validated with real kitchens rather than assumed.

## 3. Target Customer Hypothesis

**Initial focus:** privately operated hostels and third-party hostel operators.

- **Primary user:** kitchen manager or mess supervisor who plans meals and records outcomes.
- **Potential buyer:** hostel owner/operator who is responsible for food costs and daily operations.
- **Secondary segment:** campus canteens and college messes.

The initial hypothesis is that private and third-party operators may be able to make purchasing decisions faster than college administrations. This is not yet proven. Validate it through conversations with kitchen managers and owners.

### What to learn from customer discovery

Ask how portions are currently planned, how often surplus or shortages occur, what records are available, who approves spending, and whether a forecast would fit the kitchen's routine. Do not assume customers will pay until willingness to pay is tested.

## 4. What the MVP Must Do

The MVP should demonstrate one complete, understandable workflow:

1. Maintain a list of dishes and the meals they are planned for.
2. Enter past meal results: portions prepared, portions served, leftovers, and attendance where available.
3. Add tomorrow's planned dishes and expected attendance where known.
4. Forecast demand separately for each dish.
5. Recommend preparation quantities using a configurable safety buffer.
6. Explain the main reason for each recommendation and flag limited data.
7. Let the manager adjust quantities and confirm the plan.
8. After the meal, enter actual outcomes and compare them with the forecast.

A manager must be able to review and change every recommendation. No automatic cooking, purchasing, or enforcement.

## 5. Core Screens

### Dashboard

The main screen should answer: **What should we prepare tomorrow, and why?**

Show the target date/meal, a dish-by-dish recommendation table, a small number of useful summary metrics, concise key insights, data-quality warnings, and clear actions to edit or confirm the plan. The preparation table is the primary focus; insights and summaries should remain visually secondary.

### Meal Records

Allow staff to record and correct portions prepared, served, leftovers, and available attendance. Make missing information explicit; never silently treat unknown values as zero.

### Menu Management

Allow the user to maintain dishes and select those planned for a meal.

### Forecasts and Preparation Plan

Show predicted demand, recommended quantity, safety buffer, a plain-language explanation, and whether the result is based on sufficient history or a fallback. Let the manager adjust quantities and record an optional reason.

### Reports

Compare forecasts with actual demand and show leftover trends only when records are available and consistent. Keep reports simple and avoid implying proven savings or impact without evidence.

### Settings

Provide basic kitchen settings and a configurable default safety buffer. Full user/account management is not part of the MVP.

## 6. Forecasting Approach

**Planned model:** Random Forest Regression using Python and scikit-learn. Compare it with a simple historical-average baseline; do not assume the ML model is better before measuring it.

### Inputs

- Past demand per dish and meal.
- Day of week and meal type.
- Planned dishes/menu.
- Expected attendance, when available.
- Holidays, events, and closures, when known.

### Output

Predicted portions needed for each dish on the target date. Use portions served as the demand target when records are reliable; record leftovers separately.

### From forecast to recommendation

Apply a configurable safety buffer to the prediction, round to a whole portion, and show both numbers clearly. The safety buffer is an initial operational setting, not a proven optimal value. Managers retain final control.

### Limited data

If history is missing or too sparse, use a transparent historical fallback and display a limited-data warning. Never fabricate confidence, accuracy, or supporting explanations. Synthetic/demo data must be labelled clearly and must not be described as real customer data.

### Evaluation

Compare Random Forest with the baseline using chronological holdout data. Track:

- Forecast error in portions (MAE).
- Whether forecasts tend to over- or under-predict.
- Leftover quantities and shortage incidents, when consistently recorded.

Only claim waste reduction or financial savings after a real pilot with a defined baseline and measured outcomes.

## 7. Technology and Scope

- **Frontend:** Next.js, React, TypeScript.
- **Styling:** Tailwind CSS and shadcn/ui.
- **Backend:** Python and FastAPI.
- **Forecasting:** scikit-learn.
- **Database:** Supabase PostgreSQL.
- **Deployment direction:** Vercel for the web frontend and a suitable Python host for the API.

The Next.js app handles the web UI; FastAPI handles validation, forecasting, recommendations, and reporting; Supabase stores meal and forecast records. Keep API contracts clear and avoid duplicating ML logic in the frontend.

### Explicit MVP boundaries

- Build a **Next.js web app now**. Do **not** use React Native for this MVP; a React Native mobile app may be considered later.
- No authentication in the MVP.
- Use synthetic/demo data until a controlled pilot provides real data.
- No chatbot/LLM, donation marketplace, payment system, POS integration, complex analytics, or production multi-tenant account system.
- Do not expose sensitive real customer records through an unauthenticated public deployment.

## 8. How the MVP Should Behave

- Make the next-day plan quick to understand and use.
- Keep predicted demand, recommended preparation, and actual results distinct.
- Show why a quantity was recommended, which data was used, and when data is insufficient.
- Make edits and confirmation explicit; provide clear success/error feedback.
- Handle missing, inconsistent, and invalid records safely.
- Present useful key insights, not generic or invented statements.
- Show clear loading, empty, and error states.
- Use the agreed palette and consistent components from `AGENTS.md`.
- Work on desktop 16:9 layouts and adapt properly to other desktop sizes, tablets, and mobile browsers. Do not force a fixed 16:9 canvas.

## 9. Implementation Phases

### Phase 1 — Foundation

Inspect the repository, set up the Next.js frontend and FastAPI backend, establish environment configuration, and connect the frontend to a health endpoint.

**Complete when:** both services run locally and communicate successfully.

### Phase 2 — Meal data

Create the Supabase schema for dishes, meal sessions, dish-level records, forecasts, plans, and settings. Add clearly labelled demo data. Build dish/menu management and meal-record forms.

**Complete when:** a user can create and update dishes and record meal outcomes without losing the distinction between missing and zero values.

### Phase 3 — Forecasting

Implement the historical-average baseline, Random Forest pipeline, safety-buffer calculation, sparse-data fallback, and model evaluation. Expose forecasts through FastAPI.

**Complete when:** each forecast response provides demand, recommendation, model/fallback status, and a grounded explanation.

### Phase 4 — Main workflow

Build the dashboard and preparation table, key insights, quantity editing, and plan confirmation. Connect all views to the API.

**Complete when:** a user can review, adjust, and confirm tomorrow's plan end to end.

### Phase 5 — Actuals and reports

Allow entry of post-meal results and show forecast-versus-actual comparisons and basic leftovers reporting.

**Complete when:** the app can display a comparison based on recorded data without inventing results.

### Phase 6 — Quality and demo readiness

Check responsive behavior, loading/error/empty states, form validation, consistent visuals, setup instructions, and deployment configuration. Verify demo labels and data limitations are obvious.

**Complete when:** the main workflow is repeatable and usable on desktop and mobile browsers.

## 10. Minimum Acceptance Checklist

- A user can create dishes and record prepared, served, leftover, and attendance values.
- A user can request a forecast for a selected future meal.
- Demand prediction and preparation recommendation are shown separately.
- Safety buffer and recommendation logic are visible and configurable.
- Insufficient history triggers a clear fallback instead of false confidence.
- The user can edit quantities and confirm a preparation plan.
- Actual results can be recorded and compared with predictions.
- Sample data and illustrative outcomes are labelled clearly.
- The UI follows the shared design system and works on mobile browsers and 16:9 desktop screens.
- No unmeasured waste reduction, savings, accuracy, customer, or market claims are presented as facts.

## 11. Key Risks to Validate

- **Data availability:** kitchens may not record served quantities and leftovers consistently.
- **Forecast value:** a simple historical average may work as well as or better than Random Forest on small datasets.
- **Operational fit:** staff need a quick way to enter data without disrupting kitchen routines.
- **Willingness to pay:** private operators are a target hypothesis, not confirmed buyers.
- **Real impact:** reduced leftovers and savings must be demonstrated in a pilot.

The MVP should make these uncertainties testable, not hide them.

## 12. Definition of Done

The MVP is ready for a supervised pilot when the full workflow works—from entering historical meal records to creating a preparation plan, confirming it, entering actual outcomes, and comparing results—the model is evaluated against a baseline, demo values are clearly labelled, and the interface remains consistent and usable across screen sizes.
