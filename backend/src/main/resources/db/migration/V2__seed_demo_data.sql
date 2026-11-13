-- ============================================================================
-- V2__seed_demo_data.sql
-- Seed data for Demo & Integration (Roles, Users, 5 Parking Lots, Packages, Vehicles, Sessions)
-- Password for all demo users: "123456" (stored as "{noop}123456" for Spring Security DelegatingPasswordEncoder or matched in service)
-- ============================================================================

-- 1. Roles
INSERT INTO roles (id, code, name) VALUES
(1, 'ROLE_USER', 'Sinh viên / Giảng viên / Cán bộ'),
(2, 'ROLE_ADMIN', 'Quản trị viên hệ thống bãi xe'),
(3, 'ROLE_STAFF', 'Nhân viên bảo vệ trạm kiểm soát');

-- 2. Demo Users (Password: 123456)
INSERT INTO users (id, username, password_hash, full_name, code, email, phone, department, role_id, status) VALUES
(1, 'sv.nguyen', '123456', 'Nguyễn Văn An', '2311770', 'an.nguyen2311770@hcmut.edu.vn', '0901234567', 'Khoa KH & KT Máy tính', 1, 'ACTIVE'),
(2, 'sv.tran', '123456', 'Trần Thị Bình', '2210456', 'binh.tran2210456@hcmut.edu.vn', '0902345678', 'Khoa Điện - Điện tử', 1, 'ACTIVE'),
(3, 'gv.le', '123456', 'TS. Lê Hoàng Nam', 'CB00891', 'nam.le@hcmut.edu.vn', '0903456789', 'Khoa Cơ khí', 1, 'ACTIVE'),
(4, 'admin', '123456', 'Phạm Quản Trị', 'ADM001', 'admin.parking@hcmut.edu.vn', '0908888999', 'Phòng Quản trị Thiết bị', 2, 'ACTIVE'),
(5, 'staff.gate', '123456', 'Võ Văn Bảo Vệ', 'STF001', 'staff.gate1@hcmut.edu.vn', '0907777666', 'Đội Bảo vệ Cơ sở 1', 3, 'ACTIVE');

-- 3. 5 Parking Lots (Matching Figma Admin Dashboard & Public View)
INSERT INTO parking_lots (id, code, name, campus, location, allowed_vehicle_types, capacity, status) VALUES
(1, 'LOT_A1', 'Nhà xe Khu A1 (Cổng Lý Thường Kiệt)', 'CS1_LTK', 'Cổng số 1 - 268 Lý Thường Kiệt, Q.10', 'MOTORBIKE,ELECTRIC_BIKE,BICYCLE', 200, 'OPEN'),
(2, 'LOT_B1', 'Nhà xe Sinh viên B1 (Cổng Tô Hiến Thành)', 'CS1_LTK', 'Cổng số 2 - Tô Hiến Thành, Q.10', 'MOTORBIKE,ELECTRIC_BIKE,BICYCLE', 350, 'OPEN'),
(3, 'LOT_C1', 'Bãi xe Khu C1 (Khoa học Ứng dụng)', 'CS1_LTK', 'Cổng số 3 - Bắc Hải, Q.10', 'MOTORBIKE,ELECTRIC_BIKE,BICYCLE', 150, 'OPEN'),
(4, 'LOT_B4', 'Nhà xe Cán bộ & Giảng viên B4', 'CS1_LTK', 'Khu nội bộ tòa B4 - CS1', 'MOTORBIKE,ELECTRIC_BIKE,BICYCLE', 100, 'OPEN'),
(5, 'LOT_DA_H1', 'Nhà xe Trung tâm H1 (Cơ sở Dĩ An)', 'CS2_DI_AN', 'Khu ĐHQG TP.HCM - Dĩ An, Bình Dương', 'MOTORBIKE,ELECTRIC_BIKE,BICYCLE', 400, 'OPEN');

-- 4. Parking Packages (Seed data for Package Eligibility check)
INSERT INTO parking_packages (id, code, name, description, vehicle_type, price, duration_days, is_active) VALUES
(1, 'PKG_SEM_261', 'Gói Học kỳ HK261 (Sinh viên)', 'Gửi xe không giới hạn số lượt trong suốt học kỳ 261 tại tất cả các bãi sinh viên.', 'MOTORBIKE', 180000.00, 120, TRUE),
(2, 'PKG_MONTH_STD', 'Gói Tháng Tiêu chuẩn', 'Gửi xe máy/xe điện theo tháng (30 ngày) tại CS1 và CS2.', 'MOTORBIKE', 50000.00, 30, TRUE),
(3, 'PKG_BICYCLE_SEM', 'Gói Xe đạp / Xe đạp điện Học kỳ', 'Gói ưu đãi dành cho sinh viên đi xe đạp hoặc xe đạp điện.', 'BICYCLE', 90000.00, 120, TRUE);

