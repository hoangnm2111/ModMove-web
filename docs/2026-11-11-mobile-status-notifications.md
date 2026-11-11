# Mobile Status Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mọi trạng thái quan trọng của đơn, thanh toán, sự cố, khiếu nại/hoàn tiền, hồ sơ tài xế hiện lên UI mobile bằng banner trên đỉnh màn và được lưu trong hộp thông báo (chuông có số chưa đọc).

**Architecture:** `lib/core/notifications/` giữ model `AppNotice`, danh mục `type → kind/chữ dự phòng/đích` và `NotificationCubit` (hàng đợi banner + hộp thư + chống trùng). `NoticeHost` bọc `MaterialApp.builder` để vẽ banner trên mọi màn. Nguồn sự kiện: SignalR `NotificationReceived` (khách thật), kết quả thao tác trong app (`notify(context, type)`), và state của luồng tài xế mock được ánh xạ sang cùng mã `type`.

**Tech Stack:** Flutter ≥ 3.44, flutter_bloc 9, `signalr_netcore` (mới), flutter_test, fake_async.

**Spec:** `docs/superpowers/specs/2026-11-11-status-notifications-design.md` (danh mục sự kiện mục 3, hành vi hiển thị mục 4).

## Global Constraints

- Chữ hiển thị tiếng Việt; có `title/body` từ server thì hiện nguyên văn, chỉ dùng chữ dự phòng của danh mục khi thiếu.
- Thời gian banner: success/info 4 s, warning 6 s, error 7 s.
- Chống trùng: cùng `type` + `data['orderId']` trong 10 s chỉ đẩy một lần.
- Hộp thông báo tối đa 50 mục, chỉ trong phiên (không lưu file), xoá khi đăng xuất.
- Không đổi chữ ký `showSnack(context, text, {error})` và `runAction(...)` — ~40 lời gọi hiện có phải chạy nguyên.
- Domain không import Flutter (theo `docs/architecture.md`); `app_notice.dart` và `notice_catalog.dart` là Dart thuần.
- Không thêm Firebase/FCM.

## Review Focus

1. Mất kết nối SignalR / token hết hạn giữa chừng → tự kết nối lại với token mới (đọc `SessionStore.current` mỗi lần), không spam banner lỗi. Test ở Task 5.
2. Nhiều sự kiện đến dồn (khách vừa huỷ đơn, server dội `ORDER_CANCELLED`) → chỉ một banner, banner sau xếp hàng không đè. Test ở Task 2.
3. `type` lạ hoặc `data` thiếu `orderId` → vẫn hiện `title/body` server, kind info, chạm không làm gì, không crash. Test ở Task 1.
4. Chạm banner khi đang ở màn chi tiết của chính đơn đó → không đẩy thêm một màn trùng, chỉ tải lại. Test ở Task 6.
5. Đăng xuất → ngắt SignalR, xoá hộp thư; đăng nhập tài khoản khác không thấy thông báo cũ. Test ở Task 5.

---

### Task 1: Model `AppNotice` + danh mục sự kiện

**Files:**
- Create: `lib/core/notifications/app_notice.dart`
- Create: `lib/core/notifications/notice_catalog.dart`
- Test: `test/notifications/notice_catalog_test.dart`

**Interfaces:**
- Produces:
  - `enum NoticeKind { success, info, warning, error }`
  - `enum NoticeTarget { none, order, refund, driverJob, driverTrip, driverProfile }`
  - `class AppNotice { final String id, type, title, body; final NoticeKind kind; final NoticeTarget target; final Map<String,String> data; final DateTime at; final bool persist; final bool read; AppNotice copyWith({bool? read}); int? get orderId; Duration get duration; }`
  - `AppNotice noticeFor(String type, {Map<String,String> data = const {}, String? title, String? body, DateTime? at})`
  - `const Set<String> persistedTypes` (mọi mã `S` + `ORDER_*`, `PAYMENT_*`, `REFUND_*`, `DRIVER_APPLICATION_*` trong spec mục 3).

- [ ] **Step 1: Viết test hỏng**

