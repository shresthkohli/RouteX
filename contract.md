# Project Specification & Architecture Contract: RouteX

You are building **RouteX**, a Surat City Bus Transit Next.js (App Router) web application backed by an existing **Neon PostgreSQL** database.
This document is the single source of truth for the project. **Do not invent database tables, alter SQL column names, add external UI libraries, or improvise variable names.** Every architectural, naming, and styling decision is strictly locked down below.

---

## 1. Core Operating Rules

1. **Zero Hallucinations:** The PostgreSQL database is already deployed on Neon with pre-existing tables and stored functions. You must use raw parameterized SQL queries via `@neondatabase/serverless` calling the exact table and function signatures defined in Section 3. Do NOT use Prisma, Drizzle, or any ORM.
2. **Parallel `README.md` Maintenance:** You must create `README.md` in Step 1 and update it in parallel every time a new module, API route, or page is added.
3. **Strict Naming Agreement:** Use the exact TypeScript interfaces, API route paths, query parameter keys, and component names specified in this contract.

---

## 2. Tech Stack & Dependencies

- **Framework:** Next.js 14+ (App Router, TypeScript)
- **Database Driver:** `@neondatabase/serverless`
- **Authentication:** Custom JWT sessions stored in HTTP-Only cookies using `jose` and password hashing via `bcryptjs` (`@types/bcryptjs`).
- **Styling:** Tailwind CSS (no external component libraries like Material UI, Shadcn, or Ant Design; use pure Tailwind utility classes and `lucide-react` for icons).
- **Environment Variables (`.env.local`):**

```env
DATABASE_URL="postgresql://..."
JWT_SECRET="super-secret-routex-jwt-key-minimum-32-chars"
```

---

## 3. Existing Database Schema & SQL Function Contracts (Read-Only Reference)

### 3.1 Existing Tables

1. **`stops`**: `stop_id` (INT PK), `stop_name` (VARCHAR), `latitude` (DECIMAL), `longitude` (DECIMAL), `is_active` (BOOLEAN)
2. **`routes`**: `route_id` (INT PK), `route_number` (VARCHAR), `route_name` (VARCHAR), `route_type` (`'City Bus'` | `'BRTS'` | `'Electric'`), `is_active` (BOOLEAN)
3. **`route_stops`**: `route_id` (INT), `stop_id` (INT), `stop_sequence` (INT)
4. **`buses`**: `bus_id` (INT PK), `bus_number` (VARCHAR), `bus_type` (`'Standard'` | `'Articulated'` | `'Mini'` | `'Electric'`), `capacity` (INT), `status` (VARCHAR)
5. **`schedules`**: `schedule_id` (INT PK), `schedule_name` (VARCHAR), `monday`..`sunday` (BOOLEAN)
6. **`trips`**: `trip_id` (INT PK), `route_id` (INT), `bus_id` (INT), `schedule_id` (INT), `departure_time` (TIME), `arrival_time` (TIME), `fare` (DECIMAL), `status` (VARCHAR)
7. **`users`**: `passenger_id` (SERIAL PK), `name` (VARCHAR), `email` (VARCHAR UNIQUE NULLABLE), `phone_number` (VARCHAR UNIQUE NULLABLE), `password_hash` (TEXT), `user_role` (`'passenger'` | `'admin'`), `created_at` (TIMESTAMPTZ)
8. **`bookings`**: `booking_id` (SERIAL PK), `passenger_id` (INT), `trip_id` (INT), `booking_date` (DATE), `fare` (DECIMAL), `status` (`'Confirmed'` | `'Cancelled'` | `'Completed'`), `booked_at` (TIMESTAMPTZ)
9. **`favorite_trips`**: `favorite_id` (SERIAL PK), `passenger_id` (INT), `route_id` (INT), `saved_at` (TIMESTAMPTZ)

### 3.2 Existing PostgreSQL Functions (Call via `SELECT * FROM fn_name(...)`)

1. **Station Autocomplete:**
   ```sql
   SELECT * FROM search_stops($1::TEXT);
   ```
   - **Returns:** `stop_id` (number), `stop_name` (string)

