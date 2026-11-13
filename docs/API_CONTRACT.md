# 📜 BK PARKING MVP - BẢN ĐẶC TẢ GIAO TIẾP API (API CONTRACT)

> **Tài liệu chuẩn hóa giao diện RESTful API - Dự án BK Parking MVP (CO3011)**  
> **Người công bố:** TV1 (Backend Lead / Nền tảng chung)  
> **Người tiếp nhận & triển khai Backend:** TV2 (Backend Developer / Nghiệp vụ MVP)  
> **Người tiếp nhận & tích hợp Frontend:**  
> - TV3: Frontend Developer (User Portal)  
> - TV4: Frontend Developer (Admin Portal)  
> - TV5: Frontend Developer (Staff Portal & Public View)  
> **Thời gian hiệu lực:** Kể từ ngày 12/11/2026 (Chốt phiên bản freeze: 23/11/2026)  

---

## 1. QUY ƯỚC CHUNG (GENERAL CONVENTIONS)

### 1.1. Base URL & Giao thức
- **Local Dev Server:** `http://localhost:8080/api/v1`
- **Docker Compose Network:** `http://backend:8080/api/v1`
- **Định dạng dữ liệu:** `application/json; charset=UTF-8`
- **Thời gian (Timestamp):** Chuẩn ISO-8601 UTC dạng chuỗi `YYYY-MM-DDTHH:mm:ss'Z'` (hoặc có offset `+07:00`).

### 1.2. Cơ chế xác thực (Authentication Header)
Tất cả các API được bảo vệ (ngoại trừ nhóm Public View và Login) đều bắt buộc gửi kèm JWT Token trong HTTP Request Header:
```http
Authorization: Bearer <accessToken>
```

---

## 2. CẤU TRÚC PHẢN HỒI CHUẨN (`ApiResponse<T>`)

Mọi phản hồi từ Backend (dù thành công hay phát sinh ngoại lệ) **BẮT BUỘC** đóng gói trong phong bì JSON đồng nhất 5 thuộc tính:

