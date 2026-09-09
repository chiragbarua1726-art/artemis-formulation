# AGENT.md — Medical Representative (MR) Reporting System

> **Purpose of this file:** This is a complete build brief for an AI coding agent (e.g. Claude Code) or a human dev team to build a production-ready, end-to-end MR Reporting web application. Paste this entire file as the task prompt, or point the agent at this file and say "build this." It contains the tech stack, roles, database schema, API contract, screens, and a phased workflow so the build can proceed autonomously with minimal clarification needed.

---

## 1. Project Summary

Build a **Medical Representative Reporting System** — a web application used by pharmaceutical/medical companies to track field sales reps ("MRs") who visit doctors, hospitals, and pharmacies. The system has two experiences:

1. **MR Web App** (mobile-first, used in the field on phone browsers) — check-in/check-out, daily call reporting, tour plan submission, expense claims.
2. **Manager/Admin Dashboard** (desktop-first) — approvals, analytics, team tracking, master data management.

The end deliverable is a fully working app with authentication, a real database, a REST API, and two role-based frontends, deployable to production.

---

## 2. Tech Stack (Decision + Rationale)

| Layer | Choice | Why |
|---|---|---|
| Frontend | **React 18 + Vite + TypeScript** | Fast dev server, type safety, industry standard for client freelance handoff |
| UI Library | **Tailwind CSS + shadcn/ui** | Fast to build clean, professional dashboards without custom CSS overhead |
| State/Data | **React Query (TanStack Query)** + Zustand | Server cache + light client state, avoids Redux boilerplate |
| Routing | **React Router v6** | Standard, role-based protected routes |
| Backend | **Node.js + Express + TypeScript** | Same language as frontend (easier handoff to client/future devs), huge ecosystem, fast to build REST APIs |
| ORM | **Prisma** | Type-safe DB access, auto-migrations, works great with PostgreSQL |
| Database | **PostgreSQL** | Relational data (reps → visits → doctors → tours) fits relational model far better than NoSQL; strong reporting/aggregation support |
| Auth | **JWT (access + refresh token)** with bcrypt password hashing | Stateless, scalable, standard for freelance handoff |
| File/Image storage | **Cloudinary** or **AWS S3** (signed uploads) | Visit photos, expense receipt uploads, prescription/sample proof photos |
| Maps/Geolocation | **Browser Geolocation API** + **Google Maps / Leaflet + OpenStreetMap** for map view | Leaflet+OSM if client wants zero Google billing; Google Maps if client already has GCP |
| Notifications | **Email (Nodemailer/Resend)** + optional Web Push | Approval alerts, plan reminders |
| Deployment | Frontend → **Vercel/Netlify**; Backend → **Render/Railway**; DB → **Neon/Supabase/Railway Postgres** | Cheap, fast to stand up for a freelance client, easy CI/CD |
| Testing | Vitest (frontend), Jest + Supertest (backend) | Confidence before handoff |

> **Alternative backend note:** If the client already has a .NET/Java/Django shop internally, backend logic can be re-implemented in that stack against the same schema — the API contract in Section 5 is language-agnostic. Default recommendation above (Node/Express/Prisma/Postgres) is fastest for a solo freelance build.

---

## 3. User Roles & Permissions

| Role | Access |
|---|---|
| **Super Admin** | Full system access, manages managers, master data (products, doctor database, regions), system settings |
| **Manager (Area/Regional Sales Manager)** | Manages a team of MRs under their region, approves tour plans/expenses/leave, views team analytics, assigns targets |
| **Medical Representative (MR)** | Field app only — check-in/out, DCR entry, tour plan submission, expense claims, views own performance |

Role is stored on the `User` model and enforced via middleware (`requireRole(['ADMIN','MANAGER'])`) on every protected route.

---

## 4. Database Schema (PostgreSQL / Prisma)

