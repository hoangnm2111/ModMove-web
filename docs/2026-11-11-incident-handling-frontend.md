# Sự cố trong chuyến đi: việc cần sửa ở web và app

Ngày: 2026-11-11 · Plan backend: [2026-11-11-incident-handling-flow.md](2026-11-11-incident-handling-flow.md) · Repo: `ModMove-mobile` (Flutter), `ModMove-web` (React + Vite).

## 0. Luật FE phải theo

| # | Luật | FE làm gì |
|---|---|---|
| L1 | Sự cố **do tài xế đang giữ đơn báo**, còn `Open` hoặc `InProgress`, thì chuyến tạm dừng | App tài xế khóa các nút của chuyến; khách không duyệt được ảnh lấy hàng. Backend trả 422 `INCIDENT_PENDING` nếu vẫn gọi |
| L2 | Điều phối viên bấm "start" thì tài xế và khách nhận `INCIDENT_IN_PROGRESS` | Đổi banner sang "Đang xử lý" |
| L3 | Khách thấy nguyên văn mô tả và ảnh tài xế gửi | Thẻ sự cố của khách hiện đủ mô tả và ảnh của sự cố "Tài xế báo" |
| L4 | Khách vẫn báo sự cố, nhưng **không chặn chuyến**, và tài xế chỉ thấy câu chung | Form của khách khác form của tài xế; app tài xế chỉ hiện banner nhắc, không khóa nút |

Cách nhận biết, không cần trường mới:
- **Phía tài xế:** sự cố có `reportedByYou = true` là do tài xế báo; `false` là do khách báo (hoặc do tài xế trước, sau khi đổi tài xế).
- **Phía khách:** `reportedByYou = true` là "Bạn báo", `false` là "Tài xế báo".
- **Có đang bị chặn không:**
  - Tài xế: có sự cố `reportedByYou && status in (Open, InProgress)`.
  - Khách: `order.pendingDriverIncidentId != null` (trường mới).

## 1. API mà FE dùng

`(mới)` là phần backend sẽ thêm theo plan backend; FE làm được ngay trên phần đã có.

### Tài xế

| Method | Endpoint | Ghi chú |
|---|---|---|
| POST | `api/driver/incidents` | Body `{ orderId, incidentType, description, photoUrls?, latitude?, longitude? }` → 201 `{ incidentId }`. Lỗi: `INCIDENT_NOT_ALLOWED` (đơn không ở Accepted..InTransit), 429 |
| GET | `api/driver/incidents?orderId=&status=&page=&pageSize=` | `PagedResult<DriverIncidentResponse>` |
| GET | `api/driver/incidents/{id}` | `DriverIncidentResponse`; không phải của mình → 404 |
| GET | `api/driver/trips/active` | 200 `DriverTripDetailResponse` (có `incidents[]`) hoặc **204** khi không còn đơn (bị đổi tài xế, đơn bị hủy) |
| GET | `api/driver/trips/{id}` | Như trên |
| POST | `api/driver/trips/{id}/arrive` · `/pickup` · `/arrive-dropoff` · `/collect-cash` · `/deliver` | **(mới)** 422 `INCIDENT_PENDING` khi tài xế có sự cố mở |
| POST | `api/driver/uploads` | Upload ảnh (JPG/PNG ≤ 5 MB) → URL Cloudinary |

`DriverIncidentResponse`:
```ts
{ id, orderId, orderCode, orderStatus, incidentType, description, photoUrls[], latitude?, longitude?,
  reportedByYou, resolutionStatus, resolutionDecision?, resolutionNote?, createdAt, resolvedAt? }
```
Khi `reportedByYou = false`, `description` là câu chung "Khách hàng báo cáo sự cố, Điều phối viên đang xử lý.", và `photoUrls` rỗng.

### Khách