### 2.1. Phản hồi thành công (HTTP Status 200, 201)
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Thao tác thành công",
  "data": { ... },
  "timestamp": "2026-11-12T15:30:00Z"
}
```

### 2.2. Phản hồi lỗi nghiệp vụ hoặc hệ thống (HTTP Status 400, 401, 403, 404, 409, 500)
```json
{
  "success": false,
  "code": "VEHICLE_LIMIT_EXCEEDED",
  "message": "Mỗi tài khoản chỉ được phép sở hữu tối đa 2 phương tiện đang chờ duyệt hoặc đã duyệt hợp lệ",
  "data": null,
  "timestamp": "2026-11-12T15:30:00Z"
}
```

---

## 3. BẢNG MÃ LỖI CHUẨN TOÀN HỆ THỐNG (ERROR CODES SPECIFICATION)

Để Frontend (TV3, TV4, TV5) hiển thị thông báo lỗi thân thiện (Toast, Modal, Inline Banner) mà không phụ thuộc vào chuỗi ký tự message, Backend cam kết sử dụng danh mục mã lỗi sau:

| HTTP Status | Mã lỗi hệ thống (`code`) | Mô tả chi tiết & Tình huống xảy ra | Hành động gợi ý cho Frontend |
| :--- | :--- | :--- | :--- |
| **401** | `UNAUTHORIZED` | Token bị thiếu, hết hạn, hoặc chữ ký JWT không hợp lệ. | Xóa token tại LocalStorage và redirect về trang Đăng nhập. |
| **403** | `FORBIDDEN` | Tài khoản không có vai trò phù hợp (VD: User gọi API Admin). | Hiển thị thông báo "Bạn không có quyền thực hiện thao tác này". |
| **404** | `RESOURCE_NOT_FOUND` | Không tìm thấy bãi xe, phương tiện hoặc phiên đỗ theo ID yêu cầu. | Hiển thị màn hình 404 hoặc thông báo bản ghi không tồn tại. |
| **409** | `DUPLICATE_LICENSE_PLATE` | Biển số xe đăng ký đã tồn tại trong hệ thống (bảng `vehicles`). | Báo đỏ tại trường nhập biển số: "Biển số xe này đã được đăng ký". |
| **400** | `VEHICLE_LIMIT_EXCEEDED` | Người dùng đã có $\ge 2$ xe ở trạng thái `PENDING` hoặc `APPROVED`. | Hiển thị Modal: "Đã đạt giới hạn tối đa 2 xe/tài khoản". |
| **400** | `VEHICLE_NOT_APPROVED` | Xe chưa được Admin phê duyệt (đang `PENDING` hoặc bị `REJECTED`). | Chặn cấp mã QR hoặc bảo vệ từ chối cho xe vào bãi. |
| **400** | `PACKAGE_INELIGIBLE` | Người dùng chưa có gói đỗ xe còn hạn hoặc xe không đúng loại với gói. | Hiển thị cảnh báo chưa có gói gửi xe hợp lệ. |
| **409** | `SESSION_ALREADY_ACTIVE` | Xe đã có 1 phiên đỗ đang mở (`ACTIVE`). Chống quét trùng lượt vào. | Bảo vệ nhận cảnh báo: "Xe này đang trong bãi, không thể check-in lại". |
| **400** | `NO_ACTIVE_SESSION` | Không tìm thấy phiên đang mở khi thực hiện Check-out xe ra khỏi bãi. | Bảo vệ nhận cảnh báo: "Xe chưa có lượt vào hợp lệ trong hệ thống". |
| **409** | `PARKING_LOT_FULL` | Bãi đỗ xe đã đạt sức chứa tối đa (`occupiedCount >= capacity`). | Cảnh báo: "Bãi đỗ đã hết chỗ trống, vui lòng chuyển bãi khác". |
| **400** | `CAPACITY_BELOW_OCCUPIED` | Admin sửa sức chứa của bãi nhỏ hơn số xe thực tế đang đỗ. | Báo đỏ form sửa: "Sức chứa mới không thể nhỏ hơn số xe đang đỗ". |
| **400** | `VALIDATION_FAILED` | Dữ liệu đầu vào sai định dạng (thiếu trường, sai regex, số âm...). | Hiển thị lỗi tương ứng dưới từng input của form. |

---

## 4. CHI TIẾT CÁC ENDPOINT THEO PHÂN HỆ

---

### PHÂN HỆ 1: XÁC THỰC & TÀI KHOẢN DEMO (AUTH)

#### 1. `POST /api/v1/auth/login` - Đăng nhập tài khoản
Dùng cho màn hình đăng nhập chung (PDF tr.1–3). Cung cấp token JWT và thông tin phân quyền.

- **Yêu cầu (Request Body):**
```json
{
  "username": "sinhvien01",
  "password": "password"
}
```

- **Phản hồi thành công (200 OK):**
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Đăng nhập thành công",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJzaW5odmllbjAxIiwicm9sZSI6IlJPTEVfVVNFUiJ9...",
    "tokenType": "Bearer",
    "expiresIn": 86400,
    "user": {
      "id": 1,
      "username": "sinhvien01",
      "fullName": "Nguyễn Văn An",
      "email": "user01@hcmut.edu.vn",
      "phoneNumber": "0901234567",
      "studentOrStaffId": "2311770",
      "role": "ROLE_USER"
    }
  },
  "timestamp": "2026-11-12T15:30:00Z"
}
```

---

#### 2. `GET /api/v1/auth/me` - Lấy thông tin tài khoản đang đăng nhập
Dùng để khôi phục trạng thái session sau khi người dùng F5 tải lại trang.