```dart
test('server text wins over fallback', () {
  final n = noticeFor('ORDER_ACCEPTED', title: 'Đơn đã có tài xế', body: 'Tài xế đã nhận đơn MM01.', data: {'orderId': '7'});
  expect(n.kind, NoticeKind.info);
  expect(n.body, 'Tài xế đã nhận đơn MM01.');
  expect(n.target, NoticeTarget.order);
  expect(n.orderId, 7);
  expect(n.persist, isTrue);
});
test('fallback fills {orderCode}', () {
  final n = noticeFor('PICKUP_PHOTOS_TO_REVIEW', data: {'orderId': '7', 'orderCode': 'MM01'});
  expect(n.kind, NoticeKind.warning);
  expect(n.body, 'Ảnh kiểm hàng của đơn MM01 đã sẵn sàng. Vui lòng duyệt trước khi xe khởi hành.');
  expect(n.duration, const Duration(seconds: 6));
});
test('unknown type keeps server text, info, no target', () {
  final n = noticeFor('SOMETHING_NEW', title: 'T', body: 'B');
  expect((n.kind, n.target, n.title, n.body, n.orderId), (NoticeKind.info, NoticeTarget.none, 'T', 'B', null));
});
test('client action notices are not persisted', () {
  expect(noticeFor('RATING_SUBMITTED').persist, isFalse);
  expect(noticeFor('ACTION_ERROR', body: 'x').duration, const Duration(seconds: 7));
});
test('every catalog type has a non-empty fallback', () {
  for (final t in noticeCatalog.keys) { expect(noticeFor(t).body, isNotEmpty, reason: t); }
});
```

- [ ] **Step 2: Chạy `flutter test test/notifications/notice_catalog_test.dart`** — Expected: FAIL (file chưa tồn tại).
- [ ] **Step 3: Cài đặt** — `noticeCatalog` là `const Map<String, ({NoticeKind kind, String title, String body, NoticeTarget target})>` chép đúng mọi dòng của spec mục 3 (tiêu đề dự phòng = tiêu đề server ở `CustomerNotifications.cs`/`DriverNotifications.cs`, hoặc nhãn ngắn cho mã `C`). Điền `{key}` bằng `data[key]`, khoá thiếu → bỏ trống rồi `trim()` (giống `msg()` của web). Mã đến từ cả hai phía (`INCIDENT_REPORTED`, `COMPLAINT_SUBMITTED`…) dùng một mục, kind theo người nhận mobile (KH/TX). `id` = `'${type}_${at.microsecondsSinceEpoch}'`. Thêm `ACTION_DONE` (success, không lưu, tiêu đề rỗng, dự phòng `'Đã xong.'`) và `ACTION_ERROR` (error, không lưu, dự phòng `'Đã có lỗi xảy ra. Vui lòng thử lại.'`) — câu thật truyền qua `body:`.
- [ ] **Step 4: Chạy lại test** — Expected: PASS.
- [ ] **Step 5: Commit** `feat(notifications): add AppNotice model and event catalog`

### Task 2: `NotificationCubit` — hàng đợi banner, hộp thư, chống trùng

**Files:**
- Create: `lib/core/notifications/notification_cubit.dart`
- Test: `test/notifications/notification_cubit_test.dart`

**Interfaces:**
- Consumes: `AppNotice`, `noticeFor` (Task 1).
- Produces:
  - `class NotificationState { final AppNotice? showing; final List<AppNotice> queue; final List<AppNotice> inbox; int get unread; }`
  - `class NotificationCubit extends Cubit<NotificationState> { NotificationCubit({DateTime Function()? clock}); void push(AppNotice n); void dismissCurrent(); void markAllRead(); void clear(); Stream<AppNotice> get pushed; }` — `pushed` phát mọi notice đã qua chống trùng (màn khác dùng để tải lại).

- [ ] **Step 1: Viết test hỏng**

