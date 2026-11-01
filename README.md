# RouteX — Surat City Bus Transit Web Application

RouteX is a high-performance modern public transit web application built specifically for the Surat City Bus and BRTS Transit network. Built on Next.js 14+ (App Router), TypeScript, Tailwind CSS, and Neon Serverless PostgreSQL with stored functions and raw parameterized queries.

---

## 🚀 Key Features

- **Station Autocomplete:** Instant search for bus stops across Surat with debounced search calling `search_stops($1)`.
- **Direct Bus & Schedule Search:** Find direct bus routes between any two stations with live IST time departure or custom time scheduling using `search_bus_services($1, $2, $3, $4)`.
- **Bus & Route Explorer:** Browse active routes (`City Bus`, `BRTS`, `Electric`) with full ordered stop timelines via PostgreSQL cursor procedures `fn_get_route_stops_cursor($1)`.
- **Secure Authentication:** Custom stateless JWT authentication (`jose`) stored in HTTP-Only cookies with `bcryptjs` password hashing.
- **Ticketing & Booking Receipts:** Reserve trip tickets through `fn_book_trip($1, $2)` with automated fare tracking.
- **Saved Routes:** Bookmark frequently used transit routes using `fn_add_favorite_route($1, $2)` and manage them from a user dashboard.
- **Admin Control Center (`/admin`):** Full-featured transit administration portal with live KPI metrics, trip scheduling, interactive route stop sequence builder, stops directory, fleet management, and recurring calendar scheduling.

---

## 🛠️ Tech Stack & Architecture

- **Framework:** Next.js (App Router, React 19, TypeScript)
- **Database Driver:** `@neondatabase/serverless` (Zero-ORM, raw parameterized SQL)
- **Authentication:** `jose` (HS256 signed JWT in HTTP-Only cookie `routex_token`), `bcryptjs` (10 salt rounds)
- **Authorization:** `requireAdmin()` gatekeeper verifying `user_role === 'admin'` on all administrative routes
- **Styling:** Tailwind CSS (Dark Slate `#020617` / `#0f172a` + Emerald `#10b981` accents)
- **Icons:** `lucide-react`

---

## 🎨 Design System Agreement

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
- **Geometry & Cards:** `rounded-2xl p-6 shadow-sm`
- **Inputs & Buttons:** `rounded-xl px-4 py-2.5 text-sm`
- **Pills & Badges:** `rounded-full px-3 py-1 text-xs font-medium`

---

## 📦 Directory Structure

```text
routex/
├── contract.md                  # Strict architectural and naming contract
├── README.md                    # Project documentation and guide
├── package.json
└── src/
    ├── lib/
    │   ├── db.ts                # Neon Serverless SQL client
    │   ├── auth.ts              # JWT creation, verification, getSessionUser, requireAdmin helper
    │   └── types.ts             # Strict TypeScript domain interfaces
    ├── components/
    │   ├── Navbar.tsx           # Global navigation with live auth status & Admin Link
    │   ├── StopAutocomplete.tsx # Station search input with debounce & dropdown
    │   ├── TripCard.tsx         # Bus service search result card with actions
    │   └── RouteCard.tsx        # Route overview card with expandable stops
    └── app/
        ├── layout.tsx           # Root dark layout with sticky Navbar and footer
        ├── page.tsx             # Homepage: Station A -> Station B search
        ├── buses/page.tsx       # Route explorer & stop sequences
        ├── login/page.tsx       # Tabbed Login / Signup portal
        ├── dashboard/page.tsx   # User profile, saved routes & booking history
        ├── admin/
        │   └── page.tsx         # Protected Unified Admin Control Center
        └── api/
            ├── auth/
            │   ├── signup/route.ts
            │   ├── login/route.ts
            │   ├── logout/route.ts
            │   └── me/route.ts
            ├── stops/search/route.ts
            ├── trips/search/route.ts
            ├── buses/route.ts
            ├── bookings/route.ts
            ├── favorites/route.ts
            └── admin/
                ├── stats/route.ts       # GET aggregate network KPI metrics
                ├── stops/route.ts       # GET, POST, PUT, DELETE stops
                ├── routes/route.ts      # GET, POST, PUT, DELETE routes & route_stops
                ├── buses/route.ts       # GET, POST, PUT, DELETE vehicle fleet
                ├── schedules/route.ts   # GET, POST, PUT, DELETE weekly calendar schedules
                └── trips/route.ts       # GET, POST, PUT, DELETE transit trips
```

---

## 🗄️ Database Functions & Contracts

| Function | Signature | Usage |
| :--- | :--- | :--- |
| `search_stops` | `SELECT * FROM search_stops($1::TEXT);` | Station autocomplete search by name |
| `search_bus_services` | `SELECT * FROM search_bus_services($1::INT, $2::INT, $3::TIME, $4::INT);` | Point-to-point bus service search |
| `fn_get_route_stops_cursor` | `SELECT * FROM fn_get_route_stops_cursor($1::INT);` | Ordered sequence of stations on a route |
| `fn_book_trip` | `SELECT * FROM fn_book_trip($1::INT, $2::INT);` | Creates confirmed booking ticket for passenger |
| `fn_add_favorite_route` | `SELECT fn_add_favorite_route($1::INT, $2::INT) AS favorite_id;` | Saves route to passenger favorites |
| `fn_get_user_profile` | `SELECT * FROM fn_get_user_profile($1::INT);` | Fetches passenger profile details |
| `fn_get_passenger_bookings` | `SELECT * FROM fn_get_passenger_bookings($1::INT);` | Passenger booking history with trip & bus info |
| `fn_get_favorite_routes` | `SELECT * FROM fn_get_favorite_routes($1::INT);` | Saved routes with terminal stops and counts |