-- 5. User Packages (Assign active package to demo users)
INSERT INTO user_packages (id, user_id, package_id, start_date, end_date, status) VALUES
(1, 1, 1, '2026-09-01', '2026-12-31', 'ACTIVE'),
(2, 2, 1, '2026-09-01', '2026-12-31', 'ACTIVE'),
(3, 3, 2, '2026-11-01', '2026-11-30', 'ACTIVE');

-- 6. Vehicles (Approved, Pending, Rejected for full demo flow)
INSERT INTO vehicles (id, user_id, license_plate, vehicle_type, brand, model, color, registration_doc_url, status, rejection_reason, qr_token, reviewed_by, reviewed_at) VALUES
(1, 1, '59X3-682.45', 'MOTORBIKE', 'Honda', 'AirBlade 125', 'Đen Bạc', 'https://demo.bkparking.edu.vn/docs/cavet-59x3.jpg', 'APPROVED', NULL, 'BKQR-VEH1-59X368245-2026', 4, '2026-11-10 09:00:00'),
(2, 1, '59T2-119.88', 'MOTORBIKE', 'Yamaha', 'Grande', 'Trắng', 'https://demo.bkparking.edu.vn/docs/cavet-59t2.jpg', 'PENDING', NULL, NULL, NULL, NULL),
(3, 2, '60B8-451.20', 'MOTORBIKE', 'Honda', 'Vision', 'Xanh Nhám', 'https://demo.bkparking.edu.vn/docs/cavet-60b8.jpg', 'APPROVED', NULL, 'BKQR-VEH3-60B845120-2026', 4, '2026-11-10 10:30:00'),
(4, 2, '72C1-990.12', 'MOTORBIKE', 'Suzuki', 'Raider', 'Đỏ Đen', 'https://demo.bkparking.edu.vn/docs/cavet-72c1.jpg', 'REJECTED', 'Ảnh chụp giấy đăng ký xe (cà vẹt) bị mờ, không rõ số khung.', NULL, 4, '2026-11-11 14:15:00'),
(5, 3, '51A-888.99', 'ELECTRIC_BIKE', 'VinFast', 'Evo200', 'Vàng', 'https://demo.bkparking.edu.vn/docs/cavet-51a.jpg', 'APPROVED', NULL, 'BKQR-VEH5-51A88899-2026', 4, '2026-11-09 08:00:00');

-- 7. Parking Sessions (1 COMPLETED session, 2 ACTIVE sessions so occupancy is non-zero out of the box)
INSERT INTO parking_sessions (id, vehicle_id, parking_lot_id, checkin_staff_id, checkout_staff_id, entry_gate, exit_gate, checkin_time, checkout_time, status, note) VALUES
(1, 1, 1, 5, 5, 'Cổng A1 - Làn 1', 'Cổng A1 - Làn 2', '2026-11-11 07:30:00', '2026-11-11 17:05:00', 'COMPLETED', 'Lượt gửi hoàn tất bình thường'),
(2, 3, 1, 5, NULL, 'Cổng A1 - Làn 1', NULL, '2026-11-12 07:45:00', NULL, 'ACTIVE', 'Xe đang đỗ tại Nhà xe Khu A1'),
(3, 5, 4, 5, NULL, 'Cổng Nội bộ B4', NULL, '2026-11-12 08:15:00', NULL, 'ACTIVE', 'Xe giảng viên đang đỗ tại Nhà xe B4');

-- Reset identity sequences so subsequent inserts get ID >= 100
ALTER TABLE roles ALTER COLUMN id RESTART WITH 10;
ALTER TABLE users ALTER COLUMN id RESTART WITH 100;
ALTER TABLE parking_lots ALTER COLUMN id RESTART WITH 100;
ALTER TABLE parking_packages ALTER COLUMN id RESTART WITH 100;
ALTER TABLE user_packages ALTER COLUMN id RESTART WITH 100;
ALTER TABLE vehicles ALTER COLUMN id RESTART WITH 100;
ALTER TABLE parking_sessions ALTER COLUMN id RESTART WITH 100;

