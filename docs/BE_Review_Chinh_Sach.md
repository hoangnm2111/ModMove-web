# Review phần Chính sách: gửi người làm BE

Người đọc: lập trình viên Backend.
Phạm vi: nội dung "Chính sách" hiển thị ở landing page Web và màn Tài khoản trên Mobile.

## 1. Luồng hiện tại

| Tầng | Nơi | Việc |
|------|-----|------|
| BE | `PoliciesController` (`GET /api/public/Policies`, không cần đăng nhập) | Gửi `GetPublicContentQuery("POLICY")` |
| BE | `GetPublicContentQueryHandler` | `SELECT code, name, description FROM master_data_items WHERE category='POLICY' AND is_active=1 ORDER BY id` |
| Web | `catalog.service.ts` `loadPolicies()` | Gọi API, lưu vào localStorage, hiển thị ở `PolicyListModal` |
| Mobile | `customer_api.dart` `policies()` | Gọi cùng endpoint, hiển thị ở "Chính sách & điều khoản" |

FE đã dùng đúng API, không viết cứng nội dung. Kết luận: giữ cách lấy từ BE.

## 2. Vấn đề cần BE xử lý

### 2.1 Dữ liệu chính sách đang rỗng (ưu tiên cao)
- `ReferenceDataSeeder` tạo 4 mục `WARRANTY`, `REFUND`, `TERMS_OF_USE`, `PRIVACY` chỉ có `Name`, `Description` luôn NULL.
- Hậu quả: FE hiện 4 tiêu đề, mỗi mục ghi "Nội dung đang được cập nhật." Người dùng không đọc được nội dung chính sách nào.
- Seeder không ghi đè dữ liệu đã có (đúng thiết kế, để không mất nội dung admin đã sửa), nên DB hiện tại sẽ không tự cập nhật khi sửa seeder.

Đề xuất:
1. Viết nội dung mặc định cho 4 chính sách, đúng quy tắc nghiệp vụ đang chạy: phí huỷ, hoàn tiền 100% với đơn đã thanh toán bị huỷ, thời hạn khiếu nại 24 giờ, tự hoàn tất sau 24 giờ, bảo hành, quyền riêng tư.
2. Seed nội dung đó cho mục mới. Với mục đã có nhưng `description` NULL hoặc rỗng, cập nhật bằng migration hoặc script một lần. Không ghi đè mục admin đã nhập.
3. Chỉ chạy script khi đã được phép, không xoá dữ liệu.

### 2.2 Thứ tự hiển thị (ưu tiên trung bình)
- Query sắp xếp theo `id`, nên thứ tự phụ thuộc thứ tự thêm vào DB. Thêm cột `sort_order` hoặc sắp theo danh sách mã cố định để Bảo hành, Hoàn tiền, Điều khoản, Bảo mật luôn đúng thứ tự.

### 2.3 Định dạng nội dung (ưu tiên trung bình)
- `description` là cột `text`, FE hiện bằng `whitespace-pre-line`, tức chỉ xuống dòng, không hỗ trợ Markdown hay HTML.
- Cần thống nhất: văn bản thuần xuống dòng (đề xuất, an toàn, không rủi ro XSS) hay Markdown. Nếu Markdown, BE báo để FE thêm bộ hiển thị. Không lưu HTML thô.
- Giới hạn độ dài khi admin sửa, và validator không cho chuỗi rỗng khi bật `is_active`.

### 2.4 Chỉ trả mục có nội dung (ưu tiên thấp)
- Hiện `is_active=1` là điều kiện duy nhất. Nếu `description` rỗng thì vẫn trả về. Lựa chọn: BE lọc mục rỗng ở endpoint public, hoặc giữ như hiện tại để FE hiện "đang cập nhật". Cần chốt một cách và báo FE.

### 2.5 Bộ nhớ đệm (ưu tiên thấp)
- Endpoint public, ít thay đổi. Có thể thêm `ResponseCache` ngắn hạn hoặc ETag để giảm tải. FE hiện lưu localStorage và gọi lại mỗi lần mở trang, nên nội dung mới vẫn cập nhật khi tải lại.

### 2.6 Phía admin sửa nội dung
- Nội dung do Administrator nhập qua màn Dữ liệu danh mục (UC-ADM-15). BE kiểm tra: lệnh cập nhật có nhận `description`, quyền chỉ Administrator, có ghi nhật ký thay đổi, có giữ lịch sử phiên bản chính sách hay không. Chính sách pháp lý nên lưu được phiên bản để đối chiếu khi có tranh chấp.

## 3. Việc FE đã làm / sẽ làm sau khi BE chốt

- Đã làm: gọi `GET /public/Policies`, hiển thị theo tên và nội dung, trạng thái rỗng.
- Chờ BE: kiểu định dạng nội dung (mục 2.3), thứ tự (2.2). FE sẽ chỉnh hiển thị tương ứng.

## 4. Tiêu chí hoàn thành

1. `GET /api/public/Policies` trả đủ 4 mục có `description` không rỗng, đúng thứ tự.
2. Môi trường mới và DB hiện có đều có nội dung mặc định, không mất nội dung admin đã sửa.
3. Admin sửa nội dung trên giao diện, Web và Mobile hiện nội dung mới sau khi tải lại.
4. Không còn dòng "Nội dung đang được cập nhật." trên landing page.
