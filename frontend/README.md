# Frontend - BK Parking MVP (TV3, TV4, TV5)

Thư mục này dành cho team Frontend (**TV3 - User Portal**, **TV4 - Admin Portal**, **TV5 - Staff Portal & Public View**).

- **Stack:** ReactJS + TypeScript + Tailwind CSS (Vite).
- **Kết nối Backend:** Cấu hình biến `VITE_API_BASE_URL=http://localhost:8080/api/v1`.
- **API Contract:** Xem chi tiết tại [../docs/API_CONTRACT.md](../docs/API_CONTRACT.md).

## Chạy ứng dụng

```powershell
npm.cmd install
npm.cmd run dev
```

Tạo file `.env` từ `.env.example` để cấu hình API base URL.

## Cấu trúc mã nguồn

- `src/app/`: khởi tạo ứng dụng và cấu hình route.
- `src/features/`: mã theo từng portal/feature; TV3 đặt User Portal trong `user-portal/`.
- `src/shared/`: component và tiện ích dùng chung giữa các portal.
- `src/types/api.ts`: TypeScript interfaces dùng chung, đồng bộ từ `docs/api-types.ts`.
