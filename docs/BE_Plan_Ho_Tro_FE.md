# Kế hoạch triển khai Backend để hoàn thiện FE Web và Mobile

Người đọc: lập trình viên Backend (.NET 8, Clean Architecture, CQRS/MediatR, Dapper, MySQL).
Mục đích: liệt kê thay đổi BE cần làm để FE Web và Mobile hoàn tất 6 task gần nhất. FE đã xong phần của mình, các mục dưới đây là phần còn chặn.

Mức ưu tiên: P0 chặn FE, P1 nên làm, P2 tuỳ chọn.

---

## Tổng quan

| # | Việc | Ưu tiên | FE đang chờ gì |
|---|------|---------|----------------|
| 1 | CCCD và giấy phép lái xe chỉ cần ảnh hai mặt, bỏ số nhập tay | P0 | Gỡ ô nhập số trên Mobile và Web |
| 2 | Sửa lệch giờ +7h ở hồ sơ tài xế | P0 | FE đã hiển thị giờ Việt Nam, BE cần trả đúng UTC |
| 3 | Nộp lại hồ sơ chỉ gồm phần bị từ chối | P1 | Mobile và Web đang gửi lại toàn bộ 7 ảnh |
| 4 | Lý do từ chối có cấu trúc theo từng mục | P1 | FE đang đoán mục bị từ chối bằng cách so khớp chữ |
| 5 | Mã lỗi riêng cho sai số tài khoản khi admin duyệt chi | P0 | Nút "Sai số tài khoản" thay cho lỗi hệ thống |
| 6 | Chặn thu tiền mặt sai vị trí và sai thời điểm | P1 | FE đã khoá nút, BE cần chốt chặn thứ hai |
| 7 | Xuất Excel các khoản đã duyệt chi | Đã xong | Chỉ cần xác nhận hợp đồng API |
| 8 | Lỗi tải ảnh lên Cloudinary trả 500 | P2 | Không còn tái hiện, theo dõi thêm |

---

## 1. Bỏ số CCCD và số giấy phép, chỉ giữ ảnh (P0)

Hiện trạng
- `citizenIdNumber` và `driverLicenseNumber` là trường bắt buộc trong `SubmitDriverApplicationCommandValidator`, có kiểm tra trùng, cột DB là NOT NULL.
- `documentUrls` yêu cầu đúng 7 ảnh.

Việc cần làm
1. Quyết định: bỏ hẳn hai số, hoặc để tuỳ chọn. Đề xuất để tuỳ chọn (nullable) để không vỡ dữ liệu cũ.
2. Migration: đổi hai cột sang NULL, bỏ unique index hoặc đổi thành unique có điều kiện (chỉ khi khác NULL). Không xoá dữ liệu hiện có.
3. Validator: bỏ `NotEmpty` và kiểm tra định dạng cho hai trường. Nếu có giá trị thì mới kiểm tra.
4. Handler: bỏ kiểm tra trùng khi giá trị rỗng.
5. DTO phản hồi cho admin: giữ hai trường nhưng cho phép null.
6. Giữ nguyên ràng buộc 7 ảnh. Đảm bảo thứ tự và loại ảnh rõ ràng: CCCD mặt trước, CCCD mặt sau, giấy phép mặt trước, giấy phép mặt sau, cùng các ảnh còn lại theo hợp đồng D2.

Tiêu chí hoàn thành
- Gửi hồ sơ không có hai số vẫn trả 200.
- Gửi hồ sơ thiếu ảnh mặt sau trả lỗi validation có mã rõ ràng.

FE sẽ làm sau khi BE xong: gỡ ô nhập trên `verification_screen.dart`, `validate_driver_application.dart`, `BackendDriverRepository.submit`, `DriverApi.submitOnboarding` (Mobile) và `DriverProfilePage.tsx`, `DriverApprovalPage` (Web).

---

## 2. Lệch giờ +7h (P0)

Nguyên nhân gốc
- MySQL lưu `DATETIME` theo UTC. Dapper đọc ra `DateTimeOffset` với `DateTimeKind.Unspecified` và gán offset theo múi giờ máy chủ (+07:00). Giá trị UTC bị gắn nhãn +07:00 nên khi quy đổi lại bị lệch 7 giờ.
- Các handler trong DriverOnboarding đọc qua Dapper trực tiếp, chưa đi qua `SqlHelpers.ToUtc`.

