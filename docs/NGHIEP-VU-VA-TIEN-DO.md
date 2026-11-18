# ModMove — Tổng hợp nghiệp vụ theo role và tình trạng hoàn thành

> Ngày rà soát: 2026-11-08
> Nguồn đối chiếu:
> - **Yêu cầu:** `Report-3_Software Requirement Specification.docx` (110 use case, 53 business rule GB-01..GB-53, 8 business flow BF-01..BF-08)
> - **Quyết định nhóm (ghi đè SRS khi khác):** `ModMove-backend/docs/DECISIONS.md`
> - **Tiến độ do nhóm tự ghi:** `ModMove-backend/docs/TEAM-PLAN.md`
> - **Code thật:** `ModMove-backend/src` (controllers, `Features/*`, domain, background jobs) và `ModMove-web/src` (routes, pages, services)
>
> Nguyên tắc: trạng thái dưới đây lấy từ **code**, không lấy từ memory hay comment.

## Cập nhật 2026-11-08 – làm lại FE web theo API backend (không sửa BE)

Lớp API mới `ModMove-web/src/api/` (`types.ts` khớp 1-1 DTO BE, `endpoints.ts` một hàm/endpoint, `errors.ts` dịch `code` lỗi sang tiếng Việt). Các mục trước đây 🟡 vì **FE thiếu** nay đã xong:

| Mục | Trước | Nay |
|---|---|---|
| GST-14 chọn coupon | nhập tay | ✅ danh sách mã khả dụng ở bước thanh toán |
| CUS-10 chi tiết đơn (tài xế, ảnh, timeline, payment) | thiếu tài xế | ✅ trang `/orders/:id` dùng `GET customer/Orders/{id}` |
| CUS-12/19/21 duyệt ảnh, xác nhận nhận hàng **hoặc** khiếu nại (đếm ngược 24h) | thiếu nhánh khiếu nại cạnh xác nhận | ✅ |
| CUS-13/14 tracking | mock | ✅ REST `tracking` (60s) + Google Maps nhúng; SignalR vẫn chưa |
| CUS-26 đánh giá của tôi | 🟡 | ✅ `/ratings` |
| DIS-01 giám sát (summary, lọc, chi tiết đơn) | 🟡 | ✅ |
| DIS-08/09/14/17 hoàn tiền **sự cố** | 🟡 | ✅ trong drawer sự cố |
| ADM-05 chi tiết user | 🟡 | ✅ |
| ADM-09 từ chối theo từng mục | 1 lý do | ✅ nhiều lý do |
| ADM-14/15/16 master data | 🟡 | ✅ đủ 6 nhóm |
| ADM-17/18 hoàn tiền | gộp chung trang rút tiền | ✅ trang riêng `/admin/refunds` |
| ADM-22 dashboard | số hard-code | ✅ KPI + biểu đồ từ dữ liệu thật (vẫn không có số tài xế online vì BE không có API cho Admin) |
| Driver: GPS từ web | không gửi | ✅ `POST driver/location` khi Online |
| Driver: hồ sơ gửi base64 + trùng ảnh mặt trước | lỗi | ✅ nhập URL ảnh http(s), đúng 5 ảnh theo thứ tự |
| Customer gọi `admin/Pricing` (403) | lỗi | ✅ chỉ Admin gọi |
| Dispatcher layout gọi `customer/Refunds` (403) | lỗi | ✅ đếm khiếu nại từ API Dispatcher |

**Vẫn chưa làm được vì BE chưa có API** (không đổi): toàn bộ mục ❌ ở mục 4.3, 4.4, ADM-19, ADM-20, GB-51, GB-52; upload ảnh cho role Driver; SignalR phía web (chưa cài `@microsoft/signalr`).

## Chú thích trạng thái

| Ký hiệu | Ý nghĩa |
|---|---|
| ✅ | Có BE (endpoint + handler) **và** FE web gọi API thật |
| 🟡 | Có một phần: BE xong nhưng FE chưa gọi / FE còn mock / thiếu một nhánh nghiệp vụ |
| ❌ | **Chưa có BE** (không có endpoint/handler) — tính năng chưa chạy được ở bất kỳ client nào |
| 📱 | Thuộc app mobile (Flutter, không nằm trong repo này). Vẫn **cần BE** của repo này |
| ⛔ | Bỏ theo quyết định nhóm (DECISIONS.md) — không cần làm |

---

## 0. Tóm tắt nhanh

| Role | Tổng UC (SRS) | ✅ | 🟡 | ❌ | 📱 | ⛔ |
|---|---|---|---|---|---|---|
| Guest | 17 | 14 | 3 | 0 | 0 | 0 |
| Customer | 29 | 25 | 3 | 0 | 0 | 1 |
| Driver | 23 | 8 | 4 | 9 | 2 | 0 |
| Dispatcher | 17 | 11 | 6 | 0 | 0 | 0 |
| Administrator | 24 | 16 | 5 | 3 | 0 | 0 |
| **Tổng** | **110** | **74** | **21** | **12** | **2** | **1** |

> Ngoài 110 UC, còn các nghiệp vụ không đánh số trong SRS nhưng chưa có: xem chuyến hiện tại / lịch sử chuyến của tài xế, upload ảnh cho tài xế, GB-51, GB-52 (chi tiết ở mục 4 và 8).

**Các lỗ hổng lớn nhất (theo mức độ ảnh hưởng):**

1. **❌ Luồng thực hiện chuyến của tài xế chưa có BE** (DRV-12, 13, 15, 16, 17, 18, 19). Domain đã có hàm `ShippingOrder.ConfirmArrival / ConfirmPickup / Deliver` nhưng **không có Command/handler/endpoint** nào gọi. Hệ quả: không đơn nào đi được từ `Accepted` → `Arrived` → `PickedUp` → `InTransit` → `Delivered` qua API ⇒ các luồng phía sau (khách duyệt ảnh, xác nhận nhận hàng, khiếu nại, đánh giá, tất toán ví) chỉ test được bằng dữ liệu seed. TEAM-PLAN mục 5 Phase 2 "Trips" vẫn `[ ]`.
   > Lưu ý: comment trong FE (`order.service.ts`, `wallet.service.ts`) và memory ghi "dành cho app di động" — đúng là tài xế dùng app (C11), nhưng **app mobile cũng gọi chính backend này**, nên đây là phần BE **còn thiếu**, không phải "by design".
