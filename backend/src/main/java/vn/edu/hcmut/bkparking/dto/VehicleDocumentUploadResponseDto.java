package vn.edu.hcmut.bkparking.dto;

public class VehicleDocumentUploadResponseDto {
    private Long id;
    private String url;
    private String purpose;
    private String originalFileName;
    private String contentType;
    private long sizeBytes;

    public VehicleDocumentUploadResponseDto() {}

    public VehicleDocumentUploadResponseDto(Long id, String url, String purpose,
            String originalFileName, String contentType, long sizeBytes) {
        this.id = id;
        this.url = url;
        this.purpose = purpose;
        this.originalFileName = originalFileName;
        this.contentType = contentType;
        this.sizeBytes = sizeBytes;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }
    public String getPurpose() { return purpose; }
    public void setPurpose(String purpose) { this.purpose = purpose; }
    public String getOriginalFileName() { return originalFileName; }
    public void setOriginalFileName(String originalFileName) { this.originalFileName = originalFileName; }
    public String getContentType() { return contentType; }
    public void setContentType(String contentType) { this.contentType = contentType; }
    public long getSizeBytes() { return sizeBytes; }
    public void setSizeBytes(long sizeBytes) { this.sizeBytes = sizeBytes; }
}