---

## 📡 Public & Passenger API Route Specifications

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/signup` | Register a new passenger with bcrypt password hashing | No |
| `POST` | `/api/auth/login` | Login with email or phone number and issue JWT cookie | No |
| `POST` | `/api/auth/logout` | Clear `routex_token` HTTP-only session cookie | No |
| `GET` | `/api/auth/me` | Fetch authenticated passenger profile (`fn_get_user_profile`) | Yes |
| `GET` | `/api/stops/search?q=<query>` | Autocomplete bus stops (`search_stops` or top stops) | No |
| `GET` | `/api/trips/search?fromStopId=&toStopId=&departureAfter=&dayOfWeek=` | Find direct bus trips (`search_bus_services`) | No |
| `GET` | `/api/buses?q=&routeType=` | List routes with ordered stop sequences (`fn_get_route_stops_cursor`) | No |
| `GET` | `/api/bookings` | Retrieve passenger booking history (`fn_get_passenger_bookings`) | Yes |
| `POST` | `/api/bookings` | Book a trip ticket receipt (`fn_book_trip`) | Yes |
| `GET` | `/api/favorites` | Retrieve bookmarked routes (`fn_get_favorite_routes`) | Yes |
| `POST` | `/api/favorites` | Add route to favorites (`fn_add_favorite_route`) | Yes |
| `DELETE` | `/api/favorites?routeId=` | Remove route from saved list | Yes |

---

## 🛡️ Admin API Route Specifications (`/api/admin/...`)

*All admin endpoints require `user_role === 'admin'`. Unauthorized requests receive `403 Forbidden`.*

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/admin/stats` | Fetches aggregate system KPIs (trips, routes, stops, buses, schedules, users) |
| `GET` | `/api/admin/stops` | Returns all stops ordered by `stop_id ASC` |
| `POST` | `/api/admin/stops` | Creates a new bus stop (`stop_name`, `latitude`, `longitude`, `is_active`) |
| `PUT` | `/api/admin/stops` | Updates existing bus stop coordinates and active flag |
| `DELETE` | `/api/admin/stops?stopId=` | Deletes a stop (fails with 400 if assigned to routes) |
| `GET` | `/api/admin/routes` | Returns all routes with nested ordered stop sequences (`route_stops`) |
| `POST` | `/api/admin/routes` | Creates route and inserts ordered `(route_id, stop_id, stop_sequence)` |
| `PUT` | `/api/admin/routes` | Updates route info and cleanly re-syncs ordered stop sequence |
| `DELETE` | `/api/admin/routes?routeId=` | Deletes route and its stops (fails with 400 if trips reference it) |
| `GET` | `/api/admin/buses` | Returns fleet vehicle records (`bus_number`, `bus_type`, `capacity`, `status`) |
| `POST` | `/api/admin/buses` | Adds a new bus to the fleet |
| `PUT` | `/api/admin/buses` | Updates bus capacity, type, and operational status |
| `DELETE` | `/api/admin/buses?busId=` | Deletes vehicle from fleet (fails with 400 if assigned to trips) |
| `GET` | `/api/admin/schedules` | Returns all weekly recurring day mask schedules |
| `POST` | `/api/admin/schedules` | Creates schedule with active day flags (Mon-Sun) |
| `PUT` | `/api/admin/schedules` | Updates schedule name and operating days |
| `DELETE` | `/api/admin/schedules?scheduleId=` | Deletes schedule (fails with 400 if assigned to trips) |
| `GET` | `/api/admin/trips` | Returns all scheduled trips joined with route, bus, and schedule details |
| `POST` | `/api/admin/trips` | Creates trip (validates `arrival_time > departure_time` and `fare >= 0`) |
| `PUT` | `/api/admin/trips` | Updates trip departure/arrival times, fare, assigned bus, or status |
| `DELETE` | `/api/admin/trips?tripId=` | Deletes trip (fails with 400 if passenger tickets exist) |

---

## 👑 Promoting a User to Administrator

To grant administrative privileges to an account, run this SQL statement in your Neon PostgreSQL Console:

```sql
UPDATE users
SET user_role = 'admin'
WHERE email = 'your-registered-email@example.com';
```

*(Alternatively, use `phone_number = '...'` if the account registered using a phone number).*

Once updated, the user will see the **Admin Panel** badge in the navbar and gain full CRUD access on `/admin`.

---

## ⚙️ Environment Variables

Create `.env.local` in the project root:

```env
DATABASE_URL="postgresql://user:password@endpoint.neon.tech/neondb?sslmode=require"
JWT_SECRET="super-secret-routex-jwt-key-minimum-32-chars-long"
```

---

## 🏃 Local Development

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Production build verification
npm run build
```

Visit [http://localhost:3000](http://localhost:3000) to view the application.