| Method | Endpoint | Ghi chú |
|---|---|---|
| POST | `api/customer/incidents` | Giữ nguyên. Body như tài xế. Chỉ khi đơn `Arrived`, `PickedUp`, `InTransit`; 10 request/phút |
| GET | `api/customer/incidents?page=&pageSize=` + **(mới)** `orderId`, `status` | `MyIncidentResponse` |
| GET | `api/customer/orders/{id}` | **(mới)** thêm `pendingDriverIncidentId: number \| null` |
| POST | `api/customer/orders/{id}/pickup-evidence` (`approve: true`) | **(mới)** 422 `INCIDENT_PENDING` khi tài xế có sự cố mở; `approve: false` vẫn được |
| POST | `api/customer/refunds/incidents` | Giữ nguyên |

### Điều phối viên

Không đổi API. `POST api/dispatcher/incidents/{id}/start` từ nay gửi thông báo cho tài xế và khách.

### Thông báo (FCM `data.type`, SignalR `NotificationReceived.type`)

| type | Ai nhận | `data` | FE làm gì |
|---|---|---|---|
| `INCIDENT_REPORTED` | Khách (khi tài xế báo); tài xế (khi khách báo) | `orderId`, `incidentId` | Tải lại chi tiết đơn hoặc chuyến |
| `INCIDENT_IN_PROGRESS` **(mới)** | Tài xế và khách | `orderId`, `incidentId` | Banner sang "Đang xử lý" |
| `INCIDENT_DECIDED` | Tài xế | `orderId`, `incidentId`, `decision` ∈ `ContinueTrip`, `ReassignDriver`, `CancelOrder`, `Cancelled` | Xử lý theo mục 2.5 |
| `INCIDENT_RESOLVED` | Khách | `orderId` | Tải lại chi tiết đơn |
| `ORDER_STATUS_CHANGED` (SignalR `OrderStatusChanged`) | Tài xế, người theo dõi đơn | `orderId`, `status` | Tải lại |

Hiện tại cả web và mobile **chưa nghe SignalR và chưa đăng ký FCM**. Cho tới khi làm mục 2.8 và 3.6, FE phải tự tải lại (mục 2.4).

### Nhãn và lỗi dùng chung

| Giá trị | Nhãn |
|---|---|
| `Open` | Đang chờ xử lý |
| `InProgress` | Điều phối viên đang xử lý |
| `Resolved` | Đã xử lý |
| `Cancelled` | Báo cáo đã bị hủy |
| `ContinueTrip` | Tiếp tục chuyến |
| `ReassignDriver` | Đổi tài xế |
| `CancelOrder` | Hủy đơn |
| `VehicleBreakdown` / `DamagedCargo` / `Accident` / `Other` | Hỏng xe / Hàng hư hỏng / Tai nạn / Khác |

| Mã lỗi | Tài xế | Khách |
|---|---|---|
| `INCIDENT_PENDING` **(mới)** | "Bạn đang có sự cố chờ điều phối viên xử lý." | "Tài xế đã báo sự cố, chuyến đang tạm dừng chờ điều phối viên." |
| `INCIDENT_NOT_ALLOWED` | "Chỉ báo sự cố khi đơn đang chạy." | "Chỉ báo sự cố khi tài xế đã đến điểm lấy, đã lấy hàng hoặc đang giao." (giữ) |

---

## 2. App tài xế (ModMove-mobile, `lib/features/driver_trip`)

Hiện trạng: cả app tài xế chạy trên `mock_driver_trip_repository.dart`. `reportIncident(String message)` chỉ nhận một dòng chữ, không có loại, ảnh hay GPS. Không có màn xem lại sự cố.

Phần sự cố làm qua một API riêng gọi `core/network/api_client.dart`, để không phải chờ cả repository thật của chuyến. Bản mock cũng cập nhật theo để test được giao diện.

### 2.1. Model và API

- `domain/entities/trip_models.dart`: thêm
  ```dart
  enum IncidentStatus { open, inProgress, resolved, cancelled }
  class TripIncident {
    final int id, orderId;
    final String orderCode, incidentType, description;
    final List<String> photoUrls;
    final bool reportedByYou;
    final IncidentStatus status;
    final String? decision, note;   // decision: ContinueTrip | ReassignDriver | CancelOrder
    final DateTime createdAt;
    final DateTime? resolvedAt;
    bool get isOpen => status == IncidentStatus.open || status == IncidentStatus.inProgress;
    bool get blocksTrip => reportedByYou && isOpen;   // L1
    factory TripIncident.fromJson(Map<String, dynamic> j);
  }
  ```
  `ActiveTrip`: thêm `List<TripIncident> incidents` và các getter `TripIncident? get blockingIncident`, `TripIncident? get customerOpenIncident`.
