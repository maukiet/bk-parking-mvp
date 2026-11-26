# Báo cáo Tích hợp Hệ thống - TV1 (Backend Lead)

Cập nhật ngày: 26/11/2026 | Liên kết Issue: `#7` (`[TV1] Tích hợp nhánh, review PR và chuẩn bị bản demo`).

---

## 1. Các hạng mục TV1 đã hoàn thành

### 1.1. Hạ tầng và Backend MVP
- Khởi tạo monorepo `bk-parking-mvp` với quy ước nhánh `main`, `develop` và feature branches cho TV1–TV5.
- Thiết kế schema và Flyway migration (`V1__init_schema.sql`, `V2__seed_demo_data.sql`), đồng bộ `DATABASE_ERD.md` lên 8 bảng thực tế (bao gồm `V3__tv3_vehicle_management_api.sql` do TV3 bổ sung).
- Triển khai Spring Security + JWT (`/api/v1/auth/login`, `/me`, `/demo-accounts`), phân quyền `ROLE_USER`, `ROLE_ADMIN`, `ROLE_STAFF`.
- Triển khai API Public View, Admin Parking Lots và Admin Dashboard Summary (`ParkingLotAndDashboardController`).
- Công bố API Contract (`docs/API_CONTRACT.md`), TypeScript interfaces (`docs/api-types.ts`), Postman Collection và Swagger UI (`/swagger-ui.html`).

### 1.2. Đóng gói Docker toàn hệ thống (DB + Backend + Frontend)
- Bổ sung `frontend/Dockerfile` (multi-stage Node 24 -> Nginx 1.27), `frontend/nginx.conf` (SPA fallback, `client_max_body_size 10M`, reverse proxy `/api/` -> `http://backend:8080/api/`) và `frontend/.dockerignore`.
- Sửa `backend/Dockerfile` để tạo sẵn thư mục `/app/uploads/vehicle-documents` thuộc quyền `appuser:appgroup`, tránh lỗi từ chối quyền ghi khi upload giấy tờ xe trong container non-root.
- Cập nhật `docker-compose.yml` ở thư mục gốc gồm đầy đủ 3 service (`postgres`, `backend`, `frontend`) kèm volume `pgdata` và `uploads_data`.
- Cập nhật `run-docker.bat` tự giải phóng cổng `8080` và `3000` trước khi chạy `docker compose up --build -d`.

---

## 2. Danh sách bug đã xử lý trong quá trình tích hợp

| # | Bug / Vấn đề | Nguyên nhân | Cách xử lý | Trạng thái |
| :-: | :--- | :--- | :--- | :---: |
| 1 | `VehicleControllerTest` fail 3/21 test khi chạy tổng `mvn test` (PR `#41`) | Dùng chung H2 DB với `BkParkingMvpIntegrationTest` mà không rollback dữ liệu giữa các test method | Cô lập DB H2 test và thêm `@Transactional` (commit `0fdb81d`, đã verify 48/48 tests PASS) | Đã xử lý |
| 2 | Xung đột cấu trúc Vite giữa `develop` (TV3/TV4) và `feat/tv5-staff-public` | TV3 và TV5 khởi tạo 2 bộ `package.json`, Router và `AuthContext` khác phiên bản | Tích hợp TV5 theo chuẩn `develop` (commit `3c53d59`, PR `#48`), đồng bộ 3 key token trong `authApi.ts` | Đã xử lý |
| 3 | Lỗi build TypeScript `TS2741` tại `AdminVehiclesPage.tsx` | TV3 thêm `CANCELED` vào `VehicleStatus` nhưng map nhãn ở Admin Portal thiếu key này | TV4 bổ sung `CANCELED` trong PR `#47` (`2de8993`), `npm run build` pass 0 lỗi | Đã xử lý |
| 4 | Nguy cơ `AccessDeniedException` khi upload file trong Docker Backend | `backend/Dockerfile` chạy bằng `appuser` nhưng chưa tạo và cấp quyền thư mục `/app/uploads/vehicle-documents` | Tạo thư mục và `chown` cho `appuser` trong `backend/Dockerfile` + mount volume `uploads_data` | Đã xử lý |

---

## 3. Các mục còn tồn / phụ thuộc trước khi đóng Issue `#7` và release `main`

1. **Chạy thử thực tế Docker Compose trên máy có Docker Desktop đang bật:**
   - Do môi trường CI/dòng lệnh chưa mở `Docker Desktop` (`com.docker.service` đang dừng), cần bật Docker Desktop và chạy `run-docker.bat` để xác nhận 3 container chạy ổn định cùng nhau và truy cập được `http://localhost:3000`.
2. **Chờ các thành viên FE hoàn tất rà soát cuối cùng:**
   - **TV3 (`#21`):** Rà soát responsive, kiểm tra lại luồng đăng ký xe -> upload giấy tờ -> xem QR -> xem lịch sử.
   - **TV4 (`#28`):** Rà soát phân quyền và responsive Admin Portal.
   - **TV5 (`#34`):** Rà soát Staff Portal (quét QR vào/ra) và Public View.
   - **Cả nhóm (`#35`):** Regression test toàn bộ luồng End-to-End 7 bước, chuẩn bị kịch bản demo và slide báo cáo ngày 30/11.
3. **Merge bản phát hành cuối từ `develop` sang `main`:**
   - Hiện `origin/main` đang ở `a8d2353` (chưa có PR `#49` của TV3 và cấu hình Docker full stack). Sau khi nhóm hoàn tất `#21`, `#28`, `#34`, `#35`, TV1 tạo PR cuối `develop -> main` và đóng `#7`.

---

## 4. Ghi chú chất lượng nhỏ trên Frontend (không chặn build)

- Lệnh `npm run lint` (`oxlint`) hiện báo `0 errors` và `18 warnings` (chủ yếu là `react/set-state-in-effect` và `react-hooks/exhaustive-deps` ở một số trang của TV3 và TV5). Nếu còn thời gian trước 29/11, các bạn FE có thể dọn gọn các warning này.
