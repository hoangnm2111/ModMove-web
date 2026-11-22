# Review hình ảnh trong 4 Report `_new` (19/11/2026)

Phần chữ của 4 file `_new` đã được sửa theo file chốt nghiệp vụ `ModMove_Chot-nghiep-vu_2026-11-19.xlsx` (K-01…K-38, D-01…D-35). **Hình ảnh thì chưa được vẽ lại**: file này liệt kê từng hình đang lệch với chữ và code, cần sửa gì, để bạn sửa trong draw.io / Figma rồi thay vào Word.

Cột **"Đã xem"**:
- **✅** là mình đã mở ảnh ra xem và xác nhận lỗi.
- **🔎** là suy ra từ chú thích và nội dung xung quanh, bạn cần mở ra kiểm tra lại.

Cột **Ưu tiên**:
- **Cao** là hình trái với quyết định nghiệp vụ, hội đồng dễ hỏi.
- **TB** là hình lệch tên hoặc chi tiết.
- **Thấp** là chỉ thiếu chú thích hoặc chi tiết nhỏ.

File ảnh gốc nằm trong `word/media/` của từng docx (đổi `.docx` thành `.zip` để lấy ra).

---

## Report-1 `_new`

Chỉ có 1 hình là logo bìa, không cần sửa.

## Report-2 `_new`

| Mục | Hình | Đã xem | Vấn đề | Cần sửa | Ưu tiên |
|---|---|---|---|---|---|
| II.1 | Development process cycle | 🔎 | Không có nội dung lệch nghiệp vụ | Không cần sửa | — |
| II.4 | Bảng RACI (ảnh) | 🔎 | Không có nội dung lệch nghiệp vụ | Không cần sửa | — |

---

## Report-3 (SRS) `_new`

### Phần I

| Mục | Hình (media) | Đã xem | Vấn đề | Cần sửa | Ưu tiên |
|---|---|---|---|---|---|
| I.1 | Context Diagram (`image60`) | 🔎 | Đã vẽ lại ngày 18–19/11 với MapVina | Kiểm tra lại: không còn "AI", không còn Google Maps | Thấp |
| I.2.2 BF-02 | Driver onboarding (`image70`) | ✅ | Chữ BF-02 đã đổi thành đăng ký bằng email + OTP rồi nộp 7 ảnh. Hình chỉ có "Reject Driver Application" chung chung | Ghi chú "Reject từng mục + lý do", "nộp lại chỉ mục bị từ chối"; nhánh Approve thêm "tạo ví, nạp cọc rồi mới Online" | TB |
| I.2.3 BF-03 | Create shipping order (`image35`) | ✅ | **Trái K-01, K-02**: còn "Analyze Cargo", "View AI Suggestion" và "Recomment Vehicle Type" ở làn Dispatcher; "Select Driver Automatically" và "Reject Job Request" kiểu giao từng tài xế | Bỏ làn Dispatcher và các bước AI. System: "Lọc loại xe theo tải trọng/kích thước" → "Tính cước". Ghép đơn: "Hiện đơn cho mọi tài xế trong bán kính", tài xế "Nhận đơn", "ai nhận trước được"; nhánh "10 phút không ai nhận → huỷ đơn". Sửa chính tả "Creatr", "Recomment" | **Cao** |
| I.2.4 BF-04 | Driver Verifies Cargo (`image14`) | 🔎 | K-19: đơn tiền mặt người gửi trả phải thu tiền **trước** khi gửi ảnh lấy hàng | Thêm bước "Thu tiền người gửi (nếu Cash/Sender)" trước "Upload 2–5 ảnh" | TB |
| I.2.5 BF-05 | Delivery & incident (`image85`) | 🔎 | Cần khớp: mỗi báo cáo là một sự cố mới (K-18); Dispatcher không tự đóng khiếu nại (K-25) | Kiểm tra lại và sửa nếu hình có "gộp sự cố" | Thấp |
| I.2.6 BF-06 | Order Payment Flow (`image69`) | ✅ | Không có hoá đơn điện tử (khớp K-04). Thiếu nhánh khách đóng trang thanh toán (K-28) | Thêm nhánh "Close payment page → Cancel payment session (PayOS) → order vẫn Pending/Unpaid". Sửa chính tả "Recieve QR" | Thấp |
| I.3.1 | ERD khái niệm (`image63`) | ✅ | **Trái K-11**: DriverProfile còn DriverLicenseNumber, CitizenIdentityCardNumber, DriverLicenseFront/BackPhoto. DriverApplication thiếu DocumentPhotos (7 ảnh) và RejectedItems. WalletTransaction còn "WithdrawEarnings", thiếu DepositRefill, Withdrawal. Refund thiếu status Withdrawn và tài khoản nhận. PaymentTransaction thiếu Expired. ShippingOrder ghi "Pickup" (phải là Arrived, PickedUp) và chữ "Cancecontains" bị dính. InTransitIncident thiếu Cancelled, ReportedBy, IsBlocking | Vẽ lại theo bảng I.3.2 đã sửa trong `_new` | **Cao** |
| I.4.3.2 | UC Customer (`image25`) | 🔎 | Mã Hủy đơn đổi UC-CUS-29 → 28; khách không sửa được đơn (K-17) | Nếu hình có mã UC hoặc "Edit order" thì sửa | TB |
| I.4.3.3 | UC Driver (`image90`) | 🔎 | K-31: đổi thông tin xe = nộp lại hồ sơ | Nếu có "Update vehicle info" riêng thì nối sang "Update Rejected Documents / Resubmit" | Thấp |
| I.4.3.4 | UC Admin (`image73`) | 🔎 | K-29: UC-ADM-19, UC-ADM-20 đánh dấu planned. K-30: thêm loại xe, sửa coupon | Ghi "(planned)" cạnh UC-ADM-19/20 hoặc tô xám | Thấp |
| I.5.1a | Screen Flow (`image66`) | 🔎 | K-07: web không còn màn tài xế | Bỏ các màn Driver trên web nếu có (giữ màn tài xế ở mobile) | TB |

