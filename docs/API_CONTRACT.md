# API Contract - BK Parking Management System (MVP)

Tài liệu API chính thức cho các endpoint đang có trong backend.
Dùng cho Frontend (**TV3 - User Portal**, **TV4 - Admin Portal**, **TV5 - Staff & Public View**) tích hợp trực tiếp với Backend Spring Boot.

- **Base URL:** `http://localhost:8080/api/v1`
- **Swagger UI (test trực tiếp):** `http://localhost:8080/swagger-ui.html`
- **Postman Collection:** [BK_Parking_MVP.postman_collection.json](BK_Parking_MVP.postman_collection.json)
- **TypeScript Types dùng chung (copy vào FE):** [api-types.ts](api-types.ts)
- **Chi tiết API quản lý phương tiện của TV3:** [TV3_VEHICLE_APIS.md](TV3_VEHICLE_APIS.md)

---

## 1. Quy ước chung cho Frontend

### 1.1. Header xác thực
- Các API không phải Public/Login đều bắt buộc gửi kèm JWT token:
  ```http
  Authorization: Bearer <accessToken>
  Content-Type: application/json
  ```

### 1.2. Khung JSON trả về (`ApiResponse<T>`)
Mọi API (cả thành công và lỗi) đều trả về cùng một cấu trúc:

```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Thao tác thành công",
  "data": {},
  "timestamp": "2026-11-16T12:00:00Z"
}
```

Khi có lỗi, `success` là `false`, `data` là `null`, `code` là mã lỗi nghiệp vụ để FE hiển thị thông báo tương ứng:

| HTTP | `code` | Ý nghĩa & gợi ý xử lý trên FE |
| :---: | :--- | :--- |
| `401` | `INVALID_CREDENTIALS` | Sai username hoặc password khi đăng nhập |
| `401` | `UNAUTHORIZED` | Chưa đăng nhập hoặc token hết hạn -> điều hướng về `/login` |
| `403` | `FORBIDDEN` | Sai role hoặc mở QR của xe người khác -> hiện thông báo không có quyền |
| `404` | `RESOURCE_NOT_FOUND` | Không tìm thấy xe / bãi đỗ |
| `400` | `VALIDATION_ERROR` | Thiếu trường bắt buộc hoặc giá trị không hợp lệ (`message` chứa chi tiết) |
| `409` | `DUPLICATE_LICENSE_PLATE` | Biển số xe đã tồn tại trong hệ thống |
| `400` | `VEHICLE_LIMIT_EXCEEDED` | User đã có đủ 2 xe ở trạng thái `PENDING` hoặc `APPROVED` |
| `400` | `VEHICLE_NOT_APPROVED` | Xe chưa được duyệt hoặc đã bị từ chối/khóa, không mở được QR |
| `400` | `INVALID_QR_TOKEN` | Mã QR hoặc biển số không tồn tại |
| `400` | `PACKAGE_INELIGIBLE` | Tài khoản chưa có gói đỗ xe `ACTIVE` |
| `409` | `SESSION_ALREADY_ACTIVE` | Xe hiện đang ở trong bãi, không cho check-in trùng |
| `400` | `NO_ACTIVE_SESSION` | Xe không có phiên đang mở trong bãi để check-out |
| `409` | `PARKING_LOT_FULL` | Bãi xe đã đầy hoặc không ở trạng thái `OPEN` |
| `400` | `CAPACITY_BELOW_OCCUPIED` | Admin nhập sức chứa mới nhỏ hơn số xe hiện đang đỗ |
| `403` | `VEHICLE_TYPE_NOT_ALLOWED` | Tài khoản không đủ điều kiện đăng ký ô tô |
| `409` | `VEHICLE_HAS_ACTIVE_SESSION` | Không thể hủy phương tiện đang ở trong bãi |
| `400` | `INVALID_VEHICLE_DOCUMENT` | Thiếu ảnh, sai loại ảnh hoặc ảnh không thuộc tài khoản |
| `413` | `DOCUMENT_TOO_LARGE` | Ảnh vượt quá 5 MB |
| `415` | `UNSUPPORTED_DOCUMENT_TYPE` | Ảnh không phải JPG hoặc PNG hợp lệ |

