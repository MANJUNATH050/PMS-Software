# Performance Management System (PMS) — Employee Module

Enterprise-grade, containerized Performance Management System (PMS) Employee Module built using Spring Boot, React + TS + Vite, Tailwind CSS v4, and PostgreSQL.

## Repository Directory Layout

```text
PMS-ASEURO/
├── docker-compose.yml           # Container orchestration
├── backend/                     # Spring Boot Rest API (Java 17 / Maven)
│   ├── pom.xml                  # Backend dependency tree
│   ├── Dockerfile               # Backend production build instructions
│   └── src/
│       ├── main/java/...        # Java source code
│       └── main/resources/...   # Server configuration & seeding
├── frontend/                    # Vite + React + TS App
│   ├── package.json             # Frontend package configurations
│   ├── tailwind.config.js       # Core Tailwind CSS settings
│   ├── nginx.conf               # Web server serving configs
│   ├── Dockerfile               # Frontend production build instructions
│   └── src/                     # React source files (api, pages, layouts)
└── e2e/                         # Playwright E2E Testing Suite
    ├── playwright.config.ts     # Playwright configuration
    └── tests/...                # Test specs (Login, Assessment, History)
```

---

## Technical Stack & Configuration Details

- **Frontend:** React 18, Vite 6, Tailwind CSS v4, TypeScript, Recharts, Lucide Icons, Axios.
- **Backend:** Java 17, Spring Boot 3.3.2, Spring Security + JWT Authentication, JPA/Hibernate, Apache POI, Apache PDFBox, Maven.
- **Database:** PostgreSQL 15, H2 Database (optional/test fallback).
- **Orchestration:** Docker Compose.

---

## Local Development Execution

### Option 1: Docker Compose (Recommended)
You can deploy the complete stack (PostgreSQL, Backend API, and Frontend Application) using a single command:
```bash
docker-compose up --build
```
- **React Portal:** Access at `http://localhost` (or port 80).
- **Backend API Swagger Documentation:** Access at `http://localhost:8080/swagger-ui.html`.
- **Database:** PostgreSQL container listening on `localhost:5432`.

### Option 2: Running Components Individually

1. **Database:**
   Start PostgreSQL locally and configure credentials matching `backend/src/main/resources/application.properties`.

2. **Backend API:**
   Navigate into `backend/` and boot the server:
   ```bash
   mvn clean spring-boot:run
   ```

3. **Frontend Application:**
   Navigate into `frontend/`, install packages, and start the development server:
   ```bash
   npm install
   npm run dev
   ```
   Access at `http://localhost:5173`.

---

## Verification & Testing Guide

### 1. Backend Unit & Service Tests
Navigate into `backend/` and run the JUnit/Mockito test suite:
```bash
mvn test
```

### 2. Playwright E2E Tests
To run E2E browser tests, make sure both frontend and backend are running, then navigate to `e2e/`, install dependencies, and run:
```bash
npm install
npx playwright install chromium
npx playwright test
```

---

## Seed Accounts Reference
The database seeder automatically initializes the system with these credentials:
- **Email:** `employee@aseuro.com`
- **Password:** `password`
- **Role:** `ROLE_EMPLOYEE`