2. **Search Bus Services (Station A to Station B):**
   ```sql
   SELECT * FROM search_bus_services($1::INT, $2::INT, $3::TIME, $4::INT);
   ```
   - **Note:** If `$3` (`p_current_time`) and `$4` (`p_current_dow`, ISO `1`=Mon..`7`=Sun) are omitted, call `SELECT * FROM search_bus_services($1::INT, $2::INT);` so PostgreSQL uses the default IST current time and day. If the user selects "Custom Time / Full Day Schedule", pass `$3` as `'00:00:00'` (or the selected `HH:MM:SS` string) and `$4` as the selected day integer (`1` to `7`).
   - **Returns:** `trip_id`, `route_id`, `route_number`, `route_name`, `departure_stop`, `arrival_stop`, `departure_sequence`, `arrival_sequence`, `departure_time`, `arrival_time`, `fare`, `bus_number`, `bus_type`, `capacity`, `trip_status`, `schedule_name`

3. **Route Ordered Stops (Cursor Function):**
   ```sql
   SELECT * FROM fn_get_route_stops_cursor($1::INT);
   ```
   - **Parameter:** `$1` = `route_id`
   - **Returns:** `seq_no` (number), `station_name` (string)

4. **Book a Trip:**
   ```sql
   SELECT * FROM fn_book_trip($1::INT, $2::INT);
   ```
   - **Parameters:** `$1` = `passenger_id`, `$2` = `trip_id`
   - **Returns:** `booking_id`, `trip_id`, `booking_date`, `fare`, `status`

5. **Save Route to Favorites:**
   ```sql
   SELECT fn_add_favorite_route($1::INT, $2::INT) AS favorite_id;
   ```
   - **Parameters:** `$1` = `passenger_id`, `$2` = `route_id`
   - **Returns:** `favorite_id` (number)

6. **Get User Profile:**
   ```sql
   SELECT * FROM fn_get_user_profile($1::INT);
   ```
   - **Parameter:** `$1` = `passenger_id`
   - **Returns:** `passenger_id`, `name`, `email`, `phone_number`, `user_role`, `created_at`

7. **Get Passenger Bookings:**
   ```sql
   SELECT * FROM fn_get_passenger_bookings($1::INT);
   ```
   - **Parameter:** `$1` = `passenger_id`
   - **Returns:** `booking_id`, `booking_date`, `booking_status`, `booked_at`, `fare_paid`, `trip_id`, `departure_time`, `arrival_time`, `trip_status`, `route_id`, `route_number`, `route_name`, `route_type`, `bus_number`, `bus_type`, `schedule_name`

8. **Get Saved Favorite Routes:**
   ```sql
   SELECT * FROM fn_get_favorite_routes($1::INT);
   ```
   - **Parameter:** `$1` = `passenger_id`
   - **Returns:** `favorite_id`, `saved_at`, `route_id`, `route_number`, `route_name`, `route_type`, `is_active`, `start_stop_name`, `end_stop_name`, `total_stops`

---

## 4. Design System & UI Agreement

### 4.1 Color Palette (Minimal Dark Slate + Emerald Accent)

Use these exact Tailwind classes across the entire project:
- **Page Background:** `bg-slate-950 text-slate-100 min-h-screen`
- **Surface / Card Background:** `bg-slate-900/80 backdrop-blur-md border border-slate-800`
- **Elevated Surface / Hover:** `hover:bg-slate-800/70 hover:border-slate-700 transition-all duration-200`
- **Primary Brand Accent:** `bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold`
- **Secondary Button / Badge:** `bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700`
- **Muted / Secondary Text:** `text-slate-400`
- **Danger / Error:** `text-rose-400 bg-rose-950/50 border border-rose-800`
- **Route Type Badges:**
  - `'BRTS'`: `bg-amber-500/15 text-amber-300 border border-amber-500/30`
  - `'Electric'`: `bg-emerald-500/15 text-emerald-300 border border-emerald-500/30`
  - `'City Bus'`: `bg-sky-500/15 text-sky-300 border border-sky-500/30`

### 4.2 Geometry & Typography (Soft Rounded Look)

