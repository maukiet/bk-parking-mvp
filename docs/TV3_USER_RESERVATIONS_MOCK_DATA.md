# TV3 – User Portal: Đặt chỗ trước (dữ liệu mô phỏng)

## Phạm vi

Trang `/user/reservations` là giao diện User Portal do TV3 phụ trách. Tất cả lượt đặt, tình trạng bãi, phương tiện, hạn mức và quyền đặt chỗ trên trang hiện dùng dữ liệu mock trong frontend; không gọi API và không ghi dữ liệu vào backend.

Module dữ liệu: `frontend/src/features/user-portal/reservations/mockReservations.ts`.

## Dữ liệu đang hiển thị

- Tài khoản mẫu: Nguyễn Văn An, Cán bộ / Giảng viên.
- Phương tiện mẫu đã duyệt: Tesla Model 3, biển số `59P1-123.45`; Toyota Vios, biển số `51H-806.28`.
- Bãi E: sức chứa 120; 88 xe đang đỗ; 25 chỗ đã giữ; 7 suất đặt trước còn trống trên hạn mức 20 suất trong ngày.
- Bãi A: hết chỗ (20/20), không chọn được trong form.
- Bãi B: còn 3 suất trên hạn mức 12.
- Lịch sử mẫu gồm một lượt đang giữ chỗ, một lượt hoàn thành, một lượt vắng mặt và một lượt đã hủy. Ngày của dữ liệu được tạo tương đối với ngày mở trang để lượt sắp tới luôn nằm trong tương lai.
- Chính sách mô phỏng: giữ chỗ 30 phút; 3 lần vắng mặt sẽ khóa quyền đặt mới trong 14 ngày; một lượt giữ chỗ đang hoạt động cho mỗi tài khoản.

## Hành vi có thể thử

- Tạo lượt đặt: chọn xe, bãi còn chỗ, ngày và giờ hẹn. Lượt mới chỉ tồn tại trong state của trang và mất khi tải lại.
- Hết chỗ: Bãi A bị vô hiệu hóa trong danh sách chọn; nếu bãi đang chọn hết chỗ thì form không tạo lượt.
- Khóa quyền: nút **Mô phỏng khóa quyền** chuyển quyền đặt mới sang trạng thái khóa, hiển thị ngưỡng vắng mặt và khóa nút tạo lượt. Nút **Khôi phục quyền mô phỏng** trả trang về trạng thái ban đầu. Tài khoản thật không bị thay đổi.
- Chi tiết: xem mã, bãi, xe, giờ hẹn, hạn giữ chỗ và phí mô phỏng.
- Hủy chỗ: xác nhận hủy đổi trạng thái lượt thành đã hủy và cộng lại suất trống cục bộ.
- Danh sách: tìm theo mã lượt/biển số và lọc theo sắp tới, hoàn thành, đã hủy hoặc vắng mặt.

## API backend

Hợp đồng API hiện tại chưa có endpoint đặt chỗ trước. Vì vậy trang này chưa kết nối backend. Khi có API chính thức, cần thay nguồn mock bằng endpoint do nhóm thống nhất và giữ nguyên cách xử lý các trạng thái hết chỗ, khóa quyền, chi tiết và hủy theo response của backend.
