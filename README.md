# 💻 ModMove - Web Management Portal

[![Web CI Pipeline (ReactJS)](https://github.com/hoangnm2111/ModMove-web/actions/workflows/web-ci.yml/badge.svg)](https://github.com/hoangnm2111/ModMove-web/actions/workflows/web-ci.yml)

Operations and management web portal built with **ReactJS** for the **ModMove On-Demand Moving and Delivery Application** (Capstone Project SEP490 - Team G121), supporting two operational roles:

1. **Dispatcher**: Real-time trip monitoring map, live active orders overview, incident handling, emergency driver reassignment, and dispute resolution.
2. **Administrator**: Platform metrics dashboard (revenue, total orders, driver activity), base fare & distance rate configurations, driver document verification (Approve/Reject), and user account management.

---

## 🛠️ Technology Stack
- **Framework:** React 18+ (Vite / TypeScript)
- **UI & Components:** Tailwind CSS / Ant Design
- **Real-Time Monitoring:** SignalR / WebSocket client for active driver markers
- **Map Visualization:** Google Maps JavaScript API
- **Charts & Metrics:** Recharts / Chart.js

---

## 🧱 Frontend Architecture

Requests flow in one direction: **Page → hook → service → (mock | API)**. Business rules live only in `domain/`, never in components.

```
src/
├─ config/business.ts     # SRS parameters (commission 10%, PayOS TTL 10 min, matching 10 min, OTP, photo limits…)
├─ constants/messages.ts  # System messages MSG01–MSG68 → msg('MSG36', { order_id })
├─ domain/                # Pure logic, no React: pricing (GB-29/14/21), orderRules (GB-18/20/22/26/31),
│                         # vehicleFit (GB-10), validators (GB-06/53)
├─ services/              # One service per resource, async signatures matching the future REST API
│  ├─ mock/storage.ts     # localStorage persistence + change events (used until the backend is ready)
│  └─ *.service.ts        # auth, order, case (incident/refund), wallet, driver, catalog, map
├─ hooks/                 # useLiveData / useDomainData / useDriverContext: read services, auto-refresh
├─ store/                 # Zustand: session (useAuthStore), booking draft (useBookingDraftStore), driver UI
├─ components/ui/         # Modal, Field, PhotoUploader, StatusBadge, toast / confirm / Banner
├─ features/              # Feature components: booking wizard steps, order action modals, PayOS, job alert
├─ layouts/               # One layout per role, rendering <SuspenseOutlet />
├─ pages/                 # Screens grouped by role (lazy-loaded in routes/AppRoutes.tsx)
└─ routes/AppRoutes.tsx   # Nested routes + role guards (RequireRole, GuestOrCustomer)
```

**Connecting the backend:** replace the body of each `*.service.ts` function with an `apiClient` call (`services/api.ts` already attaches the JWT and logs out on 401). Signatures stay the same, so pages need no changes. Scheduled jobs (JOB-MATCH-01, JOB-PAY-01, JOB-ORDER-01) are simulated in `order.service.ts#runScheduledJobs` and must move to the server.

**Demo mode** (`npm run dev` or `VITE_DEMO_MODE=true`): one-click sign-in for 4 accounts (password `Modmove@123`), OTP code shown on screen, mock PayOS "I have paid" button. Clear `localStorage` keys starting with `modmove:v4:` to reset the data.

---

## 🌿 GitFlow & Contribution Rules
- `main`: Production-ready branch. Direct push is prohibited.
- `develop`: Primary integration branch.
- `feature/<name>`: Individual feature branch (e.g., `feature/trink`).
- `release/<version>`: Stabilization branch before release into `main`.
- **Commit Convention:** `[TICKET-ID] <type>: <short description>`
  - Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`
  - Example: `[FE-10] feat: create dispatcher live map with driver status markers`
- **Quality Gates:** All Pull Requests to `develop` must pass Web CI checks and receive at least 1 peer approval.
