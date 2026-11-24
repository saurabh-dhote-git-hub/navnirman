package com.navnirman.storage;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;
import software.amazon.awssdk.core.exception.SdkException;

import jakarta.annotation.PreDestroy;
import java.io.*;
import java.net.URI;
import java.nio.file.*;
import java.util.Locale;
import java.util.UUID;

@Service
public class VideoStorageService {
    private final boolean r2Enabled;
    private final Path localDirectory;
    private final String bucket;
    private final S3Client s3;

    public VideoStorageService(
            @Value("${app.storage.video-dir:./storage/videos}") String directory,
            @Value("${app.storage.r2.enabled:false}") boolean r2Enabled,
            @Value("${app.storage.r2.endpoint:}") String endpoint,
            @Value("${app.storage.r2.region:auto}") String region,
            @Value("${app.storage.r2.bucket:}") String bucket,
            @Value("${app.storage.r2.access-key:}") String accessKey,
            @Value("${app.storage.r2.secret-key:}") String secretKey) throws IOException {
        this.r2Enabled = r2Enabled;
        this.localDirectory = Paths.get(directory).toAbsolutePath().normalize();
        this.bucket = bucket;
        Files.createDirectories(localDirectory);

        if (r2Enabled) {
            if (endpoint.isBlank() || bucket.isBlank() || accessKey.isBlank() || secretKey.isBlank()) {
                throw new IllegalStateException("R2 is enabled but one or more R2 settings are missing");
            }
            this.s3 = S3Client.builder()
                    .endpointOverride(URI.create(endpoint))
                    .region(Region.of(region))
                    .credentialsProvider(StaticCredentialsProvider.create(
                            AwsBasicCredentials.create(accessKey, secretKey)))
                    .forcePathStyle(true)
                    .build();
        } else {
            this.s3 = null;
        }
    }

    public String store(MultipartFile file) throws IOException {
        String original = file.getOriginalFilename() == null ? "video.mp4" : file.getOriginalFilename();
        String extension = original.contains(".") ? original.substring(original.lastIndexOf('.')) : ".mp4";
        String key = UUID.randomUUID() + extension.toLowerCase(Locale.ROOT);
        if (r2Enabled) {
            try (InputStream input = file.getInputStream()) {
                s3.putObject(PutObjectRequest.builder()
                                .bucket(bucket).key(key)
                                .contentType(file.getContentType())
                                .contentLength(file.getSize())
                                .build(),
                        RequestBody.fromInputStream(input, file.getSize()));
            } catch (SdkException ex) {
                throw new IOException("Unable to upload video to R2", ex);
            }
        } else {
            Path target = localDirectory.resolve(key).normalize();
            if (!target.startsWith(localDirectory)) throw new IOException("Invalid storage key");
            try (InputStream input = file.getInputStream()) {
                Files.copy(input, target);
            }
        }
        return key;
    }

    public long size(String key) throws IOException {
        if (r2Enabled) {
            try {
                return s3.headObject(HeadObjectRequest.builder().bucket(bucket).key(key).build()).contentLength();
            } catch (SdkException ex) {
                throw new FileNotFoundException("Video object not found in R2");
            }
        }
        Path file = localPath(key);
        if (!Files.isRegularFile(file)) throw new FileNotFoundException("Video file not found");
        return Files.size(file);
    }

    public InputStream openRange(String key, long start, long end) throws IOException {
        if (r2Enabled) {
            try {
                ResponseInputStream<GetObjectResponse> response = s3.getObject(GetObjectRequest.builder()
                        .bucket(bucket).key(key).range("bytes=" + start + "-" + end).build());
                return response;
            } catch (SdkException ex) {
                throw new IOException("Unable to read video from R2", ex);
            }
        }
        try {
            RandomAccessFile file = new RandomAccessFile(localPath(key).toFile(), "r");
            file.seek(start);
            return new InputStream() {
                private long remaining = end - start + 1;
                @Override public int read() throws IOException {
                    if (remaining <= 0) return -1;
                    int value = file.read();
                    if (value >= 0) remaining--;
                    return value;
                }
                @Override public int read(byte[] b, int off, int len) throws IOException {
                    if (remaining <= 0) return -1;
                    int count = file.read(b, off, (int)Math.min(len, remaining));
                    if (count > 0) remaining -= count;
                    return count;
                }
                @Override public void close() throws IOException { file.close(); }
            };
        } catch (FileNotFoundException ex) {
            throw ex;
        }
    }

    public void delete(String key) throws IOException {
        if (r2Enabled) {
            try {
                s3.deleteObject(DeleteObjectRequest.builder().bucket(bucket).key(key).build());
            } catch (SdkException ex) {
                throw new IOException("Unable to delete video from R2", ex);
            }
        } else {
            Files.deleteIfExists(localPath(key));
        }
    }

    private Path localPath(String key) throws IOException {
        Path path = localDirectory.resolve(key).normalize();
        if (!path.startsWith(localDirectory)) throw new IOException("Invalid storage key");
        return path;
    }

    @PreDestroy
    public void close() {
        if (s3 != null) s3.close();
    }
}
