# 🚗 BK PARKING MANAGEMENT SYSTEM (MVP)

**Môn học:** Quản Lý Dự Án Phần Mềm (CO3011) — HK261  
**Giai đoạn phát triển:** 11/11/2026 – 23/11/2026 (MVP Freeze) | **Báo cáo:** 30/11/2026  

Đây là **Repository chung của toàn nhóm (Monorepo)** cho dự án **BK Parking MVP**, bao gồm:
- `frontend/`: Ứng dụng **ReactJS + TypeScript + Tailwind CSS** (User Portal, Admin Portal, Staff Portal, Public View).
- `backend/`: Ứng dụng **Java 21 + Spring Boot 3 (Modular Monolith)** + PostgreSQL + Spring Security JWT.
- `docs/`: Tài liệu kỹ thuật chung ([DATABASE_ERD.md](docs/DATABASE_ERD.md), [API_CONTRACT.md](docs/API_CONTRACT.md), [BK_Parking_MVP.postman_collection.json](docs/BK_Parking_MVP.postman_collection.json)).

---

## 👥 Phân công thành viên & Nhánh làm việc (Git Workflow)

> **Quy ước chung:** Không commit trực tiếp lên `main`. Mỗi thành viên tạo branch riêng từ `develop`, code xong mở Pull Request (PR) để review & merge vào `develop`.

| Thành viên | Vai trò | Phạm vi phụ trách | Branch gợi ý |
| :--- | :--- | :--- | :--- |
| **TV1** | Backend Lead | Nền tảng BE, Database/Migration, Auth JWT, Parking Lots, Dashboard, Public API | `feat/tv1-backend-platform` |
| **TV2** | Backend Dev | Đăng ký xe, Admin duyệt/từ chối, QR Token, Check-in/Check-out, Tra cứu & Lịch sử | `feat/tv2-backend-mvp` |
| **TV3** | Frontend Dev | User Portal (Dashboard, Quản lý xe, Đặt chỗ, Gói đỗ xe, Lịch sử, Thông báo) | `feat/tv3-user-portal` |
| **TV4** | Frontend Dev | Admin Portal (Dashboard, Quản lý bãi, Duyệt xe, Đặt chỗ, Đối soát/Báo cáo) | `feat/tv4-admin-portal` |
| **TV5** | Frontend Dev | Màn hình Đăng nhập chung, Staff Portal (Trạm kiểm soát, Ngoại lệ, Tra cứu) & Public View | `feat/tv5-staff-public` |

---

## 🛠️ Tech Stack đã chốt

- **Frontend:** ReactJS + TypeScript + Tailwind CSS (Vite)
- **Backend:** Java 21 + Spring Boot 3.4 + Spring Security (JWT) + Spring Data JPA + Flyway
- **Database:** PostgreSQL 16 (hoặc H2 in-memory khi chạy dev nhanh)
- **API Docs:** Swagger / OpenAPI (`http://localhost:8080/swagger-ui.html`) & Postman Collection
- **Triển khai:** Docker & Docker Compose

---

## 📚 Tài liệu dùng chung cho cả nhóm

- [Thiết kế Database & ERD (7 bảng cốt lõi)](docs/DATABASE_ERD.md)
- [API Contract & Mã lỗi chuẩn](docs/API_CONTRACT.md)
- [Postman Collection (24 requests mẫu)](docs/BK_Parking_MVP.postman_collection.json)