### Phần III (ảnh chụp màn hình)

| Mục | Hình (media) | Đã xem | Vấn đề | Cần sửa | Ưu tiên |
|---|---|---|---|---|---|
| III.2 (đã xoá) | 8 ảnh màn tài xế trên web (Nearby jobs, Current trip, My incidents, Driver profile) | ✅ (đã xoá khỏi file) | K-07: web bỏ trang Driver | Đã xoá cả mục III.2, thay bằng một đoạn "Tài xế chỉ dùng app mobile (III.8)". **Không cần làm thêm**; nếu muốn giữ số mục thì để nguyên đoạn đó | — |
| III.1.6 | PayOS payment dialog | 🔎 | K-28: hộp thoại có thêm dòng "Đóng hộp thoại này sẽ huỷ mã đang chờ…" | Chụp lại (không bắt buộc) | Thấp |
| III.4.2a–c | Thẩm định hồ sơ tài xế | 🔎 | K-11: chữ đã bỏ số CCCD/GPLX và đổi thành 7 ảnh. Nếu ảnh còn ô số CCCD/GPLX hoặc 5 ảnh thì lệch | Chụp lại trên `main_new` | TB |
| III.4.6a | Pricing & commission (`image86`) | 🔎 | K-30: trang có nút **"Thêm loại xe"** mới | Chụp lại, thêm 1 ảnh hộp thoại "Thêm loại xe" | TB |
| III.4.7a/b | Coupons (`image28`, `image43`) | 🔎 | K-30: mỗi dòng có nút **"Sửa"**, hộp thoại sửa khoá ô Mã | Chụp lại, thêm 1 ảnh hộp thoại "Sửa mã" | TB |
| III.4.8a | Danh mục hệ thống (`image18`) | ✅ | K-24: còn tab **"Nhóm sự cố 4"** | Chụp lại: web `main_new` đã ẩn tab này | TB |
| III.5.1a | Đăng nhập (`image27`) | ✅ | K-12: nhãn **"Email hoặc số điện thoại"**. K-07: còn thẻ demo **"Tài xế"**. Phụ đề ghi "Dùng chung cho … tài xế" | Chụp lại trên `main_new`: nhãn "Email", không còn thẻ Tài xế | **Cao** |
| III.5.1b | Đăng ký | 🔎 | K-13: mật khẩu 8–20 | Chụp lại nếu ảnh có gợi ý "8–100" | Thấp |
| III.8.1.1 | Mobile – Bước 1 giấy tờ cá nhân (`image57`) | ✅ | **Trái K-11**: còn ô "Số CCCD" và "Số giấy phép lái xe" | Chụp lại trên app hiện tại: app đã bỏ 2 ô này | **Cao** |
| III.8.1.2 | Mobile – Bước 2 phương tiện (`image34`) | 🔎 | K-35: kích thước thùng phải là cm, không phải mét | Chụp lại | TB |
| III.8.1.3 | Mobile – Hồ sơ đã duyệt (`image82`) | 🔎 | K-11: không còn số CCCD/GPLX (kể cả dạng che) | Chụp lại | TB |
| III.8.1.4 | Mobile – Chờ duyệt (`image89`) | 🔎 | K-35: L × W × H theo cm | Chụp lại nếu ảnh ghi "m" | Thấp |

