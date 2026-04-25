package com.smartexpense.smartexpensebackend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Phase 4: DB-driven categorization rule.
 * Maps a keyword (found in merchant name or OCR text) to a Category.
 * Priority determines which rule wins when multiple keywords match (higher = wins).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "category_rules", indexes = {
        @Index(name = "idx_category_rules_keyword", columnList = "keyword")
})
public class CategoryRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * The keyword to search for (stored lowercase).
     * e.g. "zomato", "uber", "netflix"
     */
    @Column(nullable = false, unique = true)
    private String keyword;

    /**
     * The category this keyword maps to.
     */
    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Category category;

    /**
     * Higher priority rules win when multiple keywords match.
     * Default is 0.
     */
    @Column(nullable = false)
    @Builder.Default
    private int priority = 0;
}