```prisma
// schema.prisma (core models — expand as needed)

enum Role {
  ADMIN
  MANAGER
  MR
}

enum TourStatus {
  PENDING
  APPROVED
  REJECTED
}

enum ExpenseStatus {
  PENDING
  APPROVED
  REJECTED
}

model User {
  id            String   @id @default(uuid())
  name          String
  email         String   @unique
  passwordHash  String
  role          Role
  phone         String?
  region        String?
  managerId     String?               // MR reports to a Manager
  manager       User?    @relation("ManagerToMR", fields: [managerId], references: [id])
  reports       User[]   @relation("ManagerToMR")
  active        Boolean  @default(true)
  createdAt     DateTime @default(now())

  visits        Visit[]
  tourPlans     TourPlan[]
  expenses      Expense[]
}

model Doctor {
  id           String   @id @default(uuid())
  name         String
  specialty    String
  hospitalName String
  address      String
  latitude     Float?
  longitude    Float?
  phone        String?
  category     String?  // e.g. A/B/C tier by prescription value
  createdAt    DateTime @default(now())
  visits       Visit[]
}

model Product {
  id          String   @id @default(uuid())
  name        String
  description String?
  sku         String   @unique
  active      Boolean  @default(true)
}

model Visit {
  id             String   @id @default(uuid())
  mrId           String
  mr             User     @relation(fields: [mrId], references: [id])
  doctorId       String
  doctor         Doctor   @relation(fields: [doctorId], references: [id])
  checkInTime    DateTime
  checkOutTime   DateTime?
  checkInLat     Float
  checkInLng     Float
  productsDiscussed ProductDiscussion[]
  samplesGiven   Json?     // [{ productId, quantity }]
  feedback       String?
  photoUrl       String?
  createdAt      DateTime @default(now())
}

model ProductDiscussion {
  id        String  @id @default(uuid())
  visitId   String
  visit     Visit   @relation(fields: [visitId], references: [id])
  productId String
  product   Product @relation(fields: [productId], references: [id])
  notes     String?
}

model TourPlan {
  id          String     @id @default(uuid())
  mrId        String
  mr          User       @relation(fields: [mrId], references: [id])
  weekStart   DateTime
  weekEnd     DateTime
  planDetails Json       // [{ date, doctorIds[], area }]
  status      TourStatus @default(PENDING)
  reviewedBy  String?
  reviewNote  String?
  createdAt   DateTime   @default(now())
}

model Expense {
  id          String        @id @default(uuid())
  mrId        String
  mr          User          @relation(fields: [mrId], references: [id])
  category    String        // travel, food, lodging, misc
  amount      Decimal
  receiptUrl  String?
  description String?
  status      ExpenseStatus @default(PENDING)
  reviewedBy  String?
  reviewNote  String?
  createdAt   DateTime      @default(now())
}
```

---

## 5. API Contract (REST, versioned `/api/v1`)

**Auth**
- `POST /auth/register` (admin-only, creates MR/Manager)
- `POST /auth/login` → `{ accessToken, refreshToken, user }`
- `POST /auth/refresh`
- `POST /auth/logout`

**MR endpoints**
- `POST /visits/checkin` — `{ doctorId, lat, lng }`
- `PATCH /visits/:id/checkout` — `{ productsDiscussed, samplesGiven, feedback, photoUrl }`
- `GET /visits/me?from=&to=`
- `POST /tour-plans` — submit weekly plan
- `GET /tour-plans/me`
- `POST /expenses` — submit claim
- `GET /expenses/me`
- `GET /doctors?search=&region=` — doctor directory for check-in selection
- `GET /dashboard/me` — own KPIs (visits this week, target vs achieved, pending approvals)

**Manager/Admin endpoints**
- `GET /team` — list MRs under manager
- `GET /tour-plans?status=PENDING&mrId=`
- `PATCH /tour-plans/:id/approve` / `/reject`
- `GET /expenses?status=PENDING`
- `PATCH /expenses/:id/approve` / `/reject`
- `GET /analytics/coverage?region=&from=&to=` — doctor coverage ratio, visit frequency
- `GET /analytics/samples` — sample distribution by product/region
- `GET /analytics/team-performance`
- `POST /doctors`, `PUT /doctors/:id` — master data CRUD (admin)
- `POST /products`, `PUT /products/:id` — master data CRUD (admin)

All list endpoints support `?page=&limit=` pagination and return `{ data, meta: { total, page, limit } }`.

---

## 6. Frontend — Screens

### MR App (mobile-first)
1. Login
2. Home / Today's Plan (list of scheduled doctor visits)
3. Check-In screen (doctor search/select → capture GPS → confirm)
4. Daily Call Report form (products discussed, samples given, feedback, optional photo) → Check-Out
5. Tour Plan Builder (calendar/week view, select doctors per day, submit for approval)
6. Expense Claim form (category, amount, receipt upload)
7. My Performance (visits done vs target, approval status of plans/expenses)
8. Profile / Settings

