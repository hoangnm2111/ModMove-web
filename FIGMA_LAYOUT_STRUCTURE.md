# MODMOVE - CẤU TRÚC VÀ BỐ CỤC DESIGN SYSTEM TRÊN FIGMA
*(Chuẩn UI/UX Enterprise On-Demand Truck & Moving Logistics)*

---

## 📐 HƯỚNG DẪN BỐ CỤC FIGMA (LAYOUT GRID & ARTBOARDS)

Trong Figma, các màn hình được tổ chức theo **5 Flow (5 Hàng ngang tương ứng với 5 Roles)** với Section Name và Frame Name chuẩn chỉ, kèm ghi chú nghiệp vụ Use-case:

```
+---------------------------------------------------------------------------------------------------------------+
|  COVER SECTION: ModMove - Smart Truck Moving & Logistics Platform (Design System & Role UI Flows)            |
+---------------------------------------------------------------------------------------------------------------+

ROW 1: [SECTION 01. PUBLIC & AUTHENTICATION] (Width: 1440px | Viewport: Desktop)
  ├── Frame 01: [01_public_landing.png]  --> Trang chủ giới thiệu dịch vụ xe tải, ước tính cước phí, đội xe
  └── Frame 02: [02_public_login.png]    --> Đăng nhập & Đăng ký OTP, Quick Login 4 vai trò

ROW 2: [SECTION 02. CUSTOMER JOURNEY (KHÁCH HÀNG)]
  ├── Frame 03: [03_customer_booking.png]  --> Đặt xe 4 bước: Tuyến trình -> Hàng hóa -> Chọn loại tải -> Thanh toán
  ├── Frame 04: [04_customer_orders.png]   --> Quản lý đơn hàng đang chạy & lịch sử đơn hàng
  ├── Frame 05: [05_customer_tracking.png] --> Theo dõi tài xế thời gian thực trên bản đồ GPS
  └── Frame 06: [06_customer_wallet.png]   --> Ví số PayOS, Nạp tiền VietQR, Lịch sử biến động số dư

ROW 3: [SECTION 03. DRIVER OPERATIONS (TÀI XẾ)]
  ├── Frame 07: [07_driver_jobboard.png]    --> Bảng tin cuốc xe chờ nhận, lọc bán kính, xem thù lao thực nhận
  ├── Frame 08: [08_driver_active_trip.png] --> Điều hành chuyến xe trực tiếp: 4 chặng di chuyển + Chụp ảnh giao nhận
  ├── Frame 09: [09_driver_history.png]     --> Lịch sử chuyến xe đã hoàn thành & Biên bản bàn giao điện tử
  ├── Frame 10: [10_driver_incidents.png]   --> Báo cáo sự cố khẩn cấp trên đường (nổ lốp, hàng quá tải)
  ├── Frame 11: [11_driver_earnings.png]    --> Thống kê doanh thu, ví tài xế & Tạo lệnh rút tiền về ngân hàng
  └── Frame 12: [12_driver_profile.png]     --> Hồ sơ cá nhân tài xế, GPLX và giấy tờ xe tải

ROW 4: [SECTION 04. DISPATCHER CONSOLE (ĐIỀU PHỐI VIÊN)]
  ├── Frame 13: [13_dispatcher_livemap.png]    --> Bản đồ radar radar trực tiếp toàn bộ hạm đội xe tải
  ├── Frame 14: [14_dispatcher_incidents.png]  --> Trung tâm xử lý sự cố & Điều động xe tải thay thế (UC-DIS-05)
  └── Frame 15: [15_dispatcher_complaints.png] --> Tiếp nhận và giải quyết khiếu nại bồi thường khách hàng

ROW 5: [SECTION 05. ADMINISTRATOR PORTAL (QUẢN TRỊ VIÊN)]
  ├── Frame 16: [16_admin_dashboard.png]    --> KPI Dashboard, tổng doanh thu gộp, hoa hồng 20% và tỷ trọng xe
  ├── Frame 17: [17_admin_drivers.png]      --> Xét duyệt hồ sơ đăng ký đối tác tài xế mới
  ├── Frame 18: [18_admin_users.png]        --> Quản trị tài khoản người dùng, phân quyền và khóa/mở khóa
  ├── Frame 19: [19_admin_withdrawals.png]  --> Duyệt lệnh rút tiền của tài xế về tài khoản VietQR
  └── Frame 20: [20_admin_pricing.png]      --> Cấu hình bảng giá cước mở cửa & giá mỗi km theo tải trọng xe
```

---

## 🎨 THƯ MỤC ẢNH GỐC ĐỘ PHÂN GIẢI CAO (2X RETINA):
Tất cả 20 màn hình đã được render và chụp tự động với tỷ lệ chuẩn 1440x900 (2x Retina siêu nét) lưu tại:
📁 `d:\Do_AN\ModMove-web\screens_png/`

👉 **Cách đưa vào Figma trong 1 phút:**
1. Mở file Figma của bạn (hoặc nhấn tổ hợp phím `Ctrl + Shift + K` trong Figma).
2. Kéo toàn bộ 20 file ảnh từ thư mục `d:\Do_AN\ModMove-web\screens_png/` vào Canvas.
3. Figma sẽ tự động dàn đều các Frame theo từng hàng tương ứng với cấu trúc trên!
