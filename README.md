<<<<<<< HEAD
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
=======
# PMS-ASEURO - Performance Management System (Login & Role Authentication Module)

A role-based Performance Management System (PMS) authentication and management system built with **Spring Boot 3.3.2 (Java 21/17)**, **React 19 + TypeScript + Vite**, and **PostgreSQL**.

---

## 🌟 Key Features

1. **Role-Based Dynamic Authentication (No Role Selector)**:
   - Login page takes **Email** and **Password** only.
   - User role (`HR`, `MANAGER`, `EMPLOYEE`) is dynamically fetched from the PostgreSQL `users` table after BCrypt password verification.
   - Users are seamlessly routed to their respective role-specific dashboard.

2. **HR Setup & Provisioning Workspace (`aishwarya.logaraj@aseuro.in`)**:
   - Bootstrap HR user can provision new Managers and Employees.
   - Creates login credentials in PostgreSQL `users` and profiles in `employees`.
   - Populates Department, Designation, and Reporting Manager dropdowns dynamically.
   - When newly created employees or managers log in, the system automatically authenticates them and directs them to their workspace.

3. **Enterprise Security & FRD Compliance**:
   - Password criteria validation (min 8 characters, alphabets, numbers, and special characters).
   - 5 failed attempts lockout protection (15-minute lockout) with exact FRD error messages.
   - Stateless JWT authentication with Spring Security method protection.

---

## 🔐 Default Seeded Accounts

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **HR Admin** | `aishwarya.logaraj@aseuro.in` | `Aseuro@123` | Primary HR with Setup Workspace & Provisioning |
| **Manager** | `manager@aseuro.in` | `Manager@123` | Engineering Manager (Rajesh Sharma) |
| **Employee** | `employee@aseuro.in` | `Employee@123` | Software Engineer (Kiran Kumar) |

---

## 🛠️ Tech Stack & Database Configuration

- **Database**: PostgreSQL 17
  - **Database Name**: `pms_db`
  - **User**: `postgres`
  - **Password**: `root`
  - **Port**: `5432`
  - **Schema**: Shared schema with `users`, `employees`, `departments`, `designations`, `teams`, `kpis`, and views.
- **Backend**: Java 21 / 17, Spring Boot 3.3.2, Spring Security 6, JWT, JPA / Hibernate, BCrypt (Port: `8081`)
- **Frontend**: React 19, TypeScript, Vite (Port: `5173`)

---

## 🚀 How to Run Locally

### 1. Database Setup
Ensure PostgreSQL is running locally with `pms_db`. The schema is defined in `db/init.sql` or `PMS_shared_schema (3).sql`.

### 2. Run Backend
```powershell
cd backend
mvn clean compile
mvn spring-boot:run
```
*Backend starts on `http://localhost:8081`.*

### 3. Run Frontend
```powershell
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173`.*

---

## 🧪 Verification & Testing Flow

1. Open **`http://localhost:5173`** in your browser.
2. Click **"HR Setup"** or log in with `aishwarya.logaraj@aseuro.in` / `Aseuro@123`.
3. In the HR Portal:
   - Go to **"Add Employees & Managers"**.
   - Create a new Manager (e.g. `sneha.manager@aseuro.in` / `Password@123`) or Employee.
4. Log out and log in with the new manager's credentials.
5. The system automatically fetches their role from PostgreSQL and redirects to the **Manager Portal**!
>>>>>>> 7e242a5ead40c3cafff0fc936fda8630cb8d09d3
