package com.smartexpense.smartexpensebackend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;

import java.io.IOException;
import java.time.Duration;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class S3StorageService {

    private final S3Client s3Client;
    private final S3Presigner s3Presigner;

    @Value("${aws.s3.bucket-name}")
    private String bucketName;

    @Value("${aws.s3.region}")
    private String region;

    /**
     * Upload a file to AWS S3 and return its public URL.
     *
     * @param file the multipart file to upload
     * @return the S3 URL of the uploaded file
     */
    public String uploadFile(MultipartFile file) throws IOException {
        // Generate a unique key to avoid collisions
        String key = "receipts/" + UUID.randomUUID() + "_" + file.getOriginalFilename();

        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .contentType(file.getContentType())
                .build();

        s3Client.putObject(putObjectRequest,
                RequestBody.fromBytes(file.getBytes()));

        // Construct the public URL
        String fileUrl = String.format("https://%s.s3.%s.amazonaws.com/%s",
                bucketName, region, key);

        log.info("File uploaded to S3: {}", fileUrl);
        return fileUrl;
    }

    /**
     * Generate a pre-signed URL for a private S3 object.
     * The URL is valid for the specified duration.
     *
     * @param s3Url the full S3 URL (https://bucket.s3.region.amazonaws.com/key)
     * @param duration how long the URL should be valid
     * @return a temporary signed URL that grants read access
     */
    public String generatePresignedUrl(String s3Url, Duration duration) {
        String key = extractKeyFromUrl(s3Url);

        GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .build();

        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                .signatureDuration(duration)
                .getObjectRequest(getObjectRequest)
                .build();

        PresignedGetObjectRequest presignedRequest = s3Presigner.presignGetObject(presignRequest);
        String presignedUrl = presignedRequest.url().toString();

        log.info("Generated pre-signed URL for key: {} (expires in {})", key, duration);
        return presignedUrl;
    }

    /**
     * Extract the S3 object key from a full S3 URL.
     * e.g. "https://bucket.s3.region.amazonaws.com/receipts/uuid_file.jpg" -> "receipts/uuid_file.jpg"
     */
    private String extractKeyFromUrl(String s3Url) {
        // URL format: https://{bucket}.s3.{region}.amazonaws.com/{key}
        String prefix = String.format("https://%s.s3.%s.amazonaws.com/", bucketName, region);
        if (s3Url.startsWith(prefix)) {
            return s3Url.substring(prefix.length());
        }
        // Fallback: just return the URL as-is (shouldn't happen)
        log.warn("Could not extract key from URL: {}", s3Url);
        return s3Url;
    }
}
