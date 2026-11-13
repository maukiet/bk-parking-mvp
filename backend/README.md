# BK PARKING - Backend Service (MVP)

> **Môn học:** Quản lý Dự án Phần mềm (CO3011) - HK261  
> **Dự án:** Hệ thống Quản lý Bãi đỗ xe Thông minh Trường Đại học Bách Khoa (BK Parking MVP)  
> **Kiến trúc:** Modular Monolith | **Backend Tech Lead:** TV1

---

## 1. Tổng quan & Kiến trúc Hệ thống

Hệ thống Backend cho BK Parking được thiết kế theo mô hình **Modular Monolith** nhằm tối ưu hóa tốc độ triển khai cho nhóm 5 thành viên (TV1..TV5), đảm bảo tính tách biệt ranh giới giữa các module (Domain Bounded Contexts) mà không gặp phải rào cản phức tạp về hạ tầng phân tán.

### 1.1. Công nghệ Sử dụng
- **Ngôn ngữ:** Java 21 (LTS)
- **Framework:** Spring Boot 3.x (Spring Web, Spring Security, Spring Data JPA, Spring Validation)
- **Cơ sở dữ liệu:**
  - *Dev / Test:* H2 In-Memory Database (khởi động tức thì, có sẵn dữ liệu mẫu)
  - *Postgres / Production:* PostgreSQL 16
- **Xác thực & Phân quyền:** JWT (JSON Web Token) với RBAC (`ROLE_USER`, `ROLE_ADMIN`, `ROLE_STAFF`)
- **Tài liệu API:** Springdoc OpenAPI 3.0 / Swagger UI
- **Containerization:** Docker, Docker Compose (Multi-stage build)
- **Build Tool:** Apache Maven 3.9+

### 1.2. Cấu trúc Phân hệ (Modules)
```text
bk-parking-backend/
├── src/main/java/vn/edu/hcmut/bkparking/
│   ├── common/             # Generic Response, Exception Handler, Base Entities, Utils
│   ├── config/             # SecurityConfig, CorsConfig, SwaggerConfig, ApplicationProperties
│   └── modules/
│       ├── auth/           # Đăng nhập, cấp phát JWT, thông tin tài khoản
│       ├── user/           # Quản lý hồ sơ người dùng, sinh viên, cán bộ
│       ├── vehicle/        # Đăng ký xe, duyệt biển số xe, thông tin phương tiện
│       ├── subscription/   # Đăng ký gói gửi xe học kỳ / tháng, thanh toán demo
│       ├── accesscontrol/  # Kiểm soát vào/ra (Check-in/Check-out), quét biển số, ghi log
│       └── report/         # Thống kê lượt xe, doanh thu, báo cáo dashboard admin
└── src/main/resources/
    ├── application.yml          # Cấu hình chung
    ├── application-dev.yml      # Profile Dev (In-Memory H2 DB, seed data tự động)
    ├── application-postgres.yml # Profile PostgreSQL (kết nối DB thật)
    └── application-prod.yml     # Profile Docker/Production
```

---

## 2. Hướng dẫn Khởi chạy Ứng dụng

Dự án cung cấp 2 phương thức khởi chạy linh hoạt tùy vào mục đích phát triển và kiểm thử của từng thành viên:

### Cách 1: Chạy nhanh không cần cài đặt Database (Khuyên dùng cho Frontend & Dev nhanh)
> Sử dụng profile `dev` với In-Memory Database H2. Dữ liệu tài khoản demo, xe và gói vé mẫu sẽ tự động được nạp sẵn vào bộ nhớ.

1. **Yêu cầu:** Máy đã cài JDK 21 và Maven (hoặc dùng Maven Wrapper).
2. **Khởi chạy ứng dụng:**
   ```bash
   mvn spring-boot:run
   ```
   *(Mặc định active profile `dev`, lắng nghe tại cổng `8080`).*

3. **Truy cập Swagger UI:**  
   [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)  
   *(H2 Console tại `http://localhost:8080/h2-console` nếu cần xem trực tiếp dữ liệu)*

---

### Cách 2: Chạy với PostgreSQL trên Docker (Chuẩn môi trường Integration)
> Sử dụng khi phát triển module cần lưu trữ dữ liệu thật trên PostgreSQL.

#### Bước 2.1: Khởi động riêng PostgreSQL
```bash
docker compose up -d postgres
```
Kiểm tra container đang chạy: `docker ps` (service `bk-parking-db` ở port `5432`).

#### Bước 2.2: Chạy Backend kết nối tới PostgreSQL
```bash
mvn spring-boot:run -Dspring-boot.run.profiles=postgres
```

#### Hoặc chạy TOÀN BỘ hệ thống (Backend + Postgres) qua Docker:
```bash
docker compose up --build -d
```
Xem logs:
```bash
docker compose logs -f backend
```
Dừng hệ thống:
```bash
docker compose down
```

---

