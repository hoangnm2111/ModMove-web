# ModMove Web – Page Inventory (Phase 2)

Explored on 2026-11-12 with Playwright (Chrome, 1440×900, plus 390×844 for responsive checks) against FE `localhost:3000` and BE `localhost:5133`.
Screenshots: `D:\Do_AN\.playwright-mcp\shots\` (g = Guest, c = Customer, d = Driver, p = Dispatcher, a = Admin).

Status: **VERIFIED** = opened in the browser. **SOURCE** = only confirmed in source code; the state could not be reached without creating or changing data. **NOT VERIFIED** = neither.

## Shared layout (all signed-in roles)
- Left sidebar (288 px, collapsible): logo + role badge (TÀI XẾ / ĐIỀU PHỐI / ADMIN), user card, grouped nav items with count badges, Đăng xuất at the bottom.
- Page header: title + subtitle, right-side actions (Làm mới, Xuất Excel, primary CTA).
- Mobile (<1024 px): sidebar becomes a drawer opened from a hamburger in a top bar.
- Shared components: Card (title + actions), StatusPill, KV row, DataTable, Tabs (underline), Search input, Select, Date input, Empty state, Error state with "Thử lại", Banner (info / warning / success / error), Modal (sm / md / lg), Drawer (right, 768 px), PhotoGrid, StatusTimeline, MapEmbed, Toast.

## Guest (public)
| # | Page | Route | Purpose | Key UI | Interactions | States | Status |
|---|---|---|---|---|---|---|---|
| G1 | Landing | `/` | Introduce the service, quick fare estimate | Top nav, hero carousel (5 slides), estimate card (vehicle tabs, 2 address inputs, price), about, benefits, vehicle cards, 4-step process, footer | Bảng giá dropdown → modal Giá theo loại xe / Loại hàng hoá; Chính sách modal; Đăng ký / Đăng nhập / Giao hàng ngay | Policy items have no content (descriptions are null) | VERIFIED |
| G2 | Sign in | `/login` | Sign in for every role | Split card (dark brand panel + form), tabs, email/phone, password, demo accounts | Quên mật khẩu → modal + OTP modal | Disabled submit while empty, error banner | VERIFIED (OTP modal: SOURCE) |
| G3 | Register | `/register` (`/login` tab) | Customer self-registration | Full name, phone, email, password ×2 | Send email OTP → OTP modal (6 digits, countdown, resend) | Field validation errors | VERIFIED (OTP: SOURCE) |
| G4 | Booking (draft) | `/booking` | Guest can draft an order; sign-in needed to submit | Same as C1 with "Bạn đang lập đơn nháp" note | — | — | VERIFIED |

## Customer
| # | Page | Route | Purpose | Key UI | Interactions | States | Status |
|---|---|---|---|---|---|---|---|
| C1 | Booking wizard | `/booking` | 4-step order creation | Stepper; Step 1 route (pickup/drop-off cards, address suggest), Step 2 cargo (type chips, description, count, weight, L×W×H, photos 1–5, note, prohibited-goods commitment), Step 3 vehicle cards (unfit ones disabled), Step 4 loading service, coupon input + list, PayOS/COD, agreements; right: fare estimate + route map | Next/back, address suggest, "Xem danh mục" modal, coupon apply, submit | Validation per step, fare error banner | VERIFIED (submit not pressed) |
| C2 | My orders | `/orders` | Order list | Tabs (Tất cả / Đang thực hiện / Hoàn thành / Đã huỷ / Lịch sử), search, status select, date range, receiver-phone filter, Xoá lọc, order cards, pagination | Open detail, Đặt đơn mới | Empty "Không có dữ liệu phù hợp" | VERIFIED |
| C3 | Order detail | `/orders/:id` | Full order view + next action | Header (back, code, status, payment pill, Làm mới), 7-step progress, status banner with actions, live driver tracking (ETA, GPS, map), pickup/POD evidence, route & cargo, incidents, complaints & refunds, status history; right: driver, receiver, fare & payment, Đặt lại đơn tương tự | Confirm received, complaint, report incident, refund request, payout account, cancel, pay PayOS, approve/reject pickup photos, rating | Delivered / Completed / Arrived / InTransit / Cancelled VERIFIED; Pending, Accepted, PickedUp-awaiting-approval, PayOS awaiting payment: SOURCE (no such order in the data) | VERIFIED + SOURCE |
| C3a | Complaint modal | (dialog) | Complaint within 24 h | Info banner, reason, description, amount, photos, bank, account no., holder | Submit | — | VERIFIED |
| C3b | Report incident modal | (dialog) | Report a trip incident | Quick reason chips, description, photos, send location | Submit | — | VERIFIED |
| C3c | Incident refund modal | (dialog) | Refund linked to an incident | Reason, amount, photos, payout account | Submit | — | VERIFIED |
| C3d | Cancel / Reject pickup / Rating / Reply info / Payout account / PayOS | (dialogs) | — | — | — | — | SOURCE |
| C4 | Live tracking | `/tracking` | Track active orders | Active order list; status card or driver tracking map; order summary + driver card | Select order, Chi tiết & thao tác | — | VERIFIED |
| C5 | My ratings | `/ratings` | Ratings sent | Summary (avg, stars, distribution), rating cards | Open order | — | VERIFIED |
| C6 | Profile & security | `/profile` | Account | Personal info, change password, delete account (password) | Save, change password, delete | — | VERIFIED |

## Driver (web companion; trips run in the mobile app)
| # | Page | Route | Purpose | Key UI | Interactions | States | Status |
|---|---|---|---|---|---|---|---|
| D1 | Nearby jobs | `/driver` | Eligibility + pending orders nearby | Online toggle, eligibility checklist (4 checks), GPS card, active-order banner, job list | Toggle online, refresh, open job → modal "Nhận đơn" | Not eligible empty state VERIFIED; job cards + accept modal SOURCE | VERIFIED + SOURCE |
| D2 | Current trip | `/driver/trip` | Active order + trip steps | Warning banner, order card, 7 steps "Thực hiện trên app" | — | Banner text outdated ("Backend chưa có API") | VERIFIED |
| D3 | My incidents | `/driver/incidents` | Incidents of the driver's orders | Tabs (5), warning banner, table (id, order, type, reporter, status, blocks trip, time) | Row → drawer (info, description + photos, dispatcher decision) | — | VERIFIED |
| D4 | Wallet & earnings | `/driver/earnings` | Two-wallet balance | 4 stat cards, pending-withdrawal banner, wallet rules, payout account, transactions table | — | — | VERIFIED |
| D5 | Profile & vehicle | `/driver/profile` | Onboarding status | Status card, submitted info form, 7 document photos, delete account | Submit/resubmit (when allowed) | Approved VERIFIED; Pending/Rejected/Not submitted SOURCE | VERIFIED + SOURCE |

## Dispatcher
| # | Page | Route | Purpose | Key UI | Interactions | States | Status |
|---|---|---|---|---|---|---|---|
| P1 | Operations monitoring | `/dispatcher/live-map` | All orders + online drivers | 9 status counters, 3 driver counters, orders table (search, date range, pagination), online-driver map/list | Row → order drawer (customer, driver, route map, fare, timeline, cargo & evidence, incidents "Mở xử lý", history) | Table columns are cramped at 1440 | VERIFIED |
| P2 | Incidents | `/dispatcher/incidents` | Handle incidents | Tabs (Mới / Đang xử lý / Đã xử lý / Đã huỷ / Tất cả), type select, search, table | Row → incident drawer: Nhận xử lý, Huỷ sự cố, Cho tiếp tục chuyến, Đổi tài xế (modal with candidate list), Huỷ đơn (modal with refund option), refund info / propose | Connection-error state seen in the reassign modal | VERIFIED |
| P3 | Complaints | `/dispatcher/complaints` | Review complaints | Tabs (6), search, table | Row → drawer (complaint, order, parties, evidence, history; actions when open) | Empty state VERIFIED; open-complaint actions SOURCE | VERIFIED + SOURCE |
| P4 | Handled cases | `/dispatcher/handled-cases` | Decisions by me | Tabs (5), table | Open order | Status column shows raw enums (InProgress, Processed…) | VERIFIED |
| P5 | Profile & security | `/dispatcher/profile` | Account | Same as C6 without delete account | — | — | VERIFIED |

## Administrator
| # | Page | Route | Purpose | Key UI | Interactions | States | Status |
|---|---|---|---|---|---|---|---|
| A1 | Dashboard & revenue | `/admin/dashboard` | Revenue and operations | Period chips (7 ngày / 30 ngày / Tháng này / Tháng trước / Tuỳ chọn), Xuất Excel, 4 to-do tiles, 8 KPI cards, daily bar chart (3 metrics), 3 breakdown cards, completed-orders table, platform scale | Change period, metric, export | — | VERIFIED |
| A2 | Driver applications | `/admin/drivers` | Review onboarding | Pending list, application detail, document grid, submission history | Duyệt (browser confirm), Từ chối → modal (11 item checkboxes + reason) | — | VERIFIED (approve not pressed) |
| A3 | Refunds & complaints | `/admin/refunds` | Approve and pay refunds | Tabs (6), source select, search, table | Row → drawer (amounts, reason & evidence, order, parties, payout account) → Từ chối / Duyệt | Reason code shown raw (CHANGED_PLAN) | VERIFIED |
| A4 | Withdrawals | `/admin/withdrawals` | Driver withdrawals | Tabs (4), search, info banner, table | Row → drawer → Từ chối / Đã chuyển khoản (modal: bank reference) | — | VERIFIED |
| A5 | Users & roles | `/admin/users` | Manage accounts | Search, role select, status select, table, Tạo tài khoản điều phối viên (modal) | Row → drawer (profile, order stats, driver info) → Vô hiệu hoá / Khoá (modal with reason) | — | VERIFIED |
| A6 | Pricing & commission | `/admin/pricing` | Fares and settings | Formula banner, vehicle fare table (Sửa giá modal with preview, Tắt), platform settings form | Save | — | VERIFIED |
| A7 | Coupons | `/admin/coupons` | Coupon codes | Tabs (3), table with usage bar, Tạo mã mới modal | Tắt / Bật | — | VERIFIED |
| A8 | Master data | `/admin/master-data` | Lookups and content | 7 category tabs with counts, search, info banner, table, Thêm mục / Sửa modal | Tắt / Bật | — | VERIFIED |
| A9 | Profile & security | `/admin/profile` | Account | Same as P5 | — | — | VERIFIED (same component) |

## Totals
| Role | Pages (routes) | Dialogs / drawers |
|---|---|---|
| Guest | 4 | 5 |
| Customer | 6 | 10 |
| Driver | 5 | 2 |
| Dispatcher | 5 | 7 |
| Administrator | 9 | 9 |

## Issues found during exploration (keep the meaning, fix in the redesign)
1. Policy items in the landing "Chính sách" modal open nothing: every policy description is empty (`null`).
2. The overlay of every Modal leaves a white 16–20 px strip at the top of the viewport.
3. Driver "Chuyến hiện tại" still says the back end has no trip API (it has one now).
4. Driver profile still shows 7 documents incl. two CCCD photos; the back end now uses 5.
5. Dispatcher "Lịch sử xử lý" shows raw enums (InProgress, Processed, Resolved, Rejected, Cancelled, Complaint, `[Cargo: ReturnToPickup]`).
6. Admin refund drawer shows the raw reason code `CHANGED_PLAN`.
7. Dispatcher monitoring table is too narrow at 1440 px (driver names wrap, route and fare columns cut off).
8. Admin sidebar label "Duyệt hoàn tiền & khiếu nại" is truncated.
9. Driver wallet bottom banner has two info icons.
10. Dead code: `features/orders/OrderActionModals.tsx`, `features/payment/PayOsModal.tsx`, `features/driver/JobAlertModal.tsx`, `pages/driver/DriverTripHistoryPage.tsx` are not used by any route.