- `data/driver_incident_api.dart` (mới):
  - `Future<int> report({orderId, type, description, photoUrls, latitude, longitude})`
  - `Future<Paged<TripIncident>> list({int? orderId, String? status, int page = 1})`
  - `Future<TripIncident> detail(int id)`
- `domain/repositories/driver_trip_repository.dart`: đổi `Future<String> reportIncident(String message)` thành
  `Future<int> reportIncident(IncidentDraft draft)`, trong đó `IncidentDraft { type, description, photoUrls, gps }`.
- `mock_driver_trip_repository.dart`:
  - Lưu sự cố vào `trip.incidents`.
  - Thêm vào `TripSimulation` các thao tác giả lập: `dispatcherStarts`, `dispatcherContinues`, `dispatcherReassigns`, `dispatcherCancelsOrder`, `dispatcherDismisses`, `customerReportsIncident`, để thử đủ các trạng thái ở 2.5.

### 2.2. Form báo sự cố (`presentation/widgets/trip_contact_actions.dart`, `_IncidentDialog`)

- Loại sự cố, chọn một: Hỏng xe, Hàng hư hỏng, Tai nạn, Khác. Thêm lý do nhanh điền sẵn mô tả, đều dùng loại `Other`: "Khách vắng mặt", "Không liên lạc được khách", "Hàng không đúng mô tả", "Không lấy được hàng".
- Mô tả bắt buộc, tối đa 1000 ký tự.
- Ảnh tùy chọn (dùng lại `CargoPhotoRepository` và `upload`): JPG/PNG ≤ 5 MB, tối đa 5 ảnh.
- GPS lấy tự động từ fix hiện tại. Không có fix thì gửi `null`, backend tự lấy vị trí cuối.
- Trước nút gửi có cảnh báo: **"Sau khi gửi, chuyến sẽ tạm dừng đến khi điều phối viên xử lý."**
- Gửi thành công → snackbar "Đã gửi sự cố #id". Bloc tải lại chuyến để banner hiện ngay.

### 2.3. Khóa nút và banner (`active_trip_bloc.dart`, `active_trip_screen.dart`, `pickup_navigation_screen.dart`, `pickup_approval_screen.dart`, `cargo_inspection_screen.dart`, `widgets/trip_components.dart`)

- `ActiveTripState`: thêm `TripIncident? blockingIncident` và `TripIncident? customerIncident`, tính từ `session.trip.incidents`.
- Khi có `blockingIncident`:
  - **Tắt:** Đã đến điểm lấy, Gửi ảnh / kiểm hàng, Đã đến điểm giao, Thu tiền, Giao hàng.
  - **Vẫn bấm được:** Báo sự cố, Gọi khách, Mở chỉ đường, Xem chi tiết sự cố.
  - Banner cố định trên đầu màn chuyến (widget mới `IncidentBanner` trong `trip_components.dart`):
    - `Open`: "Đã gửi sự cố #id · Đang chờ điều phối viên", màu cảnh báo.
    - `InProgress`: "Điều phối viên đang xử lý sự cố #id", màu thông tin.
    - Bấm vào banner thì mở chi tiết sự cố (2.6).
- Khi chỉ có `customerIncident` (khách báo): banner nhắc "Khách đã báo sự cố, điều phối viên đang xử lý". **Không khóa nút.**
- Có cả hai thì banner của `blockingIncident` hiện trước.
- Gọi một bước mà nhận 422 `INCIDENT_PENDING` → hiện thông báo lỗi và tải lại chuyến (để khớp khi dữ liệu trên máy đã cũ).

### 2.4. Tự tải lại (chưa có thông báo đẩy)