2. **❌ Ví tài xế phía Driver chưa có BE**: xem ví & lịch sử giao dịch (DRV-20), tạo link nạp cọc PayOS (DRV-21), tạo yêu cầu rút tiền (DRV-22), báo cáo thu nhập (DRV-23). Domain có `DriverWallet.TopUpDeposit / RequestWithdrawal`, webhook đã xử lý top-up, nhưng không có endpoint tạo. ⇒ Admin duyệt rút tiền (ADM-24) không bao giờ có dữ liệu thật ngoài seed.
3. **❌ Tài xế báo sự cố (DRV-18)**: chỉ có `ReportIncidentByCustomer`. Các luật GB-07 (hàng cấm), GB-35 (khách vắng mặt), GB-11 (5 lần bị từ chối ảnh), GB-40 (người nhận không trả tiền) đều dựa vào việc **tài xế** báo sự cố ⇒ chưa chạy được.
4. **🟡 FE: Google Maps phía client chưa tích hợp** — `map.service.ts` là mock (gợi ý 12 địa chỉ mẫu Hà Nội; ước tính nhanh ở Landing = chim bay × 1.35). Giá ở màn đặt đơn **vẫn thật** vì BE tự geocode từ địa chỉ (`IMapService`).
5. **🟡 FE: SignalR chưa tích hợp** — không có package `@microsoft/signalr`; tracking khách và bản đồ Dispatcher dùng polling REST 30s. Thông báo `NotificationReceived` (B17) không hiển thị trên web.
6. **🟡 FE Admin thiếu màn hình Master Data thật** — trang "Danh mục hệ thống" chỉ có tab Loại xe + Coupon; **không quản lý được** chính sách, giới thiệu dịch vụ, loại hàng, lý do hủy, lý do khiếu nại (BE `api/admin/MasterData` đã đủ CRUD + status).
7. **❌ Admin: không có BE** cho xem đánh giá (ADM-19), lịch sử sự cố/đổi tài xế (ADM-20); Dashboard (ADM-22) chỉ dựng từ báo cáo doanh thu, còn số liệu hard-code ("Tỷ lệ giao hàng thành công: 98.2%").

---

## 1. Luồng nghiệp vụ chính (Business Flow) và trạng thái đơn

### 1.1 Vòng đời đơn hàng (`OrderStatus`)

```
Pending ──(tài xế nhận, GB-08)──> Accepted ──(đến điểm lấy, GB-52)──> Arrived
   │                                 │                                   │
   │ khách hủy (GB-22)               │ khách hủy (GB-22)                 │ tài xế gửi 2–5 ảnh (GB-11)
   │ job hết 10' (GB-24)             │                                   v
   │ job PayOS 30' (GB-13)           │                               PickedUp ──(khách duyệt ảnh, GB-26)──> InTransit
   v                                 v                                   ^  │ khách từ chối → gửi lại (≤5 lần)
Cancelled <──────── Dispatcher hủy do sự cố (GB-17, GB-35, GB-38) ───────┘  │
                                                                             v
                                         Delivered ──(khách xác nhận / job 24h, GB-23)──> Completed
                                         (ảnh POD bắt buộc, GB-12)            (tất toán hoa hồng & ví, GB-14/15)
                                         khiếu nại ≤24h (GB-18) chặn hoàn tất (7.3)
Đổi tài xế (GB-37): đơn quay về Accepted, tài xế mới đếm lại ảnh.
```

| Chuyển trạng thái | Ai | BE | Ghi chú |
|---|---|---|---|
| Tạo đơn → `Pending` | Customer | ✅ `POST customer/Orders` | Cash hiện ngay; PayOS chỉ hiện khi `Paid` (GB-31) |
| `Pending` → `Accepted` | Driver | ✅ `POST driver/Matching/orders/{id}/accept` | First-accept-wins, chốt `commission_rate` |
| `Accepted` → `Arrived` | Driver | ❌ | Domain `ConfirmArrival` có, không có endpoint |
| `Arrived` → `PickedUp` (gửi ảnh) | Driver | ❌ | Domain `ConfirmPickup` có, không có endpoint |
| `PickedUp` → `InTransit` | Customer duyệt ảnh | ✅ `POST customer/Orders/{id}/pickup-evidence` | |
| `InTransit` → `Delivered` (POD) | Driver | ❌ | Domain `Deliver` có, không có endpoint |
| `Delivered` → `Completed` | Customer / JOB-ORDER-01 | ✅ `confirm-receipt` + `AutoCompleteDeliveredOrdersJob` | Bỏ qua đơn có khiếu nại mở |
| → `Cancelled` | Customer / Job / Dispatcher | ✅ | `CancelOrder`, `CancelUnmatchedOrdersJob`, `ExpireStalePaymentsJob`, `CancelOrderByIncident` |

### 1.2 Business Flow BF-01..BF-08

| BF | Luồng | Trạng thái | Chỗ hổng |
|---|---|---|---|
| BF-01 | Đăng ký khách hàng (OTP email) | ✅ | — |
| BF-02 | Onboarding & duyệt tài xế | ✅ | Đăng ký tài xế (`register-driver`) chỉ cho app (B6); phía web chỉ nộp hồ sơ |
| BF-03 | Tạo đơn vận chuyển | ✅ | BE đủ; FE chỉ còn gợi ý địa chỉ mock (giá tính ở BE) |
| BF-04 | Tài xế kiểm hàng, khách duyệt khởi hành | 🟡 | Khách duyệt ✅; **tài xế đến nơi + gửi ảnh ❌** |
| BF-05 | Giao hàng & xử lý sự cố | 🟡 | Dispatcher xử lý ✅; **tài xế giao POD ❌, tài xế báo sự cố ❌** |
| BF-06 | Thanh toán PayOS & tiền mặt | 🟡 | PayOS đơn hàng ✅ (cần key); **xác nhận thu COD ❌**; hóa đơn điện tử ⛔ (B15) |
| BF-07 | Khiếu nại | ✅ | Khách → Dispatcher → Admin đủ |
| BF-08 | Hoàn tiền | ✅ | Cancellation tự động, Incident/Complaint qua Dispatcher; chi trả tay (GB-27). FE Dispatcher thiếu nhánh hoàn tiền **sự cố** (xem DIS-08/09) |

---

## 2. GUEST (khách chưa đăng nhập)

Kênh: Web (React). Đặt nháp đơn được, submit phải đăng nhập (GB-28).