```dart
test('first push shows, second queues', () { c.push(a); c.push(b); expect(c.state.showing, a); expect(c.state.queue, [b]); });
test('dismissCurrent advances queue', () { c.push(a); c.push(b); c.dismissCurrent(); expect(c.state.showing, b); expect(c.state.queue, isEmpty); });
test('same type + orderId within 10s is dropped', () {
  c.push(noticeFor('ORDER_CANCELLED', data: {'orderId': '7'}));
  clock = clock.add(const Duration(seconds: 9));
  c.push(noticeFor('ORDER_CANCELLED', data: {'orderId': '7'}));
  expect(c.state.queue, isEmpty);
  clock = clock.add(const Duration(seconds: 2));
  c.push(noticeFor('ORDER_CANCELLED', data: {'orderId': '7'}));
  expect(c.state.queue, hasLength(1));
});
test('only persisted notices enter inbox, newest first, capped at 50', () { /* push 51 ORDER_ACCEPTED với orderId khác nhau + 1 RATING_SUBMITTED → inbox.length == 50, inbox.first là cái mới nhất, không có RATING_SUBMITTED */ });
test('unread counts inbox until markAllRead', () { /* 2 persisted → unread 2 → markAllRead → 0 */ });
test('clear empties showing, queue and inbox', () {});
```

- [ ] **Step 2: Chạy `flutter test test/notifications/notification_cubit_test.dart`** — Expected: FAIL.
- [ ] **Step 3: Cài đặt** — chống trùng bằng `Map<String, DateTime>` khoá `'$type|${orderId ?? ''}'`; `pushed` là `StreamController.broadcast()` đóng trong `close()`.
- [ ] **Step 4: Chạy lại test** — Expected: PASS.
- [ ] **Step 5: Commit** `feat(notifications): add NotificationCubit with queue, inbox and dedupe`

### Task 3: Banner `NoticeHost` + nối vào app + `showSnack` dùng banner

**Files:**
- Create: `lib/core/widgets/notice_banner.dart`
- Modify: `lib/app/app.dart` (thêm `BlocProvider<NotificationCubit>` vào `MultiBlocProvider`; `MaterialApp(builder: (context, child) => NoticeHost(onOpen: _openNotice, child: child!))`)
- Modify: `lib/features/customer/presentation/widgets/customer_widgets.dart:14-24` (`showSnack` → `context.read<NotificationCubit>().push(noticeFor(error ? 'ACTION_ERROR' : 'ACTION_DONE', body: text))`) (`ACTION_DONE`/`ACTION_ERROR` có sẵn từ Task 1).
- Add: `void notify(BuildContext context, String type, [Map<String,String> data = const {}])` cùng file `notice_banner.dart`.
- Test: `test/notifications/notice_banner_test.dart`

**Interfaces:**
- Consumes: `NotificationCubit`, `AppNotice.duration`.
- Produces: `class NoticeHost extends StatelessWidget { const NoticeHost({required this.child, required this.onOpen}); final Widget child; final void Function(AppNotice) onOpen; }`; `notify(...)`.

- [ ] **Step 1: Viết widget test hỏng**

```dart
testWidgets('banner shows title/body at top and auto-dismisses', (t) async {
  await t.pumpWidget(host);
  cubit.push(noticeFor('ORDER_ACCEPTED', title: 'Đơn đã có tài xế', body: 'Tài xế đã nhận đơn MM01.'));
  await t.pump(const Duration(milliseconds: 300));
  expect(find.text('Đơn đã có tài xế'), findsOneWidget);
  expect(t.getTopLeft(find.byType(NoticeBanner)).dy, lessThan(100));
  await t.pump(const Duration(seconds: 4)); await t.pumpAndSettle();
  expect(find.text('Đơn đã có tài xế'), findsNothing);
});
testWidgets('tap calls onOpen and dismisses', (t) async { /* tap → opened == notice, showing == null */ });
testWidgets('swipe up dismisses', (t) async { /* fling(Offset(0,-300)) → biến mất */ });
testWidgets('showSnack still works and renders as banner', (t) async { /* showSnack(ctx, 'Nhập email và mật khẩu.', error: true) → text hiện, màu AppColors.red */ });
```