- **Headers:** `Authorization: Bearer <accessToken>`
- **Phản hồi thành công (200 OK):**
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Lấy thông tin người dùng thành công",
  "data": {
    "id": 1,
    "username": "sinhvien01",
    "fullName": "Nguyễn Văn An",
    "email": "user01@hcmut.edu.vn",
    "phoneNumber": "0901234567",
    "studentOrStaffId": "2311770",
    "role": "ROLE_USER",
    "activePackage": {
      "id": 1,
      "packageCode": "PKG_MONTHLY_STU",
      "packageName": "Gói Sinh Viên Tháng",
      "startDate": "2026-11-01",
      "endDate": "2026-11-30",
      "status": "ACTIVE"
    }
  },
  "timestamp": "2026-11-12T15:30:00Z"
}
```

---

#### 3. `GET /api/v1/auth/demo-accounts` - Danh sách tài khoản mẫu Demo
Dùng cho nút "Chọn tài khoản Demo nhanh" trên giao diện Login. Không yêu cầu xác thực.

- **Phản hồi thành công (200 OK):**
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Danh sách tài khoản demo",
  "data": [
    {
      "username": "sinhvien01",
      "fullName": "Nguyễn Văn An (SV)",
      "role": "ROLE_USER",
      "description": "Người dùng sinh viên có gói tháng và 1 xe AirBlade"
    },
    {
      "username": "admin01",
      "fullName": "Nguyễn Quản Trị",
      "role": "ROLE_ADMIN",
      "description": "Quản trị viên quản lý bãi và duyệt phương tiện"
    },
    {
      "username": "baove01",
      "fullName": "Lê Bảo Vệ (Chốt Cổng H6)",
      "role": "ROLE_STAFF",
      "description": "Nhân viên kiểm soát trạm quét QR vào/ra"
    }
  ],
  "timestamp": "2026-11-12T15:30:00Z"
}
```

---

### PHÂN HỆ 2: TRA CỨU CÔNG KHAI (PUBLIC VIEW)
Không yêu cầu đăng nhập. Dùng cho Kiosk điện tử và trang Public View (PDF tr.41).

#### 1. `GET /api/v1/public/parking-lots` - Danh sách bãi và tình trạng chỗ trống
- **Phản hồi thành công (200 OK):**
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Lấy danh sách bãi xe công khai thành công",
  "data": [
    {
      "id": 1,
      "code": "LOT_A",
      "name": "Bãi xe A - Tòa H6 (Cơ sở Dĩ An)",
      "location": "Khuôn viên Tòa H6",
      "capacity": 150,
      "occupiedCount": 42,
      "availableCount": 108,
      "occupancyRate": 28.0,
      "status": "ACTIVE",
      "updatedAt": "2026-11-12T15:25:00Z"
    },
    {
      "id": 2,
      "code": "LOT_B",
      "name": "Bãi xe B - Ký túc xá Khu B",
      "location": "Cổng KTX Khu B",
      "capacity": 200,
      "occupiedCount": 185,
      "availableCount": 15,
      "occupancyRate": 92.5,
      "status": "ACTIVE",
      "updatedAt": "2026-11-12T15:28:00Z"
    }
  ],
  "timestamp": "2026-11-12T15:30:00Z"
}
```

---

#### 2. `GET /api/v1/public/parking-lots/{id}` - Chi tiết bãi xe thời gian thực
- **Phản hồi thành công (200 OK):**
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Lấy thông tin chi tiết bãi xe thành công",
  "data": {
    "id": 1,
    "code": "LOT_A",
    "name": "Bãi xe A - Tòa H6 (Cơ sở Dĩ An)",
    "location": "Khuôn viên Tòa H6",
    "capacity": 150,
    "occupiedCount": 42,
    "availableCount": 108,
    "occupancyRate": 28.0,
    "status": "ACTIVE"
  },
  "timestamp": "2026-11-12T15:30:00Z"
}
```

---

### PHÂN HỆ 3: CỔNG NGƯỜI DÙNG (USER PORTAL)
Quyền yêu cầu: `ROLE_USER`.

#### 1. `GET /api/v1/vehicles/my` - Danh sách phương tiện của tôi
Phục vụ màn hình Quản lý phương tiện (PDF tr.3–5).

