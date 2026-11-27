# BK Parking Management System (MVP)

Monorepo chung của nhóm cho dự án **BK Parking MVP** (CO3011 - HK261).
Giai đoạn phát triển: 11/11/2026 - 23/11/2026 (MVP Freeze) | Báo cáo: 30/11/2026.

## Cấu trúc thư mục

- `frontend/`: Ứng dụng ReactJS + TypeScript + Tailwind CSS (User Portal, Admin Portal, Staff Portal, Public View).
- `backend/`: Ứng dụng Java 21 + Spring Boot 3 (Modular Monolith) + PostgreSQL + Spring Security JWT.
- `docs/`: Tài liệu kỹ thuật chung ([DATABASE_ERD.md](docs/DATABASE_ERD.md), [API_CONTRACT.md](docs/API_CONTRACT.md), [BK_Parking_MVP.postman_collection.json](docs/BK_Parking_MVP.postman_collection.json), [TV1_INTEGRATION_REPORT.md](docs/TV1_INTEGRATION_REPORT.md)).

## Phân công thành viên và nhánh làm việc

Quy ước: Không commit trực tiếp lên `main`. Các thành viên tạo branch riêng từ `develop`, hoàn thành thì mở Pull Request vào `develop`.

| Thành viên | Vai trò | Phạm vi phụ trách | Branch |
| :--- | :--- | :--- | :--- |
| TV1 | Backend Lead | Nền tảng BE, Database/Migration, Auth JWT, Parking Lots, Dashboard, Public API, Docker/Tích hợp | `feat/tv1-backend-platform`, `feat/tv1-demo-integration` |
| TV2 | Backend Dev | Đăng ký xe, Admin duyệt/từ chối, QR Token, Check-in/Check-out, Tra cứu & Lịch sử | `feat/mthu-be-mvp` |
| TV3 | Frontend Dev | User Portal (Dashboard, Quản lý xe, Đặt chỗ, Gói đỗ xe, Lịch sử, Thông báo) | `feat/tv3-user-portal`, `feat/tv3-reservations` |
| TV4 | Frontend Dev | Admin Portal (Dashboard, Quản lý bãi, Duyệt xe, Đặt chỗ, Đối soát/Báo cáo) | `feat/tv4-admin-portal` |
| TV5 | Frontend Dev | Màn hình Đăng nhập chung, Staff Portal (Trạm kiểm soát, Ngoại lệ, Tra cứu) & Public View | `feat/tv5-staff-public` |

## Tech Stack

- **Frontend:** React 19 + TypeScript + Tailwind CSS v4 (Vite 8, Nginx trong Docker)
- **Backend:** Java 21 + Spring Boot 3.4 + Spring Security (JWT) + Spring Data JPA + Flyway
- **Database:** PostgreSQL 16 (hoặc H2 in-memory cho profile `dev`)
- **API Docs:** Swagger / OpenAPI (`http://localhost:8080/swagger-ui.html`) & Postman Collection
- **Triển khai:** Docker & Docker Compose

## Hướng dẫn khởi chạy hệ thống

### Cách 1: Chạy toàn bộ bằng Docker Compose (Tích hợp / Demo)

Yêu cầu: đã mở **Docker Desktop**.

Chạy 1 lệnh tại thư mục gốc `bk-parking-mvp` (hoặc nhấp đúp file `run-docker.bat` trên Windows):

```powershell
docker compose up --build -d
```

Các dịch vụ sau khi khởi chạy:
- **Frontend Web App:** `http://localhost:3000` (Nginx tự reverse proxy `/api/` sang container `backend`)
- **Backend API:** `http://localhost:8080/api/v1`
- **Swagger UI:** `http://localhost:8080/swagger-ui.html`
- **PostgreSQL 16:** `localhost:5432` (database `bk_parking`, user `bkparking`)

Dừng hệ thống: `docker compose down` (hoặc `docker compose down -v` nếu muốn reset database về seed ban đầu).

### Cách 2: Chạy trực tiếp trên máy cá nhân (Local Dev)

