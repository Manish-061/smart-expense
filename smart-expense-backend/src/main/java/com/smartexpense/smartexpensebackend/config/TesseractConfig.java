package com.smartexpense.smartexpensebackend.config;

import lombok.extern.slf4j.Slf4j;
import net.sourceforge.tess4j.Tesseract;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.File;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Spring configuration for the Tess4J Tesseract OCR engine.
 *
 * Creates a SINGLETON Tesseract instance to avoid the JNA "Invalid memory access"
 * crash that occurs when instances are created/destroyed repeatedly on Windows.
 *
 * Resolves the tessdata path to an absolute path to work regardless of the
 * JVM working directory (IDE, CLI, Docker, etc.).
 */
@Configuration
@Slf4j
public class TesseractConfig {

    @Value("${ocr.tessdata-path:tessdata}")
    private String tessdataPath;

    @Value("${ocr.language:eng}")
    private String language;

    @Bean
    public Tesseract tesseract() {
        Tesseract instance = new Tesseract();

        // Resolve to an absolute path that actually contains eng.traineddata
        String resolvedPath = resolveDatapath();
        instance.setDatapath(resolvedPath);
        instance.setLanguage(language);
        instance.setPageSegMode(3);  // Fully automatic page segmentation
        instance.setOcrEngineMode(1); // LSTM neural net mode

        log.info("Tesseract OCR initialized — datapath={}, language={}", resolvedPath, language);
        return instance;
    }

    /**
     * Finds the tessdata directory containing eng.traineddata.
     * Tries multiple strategies to handle different CWD scenarios:
     *   1. Configured path as-is (absolute or lucky relative)
     *   2. Relative to the backend module directory
     *   3. Relative to the project root (when CWD is repo root)
     */
    private String resolveDatapath() {
        // The traineddata file we need to locate
        String targetFile = language + ".traineddata";

        // Strategy 1: Use the configured path directly
        File direct = new File(tessdataPath, targetFile);
        if (direct.exists()) {
            String resolved = new File(tessdataPath).getAbsolutePath();
            log.info("Tessdata found via configured path: {}", resolved);
            return resolved;
        }

        // Strategy 2: Relative to the location of this class's JAR/classes
        // This handles cases where the app runs from the backend module directory
        try {
            Path classLocation = Paths.get(
                    TesseractConfig.class.getProtectionDomain().getCodeSource().getLocation().toURI()
            );
            // Walk up from target/classes to the module root
            Path moduleRoot = classLocation.getParent().getParent();
            File fromModule = moduleRoot.resolve("tessdata").resolve(targetFile).toFile();
            if (fromModule.exists()) {
                String resolved = moduleRoot.resolve("tessdata").toFile().getAbsolutePath();
                log.info("Tessdata found relative to module root: {}", resolved);
                return resolved;
            }
        } catch (Exception e) {
            log.debug("Could not resolve tessdata from class location: {}", e.getMessage());
        }

        // Strategy 3: Common relative paths from a parent project root
        String[] candidates = {
                "smart-expense-backend/tessdata",
                "smart-expense-backend\\tessdata",
                "../tessdata",
                "tessdata",
        };
        for (String candidate : candidates) {
            File f = new File(candidate, targetFile);
            if (f.exists()) {
                String resolved = new File(candidate).getAbsolutePath();
                log.info("Tessdata found at candidate path: {}", resolved);
                return resolved;
            }
        }

        // Fallback: return the configured path and let Tess4J fail with a clear error
        String fallback = new File(tessdataPath).getAbsolutePath();
        log.warn("Could not locate {}. Falling back to: {}", targetFile, fallback);
        return fallback;
    }
}