- **Phản hồi thành công (200 OK):**
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Lấy danh sách xe thành công",
  "data": [
    {
      "id": 1,
      "licensePlate": "59X3-12345",
      "vehicleType": "MOTORBIKE",
      "brand": "Honda",
      "model": "AirBlade 125",
      "color": "Đen - Xám",
      "registrationCertificateUrl": "https://cdn.bkparking.vn/cavet/59X312345.jpg",
      "status": "APPROVED",
      "rejectionReason": null,
      "approvedAt": "2026-11-10T10:00:00Z",
      "createdAt": "2026-11-09T08:30:00Z"
    }
  ],
  "timestamp": "2026-11-12T15:30:00Z"
}
```

---

#### 2. `POST /api/v1/vehicles` - Đăng ký phương tiện mới
- **Yêu cầu (Request Body):**
```json
{
  "licensePlate": "51H-98234",
  "vehicleType": "MOTORBIKE",
  "brand": "Yamaha",
  "model": "Exciter 155",
  "color": "Xanh GP",
  "registrationCertificateUrl": "https://cdn.bkparking.vn/cavet/51H98234.jpg"
}
```

- **Phản hồi thành công (201 Created):**
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Đăng ký phương tiện thành công, hồ sơ đang chờ Admin phê duyệt",
  "data": {
    "id": 2,
    "licensePlate": "51H-98234",
    "vehicleType": "MOTORBIKE",
    "brand": "Yamaha",
    "model": "Exciter 155",
    "color": "Xanh GP",
    "status": "PENDING",
    "createdAt": "2026-11-12T15:32:00Z"
  },
  "timestamp": "2026-11-12T15:32:00Z"
}
```

- **Phản hồi lỗi nếu trùng biển số (409 Conflict):**
```json
{
  "success": false,
  "code": "DUPLICATE_LICENSE_PLATE",
  "message": "Biển kiểm soát 51H-98234 đã được đăng ký trên hệ thống",
  "data": null,
  "timestamp": "2026-11-12T15:32:00Z"
}
```

- **Phản hồi lỗi nếu vượt giới hạn 2 xe (400 Bad Request):**
```json
{
  "success": false,
  "code": "VEHICLE_LIMIT_EXCEEDED",
  "message": "Mỗi tài khoản chỉ được phép sở hữu tối đa 2 phương tiện đang chờ duyệt hoặc đã duyệt hợp lệ",
  "data": null,
  "timestamp": "2026-11-12T15:32:00Z"
}
```

---

#### 3. `GET /api/v1/vehicles/{id}/qr` - Mở mã QR điện tử gửi xe
Phục vụ màn hình User Dashboard & Thẻ QR điện tử (PDF tr.3). Chỉ áp dụng cho xe có `status = 'APPROVED'`.

- **Phản hồi thành công (200 OK):**
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Tạo mã QR thành công",
  "data": {
    "vehicleId": 1,
    "licensePlate": "59X3-12345",
    "qrToken": "BKP-QR-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ2ZWhpY2xlSWQiOjEsInBsYXRlIjoiNTlYMy0xMjM0NSIsImV4cCI6MTY5OTgwMDAwMH0...",
    "qrPayload": "{\"vehicleId\":1,\"licensePlate\":\"59X3-12345\",\"userId\":1,\"issuedAt\":\"2026-11-12T15:30:00Z\"}",
    "expiresAt": "2026-11-12T16:00:00Z"
  },
  "timestamp": "2026-11-12T15:30:00Z"
}
```

- **Lỗi nếu xe chưa được duyệt (400 Bad Request):**
```json
{
  "success": false,
  "code": "VEHICLE_NOT_APPROVED",
  "message": "Phương tiện đang chờ kiểm duyệt, chưa thể phát hành mã QR vào bãi",
  "data": null,
  "timestamp": "2026-11-12T15:30:00Z"
}
```

---

#### 4. `GET /api/v1/packages` - Xem danh sách gói gửi xe mẫu
Phục vụ màn hình Đăng ký gói đỗ xe (PDF tr.9–12).

- **Phản hồi thành công (200 OK):**
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Danh sách gói cước gửi xe",
  "data": [
    {
      "id": 1,
      "code": "PKG_MONTHLY_STU",
      "name": "Gói Sinh Viên Tháng (Xe máy)",
      "description": "Gửi không giới hạn lượt vào/ra trong tháng tại mọi bãi cơ sở Dĩ An",
      "price": 50000.0,
      "durationDays": 30,
      "vehicleType": "MOTORBIKE"
    },
    {
      "id": 2,
      "code": "PKG_SEMESTER_STU",
      "name": "Gói Sinh Viên Học Kỳ (Xe máy)",
      "description": "Gói trọn gói kỳ học 4.5 tháng, ưu tiên vị trí đỗ",
      "price": 200000.0,
      "durationDays": 135,
      "vehicleType": "MOTORBIKE"
    }
  ],
  "timestamp": "2026-11-12T15:30:00Z"
}
```

