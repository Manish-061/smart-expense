# SmartExpense 💰

**SmartExpense** is a comprehensive, full-stack personal and group financial management application. It helps you track personal expenses, split bills with friends seamlessly, enforce category budgets, and analyze spending patterns with automated OCR receipt scanning and AI insights.

---

## 🌟 Key Features

- **Personal Expense Tracking:** Log and categorize your daily expenses.
- **Group Settlements (Splitwise-style):** Create groups, add members, log shared expenses, and instantly see who owes whom.
- **Budget Management:** Set monthly limits per category and receive visual alerts when you exceed them.
- **AI Receipt Scanning:** Upload images of physical receipts; our AWS S3 + Google Gemini Pro Vision integration automatically extracts the amount, date, merchant, and category.
- **Financial Analytics:** Interactive, Recharts-powered dashboards detailing your 6-month spending trends and monthly category breakdowns.

---

## 🛠 Tech Stack

### Frontend
- **Framework:** React 19 (Vite)
- **Styling:** Tailwind CSS v4
- **State & Data:** Zustand (Auth) & TanStack React Query (Server State)
- **Routing:** React Router v7
- **Charts:** Recharts

### Backend
- **Framework:** Spring Boot 4.x (Java 17+)
- **Database:** PostgreSQL (Spring Data JPA)
- **Security:** Spring Security & JWT
- **Cloud/AI:** AWS S3, Google Gemini Pro Vision

---

## 📂 Project Structure

This repository is structured as a monorepo containing both the frontend and backend applications:

```text
smart-expense/
├── frontend/               # React + Vite frontend application
├── smart-expense-backend/  # Spring Boot backend API
├── FRONTEND.md             # Detailed Frontend Architecture & Setup
├── BACKEND.md              # Detailed Backend Architecture & Setup
└── README.md               # This file
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- Java 17+ & Maven
- PostgreSQL running locally on port 5432

### 1. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd smart-expense-backend
   ```
2. Update the `src/main/resources/application.properties` with your PostgreSQL credentials, AWS keys, and Gemini API key.
3. Build and run the server:
   ```bash
   mvn clean install
   mvn spring-boot:run
   ```
*The backend API will start on `http://localhost:8080`.*

### 2. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `frontend` directory:
   ```env
   VITE_API_URL=http://localhost:8080/api
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
*The frontend application will start on `http://localhost:5173`.*

---

## 📚 Documentation

For in-depth architectural details, API structures, and ER diagrams, please refer to the dedicated documentation files:

- [Frontend Documentation](./FRONTEND.md)
- [Backend Documentation](./BACKEND.md)