| UC | Nghiệp vụ | BE | FE web | Trạng thái |
|---|---|---|---|---|
| GST-01 | Đăng ký Customer: họ tên, SĐT, email, mật khẩu → OTP email. Email/SĐT unique (GB-01), OTP 6 số, 5', 3 lần/15', sai 5 lần thì hủy (GB-25), mật khẩu 8–100 ký tự BCrypt (GB-53), verify kèm đúng mật khẩu (A-02) | `POST public/Auth/register`, `verify-email`, `otp/resend` | `LoginPage` (tab đăng ký) | ✅ |
| GST-02 | Xem loại xe (tải trọng, kích thước thùng) | `GET public/VehicleTypes` | Landing, Booking | ✅ |
| GST-03 | Xem giới thiệu dịch vụ | `GET public/ServiceInfo` | Landing | ✅ |
| GST-04 | Xem chính sách (bảo hành, hoàn tiền, điều khoản, riêng tư) | `GET public/Policies` | `PolicyModals` | ✅ |
| GST-05 | Gửi yêu cầu hỗ trợ | — | — | ⛔ Bỏ (BE DECISIONS 2.9, B14, 2026-11-18) |
| GST-06 | Tạo nháp đơn (1 điểm lấy, 1 điểm giao — GB-05) | — (client) | `BookingPage` + `useBookingDraftStore` | ✅ |
| GST-07 | Chọn điểm lấy | `IMapService` (BE) | `AddressInput` — **gợi ý địa chỉ mock** | 🟡 |
| GST-08 | Chọn điểm giao | như trên | như trên | 🟡 (gộp với GST-07) |
| GST-09 | Nhập tên + SĐT người nhận | trong CreateOrder | `RouteStep` | ✅ |
| GST-10 | Khai báo hàng: loại hàng (mã master data `CARGO_TYPE`), số lượng, tổng kg, kích thước món lớn nhất, 1–5 ảnh JPG/PNG ≤5MB (GB-06) | `GET public/Lookups/cargo-types`, `POST customer/Uploads` | `CargoStep`, `PhotoUploader` | ✅ (upload cần Cloudinary key) |
| GST-11 | Chọn loại xe phù hợp: tổng kg ≤ tải trọng, món lớn nhất lọt thùng khi xoay (GB-10) | `FareEstimate` kiểm `VehicleType.CanCarry` | `VehicleStep` | ✅ |
| GST-12 | Thêm dịch vụ bốc xếp (`LOADING_FEE`) | trong FareEstimate | `PaymentStep` | ✅ |
| GST-13 | Xem giá ước tính: `max(MinFare, Base + PricePerKm×km) + LOADING_FEE − coupon ≥ 0` (GB-29) | `POST public/FareEstimate` | `FareSummary` | ✅ FE gửi địa chỉ, BE tự geocode + tính km bằng Google Maps (cần key BE) |
| GST-14 | Chọn coupon (hiệu lực, giá trị tối thiểu, giới hạn tổng lượt — GB-21) | trong FareEstimate + `GET customer/Coupons` | Ô nhập mã tay; **hook `useCustomerCoupons` có nhưng không trang nào dùng** | ✅ (nhập mã) |
| GST-15 | Chọn thanh toán: PayOS hoặc Cash (người gửi trả khi lấy / người nhận trả khi giao) | trong CreateOrder | `PaymentStep` | ✅ |
| GST-16 | Đồng ý chính sách bảo hành + cam kết không hàng cấm (GB-07) | trong CreateOrder | `PaymentStep` checkbox | ✅ |
| GST-17 | Đăng nhập & gửi đơn. Mã đơn `MMyyyyMMddNNN`, `expectedTotalFee` lệch → 422 `FARE_CHANGED` (4.4), coupon `used_count++` cùng transaction (B11) | `POST customer/Orders` | `BookingPage` | ✅ |

---

## 3. CUSTOMER

Kênh: Web + app mobile. Chỉ thao tác trên đơn của mình (GB-50, `ORDER_NOT_YOURS`).

### 3.1 Tài khoản

| UC | Nghiệp vụ | BE | FE web | Trạng thái |
|---|---|---|---|---|
| CUS-01 | Đăng nhập. Chưa verify email → 403 (GB-44); sai 5 lần khóa 10' (GB-02); sai email/mật khẩu/khóa tạm cùng 1 lỗi 401 (A-01); access 15', refresh 30 ngày xoay vòng (GB-47) | `POST public/Auth/login`, `refresh` | `LoginPage`, `api.ts` single-flight refresh | ✅ |
| CUS-02 | Quên mật khẩu: OTP → mật khẩu mới, thu hồi mọi phiên | `forgot-password`, `reset-password` | `LoginPage` | ✅ |
| CUS-03 | Đăng xuất (thu hồi phiên thiết bị này; app gửi kèm FCM token, 9.2) | `POST account/Logout` | Layout | ✅ |
| CUS-04 | Đổi mật khẩu (thu hồi mọi phiên) | `POST account/Password` | `ProfilePage` | ✅ |
| CUS-05 | Xem hồ sơ | `GET account/Profile` | `ProfilePage` | ✅ |
| CUS-06 | Sửa hồ sơ (họ tên, SĐT unique) | `PUT account/Profile` | `ProfilePage` | ✅ |
| CUS-07 | Xóa tài khoản = `Inactive`, chặn khi còn đơn mở / hoàn tiền mở (B8) | `DELETE customer/Account` | `ProfilePage` | ✅ |

### 3.2 Đơn hàng