---

#### 5. `GET /api/v1/sessions/my-history` - Xem lịch sử gửi xe cá nhân
Phục vụ màn hình Lịch sử hoạt động (PDF tr.12–15). Hỗ trợ lọc theo xe.

- **Query Parameters:** `?vehicleId=1&page=0&size=10`
- **Phản hồi thành công (200 OK):**
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Lấy lịch sử gửi xe thành công",
  "data": {
    "content": [
      {
        "id": 105,
        "sessionCode": "SS-20261112-9A4B12",
        "licensePlate": "59X3-12345",
        "parkingLotName": "Bãi xe A - Tòa H6 (Cơ sở Dĩ An)",
        "checkInTime": "2026-11-12T07:45:00Z",
        "checkInGate": "GATE_A_IN_01",
        "checkOutTime": "2026-11-12T11:30:00Z",
        "checkOutGate": "GATE_A_OUT_01",
        "durationMinutes": 225,
        "status": "COMPLETED"
      }
    ],
    "pageNumber": 0,
    "pageSize": 10,
    "totalElements": 1,
    "totalPages": 1
  },
  "timestamp": "2026-11-12T15:30:00Z"
}
```

---

### PHÂN HỆ 4: CỔNG QUẢN TRỊ VIÊN (ADMIN PORTAL)
Quyền yêu cầu: `ROLE_ADMIN`.

#### 1. `GET /api/v1/admin/dashboard/summary` - Thống kê KPI tổng quan
Phục vụ Admin Dashboard (PDF tr.38–40).

- **Phản hồi thành công (200 OK):**
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Lấy dữ liệu tổng quan bãi xe thành công",
  "data": {
    "totalLots": 5,
    "totalCapacity": 650,
    "totalOccupied": 242,
    "totalAvailable": 408,
    "overallOccupancyRate": 37.23,
    "pendingVehiclesCount": 3,
    "activeSessionsToday": 242
  },
  "timestamp": "2026-11-12T15:30:00Z"
}
```

---

#### 2. `GET /api/v1/admin/parking-lots` - Quản lý danh sách các bãi xe
Phục vụ màn hình Quản lý Bãi đỗ (PDF tr.40).

- **Phản hồi thành công (200 OK):**
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Lấy danh sách bãi xe quản trị thành công",
  "data": [
    {
      "id": 1,
      "code": "LOT_A",
      "name": "Bãi xe A - Tòa H6 (Cơ sở Dĩ An)",
      "location": "Khuôn viên Tòa H6",
      "capacity": 150,
      "occupiedCount": 42,
      "availableCount": 108,
      "status": "ACTIVE"
    }
  ],
  "timestamp": "2026-11-12T15:30:00Z"
}
```

---

#### 3. `PUT /api/v1/admin/parking-lots/{id}` - Cập nhật thông tin / sức chứa bãi
Áp dụng **Nguyên tắc 3**: `capacity >= occupiedCount`.

- **Yêu cầu (Request Body):**
```json
{
  "name": "Bãi xe A - Tòa H6 Mở rộng",
  "capacity": 180,
  "status": "ACTIVE"
}
```

- **Phản hồi thành công (200 OK):**
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Cập nhật bãi xe thành công",
  "data": {
    "id": 1,
    "code": "LOT_A",
    "name": "Bãi xe A - Tòa H6 Mở rộng",
    "capacity": 180,
    "occupiedCount": 42,
    "availableCount": 138,
    "status": "ACTIVE"
  },
  "timestamp": "2026-11-12T15:30:00Z"
}
```

