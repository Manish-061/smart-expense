package com.smartexpense.smartexpensebackend.config;

import com.smartexpense.smartexpensebackend.model.Category;
import com.smartexpense.smartexpensebackend.model.CategoryRule;
import com.smartexpense.smartexpensebackend.repository.CategoryRuleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Phase 4: Seeds default categorization rules into the database on startup.
 * Only inserts if the table is empty (safe for restarts).
 */
@Component
@Order(1)
@RequiredArgsConstructor
@Slf4j
public class CategoryRuleSeeder implements CommandLineRunner {

    private final CategoryRuleRepository categoryRuleRepository;

    @Override
    public void run(String... args) {
        if (categoryRuleRepository.count() > 0) {
            log.info("Category rules already seeded ({} rules exist), skipping.",
                    categoryRuleRepository.count());
            return;
        }

        List<CategoryRule> defaultRules = List.of(
                // FOOD — restaurants, delivery, cafes, groceries
                rule("zomato", Category.FOOD, 10),
                rule("swiggy", Category.FOOD, 10),
                rule("uber eats", Category.FOOD, 10),
                rule("doordash", Category.FOOD, 10),
                rule("dominos", Category.FOOD, 8),
                rule("mcdonald", Category.FOOD, 8),
                rule("starbucks", Category.FOOD, 8),
                rule("pizza hut", Category.FOOD, 8),
                rule("kfc", Category.FOOD, 8),
                rule("subway", Category.FOOD, 7),
                rule("cafe", Category.FOOD, 5),
                rule("restaurant", Category.FOOD, 5),
                rule("grocery", Category.FOOD, 5),
                rule("bakery", Category.FOOD, 5),
                rule("food", Category.FOOD, 3),

                // TRANSPORT — ride-hailing, fuel, transit
                rule("uber", Category.TRANSPORT, 8),
                rule("ola", Category.TRANSPORT, 8),
                rule("lyft", Category.TRANSPORT, 8),
                rule("rapido", Category.TRANSPORT, 8),
                rule("metro", Category.TRANSPORT, 5),
                rule("fuel", Category.TRANSPORT, 5),
                rule("petrol", Category.TRANSPORT, 5),
                rule("diesel", Category.TRANSPORT, 5),
                rule("parking", Category.TRANSPORT, 5),
                rule("toll", Category.TRANSPORT, 5),
                rule("gas station", Category.TRANSPORT, 5),

                // SHOPPING — e-commerce, retail
                rule("amazon", Category.SHOPPING, 8),
                rule("flipkart", Category.SHOPPING, 8),
                rule("myntra", Category.SHOPPING, 8),
                rule("walmart", Category.SHOPPING, 8),
                rule("target", Category.SHOPPING, 6),
                rule("costco", Category.SHOPPING, 6),
                rule("ikea", Category.SHOPPING, 6),
                rule("mall", Category.SHOPPING, 4),
                rule("store", Category.SHOPPING, 3),

                // ENTERTAINMENT — streaming, movies, gaming
                rule("netflix", Category.ENTERTAINMENT, 10),
                rule("spotify", Category.ENTERTAINMENT, 10),
                rule("disney", Category.ENTERTAINMENT, 8),
                rule("youtube", Category.ENTERTAINMENT, 8),
                rule("cinema", Category.ENTERTAINMENT, 6),
                rule("movie", Category.ENTERTAINMENT, 6),
                rule("gaming", Category.ENTERTAINMENT, 5),
                rule("playstation", Category.ENTERTAINMENT, 5),
                rule("xbox", Category.ENTERTAINMENT, 5),
                rule("steam", Category.ENTERTAINMENT, 5),

                // HEALTH — pharmacy, hospital, clinic
                rule("pharmacy", Category.HEALTH, 8),
                rule("hospital", Category.HEALTH, 8),
                rule("clinic", Category.HEALTH, 7),
                rule("medical", Category.HEALTH, 6),
                rule("doctor", Category.HEALTH, 6),
                rule("health", Category.HEALTH, 4),
                rule("apollo", Category.HEALTH, 7),

                // EDUCATION — courses, tuition, books
                rule("udemy", Category.EDUCATION, 10),
                rule("coursera", Category.EDUCATION, 10),
                rule("tuition", Category.EDUCATION, 7),
                rule("school", Category.EDUCATION, 6),
                rule("university", Category.EDUCATION, 6),
                rule("college", Category.EDUCATION, 6),
                rule("bookstore", Category.EDUCATION, 5),

                // BILLS — utilities, telecom, internet
                rule("electricity", Category.BILLS, 8),
                rule("water bill", Category.BILLS, 8),
                rule("gas bill", Category.BILLS, 8),
                rule("internet", Category.BILLS, 7),
                rule("broadband", Category.BILLS, 7),
                rule("airtel", Category.BILLS, 7),
                rule("jio", Category.BILLS, 7),
                rule("vodafone", Category.BILLS, 7),
                rule("mobile recharge", Category.BILLS, 6),
                rule("insurance", Category.BILLS, 6),

                // RENT
                rule("rent", Category.RENT, 8),
                rule("lease", Category.RENT, 6),
                rule("landlord", Category.RENT, 6),

                // TRAVEL — flights, hotels, booking
                rule("makemytrip", Category.TRAVEL, 10),
                rule("booking.com", Category.TRAVEL, 10),
                rule("airbnb", Category.TRAVEL, 10),
                rule("airline", Category.TRAVEL, 7),
                rule("flight", Category.TRAVEL, 7),
                rule("hotel", Category.TRAVEL, 7),
                rule("resort", Category.TRAVEL, 6),
                rule("travel", Category.TRAVEL, 5)
        );

        categoryRuleRepository.saveAll(defaultRules);
        log.info("Seeded {} default category rules.", defaultRules.size());
    }

    private CategoryRule rule(String keyword, Category category, int priority) {
        return CategoryRule.builder()
                .keyword(keyword.toLowerCase())
                .category(category)
                .priority(priority)
                .build();
    }
}