- **Outer Cards & Containers:** `rounded-2xl p-6 shadow-sm`
- **Inputs, Selects & Buttons:** `rounded-xl px-4 py-2.5 text-sm`
- **Pills & Badges:** `rounded-full px-3 py-1 text-xs font-medium`
- **Layout Container:** `max-w-5xl mx-auto px-4 sm:px-6 py-8`

---

## 5. Exact Directory Structure Agreement

Create and maintain this exact file tree:

```text
routex/
├── contract.md
├── README.md
├── package.json
└── src/
    ├── lib/
    │   ├── db.ts                  # Neon SQL client initialization
    │   ├── auth.ts                # JWT sign/verify + getSessionUser() helper
    │   └── types.ts               # All shared TypeScript interfaces
    ├── components/
    │   ├── Navbar.tsx             # Top navigation bar with auth state
    │   ├── StopAutocomplete.tsx   # Debounced dropdown for Station A & B
    │   ├── TripCard.tsx           # Card displaying a single bus service + Book/Favorite buttons
    │   └── RouteCard.tsx          # Card displaying a bus route + expandable stop timeline
    └── app/
        ├── layout.tsx             # Root layout with Navbar and dark theme
        ├── page.tsx               # Home: Search Trips (Station A -> Station B)
        ├── buses/
        │   └── page.tsx           # Search Buses & Routes directory (with stop sequence view)
        ├── login/
        │   └── page.tsx           # Login / Signup toggle page
        ├── dashboard/
        │   └── page.tsx           # Protected User Profile, Saved Routes & Past Bookings
        └── api/
            ├── auth/
            │   ├── signup/route.ts
            │   ├── login/route.ts
            │   ├── logout/route.ts
            │   └── me/route.ts
            ├── stops/
            │   └── search/route.ts
            ├── trips/
            │   └── search/route.ts
            ├── buses/
            │   └── route.ts
            ├── bookings/
            │   └── route.ts
            └── favorites/
                └── route.ts
```

---

## 6. TypeScript Interfaces (`src/lib/types.ts`)

Define and export these exact interfaces:

```typescript
export interface StopOption {
  stop_id: number;
  stop_name: string;
}

export interface BusServiceResult {
  trip_id: number;
  route_id: number;
  route_number: string;
  route_name: string;
  departure_stop: string;
  arrival_stop: string;
  departure_sequence: number;
  arrival_sequence: number;
  departure_time: string;
  arrival_time: string;
  fare: string;
  bus_number: string | null;
  bus_type: string | null;
  capacity: number | null;
  trip_status: string;
  schedule_name: string;
}

export interface RouteStopItem {
  seq_no: number;
  station_name: string;
}

export interface BusRouteOverview {
  route_id: number;
  route_number: string;
  route_name: string;
  route_type: 'City Bus' | 'BRTS' | 'Electric';
  is_active: boolean;
  stops: RouteStopItem[];
}

export interface UserProfile {
  passenger_id: number;
  name: string;
  email: string | null;
  phone_number: string | null;
  user_role: 'passenger' | 'admin';
  created_at: string;
}

export interface PassengerBooking {
  booking_id: number;
  booking_date: string;
  booking_status: string;
  booked_at: string;
  fare_paid: string;
  trip_id: number;
  departure_time: string;
  arrival_time: string;
  trip_status: string;
  route_id: number;
  route_number: string;
  route_name: string;
  route_type: string;
  bus_number: string | null;
  bus_type: string | null;
  schedule_name: string;
}

export interface FavoriteRoute {
  favorite_id: number;
  saved_at: string;
  route_id: number;
  route_number: string;
  route_name: string;
  route_type: string;
  is_active: boolean;
  start_stop_name: string;
  end_stop_name: string;
  total_stops: number;
}
```

---

## 7. Backend API Route Specifications

### 7.1 Database Client (`src/lib/db.ts`)

Initialize Neon using:

```typescript
import { neon } from '@neondatabase/serverless';

export const sql = neon(process.env.DATABASE_URL!);
```

### 7.2 Auth Helper (`src/lib/auth.ts`)

