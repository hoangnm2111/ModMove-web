# Kế hoạch: đưa bản đồ MapVina GL vào web

Ngày: 2026-11-18. Phạm vi: chỉ phần **hiển thị bản đồ** ở web. Không đổi nghiệp vụ, không đổi cách BE tính giá (BE vẫn là nơi gọi MapVina Search/Directions).

## 1. Hiện trạng (đã kiểm tra source)
| Chức năng | Đang dùng | Ghi chú |
|---|---|---|
| Hiển thị bản đồ | Google Maps **iframe** (`src/components/MapEmbed.tsx`) | 8 chỗ dùng, không cần key, không điều khiển được (không marker tuỳ biến/đường vẽ riêng) |
| Gợi ý địa chỉ | Photon (OSM) – `services/map.service.ts` | Giữ nguyên |
| Giá / km / geocode | BE gọi MapVina (`MapVinaMapService`, có cache; gói Free 200 geocode + 200 route/ngày) | Giữ nguyên |
| Mobile | `mapvina_gl` + style `https://maps.mapvina.com/styles/v2/streets.json?key=KEY` | Nhóm mobile đã xác nhận style đúng chuẩn **MapLibre style spec** |

Các chỗ dùng `MapEmbed`:
1. `pages/customer/BookingPage.tsx` – lộ trình khi đặt (có thể chỉ có địa chỉ chữ `fromText/toText`)
2. `pages/customer/OrderDetailPage.tsx` – theo dõi tài xế (from = vị trí tài xế, to = điểm lấy/giao)
3. `pages/driver/DriverHomePage.tsx` – chuyến hiện tại (lấy → giao)
4. `pages/driver/DriverJobListPage.tsx` – xem trước đơn (lấy → giao)
5. `pages/dispatcher/LiveMapPage.tsx` – vị trí 1 tài xế
6. `features/dispatcher/IncidentDrawer.tsx` – vị trí báo sự cố
7. `features/dispatcher/DispatcherOrderDrawer.tsx` – lộ trình đơn
8. `mapsLink()` – link mở Google Maps ngoài tab (giữ nguyên)

## 2. Quyết định kỹ thuật
- **Thư viện:** `maplibre-gl` (MapVina không có SDK web riêng mà tôi xác minh được; style của họ là chuẩn MapLibre). Chốt phiên bản khi cài (chọn bản đã phát hành ≥ 2 tuần, ghim đúng phiên bản trong `package.json`). **Bước 0 (spike) phải xác nhận** tile TP.HCM hiển thị được từ trình duyệt (CORS, key).
- **Style:** `https://maps.mapvina.com/styles/v2/streets.json?key=${VITE_MAPVINA_KEY}`.
- **Key:** MapVina yêu cầu key nằm trong URL style nên **key lộ ở trình duyệt** (không tránh được, giống mobile). Biện pháp:
  - Dùng **key riêng cho web** (khác key BE đang dùng cho Search/Directions, vì key BE có hạn mức 200/ngày) → xin nhóm/tạo thêm ở account.mapvina.com.
  - Hỏi MapVina có giới hạn theo domain/referrer không; nếu có thì bật.
  - Key đặt trong `.env` (`VITE_MAPVINA_KEY`), chỉ ghi `VITE_MAPVINA_KEY=` vào `.env.example`. Không commit key thật.
  - Mặc định dev: `public_key` (hạn mức thấp, mobile đang dùng).
- **Đường đi (polyline):** FE **không** gọi Directions của MapVina (lộ key + ăn hạn mức route 200/ngày). Phương án:
  - **A (làm ngay, không cần BE):** vẽ **đường thẳng nét đứt** giữa các điểm + marker (giống chế độ dự phòng của mobile).
  - **B (cần BE, làm sau):** BE trả thêm `polyline` (encoded, 5 chữ số, kiểu Google – `GET driver/route` đã trả sẵn cho tài xế) trong FareEstimate/Order detail/Tracking; web giải mã và vẽ đường thật. Việc này đã có dạng sẵn ở BE nên chi phí thấp, nhưng mỗi lần gọi tốn 1 lượt route nên cần cache.
- **Fallback:** nếu không có key, trình duyệt không hỗ trợ WebGL, hoặc tải style lỗi → tự rơi về `MapEmbed` Google hiện tại (không làm hỏng màn hình nào).
- **Hiệu năng:** `maplibre-gl` nặng (~vài trăm KB gzip) → `React.lazy` / dynamic import, chỉ tải khi trang có bản đồ; thêm CSS `maplibre-gl/dist/maplibre-gl.css`.

