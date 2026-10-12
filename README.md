# đŸ’» ModMove - Web Management Portal

[![Web CI Pipeline (ReactJS)](https://github.com/hoangnm2111/ModMove-web/actions/workflows/web-ci.yml/badge.svg)](https://github.com/hoangnm2111/ModMove-web/actions/workflows/web-ci.yml)

Operations and management web portal built with **ReactJS** for the **ModMove On-Demand Moving and Delivery Application** (Capstone Project SEP490 - Team G121), supporting two operational roles:

1. **Dispatcher**: Real-time trip monitoring map, live active orders overview, incident handling, emergency driver reassignment, and dispute resolution.
2. **Administrator**: Platform metrics dashboard (revenue, total orders, driver activity), base fare & distance rate configurations, driver document verification (Approve/Reject), and user account management.

---

## đŸ› ï¸ Technology Stack
- **Framework:** React 18+ (Vite / TypeScript)
- **UI & Components:** Tailwind CSS / Ant Design
- **Real-Time Monitoring:** SignalR / WebSocket client for active driver markers
- **Map Visualization:** Google Maps JavaScript API
- **Charts & Metrics:** Recharts / Chart.js

---

## đŸŒ¿ GitFlow & Contribution Rules
- `main`: Production-ready branch. Direct push is prohibited.
- `develop`: Primary integration branch.
- `feature/<name>`: Individual feature branch (e.g., `feature/trink`).
- `release/<version>`: Stabilization branch before release into `main`.
- **Commit Convention:** `[TICKET-ID] <type>: <short description>`
  - Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`
  - Example: `[FE-10] feat: create dispatcher live map with driver status markers`
- **Quality Gates:** All Pull Requests to `develop` must pass Web CI checks and receive at least 1 peer approval.