- [ ] **Step 2: Chạy `flutter test test/notifications/notice_banner_test.dart`** — Expected: FAIL.
- [ ] **Step 3: Cài đặt** — `NoticeHost` = `Stack(children: [child, BlocBuilder → SafeArea + AnimatedSwitcher/SlideTransition từ trên])`; hẹn giờ bằng `Timer(notice.duration, cubit.dismissCurrent)` theo `notice.id`; `Dismissible(direction: DismissDirection.up)`; `Semantics(liveRegion: true)`; màu lấy `AppColors.green/greenBg, amber/amberBg, red/redBg`, info dùng màu xanh của `labels.dart` (`_blue/_blueBg` → chuyển 2 hằng này sang `AppColors` nếu cần). Đổi 6 chỗ `ScaffoldMessenger` rời ở `driver_trip/` và `onboarding/` (đã liệt kê bằng `grep -rn ScaffoldMessenger lib`) sang `notify`/`showSnack`.
- [ ] **Step 4: Chạy `flutter test`** (toàn bộ, vì `showSnack` dùng khắp nơi) — Expected: PASS hết, gồm `test/customer/customer_flow_widget_test.dart`.
- [ ] **Step 5: Commit** `feat(notifications): top banner host replaces SnackBar`

### Task 4: Hộp thông báo — chuông + màn danh sách + điều hướng khi chạm

**Files:**
- Create: `lib/features/notifications/notifications_screen.dart` (`NotificationsScreen`, `NotificationBell`)
- Modify: `lib/features/customer/presentation/customer_shell.dart` (chuông ở thanh trên), `lib/features/driver_trip/presentation/screens/driver_dashboard.dart` (chuông)
- Modify: `lib/app/app.dart` — `_openNotice(AppNotice n)`: `order`/`refund` + `orderId` → push `OrderDetailScreen(orderId:)` như `customer_shell.dart:40`; `driverJob` → route job details; `driverTrip` → `ActiveTripScreen`; `driverProfile` → màn hồ sơ; `none` → không làm gì.
- Test: `test/notifications/notifications_screen_test.dart`

**Interfaces:**
- Consumes: `NotificationCubit.state.inbox/unread`, `markAllRead()`, `NoticeHost.onOpen`.
- Produces: `NotificationBell({required VoidCallback onTap})`, `NotificationsScreen({required void Function(AppNotice) onOpen})`.

- [ ] **Step 1: Viết widget test hỏng**

```dart
testWidgets('bell badge shows unread count, hidden at 0', ...);   // 3 → '3'; >9 → '9+'
testWidgets('screen lists newest first with relative time and kind icon', ...);
testWidgets('opening screen marks all read', ...);              // unread về 0
testWidgets('tapping an item calls onOpen with that notice', ...);
testWidgets('empty inbox shows "Chưa có thông báo"', ...);
```

- [ ] **Step 2: Chạy test** — Expected: FAIL.
- [ ] **Step 3: Cài đặt** — dùng `Pill`/màu như Task 3; giờ hiển thị qua `core/format/formatters.dart`.
- [ ] **Step 4: Chạy `flutter test`** — Expected: PASS.
- [ ] **Step 5: Commit** `feat(notifications): inbox screen and bell badge`

### Task 5: Nguồn realtime SignalR

**Files:**
- Modify: `pubspec.yaml` — `flutter pub add signalr_netcore` (ghim bản ổn định mới nhất lúc làm, ghi phiên bản vào commit message)
- Create: `lib/core/notifications/realtime_source.dart`
- Modify: `lib/app/app.dart` — `BlocListener<AuthCubit, …>`: đăng nhập → `bridge.start()`; đăng xuất/hết phiên → `bridge.stop()` + `NotificationCubit.clear()`
- Modify: `docs/customer-app.md` mục "Chưa làm" — gạch SignalR, giữ FCM
- Test: `test/notifications/realtime_source_test.dart`

**Interfaces:**
- Consumes: `SessionStore.current?.accessToken`, `AppConfig.apiBaseUrl`, `NotificationCubit.push`, `noticeFor`.
- Produces:
  - `String hubUrl(String apiBaseUrl)` — bỏ hậu tố `/api`, thêm `/hubs/tracking`.
  - `abstract class RealtimeSource { Stream<Map<String, Object?>> get notifications; Future<void> start(Future<String?> Function() token); Future<void> stop(); }`
  - `class SignalRRealtimeSource implements RealtimeSource` — `HubConnectionBuilder().withUrl(hubUrl, options: HttpConnectionOptions(accessTokenFactory: …)).withAutomaticReconnect()`; `on('NotificationReceived', …)`.
  - `class RealtimeBridge { RealtimeBridge(RealtimeSource source, NotificationCubit cubit, SessionStore session); Future<void> start(); Future<void> stop(); }` — ánh xạ payload `{type,title,body,data}` → `noticeFor(...)` → `cubit.push`.

