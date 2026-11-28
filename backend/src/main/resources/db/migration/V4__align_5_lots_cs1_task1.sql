-- ============================================================================
-- V4__align_5_lots_cs1_task1.sql
-- Align 5 seeded parking lots with Task 1 Phase 1 scope:
-- 5 lots (A-E) at Campus 1 (268 Ly Thuong Kiet, Q.10); exclude Campus 2 (Di An).
-- Keep total MVP demo capacity = 1200 slots and 2 initial ACTIVE sessions.
-- ============================================================================

UPDATE parking_lots
SET code = 'LOT_A',
    name = 'Bãi A (Cổng Lý Thường Kiệt)',
    campus = 'CS1_LTK',
    location = 'Cổng Lý Thường Kiệt - Cơ sở 1 (268 Lý Thường Kiệt, Q.10)',
    allowed_vehicle_types = 'MOTORBIKE,ELECTRIC_BIKE,BICYCLE,CAR',
    capacity = 350
WHERE id = 1;

UPDATE parking_lots
SET code = 'LOT_B',
    name = 'Bãi B (Khu vực nhà A1-A5)',
    campus = 'CS1_LTK',
    location = 'Khu vực nhà A1-A5 - Cơ sở 1 (268 Lý Thường Kiệt, Q.10)',
    allowed_vehicle_types = 'MOTORBIKE,ELECTRIC_BIKE,BICYCLE',
    capacity = 250
WHERE id = 2;

UPDATE parking_lots
SET code = 'LOT_C',
    name = 'Bãi C (Khu vực nhà B1-B4)',
    campus = 'CS1_LTK',
    location = 'Khu vực nhà B1-B4 - Cơ sở 1 (268 Lý Thường Kiệt, Q.10)',
    allowed_vehicle_types = 'MOTORBIKE,ELECTRIC_BIKE,BICYCLE,CAR',
    capacity = 250
WHERE id = 3;

UPDATE parking_lots
SET code = 'LOT_D',
    name = 'Bãi D (Khu vực Ký túc xá nội trú)',
    campus = 'CS1_LTK',
    location = 'Khu vực Ký túc xá nội trú - Cơ sở 1 (268 Lý Thường Kiệt, Q.10)',
    allowed_vehicle_types = 'MOTORBIKE,ELECTRIC_BIKE,BICYCLE',
    capacity = 200
WHERE id = 4;

UPDATE parking_lots
SET code = 'LOT_E',
    name = 'Bãi E (Khu hành chính & Giảng viên)',
    campus = 'CS1_LTK',
    location = 'Khu vực hành chính & Giảng viên - Cơ sở 1 (268 Lý Thường Kiệt, Q.10)',
    allowed_vehicle_types = 'MOTORBIKE,ELECTRIC_BIKE,BICYCLE,CAR',
    capacity = 150
WHERE id = 5;

UPDATE parking_packages
SET description = 'Gửi xe máy/xe điện theo tháng (30 ngày) tại 5 bãi Cơ sở 1 (268 Lý Thường Kiệt, Q.10).'
WHERE id = 2;

UPDATE parking_sessions
SET entry_gate = 'Cổng Bãi A - Làn 1',
    exit_gate = 'Cổng Bãi A - Làn 2'
WHERE id = 1;

UPDATE parking_sessions
SET entry_gate = 'Cổng Bãi A - Làn 1',
    note = 'Xe đang đỗ tại Bãi A (Cổng Lý Thường Kiệt)'
WHERE id = 2;

UPDATE parking_sessions
SET parking_lot_id = 5,
    entry_gate = 'Cổng Bãi E - Hành chính',
    note = 'Xe giảng viên đang đỗ tại Bãi E (Khu hành chính & Giảng viên)'
WHERE id = 3;