1. **Chạy Backend** (dùng H2 in-memory có sẵn dữ liệu mẫu, không cần PostgreSQL):
   ```powershell
   cd backend
   mvn spring-boot:run
   ```
   *(Hoặc nhấp đúp `backend/run-backend.bat`. Nếu muốn dùng PostgreSQL trên Docker: chạy `docker compose up -d postgres` rồi chạy `mvn spring-boot:run "-Dspring-boot.run.profiles=postgres"`).*

2. **Chạy Frontend** (mở terminal mới):
   ```powershell
   cd frontend
   npm install
   npm run dev
   ```
   Mở trình duyệt tại `http://localhost:5173`.

## Tài khoản Demo (Mật khẩu chung: `123456`)

| Username | Vai trò | Portal đích | Dữ liệu mẫu có sẵn |
| :--- | :--- | :--- | :--- |
| `sv.nguyen` | `ROLE_USER` | User Portal | Nguyễn Văn An (2311770) - 1 gói HK261 `ACTIVE`, 1 xe `APPROVED` (`59X3-682.45`), 1 xe `PENDING` (`59T2-119.88`) |
| `sv.tran` | `ROLE_USER` | User Portal | Trần Thị Bình (2210456) - 1 gói HK261 `ACTIVE`, 1 xe `APPROVED` (`60B8-451.20` đang gửi ở bãi A1), 1 xe `REJECTED` (`72C1-990.12`) |
| `gv.le` | `ROLE_USER` | User Portal | TS. Lê Hoàng Nam (CB00891) - 1 gói Tháng `ACTIVE`, 1 xe điện `APPROVED` (`51A-888.99` đang gửi ở bãi B4) |
| `admin` | `ROLE_ADMIN` | Admin Portal | Phạm Quản Trị (ADM001) - Quản lý 5 bãi đỗ và duyệt hồ sơ xe |
| `staff.gate` | `ROLE_STAFF` | Staff Portal | Võ Văn Bảo Vệ (STF001) - Trạm kiểm soát quét QR vào/ra và tra cứu xe |

## Kịch bản kiểm thử luồng MVP End-to-End (7 bước)

1. Mở `/public` (Public View) để ghi nhận số xe đang đỗ ban đầu (2 xe: 1 ở Khu A1, 1 ở B4) và số chỗ trống của 5 bãi.
2. Đăng nhập bằng `sv.tran` tại `/login`, vào mục **Quản lý phương tiện** đăng ký 1 xe mới (kiểm tra trạng thái ban đầu là `PENDING`).
3. Đăng xuất, đăng nhập bằng `admin`, vào **Duyệt & Quản lý phương tiện** để xem hồ sơ mới và bấm **Duyệt** (hoặc **Từ chối** kèm lý do với xe khác).
4. Đăng nhập lại bằng `sv.tran`, tải lại trang để xác nhận trạng thái đã cập nhật từ DB, sau đó mở **Mã QR** của xe vừa duyệt.
5. Đăng nhập bằng `staff.gate`, vào **Trạm kiểm soát**, quét hoặc nhập mã QR (`qrToken`) -> xác nhận hệ thống báo hợp lệ (`CHECK_IN`) -> bấm xác nhận cho xe **VÀO** bãi (thử quét vào lần 2 phải bị chặn lỗi đang có phiên mở).
6. Mở lại `/public` và Admin Dashboard: xác nhận số xe đang đỗ tăng thêm 1 và số chỗ trống giảm đi 1 đúng theo bãi vừa vào.
7. Tại Staff Portal, quét lại mã QR đó -> xác nhận hệ thống chuyển sang `CHECK_OUT` -> bấm cho xe **RA**, sau đó kiểm tra lịch sử hoạt động ở User Portal và số chỗ trống trên Public View quay về ban đầu.

## Tài liệu tham khảo

- [Thiết kế Database & ERD (8 bảng thực tế)](docs/DATABASE_ERD.md)
- [API Contract & Mã lỗi chuẩn](docs/API_CONTRACT.md)
- [TypeScript Interfaces dùng chung](docs/api-types.ts)
- [Postman Collection](docs/BK_Parking_MVP.postman_collection.json)
- [Báo cáo tích hợp TV1](docs/TV1_INTEGRATION_REPORT.md)