## 3. Thiết kế component
`src/components/MapVinaMap.tsx` (mới), **cùng props với `MapEmbed`** để đổi tại chỗ không sửa nghiệp vụ:
`from?`, `to?`, `point?`, `fromText?`, `toText?`, `zoom?`, `className?`, `title?` (+ tuỳ chọn `markers?`, `showRoute?`).
- Có `from`+`to`: marker lấy (xanh dương) / giao (xanh lá), đường nét đứt, `fitBounds` có padding.
- Có `point`: 1 marker (tài xế), `flyTo`; cập nhật vị trí không tạo lại map (dùng `setLngLat`).
- Chỉ có `fromText/toText` (BookingPage khi chưa có toạ độ): hiện khung "Chưa có toạ độ" hoặc fallback Google iframe như hiện nay (BookingPage đã lưu `lat/lng` từ gợi ý Photon nên đa số trường hợp có toạ độ).
- Chống lỗi: bọc `try/catch`, lỗi style → `onError` → fallback `MapEmbed`.
- Dọn `map.remove()` khi unmount; không tạo map khi `display:none`.
- `src/components/MapEmbed.tsx` giữ lại làm fallback; export `MapView = MapVinaMap | MapEmbed` để các trang chỉ import một chỗ.

## 4. Các bước triển khai
| Bước | Việc | Nghiệm thu |
|---|---|---|
| 0 | **Spike** (nhánh nháp `spike/web-mapvina-gl`): cài `maplibre-gl`, hiển thị style MapVina với `public_key` ở trang thử | Thấy bản đồ TP.HCM, kéo/zoom được, không lỗi CORS/console |
| 1 | Thêm `VITE_MAPVINA_KEY` (`.env.example`, `vite-env.d.ts`), `config/map.ts` (style URL, mặc định `public_key`) | `tsc` sạch, key không nằm trong git |
| 2 | Viết `MapVinaMap.tsx` (+lazy, fallback `MapEmbed`) | Hiển thị đúng 3 chế độ: 1 điểm, 2 điểm, không toạ độ |
| 3 | Thay thế lần lượt: DriverJobList → DriverHome → IncidentDrawer → LiveMap → DispatcherOrderDrawer → BookingPage → OrderDetail | Mỗi trang: toạ độ đúng, không tràn ngang 375/768/1280 |
| 4 | Theo dõi realtime (OrderDetail, LiveMap): cập nhật marker từ `LocationUpdated` (`useDriverLocations`) bằng `setLngLat`, không re-render cả map | Marker di chuyển, không nhấp nháy, không rò bộ nhớ |
| 5 | (Tuỳ chọn, cần BE) đường đi thật bằng polyline (phương án B) | Đường đi trùng quãng đường BE dùng tính giá |
| 6 | Dọn: bỏ phụ thuộc Google iframe nếu fallback không còn cần; cập nhật README/`docs` | Build sạch |

## 5. Test
- Unit: hàm tính bounds / hợp lệ toạ độ (đã có `ok()` trong `MapEmbed`), giải mã polyline (nếu làm B). Mock `maplibre-gl` trong vitest (jsdom không có WebGL).
- Playwright: mở từng trang trong bảng mục 1, kiểm canvas `.maplibregl-canvas` xuất hiện, không lỗi console, không request ≥400 tới `maps.mapvina.com`; tắt key → thấy fallback.
- Hồi quy QA: chạy lại quét 3 độ rộng cho các trang đã đổi.

## 6. Rủi ro / việc cần bạn quyết
1. **Key web:** dùng chung key BE hay xin key riêng? (khuyên: key riêng; key trình duyệt luôn lộ).
2. **Có giới hạn domain** ở MapVina không? Cần hỏi/đọc docs MapVina trước khi lên production.
3. **Đường đi thật** (phương án B) có làm không – cần BE thêm `polyline`.
4. **Dữ liệu bản đồ/giấy phép:** Directions của MapVina ghi `copyrights: TrackAsia data` → cần hiển thị attribution trên bản đồ (MapLibre có sẵn control, không được ẩn).
5. **Hạn mức tile:** mobile ghi "MapView miễn phí" nhưng chưa thấy số liệu chính thức cho web; đo trong spike.
6. WebGL không có (máy yếu/headless) → đã có fallback `MapEmbed`.

## 7. Ước lượng
Spike 0,5 ngày · component + thay 7 chỗ 1–1,5 ngày · realtime + test 0,5–1 ngày · (tuỳ chọn) polyline cần BE 0,5 ngày + FE 0,5 ngày.
