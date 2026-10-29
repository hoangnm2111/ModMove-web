const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, 'screens_html');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const PAGES_TO_CAPTURE = [
  // 1. PUBLIC
  {
    role: null,
    name: '01. Landing Page - Trang chủ Giới thiệu',
    url: 'http://localhost:5173/',
    filename: '01_landing.html',
    fileCategory: 'Public & Auth'
  },
  {
    role: null,
    name: '02. Login Page - Đăng nhập & Đăng ký',
    url: 'http://localhost:5173/login',
    filename: '02_login.html',
    fileCategory: 'Public & Auth'
  },

  // 2. CUSTOMER
  {
    role: 'Customer',
    name: '03. Khách hàng - Đặt xe tải 4 bước (Booking)',
    url: 'http://localhost:5173/booking',
    filename: '03_customer_booking.html',
    fileCategory: 'Customer Flow'
  },
  {
    role: 'Customer',
    name: '04. Khách hàng - Quản lý đơn hàng (Orders)',
    url: 'http://localhost:5173/orders',
    filename: '04_customer_orders.html',
    fileCategory: 'Customer Flow'
  },
  {
    role: 'Customer',
    name: '05. Khách hàng - Giám sát chuyến xe thời gian thực (Live Tracking)',
    url: 'http://localhost:5173/tracking',
    filename: '05_customer_tracking.html',
    fileCategory: 'Customer Flow'
  },
  {
    role: 'Customer',
    name: '06. Khách hàng - Ví PayOS & Nạp tiền VietQR',
    url: 'http://localhost:5173/wallet',
    filename: '06_customer_wallet.html',
    fileCategory: 'Customer Flow'
  },

  // 3. DRIVER
  {
    role: 'Driver',
    name: '07. Tài xế - Danh sách đơn hàng chờ nhận (Job Board)',
    url: 'http://localhost:5173/driver',
    filename: '07_driver_joblist.html',
    fileCategory: 'Driver Flow'
  },
  {
    role: 'Driver',
    name: '08. Tài xế - Điều hành cuốc xe & Bản đồ thực hiện (Active Trip)',
    url: 'http://localhost:5173/driver/trip',
    filename: '08_driver_active_trip.html',
    fileCategory: 'Driver Flow'
  },
  {
    role: 'Driver',
    name: '09. Tài xế - Lịch sử chuyến xe & Biên bản bàn giao (Trip History)',
    url: 'http://localhost:5173/driver/history',
    filename: '09_driver_history.html',
    fileCategory: 'Driver Flow'
  },
  {
    role: 'Driver',
    name: '10. Tài xế - Báo cáo sự cố trên đường (Driver Incidents)',
    url: 'http://localhost:5173/driver/incidents',
    filename: '10_driver_incidents.html',
    fileCategory: 'Driver Flow'
  },
  {
    role: 'Driver',
    name: '11. Tài xế - Thu nhập & Lịch sử rút tiền (Driver Earnings)',
    url: 'http://localhost:5173/driver/earnings',
    filename: '11_driver_earnings.html',
    fileCategory: 'Driver Flow'
  },
  {
    role: 'Driver',
    name: '12. Tài xế - Hồ sơ tài xế & Phương tiện xe tải (Driver Profile)',
    url: 'http://localhost:5173/driver/profile',
    filename: '12_driver_profile.html',
    fileCategory: 'Driver Flow'
  },

  // 4. DISPATCHER
  {
    role: 'Dispatcher',
    name: '13. Điều phối - Bản đồ giám sát hạm đội xe trực tiếp (Live Fleet Map)',
    url: 'http://localhost:5173/dispatcher/live-map',
    filename: '13_dispatcher_livemap.html',
    fileCategory: 'Dispatcher Flow'
  },
  {
    role: 'Dispatcher',
    name: '14. Điều phối - Xử lý sự cố & Điều động lại (Incident Handling)',
    url: 'http://localhost:5173/dispatcher/incidents',
    filename: '14_dispatcher_incidents.html',
    fileCategory: 'Dispatcher Flow'
  },
  {
    role: 'Dispatcher',
    name: '15. Điều phối - Giải quyết khiếu nại khách hàng (Complaints)',
    url: 'http://localhost:5173/dispatcher/complaints',
    filename: '15_dispatcher_complaints.html',
    fileCategory: 'Dispatcher Flow'
  },

  // 5. ADMINISTRATOR
  {
    role: 'Administrator',
    name: '16. Quản trị - Báo cáo Dashboard & Doanh thu (Admin Overview)',
    url: 'http://localhost:5173/admin/dashboard',
    filename: '16_admin_dashboard.html',
    fileCategory: 'Admin Flow'
  },
  {
    role: 'Administrator',
    name: '17. Quản trị - Xét duyệt hồ sơ đối tác tài xế (Driver Approval)',
    url: 'http://localhost:5173/admin/drivers',
    filename: '17_admin_drivers.html',
    fileCategory: 'Admin Flow'
  },
  {
    role: 'Administrator',
    name: '18. Quản trị - Quản lý tài khoản người dùng (User Management)',
    url: 'http://localhost:5173/admin/users',
    filename: '18_admin_users.html',
    fileCategory: 'Admin Flow'
  },
  {
    role: 'Administrator',
    name: '19. Quản trị - Duyệt lệnh rút tiền tài xế (Withdrawal Approval)',
    url: 'http://localhost:5173/admin/withdrawals',
    filename: '19_admin_withdrawals.html',
    fileCategory: 'Admin Flow'
  },
  {
    role: 'Administrator',
    name: '20. Quản trị - Cấu hình bảng giá cước xe tải (Pricing Config)',
    url: 'http://localhost:5173/admin/pricing',
    filename: '20_admin_pricing.html',
    fileCategory: 'Admin Flow'
  }
];

async function captureAllPages() {
  console.log('Launching browser to capture fully rendered HTML for all role pages...');
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  const page = await context.newPage();

  for (const item of PAGES_TO_CAPTURE) {
    console.log(`Capturing: ${item.name} (${item.url})`);

    // Set localStorage auth state if required
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

    // Navigate to target url
    await page.goto(item.url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000); // Wait for animations & icons

    // Extract rendered HTML
    const htmlContent = await page.content();
    const filePath = path.join(OUTPUT_DIR, item.filename);
    fs.writeFileSync(filePath, htmlContent, 'utf8');
    console.log(`  -> Saved ${filePath} (${(htmlContent.length / 1024).toFixed(1)} KB)`);
  }

  await browser.close();
  console.log('Finished capturing all pages successfully!');
}

captureAllPages().catch((err) => {
  console.error('Error during capture:', err);
  process.exit(1);
});