- **Lỗi vi phạm sức chứa (400 Bad Request):**
```json
{
  "success": false,
  "code": "CAPACITY_BELOW_OCCUPIED",
  "message": "Sức chứa mới (30) không được nhỏ hơn số lượng xe đang đỗ thực tế trong bãi (42)",
  "data": null,
  "timestamp": "2026-11-12T15:30:00Z"
}
```

---

#### 4. `GET /api/v1/admin/vehicles` - Xem hàng chờ & danh sách phương tiện
Phục vụ màn Duyệt & Quản lý Phương tiện (PDF tr.40–41).

- **Query Parameters:** `?status=PENDING` (hoặc `APPROVED`, `REJECTED`, để trống là lấy tất cả)
- **Phản hồi thành công (200 OK):**
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Lấy danh sách xe kiểm duyệt thành công",
  "data": [
    {
      "id": 2,
      "licensePlate": "51H-98234",
      "vehicleType": "MOTORBIKE",
      "brand": "Yamaha",
      "model": "Exciter 155",
      "color": "Xanh GP",
      "registrationCertificateUrl": "https://cdn.bkparking.vn/cavet/51H98234.jpg",
      "status": "PENDING",
      "owner": {
        "id": 1,
        "fullName": "Nguyễn Văn An",
        "studentOrStaffId": "2311770",
        "email": "user01@hcmut.edu.vn"
      },
      "createdAt": "2026-11-12T15:32:00Z"
    }
  ],
  "timestamp": "2026-11-12T15:33:00Z"
}
```

---

#### 5. `PATCH /api/v1/admin/vehicles/{id}/approve` - Phê duyệt phương tiện
- **Phản hồi thành công (200 OK):**
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Phê duyệt phương tiện 51H-98234 thành công",
  "data": {
    "id": 2,
    "licensePlate": "51H-98234",
    "status": "APPROVED",
    "approvedBy": "admin01",
    "approvedAt": "2026-11-12T15:35:00Z"
  },
  "timestamp": "2026-11-12T15:35:00Z"
}
```

---

#### 6. `PATCH /api/v1/admin/vehicles/{id}/reject` - Từ chối phương tiện
- **Yêu cầu (Request Body):**
```json
{
  "reason": "Ảnh chụp giấy đăng ký xe bị mờ, không khớp số khung"
}
```

- **Phản hồi thành công (200 OK):**
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Đã từ chối đơn đăng ký phương tiện 51H-98234",
  "data": {
    "id": 2,
    "licensePlate": "51H-98234",
    "status": "REJECTED",
    "rejectionReason": "Ảnh chụp giấy đăng ký xe bị mờ, không khớp số khung",
    "rejectedBy": "admin01",
    "rejectedAt": "2026-11-12T15:35:00Z"
  },
  "timestamp": "2026-11-12T15:35:00Z"
}
```

---

### PHÂN HỆ 5: TRẠM KIỂM SOÁT BẢO VỆ (STAFF PORTAL)
Quyền yêu cầu: `ROLE_STAFF` (hoặc `ROLE_ADMIN`).

#### 1. `POST /api/v1/staff/qr/verify` - Quét / Xác thực mã QR xe đến cổng
Phục vụ màn hình Trạm kiểm soát (PDF tr.21–27). Nhận mã `qrToken` hoặc `licensePlate`.

- **Yêu cầu (Request Body):**
```json
{
  "qrToken": "BKP-QR-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "parkingLotId": 1
}
```

- **Phản hồi thành công (200 OK):**
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Mã QR hợp lệ, đủ điều kiện vào bãi",
  "data": {
    "valid": true,
    "vehicle": {
      "id": 1,
      "licensePlate": "59X3-12345",
      "vehicleType": "MOTORBIKE",
      "brand": "Honda",
      "model": "AirBlade 125",
      "color": "Đen - Xám",
      "status": "APPROVED",
      "owner": {
        "id": 1,
        "fullName": "Nguyễn Văn An",
        "studentOrStaffId": "2311770",
        "email": "user01@hcmut.edu.vn",
        "phoneNumber": "0901234567"
      }
    },
    "package": {
      "hasActivePackage": true,
      "packageCode": "PKG_MONTHLY_STU",
      "packageName": "Gói Sinh Viên Tháng",
      "endDate": "2026-11-30"
    },
    "currentSession": null,
    "canCheckIn": true,
    "canCheckOut": false,
    "statusMessage": "Sẵn sàng ghi nhận vào bãi"
  },
  "timestamp": "2026-11-12T15:36:00Z"
}
```

