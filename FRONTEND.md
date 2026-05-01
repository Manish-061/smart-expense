# SmartExpense Frontend Documentation

## 1. Overview
SmartExpense is a modern web application designed for personal and group financial tracking. The frontend provides an intuitive, responsive user interface to manage expenses, monitor budgets, split group bills, and analyze spending habits.

### Tech Stack
- **Framework:** React 19 via Vite
- **Styling:** Tailwind CSS v4
- **State Management:** Zustand (Global State/Auth), TanStack React Query v5 (Server State/Caching)
- **Routing:** React Router v7
- **Forms & Validation:** React Hook Form, Zod
- **Data Visualization:** Recharts
- **Icons:** Lucide React
- **HTTP Client:** Axios

---

## 2. Project Structure

```text
frontend/
├── public/               # Static assets (favicons, etc.)
├── src/
│   ├── components/       # Reusable UI elements and layout wrappers
│   │   ├── expense/      # Expense-specific UI components
│   │   ├── groups/       # Group and splitting UI components
│   │   ├── layout/       # AppLayout, Navigation, Sidebar
│   │   └── ui/           # Generic buttons, inputs, modals, badges
│   ├── lib/              # Shared utilities, API interceptors, constants
│   ├── pages/            # Page-level components corresponding to routes
│   │   ├── auth/         # Login, Register
│   │   ├── budgets/      # Budget Tracking
│   │   ├── dashboard/    # Main Dashboard
│   │   ├── expenses/     # Expense List & Filtering
│   │   ├── groups/       # Group Management
│   │   ├── reports/      # Financial Analytics
│   │   └── upload/       # Receipt OCR Upload & Review
│   ├── store/            # Zustand global stores
│   ├── App.jsx           # Main Application Router
│   ├── index.css         # Tailwind directives and global styles
│   └── main.jsx          # React DOM entry point
├── package.json          # Dependencies and scripts
└── vite.config.js        # Vite bundler configuration
```

---

## 3. Architecture
The frontend follows a **Feature-Based Architecture**, grouping related components and pages together by domain (e.g., `expenses/`, `groups/`, `budgets/`). 

### State Management
- **Server State:** Managed by `React Query`. It handles data fetching, caching, synchronization, and invalidation (e.g., refreshing expenses after adding a new one).
- **Client State:** Managed by `Zustand`. Primarily used for persistent Authentication state (JWT tokens, user profiles).

### Routing Strategy
React Router handles navigation.
- **Public Routes:** `/login`, `/register`
- **Protected Routes:** Wrapped in an `<AppLayout />` which enforces authentication checks. Unauthenticated users are redirected to `/login`.

---

## 4. Key Modules / Features

- **Dashboard:** Provides an at-a-glance overview of total spending, recent activity, and active budget warnings.
- **Expense Management:** Add, edit, delete, and list individual expenses. Supports filtering by date and category.
- **Group Expenses:** Create shared spaces, add members via email, and split bills equally. Shows computed balances (who owes whom).
- **Budget Tracking:** Set category-specific monthly budgets. Tracks percentage used and displays visual progress bars.
- **Receipt Upload (OCR):** Upload physical receipts. Integrates with a backend AI/OCR service to extract amount, merchant, date, and suggested category.
- **Financial Reports:** Visual analytics using Recharts for 6-month spending trends and monthly category breakdowns.

---

## 5. API Integration

### Axios Configuration (`src/lib/api.js`)
All backend communication routes through a customized Axios instance.
- **Base URL:** Driven by `import.meta.env.VITE_API_URL`.
- **Request Interceptor:** Automatically injects the Bearer JWT token from the Zustand auth store into the `Authorization` header.
- **Response Interceptor:** Listens for `401 Unauthorized` responses and automatically triggers a client-side logout to clear stale sessions.

### Data Fetching Patterns
- Queries (GET) are executed via `useQuery` (e.g., fetching lists, summaries).
- Mutations (POST/PUT/DELETE) are executed via `useMutation`, followed by `queryClient.invalidateQueries` to automatically refresh stale data without full page reloads.

---

## 6. Components & Reusability

We utilize a loose **Atomic Design** pattern for common UI components inside `src/components/ui/`.
- **Button, Input, CategorySelect:** Highly reusable, styled stateless components that pass refs and props using `forwardRef`.
- **CategoryBadge:** Centralized styling for expense categories ensuring consistent colors and icons across the app.
- **Class Merging:** Uses `clsx` and `tailwind-merge` inside `utils.js` (`cn()` function) to cleanly override Tailwind classes dynamically without conflicts.

---

## 7. Styling Approach

**Tailwind CSS (v4)** is the primary styling methodology.
- **Utility-First:** Almost all styling is inline using Tailwind utility classes.
- **Design Tokens:** Global theme variables (e.g., primary colors, border radii) are defined in `index.css` via `@theme`.
- **Global Styles:** `index.css` contains resets, body backgrounds, and global pointer behaviors for buttons/anchors.

---

## 8. Performance Considerations

- **Component Memoization:** `useMemo` is used extensively in high-computation areas like the `Reports.jsx` chart data aggregations to prevent unnecessary recalculations on re-renders.
- **Query Caching:** React Query caches network responses for 5 minutes (`staleTime`) by default, drastically reducing redundant network traffic.
- **Vite Bundler:** Fast HMR during development and optimized Rollup chunks for production builds.

---

## 9. Environment Configuration

The application requires environment variables defined in a `.env` file (not committed to source control).

```env
# URL for the Spring Boot backend API
VITE_API_URL=http://localhost:8080/api
```

---

## 10. Development & Build

### Setup Instructions
1. Ensure Node.js (v18+) is installed.
2. Navigate to the `frontend/` directory.
3. Install dependencies: `npm install`
4. Copy `.env.example` to `.env` and set `VITE_API_URL`.

### Available Scripts
- **Start Dev Server:** `npm run dev` (Runs locally, usually on port 5173)
- **Build for Production:** `npm run build`
- **Preview Production Build:** `npm run preview`
- **Linting:** `npm run lint`

### Build Process
Vite bundles the React application into optimized static files (`HTML`, `JS`, `CSS`) in the `dist/` directory, which can be served by Nginx, Apache, or any static host.