- Có `blockingIncident` hoặc `customerIncident` thì tải lại `GET api/driver/trips/active` mỗi **15 giây**. Không còn sự cố mở thì dừng.
- Luôn tải lại khi app quay lại foreground (`setForeground(true)` đã có).
- Có FCM (2.8) thì giãn ra 60 giây hoặc bỏ.

### 2.5. Xử lý khi sự cố đóng

So trạng thái trước và sau mỗi lần tải lại, theo `incident.decision` hoặc `data.decision`:

| Kết quả | Dấu hiệu | App làm gì |
|---|---|---|
| ContinueTrip | sự cố `Resolved`, decision `ContinueTrip` | Tắt banner, hiện dialog "Điều phối viên: tiếp tục chuyến" + `note`, mở lại các nút |
| Báo cáo bị hủy | sự cố `Cancelled` | Tắt banner, hiện dialog "Báo cáo sự cố đã bị hủy" + `note`, mở lại các nút |
| ReassignDriver, tài xế cũ | `trips/active` trả 204 | Kết thúc chuyến, về màn chính, dialog "Đơn {code} đã chuyển cho tài xế khác" + `note` (lấy từ `GET api/driver/incidents/{id}`) |
| ReassignDriver, tài xế mới | nhận `INCIDENT_DECIDED`, hoặc `trips/active` trả một đơn mới | Mở màn chuyến của đơn đó; nếu `orderStatus` là `PickedUp` hoặc `InTransit` thì đi thẳng tới bước tương ứng |
| CancelOrder | `trips/active` trả 204, decision `CancelOrder` | Kết thúc chuyến, dialog "Đơn đã bị hủy do sự cố". Nếu `note` có `[Cargo: ReturnToPickup]` → "Hãy đưa hàng về điểm lấy"; còn giá trị khác thì hiện nguyên văn |

### 2.6. Màn "Sự cố của tôi" (mới, `presentation/screens/driver_incidents_screen.dart`)

- Mở từ menu tài xế (`driver_home_screen.dart` / `driver_dashboard.dart`) và từ banner.
- Danh sách: mã đơn, loại, nhãn "Bạn báo"/"Khách báo", trạng thái, thời gian. Lọc theo trạng thái. Kéo xuống để tải lại, phân trang 20.
- Chi tiết: mô tả, ảnh, vị trí, trạng thái, quyết định, ghi chú của điều phối viên, `resolvedAt`, trạng thái đơn hiện tại.

### 2.7. Lỗi

`core/network/api_exception.dart`: thêm `INCIDENT_PENDING`, sửa câu của `INCIDENT_NOT_ALLOWED` cho phía tài xế (mục 1).

### 2.8. Thông báo đẩy (khi bật FCM)

- Sau khi đăng nhập: `PUT api/account/fcm-token` với token của `firebase_messaging` (thêm package cần hỏi nhóm).
- Mở app từ thông báo, hoặc nhận khi đang mở:
  - `INCIDENT_REPORTED`, `INCIDENT_IN_PROGRESS`, `INCIDENT_DECIDED`, `ORDER_STATUS_CHANGED` → `repository.refresh()` rồi xử lý theo 2.5.
  - Mở từ thông báo sự cố thì vào chi tiết sự cố.

### 2.9. Test (`test/driver_trip`)

- `TripIncident.blocksTrip`: chỉ `true` khi `reportedByYou` và trạng thái Open/InProgress.
- Bloc:
  - Có sự cố tài xế mở → các nút chuyến tắt.
  - Chỉ có sự cố khách → nút vẫn bật, có banner nhắc.
  - `Open` → `InProgress` → banner đổi chữ.
  - `ContinueTrip` → nút bật lại.
  - Nhận 204 → về màn chính.
- Widget: form báo sự cố không gửi khi mô tả trống, có hiện cảnh báo tạm dừng.

---

## 3. App khách (ModMove-mobile, `lib/features/customer`)

Hiện trạng:
- Chi tiết đơn có `IncidentSheet` (báo sự cố) và `_IncidentsCard` (liệt kê, có "Bạn báo"/"Tài xế báo", mô tả, ảnh, kết quả, nút xin hoàn tiền).
- Danh sách sự cố được tải 50 cái rồi lọc theo `orderId` trên máy.
- Không có banner chặn và chưa khóa nút duyệt ảnh.

