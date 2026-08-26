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
