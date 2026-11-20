package vn.edu.hcmut.bkparking.common.exception;

import org.springframework.http.HttpStatus;

public enum ErrorCode {
    INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED, "Sai tên đăng nhập hoặc mật khẩu"),
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "Chưa xác thực hoặc phiên đăng nhập đã hết hạn"),
    FORBIDDEN(HttpStatus.FORBIDDEN, "Bạn không có quyền truy cập chức năng này"),
    RESOURCE_NOT_FOUND(HttpStatus.NOT_FOUND, "Không tìm thấy dữ liệu yêu cầu"),
    VALIDATION_ERROR(HttpStatus.BAD_REQUEST, "Dữ liệu đầu vào không hợp lệ"),
    DUPLICATE_LICENSE_PLATE(HttpStatus.CONFLICT, "Biển số xe đã tồn tại trong hệ thống"),
    VEHICLE_LIMIT_EXCEEDED(HttpStatus.BAD_REQUEST, "Bạn đã đạt giới hạn số lượng phương tiện được phép đăng ký"),
    VEHICLE_NOT_APPROVED(HttpStatus.BAD_REQUEST, "Phương tiện chưa được duyệt hoặc đã bị khóa"),
    INVALID_QR_TOKEN(HttpStatus.BAD_REQUEST, "Mã QR không hợp lệ hoặc không tồn tại"),
    PACKAGE_INELIGIBLE(HttpStatus.BAD_REQUEST, "Tài khoản chưa có gói đỗ xe còn hiệu lực"),
    SESSION_ALREADY_ACTIVE(HttpStatus.CONFLICT, "Phương tiện này hiện đang ở trong bãi, không thể tạo lượt VÀO trùng"),
    NO_ACTIVE_SESSION(HttpStatus.BAD_REQUEST, "Phương tiện hiện không có lượt gửi đang mở trong bãi để cho RA"),
    PARKING_LOT_FULL(HttpStatus.CONFLICT, "Bãi đỗ xe đã hết chỗ trống hoặc đang đóng cửa"),
    CAPACITY_BELOW_OCCUPIED(HttpStatus.BAD_REQUEST, "Sức chứa mới không được nhỏ hơn số xe hiện đang đỗ trong bãi"),
    VEHICLE_HAS_ACTIVE_SESSION(HttpStatus.CONFLICT, "Xe đang ở trong bãi nên chưa thể hủy đăng ký"),
    VEHICLE_TYPE_NOT_ALLOWED(HttpStatus.FORBIDDEN, "Tài khoản hiện tại không đủ điều kiện đăng ký loại phương tiện này"),
    INVALID_VEHICLE_DOCUMENT(HttpStatus.BAD_REQUEST, "Tệp hoặc hồ sơ phương tiện không hợp lệ"),
    DOCUMENT_TOO_LARGE(HttpStatus.PAYLOAD_TOO_LARGE, "Ảnh tải lên không được vượt quá 5 MB"),
    UNSUPPORTED_DOCUMENT_TYPE(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Chỉ hỗ trợ ảnh JPG hoặc PNG"),
    DOCUMENT_STORAGE_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "Không thể lưu tệp phương tiện");

    private final HttpStatus status;
    private final String defaultMessage;

    ErrorCode(HttpStatus status, String defaultMessage) {
        this.status = status;
        this.defaultMessage = defaultMessage;
    }

    public HttpStatus getStatus() { return status; }
    public String getDefaultMessage() { return defaultMessage; }
}

