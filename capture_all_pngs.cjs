const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, 'screens_png');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const PAGES_TO_CAPTURE = [
  // 1. PUBLIC & AUTH
  {
    role: null,
    name: '01. Trang chủ Giới thiệu (Landing Page)',
    url: 'http://localhost:5173/',
    filename: '01_public_landing.png'
  },
  {
    role: null,
    name: '02. Đăng nhập & Đăng ký (Login & Register)',
    url: 'http://localhost:5173/login',
    filename: '02_public_login.png'
  },

  // 2. KHÁCH HÀNG (CUSTOMER)
  {
    role: 'Customer',
    name: '03. Khách hàng - Đặt xe tải 4 bước (Booking Flow)',
    url: 'http://localhost:5173/booking',
    filename: '03_customer_booking.png'
  },
  {
    role: 'Customer',
    name: '04. Khách hàng - Quản lý đơn hàng (Order Management)',
    url: 'http://localhost:5173/orders',
    filename: '04_customer_orders.png'
  },
  {
    role: 'Customer',
    name: '05. Khách hàng - Theo dõi xe trực tiếp GPS (Live Tracking)',
    url: 'http://localhost:5173/tracking',
    filename: '05_customer_tracking.png'
  },
  {
    role: 'Customer',
    name: '06. Khách hàng - Ví PayOS & Nạp VietQR (Customer Wallet)',
    url: 'http://localhost:5173/wallet',
    filename: '06_customer_wallet.png'
  },

  // 3. TÀI XẾ (DRIVER)
  {
    role: 'Driver',
    name: '07. Tài xế - Danh sách đơn hàng chờ nhận (Job Board)',
    url: 'http://localhost:5173/driver',
    filename: '07_driver_jobboard.png'
  },
  {
    role: 'Driver',
    name: '08. Tài xế - Điều hành chuyến xe trực tiếp (Active Trip)',
    url: 'http://localhost:5173/driver/trip',
    filename: '08_driver_active_trip.png'
  },
  {
    role: 'Driver',
    name: '09. Tài xế - Lịch sử cuốc & Biên bản bàn giao (Trip History)',
    url: 'http://localhost:5173/driver/history',
    filename: '09_driver_history.png'
  },
  {
    role: 'Driver',
    name: '10. Tài xế - Báo cáo sự cố trên đường (Driver Incidents)',
    url: 'http://localhost:5173/driver/incidents',
    filename: '10_driver_incidents.png'
  },
  {
    role: 'Driver',
    name: '11. Tài xế - Thu nhập & Lịch sử rút tiền (Earnings & Payout)',
    url: 'http://localhost:5173/driver/earnings',
    filename: '11_driver_earnings.png'
  },
  {
    role: 'Driver',
    name: '12. Tài xế - Hồ sơ tài xế & Xe tải (Driver Profile & Truck)',
    url: 'http://localhost:5173/driver/profile',
    filename: '12_driver_profile.png'
  },

  // 4. ĐIỀU PHỐI VIÊN (DISPATCHER)
  {
    role: 'Dispatcher',
    name: '13. Điều phối - Bản đồ radar hạm đội xe tải (Live Fleet Radar)',
    url: 'http://localhost:5173/dispatcher/live-map',
    filename: '13_dispatcher_livemap.png'
  },
  {
    role: 'Dispatcher',
    name: '14. Điều phối - Xử lý sự cố & Điều động xe thay thế (Incidents)',
    url: 'http://localhost:5173/dispatcher/incidents',
    filename: '14_dispatcher_incidents.png'
  },
  {
    role: 'Dispatcher',
    name: '15. Điều phối - Tiếp nhận & Xử lý khiếu nại (Complaints)',
    url: 'http://localhost:5173/dispatcher/complaints',
    filename: '15_dispatcher_complaints.png'
  },

  // 5. QUẢN TRỊ VIÊN (ADMINISTRATOR)
  {
    role: 'Administrator',
    name: '16. Quản trị - Tổng quan KPI & Doanh thu hạm đội (Dashboard)',
    url: 'http://localhost:5173/admin/dashboard',
    filename: '16_admin_dashboard.png'
  },
  {
    role: 'Administrator',
    name: '17. Quản trị - Xét duyệt hồ sơ đối tác tài xế (Driver Approvals)',
    url: 'http://localhost:5173/admin/drivers',
    filename: '17_admin_drivers.png'
  },
  {
    role: 'Administrator',
    name: '18. Quản trị - Quản lý tài khoản người dùng (User Management)',
    url: 'http://localhost:5173/admin/users',
    filename: '18_admin_users.png'
  },
  {
    role: 'Administrator',
    name: '19. Quản trị - Duyệt lệnh rút tiền tài xế (Payout Management)',
    url: 'http://localhost:5173/admin/withdrawals',
    filename: '19_admin_withdrawals.png'
  },
  {
    role: 'Administrator',
    name: '20. Quản trị - Cấu hình bảng giá cước xe tải (Pricing Config)',
    url: 'http://localhost:5173/admin/pricing',
    filename: '20_admin_pricing.png'
  }
];

async function captureAllPNGs() {
  console.log('Khởi chạy trình duyệt chụp trọn bộ 20 màn hình UI độ phân giải cao...');
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2 // 2x Retina resolution for Figma clarity!
  });

  const page = await context.newPage();

  for (let i = 0; i < PAGES_TO_CAPTURE.length; i++) {
    const item = PAGES_TO_CAPTURE[i];
    console.log(`[${i + 1}/20] Đang chụp: ${item.name}`);

    // Set role auth
    await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
    if (item.role) {
      await page.evaluate((r) => {
        localStorage.setItem('modmove_role', r);
        localStorage.setItem('modmove_token', 'modmove_jwt_' + r.toLowerCase() + '_demo');
      }, item.role);
    } else {
      await page.evaluate(() => {
        localStorage.removeItem('modmove_role');
        localStorage.removeItem('modmove_token');
      });
    }

    await page.goto(item.url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const dest = path.join(OUTPUT_DIR, item.filename);
    await page.screenshot({ path: dest, fullPage: false });
    console.log(`    ✓ Lưu thành công: ${item.filename}`);
  }

  await browser.close();
  console.log(' Hoàn tất chụp toàn bộ 20 màn hình sắc nét 2x Retina!');
}

captureAllPNGs().catch((err) => {
  console.error('Lỗi chụp ảnh:', err);
  process.exit(1);
});
