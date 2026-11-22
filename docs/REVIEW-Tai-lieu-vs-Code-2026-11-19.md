# ModMove – Review tài liệu (Report 1–4) đối chiếu với source code

**Ngày review:** 19/11/2026
**Tài liệu đã đọc:** Report-1 Project Introduction, Report-2 Project Management Plan, Report-3 SRS, Report-4 SDS (bản `.docx` trong `ModMove-web/docs/`).
**Code đã đối chiếu (bản chuẩn, đã `git fetch` ngày 19/11, đọc bằng `git show`, không checkout):**

| Repo | Nhánh chuẩn | Commit | Ghi chú |
|---|---|---|---|
| ModMove-backend | `origin/develop` | `689e801` (merge PR #53) | Hơn bản review lần 1 (`feat/map-proxy` 5fda933) đúng 7 commit, chỉ thêm việc **xoá Support Requests** |
| ModMove-web | `origin/main` | `5ad9e14` (merge PR #4) | Khác bản lần 1 ở realtime, LiveMap, test vitest, `PASSWORD_MAX` |
| ModMove-mobile | `feat/tri-customer` (máy = remote) | `20d038e` / remote `8c5c407` | Nội dung `lib/`, `test/`, `pubspec`, `android/` **giống hệt** remote; chỉ lịch sử commit bị nhân đôi (83/93 commit lệch nhau) |

> Lần 1 review trên nhánh đang checkout. Mục **9** ở cuối liệt kê những kết luận đổi khi chuyển sang nhánh chuẩn.
>
> **Cập nhật 19/11 (chiều):** Report-1 và Report-2 có bản mới (file sửa lúc 12:17). Đã đọc lại cả hai và cập nhật các mục 0, 1, 2, 3, 8. Mục **11** liệt kê những gì đã sửa, những gì còn tồn và lỗi mới phát sinh.

**Cách đánh dấu mức độ**

- 🔴 **Nghiêm trọng**: lỗi logic nghiệp vụ, xung đột làm người đọc hiểu sai hệ thống, hoặc lỗi chạy thật.
- 🟠 **Lớn**: tài liệu và code lệch nhau ở hành vi hoặc cấu trúc; hội đồng hỏi là lộ.
- 🟡 **Nhỏ**: lỗi biên tập, đánh số, chính tả, sót chữ của template.

> Quy ước: "Doc" là tài liệu, "Code" là source. Đường dẫn file tính từ `d:\Do_AN\`.

---

## 0. Tóm tắt

### Điểm làm tốt

- **SRS (Report-3) viết kỹ và nhất quán với code ở phần lõi:** vòng đời đơn (8 trạng thái), state machine, PayOS 10 phút / 30 phút, ghép đơn 10 phút, auto-complete 24 h, khiếu nại 24 h, đánh giá 1 ngày, ảnh lấy hàng 2–5 ảnh / tối đa 5 lần nộp, ví 2 nguồn (GB-32), hoàn tiền 3 nguồn và 6 trạng thái, sự cố chặn/không chặn (GB-36). Các hằng số trong `ModMove.Domain/Constants/BusinessRules.cs` khớp đúng các GB tương ứng.
- **SDS phần III (bảo mật / hiệu năng)** mô tả đúng code: JWT HS256 15 phút / refresh 30 ngày xoay vòng + phát hiện dùng lại, BCrypt work factor 12, rate limit 10 req/phút (theo IP và theo user), RoleConvention theo thư mục controller, webhook PayOS kiểm HMAC.
- Code BE bám SRS rất sát (comment trong code ghi đúng mã UC/GB), dễ truy vết.

### 10 vấn đề quan trọng nhất cần xử lý trước khi nộp hoặc bảo vệ

| # | Mức | Vấn đề | Ở đâu |
|---|---|---|---|
| 1 | 🔴 | **Tính năng "AI phân tích ảnh hàng hoá để gợi ý xe" là giá trị cốt lõi ở Report-1 và Report-2 nhưng không có trong SRS, SDS hay code.** | R1 §I.2, §II (kết luận), §III (Weaknesses), §IV, FE-04, LI-03; R2 §1.1, FE-04, giả định #1, Scope Limitations, R01, R03. (Bản 19/11 đã bỏ AI khỏi cột GAP và Section Summary của R1) |
| 2 | 🔴 | **CCCD / số GPLX:** code đã bỏ số CCCD và số GPLX (migration `DropDriverIdNumbers`, 7 ảnh). SRS và SDS vẫn yêu cầu nhập và kiểm tra trùng hai số này; ngay trong SRS cũng mâu thuẫn (GB-04 nói đã bỏ). | SRS UC-DRV-03, III.2.5, III.8.1.1, MSG18; SDS 3.4, 3.5 |
| 3 | 🔴 | **Hoa hồng chốt lúc nào:** GB-14 ghi chốt lúc Accepted; code, SDS, JOB-ORDER-01, UC-ADM-13 và GB-33 đều ghi chốt lúc Completed. | SRS GB-14 và `ShippingOrder.Complete()` |
| 4 | 🔴 | **Lỗi logic code: đơn tiền mặt "người gửi trả" có thể kẹt.** BE không bắt thu tiền trước khi lấy hàng. Nếu sang InTransit mà chưa thu thì không giao được (`CASH_NOT_COLLECTED`) và cũng không thu được (`CASH_COLLECTION_NOT_ALLOWED`). App tài xế lại hiện nút "thu từ người gửi" ở màn giao hàng. | `ShippingOrder.CollectCash`, `DeliverTripCommandHandler`, `delivery_screen.dart:78` |
| 5 | 🔴 | **Đăng nhập bằng số điện thoại:** Web ghi "Email hoặc số điện thoại", SRS III.5.1 cũng ghi vậy, nhưng BE chỉ tra theo email, nên đăng nhập bằng SĐT luôn báo sai mật khẩu. | `LoginCommand(Email, …)`, `LoginPage.tsx:195`, `auth.service.ts:71` |
| 6 | 🟠 | **Độ dài mật khẩu lệch trong tài liệu:** GB-53 ghi 8–20, SDS ghi "≥ 8"; code (BE `develop`, Web `main`, Mobile) và SRS III.5.1 đều 8–100. Bản web chưa commit trên máy lại đổi thành 20 (xem 6.3). | `AuthRules.cs`, `config/business.ts:49` |
| 7 | 🟠 | **Bản đồ:** SDS và memory nhiều chỗ ghi Google Maps; code chỉ dùng **MapVina** (cộng Photon cho gợi ý địa chỉ). Report-2 bản 19/11 **đã đổi sang MapVina**. | SDS §I.1, §I.2.1 row 08, 3.11, §III.2 |
| 8 | 🟠 | **Kiến trúc client mô tả sai:** Web có cả trang **Customer và Driver** (R2 ghi web chỉ cho Dispatcher/Admin); Mobile dùng `http` + BLoC + named routes + GPS gửi qua REST, không phải Dio / get_it / go_router / GPS qua SignalR như SDS 2.3. SDS còn câu "app đang dùng Provider/ChangeNotifier" đã lỗi thời. | SDS §I.1, §I.2.3; R2 §1.4, §6.2.1 |
| 9 | 🟠 | **Thiết kế DB trong SDS lệch schema thật** ở 8/22 bảng (thiếu cột payout của refunds, `earnings_amount`/`deposit_amount` của ví, enum `WithdrawEarnings` sai, key setting `MIN_COD_DEPOSIT`/`PEAK_SURCHARGE` không tồn tại…). | SDS §I.3, xem mục 5.3 |
| 10 | 🟠 | **Mã UC trong SRS bị lệch giữa bảng UC (I.4.2) và đặc tả (II):** ví dụ UC-CUS-14/15/17/22/28/29 và UC-DIS-09/14 chỉ vào UC khác nhau. Mã GB trong I.3.2 bị lệch 1 số ở nhiều chỗ. | Xem mục 4.1 |

---

## 1. Xung đột giữa các tài liệu với nhau

| # | Mức | Chủ đề | Report-1 | Report-2 | Report-3 (SRS) | Report-4 (SDS) | Code |
|---|---|---|---|---|---|---|---|
| 1.1 | 🔴 | AI phân tích ảnh hàng | Vẫn là tính năng chủ đạo ở Purpose, Background, Proposed Solution, FE-04, LI-03. Bản 19/11 đã bỏ AI khỏi cột GAP, nhưng Weaknesses của Lalamove/Ahamove vẫn nói về AI | FE-04 "AI analyzes cargo photos", giả định #1, Scope Limitations, R01, R03 | Không có UC, GB hay màn hình nào | Không có | Không có |
| 1.2 | 🔴 | Cơ chế ghép đơn | LI-04: báo từng tài xế, đếm ngược **30 giây**, quá hạn thì chuyển cho người khác | "Instant matching" | GB-08: **phát cho mọi tài xế** trong bán kính, ai nhận trước được; huỷ sau **10 phút**. Riêng footnote ⁴ của Permission Matrix vẫn ghi "30-second window" | JOB-MATCH-01 10 phút | Theo GB-08. Mobile còn `offerWindow = 30s` (`api_driver_trip_repository.dart:25`) |
| 1.3 | 🟠 | Phạm vi địa lý | LI-01: chỉ nội thành (vd. Hà Nội), không liên tỉnh | "intracity … urban service boundaries" | GB-34: **không giới hạn** khu vực hay quãng đường | — | Không có kiểm tra khu vực |
| 1.4 | 🟠 | Hoá đơn điện tử | FE-07: tự sinh hoá đơn điện tử | FE-07 "e-receipt generation" | BF-06: "electronic tax invoice is generated" | Không có | Không có |
| 1.5 | 🟠 | Liên lạc trong app | EX-04: "in-app text chat and masked phone number calls" | — | UC chỉ có "phone outside the app" | — | Không có chat, không có số ẩn |
| 1.6 | 🟠 | Phụ phí giờ cao điểm / hàng cồng kềnh | — | — (bản 19/11 đã bỏ "surcharges") | UC-ADM-12 "peak hours, bulky surcharges"; GB-29 lại ghi "There is no peak-hour or bulky-cargo surcharge" | `PEAK_SURCHARGE` trong platform_settings | Chỉ có `LOADING_FEE` |
| 1.7 | 🟠 | Vai trò của Web | — | §1.4 "Dispatchers and Administrators"; §6.2.1 "Guest, Dispatcher and Admin" | III.1 Customer + III.2 Driver trên web | §I.1 "Guest, Customer, Dispatcher, Administrator" (thiếu Driver) | Web có đủ 5 nhóm: Guest, Customer, Driver, Dispatcher, Admin |
| 1.8 | 🟠 | Bản đồ | — | ✅ Bản 19/11 đã đổi sang MapVina (giả định, đào tạo, R01) | MapVina + Photon | Lẫn lộn: có chỗ MapVina, có chỗ Google Maps / `GoogleMapService` / "Google Distance Matrix" | MapVina + Photon |
| 1.9 | ✅ | Mã và thứ tự tính năng FE | FE-01…FE-11 | **Đã sửa (19/11):** §1.2 chép nguyên 11 feature của R1. Lưu ý: chép luôn cả lỗi của R1 (FE-04, FE-06, FE-07, xem 3.2) | Nhóm theo 11 feature của R1 | Theo 11 feature của R1 | — |
| 1.10 | ✅ | Vòng đời đơn | — | **Đã sửa (19/11):** bỏ câu vòng đời 5 bước sai | 8 trạng thái | 8 trạng thái | 8 trạng thái |
| 1.11 | 🟠 | Quản trị | FE-10: cấu hình "timeout parameters" | — (bản 19/11 đã bỏ "promotions, audit logging") | Không có audit log; timeout là hằng số | — | Chỉ 4 setting: `COMMISSION_RATE`, `LOADING_FEE`, `REQUIRED_DEPOSIT`, `MATCHING_RADIUS_KM`. Timeout cố định trong `BusinessRules.cs`. Không có audit log |
| 1.12 | 🟡 | Mô tả FE-04 (R1) | "Smart Driver Matching: The system calculates the delivery fare. AI analyzes cargo photos…" | — | — | — | Mô tả không nói gì về ghép tài xế, viết nhầm sang tính giá + AI |

**Đề xuất:** chốt một "nguồn sự thật" là SRS (bản đã khớp code nhất), rồi sửa R1/R2 theo. Với AI (1.1): hoặc làm bản tối thiểu (gợi ý xe theo kích thước/khối lượng như `vehicleFit` đang có, gọi là "rule-based recommendation"), hoặc sửa R1/R2 để chuyển AI thành *future work*. Không nên để GAP chính của đề tài là thứ không tồn tại.

---

## 2. Report-1 – Project Introduction

| # | Mức | Nhận xét |
|---|---|---|
| 2.1 | 🔴 | Như 1.1: Purpose, kết luận của Background ("integrating artificial intelligence…"), Proposed Solution ("A key innovation… AI-driven cargo analysis"), FE-04 và LI-03 vẫn dựa vào AI. Không có trong sản phẩm. *(Bản 19/11 đã bỏ AI khỏi cột GAP và Section Summary.)* |
| 2.2 | ✅ | ~~Cột "Addressed Gaps" để trống~~. **Bản 19/11 đã xoá cột này.** |
| 2.3 | 🟠 | FE-06 "Drivers must upload delivery proof before an order can be marked complete by the customer" thì đúng; nhưng câu "Shipping follows an enforced sequence stipulated." bị cụt. |
| 2.4 | 🟠 | FE-08 chỉ nói "rate after completed trips", thiếu giới hạn 1 ngày và không sửa được (GB-20). FE-11 thiếu khiếu nại/hoàn tiền, trong khi đây là luồng lớn nhất trong code (BF-07, BF-08). |
| 2.5 | 🟠 | **(Bản 19/11 vẫn chưa sửa.)** Số liệu khảo sát mâu thuẫn: "25–34 tuổi … **largest share** 39.7%" rồi "18–24 tuổi 54.8%" (54.8 > 39.7). Cộng hai nhóm: 39.7 + 54.8 = 94.5%, đúng. Câu "largest share" sai, và thứ tự trình bày gây hiểu nhầm. Thêm nữa, 54.8% (40/73) lặp lại ở 3 câu hỏi khác nhau (tuổi 18–24, chuyển phòng, xe < 1 tấn). **Đã đối chiếu với dữ liệu gốc của form: xem mục 10.** |
| 2.6 | 🟡 | Ngày tháng: bìa ghi "Aug 2026", change log 20/09/2026, trong khi R2 đặt hạn Report 1 là 13/09/2026. |
| 2.7 | 🟡 | Chính tả: "GrapExpress" (change log, vẫn còn), "Proof of Delivery ." (thừa dấu cách), bảng Acronyms chỉ có ETA, GPS (thiếu POD, COD, OTP, JWT…). |
| 2.8 | ✅ | ~~Change log còn 8 dòng trống~~. Bản 19/11 đã xoá các dòng trống và thêm dòng "14/11/2026 M HoangNM Modify Existing Solutions". |
| 2.9 | 🟠 | **Mới (bản 19/11): Weaknesses và GAP không còn khớp nhau.** GAP của Lalamove/Ahamove đã đổi sang "chưa chuyên cho chuyển nhà/phòng trọ", nhưng dòng Weaknesses ngay trên vẫn nói về AI ("the only AI feature… is a support chatbot", "does not focus deeply on AI-based analysis"). Người đọc thấy điểm yếu nói A, khoảng trống nói B. |
| 2.10 | 🟠 | **Mới: GAP mới tự mâu thuẫn với chính bảng đối thủ.** Lalamove có Target Users là "Individuals needing to transport large or bulky items…", Ahamove ghi "supports … furniture, household appliances". Câu "chưa chuyên cho cá nhân chuyển đồ cồng kềnh" vì vậy yếu. Nên nêu khác biệt cụ thể và kiểm chứng được, ví dụ ảnh lấy hàng bắt buộc, dispatcher xử lý khiếu nại/hoàn tiền, kiểm vừa xe theo kích thước (`vehicleFit`), ký quỹ tài xế. |
| 2.11 | 🟡 | **Mới:** đã xoá mục GrabExpress và cột "Addressed Gaps" nhưng change log không có dòng **D** tương ứng. Dòng "Add Existing Solutions (GrapExpress)" của HuyDV vẫn còn dù mục này không còn tồn tại. |
| 2.12 | 🟡 | Đoạn giới thiệu Lalamove viết ở ngôi thứ nhất ("Leveraging **our** technology platform, **we** connect…"), giống chép nguyên văn từ website Lalamove. Nên viết lại ở ngôi thứ ba và ghi nguồn. |

---

## 3. Report-2 – Project Management Plan

| # | Mức | Nhận xét |
|---|---|---|
| 3.1 | 🔴 | **Số liệu effort không cộng đúng.** Tổng các stage: 10 + 36 + 54 + 132 + 26 + 12 = **270 pd**, nhưng bảng ghi **280**. Iteration 1: 5 + 28 + 6 + 4 + 4 + 2 = **49** (ghi 44); trong đó 4.1.2 = 7 + 7 + 6 + 11 = **31** (ghi 28). Iteration 2: 5 + 28 + 5 + 4 + 3 + 1 = **46** (ghi 44). |
| 3.2 | 🟠 | **Bản 19/11: §1.2 đã chép nguyên 11 feature của R1**, nên mã FE đã khớp (1.9), câu vòng đời sai (1.10) và "audit logging" đã được bỏ. Tuy nhiên R2 thừa hưởng nguyên lỗi của R1: FE-04 "Smart Driver Matching" mà mô tả lại là tính giá + AI (1.12); FE-06 câu cụt "enforced sequence stipulated"; FE-07 "e-invoices" (1.4). Danh sách "Key Features" ở dòng 34 vẫn còn "Instant driver-order matching algorithms". |
| 3.3 | 🟠 | §1.4 ("web portals for Dispatchers and Administrators") và §6.2.1 ("Guest, Dispatcher and Admin") vẫn mô tả web sai vai trò (1.7). Bản 19/11 chưa sửa. |
| 3.4 | 🟠 | **Bản 19/11 đã đổi Google Maps → MapVina** ở giả định #1, R01 và training plan. Còn tồn: R02 và §1.4 ("WebSocket services") vẫn nói GPS qua WebSocket, trong khi GPS gửi qua REST `POST api/driver/location`; ví dụ commit "[42] feat: implement WebSocket GPS broadcast endpoint" cũng vậy. Training plan vẫn chỉ có **1 dòng (MapVina)**, thiếu .NET Clean Architecture/CQRS, Flutter BLoC, PayOS, SignalR, dù R04 xếp đây là rủi ro High. |
| 3.10 | 🟡 | **Mới:** bản 19/11 sửa §1.2, giả định, R01 và training nhưng change log của R2 **không có dòng nào** ghi lại các thay đổi này. |
| 3.5 | 🟠 | Constraint #1: "Personal data … must be **encrypted**". SDS §III.1.3 lại ghi số tài khoản ngân hàng "Plain database columns… no column-level encryption". Hai tài liệu mâu thuẫn trực tiếp. |
| 3.6 | 🟠 | §6.2.2 quy ước nhánh `feature/<member-name>`; thực tế có `feat/tri-customer`, `feat/map-proxy`, `feat/ui-text-validation-2026-11`, `backup/…`, `production`. §6.2.4 quy ước commit `[TICKET-ID] type:`: BE theo đúng (`[CUS-13] fix: …`), web/mobile dùng `feat(web): …`. §6.2.6 tag `v1.0.0/v2.0.0`: **cả 3 repo chưa có tag nào**, dù đã qua hạn Software Package V1 (25/10) và V2 (08/11). |
| 3.7 | 🟡 | Sót chữ của template: "[Describe the assumptions on which the project is based…]" vẫn còn; tiêu đề "6.2.6 Version Taggingxxx"; "2. Quality ManagementThe team applies…" dính tiêu đề với nội dung; "Ngo Tuan **Kiem**" (R1 ghi Khiem); "Iteration Evaluation" không có buổi Retrospective dù §II.1 nói Scrum có Retrospective. |
| 3.8 | 🟡 | §II.1 nói "two-week Sprints… three-month", bảng thời gian là 14 tuần với 3 iteration 2 tuần + các stage khác: nên ghi rõ Sprint = Iteration. |
| 3.9 | 🟡 | CI: §2.2/§6.2.5 nói lint và coverage chặn merge. Đã có workflow (`backend-ci.yml`, `web-ci.yml`, `mobile-ci.yml`), nhưng memory dự án ghi web chưa có ESLint config. Nếu đúng vậy thì bước "lint" của web chưa thật sự chạy; nên kiểm tra lại. |

---

## 4. Report-3 – SRS

### 4.1 Đánh số UC / GB / MSG không khớp nhau 🟠

**UC: bảng I.4.2 và đặc tả phần II đặt cùng một mã cho hai UC khác nhau**

| Đặc tả phần II ghi | Tên trong phần II | Trong bảng I.4.2, mã đó là | Mã đúng theo bảng |
|---|---|---|---|
| II.3.4 **UC-CUS-29** | Cancel Delivery Request | (không có CUS-29) | **UC-CUS-28** |
| II.11.10 **UC-CUS-14** | Report Shipment Incident | View Progress Status | **UC-CUS-15** |
| II.11.4 **UC-CUS-15** | Request Refund for Incident | Report Shipment Incident | **UC-CUS-17** |
| II.11.13 **UC-CUS-22** | Withdraw Complaint | Upload Complaint Evidence | **UC-CUS-24** |
| II.11.11 **UC-DIS-09** | Request Additional Information | Propose Refund Decision | **UC-DIS-14** |
| II.11.7 UC-ADM-18 | "Approve Refund Requests" | "Approve Customer Complaints" | Cùng mã, tên khác nhau |

Các cột "Used in" của GB và MSG lại dùng lẫn cả hai kiểu đánh số (vd. GB-22 ghi UC-CUS-29; MSG59 ghi cả UC-CUS-15 lẫn UC-CUS-17). Comment trong code BE cũng có chỗ ghi sai (`ReportsController.cs` ghi payout export là "UC-ADM-20", nhưng UC-ADM-20 là View Operational Incident History).

**GB: tham chiếu trong I.3.2 Entity Descriptions bị lệch 1 số**

| Chỗ | Ghi | Nên là |
|---|---|---|
| Coupon "DiscountCode unique" | GB-22 | GB-21 |
| Refund "Complaint once … 24 h" | GB-19 | GB-18 |
| Refund "Administrator approval" | GB-20 | GB-19 |
| Refund / WalletTransaction "manual within 3 working days" | GB-28 | GB-27 |
| Rating "at most one" | GB-21 | GB-20 |
| InTransitIncident "Only Dispatchers reassign" | GB-18 | GB-17 |

Ngoài ra: **không có GB-51** (nhảy từ GB-50 sang GB-52); UC-GST-01 Postconditions ghi "6a–6d" nhưng chỉ có 6a–6c.

### 4.2 Mâu thuẫn ngay trong SRS 🔴/🟠

| # | Mức | Mâu thuẫn | Code làm theo |
|---|---|---|---|
| a | 🔴 | **CCCD/GPLX:** GB-04 "drivers upload 7 photos and **no longer enter ID or license numbers**", trái với UC-DRV-03 bước 2 và 6, 6c (nhập và kiểm tra trùng), III.2.5 ("citizen ID number (9–12 digits) and driving licence number (8–20 characters)… **Five photos**"), III.8.1.1 ("valid **12-digit** citizen ID"), III.8.1.3 (che số CMND), MSG18 (trùng citizen ID/license), I.3.2 DriverProfile (có CitizenIdentityCardNumber). Screen #43 ghi "7 photos", III.4.2 ghi "five documents". GB-04 cũng tự mâu thuẫn: Rationale "Prevents one person… registered twice" trong khi rule chỉ còn biển số là duy nhất. | 7 ảnh, chỉ biển số duy nhất (migration `20261118111223_DropDriverIdNumbers`) |
| b | 🔴 | **Hoa hồng:** GB-14 "fixed on the order when it is **Accepted**", trái với GB-33/UC-ADM-13 "applies to orders **completed** after the change". | Chốt lúc Completed (`ShippingOrder.Complete`) |
| c | 🟠 | **Khách huỷ đơn đến khi nào:** UC-CUS-28 (bảng) "before **pick-up**", Permission footnote ³ "cancel only before pick-up", trái với GB-22 / UC II.3.4 "Pending or Accepted" (trước khi tài xế **đến**). | Pending/Accepted (`CancelByCustomer`) |
| d | 🟠 | **Sửa đơn:** Actor Customer "Places, **edits** and cancels"; Permission "Edit / Cancel Request: Customer Restricted ³ (edit before accepted)"; CargoDetail "editable until a driver accepts"; trái với GB-34 "A submitted order **cannot be edited**". | Không có API sửa đơn |
| e | 🟠 | **Permission Matrix** sai nhiều ô: "Edit/Cancel Request: Admin **Full**, Dispatcher **Full**" (Admin không có API huỷ; Dispatcher chỉ huỷ qua sự cố); "Submit / **Edit** Rating" (không được sửa); "View Wallet & Withdraw: Admin **Full**" (Admin duyệt, không rút); footnote ⁶ "COD directly from **recipients**" (còn người gửi); footnote ⁴ "30-second window". | — |
| f | 🟠 | **UC-CUS-14 (Report Shipment Incident)**: Description "If the order already has an open incident, the report is **added to it**. Every report creates **its own** incident." Hai câu liền nhau trái nghĩa. Postcondition "created **or updated**". Alt 3a "Refund not allowed… MSG75" chép nhầm từ UC-DIS-07. | Mỗi báo cáo tạo một incident mới |
| g | 🟠 | **Trạng thái Locked:** I.3.2 User "Locked (temporary — after repeated failed sign-in)" trái với GB-46 "Only the Administrator can lock". | Khoá tạm dùng `locked_until`, `AccountStatus` vẫn Active; `Locked` chỉ do Admin đặt |
| h | 🟠 | **OTP khi đăng nhập:** GB-25 "Registration, **sign-in** and password recovery"; MSG15/16 ghi dùng trong UC-CUS-01, nhưng UC-CUS-01 không có bước OTP. | Đăng nhập không có OTP |
| i | 🟠 | **UC-GST-01 Step 6c "Password does not match… MSG84"**: luồng chính chỉ nhập OTP, không nhập lại mật khẩu, nên bước này không có ngữ cảnh. Cần ghi rõ màn OTP gửi kèm mật khẩu (code có `VERIFY_PASSWORD_MISMATCH`). | — |
| j | 🟠 | **Cash người gửi:** UC-DRV-17 "PayerRole Sender: OrderStatus is **Arrived**" và 2d "only at pickup (Sender, Arrived)". | Cho cả Arrived **và PickedUp** |
| k | 🟠 | **GB-52 "back end does not check location"**: đúng cho Arrive/Deliver, nhưng BE **có** kiểm 500 m khi thu tiền mặt (`COLLECT_CASH_WRONG_LOCATION`). SRS không có rule hay message nào cho mã này. | BE kiểm 500 m ở `CollectCash` |
| l | 🟠 | **Chu kỳ gửi GPS:** GB-39 "every 5 s"; III.2 web "every **10 s**"; NFR 2.2 "5–10 s". | Mobile 5 s; web 10 s (`DriverContext.tsx:25`) |
| m | 🟠 | **Dashboard Admin:** UC-ADM-22 kỳ "Today / This Week / This Month", làm mới **3 giây**, có trạng thái PayOS/API, sự cố mở, tài xế online theo loại xe. III.4.1 lại mô tả "7 ngày / 30 ngày / tháng này / tháng trước / tuỳ chọn ≤ 366 ngày" và KPI khác. | Theo III.4.1; làm mới 60 s; không có trạng thái PayOS/API |
| n | 🟠 | **Master data:** UC-ADM-15 "tabs Vehicle Types, Coupons, Cargo Types, Policies", trong khi III.4.6/4.7/4.8 tách Pricing, Coupons, Master Data (Policies, Service info, Cargo types, Cancellation reasons, Complaint reasons, **Incident groups**, Banks). "Incident groups" không được dùng: IncidentType là enum cố định 4 giá trị. | Theo III.4.x |
| o | 🟠 | **Từ chối khiếu nại:** III.3.3 có nút Dispatcher "Reject complaint… closes the complaint", trái với GB-42 "a 0 VND proposal can **only** be rejected [by Admin]". | Không có API dispatcher reject; web không có nút |
| p | 🟡 | DriverWallet và GB-16: SDS 3.16 vẫn ghi "≥ 200,000 VND to receive **COD** orders", trong khi GB-16/GB-32 mới là mọi đơn. |
| q | 🟡 | III.8 (Mobile): bảng không tiêu đề đầu mục: "COD Collection Confirmation… **to deduct from security deposit wallet**" là sai (tiền thu không trừ ví; chỉ hoa hồng bị trừ khi Completed). "Complete Delivery Button… **trigger driver revenue settlement**" cũng sai (quyết toán khi Completed, không phải Delivered). |
| r | 🟡 | III.8.1.2: kích thước thùng xe nhập bằng **mét**, trong khi DB (`vehicle_types`, `cargo_details`) và web dùng **cm**. "Mapped Use Cases: None" (phải là UC-DRV-03). |

### 4.3 Logic nghiệp vụ nên xem lại (dù code đã làm đúng như SRS)

| # | Mức | Vấn đề | Đề xuất |
|---|---|---|---|
| a | 🟠 | **GB-30 "coupon do tài xế chịu"** (hoa hồng và thu nhập tính trên giá sau giảm). Về kinh doanh, nền tảng phát mã mà tài xế chịu là bất thường, dễ bị hội đồng hỏi. | Hoặc nền tảng chịu (thu nhập = giá trước giảm − hoa hồng), hoặc giữ nhưng ghi lý do rõ trong Rationale. |
| b | 🟠 | **GB-35 khách vắng mặt → không hoàn PayOS, tài xế cũng không được đồng nào** (UC-DIS-07 "The driver earns nothing for this order"). Rationale lại ghi "Compensates the driver's wasted trip": tiền giữ lại không về tài xế thì không "compensate". | Nêu rõ tiền đi đâu (phí huỷ cho tài xế, hay nền tảng giữ). |
| c | 🟠 | **UC-CUS-27 4a "Customer closes the payment page → Cancelled"**: không có API huỷ phiên thanh toán ở customer (`Customer/OrdersController` chỉ có `POST {id}/payment`). | Bỏ 4a hoặc thêm endpoint. |
| d | 🟠 | **UC-DRV-13 1b "Cash paid by the sender: collects before loading"** không được BE ép (xem mục 6.1). | Thêm guard ở BE. |
| e | 🟡 | UC-ADM-23 "Revenue & Trip, or **Incident**" report: BE chỉ có `revenue/export` và `payouts/export`. UC-ADM-19 (xem rating), UC-ADM-20 (lịch sử sự cố), xem `support_requests`: không có API Admin. | Đánh dấu "planned" hoặc bỏ khỏi phạm vi. |
| f | 🟡 | UC-ADM-15 cho Admin **tạo mới** vehicle type và **sửa** coupon: BE chỉ có `PUT/PATCH vehicletypes/{id}` (không POST) và coupon chỉ `POST` + `PATCH status` (không sửa). | Sửa UC hoặc bổ sung API. |
| g | 🟡 | UC-DRV-07 "Update registered vehicle information": không có API; muốn đổi xe phải nộp lại hồ sơ. | Ghi rõ trong UC. |

### 4.4 Chất lượng viết SRS

| # | Mức | Nhận xét |
|---|---|---|
| a | 🟠 | Phần II nửa đầu dùng mã MSGxx, nửa sau (UC-DIS-*, UC-CUS-14/15/21, UC-ADM-24) chuyển sang "displays an error message" chung chung, trái với NFR 2.1 "Every error shows a message from Appendix V.2". |
| b | 🟠 | I.3.2 **DriverApplication**: ô "Purpose" chép nhầm danh sách thuộc tính. I.3.3 Data Business Rules chỉ 4 dòng. |
| c | 🟠 | BF-02 Trigger "entering their **phone number** to register": thực tế đăng ký bằng email + OTP. BF-02 End condition "account status changes → …" và "account remains status ." thiếu giá trị trạng thái. BF-03 End condition "notify the customer corresponding driver" tối nghĩa. BF-07 lặp "End condition: End condition:". |
| d | 🟠 | NFR 2.2 dùng khoảng "3–5 giây", "1–3 giây": không đo được. Nên dùng một ngưỡng và phân vị (vd. p95 ≤ 3 s). NFR 1.1 chỉ có Android, thiếu yêu cầu UI web (dù NFR-COMP-01 có Chrome/Edge). |
| e | 🟠 | NFR 2.3 "Driver verification documents **may only be accessed by owning driver and Admins… verified on every access**". Ảnh đang lưu Cloudinary dạng `upload` công khai (`CloudinaryFileStorage.cs`, không đặt `Type = authenticated`), nên ai có URL đều xem được. Yêu cầu này **chưa đạt**. |
| f | 🟡 | MSG11 nội dung là ghi chú biên tập "State it is unused: UC-CUS-01 shows MSG08 (A-01)". MSG09 "Legacy accounts only". GB-55 có "(." cụt. GB-04 viết lỗi chấm câu. |
| g | 🟡 | Change log: dòng 11/11/2026 trống "In charge"; dòng "02/10 D Deleted I.2.4 BF-04" nhưng hiện vẫn có BF-04 (tên khác). |
| h | 🟡 | Screen List #11 "10-minute timeout per GB-08, GB-24" (GB-08 không nói 10 phút); #20 "job_alert_sheet", #27 "DriverProfilePage", #43 "verification_screen": tên file code lọt vào tài liệu yêu cầu. |

---

## 5. Report-4 – SDS

### 5.1 Kiến trúc (I.1) 🟠

| Doc | Code thực tế |
|---|---|
| Web App "React **19**" | `react ^18.3.1` |
| Web dành cho "Guest, Customer, Dispatcher, Administrator" | Có thêm **Driver** (`/driver/*`, `DriverLayout`) |
| Layouts "PublicLayout, CustomerLayout, DispatcherLayout, AdminLayout" | `AdminLayout`, `CustomerLayout`, `DispatcherLayout`, **`DriverLayout`**; không có PublicLayout/AuthLayout |
| Mobile "core: ApiClient (**Dio**)… app routing (**go_router**)" | `http` + named routes (`Navigator.pushNamed`) |
| Mobile "SignalR + GPS: **streams the driver's GPS position**" | GPS gửi bằng REST `POST /driver/location`, poll 5 s; SignalR chỉ để nhận sự kiện |
| "Live data is pushed through SignalR **instead of being polled**" (§III.2.1) | Web poll 15–60 s ở nhiều trang; mobile tài xế poll 5 s. TrackingHub `JoinOrder` chỉ cho **Customer**, Dispatcher không theo dõi được qua hub |
| External: "Google Maps" (row 05 Communication, Infrastructure layer, §III.2.3) | **MapVina** (`MapVinaMapService`, `CachedMapService`, `MapVinaProxy`) |
| Background Jobs: 4 job | **5 job**: thêm `RefreshTokenCleanupJob` (24 h) |
| Exception Middleware "400, 403, 404, 422, 500" | Có thêm **401** (webhook sai chữ ký, đăng nhập), **409** (CONFLICT, RowVersion), **429** |

### 5.2 Package Diagram (I.2) 🟠

**Backend (2.1):** khớp nhìn chung. Sai tên: `GoogleMapService` (thật: `MapVinaMapService`), `PurgeOldGpsLogsJob` (thật: `GpsLogCleanupJob`), `OtpService` (không có class này trong `Infrastructure/Identity`, OTP nằm ở Application). Thiếu adapter `OpenXmlExcelExporter`, thiếu `Filters/ActiveAccountFilter`, thiếu thư mục controller **Account** (SDS §III.1.2 có nhắc, nhưng §I.2.1 row 01 không liệt kê).

**Web (2.2):** quy ước đặt tên khác code:

| SDS | Code |
|---|---|
| `services/apiClient.ts`, `<module>Service.ts`, `trackingHub.ts` | `services/api.ts`, `order.service.ts`, `realtime.service.ts`; thêm thư mục `src/api/` (endpoints, types, errors, labels) |
| `store/authStore.ts → useAuthStore`, `uiStore` | `store/useAuthStore.ts`, `useBookingDraftStore.ts`, `useSidebarStore.ts` |
| `routes/ProtectedRoute, RoleGuard` | Một file `AppRoutes.tsx` với `RequireRole` |
| `pages/public/LandingPage.tsx`, `admin/UserManagementPage.tsx`, `errors/NotFoundPage.tsx` | `pages/landing/`, `AdminUsersPage.tsx`, không có NotFoundPage (dùng `Fallback`) |
| `hooks/useAuth, useTracking, useDebounce` | `useLiveData`, `useRealtime`, `useRoadRoute`, `useDomainData` |
| `features/orders/OrderTimeline.tsx`, `features/booking/BookingWizard.tsx` | Không có; `features/booking/steps/…`, `features/customer/CustomerModals.tsx` |

**Mobile (2.3):** lệch nhiều nhất.

| SDS | Code |
|---|---|
| `main.dart` khởi tạo Firebase + **get_it** DI; `core/di` | Không có get_it; dùng `RepositoryProvider` / `BlocProvider` |
| `core/network (Dio)`, `core/realtime`, `core/router (AppRouter)`, `core/storage`, `core/location` | `core/{config, format, network, notifications, session, theme, widgets}`; router nằm ở `app/app.dart`; realtime ở `core/notifications/realtime_source.dart` |
| `lib/shared/` | Không có (`core/widgets`) |
| `features/common/{auth, profile, notifications}`, `features/customer/<feature>`, `features/driver/<feature>` | `features/{auth, customer, driver_trip, driver_account, onboarding, notifications, home}` |
| Mỗi feature có 2 lớp `presentation/` + `data/` | Có thêm lớp **`domain/`** (entities, repositories) |
| Đoạn "Implementation alignment: the current app uses **Provider/ChangeNotifier**… planned BLoC migration" | Đã dùng `flutter_bloc` (12 Bloc/Cubit, 0 ChangeNotifier). **Đoạn này lỗi thời, nên xoá.** |

### 5.3 Database Design (I.3): so từng bảng 🟠

Change log ghi "**20 tables**", mục lục có **22 bảng** (3.1–3.22). So với EF Configuration (`ModMove.Infrastructure/Persistence/Configurations`):

| Bảng | Lệch giữa SDS và code |
|---|---|
| `driver_profiles` | SDS có `citizen_id_number`, `driver_license_number` NOT NULL UNIQUE: **đã bị xoá** (migration `DropDriverIdNumbers`). |
| `driver_applications` | SDS có `citizen_id_number`, `driver_license_number`: đã xoá. `document_urls` ghi 5 loại, thật là **7** (thêm CCCD 2 mặt). Code có thêm `rejected_items` (lý do theo từng mục, khoá `DriverApplicationItemKeys`). |
| `shipping_orders` | Thiếu `arrived_at_dropoff_at` (UC-DRV-15). `estimated_distance_km` ghi "Google Distance Matrix", thật là MapVina. |
| `payment_transactions` | Thiếu `payer_bank_bin`, `payer_account_number`, `payer_account_name`. |
| `wallet_transactions` | `transaction_type` ghi `WithdrawEarnings`, thiếu `DepositRefill`; thật là `TopUpDeposit · TripEarning · CommissionDeduction · Withdrawal · DepositRefill`. Thiếu cột `earnings_amount`, `deposit_amount` (cốt lõi của GB-32). |
| `driver_wallets` | Ghi chú "≥ 200,000 to receive **COD** orders": đã đổi thành mọi đơn. |
| `refunds` | Thiếu toàn bộ nhóm payout: `payout_bank_code`, `payout_bank_name`, `payout_account_number`, `payout_account_holder`, `payout_info_updated_at`, `payout_failure_reason` (GB-55). Ghi chú "one Complaint per **completed** order" sai: phải là **Delivered** (GB-18). |
| `platform_settings` | Key ví dụ `COMMISSION_RATE, LOADING_FEE, PEAK_SURCHARGE, MIN_COD_DEPOSIT`; thật là `COMMISSION_RATE, LOADING_FEE, REQUIRED_DEPOSIT, MATCHING_RADIUS_KM`. Ghi chú UC-ADM-13 "orders completed after this" thì đúng. |
| `support_requests.status` | Chỉ ghi "Handling status"; enum thật `New · Handled`. |
| `otp_verifications` | Code có UNIQUE `(email, purpose)`; SDS chỉ ghi INDEX email. |

Các bảng `users`, `refresh_tokens`, `vehicle_types`, `vehicles`, `coupons`, `master_data_items`, `cargo_details`, `order_status_histories`, `proof_of_deliveries`, `in_transit_incidents`, `ratings`, `driver_location_logs` khớp.

**Đề xuất:** sinh lại phần 3.x từ `ApplicationDbContextModelSnapshot.cs` (hoặc từ `INFORMATION_SCHEMA`) thay vì sửa tay; vẽ lại ERD (Figure 5) theo đó. ERD logic trong SRS I.3.1 cũng nên cập nhật cùng lúc.

### 5.4 Detailed Code Design (II) 🟠

- Mỗi feature chỉ có class diagram và **1–2 sequence diagram**. Các luồng phức tạp nhất, nơi dễ sai và hội đồng hay hỏi, **chưa có**: Accept Job (tranh chấp RowVersion), Confirm Pickup / Review Evidence, Confirm Receipt + Settlement (`OrderSettlement`, DepositRefill), Customer Cancel + tạo Refund, Report Incident + chặn bước, Approve/Payout Refund, các background job.
- **10.3 Update Platform Settings: không có hình** (chỉ có tiêu đề). Mục 4, 5, 6, 11 có hình nhưng **không có chú thích**; 4.2 có hình nằm trong một đoạn tiêu đề rỗng (lỗi định dạng); 5.1 "Class Diagram" trống, hình nằm ở 5.2.
- Tên sequence "4.2 **Views** request job" sai ngữ pháp; "9.3 Request Withdrawal" lặp số trong caption.
- Change log dòng đầu không có "In charge"; 03/11 "Add II.3 Shipment booking" lặp với 01/11.

### 5.5 Design for NFR (III)

| # | Mức | Nhận xét |
|---|---|---|
| a | 🟠 | Rate limit theo user: SDS chỉ liệt kê `GET tracking`, `POST customer/incidents`. Code còn áp cho `Account/Route`, `Customer/Orders` (2 endpoint), `Driver/location`, `Driver/incidents`. |
| b | 🟠 | Bảng CORS dòng **Production để trống**. Nên ghi origin của bản deploy (`deploy/`, Caddyfile). |
| c | 🟠 | §III.1.3 "Uploaded images… Team Cloudinary account": không nói ảnh là public URL, mâu thuẫn với SRS NFR 2.3 (xem 4.4e). |
| d | 🟡 | Tham chiếu "decision 9.1", "B8", "A-01", "C8", "B5, 6.4", "4.4" là mã trong file DECISIONS nội bộ, không có trong bộ tài liệu nộp, nên người đọc không tra được. Nên thay bằng GB-xx hoặc thêm phụ lục. |
| e | 🟡 | §III.2.1 "Platform settings (planned) in-process memory cache": đúng là chưa có. Nhưng MapVina **đã có** cache bộ nhớ (geocode 7 ngày, route 1 ngày, `CachedMapService.cs`); SDS lại ghi "no in-memory cache". |

---

## 6. Lỗi logic phát hiện trong code (đã đọc source)

### 6.1 🔴 Đơn tiền mặt người gửi trả có thể kẹt không giao được

- `ShippingOrder.CollectCash`: Sender chỉ thu được khi `Arrived` hoặc `PickedUp`.
- `ConfirmPickupCommandHandler` và `ReviewPickupEvidence` **không** kiểm tra đã thu tiền người gửi hay chưa, nên đơn vẫn sang `InTransit` khi chưa thu.
- `DeliverTripCommandHandler`: đơn Cash ở InTransit chưa Paid. Nếu `CashCollected = false` thì ném `CASH_NOT_COLLECTED`; nếu `true` thì gọi `CollectCash`, ném `CASH_COLLECTION_NOT_ALLOWED` vì Sender không thu ở điểm giao.
- Mobile `delivery_screen.dart:78` vẫn hiện "Cần thu … từ **người gửi**" ở màn giao hàng.

**Hậu quả:** tài xế không giao được đơn, phải báo sự cố. **Sửa:** chặn `ConfirmPickup` (hoặc `ApprovePickupEvidence`) khi `PayerRole = Sender` mà chưa Paid (khớp UC-DRV-13 1b), và ẩn lựa chọn "người gửi" ở màn giao hàng. Viết test hồi quy.

### 6.2 🔴 Đăng nhập bằng số điện thoại không hoạt động

- Web `LoginPage.tsx:195` có nhãn "Email hoặc số điện thoại"; `auth.service.ts:71` gửi `{ email: identifier }`.
- BE `LoginCommandHandler` chỉ `GetByEmailAsync`, nên SĐT luôn trả 401 "sai thông tin".

**Sửa:** hoặc BE nhận cả SĐT (tra `phone_number`), hoặc đổi nhãn web và SRS III.5.1 thành "Email".

### 6.3 🟠 Giới hạn mật khẩu không thống nhất

Trên nhánh chuẩn, code đã thống nhất **8–100**: BE `AuthRules`, mobile, web `main` (`PASSWORD_MAX: 100`). Phần lệch còn lại nằm ở tài liệu: GB-53 ghi 8–20, SDS ghi "≥ 8".

⚠️ Bản web đang mở trên máy (nhánh `feat/ui-text-validation-2026-11`) có sửa **chưa commit** `config/business.ts` thành `PASSWORD_MAX: 20`. Nếu commit lên thì lại lệch với BE. Sửa GB-53 thành 8–100, hoặc huỷ thay đổi đó.

### 6.4 🟠 Ảnh giấy tờ tài xế công khai

Cloudinary upload mặc định (`type: upload`), nên URL ảnh CCCD/GPLX xem được không cần đăng nhập. Đây là dữ liệu cá nhân nhạy cảm (R2 Constraint #1 yêu cầu mã hoá, SRS NFR 2.3 yêu cầu kiểm quyền). Đề xuất: `type: authenticated` + signed URL ngắn hạn cho Admin, hoặc ít nhất ghi rõ là hạn chế đã biết.

### 6.5 🟡 Khác

- `OnboardingController.cs:18` comment vẫn ghi "citizen ID, licence or plate used by another driver → 409": đã lỗi thời.
- Hai route nạp ví `POST driver/Wallet/topup` và `top-up` cùng tồn tại (memory đã ghi, chưa dọn).
- Mobile còn `offerWindow = 30s` (mô phỏng cửa sổ nhận 30 s, xem 1.2). Nếu UI có hiện đếm ngược 30 s thì trái với GB-08.

---

## 7. Đối chiếu theo từng module (Doc ↔ Code)

| Module | Khớp | Lệch / thiếu |
|---|---|---|
| **FE-01 User Access** | Đăng ký giữ chỗ tới khi xác minh OTP (GB-44), khoá 5 lần / 10 phút, OTP 6 số / 5 phút / 3 lần mỗi 15 phút / 5 lần sai, refresh xoay vòng, thu hồi phiên khi đổi mật khẩu/khoá, Admin tạo Dispatcher | Đăng nhập SĐT (6.2); độ dài mật khẩu (6.3); SĐT `^0[0-9]{9}$` nhưng cột `VARCHAR(15)` và SRS không nêu định dạng |
| **FE-02 Driver Onboarding** | Version hồ sơ, 1 Pending, từ chối theo mục, chỉ nộp lại mục bị từ chối, online chỉ khi Approved + Active | CCCD/GPLX (4.2a); III.8.1.2 dùng mét |
| **FE-03 Booking** | Công thức giá GB-29, kiểm vừa xe GB-10 (xoay), `FARE_CHANGED`, mã đơn, coupon 1 mã, nháp khách lưu trình duyệt | AI gợi ý xe (1.1); phụ phí (1.6) |
| **FE-04 Matching** | Phát theo bán kính, ai nhận trước, RowVersion, 1 đơn/tài xế, ký quỹ GB-16, PayOS hiện sau khi trả, huỷ 10 phút | Cơ chế 30 s của R1/R2 và footnote ⁴ (1.2) |
| **FE-05 Tracking** | GPS 5 s (mobile), stale 30 s, mất kết nối 5 phút, log 1 điểm/phút khi có đơn, xoá sau 30 ngày | GPS qua REST, không qua SignalR (5.1); web 10 s; Dispatcher không JoinOrder |
| **FE-06 Shipping** | 2–5 ảnh, 5 lần nộp, duyệt ảnh mới InTransit, POD bắt buộc, 24 h auto-complete, khiếu nại giữ đơn | Thu tiền người gửi (6.1) |
| **FE-07 Payment** | PayOS 10/30 phút, kiểm chữ ký, khớp số tiền, webhook lặp không đổi gì, tiền về sau khi huỷ thì tạo refund | Không có hoá đơn điện tử (1.4); không có API huỷ phiên (4.3c) |
| **FE-08 Feedback** | 1 rating/đơn, 1–5 sao, trong 1 ngày, không sửa | Admin xem rating (UC-ADM-19) chưa có |
| **FE-09 Earnings** | Ví 2 nguồn, DepositRefill, rút earnings trước, 1 yêu cầu Pending, chỉ rút earnings khi có đơn chạy | SDS DB lệch (5.3) |
| **FE-10 Admin** | Pricing, khoá commission khi có đơn chạy (GB-33), coupon, master data, users, rút tiền, hoàn tiền, báo cáo doanh thu + Excel | Dashboard (4.2m); Incident report export, lịch sử sự cố, support requests chưa có; tạo vehicle type / sửa coupon chưa có (4.3f) |
| **FE-11 Incident** | Chặn bước khi tài xế báo (INCIDENT_PENDING), 1 dispatcher giữ, release, reassign (reset đếm ảnh), cancel kèm xử lý hàng, refund 3 nguồn, xin thêm thông tin, rút khiếu nại | "Reject complaint" của Dispatcher (4.2o) |

**Có trong code nhưng không có trong tài liệu:** `RefreshTokenCleanupJob`; `GET api/admin/Reports/payouts/export` (xuất Excel chi lô cho ngân hàng); `PayoutRejectionReasonCode.WrongBankAccount` (nút "Sai số tài khoản" có ở SRS III.4.3/4.4 nhưng không có UC/GB); `ComplaintStage` (5 giai đoạn tab Dispatcher); kiểm 500 m khi thu tiền ở BE. (Map proxy `api/public/Map/*` và `api/account/Route` **chưa có trên `develop`**: chỉ là file chưa commit trên máy, nhánh `feat/map-proxy`.)

---

## 8. Kế hoạch sửa đề xuất (theo thứ tự)

### A. Nhóm cần quyết định (chủ đề → người quyết)

1. **AI:** làm bản tối thiểu hay chuyển sang future work? Quyết định này kéo theo sửa R1 §I–IV, R2 §1.1/R03.
2. **CCCD/GPLX:** xác nhận bỏ hẳn số (theo code) và cập nhật toàn bộ SRS/SDS.
3. **Hoa hồng:** xác nhận chốt lúc Completed (theo code), sửa GB-14.
4. **Đăng nhập SĐT:** làm ở BE hay bỏ khỏi UI/SRS.
5. **Mật khẩu:** chọn 8–100 hay 8–20.
6. **Coupon do tài xế chịu (GB-30)** và **khách vắng mặt (GB-35)**: giữ hay đổi.

### B. Sửa code (nhỏ, nên làm ngay)

- [ ] Chặn ConfirmPickup/Approve khi Cash-Sender chưa thu (6.1) + test; mobile bỏ nhánh "người gửi" ở màn giao.
- [ ] Đồng bộ `PASSWORD_MAX` web với BE (6.3).
- [ ] Sửa nhãn đăng nhập web hoặc BE nhận SĐT (6.2).
- [ ] Dọn comment lỗi thời (`OnboardingController.cs:18`, `ReportsController.cs` mã UC), bỏ một trong hai route `topup`/`top-up`.
- [ ] Tạo tag `v1.0.0`, `v2.0.0` theo R2 §6.2.6 (hoặc sửa R2).

### C. Sửa tài liệu

- **Report-1:** sửa câu tuổi "largest share" (10.1); sửa Weaknesses cho khớp GAP mới (2.9) và làm GAP cụ thể hơn (2.10); LI-01, LI-04, EX-04, FE-04, FE-06, FE-07 theo thực tế; thêm dòng D vào change log (2.11). ~~Cột "Addressed Gaps"~~ đã xoá.
- **Report-2:** sửa tổng effort (270 hay 280, cân lại Iteration 1–2); sửa vai trò Web (§1.4, §6.2.1); WebSocket → REST ở R02, §1.4; xoá placeholder và "xxx"; bổ sung training plan; ghi change log cho bản 19/11. ~~Google Maps → MapVina~~ và ~~đồng bộ FE-xx với R1~~ đã xong. Khi sửa FE ở R1 nhớ sửa luôn §1.2 của R2.
- **Report-3:**
  - Đánh lại toàn bộ mã UC theo bảng I.4.2, rồi chạy tìm–thay trong cột "Used in" của GB/MSG.
  - Sửa tham chiếu GB trong I.3.2; thêm hoặc ghi chú GB-51.
  - Sửa 4.2a–r (CCCD, commission, huỷ đơn, sửa đơn, Permission Matrix, UC-CUS-14, Locked, OTP sign-in, cash người gửi, mã `COLLECT_CASH_WRONG_LOCATION`, GPS 5/10 s, dashboard, master data, reject complaint, III.8).
  - Thay "displays an error message" bằng MSGxx; xoá ghi chú biên tập trong MSG09/MSG11/GB-55.
- **Report-4:**
  - Cập nhật §I.1 và §I.2.3 theo code thực tế (React 18, Web có Driver, Mobile `http` + BLoC + named routes, GPS REST, MapVina, 5 job).
  - **Xoá đoạn "Provider/ChangeNotifier… planned BLoC migration".**
  - Sinh lại §I.3 từ snapshot EF (22 bảng, sửa change log "20 tables").
  - Bổ sung sequence cho các luồng còn thiếu (5.4), hình 10.3, chú thích hình 4/5/6/11.
  - Điền CORS Production; thay mã DECISIONS nội bộ bằng GB-xx.

### D. Gợi ý quy trình để không lệch lại

- Mỗi PR đổi nghiệp vụ ở BE phải ghi mã GB/UC bị ảnh hưởng trong mô tả PR (BE đang làm tốt ở comment code). Người làm tài liệu dựa vào đó để cập nhật SRS trong cùng iteration.
- Giữ một file "Traceability Matrix" (UC → endpoint → màn web → màn mobile → test), cập nhật theo PR. Bảng ở mục 7 có thể làm khung ban đầu.
- Trước mỗi lần nộp report: chạy một lượt rà "số học" (tổng effort, đánh số GB/UC/MSG liên tục, tham chiếu chéo).

---

## 9. Review lại theo nhánh chuẩn (BE `develop`, Web `main`, Mobile `feat/tri-customer`)

### 9.1 Kết luận vẫn đúng (đã kiểm lại trên nhánh chuẩn)

- BE `develop`: bỏ số CCCD/GPLX (migration `DropDriverIdNumbers`); hoa hồng chốt lúc Completed; lỗi kẹt đơn Cash người gửi (`CollectCash` chỉ cho Arrived/PickedUp, Deliver ép đã thu); đăng nhập chỉ nhận email (`LoginCommand(Email, …)`); Cloudinary upload công khai; 5 background job; settings 4 key; MapVina; hai route `topup`/`top-up`; comment lỗi thời ở `OnboardingController.cs:18`.
- Web `main`: React 18.3.1; có trang Driver (`DriverLayout`); nhãn "Email hoặc số điện thoại" (`LoginPage.tsx:194`) nhưng gửi `{ email: identifier }`, nên **lỗi 6.2 vẫn còn**; GPS web 10 s; dashboard làm mới 60 s.
- Mobile: mọi kết luận ở mục 5.2 và 6.1 giữ nguyên.

### 9.2 Kết luận thay đổi

| # | Trước (nhánh đang checkout) | Sau (nhánh chuẩn) |
|---|---|---|
| a | Web `PASSWORD_MAX = 20`, lệch BE | Web `main` = **100**, khớp BE và mobile. Chỉ còn lệch tài liệu (GB-53). Xem 6.3 |
| b | Có map proxy và `api/account/Route` | **Không có trên `develop`** (chỉ là file chưa commit trên máy). Web `main` và mobile không gọi tới, nên không ảnh hưởng |
| c | Có bảng `support_requests` và `POST api/public/SupportRequests` | **`develop` đã xoá** (commit `8834d5e`, migration `20261118164452_DropSupportRequests`) |

### 9.3 Vấn đề mới phát hiện khi so nhánh chuẩn

| # | Mức | Vấn đề | Đề xuất |
|---|---|---|---|
| 1 | 🔴 | **Mobile vẫn gọi `POST /public/SupportRequests`** (`customer_api.dart:27`, form ở `account_screen.dart:312–374`) nhưng BE `develop` đã xoá endpoint. Gửi yêu cầu hỗ trợ trên app sẽ lỗi 404. | Bỏ form trên mobile, hoặc khôi phục endpoint ở BE |
| 2 | 🟠 | Tài liệu vẫn mô tả Support Requests: SDS 3.22 `support_requests`, SDS §III.1.4 rate limit `api/public/supportrequests`, GB-49 "support-request endpoints". | Xoá khỏi SDS/SRS cho khớp `develop` |
| 3 | 🟡 | Mobile còn `ApiDriverRepository` gọi các endpoint không tồn tại (`/driver/application`, `/driver/draft`, `/driver/documents`, `/driver/applications`, `/driver/availability`). Chỉ dùng trong chế độ demo (`MockDriverApi`, `app.dart:128–137`), luồng thật dùng `backend_driver_repository.dart`. | Không ảnh hưởng chạy thật; nên đổi tên hoặc xoá cho đỡ nhầm |
| 4 | 🟡 | Nhánh `feat/tri-customer` ở máy và remote có lịch sử tách đôi (83 / 93 commit), dù code giống nhau. Lần push hoặc merge sau dễ gây xung đột giả. | Đồng bộ bằng `git reset --hard origin/feat/tri-customer`, sau khi sao lưu file chưa commit (`android/app/build.gradle.kts`, `proguard-rules.pro`) |

---

## 10. Số liệu khảo sát: đối chiếu Report-1 với dữ liệu gốc (Google Form)

**Nguồn:** form "Khảo sát Nhu cầu Nền tảng Vận chuyển Hàng" và hai sheet câu trả lời đi kèm (kiểm tra ngày 19/11/2026, chỉ đọc, không sửa).

| Sheet | Số dòng | Thời gian | Ghi chú |
|---|---|---|---|
| A (sheet đầy đủ) | 517 (323 khách hàng, 194 tài xế) | 20/09 → 30/09/2026 | Chứa toàn bộ phản hồi. 58 cột, gồm cả các câu hỏi thêm sau (cách định giá, tần suất, app tài xế đã chạy) |
| B (sheet 101 dòng) | 101 (**73 khách hàng, 28 tài xế**) | Chỉ ngày 30/09/2026, 09:02 → 10:41 | **Report-1 lấy số từ sheet này** |

### 10.1 Số trong Report-1 so với sheet B

| Report-1 (§I.2, dòng "Data collected…") | Dữ liệu gốc | Kết quả |
|---|---|---|
| 25–34 tuổi "largest share" 39.7% (29/73) | **18–24 tuổi là nhóm lớn nhất: 54.8% (40/73)**. 25–34 tuổi đứng thứ hai: 39.7% (29/73) | ❌ Đảo thứ tự |
| Hai nhóm tuổi cộng lại 94.5% | 69/73 = 94.5% | ✅ |
| Chuyển nhà trọ nguyên phòng 54.8% (40/73) | 40/73 | ✅ |
| Nội thất cồng kềnh 26% (19/73) | 19/73 = 26.0% | ✅ |
| Xe tải dưới 1 tấn 54.8% (40/73) | 40/73 | ✅ |
| Xe tải 1–2 tấn 35.6% (26/73) | 26/73 | ✅ |
| Tài xế: xe dưới 1 tấn 35.7% (10/28), xe 1–2 tấn 32.1% (9/28) | 10/28, 9/28 | ✅ |
| Thời gian chờ 30–60 phút (§I.2 Background) | Lựa chọn nhiều nhất của Q9: 41.1% (30/73) | ✅ |
| Tìm xe qua MXH / người quen / tờ rơi | Facebook/Zalo 60.3%, người quen 21.9%, Google 12.3%, app 5.5% | ✅ |
| Tài xế bị áp lực do thời gian chờ không có khách | "Ngồi chờ nhiều giờ không có khách" 57.1% (16/28) | ✅ |

Câu sửa cho Report-1:

> *"…the 18 to 24 age group accounts for the largest share at 54.8 percent (40 out of 73 surveyed customers), primarily students and young professionals needing room relocations. This is followed by the 25 to 34 age group at 39.7 percent (29 out of 73 customers), comprising office workers and small business owners. Together, these two age groups account for 94.5 percent…"*

### 10.2 Số liệu tham khảo khác từ sheet B (chưa dùng trong Report)

**Khách hàng (n = 73)**

| Câu hỏi | Lựa chọn nhiều nhất | Tỉ lệ |
|---|---|---|
| Nghề nghiệp | Sinh viên 43.8%, nhân viên văn phòng 20.5%, lao động tự do 20.5%, chủ doanh nghiệp nhỏ 15.1% | 32 / 15 / 15 / 11 |
| Thời gian tìm xe | 15–30 phút | 42.5% (31) |
| Chi phí trung bình mỗi chuyến | 200–500 nghìn và 500 nghìn–1 triệu (bằng nhau) | 35.6% mỗi mức (26) |
| Khó khăn lớn nhất | Không biết chính xác khi nào xe đến | 30.1% (22) |
| Đặt xe trước bao lâu | Trước vài giờ | 79.5% (58) |

**Tài xế (n = 28)**

| Câu hỏi | Lựa chọn nhiều nhất | Tỉ lệ |
|---|---|---|
| Độ tuổi | 25–34 tuổi | 50.0% (14) |
| Vai trò của nghề chở hàng | Nghề chính, có làm thêm việc khác | 53.6% (15) |
| Kênh nhận khách | Hội nhóm Facebook/Zalo | 42.9% (12) |
| Loại hàng thường chở | Nội thất | 42.9% (12) |
| Thời gian quyết định nhận đơn | 5–15 phút | 64.3% (18) |

Mức độ quan trọng của các tính năng (Q8) ở tài xế phân tán đều, mỗi mức khoảng 14–29%, không có tính năng nào nổi bật. Kết quả này **không ủng hộ** các câu kiểu "drivers need…" trong Report-1.

### 10.3 ⚠️ Rủi ro chất lượng dữ liệu (cần xử lý trước khi bảo vệ)

| # | Mức | Dấu hiệu | Bằng chứng |
|---|---|---|---|
| 1 | 🔴 | **Sheet B nộp dồn trong thời gian rất ngắn** | Cả 101 phản hồi được nộp trong khoảng 1 giờ 39 phút sáng 30/09. Có 97/100 lần nộp cách lần trước ≤ 10 giây |
| 2 | 🔴 | **Câu trả lời giống hệt 100%** | Cả 73/73 khách hàng chọn "Quan trọng" cho **tất cả 10 tính năng**, "Có" dùng app gọi xe, "Chắc chắn sẽ dùng", "Chấp nhận" phụ phí. Cả 28/28 tài xế chọn "Sẵn sàng" nộp giấy tờ và "Chắc chắn sẽ đăng ký" |
| 3 | 🔴 | **Góp ý giống hệt nhau** | Cả 73 khách hàng có cùng một câu góp ý, nhiều câu bị nối dính không dấu cách ("…dễ đặt xeNên báo giá…") |
| 4 | 🟠 | **Sheet A cũng nộp dồn** | 404 phản hồi trong hai ngày 23–24/09, mỗi lần nộp thường chỉ cách nhau khoảng 5 giây. Phân bố lại ngẫu nhiên bất thường, ví dụ 47 khách hàng "Dưới 18 tuổi" và 54 người "Không có nhu cầu" |
| 5 | 🟠 | **Hai bộ dữ liệu không thống nhất** | Cùng câu "có dùng app gọi xe không": sheet B chỉ có đáp án "Có", sheet A có các mức tần suất. Cách định giá (Q13) có ở sheet A nhưng không có ở sheet B |
| 6 | 🟠 | **Mâu thuẫn với sản phẩm** | 100% khách hàng đánh giá "AI phân tích ảnh hàng hoá" là quan trọng, nhưng code không có AI (xem 1.1, 2.1) |

Chỉ **12 phản hồi đầu tiên (20–22/09)** có hình dạng như người thật điền:
- Các lần nộp cách nhau hàng giờ (trung vị khoảng 1 giờ 53 phút).
- Câu trả lời đa dạng: chủ yếu 18–24 tuổi (9/11), "Có thể sẽ dùng" 6/10, hay thuê xe bán tải.

Tuy nhiên 12 phản hồi là quá ít để trích phần trăm.

### 10.4 Đề xuất

1. **Sửa ngay câu "largest share"** ở Report-1 bằng câu trong 10.1.
2. **Ghi rõ nguồn và cỡ mẫu** trong Report-1, ví dụ "Survey conducted on 30/09/2026, N = 101 (73 customers, 28 drivers)", và đưa link sheet vào phụ lục.
3. **Nên khảo sát lại thật, dù chỉ 30–50 người,** rồi tính lại số liệu bằng script thay vì tính tay.
4. **Nếu vẫn dùng sheet B,** không trích các con số 100% (tầm quan trọng tính năng, "chắc chắn sẽ dùng", "sẵn sàng nộp giấy tờ") và không trích câu góp ý trùng lặp, vì đây là chỗ hội đồng dễ hỏi nhất.
5. **Bỏ hoặc đổi các kết luận dựa trên AI** cho khớp với sản phẩm thật (xem 8).

---

## 11. Đọc lại Report-1 và Report-2 (bản sửa 19/11/2026, 12:17)

Đã trích lại văn bản hai file `.docx` và so từng dòng với bản đọc lúc sáng.

### 11.1 Thay đổi trong Report-1

| Phần | Bản cũ | Bản 19/11 | Đánh giá |
|---|---|---|---|
| Change log | 5 dòng + 8 dòng trống | Xoá dòng trống, thêm "14/11/2026 · M · HoangNM · Modify Existing Solutions" | ✅ (nhưng thiếu dòng D cho phần đã xoá, xem 2.11) |
| III. Existing Solutions | Lalamove, **GrabExpress**, Ahamove | **Bỏ GrabExpress**, còn Lalamove và Ahamove | ✅ Hợp lý (GrabExpress chỉ chở tối đa 30 kg, không cùng phân khúc) |
| GAP của Lalamove / Ahamove | Dựa vào AI phân tích ảnh hàng | "Chưa chuyên cho chuyển nhà, chuyển phòng trọ, đồ nội thất cồng kềnh trong nội thành" | 🟡 Bớt mâu thuẫn với code, nhưng lệch với Weaknesses (2.9) và yếu vì chính đối thủ có phục vụ nhóm này (2.10) |
| Section Summary | Khoảng trống là AI | Khoảng trống là nền tảng chuyên cho chuyển đồ cá nhân, quy trình đặt gọn | ✅ Khớp sản phẩm hơn |
| Major Features | Có cột "Addressed Gaps" trống | Bỏ cột | ✅ |

**Chưa thay đổi (vẫn còn lỗi):**
- AI ở Purpose, kết luận Background, Proposed Solution, FE-04, LI-03 (1.1).
- Câu "largest share" sai nhóm tuổi (2.5, 10.1).
- LI-01 nội thành và LI-04 đếm ngược 30 giây (1.2, 1.3).
- EX-04 chat và số ẩn (1.5); FE-07 hoá đơn điện tử (1.4).
- Bìa "Aug 2026" (2.6); "GrapExpress" trong change log (2.7).

### 11.2 Thay đổi trong Report-2

| Phần | Bản cũ | Bản 19/11 | Đánh giá |
|---|---|---|---|
| §1.2 Major Features | 10 feature, đánh số riêng (FE-02 Pricing+AI…) | **Chép nguyên 11 feature của R1** | ✅ Hết lệch mã FE (1.9), hết vòng đời sai (1.10), hết "audit logging, promotions" (1.11), hết "surcharges" (1.6). ⚠️ Thừa hưởng lỗi của R1 (3.2) |
| Giả định #1, R01, Training plan | Google Maps API | **MapVina** | ✅ (1.8) |
| Change log | — | Không thêm dòng nào | 🟡 (3.10) |

**Chưa thay đổi (vẫn còn lỗi):**
- Tổng effort 280 (thực tế cộng ra 270), Iteration 1 và 2 cộng sai (3.1).
- Web chỉ cho Dispatcher/Admin (3.3, 1.7).
- GPS qua WebSocket ở §1.4, R02 và ví dụ commit (3.4).
- AI ở FE-04, giả định #1, Scope Limitations, R01, R03 (1.1).
- Ràng buộc "dữ liệu cá nhân phải mã hoá" mâu thuẫn với SDS (3.5).
- Quy ước nhánh, commit và tag không khớp thực tế (3.6).
- Còn 2 chỗ placeholder / "xxx", "Ngo Tuan Kiem" (3.7).
- Training plan chỉ 1 dòng (3.4).

### 11.3 Tóm tắt

- **Đã xử lý:** 1.6 (R2), 1.8 (R2), 1.9, 1.10, 1.11 (R2), 2.2, 2.8.
- **Lỗi mới do bản sửa:** 2.9, 2.10, 2.11, 3.10.
- **Ưu tiên tiếp theo cho R1/R2:**
  1. Quyết định số phận AI (1.1), vì đây là chỗ R1 vẫn tự mâu thuẫn sau khi GAP đã bỏ AI.
  2. Sửa câu "largest share".
  3. Sửa Weaknesses cho khớp GAP mới.
  4. Sửa tổng effort của R2.