---

## 2. Bản đồ Endpoint theo từng thành viên Frontend

### TV5 - Đăng nhập chung & Public View
| Màn hình | Method & Endpoint | Auth | Ghi chú |
| :--- | :--- | :---: | :--- |
| Chọn nhanh tài khoản demo | `GET /auth/demo-accounts` | Public | Lấy danh sách tài khoản mẫu (mật khẩu chung `123456`) |
| Đăng nhập | `POST /auth/login` | Public | Trả về `accessToken`, `portalTarget`, `user` |
| Giữ phiên khi F5 trang | `GET /auth/me` | Bearer JWT | Gọi khi app khởi tạo nếu còn token trong `localStorage` |
| Public View / Kiosk | `GET /public/parking-lots` | Public | Lấy sức chứa, số xe đang đỗ, chỗ trống của 5 bãi |
| Chi tiết bãi Public | `GET /public/parking-lots/{id}` | Public | Xem chi tiết 1 bãi |

### TV3 - User Portal (`ROLE_USER`)
| Màn hình | Method & Endpoint | Auth | Ghi chú |
| :--- | :--- | :---: | :--- |
| Tổng quan / Quản lý xe | `GET /vehicles/my` | `USER` | Trả về `UserVehicleDto[]` |
| Quyền đăng ký & hạn mức | `GET /vehicles/eligibility` | `USER` | Trả về số xe đang dùng hạn mức và loại xe được phép |
| Tải ảnh hồ sơ | `POST /vehicles/documents` | `USER` | Multipart; JPG/PNG, tối đa 5 MB mỗi ảnh |
| Xem ảnh hồ sơ | `GET /vehicles/documents/{id}` | `USER` / `ADMIN` | Chỉ chủ sở hữu hoặc Admin; trả binary image |
| Đăng ký phương tiện mới | `POST /vehicles` | `USER` | Trạng thái ban đầu `PENDING`; tham chiếu ảnh bằng ID upload |
| Hủy đăng ký phương tiện | `DELETE /vehicles/{id}` | `USER` | Chuyển trạng thái sang `CANCELED`; từ chối nếu xe đang trong bãi |
| Mở mã QR của xe | `GET /vehicles/{id}/qr` | `USER` | Chỉ mở được khi xe `APPROVED` |
| Gói đỗ xe | `GET /packages` | `USER` | Danh sách gói mẫu + gói đang sử dụng của user |
| Lịch sử hoạt động (tab Ra/Vào) | `GET /sessions/my-history?vehicleId=` | `USER` | `vehicleId` không bắt buộc |

### TV4 - Admin Portal (`ROLE_ADMIN`)
| Màn hình | Method & Endpoint | Auth | Ghi chú |
| :--- | :--- | :---: | :--- |
| Admin Dashboard | `GET /admin/dashboard/summary` | `ADMIN` | Tổng hợp số liệu, 5 bãi xe và `alerts` |
| Danh sách bãi đỗ | `GET /admin/parking-lots` | `ADMIN` | Cấu hình và số xe đang đỗ hiện tại |
| Chi tiết bãi đỗ | `GET /admin/parking-lots/{id}` | `ADMIN` | Xem chi tiết 1 bãi |
| Sửa sức chứa / trạng thái bãi | `PUT /admin/parking-lots/{id}` | `ADMIN` | Kiểm tra `capacity >= occupiedCount` |
| Hàng chờ & DS phương tiện | `GET /admin/vehicles?status=&keyword=` | `ADMIN` | `status`: `PENDING`, `APPROVED`, `REJECTED`, `CANCELED` |
| Chi tiết hồ sơ xe | `GET /admin/vehicles/{id}` | `ADMIN` | Trả về `AdminVehicleDto` (có `registrationDocUrl` và audit) |
| Duyệt xe | `PATCH /admin/vehicles/{id}/approve` | `ADMIN` | Đổi sang `APPROVED` và tự sinh `qrToken` |
| Từ chối xe | `PATCH /admin/vehicles/{id}/reject` | `ADMIN` | Body bắt buộc `{ "reason": "..." }` |