- **Phản hồi khi xe đang trong bãi (chuẩn bị Check-out):**
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Phương tiện đang có phiên đỗ trong bãi",
  "data": {
    "valid": true,
    "vehicle": {
      "id": 1,
      "licensePlate": "59X3-12345",
      "status": "APPROVED"
    },
    "currentSession": {
      "id": 105,
      "sessionCode": "SS-20261112-9A4B12",
      "parkingLotId": 1,
      "parkingLotName": "Bãi xe A - Tòa H6",
      "checkInTime": "2026-11-12T07:45:00Z",
      "checkInGate": "GATE_A_IN_01",
      "durationMinutes": 210
    },
    "canCheckIn": false,
    "canCheckOut": true,
    "statusMessage": "Sẵn sàng ghi nhận xe ra bãi"
  },
  "timestamp": "2026-11-12T15:36:00Z"
}
```

---

#### 2. `POST /api/v1/staff/sessions/check-in` - Ghi nhận lượt XE VÀO
Thực hiện trong Transaction. Kiểm tra bãi đầy, xe được duyệt và chống tạo 2 session mở.

- **Yêu cầu (Request Body):**
```json
{
  "vehicleId": 1,
  "parkingLotId": 1,
  "gate": "GATE_A_IN_01",
  "notes": "Xe sinh viên đi học buổi chiều"
}
```

- **Phản hồi thành công (201 Created):**
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Ghi nhận xe vào bãi thành công. Mời xe vào vị trí đỗ.",
  "data": {
    "sessionId": 106,
    "sessionCode": "SS-20261112-C81B90",
    "vehicleId": 1,
    "licensePlate": "59X3-12345",
    "parkingLotId": 1,
    "parkingLotName": "Bãi xe A - Tòa H6 (Cơ sở Dĩ An)",
    "checkInTime": "2026-11-12T15:37:00Z",
    "checkInGate": "GATE_A_IN_01",
    "checkInStaff": "Lê Bảo Vệ",
    "status": "ACTIVE"
  },
  "timestamp": "2026-11-12T15:37:00Z"
}
```

- **Lỗi quét trùng (Xe đã ở trong bãi) (409 Conflict):**
```json
{
  "success": false,
  "code": "SESSION_ALREADY_ACTIVE",
  "message": "Phương tiện 59X3-12345 hiện đang có 1 phiên đỗ chưa đóng tại Bãi xe A",
  "data": null,
  "timestamp": "2026-11-12T15:37:00Z"
}
```

- **Lỗi bãi đã đầy (409 Conflict):**
```json
{
  "success": false,
  "code": "PARKING_LOT_FULL",
  "message": "Bãi xe A - Tòa H6 đã đầy (150/150 chỗ). Vui lòng hướng dẫn xe sang Bãi xe B.",
  "data": null,
  "timestamp": "2026-11-12T15:37:00Z"
}
```

---

#### 3. `POST /api/v1/staff/sessions/check-out` - Ghi nhận lượt XE RA
Đóng phiên đỗ `status = 'COMPLETED'`, cập nhật thời gian ra và giải phóng chỗ trống tức thì.

- **Yêu cầu (Request Body):**
```json
{
  "vehicleId": 1,
  "gate": "GATE_A_OUT_01",
  "notes": "Xe ra an toàn"
}
```