## 3. Tài khoản Demo & Dữ liệu Mẫu

Hệ thống được nạp sẵn danh sách tài khoản demo phục vụ test luồng nghiệp vụ trên Swagger UI và kết nối Frontend.

> **Mật khẩu chung cho tất cả tài khoản:** `123456`

| Username | Role | Vai trò & Kịch bản Kiểm thử |
| :--- | :--- | :--- |
| `sv.nguyen` | `ROLE_USER` | **Sinh viên Nguyễn Văn An:** Đã đăng ký gói gửi xe học kỳ; có sẵn **1 xe máy đã duyệt** (`59A-123.45`) và **1 xe đang chờ duyệt** (`59B-678.90`). Dùng để test check-in hợp lệ & kiểm tra trạng thái xe. |
| `sv.tran` | `ROLE_USER` | **Sinh viên Trần Thị Bình:** Có gói gửi xe học kỳ còn hạn nhưng chưa đăng ký xe hoặc xe mới. |
| `admin` | `ROLE_ADMIN` | **Quản trị viên Hệ thống:** Duyệt đăng ký biển số xe của sinh viên, xem thống kê doanh thu, tỷ lệ lấp đầy bãi xe và quản lý tài khoản. |
| `staff.gate` | `ROLE_STAFF` | **Nhân viên Kiểm soát Trạm cổng:** Thực hiện quét vào/ra (Check-in / Check-out), tra cứu trạng thái vé xe của sinh viên tại chốt barrier. |

---

## 4. Tài liệu API (Swagger UI)

Sau khi backend khởi động thành công, toàn bộ danh sách API, schema request/response và tính năng `Try it out` có thể truy cập trực tiếp tại:

🔗 **Swagger UI Endpoint:** [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)  
🔗 **OpenAPI JSON Spec:** [http://localhost:8080/v3/api-docs](http://localhost:8080/v3/api-docs)

> **Hướng dẫn Test Token trên Swagger:**
> 1. Gọi API `POST /api/v1/auth/login` với tài khoản demo bất kỳ (vd: `sv.nguyen` / `123456`).
> 2. Copy chuỗi `accessToken` trả về trong response.
> 3. Bấm nút **Authorize (ổ khóa)** ở góc trên bên phải Swagger UI, dán token vào và bấm **Authorize**.

---

## 5. Quy ước Làm việc Nhóm & Git Workflow

Dành cho cả 5 thành viên (TV1, TV2, TV3, TV4, TV5):

### 5.1. Cấu trúc Nhánh (Branches)
- `main`: Nhánh production ổn định, chỉ merge từ `develop` khi release milestone hoặc chuẩn bị nộp bài.
- `develop`: Nhánh tích hợp chính của cả nhóm. Mọi tính năng sau khi test xong đều merge vào đây.
- `feat/tv1-<feature-name>`: Nhánh làm việc của TV1 (Core Auth, User, Architecture).
- `feat/tv2-<feature-name>`: Nhánh làm việc của TV2 (Subscription, Package, Payment demo).
- `feat/tv3-<feature-name>`: Nhánh làm việc của TV3 (Vehicle registration, Admin Approval).
- `feat/tv4-<feature-name>`: Nhánh làm việc của TV4 (Gate Check-in/Check-out, Log).
- `feat/tv5-<feature-name>`: Nhánh làm việc của TV5 (Report, Dashboard Stats).
- `feat/fe-<feature-name>`: Nhánh phát triển giao diện người dùng (Frontend team).

### 5.2. Quy trình Commit & Pull Request (PR)
1. **Pull mới nhất trước khi làm:**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feat/tvX-ten-tinh-nang
   ```
2. **Quy tắc Commit Message:**
   - `feat: thêm API đăng ký gói học kỳ`
   - `fix: sửa lỗi xác thực token hết hạn`
   - `docs: cập nhật hướng dẫn Swagger`
   - `refactor: tối ưu query lịch sử vào ra`
3. **Mở Pull Request:**
   - Tạo PR từ nhánh tính năng vào `develop`.
   - Gắn ít nhất 1 thành viên review (TV1 Backend Lead kiểm duyệt cấu trúc code & API contract).
   - Đảm bảo `mvn test` hoặc build thành công trước khi request merge.

---

## 6. Phân bổ Biến Môi trường (.env)

Khi triển khai trên máy cá nhân, tạo file `.env` từ `.env.example`:
```bash
cp .env.example .env
```
Các tham số cấu hình chính:
- `SERVER_PORT`: Cổng ứng dụng (mặc định `8080`).
- `SPRING_PROFILES_ACTIVE`: `dev` (H2 DB) hoặc `postgres` / `prod`.
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`: Thông tin kết nối PostgreSQL.
- `JWT_SECRET`: Secret key dùng ký JWT (ít nhất 256 bits).
- `CORS_ALLOWED_ORIGINS`: Danh sách các origin frontend được phép gọi API (ví dụ: `http://localhost:5173`).