### Manager Dashboard (desktop-first)
1. Login
2. Overview Dashboard — team visits today, pending approvals count, coverage KPI cards, charts (visits over time, sample distribution)
3. Approval Hub — tabs for Tour Plans / Expenses, table with approve/reject + note modal
4. Team Tracker — table/map view of MR check-ins (live-ish, polling every 30–60s), filter by MR/date
5. Doctor Coverage Report — table of doctors vs visit frequency, exportable to CSV
6. Master Data — manage Doctors, Products, MR accounts (admin only)
7. MR Detail Page — individual rep's history, visits, plans, expenses

---

## 7. Non-Functional Requirements

- **Security:** bcrypt password hashing, JWT with short-lived access token + refresh rotation, input validation (Zod) on every endpoint, rate limiting on auth routes, HTTPS only in production, role middleware on every protected route.
- **Performance:** paginate all list views, index `Visit.mrId`, `Visit.checkInTime`, `TourPlan.status`, `Expense.status` in Postgres.
- **Mobile:** MR app must work well on 3G/4G with a spotty connection — use optimistic UI updates and retry-on-failure for check-in submission.
- **Audit trail:** every approve/reject action logs `reviewedBy` + timestamp; never hard-delete records, use soft delete (`active`/`deletedAt`) where relevant.
- **Environments:** `.env` for local, staging, and production; never commit secrets.

---

## 8. Suggested Folder Structure

```
mr-reporting-system/
├── AGENT.md
├── apps/
│   ├── web/                  # React frontend (MR + Manager, role-based routing)
│   │   ├── src/
│   │   │   ├── features/
│   │   │   │   ├── auth/
│   │   │   │   ├── mr/
│   │   │   │   └── manager/
│   │   │   ├── components/ui/   # shadcn components
│   │   │   ├── lib/              # api client, hooks
│   │   │   └── routes/
│   │   └── vite.config.ts
│   └── api/                   # Express backend
│       ├── src/
│       │   ├── modules/
│       │   │   ├── auth/
│       │   │   ├── visits/
│       │   │   ├── tourPlans/
│       │   │   ├── expenses/
│       │   │   ├── analytics/
│       │   │   └── masterData/
│       │   ├── middleware/
│       │   ├── prisma/
│       │   │   └── schema.prisma
│       │   └── server.ts
│       └── package.json
└── README.md
```

---

## 9. Build Workflow (Phased — follow in order)

**Phase 0 — Setup**
- Scaffold monorepo (`apps/web`, `apps/api`), init Git, set up Prisma + Postgres connection, configure env files.

**Phase 1 — Auth & Core Data**
- Implement User model, JWT auth (login/refresh/logout), role middleware.
- Seed script: 1 admin, 2 managers, 6 MRs, 20 sample doctors, 10 products.

**Phase 2 — MR Core Flow**
- Check-in/check-out API + UI, Daily Call Report form, doctor search.
- This is the highest-value flow — get it fully working and tested before moving on.

**Phase 3 — Tour Plans & Expenses**
- MR submission forms + Manager approval hub (both API and UI together, since they're two sides of the same feature).

**Phase 4 — Manager Analytics Dashboard**
- Coverage ratio, sample distribution, team performance charts (use Recharts).
- Team tracker table/map view.

**Phase 5 — Master Data & Admin**
- Doctor/Product/User CRUD screens (admin only).

**Phase 6 — Polish**
- Mobile responsiveness pass on MR app, loading/error states everywhere, empty states, form validation messages, toast notifications.

**Phase 7 — Testing & Hardening**
- API tests for auth, check-in, approval flows. Manual QA on both roles end-to-end.

**Phase 8 — Deployment**
- Deploy DB (Neon/Railway) → deploy API (Render/Railway) → deploy frontend (Vercel), set production env vars, smoke test all flows in production, hand off credentials + a short admin guide to the client.

---

## 10. Deliverables Checklist (for client handoff)

- [ ] Working production URL for Manager Dashboard
- [ ] Working production URL for MR App (mobile-tested)
- [ ] Admin login credentials
- [ ] Database hosted + backed up
- [ ] Source code repo (GitHub) transferred to client
- [ ] Short user guide (1-2 pages) for Manager and MR roles
- [ ] `.env.example` documented for future maintenance