| UC | Nghiệp vụ | BE | FE web | Trạng thái |
|---|---|---|---|---|
| CUS-08 | Danh sách đơn, lọc theo trạng thái | `GET customer/Orders` | `OrdersPage` | ✅ |
| CUS-09 | Tìm đơn theo thời gian/trạng thái | `GET customer/Orders` (query) | `OrdersPage` lọc phía client (`TIME_RANGES`) | ✅ |
| CUS-10 | Chi tiết đơn: thông tin, trạng thái, tài xế, payment | `GET customer/Orders/{id}` | `OrdersPage`, `LiveTrackingPage` | ✅ |
| CUS-11 | Xem ảnh hàng tài xế chụp lúc lấy | trong chi tiết đơn | `LiveTrackingPage` | ✅ (nhưng chưa có ảnh thật vì DRV-13 ❌) |
| CUS-12 | Duyệt / từ chối ảnh lấy hàng (từ chối kèm lý do, tối đa 5 lần gửi — GB-11, GB-26) | `POST customer/Orders/{id}/pickup-evidence` | `LiveTrackingPage` | ✅ |
| CUS-13 | Theo dõi vị trí tài xế + ETA (vị trí >30s là stale, GB-39) | `GET customer/Orders/{id}/tracking`; SignalR `JoinOrder` | `LiveTrackingPage` **poll REST 30s, chưa dùng SignalR** | 🟡 |
| CUS-14 | Xem tiến trình: accepted → arrived → picked up → in transit → delivered | trong chi tiết đơn; SignalR `OrderStatusChanged` | `LiveTrackingPage` (poll) | 🟡 (không realtime) |
| CUS-19 | Xác nhận đã nhận hàng → `Completed`, tất toán; khiếu nại mở thì 409 `COMPLAINT_OPEN` (7.3); xác nhận xong mất quyền khiếu nại (GB-18) | `POST customer/Orders/{id}/confirm-receipt` | `OrdersPage`, `LiveTrackingPage` | ✅ |
| CUS-20 | Lịch sử chuyến đã hoàn tất | `GET customer/Orders?view=...` | `OrdersPage` | ✅ |
| CUS-27 | Thanh toán PayOS: mã sống 10' (GB-13), tạo lại mã cho cùng đơn, đơn chưa trả sau 30' tự hủy; `platform=Web|App`, server chọn returnUrl (3.1); **chỉ tin webhook** | `POST customer/Orders/{id}/payment`, `POST webhooks/PayOs` | `PayOsModal` (Booking, Orders, Tracking) | ✅ (cần PayOS key) |
| CUS-28 | Sửa đơn | — | — | ⛔ (4.1: hủy rồi tạo lại) |
| CUS-29 | Hủy đơn: chỉ khi `Pending`/`Accepted`, miễn phí, lý do theo mã `CANCELLATION_REASON` (`OTHER` phải ghi lý do); PayOS đã trả → tự tạo refund Cancellation 100% sang Admin (GB-41) | `POST customer/Orders/{id}/cancel` | `CancelOrderModal` | ✅ |

### 3.3 Sự cố, hoàn tiền, khiếu nại

| UC | Nghiệp vụ | BE | FE web | Trạng thái |
|---|---|---|---|---|
| CUS-15 | Báo sự cố khi đơn `Arrived`/`PickedUp`/`InTransit` (loại: hỏng hàng, trễ, sai tuyến → `Other`, 7.1) + ảnh | `POST customer/Incidents` | `IncidentReportModal` | ✅ |
| CUS-16 | Xem kết quả xử lý sự cố | `GET customer/Incidents` | `useDomainData.loadMyIncidents` → `OrdersPage` | ✅ |
| CUS-17 | Yêu cầu hoàn tiền cho sự cố: chỉ đơn PayOS đã `Paid`, số tiền >0 và ≤ `total_fee`, tổng hoàn của đơn ≤ `total_fee` (B9, GB-42), 1 yêu cầu mở / sự cố | `POST customer/Refunds/incidents` | `IncidentReportModal` | ✅ |
| CUS-18 | Upload bằng chứng hoàn tiền | `POST customer/Uploads` | `PhotoUploader` | ✅ |
| CUS-21 | Khiếu nại: đơn `Delivered` ≤ 24h, 1 khiếu nại mở / đơn, lý do theo mã `COMPLAINT_REASON` | `POST customer/Refunds/complaints` | `ComplaintModal` | ✅ |
| CUS-22 | Upload bằng chứng khiếu nại | `POST customer/Uploads` | `ComplaintModal` | ✅ |
| CUS-23 | Xem kết quả khiếu nại (thấy `decisionReason` của Admin, không thấy ghi chú nội bộ của Dispatcher) | `GET customer/Refunds`, `GET customer/Refunds/{id}` | `OrdersPage` (`useRefunds`) | ✅ |
| CUS-24 | Rút khiếu nại / hoàn sự cố khi còn `Requested` (refund Cancellation không rút được) | `POST customer/Refunds/{id}/withdraw` | `OrdersPage` | ✅ |
| (DIS-14) | Trả lời yêu cầu bổ sung thông tin: 1 đoạn chữ + ảnh, tổng ≤5 ảnh (GB-43) | `POST customer/Refunds/{id}/reply` | `ReplyInfoModal` | ✅ |

### 3.4 Đánh giá

| UC | Nghiệp vụ | BE | FE web | Trạng thái |
|---|---|---|---|---|
| CUS-25 | Đánh giá 1–5 sao + nhận xét, 1 lần, trong 1 ngày sau `Completed`, không sửa (GB-20) | `POST customer/Ratings` | `RatingModal` | ✅ |
| CUS-26 | Xem các đánh giá đã gửi | `GET customer/Ratings` | **FE không gọi, không có màn hình** | 🟡 |

---

## 4. DRIVER

Kênh theo C11: **app mobile Flutter** (không có trong repo). Web có một bộ trang `/driver/*` để xem/tạm dùng. Cả app và web đều dùng backend này.

### 4.1 Tài khoản & onboarding

| UC | Nghiệp vụ | BE | FE web | Trạng thái |
|---|---|---|---|---|
| (BF-02) | Đăng ký tài khoản tài xế (chỉ app, B6) | `POST public/Auth/register-driver` | — (đúng thiết kế) | ✅ 📱 |
| DRV-01 | Đăng nhập | `public/Auth/login` | `LoginPage` | ✅ |
| DRV-02 | Đăng xuất | `account/Logout` | `DriverLayout` | ✅ |
| DRV-03 | Nộp hồ sơ: CCCD, số bằng lái, biển số, tải trọng, kích thước thùng + đúng 5 ảnh (bằng trước/sau, đăng ký xe, đăng kiểm, ảnh xe); CCCD/bằng/biển số unique (GB-04) | `POST driver/Onboarding` | `DriverProfilePage` | 🟡 BE ✅. **FE lỗi:** (1) ảnh đọc bằng `FileReader.readAsDataURL` rồi gửi thẳng base64 làm `documentUrls`, không upload lên Cloudinary; (2) `driver.service.ts:167` gửi `licensePhotoUrl` **hai lần** (mặt trước thay cho mặt sau, sai D10). BE cũng **không có endpoint upload cho role Driver** (`UploadsController` nằm trong `Controllers/Customer` → chỉ Customer) |
| DRV-04 | Theo dõi trạng thái duyệt (Pending/Approved/Rejected + lý do) | `GET driver/Onboarding/status`, `GET driver/status` | `DriverProfilePage`, `DriverLayout` | ✅ |
| DRV-05 | Sửa & nộp lại khi bị từ chối → version mới; Pending thì read-only | `POST driver/Onboarding` (`NextVersionNumber`) | `DriverProfilePage` | ✅ |
| DRV-06 | Xem hồ sơ tài xế + xe | `GET account/Profile` + onboarding status | `DriverProfilePage` | ✅ |
| DRV-07 | Cập nhật hồ sơ: thông tin cá nhân, **avatar**, **thông tin xe** | Chỉ `PUT account/Profile` (họ tên, SĐT). Không có endpoint avatar / sửa xe ngoài việc nộp hồ sơ mới | — | 🟡 |
| GB-51 | Bằng lái / đăng ký xe hết hạn → không được Online | **Không có trường/kiểm tra hạn giấy tờ** | — | ❌ |