- **Cookie Name:** `routex_token` (HTTP-only, `sameSite: 'lax'`, `path: '/'`, `maxAge: 60 * 60 * 24 * 7`).
- **JWT Payload:** `{ passenger_id: number, name: string, user_role: 'passenger' | 'admin' }`.
- **Exports:** `createSessionCookie(payload)`, `clearSessionCookie()`, and `getSessionUser()`.

### 7.3 API Endpoints

1. **`POST /api/auth/signup`**
   - **Body:** `{ name: string, email?: string, phone_number?: string, password: string }`
   - **Validation:** Require `name`, `password` (min 6 chars), and at least one of `email` or `phone_number`. Normalize empty strings to `null`.
   - **Password Hashing:** Hash with `bcryptjs` (10 salt rounds).
   - **Query:**
     ```sql
     INSERT INTO users (name, email, phone_number, password_hash)
     VALUES ($1, $2, $3, $4)
     RETURNING passenger_id, name, user_role;
     ```
   - **Response:** Set `routex_token` cookie and return `201` with user object.

2. **`POST /api/auth/login`**
   - **Body:** `{ identifier: string, password: string }` (`identifier` can be email or phone number).
   - **Query:**
     ```sql
     SELECT passenger_id, name, email, phone_number, password_hash, user_role
     FROM users
     WHERE email = LOWER(TRIM($1)) OR phone_number = TRIM($1)
     LIMIT 1;
     ```
   - **Verification:** Verify password with `bcrypt.compare`. Set `routex_token` cookie and return `200`.

3. **`POST /api/auth/logout`**
   - **Action:** Clear `routex_token` cookie and return `200`.

4. **`GET /api/auth/me`**
   - **Action:** Read session from `getSessionUser()`. If unauthenticated, return `401`.
   - **Query:** `SELECT * FROM fn_get_user_profile($1::INT);` and return `{ user: UserProfile }`.

5. **`GET /api/stops/search?q=<query>`**
   - **Action:** If `q` is empty, execute:
     ```sql
     SELECT stop_id, stop_name FROM stops WHERE is_active = TRUE ORDER BY stop_name LIMIT 10;
     ```
     Otherwise, execute:
     ```sql
     SELECT * FROM search_stops($1::TEXT);
     ```
   - **Response:** Return `{ stops: StopOption[] }`.

6. **`GET /api/trips/search?fromStopId=<int>&toStopId=<int>&departureAfter=<HH:MM:SS>&dayOfWeek=<1-7>`**
   - **Validation:** Require `fromStopId` and `toStopId`.
   - **Query:** If `departureAfter` and `dayOfWeek` are provided, call:
     ```sql
     SELECT * FROM search_bus_services($1::INT, $2::INT, $3::TIME, $4::INT);
     ```
     Otherwise call:
     ```sql
     SELECT * FROM search_bus_services($1::INT, $2::INT);
     ```
   - **Response:** Return `{ trips: BusServiceResult[] }`.

7. **`GET /api/buses?q=<search_term>&routeType=<type>`**
   - **Query:** Fetch active routes from `routes` filtered optionally by `route_number ILIKE` / `route_name ILIKE` and `route_type`.
   - **Cursor Call:** For each returned route, call `SELECT * FROM fn_get_route_stops_cursor($1::INT);` to attach its ordered `stops` array.
   - **Response:** Return `{ routes: BusRouteOverview[] }`.

8. **`GET /api/bookings` & `POST /api/bookings` (Protected)**
   - **`GET`:** Verify session. Call `SELECT * FROM fn_get_passenger_bookings($1::INT);`. Return `{ bookings: PassengerBooking[] }`.
   - **`POST`:** Verify session. Body: `{ trip_id: number }`. Call `SELECT * FROM fn_book_trip($1::INT, $2::INT);`. Return `201` with booking receipt.