### 3.1. Model và API

- `domain/entities/customer_models.dart`:
  - `OrderDetail` thêm `int? pendingDriverIncidentId` (đọc `pendingDriverIncidentId`).
  - `MyIncident` giữ nguyên, đã có đủ trường.
- `data/customer_api.dart`: `incidents({int? orderId, String? status, int page = 1, int pageSize = 50})`.
- `presentation/order_detail/order_detail_cubit.dart`: gọi `api.incidents(orderId: orderId)`, bỏ việc lọc trên máy.

### 3.2. Form báo sự cố của khách (`presentation/order_detail/order_sheets.dart`, `IncidentSheet`)

- Thay các chip loại sự cố bằng **lý do nhanh** (bấm vào thì điền loại và câu mở đầu cho mô tả):

  | Lý do | `incidentType` |
  |---|---|
  | Hàng hư hỏng | `DamagedCargo` |
  | Tài xế đến trễ | `Other` |
  | Đi sai tuyến | `Other` |
  | Không liên lạc được tài xế / tài xế vắng mặt | `Other` |
  | Tai nạn | `Accident` |
  | Khác | `Other` |

- Mô tả bắt buộc (≤ 1000), ảnh tùy chọn (giữ `PhotoPicker`). Gửi kèm GPS nếu khách cho phép.
- Đổi `Notice` thành: "Điều phối viên sẽ kiểm tra và có thể cho tiếp tục, đổi tài xế hoặc hủy đơn. Tài xế chỉ nhận thông báo chung, không thấy nội dung bạn viết. Chuyến vẫn tiếp tục trong lúc chờ xử lý."
- Giữ `OrderRules.canReportIncident` (Arrived, PickedUp, InTransit).

### 3.3. Thẻ sự cố (`order_detail_screen.dart`, `_IncidentsCard`)

- Tách hai nhóm có tiêu đề nhỏ: **"Tài xế báo"** (hiện trước) và **"Bạn báo"**.
- Mỗi dòng: `#id – loại`, pill trạng thái theo nhãn mục 1, thời gian.
- Sự cố "Tài xế báo" hiện đủ mô tả và ảnh (L3). Đã đúng, chỉ cần giữ và thêm test.
- `InProgress`: thêm dòng "Điều phối viên đang xử lý".
- Kết quả: "Kết quả: {decision} – {note}". `Cancelled`: "Báo cáo đã bị hủy: {note}".
- Giữ nút "Yêu cầu hoàn tiền cho sự cố này" (`canRequestIncidentRefund`).
- Thêm `incidentStatusLabel` vào `presentation/labels.dart` nếu chưa có nhãn chữ cho `InProgress`/`Cancelled`.

### 3.4. Banner và khóa duyệt ảnh (`order_detail_screen.dart`, khối hành động theo trạng thái)

- `o.pendingDriverIncidentId != null`: banner trên đầu "Tài xế đã báo sự cố #id. Chuyến tạm dừng chờ điều phối viên xử lý." Bấm vào thì cuộn tới thẻ sự cố.
- Khối "Duyệt ảnh lấy hàng" (dòng ~297–309):
  - Tắt nút "Duyệt, cho xuất phát" và hiện câu "Chưa duyệt được khi tài xế đang có sự cố".
  - Vẫn cho "Từ chối, chụp lại".
- Sửa các câu "có vấn đề hãy báo sự cố" (dòng ~295, ~322): giữ, vì khách vẫn báo được.
- Còn sự cố mở (của ai cũng được) thì tải lại chi tiết đơn mỗi 15 giây; quay lại foreground thì tải lại.

### 3.5. Lỗi

`core/network/api_exception.dart`: thêm `INCIDENT_PENDING` (câu phía khách ở mục 1). Khi gặp thì tải lại chi tiết đơn.

### 3.6. Màn "Sự cố & khiếu nại" (không bắt buộc, giải quyết góp ý "khách chưa có màn riêng")