### 4.2 Nhận đơn

| UC | Nghiệp vụ | BE | FE web | Trạng thái |
|---|---|---|---|---|
| (GB-03) | Bật/tắt Online: chỉ khi Approved + Active | `PATCH driver/online-status` | `DriverJobListPage` | ✅ |
| (GB-39) | Gửi GPS mỗi 5s; >5' không gửi thì ẩn khỏi map và không thấy đơn mới | `POST driver/location`, SignalR `SendLocation` | **Web không gửi vị trí** ⇒ trên web tài xế không có vị trí ⇒ danh sách đơn gần có thể rỗng | ✅ BE / 📱 |
| DRV-08 | Xem đơn `Pending` trong `MATCHING_RADIUS_KM` (5km), đúng loại xe, gần nhất trước; PayOS chỉ khi `Paid`; Cash cần ví cọc ≥ `MIN_COD_DEPOSIT` và ≥ hoa hồng đơn (GB-16); không có đơn đang chạy (GB-09) | `GET driver/Matching/orders` | `DriverJobListPage`, `JobAlertModal` | ✅ |
| DRV-09 | Chi tiết đơn: điểm lấy/giao, km, cước, thanh toán, ghi chú | trong danh sách | `JobAlertModal` | ✅ |
| DRV-10 | Nhận đơn (first wins, cùng transaction), chốt `commission_rate`, báo khách `OrderAccepted` | `POST driver/Matching/orders/{id}/accept` | `useAcceptJob` | ✅ |

### 4.3 Thực hiện chuyến — **phần thiếu lớn nhất**

| UC | Nghiệp vụ | BE | FE web | Trạng thái |
|---|---|---|---|---|
| — | Xem đơn đang chạy của tài xế | **Không có endpoint** "đơn hiện tại của tôi" | `useDriverContext.activeTrip` **luôn `undefined`** ⇒ `DriverHomePage` không bao giờ hiện chuyến | ❌ |
| DRV-11 | Dẫn đường tới điểm lấy (Google Maps) | — (client) | — | 📱 |
| DRV-12 | Xác nhận đến điểm lấy → `Arrived`, trong `ARRIVAL_RADIUS` 500m (GB-52), báo khách `DriverArrived` | **Không có handler/endpoint**; GB-52 chưa có code | `markArrived` throw lỗi | ❌ |
| DRV-13 | Kiểm hàng, gửi 2–5 ảnh → `PickedUp`, chờ khách duyệt; tối đa 5 lần gửi (GB-11); báo khách `PickupPhotosToReview` | **Không có handler/endpoint** (domain `ConfirmPickup` có) | `submitPickupEvidence` throw | ❌ |
| DRV-14 | Dẫn đường tới điểm giao | — (client) | — | 📱 |
| DRV-15 | Báo đã tới điểm giao (không đổi trạng thái) | **Không có** | — | ❌ |
| DRV-16 | Gửi ảnh POD → `Delivered` (kể cả khi không có người nhận, 2.7), trong 500m (GB-52), báo khách `OrderDelivered` | **Không có handler/endpoint** (domain `Deliver` có) | `markDelivered` throw | ❌ |
| DRV-17 | Xác nhận đã thu COD (người gửi lúc `Arrived` / người nhận lúc giao) | **Không có** | `confirmCashCollected` throw | ❌ |
| DRV-18 | Báo sự cố giữa đường (hỏng xe, hỏng hàng, tai nạn, khác) + ảnh + GPS. Dùng cho: hàng cấm (GB-07), khách vắng mặt chờ 15' (GB-35), bị từ chối ảnh 5 lần (GB-11), người nhận không trả (GB-40), hàng trên xe sau hủy (2.6) | **Không có** (chỉ có `ReportIncidentByCustomer`) | `DriverHomePage` gọi `caseService.reportIncident` → `POST customer/Incidents` ⇒ **sai role, sẽ 403** | ❌ |
| DRV-19 | Nhận quyết định sự cố (tiếp tục / đổi tài xế / hủy) | Thông báo qua `INotificationService` khi Dispatcher xử lý ✅; **không có API tài xế xem lịch sử sự cố** | `DriverIncidentsPage` không gọi API nào (chỉ `useDriverContext`) | 🟡 |
| GB-36 | Tài xế không tự hủy đơn đã nhận | Không có endpoint hủy cho tài xế (đúng) | — | ✅ |
| — | Lịch sử chuyến của tài xế | **Không có endpoint** | `DriverTripHistoryPage` không gọi API | ❌ |

### 4.4 Ví & thu nhập

Luật: hai số dư (GB-32). `DepositBalance`: nạp ≥ 50.000đ/lần (5.2), chỉ bị trừ hoa hồng đơn cash (GB-15), không rút, được âm. `EarningsBalance`: nhận thu nhập đơn PayOS, rút không tối thiểu, 1 yêu cầu Pending/lần, trả nợ ví cọc trước (5.1).