- [ ] **Step 1: Viết test hỏng (dùng `FakeRealtimeSource` với `StreamController`)**

```dart
test('hubUrl', () {
  expect(hubUrl('http://10.0.2.2:5133/api'), 'http://10.0.2.2:5133/hubs/tracking');
  expect(hubUrl('https://api.modmove.vn/api/'), 'https://api.modmove.vn/hubs/tracking');
});
test('server payload becomes a notice with server text', () async {
  fake.emit({'type': 'REFUND_INFO_REQUESTED', 'title': 'Cần bổ sung', 'body': 'Gửi thêm ảnh', 'data': {'orderId': '9'}});
  await pumpEventQueue();
  expect(cubit.state.showing!.body, 'Gửi thêm ảnh');
  expect(cubit.state.showing!.orderId, 9);
});
test('malformed payload is ignored', () async { fake.emit({'title': 1}); await pumpEventQueue(); expect(cubit.state.showing, isNull); });
test('token is read on every (re)connect', () async { /* session đổi token giữa 2 lần fake gọi token() → nhận token mới */ });
test('stop cancels subscription; later events ignored', () async {});
```

- [ ] **Step 2: Chạy test** — Expected: FAIL.
- [ ] **Step 3: Cài đặt** — lỗi kết nối chỉ ghi `debugPrint`, không đẩy banner (Review Focus 1). `ApiClient` đã tự refresh token khi 401 nên `token()` chỉ cần đọc `SessionStore.current`.
- [ ] **Step 4: Chạy test, rồi chạy tay với backend**: `flutter run`, đăng nhập `customer@modmove.local`, dùng web tài xế nhận đơn → banner "Đơn đã có tài xế" hiện trên emulator.
- [ ] **Step 5: Commit** `feat(notifications): SignalR NotificationReceived bridge`

### Task 6: Sự kiện phía khách hàng + tải lại theo thông báo

**Files:**
- Modify: `lib/features/customer/presentation/customer_shell.dart:31` → `notify(context, 'ORDER_CREATED', {'orderId': …, 'orderCode': created.code})`
- Modify: `lib/features/customer/presentation/order_detail/order_sheets.dart` — thay `success:`/`showSnack` thành `notify` với: huỷ đơn `ORDER_CANCELLED`, khiếu nại `COMPLAINT_SUBMITTED`, sự cố `INCIDENT_REPORTED`, xin hoàn `INCIDENT_REFUND_REQUESTED`, trả lời `REFUND_INFO_REPLIED`, rút `REFUND_WITHDRAWN`, kiểm tra PayOS (`:511` → `PAYMENT_CONFIRMED` kèm `amount`, `:514` → `PAYMENT_PENDING`; `OrderPayment.isExpired` → `PAYMENT_EXPIRED`; `transactionStatus == 'Failed'` → `PAYMENT_FAILED`, `'Cancelled'` → `PAYMENT_CANCELLED`)
- Modify: nơi gọi `confirmReceipt` → `RECEIPT_CONFIRMED`; `rate` → `RATING_SUBMITTED`; đăng xuất (`account_screen.dart`) → `LOGGED_OUT`; `ApiException.network` → `NETWORK_ERROR` trong `runAction`.
- Modify: `lib/features/customer/presentation/order_detail/order_detail_screen.dart:41-50` — nghe `NotificationCubit.pushed`, notice có `orderId == widget.orderId` → `cubit.load()` ngay.
- Modify: `lib/app/app.dart` `_openNotice` — nếu route trên cùng đã là `OrderDetailScreen` của đơn đó thì không push (giữ `orderId` của màn đang mở trong một `ValueNotifier<int?> openOrderId` do `OrderDetailScreen` set/clear).
- Test: thêm vào `test/customer/customer_flow_widget_test.dart`