9. **`GET /api/favorites`, `POST /api/favorites`, `DELETE /api/favorites?routeId=<int>` (Protected)**
   - **`GET`:** Verify session. Call `SELECT * FROM fn_get_favorite_routes($1::INT);`. Return `{ favorites: FavoriteRoute[] }`.
   - **`POST`:** Verify session. Body: `{ route_id: number }`. Call `SELECT fn_add_favorite_route($1::INT, $2::INT) AS favorite_id;`. Return `200`.
   - **`DELETE`:** Verify session. Execute `DELETE FROM favorite_trips WHERE passenger_id = $1 AND route_id = $2;`. Return `200`.

---

## 8. Frontend Pages & User Flows

### 8.1 `src/app/page.tsx` — Search Trips (Home)

- **Hero Search Card (`rounded-2xl bg-slate-900/80 border border-slate-800 p-6`):**
  - Two `<StopAutocomplete />` components side-by-side: **From Station** (`fromStop`) and **To Station** (`toStop`), with a swap button in between.
  - A time filter toggle: **"Departing Now (Live IST)"** vs **"Custom Time / Full Day Schedule"** (when toggled, passes `00:00:00` or user-selected time and day of week so the user can test trips at any hour of the day).
  - Client-side filter pills for `bus_type` (`All`, `Standard`, `Electric`, `Articulated`) and sort dropdown (`Departure Time`, `Lowest Fare`).
- **Results List:**
  - Renders `<TripCard />` for each result showing Route Number badge, Route Name, Departure & Arrival times, Fare (`₹XX.XX`), Bus Number & Type, Schedule Name, and two action buttons:
    - **"Book Ticket"** (Calls `POST /api/bookings`; if unauthenticated, redirects to `/login`).
    - **"Save Route"** bookmark button (Calls `POST /api/favorites`; if unauthenticated, redirects to `/login`).

### 8.2 `src/app/buses/page.tsx` — Search Buses & Routes

- Search input to filter by route number (e.g., `112`, `204`, `11`) or route name, plus filter pills for `route_type` (`All`, `City Bus`, `BRTS`, `Electric`).
- Renders `<RouteCard />` showing the route badge, name, total stops, a **"Save Route"** button, and an expandable ordered stop timeline (`Station 1 -> Station 2 -> ...`) powered by `fn_get_route_stops_cursor`.

### 8.3 `src/app/login/page.tsx` — Login / Signup

- Centered minimal card (`max-w-md mx-auto mt-12 rounded-2xl bg-slate-900 border border-slate-800 p-8`).
- Tab switcher between **Sign In** and **Create Account**.
- **Sign In Form:** `identifier` (Email or Phone Number) + `password`.
- **Create Account Form:** `name`, `email` (optional if phone provided), `phone_number` (optional if email provided), `password`.
- Redirects to `/dashboard` on success and refreshes the Navbar auth state.

### 8.4 `src/app/dashboard/page.tsx` — User Profile, Saved Trips & Past Bookings

- Fetches `/api/auth/me`, `/api/bookings`, and `/api/favorites`. Redirects to `/login` if unauthorized.
- **Section 1 (Profile Header Card):** Displays `name`, `email`, `phone_number`, role badge, and member since date.
- **Section 2 (Saved Routes):** Grid of cards showing `route_number`, `route_name`, `route_type`, `start_stop_name -> end_stop_name`, `total_stops`, and a "Remove" button (`DELETE /api/favorites?routeId=...`).
- **Section 3 (Past Bookings):** List of ticket receipt cards showing `booking_id`, `route_number`, `route_name`, `departure_time - arrival_time`, `booking_date`, `fare_paid` (`₹XX.XX`), `bus_number`, and `booking_status` badge.

---

## 9. Build Order Instructions

Execute this build systematically in the following order:
1. Initialize dependencies (`@neondatabase/serverless`, `jose`, `bcryptjs`, `@types/bcryptjs`, `lucide-react`) and create `README.md`.
2. Create `src/lib/types.ts`, `src/lib/db.ts`, and `src/lib/auth.ts`.
3. Implement all API route handlers under `src/app/api/...`.
4. Implement shared components (`Navbar.tsx`, `StopAutocomplete.tsx`, `TripCard.tsx`, `RouteCard.tsx`).
5. Implement the pages (`/`, `/buses`, `/login`, `/dashboard`) and update `README.md` with setup instructions, architecture overview, and API documentation.