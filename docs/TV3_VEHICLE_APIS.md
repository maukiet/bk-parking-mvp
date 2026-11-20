# TV3 Vehicle Management API

Tài liệu các API backend được bổ sung hoặc mở rộng cho màn hình **Quản lý phương tiện** của TV3.

- Base URL mặc định: `http://localhost:8080/api/v1`
- Các endpoint dưới đây yêu cầu `Authorization: Bearer <accessToken>`, trừ khi ghi rõ khác.
- API JSON dùng envelope `ApiResponse<T>` theo [API_CONTRACT.md](API_CONTRACT.md). Endpoint xem ảnh trả nội dung nhị phân.
- TypeScript types: [api-types.ts](api-types.ts).

## Luồng đăng ký

1. Gọi `GET /vehicles/eligibility` để lấy hạn mức và loại xe tài khoản được phép đăng ký.
2. Tải mặt trước và mặt sau cà vẹt bằng `POST /vehicles/documents`. Ảnh xe có thể tải cùng endpoint với `purpose=VEHICLE_PHOTO`.
3. Gửi các ID ảnh trong `POST /vehicles`. Xe mới ở trạng thái `PENDING`.
4. Gọi `GET /vehicles/my` để cập nhật danh sách và trạng thái đăng ký.

## Endpoint mới

### `GET /vehicles/eligibility`

Quyền: `ROLE_USER`.

Trả về hạn mức đăng ký. Chỉ xe `PENDING` và `APPROVED` chiếm hạn mức; xe `REJECTED` và `CANCELED` không chiếm.

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
  "timestamp": "2026-11-20T10:00:00"
}
```

Loại `CAR` chỉ được thêm vào `allowedVehicleTypes` khi mã tài khoản bắt đầu bằng `CB` (quy ước mã cán bộ/giảng viên đang dùng trong dữ liệu demo). Backend từ chối loại xe không được phép với `403 VEHICLE_TYPE_NOT_ALLOWED`.

### `POST /vehicles/documents`

Quyền: `ROLE_USER`. Gửi `multipart/form-data` với một tệp cho mỗi request.

| Field | Giá trị |
| :--- | :--- |
| `purpose` | `REGISTRATION_FRONT`, `REGISTRATION_BACK` hoặc `VEHICLE_PHOTO` |
| `file` | Ảnh JPG hoặc PNG, tối đa 5 MB |

Ví dụ bằng `curl`:

```bash
curl -X POST "http://localhost:8080/api/v1/vehicles/documents" \
  -H "Authorization: Bearer <accessToken>" \
  -F "purpose=REGISTRATION_FRONT" \
  -F "file=@cavet-mat-truoc.jpg"
```

Response `200`:

```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Thao tác thành công",
  "data": {
    "id": 501,
    "url": "/api/v1/vehicles/documents/501",
    "purpose": "REGISTRATION_FRONT",
    "originalFileName": "cavet-mat-truoc.jpg",
    "contentType": "image/jpeg",
    "sizeBytes": 182340
  },
  "timestamp": "2026-11-20T10:00:00"
}
```

Backend kiểm tra chữ ký JPEG/PNG, MIME type, kích thước và chủ sở hữu tệp. Tệp được lưu ngoài thư mục source; có thể cấu hình thư mục bằng biến môi trường `VEHICLE_DOCUMENTS_DIR` (mặc định `./uploads/vehicle-documents`, tính từ working directory của backend).

### `GET /vehicles/documents/{id}`

Quyền: `ROLE_USER` hoặc `ROLE_ADMIN`. Trả ảnh với `Content-Type` tương ứng. User chỉ xem được ảnh mình tải lên; Admin có thể xem ảnh để duyệt hồ sơ.

Do trình duyệt không gửi Bearer token tự động cho `<img src>`, frontend lấy ảnh bằng `fetch` kèm `Authorization`, chuyển response thành `Blob`, rồi tạo object URL để hiển thị.

### `DELETE /vehicles/{id}`

Quyền: `ROLE_USER`. Đây là hủy mềm: giữ lịch sử hồ sơ, chuyển trạng thái sang `CANCELED` và thu hồi `qrToken`. User chỉ hủy được xe của mình. Nếu xe có session `ACTIVE`, API trả `409 VEHICLE_HAS_ACTIVE_SESSION`. Gọi lại cho xe đã `CANCELED` trả về trạng thái hiện tại.

## Endpoint hiện có được mở rộng

### `GET /vehicles/my`

Response `UserVehicleDto` bổ sung:

| Field | Ý nghĩa |
| :--- | :--- |
| `registrationDocUrl` | Ảnh mặt trước cà vẹt; tên field giữ tương thích API cũ |
| `registrationDocBackUrl` | Ảnh mặt sau cà vẹt |
| `vehiclePhotoUrl` | Ảnh thực tế của xe, có thể `null` |
| `ownerRelationship` | `SELF` hoặc `RELATIVE` |

Các URL ảnh là endpoint có bảo vệ JWT, không phải URL public.

### `POST /vehicles`

Request tiếp tục nhận các field cũ (`licensePlate`, `vehicleType`, `brand`, `model`, `color`, `registrationDocUrl`) và bổ sung:

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

TV3 yêu cầu người dùng tải đủ hai mặt cà vẹt trước khi gửi form. Khi có ID ảnh, backend kiểm tra ảnh thuộc user hiện tại và đúng `purpose`, rồi lưu URL có bảo vệ vào hồ sơ xe. `vehiclePhotoId` là tùy chọn. Các client cũ vẫn có thể dùng `registrationDocUrl`.

Loại xe được hỗ trợ: `MOTORBIKE`, `ELECTRIC_BIKE`, `BICYCLE`, `CAR`. Quan hệ chủ xe: `SELF`, `RELATIVE`. Xe mới được tạo ở `PENDING`.

## Mã lỗi bổ sung

| HTTP | Code | Khi nào |
| :---: | :--- | :--- |
| `403` | `VEHICLE_TYPE_NOT_ALLOWED` | Tài khoản không đủ điều kiện đăng ký ô tô |
| `409` | `VEHICLE_HAS_ACTIVE_SESSION` | Xe đang gửi trong bãi nên không thể hủy |
| `400` | `INVALID_VEHICLE_DOCUMENT` | Thiếu/sai loại ảnh hoặc ảnh không thuộc user |
| `413` | `DOCUMENT_TOO_LARGE` | Ảnh lớn hơn 5 MB |
| `415` | `UNSUPPORTED_DOCUMENT_TYPE` | Tệp không phải JPG/PNG hợp lệ |
| `500` | `DOCUMENT_STORAGE_FAILED` | Backend không ghi được ảnh vào kho lưu trữ |
