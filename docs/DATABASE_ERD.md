# BK Parking MVP - Kiến trúc Cơ sở dữ liệu & ERD

Tài liệu kỹ thuật nội bộ Backend - Dự án **BK Parking MVP** (CO3011 - HK261).
- **Phụ trách chính:** TV1 (Backend Lead) phối hợp TV2 (Backend Dev) và TV3 (bổ sung migration V3).
- **Hệ quản trị CSDL:** PostgreSQL 16+ (hỗ trợ H2 `MODE=PostgreSQL` cho local dev và test).
- **Flyway Migrations:** `V1__init_schema.sql`, `V2__seed_demo_data.sql`, `V3__tv3_vehicle_management_api.sql`.

---

## 1. Sơ đồ Thực thể Liên kết (Mermaid ERD)

Hệ thống gồm **8 bảng** đang chạy thực tế trên database:

```mermaid
erDiagram
    roles ||--o{ users : "has_role (1:N)"
    users ||--o{ vehicles : "owns (1:N)"
    users ||--o{ vehicles : "reviews (0..1:N)"
    users ||--o{ user_packages : "subscribes (1:N)"
    users ||--o{ vehicle_documents : "uploads (1:N)"
    parking_packages ||--o{ user_packages : "applies_to (1:N)"
    parking_lots ||--o{ parking_sessions : "hosts (1:N)"
    vehicles ||--o{ parking_sessions : "logs (1:N)"
    users ||--o{ parking_sessions : "checks_in (0..1:N)"
    users ||--o{ parking_sessions : "checks_out (0..1:N)"

    roles {
        bigint id PK
        varchar code UK "ROLE_USER, ROLE_ADMIN, ROLE_STAFF"
        varchar name
    }

    users {
        bigint id PK
        varchar username UK
        varchar password_hash
        varchar full_name
        varchar code UK "MSSV / MSCB"
        varchar email UK
        varchar phone
        varchar department
        bigint role_id FK
        varchar status "ACTIVE, LOCKED"
        timestamp created_at
    }

    parking_lots {
        bigint id PK
        varchar code UK "LOT_A1, LOT_B1, LOT_C1, LOT_B4, LOT_DA_H1"
        varchar name
        varchar campus "CS1_LTK, CS2_DI_AN"
        varchar location
        varchar allowed_vehicle_types
        int capacity "CHECK >= 0"
        varchar status "OPEN, FULL, MAINTENANCE, CLOSED"
        timestamp updated_at
    }

    parking_packages {
        bigint id PK
        varchar code UK
        varchar name
        text description
        varchar vehicle_type
        decimal price
        int duration_days
        boolean is_active
    }

    user_packages {
        bigint id PK
        bigint user_id FK
        bigint package_id FK
        date start_date
        date end_date
        varchar status "ACTIVE, EXPIRED, GRACE_PERIOD"
    }

    vehicles {
        bigint id PK
        bigint user_id FK
        varchar license_plate UK
        varchar vehicle_type "MOTORBIKE, ELECTRIC_BIKE, BICYCLE, CAR"
        varchar brand
        varchar model
        varchar color
        varchar registration_doc_url
        varchar registration_doc_back_url "V3"
        varchar vehicle_photo_url "V3"
        varchar owner_relationship "V3: SELF, FAMILY..."
        varchar status "PENDING, APPROVED, REJECTED, LOCKED, CANCELED"
        text rejection_reason
        varchar qr_token UK
        bigint reviewed_by FK
        timestamp reviewed_at
        timestamp created_at
        timestamp updated_at
    }

    vehicle_documents {
        bigint id PK "V3"
        bigint owner_id FK
        varchar purpose
        varchar original_file_name
        varchar stored_file_name UK
        varchar content_type
        bigint size_bytes "CHECK > 0"
        timestamp created_at
    }

    parking_sessions {
        bigint id PK
        bigint vehicle_id FK
        bigint parking_lot_id FK
        bigint checkin_staff_id FK
        bigint checkout_staff_id FK
        varchar entry_gate
        varchar exit_gate
        timestamp checkin_time
        timestamp checkout_time
        varchar status "ACTIVE, COMPLETED"
        text note
    }
```

---

## 2. Chi tiết các bảng và ràng buộc dữ liệu cốt lõi