Cách sửa đề xuất (một chỗ, áp dụng toàn hệ thống)
1. Tạo `src/ModMove.Infrastructure/Persistence/UtcDateTimeOffsetTypeHandler.cs`: kế thừa `SqlMapper.TypeHandler<DateTimeOffset>`, `Parse` đổi `DateTime` thành `new DateTimeOffset(DateTime.SpecifyKind(value, DateTimeKind.Utc))`, `SetValue` ghi `UtcDateTime`.
2. Đăng ký trong static constructor của `SqlConnectionFactory`: `SqlMapper.AddTypeHandler(new UtcDateTimeOffsetTypeHandler())`. Làm tương tự cho `DateTimeOffset?` nếu cần.
3. Rà các handler đã tự gọi `SqlHelpers.ToUtc` để tránh quy đổi hai lần.
4. API luôn trả ISO 8601 có hậu tố `Z`.

Tiêu chí hoàn thành
- Tài xế nộp lúc 14:00 giờ Việt Nam thì API trả `...T07:00:00Z`, admin Web và Mobile hiển thị 14:00.
- Thêm một test tích hợp cho query `submittedAt` của hồ sơ tài xế.

Lưu ý: kiểm tra các màn hình khác đang tự cộng 7 giờ ở FE trước đây. Phía FE đã thống nhất hiển thị theo `Asia/Ho_Chi_Minh` nên không cộng thêm.

---

## 3. Nộp lại hồ sơ chỉ phần bị từ chối (P1)

Hiện trạng
- Sau khi bị từ chối, tài xế phải gửi lại đủ 7 ảnh và toàn bộ thông tin.

Việc cần làm
1. Thêm lệnh nộp lại, ví dụ `POST /api/driver/Onboarding/resubmit`, nhận danh sách chỉ gồm các mục bị từ chối: `{ items: [{ key, url }], vehicle?: {...} }`.
2. Handler: chỉ chấp nhận khi hồ sơ ở trạng thái `Rejected`. Ghép các mục mới vào hồ sơ hiện có, giữ nguyên các ảnh đã được chấp nhận. Mục không nằm trong danh sách bị từ chối thì bỏ qua hoặc trả lỗi.
3. Sau khi nộp lại: trạng thái về `Pending`, tăng `version`, xoá lý do từ chối của các mục đã sửa, ghi lịch sử.
4. Giữ endpoint submit cũ để tương thích. Validator của endpoint mới chỉ kiểm tra các mục gửi lên.
5. Cho phép lưu nháp ở mọi trạng thái cần sửa (Draft, Rejected), không khoá trường nào ở phía BE.

Tiêu chí hoàn thành
- Từ chối 2 mục, tài xế gửi lại đúng 2 mục, hồ sơ chuyển Pending và admin thấy 7 ảnh đầy đủ.

---

## 4. Lý do từ chối có cấu trúc (P1)

Hiện trạng
- Lý do là chuỗi tự do; Web admin gửi dạng `"<tên mục>: <lý do>"`. Mobile phải so khớp chữ qua `rejection_mapper.dart`, dễ sai.

Việc cần làm
1. Đổi hoặc thêm trường `rejectedItems: [{ key, reason }]` với `key` thuộc tập cố định: `CitizenIdFront`, `CitizenIdBack`, `LicenseFront`, `LicenseBack`, `VehicleRegistration`, `VehiclePhoto`, `Portrait`, `VehicleInfo`, `PersonalInfo` (chốt danh sách cùng FE).
2. Command từ chối của admin nhận danh sách này; vẫn nhận chuỗi cũ để tương thích.
3. API hồ sơ của tài xế và của admin trả cùng cấu trúc.

Tiêu chí hoàn thành
- FE bỏ mapper so khớp chữ và dùng trực tiếp `key`.

---

## 5. Mã lỗi riêng cho sai số tài khoản (P0)

Hiện trạng
- Khi admin duyệt chi và số tài khoản sai (ngân hàng báo lỗi hoặc dữ liệu không hợp lệ), BE trả lỗi hệ thống chung. FE phải tự dựng nút "Sai số tài khoản" bằng cách gửi lý do viết sẵn.

Việc cần làm
1. Thêm mã lỗi nghiệp vụ `WRONG_BANK_ACCOUNT` (HTTP 422) và thêm vào `ExceptionHandlingMiddleware`.
2. Thêm hành động rõ ràng cho rút tiền tài xế và hoàn tiền khách: `POST .../withdrawals/{id}/reject` và `.../refunds/{id}/reject` nhận `reasonCode` (`WrongBankAccount`, `Other`) và `note`.
3. Khi chọn `WrongBankAccount`: trạng thái chuyển về chờ cập nhật tài khoản, hoàn lại số dư (rút tiền) hoặc giữ khoản hoàn (hoàn tiền), gửi thông báo cho người nhận để cập nhật số tài khoản.
4. Không trả lỗi 500 cho các trường hợp trên.