| UC | Nghiệp vụ | BE | FE web | Trạng thái |
|---|---|---|---|---|
| DRV-20 | Xem số dư ví cọc / thu nhập (+ lịch sử giao dịch) | Số dư có trong `GET driver/status`; **không có API lịch sử giao dịch** | `DriverEarningsPage` (giao dịch luôn rỗng) | 🟡 |
| DRV-21 | Nạp cọc qua PayOS (≥50.000đ, mã 10') | **Không có endpoint tạo link**; webhook đã có nhánh `TopUpDeposit` | `topUpDeposit` throw | ❌ (TEAM-PLAN `[ ]`) |
| DRV-22 | Yêu cầu rút thu nhập về ngân hàng | **Không có endpoint** (domain `RequestWithdrawal` có) | `requestWithdrawal` throw | ❌ |
| DRV-23 | Báo cáo thu nhập theo ngày/tuần/tháng (cước, hoa hồng, số chuyến) | **Không có endpoint** | `DriverEarningsPage` có UI `PERIODS` nhưng không có dữ liệu | ❌ |

---

## 5. DISPATCHER

Kênh: Web. Chỉ Dispatcher được đổi tài xế / hủy đơn sau sự cố (GB-17).

| UC | Nghiệp vụ | BE | FE web | Trạng thái |
|---|---|---|---|---|
| DIS-02 | Đăng nhập console | `public/Auth/login` | `LoginPage` | ✅ |
| DIS-01 | Giám sát mọi đơn Pending→Completed, lọc trạng thái, xem tài xế Online trên map, mở chi tiết đơn | `GET dispatcher/Orders`, `GET dispatcher/Orders/summary`, `GET dispatcher/Orders/{id}`, `GET dispatcher/Drivers/online`, SignalR group `dispatchers` | `LiveMapPage` dùng list đơn + tài xế online (poll 30s). **Không gọi `Orders/{id}` và `Orders/summary`** (hook `useDispatcherSummary` có nhưng không dùng); **không SignalR** | 🟡 |
| DIS-03 | Danh sách sự cố | `GET dispatcher/Incidents` | `IncidentsPage` | ✅ |
| DIS-04 | Chi tiết sự cố: mô tả, ảnh, GPS, đơn, tài xế, khách | `GET dispatcher/Incidents/{id}` | `IncidentsPage` | ✅ |
| — | Nhận xử lý sự cố (`Open` → `InProgress`) | `POST dispatcher/Incidents/{id}/start` | `IncidentsPage` | ✅ |
| DIS-05 | Quyết định: tiếp tục chuyến / đổi tài xế / hủy đơn, báo cả 2 bên | `POST .../resolve` (continue) | `IncidentsPage` | ✅ |
| DIS-06 | Đổi tài xế: tài xế mới đủ điều kiện như B5 + GB-16 nếu cash; đơn về `Accepted`, đếm lại ảnh; tài xế mới nhận toàn bộ thu nhập (GB-37) | `GET .../replacement-drivers`, `POST .../reassign` | `IncidentsPage` | ✅ |
| DIS-07 | Hủy đơn do sự cố: hàng cấm / khách vắng mặt → không hoàn; không có tài xế thay → PayOS hoàn 100% (GB-38); quyết định hàng trên xe trả về hay giữ (2.6) | `POST .../cancel-order` | `IncidentsPage` | 🟡 TEAM-PLAN còn `[ ]`: xử lý **mọi** khoản hoàn đang mở của đơn & tự đóng các sự cố khác (B9). Code hiện chỉ đóng refund `Incident` đang `Requested` |
| DIS-08 | Xem xét yêu cầu hoàn tiền (đối chiếu ảnh lấy hàng, báo cáo sự cố, POD) | Complaint: `GET dispatcher/Complaints/{id}`; Incident refund: trong chi tiết sự cố | Complaint ✅; **hoàn tiền sự cố: FE không có UI** | 🟡 |
| DIS-09 | Đề xuất hoàn tiền (toàn phần / một phần / không), `proposed ≤ requested` | Incident: `POST dispatcher/Incidents/{id}/refund/proposal` | **FE không gọi** | 🟡 |
| DIS-10 | Hủy sự cố (không có lý do hợp lệ) | `POST dispatcher/Incidents/{id}/cancel` | `IncidentsPage` | ✅ |
| DIS-11 | Danh sách khiếu nại | `GET dispatcher/Complaints` | `DispatcherComplaintsPage` | ✅ |
| DIS-12 | Chi tiết khiếu nại | `GET dispatcher/Complaints/{id}` | Dùng dữ liệu từ list (không gọi detail) | ✅ (kiểm tra list có đủ ảnh bằng chứng) |
| DIS-13 | Đối chiếu bằng chứng (ảnh lấy hàng, POD, đánh giá) | trong chi tiết | `DispatcherComplaintsPage` | ✅ |
| DIS-14 | Xin thêm thông tin từ khách → `WaitingForCustomer` | Complaint `POST .../request-info` ✅; Incident refund `POST dispatcher/Incidents/{id}/refund/request-info` | Complaint ✅; **Incident refund: FE không gọi** | ✅ / 🟡 |
| DIS-15 | Đề xuất giải quyết khiếu nại gửi Admin | `POST dispatcher/Complaints/{id}/proposal` | `DispatcherComplaintsPage` | ✅ |
| DIS-16 | Ca đã xử lý của tôi | `GET dispatcher/handled-cases` | `DispatcherHandledCasesPage` | ✅ |
| DIS-17 | Gửi đề xuất lên Admin | (chính là DIS-09/15) | | ✅ (complaint) / 🟡 (incident) |

---

## 6. ADMINISTRATOR

Kênh: Web.

### 6.1 Tài khoản

| UC | Nghiệp vụ | BE | FE web | Trạng thái |
|---|---|---|---|---|
| ADM-01 | Đăng nhập | `public/Auth/login` | `LoginPage` | ✅ |
| ADM-02 | Sửa hồ sơ admin | `PUT account/Profile` | `ProfilePage` | ✅ |
| ADM-03 | Đổi mật khẩu | `POST account/Password` | `ProfilePage` | ✅ |
| ADM-04 | Danh sách user: tìm, lọc | `GET admin/Users` | `AdminUsersPage` | ✅ |
| ADM-05 | Chi tiết user: hồ sơ, lịch sử đơn, hoạt động | `GET admin/Users/{id}` | **FE không gọi** (chỉ hiện dữ liệu từ list) | 🟡 |
| ADM-06 | Đổi trạng thái: Active / Inactive / Locked; khóa → thu hồi mọi phiên (GB-46, GB-47) | `PATCH admin/Users/{id}/status` | `AdminUsersPage` | ✅ |
| ADM-07 | Tạo tài khoản Dispatcher (mật khẩu cố định, B7) | `POST admin/Users/dispatchers` | `AdminUsersPage` | ✅ |

### 6.2 Duyệt tài xế

| UC | Nghiệp vụ | BE | FE web | Trạng thái |
|---|---|---|---|---|
| ADM-08 | Danh sách hồ sơ chờ duyệt (kể cả nộp lại) | `GET admin/driver-applications/pending` | `DriverApprovalPage` | ✅ (chỉ xem Pending; không có lịch sử hồ sơ đã duyệt/từ chối) |
| ADM-09 | Duyệt (tạo `driver_wallets` lần đầu) hoặc từ chối **kèm lý do cho từng mục** | `GET .../{id}`, `POST .../approve`, `POST .../reject` (`reasons[]`) | `DriverApprovalPage` | 🟡 FE chỉ gửi **một** lý do (`reasons: [reason]`) |

### 6.3 Giá, hoa hồng, danh mục, coupon

| UC | Nghiệp vụ | BE | FE web | Trạng thái |
|---|---|---|---|---|
| ADM-10 | Xem cấu hình giá | `GET admin/Pricing` | `AdminPricingPage` | ✅ |
| ADM-11 | Giá theo loại xe: base, /km, tối thiểu; bật/tắt loại xe. Giá mới áp cho đơn tạo sau (GB-33) | `PUT admin/Pricing/vehicletypes/{id}`, `PATCH .../status` | `AdminPricingPage`, `AdminMasterDataPage` (tab xe) | ✅ |
| ADM-12 | Phí dịch vụ thêm: chỉ `LOADING_FEE` (không giờ cao điểm/cồng kềnh — B2) | `PUT admin/Pricing/settings` | `AdminPricingPage` | ✅ |
| ADM-13 | Hoa hồng `COMMISSION_RATE` (mặc định 10%); **chặn sửa khi có đơn từ Accepted tới trước Delivered** (C8). Cùng màn: `MIN_COD_DEPOSIT`, `MATCHING_RADIUS_KM` | `PUT admin/Pricing/settings` | `AdminPricingPage` | ✅ |
| ADM-14 | Danh sách master data (chính sách, giới thiệu, loại hàng, lý do hủy, lý do khiếu nại…) | `GET admin/MasterData` | **Không có** — trang "Danh mục hệ thống" chỉ có tab Loại xe + Coupon | 🟡 |
| ADM-15 | Thêm / sửa master data (nội dung chính sách ở `description`, B13) | `POST admin/MasterData`, `PUT admin/MasterData/{id}` | **Không có** | 🟡 |
| ADM-16 | Bật / tắt master data | `PATCH admin/MasterData/{id}/status` | **Không có** | 🟡 |
| (GB-21) | Coupon: tạo, bật/tắt (hiệu lực, giá trị tối thiểu, tổng lượt) | `GET/POST admin/Coupons`, `PATCH .../status`. **Không có sửa/xóa coupon** | `AdminMasterDataPage` (tab coupon) | ✅ |

### 6.4 Hoàn tiền, khiếu nại, rút tiền

| UC | Nghiệp vụ | BE | FE web | Trạng thái |
|---|---|---|---|---|
| ADM-17 | Xem khiếu nại / hoàn tiền + ảnh bằng chứng | `GET admin/Refunds`, `GET admin/Refunds/{id}` | `AdminWithdrawalsPage` (tab hoàn tiền) — **không gọi detail** | ✅ |
| ADM-18 | Duyệt / từ chối số tiền đề xuất (ghi chú cho khách không bắt buộc), kiểm tổng hoàn ≤ `total_fee` (B9); chi trả tay kèm mã giao dịch ngân hàng trong 3 ngày (GB-27); báo khách `RefundDecided` | `POST .../approve`, `.../reject`, `.../payout` | `AdminWithdrawalsPage` | ✅ |
| ADM-24 | Duyệt rút tiền tài xế: chuyển tay + mã ngân hàng, hoặc từ chối (chỉ hoàn số đã xin rút, 5.1) | `GET admin/Withdrawals`, `GET .../{id}`, `POST .../approve`, `.../reject` | `AdminWithdrawalsPage` | ✅ (nhưng không có dữ liệu thật vì DRV-22 ❌) |

### 6.5 Báo cáo, giám sát

| UC | Nghiệp vụ | BE | FE web | Trạng thái |
|---|---|---|---|---|
| ADM-19 | Xem đánh giá của khách (sao, nhận xét theo tài xế) | **Không có endpoint admin** | — | ❌ |
| ADM-20 | Lịch sử sự cố đã xử lý + log đổi tài xế | **Không có endpoint admin** (chỉ Dispatcher xem được) | — | ❌ |
| ADM-21 | Doanh thu nền tảng = tổng `commission_amount` đơn `Completed`, theo giờ VN, theo ngày/tuần/tháng (8.1) | `GET admin/Reports/revenue` | `DashboardPage` | ✅ |
| ADM-22 | Dashboard: doanh thu, số chuyến, **số tài xế đang hoạt động** | Không có endpoint dashboard riêng; dùng lại báo cáo doanh thu; **không có số fleet** | `DashboardPage`: KPI từ revenue report, biểu đồ theo loại xe tính client; **"Tỷ lệ giao hàng thành công: 98.2%" hard-code** | ❌ / 🟡 |
| ADM-23 | Xuất báo cáo Excel (doanh thu ròng, chuyến hoàn thành, tối đa 12 tháng) | `GET admin/Reports/revenue/export` | `DashboardPage` (modal export) | ✅ |

---

## 7. Background job & tích hợp ngoài

| Thành phần | Nghiệp vụ | Trạng thái |
|---|---|---|
| JOB-PAY-01 `ExpireStalePaymentsJob` (mỗi phút) | Mã PayOS hết hạn 10'; đơn PayOS `Unpaid` sau 30' → hủy | ✅ |
| JOB-MATCH-01 `CancelUnmatchedOrdersJob` | Đơn không ai nhận sau 10' (cash từ lúc tạo, PayOS từ lúc trả) → hủy, PayOS tự tạo refund 100% | ✅ |
| JOB-ORDER-01 `AutoCompleteDeliveredOrdersJob` | `Delivered` 24h → `Completed` + tất toán, bỏ qua đơn có khiếu nại mở | ✅ |
| JOB-GPS-01 `GpsLogCleanupJob` (24h) | Xóa GPS log >30 ngày | ✅ |
| Webhook PayOS | Kiểm chữ ký, idempotent, đối soát số tiền, `MarkPaid`, cộng ví cọc khi top-up; tiền tới sau khi đơn đã hủy → refund (GB-41) | ✅ |
| Thông báo (FCM + SignalR `NotificationReceived`, B17) | Khách: nhận đơn ✅, hủy tự động ✅, hoàn tất ✅, kết quả sự cố ✅, kết quả hoàn tiền ✅; **đến điểm lấy / ảnh chờ duyệt / đã giao ❌** (vì chưa có các bước đó). Tài xế: kết quả duyệt hồ sơ, quyết định sự cố, khách báo sự cố, đánh giá mới, kết quả rút tiền ✅; **"đơn mới gần bạn"** — chưa xác minh | 🟡 (TEAM-PLAN mục 5 Phase 3 `[ ]`) |
| Google Maps | BE ✅ (`IMapService`); **FE mock** | 🟡 |
| Cloudinary | BE ✅ (`POST customer/Uploads`); cần key | ✅ |
| PayOS | BE ✅; cần key | ✅ |
| Gmail SMTP | BE ✅ (Dev không có SMTP thì log OTP) | ✅ |
| SignalR `/hubs/tracking` | BE ✅ (`JoinOrder`, `SendLocation`, `LocationUpdated`, `OrderStatusChanged`); **FE web chưa kết nối** | 🟡 |
| Bảng mã lỗi đầy đủ cho FE (`api/README.md`, 9.4) | TEAM-PLAN `[ ]` | 🟡 |

---

## 8. Business rule chưa được thực thi

| Rule | Nội dung | Tình trạng |
|---|---|---|
| GB-07 | Tài xế phát hiện hàng cấm → báo sự cố → hủy không hoàn | Nhánh Dispatcher có; **tài xế không báo được** (DRV-18 ❌) |
| GB-11 | Tối đa 5 lần gửi ảnh lấy hàng | Domain có đếm; **không có endpoint gửi ảnh** |
| GB-12 | Delivered bắt buộc có ảnh POD | Domain có; **không có endpoint** |
| GB-15 | Trừ hoa hồng đơn cash vào ví cọc khi hoàn tất | ✅ trong `OrderSettlement` (nhưng đơn cash không tới được `Delivered` qua API) |
| GB-35 | Khách vắng mặt ở điểm lấy → chờ 15' → báo sự cố | Phụ thuộc DRV-12, DRV-18 ❌ |
| GB-40 | Người nhận không trả COD | Phụ thuộc DRV-17, DRV-18 ❌ |
| GB-51 | Giấy tờ hết hạn thì không được Online | **Không có trường ngày hết hạn, không kiểm tra** ❌ |
| GB-52 | Đến nơi / giao hàng chỉ trong bán kính 500m | **Không có code** ❌ |
| B9 | Hủy do sự cố xử lý mọi khoản hoàn mở của đơn, tự đóng sự cố khác | Một phần (TEAM-PLAN `[ ]`) 🟡 |

Các rule còn lại (GB-01..06, 08..10, 13, 14, 16..34, 36..39, 41..50, 53) đã có trong BE (validator/entity/job).

---

## 9. Việc cần làm (ưu tiên)

### P0 — chặn luồng chính
1. **BE `Features/Trips`** (Hoàng): `GET driver/Trips/current`, `POST driver/Trips/{id}/arrived` (GB-52), `POST .../pickup-evidence` (2–5 ảnh, GB-11), `POST .../arrived-destination`, `POST .../deliver` (POD, GB-12, GB-52), `POST .../cash-collected` (DRV-17); gửi thông báo khách + `PublishOrderStatusAsync` (B12).
2. **BE upload ảnh cho tài xế**: hiện `POST customer/Uploads` chỉ cho Customer → thêm `POST driver/Uploads` (hồ sơ, ảnh lấy hàng, POD, sự cố). Sửa FE `DriverProfilePage` upload thật thay vì gửi base64, và gửi đúng ảnh mặt sau bằng lái (`driver.service.ts:167`).
3. **BE `ReportIncidentByDriver`** (DRV-18) + `GET driver/Incidents` (DRV-19).
4. **BE ví tài xế**: `GET driver/Wallet` (+ giao dịch), `POST driver/Wallet/top-up` (PayOS ≥50.000đ), `POST driver/Wallet/withdrawals`, `GET driver/Wallet/earnings?period=` (DRV-20..23); `GET driver/Trips` (lịch sử).

### P1 — FE web còn thiếu dù BE đã có
5. Admin: trang **Master Data** thật (ADM-14..16) — chính sách, giới thiệu, loại hàng, lý do hủy/khiếu nại.
6. Dispatcher: UI hoàn tiền **sự cố** (request-info + proposal, DIS-08/09/14/17).
7. Tích hợp **Google Maps** phía client vào `map.service.ts` (Places autocomplete, hiển thị bản đồ/tuyến).
8. Tích hợp **SignalR** (`@microsoft/signalr`): `LiveTrackingPage` (JoinOrder, LocationUpdated, OrderStatusChanged), `LiveMapPage` (group dispatchers), toast `NotificationReceived`.
9. Customer: màn "Đánh giá của tôi" (CUS-26); dùng `useCustomerCoupons` để chọn coupon (GST-14).
10. Admin: chi tiết user (ADM-05); từ chối hồ sơ tài xế với lý do theo từng mục (ADM-09).
11. Dispatcher: dùng `Orders/{id}` và `Orders/summary` (DIS-01).
12. Nối các trang driver web (`DriverHomePage`, `DriverTripHistoryPage`, `DriverIncidentsPage`, `DriverEarningsPage`) sau khi có API ở P0.

### P2 — hoàn thiện nghiệp vụ / báo cáo
13. BE admin: `GET admin/Ratings` (ADM-19), `GET admin/Incidents` + log đổi tài xế (ADM-20), `GET admin/Dashboard` (số chuyến, fleet online — ADM-22); bỏ số hard-code 98.2% ở FE.
14. GB-51: thêm ngày hết hạn bằng lái/đăng ký xe vào hồ sơ, chặn Online.
15. B9: hoàn thiện `CancelOrderByIncident` theo TEAM-PLAN.
16. DRV-07: cập nhật avatar.
17. Bảng mã lỗi đầy đủ trong `ModMove-backend/docs/api/README.md` (9.4).