---

## Report-4 (SDS) `_new`

| Mục | Hình (media) | Đã xem | Vấn đề | Cần sửa | Ưu tiên |
|---|---|---|---|---|---|
| I.1 Figure 1 | Kiến trúc tổng thể (`image25`) | ✅ | "React 19" (thật là 18.3.1). Mobile ghi "core: ApiClient (Dio)" (thật là package http). Mũi tên "WebSocket (SignalR) GPS & live tracking" từ mobile vào hub (K-22: GPS gửi bằng REST vào Controllers, hub chỉ đẩy xuống) | Sửa nhãn React 18.3.1 và "ApiClient (http)". Mũi tên GPS: Mobile → Controllers (HTTPS REST `POST api/driver/location`). Mũi tên hub: TrackingHub → Web/Mobile "SignalR push: location, status, notifications". Background Jobs ghi 5 job | **Cao** |
| I.2.1 | Backend package diagram (`image8`) | 🔎 | Bảng 2.1 đã sửa: MapVinaMapService + CachedMapService, GpsLogCleanupJob, RefreshTokenCleanupJob, OpenXmlExcelExporter, ActiveAccountFilter, không có OtpService | Đổi tên class trong hình cho khớp bảng | TB |
| I.2.2 Figure 3 | Web package diagram (`image18`) | ✅ | Còn PublicLayout, AuthLayout, ProtectedRoute, RoleGuard, pages/public, pages/errors, features "drivers", hooks useAuth/useTracking/useDebounce, store authStore/uiStore, services apiClient/trackingHub, components DataTable/StatusBadge/ImageUploader/ConfirmDialog | Vẽ lại theo bảng 2.2: routes (AppRoutes: RequireRole, GuestOnly, GuestOrCustomer); layouts (Customer/Dispatcher/AdminLayout, SidebarParts); pages (landing, auth, account, customer, dispatcher, admin); thêm khối `api` (endpoints, types, errors, labels, useQuery); hooks (useDomainData, useLiveData, useRealtime); store (useAuthStore, useBookingDraftStore, useSidebarStore); services (api.ts, *.service.ts, realtime.service.ts) | **Cao** |
| I.2.3 Figure 4 | Mobile package diagram (`image9`) | ✅ | Còn lib/shared, features/common, driver/jobs·trips·pod·wallet, core di (get_it), network (Dio), realtime, router, storage. **Ảnh còn dính khung chọn (dấu x xanh) của draw.io** | Vẽ lại theo bảng 2.3: app (main, app, push_host, realtime_host); core (config, network/http, session, notifications, theme, widgets, format); features: auth, notifications, home, customer, onboarding, driver_trip, driver_account (mỗi feature có data/domain/presentation). Xuất lại ảnh không có khung chọn | **Cao** |
| I.3 Figure 5 | ERD vật lý (`image24`) | ✅ | Còn bảng **support_requests** (K-32). driver_profiles và driver_applications còn citizen_id_number, driver_license_number (K-11). Thiếu: driver_applications.rejected_items; otp_verifications full_name, phone_number, password_hash, role + UNIQUE(email, purpose); shipping_orders.arrived_at_dropoff_at; payment_transactions payer_bank_bin, payer_account_number, payer_account_name; wallet_transactions earnings_amount, deposit_amount; refunds payout_* (6 cột) | Vẽ lại theo mục 3.x đã sửa (21 bảng). Có thể sinh từ DB thật bằng MySQL Workbench (Reverse Engineer) | **Cao** |
| II.2.1 | Class diagram Driver Onboarding (`image21`) | 🔎 | Có thể còn thuộc tính CitizenIdNumber/LicenseNumber | Bỏ nếu có; DriverApplication thêm RejectedItems, DocumentUrls (7) | TB |
| II.4.2 / II.5.1 / II.5.2 | (`image27`, `image7`) | 🔎 | 2 ảnh của mục 5 nằm trong đoạn tiêu đề "5.2", mục 4.2 không có ảnh. Mình **không gắn caption** cho 4.2, 5.1, 5.2 vì không xác định được ảnh nào là ảnh nào | Mở Word: đặt mỗi ảnh dưới đúng tiêu đề, thêm caption. 4.2 cần sequence "View Request Job" | TB |
| II.9.3 | Request Withdrawal (`image6`) | 🔎 | Ảnh nằm trong đoạn tiêu đề, không có caption | Thêm caption "Request Withdrawal sequence diagram" | Thấp |
| II (thiếu) | — | — | D-32: thiếu sequence cho Accept Job (RowVersion), Confirm Pickup + Review Evidence (kèm K-19 thu tiền người gửi trước), Settlement khi Completed, Cancel + Refund, Report Incident, Approve/Payout Refund, background jobs | Vẽ thêm các sequence này. Đề xuất thêm 3 hình cho tính năng mới: **Cancel PayOS session** (K-28), **Admin add vehicle type / edit coupon** (K-30), **View driver document qua signed link** (K-33) | TB |