- Tab mới trong khu khách, gộp `GET api/customer/incidents` với `GET api/customer/refunds`. Mỗi dòng có mã đơn, loại, trạng thái; bấm vào thì mở chi tiết đơn.

### 3.7. Thông báo đẩy (khi bật FCM)

`INCIDENT_REPORTED`, `INCIDENT_IN_PROGRESS`, `INCIDENT_RESOLVED`, `ORDER_STATUS_CHANGED` → tải lại chi tiết đơn `data.orderId`, hoặc mở đơn đó nếu bấm vào thông báo.

### 3.8. Test (`test/customer`)

- `customer_logic_test.dart`: `pendingDriverIncidentId` có giá trị → không duyệt được; `null` → duyệt được.
- `customer_flow_widget_test.dart`:
  - Banner hiện, nút duyệt tắt, nút từ chối bật.
  - Thẻ sự cố tách hai nhóm.
  - Sự cố tài xế báo hiện mô tả và ảnh.
  - Form báo sự cố chọn lý do nhanh thì điền đúng `incidentType`.

---

## 4. Web (ModMove-web)

### 4.1. Khách (`pages/customer/OrderDetailPage.tsx`, `features/customer/CustomerModals.tsx`)

- `api/types.ts`: `OrderDetailResponse` thêm `pendingDriverIncidentId: number | null`.
- `api/endpoints.ts`: `customerApi.incidents(page, pageSize, orderId?, status?)`. `OrderDetailPage` gọi theo `orderId`, bỏ lọc trên máy (dòng ~56, ~77).
- `ReportIncidentModal`: thêm lý do nhanh và câu giải thích như mục 3.2. Giữ GPS và ảnh như hiện tại.
- Khối "Duyệt ảnh lấy hàng" (dòng ~322–335): khi `pendingDriverIncidentId` có giá trị thì `disabled` nút "Duyệt ảnh, cho xuất phát", kèm câu giải thích; vẫn cho "Từ chối, chụp lại".
- Banner trên đầu trang như mục 3.4.
- `IncidentsCard` (dòng ~604): tách "Tài xế báo" / "Bạn báo", hiện mô tả và ảnh, nhãn trạng thái theo mục 1, dòng "Điều phối viên đang xử lý" khi `InProgress`.
- Còn sự cố mở thì tải lại mỗi 15 giây (`order.reload()`, `incidents.reload()`).
- `features/orders/OrderActionModals.tsx` có `IncidentReportModal` dùng `caseService.reportIncident`, nhưng **không chỗ nào import**. Xóa cùng `caseService.reportIncident` cho gọn, hoặc để nguyên nếu nhóm còn dùng ở bản demo.

### 4.2. Tài xế (`pages/driver/DriverIncidentsPage.tsx`)

- Trang đã có giao diện nhưng dữ liệu đang rỗng (`records = []`) và **chưa có route**.
- `api/endpoints.ts`, trong `driverApi`, thêm:
  - `incidents(p)` → `GET /driver/incidents`
  - `incident(id)` → `GET /driver/incidents/{id}`
- `api/types.ts`: thêm `DriverIncidentResponse` (mục 1).
- Thay kiểu `IncidentRecord` tự chế bằng `DriverIncidentResponse`:
  - Trạng thái dùng `resolutionStatus` và `resolutionDecision` thay cho `PENDING_REVIEW`/`CONTINUE_TRIP`/…
  - `evidencePhoto` → `photoUrls`.
  - `gpsLocation` → `latitude`/`longitude`.
  - Bỏ `dispatcherName`, vì backend không trả trường này.
- Xóa comment "Backend chưa có API…".
- `routes/AppRoutes.tsx`: thêm route `driver/incidents` trong nhóm `RequireRole roles={['Driver']}`; `layouts/DriverLayout.tsx`: thêm mục menu "Sự cố".

### 4.3. Điều phối viên (`pages/dispatcher/IncidentsPage.tsx`, `features/dispatcher/IncidentDrawer.tsx`)

