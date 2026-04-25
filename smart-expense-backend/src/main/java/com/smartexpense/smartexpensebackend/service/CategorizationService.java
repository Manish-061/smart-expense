package com.smartexpense.smartexpensebackend.service;

import com.smartexpense.smartexpensebackend.model.Category;
import com.smartexpense.smartexpensebackend.model.CategoryRule;
import com.smartexpense.smartexpensebackend.repository.CategoryRuleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Phase 4: Rule-based categorization engine.
 * Scans the merchant name and raw OCR text against keyword rules stored in the DB.
 * Rules are prioritized — the highest-priority matching rule wins.
 * Falls back to OTHER if no rule matches.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CategorizationService {

    private final CategoryRuleRepository categoryRuleRepository;

    /**
     * Suggest a category based on the merchant name and/or raw OCR text.
     *
     * @param merchantName the extracted merchant name (may be null)
     * @param rawText      the full raw OCR output (may be null)
     * @return the best matching Category, or OTHER if none match
     */
    public Category suggestCategory(String merchantName, String rawText) {
        // Build a single searchable string from all available text
        StringBuilder searchable = new StringBuilder();
        if (merchantName != null) {
            searchable.append(merchantName.toLowerCase()).append(" ");
        }
        if (rawText != null) {
            searchable.append(rawText.toLowerCase());
        }

        String searchText = searchable.toString();

        if (searchText.isBlank()) {
            log.debug("No text available for categorization, returning OTHER");
            return Category.OTHER;
        }

        // Rules are pre-ordered by priority DESC from the repository
        List<CategoryRule> rules = categoryRuleRepository.findAllByOrderByPriorityDesc();

        for (CategoryRule rule : rules) {
            if (searchText.contains(rule.getKeyword())) {
                log.info("Categorization match: keyword='{}' -> category={}",
                        rule.getKeyword(), rule.getCategory());
                return rule.getCategory();
            }
        }

        log.debug("No categorization rule matched, returning OTHER");
        return Category.OTHER;
    }
}