- **Phản hồi thành công (200 OK):**
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Ghi nhận xe rời bãi thành công. Chỗ đỗ đã được giải phóng.",
  "data": {
    "sessionId": 106,
    "sessionCode": "SS-20261112-C81B90",
    "vehicleId": 1,
    "licensePlate": "59X3-12345",
    "parkingLotId": 1,
    "parkingLotName": "Bãi xe A - Tòa H6 (Cơ sở Dĩ An)",
    "checkInTime": "2026-11-12T15:37:00Z",
    "checkOutTime": "2026-11-12T17:15:00Z",
    "durationMinutes": 98,
    "checkOutGate": "GATE_A_OUT_01",
    "checkOutStaff": "Lê Bảo Vệ",
    "status": "COMPLETED"
  },
  "timestamp": "2026-11-12T17:15:00Z"
}
```

- **Lỗi không có phiên vào (400 Bad Request):**
```json
{
  "success": false,
  "code": "NO_ACTIVE_SESSION",
  "message": "Không tìm thấy phiên gửi xe đang mở cho phương tiện này",
  "data": null,
  "timestamp": "2026-11-12T17:15:00Z"
}
```

---

#### 4. `GET /api/v1/staff/vehicles/search` - Tra cứu thông tin phương tiện
Phục vụ màn hình Tra cứu phương tiện (PDF tr.33–38). Tìm theo Biển số, MSSV hoặc Họ tên chủ xe.

- **Query Parameters:** `?query=59X3-12345`
- **Phản hồi thành công (200 OK):**
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Kết quả tra cứu phương tiện",
  "data": [
    {
      "vehicleId": 1,
      "licensePlate": "59X3-12345",
      "vehicleType": "MOTORBIKE",
      "brand": "Honda",
      "model": "AirBlade 125",
      "color": "Đen - Xám",
      "status": "APPROVED",
      "ownerName": "Nguyễn Văn An",
      "studentOrStaffId": "2311770",
      "phoneNumber": "0901234567",
      "isCurrentlyParked": true,
      "currentParkingLot": "Bãi xe A - Tòa H6"
    }
  ],
  "timestamp": "2026-11-12T15:38:00Z"
}
```

---

#### 5. `GET /api/v1/staff/sessions/active` - Danh sách xe đang gửi trong bãi
Dùng để bảo vệ đối soát số lượng xe thực tế trong ca trực.

- **Query Parameters:** `?parkingLotId=1&page=0&size=20`
- **Phản hồi thành công (200 OK):**
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Danh sách xe đang đỗ tại bãi",
  "data": {
    "parkingLotId": 1,
    "parkingLotName": "Bãi xe A - Tòa H6",
    "totalActive": 42,
    "content": [
      {
        "sessionId": 106,
        "sessionCode": "SS-20261112-C81B90",
        "vehicleId": 1,
        "licensePlate": "59X3-12345",
        "checkInTime": "2026-11-12T15:37:00Z",
        "checkInGate": "GATE_A_IN_01",
        "checkInStaff": "Lê Bảo Vệ"
      }
    ]
  },
  "timestamp": "2026-11-12T15:38:00Z"
}
```

---

#### 6. `GET /api/v1/staff/sessions/history` - Lịch sử lượt vào/ra gần nhất tại chốt
Phục vụ bảng "Lượt quét gần nhất" và "Tổng kết ca" của trạm bảo vệ.

- **Query Parameters:** `?parkingLotId=1&limit=10`
- **Phản hồi thành công (200 OK):**
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Lịch sử ca trực gần nhất",
  "data": [
    {
      "sessionId": 106,
      "sessionCode": "SS-20261112-C81B90",
      "licensePlate": "59X3-12345",
      "action": "CHECK_IN",
      "timestamp": "2026-11-12T15:37:00Z",
      "gate": "GATE_A_IN_01",
      "staffName": "Lê Bảo Vệ"
    }
  ],
  "timestamp": "2026-11-12T15:38:00Z"
}
```

---

*Tài liệu này là hợp đồng giao tiếp chính thức giữa Backend (TV1, TV2) và Frontend (TV3, TV4, TV5). Mọi điều chỉnh về payload hoặc mã lỗi bắt buộc phải có thông báo và cập nhật tại tài liệu này.*
