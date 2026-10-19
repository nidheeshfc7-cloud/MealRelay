# MealRelay Authentication Integration Specification

## Current Status: Frontend Ready (Isolated Adapter Active)
The Next.js web frontend has full interactive Login and Signup flows implemented at:
- `/login`
- `/signup`

The UI is powered by `src/lib/auth.ts`, an isolated authentication module that provides zero-fallback reliability, form validation, error banners, password toggles, and safe local session caching while Codex finishes the backend authentication router.

---

## Backend Auth Contract for Codex

Once Codex adds the backend auth endpoints to FastAPI, simply confirm or adjust the routes in `Frontend/apps/web/src/lib/auth.ts`:

### 1. Login Endpoint
- **URL**: `POST /api/auth/login`
- **Request Body**:
  ```json
  {
    "email": "chef@institution.edu",
    "password": "OperationalSecurePassword123"
  }
  ```
- **Expected Success Response** (`200 OK`):
  ```json
  {
    "access_token": "jwt_token_string",
    "token_type": "bearer",
    "user": {
      "id": "usr_uuid",
      "email": "chef@institution.edu",
      "full_name": "Marcus Vance",
      "role": "Head Chef",
      "organization": "North Dining Hall"
    }
  }
  ```
- **Expected Error Response** (`400` / `401`):
  ```json
  {
    "detail": "Invalid institutional credentials."
  }
  ```

### 2. Signup / Registration Endpoint
- **URL**: `POST /api/auth/signup`
- **Request Body**:
  ```json
  {
    "full_name": "Marcus Vance",
    "email": "m.vance@university.edu",
    "password": "OperationalSecurePassword123",
    "organization": "North Dining Hall",
    "role": "Head Chef / Operations Lead"
  }
  ```
- **Expected Success Response** (`201 Created` or `200 OK`):
  ```json
  {
    "access_token": "jwt_token_string",
    "token_type": "bearer",
    "user": {
      "id": "usr_uuid",
      "email": "m.vance@university.edu",
      "full_name": "Marcus Vance",
      "role": "Head Chef / Operations Lead",
      "organization": "North Dining Hall"
    }
  }
  ```

---

## Pending Items
1. [ ] Codex to finalize backend auth routes in `backend/src/api/routes/auth.py` (or Supabase Auth integration).
2. [ ] Toggle `AUTH_CONFIG.isIntegrationPending = false` in `Frontend/apps/web/src/lib/auth.ts` once backend endpoints return real JWTs.