Tiêu chí hoàn thành
- Admin bấm "Sai số tài khoản" thì người dùng nhận thông báo, FE hiển thị trạng thái đúng và không còn lỗi hệ thống.

---

## 6. Chặn thu tiền mặt sai vị trí (P1)

Quy tắc FE đang áp dụng
- Người gửi trả: xác nhận thu tiền chỉ ở điểm lấy hàng.
- Người nhận trả: xác nhận thu tiền chỉ ở điểm giao hàng.
- Luôn có bước xác nhận trước khi gửi.

Việc cần làm ở BE
1. Hiện BE cho phép thu khi người gửi trả ở các trạng thái Arrived đến InTransit, người nhận trả ở InTransit. Siết lại: người gửi trả chỉ tại điểm lấy, người nhận trả chỉ khi đã tới điểm giao (`ArrivedAtDropoff` hoặc tương đương).
2. Nhận thêm toạ độ hiện tại của tài xế trong lệnh thu tiền và kiểm tra bán kính (đang dùng `arrivalRadiusM = 500`). Trả mã lỗi `COLLECT_CASH_WRONG_LOCATION` khi sai.
3. Chặn thu hai lần (idempotent theo mã đơn).

Tiêu chí hoàn thành
- Gọi trực tiếp API ngoài vị trí hoặc sai bước thì bị từ chối kể cả khi FE bị bỏ qua.

---

## 7. Xuất Excel các khoản chi hộ đã duyệt (đã xong)

Endpoint: `GET /api/admin/Reports/payouts/export?fromDate&toDate&role=All|Driver|Customer`, trả file xlsx, tên file `BangKeChiHo_...` trong `Content-Disposition`.

FE Web đã nối (nút "Xuất Excel chi hộ" ở trang rút tiền và hoàn tiền). Cần BE xác nhận:
- Tên file có `Content-Disposition` được expose qua CORS (`Access-Control-Expose-Headers`), nếu không trình duyệt không đọc được tên file.
- Khi không có dữ liệu trong khoảng ngày: trả file rỗng có tiêu đề hay trả lỗi mã rõ ràng. FE đang đọc lỗi dạng JSON từ blob.
- Cột và thứ tự cột chốt cho kế toán.

Mobile: admin không dùng mobile nên không cần màn hình xuất.

---

## 8. Lỗi tải ảnh lên Cloudinary trả 500 (P2, tạm thời không còn tái hiện)

Hiện trạng
- Upload từng trả `SERVER_ERROR`, traceId `0HNQ3U97NAJAA:00000001`. Lần thử gần nhất không còn lỗi, chưa rõ nguyên nhân (có thể do BE chưa nạp cấu hình hoặc phải khởi động lại). Nếu tái hiện, lấy dòng `fail:` trong console theo traceId.

Việc cần làm
1. Xem log console BE theo traceId và gửi nội dung exception.
2. Kiểm tra cấu hình Cloudinary (cloud name, API key, secret) trong môi trường chạy, giới hạn kích thước và định dạng, thư mục đích.
3. Trả lỗi có mã (`UPLOAD_FAILED`, `FILE_TOO_LARGE`, `UNSUPPORTED_FILE_TYPE`) thay vì 500 chung.

---

## 9. Việc cần quyết định trước khi chạy BE

- Migration `RegistrationHeldUntilVerified` sẽ xoá các người dùng chưa xác minh (id 13 và 15). Cần chủ dự án đồng ý trước khi chạy, hoặc đổi migration để không xoá. Không xoá dữ liệu khi chưa được cho phép.
- Thứ tự đề xuất: mục 2 và 5, rồi 1, rồi 8, sau đó 3 và 4, cuối cùng 6.

## 10. Hợp đồng chung cho FE

- Thời gian: ISO 8601 UTC có hậu tố `Z`.
- Lỗi: luôn có `code` ổn định và `message` tiếng Việt, FE ánh xạ theo `code`.
- Thêm trường mới theo kiểu tương thích ngược, không đổi tên trường cũ khi chưa báo FE.
- Cập nhật Swagger sau mỗi mục để FE sinh lại kiểu.