### TV5 - Staff Portal (`ROLE_STAFF`)
| Màn hình | Method & Endpoint | Auth | Ghi chú |
| :--- | :--- | :---: | :--- |
| Quét / nhập QR hoặc biển số | `POST /staff/qr/verify` | `STAFF` | Trả về `recommendedAction`: `CHECK_IN` / `CHECK_OUT` / `DENY` |
| Xác nhận xe VÀO | `POST /staff/sessions/check-in` | `STAFF` | Tạo session `ACTIVE` |
| Xác nhận xe RA | `POST /staff/sessions/check-out` | `STAFF` | Đóng session sang `COMPLETED` |
| Tra cứu phương tiện | `GET /staff/vehicles/search?keyword=` | `STAFF` | Hỗ trợ tìm theo biển số, MSSV, tên, mã QR |
| Xe đang gửi trong bãi | `GET /staff/sessions/active?parkingLotId=` | `STAFF` | `parkingLotId` không bắt buộc |
| Lịch sử lượt vào/ra | `GET /staff/sessions/history?parkingLotId=` | `STAFF` | `parkingLotId` không bắt buộc |

---

## 3. Chi tiết Request & Response mẫu

### 3.1. Auth

#### `POST /api/v1/auth/login` (Public)
Request:
```json
{
  "username": "sv.nguyen",
  "password": "123456"
}
```
Response `200`:
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Đăng nhập thành công",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
    "tokenType": "Bearer",
    "portalTarget": "USER_PORTAL",
    "user": {
      "id": 1,
      "username": "sv.nguyen",
      "fullName": "Nguyễn Văn An",
      "code": "2311770",
      "email": "an.nguyen2311770@hcmut.edu.vn",
      "phone": "0901234567",
      "department": "Khoa KH & KT Máy tính",
      "role": "ROLE_USER",
      "roleName": "Sinh viên / Giảng viên / Cán bộ",
      "status": "ACTIVE",
      "hasActivePackage": true,
      "activePackage": {
        "packageCode": "PKG_SEM_261",
        "packageName": "Gói Học kỳ HK261 (Sinh viên)",
        "startDate": "2026-09-01",
        "endDate": "2026-12-31",
        "status": "ACTIVE"
      },
      "registeredVehicleCount": 2,
      "maxVehicleLimit": 2
    }
  },
  "timestamp": "2026-11-16T12:00:00Z"
}
```

Tài khoản demo có sẵn (mật khẩu chung `123456`):
- `sv.nguyen`, `sv.tran`, `gv.le` -> `ROLE_USER` (`USER_PORTAL`)
- `admin` -> `ROLE_ADMIN` (`ADMIN_PORTAL`)
- `staff.gate` -> `ROLE_STAFF` (`STAFF_PORTAL`)

---

### 3.2. Public View & Admin Parking Lots

#### `GET /api/v1/public/parking-lots` (Public)
Response `200`:
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Thao tác thành công",
  "data": {
    "totalLots": 5,
    "totalCapacity": 1200,
    "totalOccupied": 2,
    "totalAvailable": 1198,
    "overallOccupancyRate": 0.2,
    "parkingLots": [
      {
        "id": 1,
        "code": "LOT_A",
        "name": "Bãi A (Cổng Lý Thường Kiệt)",
        "campus": "CS1_LTK",
        "location": "Cổng Lý Thường Kiệt - Cơ sở 1 (268 Lý Thường Kiệt, Q.10)",
        "allowedVehicleTypes": "MOTORBIKE,ELECTRIC_BIKE,BICYCLE,CAR",
        "capacity": 350,
        "occupiedCount": 1,
        "availableSlots": 349,
        "occupancyRate": 0.3,
        "status": "OPEN",
        "updatedAt": "2026-11-16T12:00:00"
      }
    ]
  },
  "timestamp": "2026-11-16T12:00:00Z"
}
```

