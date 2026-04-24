# SmartExpense Backend – Feature Roadmap (Phase-by-Phase)

## Overview

This document defines the backend feature roadmap for SmartExpense, structured in execution phases. The goal is to ship a working, reliable system incrementally, avoiding over-engineering and premature complexity.

---

# Phase 0 — Foundation Setup

## Goal:

Establish a stable backend base with authentication and project structure.

### Features:

* User Registration
* User Login (JWT-based authentication)
* Password hashing (BCrypt)
* Basic project setup (Spring Boot, PostgreSQL, Redis)
* Global exception handling
* Request validation framework

### APIs:

* `POST /api/auth/register`
* `POST /api/auth/login`

---

# Phase 1 — Core Expense Management (MVP Core)

## Goal:

Build a fully functional manual expense tracking system.

### Features:

* Create expense (manual entry)
* Get all expenses (user-specific)
* Filter expenses (date, category)
* Monthly summary (total spend)
* Category-wise aggregation
* Input validation (amount, date, etc.)

### APIs:

* `POST /api/expenses`
* `GET /api/expenses`
* `GET /api/expenses/summary`

### Notes:

* No OCR yet
* No AI yet
* Focus on correctness and data integrity

---

# Phase 2 — File Upload + OCR Integration

## Goal:

Enable receipt scanning and extraction as an input method.

### Features:

* Upload receipt image
* Store file in AWS S3
* OCR processing (Tesseract)
* Extract:

  * Amount
  * Merchant name
  * Date
* Return extracted data (NOT auto-saved)
* Confidence score for extracted fields

### APIs:

* `POST /api/expenses/receipt`

### Critical Design:

* User must **review and edit extracted data**
* Never auto-save OCR results

---

# Phase 3 — Editable OCR Data + Expense Creation

## Goal:

Convert OCR output into a usable expense flow.

### Features:

* Allow user to edit OCR-extracted fields
* Submit corrected data to create expense
* Store:

  * Cleaned fields
  * Raw OCR data (JSON)
* Link receipt URL with expense

### APIs:

* `POST /api/expenses/from-receipt`

### Notes:

* This phase connects OCR → actual expense creation
* Ensures reliability despite OCR inaccuracies

---

# Phase 4 — Expense Categorization (Rule-Based)

## Goal:

Automate categorization without ML complexity.

### Features:

* Keyword-based categorization
* Rule engine (config or DB-driven)
* Example mappings:

  * "zomato" → FOOD
  * "uber" → TRANSPORT
* Fallback category: OTHER
* Allow user override

### Notes:

* No ML yet
* Track user corrections for future improvements

---

# Phase 5 — Group & Bill Splitting

## Goal:

Enable multi-user expense sharing.

### Features:

* Create group
* Add/remove members
* Add shared expense
* Equal split calculation
* Track individual balances (owed amount)
* Mark split as settled

### APIs:

* `POST /api/groups`
* `POST /api/groups/{id}/members`
* `POST /api/expenses/group`
* `GET /api/groups/{id}/expenses`

### Notes:

* No complex settlement logic (keep it simple)
* Equal split only in v1

---

# Phase 6 — Budget Tracking & Alerts

## Goal:

Help users control spending.

### Features:

* Set monthly budget per category
* Track spending against budget
* Threshold alerts:

  * 80% usage
  * 100% exceeded
* Background job (cron-based)

### APIs:

* `POST /api/budgets`
* `GET /api/budgets`

---

# Phase 7 — Performance & Reliability

## Goal:

Stabilize system for real usage.

### Features:

* Redis caching:

  * Dashboard data
  * Frequently accessed queries
* Rate limiting (OCR endpoint)
* Logging & monitoring
* Error tracking
* Input sanitization

---

# Phase 8 — Future Enhancements (Post-MVP)

## These are intentionally deferred:

### Advanced Features:

* ML-based categorization
* Multi-currency support
* Recurring expenses
* Export (Excel/PDF)
* Advanced analytics dashboard
* Notification system (email/push)

---

# Key Design Principles

## 1. Build in Vertical Slices

Each phase should result in a usable feature.

## 2. Never Trust OCR Blindly

Always require user confirmation.

## 3. Avoid Premature ML

Use rule-based systems until sufficient data exists.

## 4. Keep APIs Stable

Do not expose database entities directly.

## 5. Prioritize Reliability Over Intelligence

A simple system that works > a smart system that fails.

---

# Final Reality Check

You are not building:

* A full fintech platform
* A production-grade ML system (yet)

You are building:

> A reliable expense tracking backend with smart input capabilities

If you execute these phases strictly, you will:

* Ship faster
* Avoid complexity traps
* Have a strong foundation for future AI features

---