### 2.1. Danh sách bảng (khớp `V1__init_schema.sql` + `V3__tv3_vehicle_management_api.sql`)
1. **`roles`**: Định nghĩa 3 vai trò `ROLE_USER`, `ROLE_ADMIN`, `ROLE_STAFF`.
2. **`users`**: Lưu thông tin tài khoản, mã định danh (`code` - MSSV/MSCB), email, khoa/đơn vị (`department`), vai trò (`role_id`) và trạng thái (`ACTIVE`/`LOCKED`).
3. **`parking_lots`**: Lưu thông tin 5 bãi đỗ (`LOT_A1`, `LOT_B1`, `LOT_C1`, `LOT_B4`, `LOT_DA_H1`), cơ sở (`campus`), loại xe cho phép (`allowed_vehicle_types` — trong `V3`, `LOT_B4` đã bổ sung thêm `CAR`), sức chứa (`capacity >= 0`) và trạng thái (`OPEN`, `FULL`, `MAINTENANCE`, `CLOSED`).
4. **`parking_packages`**: Danh mục gói đỗ xe mẫu (`PKG_SEM_261`, `PKG_MONTH_STD`, `PKG_BICYCLE_SEM`).
5. **`user_packages`**: Gán gói mẫu cho người dùng để Backend kiểm tra quyền gửi xe (`ACTIVE`) khi cấp QR hoặc quét vào cổng.
6. **`vehicles`**: Lưu thông tin phương tiện đăng ký (`license_plate` unique), trạng thái duyệt (`PENDING`, `APPROVED`, `REJECTED`, `LOCKED`, `CANCELED`), mã định danh `qr_token` (sinh khi duyệt), ảnh giấy tờ mặt trước/sau (`registration_doc_url`, `registration_doc_back_url`), ảnh xe (`vehicle_photo_url`), mối quan hệ chủ xe (`owner_relationship`) và thông tin kiểm duyệt (`reviewed_by`, `reviewed_at`, `rejection_reason`).
7. **`vehicle_documents`** *(bổ sung ở `V3`)*: Lưu metadata các file ảnh giấy tờ xe người dùng upload lên server (`stored_file_name`, `content_type`, `size_bytes`).
8. **`parking_sessions`**: Lưu lịch sử từng lượt xe vào/ra (`checkin_time`, `checkout_time`, `entry_gate`, `exit_gate`, nhân viên xác nhận và trạng thái `ACTIVE` / `COMPLETED`).

### 2.2. Các quy tắc toàn vẹn dữ liệu bắt buộc
1. **Tính số chỗ trống từ phiên đang mở (`ACTIVE`):**
   - Không lưu cột đếm rời rạc trong `parking_lots` để tránh sai lệch dữ liệu.
   - `occupiedCount` = `COUNT(*)` trong `parking_sessions` theo `parking_lot_id` với `status = 'ACTIVE'`.
   - `availableSlots` = `MAX(0, capacity - occupiedCount)`.
2. **Chống check-in trùng (Anti-passback):**
   - Trong `ParkingSessionService.checkIn` (`@Transactional`), hệ thống kiểm tra `findByVehicleIdAndStatus(vehicleId, "ACTIVE")`. Nếu xe đã có phiên đang mở thì trả về `409 Conflict` (`SESSION_ALREADY_ACTIVE`).
3. **Ràng buộc sức chứa khi Admin cập nhật bãi:**
   - Trong `ParkingLotAndDashboardController.updateParkingLot` (`@Transactional`), nếu `capacity` mới nhỏ hơn `occupiedCount` hiện tại thì từ chối với mã lỗi `400 Bad Request` (`CAPACITY_BELOW_OCCUPIED`).
4. **Giới hạn đăng ký phương tiện & trùng biển số:**
   - Mỗi tài khoản chỉ được đăng ký tối đa `2` phương tiện ở trạng thái `PENDING` hoặc `APPROVED` (`VEHICLE_LIMIT_EXCEEDED`).
   - `license_plate` được chuẩn hóa viết hoa và kiểm tra duy nhất (`DUPLICATE_LICENSE_PLATE`).
5. **Index tối ưu truy vấn (`V1` & `V3`):**
   - `idx_vehicles_user_id` trên `vehicles(user_id)`
   - `idx_vehicles_status` trên `vehicles(status)`
   - `idx_sessions_vehicle_status` trên `parking_sessions(vehicle_id, status)`
   - `idx_sessions_lot_status` trên `parking_sessions(parking_lot_id, status)`
   - `idx_vehicle_documents_owner_id` trên `vehicle_documents(owner_id)`