#### `PUT /api/v1/admin/parking-lots/{id}` (`ROLE_ADMIN`)
Request (`capacity` bắt buộc, các trường còn lại tùy chọn):
```json
{
  "name": "Bãi A (Cổng Lý Thường Kiệt)",
  "location": "Cổng Lý Thường Kiệt - Cơ sở 1 (268 Lý Thường Kiệt, Q.10)",
  "capacity": 360,
  "status": "OPEN"
}
```

---

### 3.3. User Portal - Phương tiện & QR

#### `POST /api/v1/vehicles` (`ROLE_USER`)
Request:
```json
{
  "licensePlate": "59C1-777.88",
  "vehicleType": "MOTORBIKE",
  "brand": "Honda",
  "model": "Lead 125",
  "color": "Bạc",
  "registrationDocFrontId": 501,
  "registrationDocBackId": 502,
  "vehiclePhotoId": 503,
  "ownerRelationship": "SELF"
}
```
TV3 tải hai mặt giấy đăng ký bắt buộc qua `POST /vehicles/documents` trước khi gửi đăng ký. Backend vẫn nhận `registrationDocUrl` cũ để tương thích với client hiện tại. `vehicleType` hỗ trợ `MOTORBIKE`, `ELECTRIC_BIKE`, `BICYCLE`, `CAR`; `CAR` chỉ dành cho tài khoản có mã cán bộ bắt đầu bằng `CB`. `ownerRelationship` nhận `SELF` hoặc `RELATIVE`.

Response `200` (`UserVehicleDto`):
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Gửi yêu cầu đăng ký phương tiện thành công (Trạng thái: Chờ duyệt)",
  "data": {
    "id": 100,
    "licensePlate": "59C1-777.88",
    "vehicleType": "MOTORBIKE",
    "brand": "Honda",
    "model": "Lead 125",
    "color": "Bạc",
    "registrationDocUrl": "/api/v1/vehicles/documents/501",
    "registrationDocBackUrl": "/api/v1/vehicles/documents/502",
    "vehiclePhotoUrl": "/api/v1/vehicles/documents/503",
    "ownerRelationship": "SELF",
    "status": "PENDING",
    "rejectionReason": null,
    "qrToken": null,
    "currentlyParked": false,
    "currentParkingLotName": null,
    "createdAt": "2026-11-16T12:05:00"
  },
  "timestamp": "2026-11-16T12:05:00Z"
}
```

#### `GET /api/v1/vehicles/eligibility` (`ROLE_USER`)
Response `200`:
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Thao tác thành công",
  "data": {
    "maxVehicleLimit": 2,
    "registeredVehicleCount": 1,
    "pendingVehicleCount": 0,
    "approvedVehicleCount": 1,
    "canRegister": true,
    "allowedVehicleTypes": ["MOTORBIKE", "ELECTRIC_BIKE", "BICYCLE"]
  },
  "timestamp": "2026-11-16T12:05:00Z"
}
```

#### `POST /api/v1/vehicles/documents` (`ROLE_USER`)
Gửi `multipart/form-data`, không tự đặt `Content-Type` ở frontend để trình duyệt thêm boundary:

| Field | Giá trị |
| :--- | :--- |
| `purpose` | `REGISTRATION_FRONT`, `REGISTRATION_BACK` hoặc `VEHICLE_PHOTO` |
| `file` | Một ảnh JPG hoặc PNG, tối đa 5 MB |

Response `200` trả `VehicleDocumentUploadResponse`, gồm `id`, `url`, `purpose`, tên tệp, loại MIME và kích thước. Dùng `id` tương ứng trong `POST /vehicles`.