- [ ] **Step 1: Viết test hỏng**

```dart
testWidgets('cancel order shows ORDER_CANCELLED banner with order code', ...);
testWidgets('PayOS check paid shows "Đã xác nhận thanh toán … cho đơn MM01."', ...);
testWidgets('incoming notice for open order reloads detail without pushing a new route', ...); // fake CustomerApi đếm số lần order(id) gọi: tăng 1; Navigator stack không đổi
testWidgets('notice for another order does not reload', ...);
```

- [ ] **Step 2: Chạy `flutter test test/customer/`** — Expected: FAIL.
- [ ] **Step 3: Cài đặt** theo danh sách Files. Thông báo lỗi kiểm tra form (`'Chọn lý do huỷ.'`…) giữ `showSnack(..., error: true)`.
- [ ] **Step 4: Chạy `flutter test`** — Expected: PASS.
- [ ] **Step 5: Commit** `feat(customer): emit catalog notices for order, payment, incident and refund actions`

### Task 7: Sự kiện phía tài xế (mock) — hồ sơ, upload, chuyến

**Files:**
- Create: `lib/features/driver_trip/presentation/trip_notices.dart`
- Create: `lib/features/onboarding/presentation/controllers/profile_notices.dart`
- Modify: `lib/app/driver_trip_scope.dart` — nghe `repository.changes`, giữ `prev`, đẩy `tripNotices(prev, next)` vào cubit
- Modify: `lib/app/app.dart` — `BlocListener<DriverController, DriverPresentationState>` đẩy `profileNotices(prev, next)`
- Modify: `lib/features/onboarding/presentation/screens/*` nơi gọi `pickDocument/saveDraft/submit` → kết quả `String?` lỗi/null → `DOCUMENT_UPLOAD_FAILED`/`DOCUMENT_UPLOADED`, `DRIVER_DRAFT_SAVED`, `DRIVER_APPLICATION_SUBMITTED` (`{document}` = nhãn từ `presentation/models/document_display.dart`)
- Test: `test/notifications/driver_notices_test.dart`

**Interfaces:**
- Consumes: `DriverSession`, `ActiveTrip.stage/review/reason/cashCollected`, `JobOffer.job.id`, `DriverPresentationState.application.status`, `DriverApplication.rejectionReason`, `noticeFor`.
- Produces:
  - `List<AppNotice> tripNotices(DriverSession? prev, DriverSession next)`
  - `List<AppNotice> profileNotices(DriverPresentationState? prev, DriverPresentationState next)`

- [ ] **Step 1: Viết test hỏng**

```dart
test('new offer → NEW_MATCHING_ORDER', () { expect(types(tripNotices(s(), s(offer: o('J1')))), ['NEW_MATCHING_ORDER']); });
test('review pending→approved → PICKUP_APPROVED', ...);
test('review pending→rejected → PICKUP_REJECTED with reason in body', ...); // body chứa trip.reason
test('stage →cancelled → ORDER_CANCELLED', ...);
test('cashCollected false→true → CASH_COLLECTED', ...);
test('trip present→null after inTransit → ORDER_COMPLETED', ...);
test('identical sessions → no notices', ...);
test('status pending→approved → DRIVER_APPLICATION_APPROVED', ...);
test('status pending→rejected → DRIVER_APPLICATION_REJECTED with rejectionReason', ...);
test('first state (prev == null) emits nothing', ...);
```

- [ ] **Step 2: Chạy test** — Expected: FAIL.
- [ ] **Step 3: Cài đặt** hai hàm thuần (so sánh trường, không đọc đồng hồ). Mã `type` y hệt mã server, để khi chuyển sang API thật chỉ cần bỏ listener và để `RealtimeBridge` (Task 5) đẩy.
- [ ] **Step 4: Chạy `flutter test`** — Expected: PASS hết (gồm `driver_mock_flow_test.dart`, `driver_trip_ui_test.dart`).
- [ ] **Step 5: Commit** `feat(driver): map mock trip and profile state changes to notices`