---

## Việc khác khi mở Word

1. **Mục lục:** Report-1 `_new` đã được cập nhật mục lục (TOC) bằng Word. **Report-2, 3, 4 chưa cập nhật** vì Word bị treo khi xuất PDF. Mở từng file, bấm vào mục lục → F9 → *Update entire table*. Report-3 cần làm nhất, vì mục lục còn các mục III.2 "2.1 Nearby Jobs…" đã xoá.
2. **Bìa:** "– Hanoi, Aug 2026 –" vẫn giữ nguyên vì bạn không tích D-05.
3. **Change log:** 4 file đã có dòng 19/11/2026 với người phụ trách là "TriNK". Bạn đổi tên nếu người khác làm. Report-4 dòng 19/10 trước để trống, mình điền "HieuTT" theo các dòng cùng phần; Report-3 dòng 11/11 điền "HoangNM" theo commit ví GB-32 trên BE. **Nhờ bạn xác nhận lại 2 tên này.**

## Chỗ code còn lệch với ảnh (nên sửa trước khi chụp lại)

- Ảnh III.5.1a là bản thiết kế cũ. Trang đăng nhập trên `main_new` không còn phụ đề nhắc tài xế, chỉ cần chụp lại.
- Web `main_new` hiển thị bản đồ bằng Google Maps nhúng (`MapEmbed.tsx`, không có key). Bản MapVina GL nằm ở nhánh cũ (đã cất vào `git stash`) và cần map proxy ở BE, mà map proxy đã bỏ theo K-09. Report-4 đã ghi đúng là "web dùng bản đồ nhúng".