#### `GET /api/v1/vehicles/documents/{id}` (`ROLE_USER` hoặc `ROLE_ADMIN`)
Trả ảnh nhị phân. Frontend cần gửi JWT trong `Authorization` khi tải ảnh bằng `fetch`, sau đó tạo object URL để hiển thị. Người dùng chỉ đọc được ảnh của mình; Admin đọc được ảnh phục vụ duyệt hồ sơ.

#### `DELETE /api/v1/vehicles/{id}` (`ROLE_USER`)
Hủy đăng ký theo kiểu lưu trạng thái: API giữ hồ sơ và đổi status thành `CANCELED`, đồng thời thu hồi `qrToken`. Xe đang có parking session `ACTIVE` trả `409 VEHICLE_HAS_ACTIVE_SESSION`. Xe `CANCELED` có thể gọi lại an toàn.

#### `GET /api/v1/vehicles/{id}/qr` (`ROLE_USER`)
Response `200`:
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Thao tác thành công",
  "data": {
    "vehicleId": 1,
    "licensePlate": "59X3-682.45",
    "vehicleType": "MOTORBIKE",
    "ownerName": "Nguyễn Văn An",
    "ownerCode": "2311770",
    "qrToken": "BKQR-VEH1-59X368245-2026",
    "packageEligible": true,
    "currentlyInParkingLot": false,
    "currentParkingLot": null
  },
  "timestamp": "2026-11-16T12:06:00Z"
}
```

---

### 3.4. Admin Portal - Duyệt phương tiện & Dashboard

#### `PATCH /api/v1/admin/vehicles/{id}/approve` (`ROLE_ADMIN`)
Không cần body. Trả về `AdminVehicleDto` với `status: "APPROVED"`, `qrToken` mới sinh và `reviewerName`, `reviewedAt`.

#### `PATCH /api/v1/admin/vehicles/{id}/reject` (`ROLE_ADMIN`)
Request:
```json
{
  "reason": "Ảnh giấy đăng ký xe bị mờ, vui lòng chụp lại rõ biển số."
}
```

---

### 3.5. Staff Portal - Quét QR, Check-in, Check-out & Tra cứu

#### `POST /api/v1/staff/qr/verify` (`ROLE_STAFF`)
Request (gửi `qrOrPlate` hoặc `qrToken` đều được):
```json
{
  "qrOrPlate": "BKQR-VEH1-59X368245-2026"
}
```
Response `200`:
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Thao tác thành công",
  "data": {
    "valid": true,
    "recommendedAction": "CHECK_IN",
    "statusMessage": "Phương tiện và gói đỗ xe hợp lệ — Sẵn sàng xác nhận VÀO bãi",
    "vehicleId": 1,
    "licensePlate": "59X3-682.45",
    "vehicleType": "MOTORBIKE",
    "brand": "Honda",
    "model": "AirBlade 125",
    "color": "Đen Bạc",
    "vehicleStatus": "APPROVED",
    "qrToken": "BKQR-VEH1-59X368245-2026",
    "ownerName": "Nguyễn Văn An",
    "ownerCode": "2311770",
    "packageEligible": true,
    "packageName": "Gói Học kỳ HK261 (Sinh viên)",
    "validForEntry": true,
    "validForExit": false,
    "activeSession": null
  },
  "timestamp": "2026-11-16T12:10:00Z"
}
```

#### `POST /api/v1/staff/sessions/check-in` (`ROLE_STAFF`)
Request:
```json
{
  "qrOrPlate": "BKQR-VEH1-59X368245-2026",
  "parkingLotId": 1,
  "entryGate": "Cổng A1 - Làn 1",
  "note": ""
}
```

#### `POST /api/v1/staff/sessions/check-out` (`ROLE_STAFF`)
Request:
```json
{
  "qrOrPlate": "BKQR-VEH1-59X368245-2026",
  "exitGate": "Cổng A1 - Làn 2",
  "note": ""
}
```

---

## 4. Mẫu cấu hình Axios cho Frontend (copy-paste)

```ts
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```
