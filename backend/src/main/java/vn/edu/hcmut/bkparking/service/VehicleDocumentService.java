package vn.edu.hcmut.bkparking.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import vn.edu.hcmut.bkparking.common.exception.BusinessException;
import vn.edu.hcmut.bkparking.common.exception.ErrorCode;
import vn.edu.hcmut.bkparking.dto.VehicleDocumentType;
import vn.edu.hcmut.bkparking.dto.VehicleDocumentUploadResponseDto;
import vn.edu.hcmut.bkparking.entity.User;
import vn.edu.hcmut.bkparking.entity.VehicleDocument;
import vn.edu.hcmut.bkparking.repository.UserRepository;
import vn.edu.hcmut.bkparking.repository.VehicleDocumentRepository;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.UUID;

@Service
public class VehicleDocumentService {
    private static final long MAX_FILE_SIZE_BYTES = 5L * 1024 * 1024;
    private static final String DOCUMENT_URL_PREFIX = "/api/v1/vehicles/documents/";

    private final VehicleDocumentRepository documentRepository;
    private final UserRepository userRepository;

    @Value("${app.upload.vehicle-documents-dir:./uploads/vehicle-documents}")
    private String storageDirectory;

    public VehicleDocumentService(VehicleDocumentRepository documentRepository, UserRepository userRepository) {
        this.documentRepository = documentRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public VehicleDocumentUploadResponseDto upload(Long ownerId, VehicleDocumentType purpose, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException(ErrorCode.INVALID_VEHICLE_DOCUMENT, "Vui lòng chọn ảnh cần tải lên");
        }
        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new BusinessException(ErrorCode.DOCUMENT_TOO_LARGE);
        }

        DetectedImage image = detectImage(file);
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy người dùng"));
        String storedFileName = UUID.randomUUID() + image.extension();
        Path root = getStorageRoot();
        Path destination = root.resolve(storedFileName).normalize();
        if (!destination.startsWith(root)) {
            throw new BusinessException(ErrorCode.INVALID_VEHICLE_DOCUMENT);
        }

        try {
            Files.createDirectories(root);
            try (InputStream input = file.getInputStream()) {
                Files.copy(input, destination);
            }
        } catch (IOException ex) {
            throw new BusinessException(ErrorCode.DOCUMENT_STORAGE_FAILED);
        }

        VehicleDocument document = new VehicleDocument();
        document.setOwner(owner);
        document.setPurpose(purpose.name());
        document.setOriginalFileName(sanitizeOriginalFileName(file.getOriginalFilename()));
        document.setStoredFileName(storedFileName);
        document.setContentType(image.contentType());
        document.setSizeBytes(file.getSize());
        document.setCreatedAt(LocalDateTime.now());

        try {
            VehicleDocument saved = documentRepository.saveAndFlush(document);
            return new VehicleDocumentUploadResponseDto(
                    saved.getId(),
                    DOCUMENT_URL_PREFIX + saved.getId(),
                    saved.getPurpose(),
                    saved.getOriginalFileName(),
                    saved.getContentType(),
                    saved.getSizeBytes());
        } catch (RuntimeException ex) {
            try {
                Files.deleteIfExists(destination);
            } catch (IOException ignored) {
                // The original persistence failure is more useful than a cleanup failure.
            }
            throw ex;
        }
    }

    @Transactional(readOnly = true)
    public String resolveOwnedDocumentUrl(Long ownerId, Long documentId, VehicleDocumentType expectedPurpose) {
        if (documentId == null) return null;
        VehicleDocument document = documentRepository.findById(documentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_VEHICLE_DOCUMENT, "Không tìm thấy ảnh đã tải lên"));
        if (!document.getOwner().getId().equals(ownerId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "Ảnh tải lên không thuộc tài khoản của bạn");
        }
        if (!expectedPurpose.name().equals(document.getPurpose())) {
            throw new BusinessException(ErrorCode.INVALID_VEHICLE_DOCUMENT, "Loại ảnh không khớp với trường hồ sơ");
        }
        return DOCUMENT_URL_PREFIX + document.getId();
    }

    @Transactional(readOnly = true)
    public VehicleDocumentDownload loadForUser(Long requesterId, String roleCode, Long documentId) {
        VehicleDocument document = documentRepository.findById(documentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy tài liệu"));
        boolean isOwner = document.getOwner().getId().equals(requesterId);
        boolean isAdmin = "ROLE_ADMIN".equals(roleCode);
        if (!isOwner && !isAdmin) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }

        Path root = getStorageRoot();
        Path filePath = root.resolve(document.getStoredFileName()).normalize();
        if (!filePath.startsWith(root) || !Files.isRegularFile(filePath)) {
            throw new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy tài liệu trên máy chủ");
        }
        return new VehicleDocumentDownload(document, new FileSystemResource(filePath));
    }

    private DetectedImage detectImage(MultipartFile file) {
        byte[] header;
        try (InputStream input = file.getInputStream()) {
            header = input.readNBytes(8);
        } catch (IOException ex) {
            throw new BusinessException(ErrorCode.INVALID_VEHICLE_DOCUMENT, "Không đọc được tài liệu đã tải lên");
        }

        boolean isJpeg = header.length >= 3
                && (header[0] & 0xff) == 0xff
                && (header[1] & 0xff) == 0xd8
                && (header[2] & 0xff) == 0xff;
        boolean isPng = header.length >= 8
                && (header[0] & 0xff) == 0x89
                && header[1] == 0x50
                && header[2] == 0x4e
                && header[3] == 0x47
                && header[4] == 0x0d
                && header[5] == 0x0a
                && header[6] == 0x1a
                && header[7] == 0x0a;

        String declaredType = file.getContentType() == null
                ? ""
                : file.getContentType().toLowerCase(Locale.ROOT);
        if (isJpeg && "image/jpeg".equals(declaredType)) return new DetectedImage("image/jpeg", ".jpg");
        if (isPng && "image/png".equals(declaredType)) return new DetectedImage("image/png", ".png");
        throw new BusinessException(ErrorCode.UNSUPPORTED_DOCUMENT_TYPE);
    }

    private String sanitizeOriginalFileName(String filename) {
        String cleaned = StringUtils.cleanPath(filename == null ? "vehicle-document" : filename)
                .replace('\\', '/');
        int lastSlash = cleaned.lastIndexOf('/');
        String basename = cleaned.substring(lastSlash + 1).replaceAll("[\\r\\n\\\"]", "_");
        if (basename.isBlank() || ".".equals(basename)) basename = "vehicle-document";
        return basename.length() > 255 ? basename.substring(0, 255) : basename;
    }

    private Path getStorageRoot() {
        return Paths.get(storageDirectory).toAbsolutePath().normalize();
    }

    private record DetectedImage(String contentType, String extension) {}

    public record VehicleDocumentDownload(VehicleDocument document, Resource resource) {}
}
