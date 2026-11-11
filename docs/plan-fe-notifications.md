# Kế hoạch chỉnh sửa Frontend (`ModMove-web` & `ModMove-mobile`) — Hiển thị thông báo

Kế hoạch này xử lý phía client để thông báo từ Backend **thực sự nảy lên trên giao diện** khi người dùng thao tác trên **Web** hoặc **Mobile**.

> [!IMPORTANT]
> Hai nền tảng dùng cơ chế nhận khác nhau theo thiết kế ([DECISIONS.md](file:///d:/Subject/ModMove/ModMove-backend/docs/DECISIONS.md#L62-L97)):
> - **`ModMove-web` (React):** nhận qua **SignalR** (`/hubs/tracking` → `NotificationReceived`), **không dùng Firebase**.
> - **`ModMove-mobile` (Flutter Android):** đăng ký token lên `PUT /api/account/fcmtoken` và nhận push qua **Firebase Cloud Messaging (FCM)** (+ SignalR khi đang mở app).

---

## Phần A: `ModMove-web` — Tích hợp SignalR `NotificationReceived`

### A.1. Cài đặt SignalR client
- Thêm package `@microsoft/signalr` vào [`ModMove-web/package.json`](file:///d:/Subject/ModMove/ModMove-web/package.json).

### A.2. Tạo dịch vụ kết nối Hub (`/hubs/tracking`)
- Tạo mới `src/services/realtime.service.ts` (hoặc `src/hooks/useRealtimeNotifications.ts`):
  - Đọc hub URL từ `import.meta.env.VITE_SIGNALR_HUB_URL` (đã khai báo sẵn ở [`src/vite-env.d.ts`](file:///d:/Subject/ModMove/ModMove-web/src/vite-env.d.ts#L5)), fallback suy từ `VITE_API_BASE_URL` (thay `/api` bằng `/hubs/tracking`).
  - Khởi tạo `HubConnectionBuilder` với `accessTokenFactory: () => useAuthStore.getState().token ?? ''` và `.withAutomaticReconnect()` (khớp yêu cầu JWT qua query string `access_token` của [`TrackingHub`](file:///d:/Subject/ModMove/ModMove-backend/src/ModMove.WebApi/Hubs/TrackingHub.cs#L15-L21)).
  - Lắng nghe sự kiện `NotificationReceived` (`{ type, title, body, data }`): gọi [`toast`](file:///d:/Subject/ModMove/ModMove-web/src/components/ui/feedback.tsx) hiển thị `title` và `body` (lưu ý `ToastViewport` đã được mount sẵn ở [`App.tsx`](file:///d:/Subject/ModMove/ModMove-web/src/App.tsx#L17)).
  - Lắng nghe sự kiện `OrderStatusChanged` (`{ orderId, orderStatus }`): kích hoạt làm mới danh sách/chi tiết đơn nếu người dùng đang xem đơn tương ứng.

### A.3. Gắn vòng đời kết nối vào ứng dụng Web
- Gọi hook kết nối trong [`src/App.tsx`](file:///d:/Subject/ModMove/ModMove-web/src/App.tsx) dựa theo trạng thái đăng nhập của [`useAuthStore`](file:///d:/Subject/ModMove/ModMove-web/src/store/useAuthStore.ts):
  - Có session hợp lệ → `connection.start()`.
  - Đăng xuất hoặc hết phiên → `connection.stop()`.
  - Khi token được refresh → đảm bảo reconnect dùng token mới nhất từ `accessTokenFactory`.
- Kiểm tra lại CORS `AllowedOrigins` ở Backend ([`appsettings.Development.json`](file:///d:/Subject/ModMove/ModMove-backend/src/ModMove.WebApi/appsettings.Development.json#L14-L18)) khớp đúng origin của Vite (`http://localhost:5173` / `http://localhost:3000`).

---

## Phần B: `ModMove-mobile` — Kích hoạt Firebase FCM & đồng bộ token

> [!WARNING]
> Nhánh đang checkout hiện tại ở `ModMove-mobile` là `feat/tri-customer` (chưa có Firebase). Phần FCM cho tài xế (`[FE-20]`) đang nằm trên nhánh `origin/feature/tunm` (commit `6b1c135`).

### B.1. Hợp nhất module FCM (`[FE-20]`) vào nhánh đang chạy
1. Đưa các thành phần từ `origin/feature/tunm` (commit `6b1c135`) sang nhánh tích hợp hiện tại (`develop` hoặc nhánh demo chung):
   - Dependency trong `pubspec.yaml`: `firebase_core`, `firebase_messaging`, `flutter_local_notifications` (và `signalr_netcore` nếu gộp luôn tracking).
   - Cấu hình Android: plugin `com.google.gms.google-services` trong `android/app/build.gradle.kts`, `android/settings.gradle.kts`, quyền `POST_NOTIFICATIONS` + channel `modmove_driver` trong `AndroidManifest.xml`, `MainActivity.kt` và icon `ic_notification.xml`.
   - Module `lib/features/notifications/` (`FirebasePushDevice`, `PushCubit`, `RemotePushTokenRepository`, `NotificationSettingsScreen`).

### B.2. Gắn `PushCubit` cho cả vai trò **Customer** và **Driver**
- Backend gửi FCM cho cả 2 vai trò (`Customer` & `Driver` theo [bảng 8.3](file:///d:/Subject/ModMove/ModMove-backend/docs/api/README.md#L146)), nên trong shell đăng nhập chung của app ([`app.dart`](file:///d:/Subject/ModMove/ModMove-mobile/lib/app/app.dart) & [`auth_cubit.dart`](file:///d:/Subject/ModMove/ModMove-mobile/lib/features/auth/presentation/auth_cubit.dart)):
  1. Khởi tạo `PushCubit` ngay khi khởi động app.
  2. Sau khi đăng nhập / khôi phục phiên thành công → gọi `PushCubit.attach(userId)` để xin quyền thông báo Android, lấy FCM device token và gửi `PUT /api/account/fcmtoken`.
  3. Khi đăng xuất ở [`AuthCubit.logout`](file:///d:/Subject/ModMove/ModMove-mobile/lib/features/auth/presentation/auth_cubit.dart#L20-L27) → gọi `PushCubit.detach()` lấy `fcmToken` hiện tại truyền vào [`AuthApi.logout(fcmToken: token)`](file:///d:/Subject/ModMove/ModMove-mobile/lib/features/auth/data/auth_api.dart#L35).
  4. Bổ sung xử lý chạm thông báo (tap routing) cho các `type` của **Customer** (`ORDER_ACCEPTED`, `DRIVER_ARRIVED`, `DRIVER_ARRIVED_DROPOFF`, `PICKUP_PHOTOS_TO_REVIEW`, `ORDER_DELIVERED`, `ORDER_COMPLETED`, `INCIDENT_RESOLVED`, `REFUND_*`, `ORDER_CANCELLED`).

### B.3. Cấu hình file Firebase Client trên máy local
- Vào Firebase Console của project **`modmove`** → tải file `google-services.json` (Android package `vn.modmove.modmove_mobile`) đặt tại `ModMove-mobile/android/app/google-services.json` *(file này được `.gitignore`, không commit)*.
- Chạy `flutter pub get` và build chạy lại hoàn toàn (`flutter run`, không hot reload vì có plugin native) trên thiết bị/máy ảo Android có **Google Play Services**.

---

## Kiểm thử & Xác minh phía Frontend

| Nền tảng | Kịch bản | Kết quả kỳ vọng |
| :--- | :--- | :--- |
| `ModMove-web` | Mở 2 trình duyệt (Customer & Dispatcher/Driver), đăng nhập bằng tài khoản thật, thực hiện thao tác đổi trạng thái đơn / báo sự cố | Tab còn lại nhận sự kiện SignalR `NotificationReceived` và nảy toast thông báo tức thì |
| `ModMove-mobile` | Đăng nhập tài khoản Customer hoặc Driver trên Android, nhấn Allow quyền thông báo | App gọi `PUT /api/account/fcmtoken` trả `204`; tạo sự kiện từ Web/BE → nảy notification trên thanh trạng thái (foreground & background) |
| `ModMove-mobile` | Đăng xuất tài khoản trên app | App gọi `POST /api/account/logout` kèm `{ fcmToken }` và ngưng nhận push trên thiết bị đó |