- Đã có `reporterRole`. Thêm nhãn **"Chặn chuyến"** cho sự cố `reporterRole === 'Driver'` đang `Open`/`InProgress`. Khi lọc "Tất cả", sắp các sự cố này lên trước.
- Sự cố của khách: nhãn "Không chặn chuyến".
- Sự cố của khách vẫn mở khi đơn đã `Delivered`/`Completed`: ẩn nút "Tiếp tục chuyến" (backend sẽ trả `ORDER_NOT_ACTIVE`) và gợi ý "Hủy báo cáo" kèm lý do.
- Sau `startIncident` thành công: toast "Đã nhận xử lý. Tài xế và khách đã được báo."

### 4.4. Lỗi (`api/errors.ts`)

Thêm `INCIDENT_PENDING`; giữ `INCIDENT_NOT_ALLOWED`.

### 4.5. Kiểm tra

Repo web chưa có test tự động cho các trang này. Kiểm tra tay theo mục 5 và chạy `npm run build`, `npm run lint`.

---

## 5. Kịch bản kiểm tra tay (cả hệ thống)

| # | Kịch bản | Kết quả đúng |
|---|---|---|
| 1 | Tài xế báo "Hỏng xe" ở `InTransit` | Tài xế: banner "Đang chờ", nút giao hàng tắt. Khách: nhận `INCIDENT_REPORTED`, thấy mô tả và ảnh của tài xế. Điều phối viên: sự cố có nhãn "Chặn chuyến" |
| 2 | Điều phối viên bấm start | Tài xế và khách: banner sang "Đang xử lý" (sau tối đa 15 giây, hoặc ngay nếu có đẩy) |
| 3 | Điều phối viên chọn tiếp tục chuyến | Tài xế: dialog có ghi chú, nút mở lại, giao được. Khách: thẻ sự cố "Đã xử lý – Tiếp tục chuyến" |
| 4 | Điều phối viên đổi tài xế | Tài xế cũ về màn chính. Tài xế mới vào đúng bước của đơn. Khách thấy tài xế mới |
| 5 | Điều phối viên hủy đơn, hàng đang trên xe | Tài xế: dialog hủy và hướng dẫn trả hàng. Khách: đơn `Cancelled`, có hoàn tiền nếu đã trả PayOS |
| 6 | Tài xế báo ở `PickedUp` khi ảnh đang chờ duyệt | Khách: banner, nút "Duyệt" tắt, "Từ chối" vẫn bấm được |
| 7 | Khách báo "Tài xế đến trễ" ở `InTransit` | Tài xế: banner nhắc, nút **không** khóa, chỉ thấy câu chung. Điều phối viên: nhãn "Không chặn chuyến" |
| 8 | Khách báo sự cố rồi tài xế giao xong trước khi điều phối viên xử lý | Điều phối viên: không có nút "Tiếp tục chuyến", "Hủy báo cáo" vẫn dùng được |
| 9 | Tài xế bấm giao hàng từ một màn hình cũ trong khi đang có sự cố | Nhận 422 `INCIDENT_PENDING`, app hiện lỗi và tải lại |
| 10 | Tài xế mở "Sự cố của tôi" (mobile và web) | Có đủ sự cố, đúng trạng thái và quyết định; sự cố khách báo hiện câu chung |

## 6. Thứ tự làm

| Bước | Việc | Cần backend |
|---|---|---|
| 1 | Mobile tài xế 2.1, 2.2, 2.6, 2.7; web 4.2 | Không (API sự cố tài xế đã có) |
| 2 | Mobile tài xế 2.3–2.5 (khóa nút, banner, xử lý quyết định) | `trips/active` có `incidents[]` (đã có). Mã 422 cần backend B2 |
| 3 | Mobile khách 3.2, 3.3; web 4.1 phần form và thẻ sự cố | Không |
| 4 | Mobile khách 3.1, 3.4; web 4.1 phần banner và khóa duyệt ảnh | Backend B6 (`pendingDriverIncidentId`, lọc `orderId`) |
| 5 | Web điều phối 4.3 | Không |
| 6 | Lỗi `INCIDENT_PENDING` cả hai bên | Backend B2 |
| 7 | Thông báo đẩy 2.8, 3.7 | FCM, package mới (hỏi nhóm) |
