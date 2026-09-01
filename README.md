# Performance Management System - HR Module

A production-oriented HR slice for the shared PMS application. This repository intentionally contains only HR login, JWT-secured HR navigation, dashboard summaries/activity, and employee creation. Manager, Employee, and Admin modules are reserved for future team contributions.

## Architecture

`frontend` is a JavaScript React/Vite client. `backend` is a Java 17 Spring Boot REST service. PostgreSQL remains the source of truth; Hibernate is configured with `ddl-auto: validate` and no migrations or replacement schema are included.

## Features

- `/hr/login`: frontend validation, loading/error states, email or employee ID login, password visibility toggle.
- `/hr/dashboard`: HR-only protected route, API-backed summary cards, activity feed, loading skeletons, retry state, logout.
- `/hr/employees/add`: schema-mapped employee form, lookup APIs, client validation, success/error notification.
- BCrypt password verification, JWT expiration, stateless Spring Security, server-side `ROLE_HR` authorization, CORS allow-list.

## Prerequisites

- Java 17+
- Maven 3.9+ (or Maven Wrapper supplied by the team)
- Node.js 20+
- npm 10+
- PostgreSQL 14+
- The shared PMS PostgreSQL schema supplied by the team

## Run

### Frontend

```powershell
cd frontend
Copy-Item .env.example .env
npm install
npm run dev
```

The client runs at `http://localhost:5173`.

### Backend

```powershell
cd backend
mvn clean verify
mvn spring-boot:run
```

Copy the root `.env.example` values into the environment used to start Spring Boot. Never commit real credentials or JWT secrets.

### Database

Create or select the team database (the expected local name is `pms_db`) and execute the shared schema SQL. This module does not create, rename, or alter tables. Point `DB_URL`, `DB_USERNAME`, and `DB_PASSWORD` at that database.

For local testing only, after the shared schema exists, run `backend/src/main/resources/db/dev-seed.sql` with `psql`:

```powershell
psql -h localhost -U postgres -d pms_db -f backend/src/main/resources/db/dev-seed.sql
```

The seed creates an active HR account and lookup records. Login credentials are `hr.demo@company.com` / `Password123!`. Do not use these credentials outside local development. The script uses `pgcrypto` to generate a BCrypt hash and does not store a plain-text password.

## Environment

Backend: `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`, `JWT_EXPIRATION` (milliseconds), and `FRONTEND_URL`.
Frontend: `VITE_API_BASE_URL`.

`JWT_SECRET` must be a long random secret in every non-local environment. JWT claims are limited to subject, role, issue time, and expiry; passwords and hashes are never included.

## API

| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/auth/login` | Public |
| GET | `/api/hr/dashboard/summary` | `ROLE_HR` |
| GET | `/api/hr/dashboard/activity` | `ROLE_HR` |
| GET | `/api/hr/departments` | `ROLE_HR` |
| GET | `/api/hr/teams` | `ROLE_HR` |
| GET | `/api/hr/designations` | `ROLE_HR` |
| GET | `/api/hr/managers` | `ROLE_HR` |
| POST | `/api/hr/employees` | `ROLE_HR` |

Login accepts `{ "identifier": "hr@company.com", "password": "..." }` and returns a Bearer token plus non-sensitive user data. The client attaches that token through an Axios interceptor. Employees and managers receive HTTP 403 for HR APIs; missing or invalid tokens receive HTTP 401.

### Login request

```http
POST http://localhost:8080/api/auth/login
Content-Type: application/json
```

```json
{
	"identifier": "hr.demo@company.com",
	"password": "Password123!"
}
```

Copy `accessToken` from the response for protected requests:

```http
Authorization: Bearer <accessToken>
```

### Add employee request

```http
POST http://localhost:8080/api/hr/employees
Authorization: Bearer <accessToken>
Content-Type: application/json
```

```json
{
	"employeeCode": "EMP002",
	"fullName": "Arun Kumar",
	"email": "arun.kumar@company.com",
	"departmentId": 10,
	"teamId": 20,
	"designationId": 30,
	"managerId": 9101,
	"joiningDate": "2026-08-26",
	"status": "ACTIVE"
}
```

Use the lookup endpoints to obtain IDs instead of assuming these demo IDs in a real database. The backend validates every reference and requires the selected manager to be an active user with role `MANAGER`.

## Shared schema usage

The HR module reads/writes only these existing structures:

- `users`: `id`, `username`, `email`, `password_hash`, `role`, `status`, `last_login_at` and existing audit timestamps.
- `employees`: `id`, `user_id`, `employee_code`, `full_name`, `email`, `department_id`, `team_id`, `designation_id`, `manager_id`, `joining_date`, `status`, `created_at`, `updated_at`.
- `departments`: `id`, `name`, `description`, `status`, `created_at`, `updated_at`.
- `teams`: `id`, `department_id`, `name`, `description`, `status`, `created_at`, `updated_at`.
- `designations`: `id`, `name`, `description`, `status`, `created_at`, `updated_at`.
- `pms_assignments`: read-only pending-review count where status is `HR_REVIEW_PENDING`.

Roles are the existing `user_role` values `HR`, `MANAGER`, and `EMPLOYEE`. Status is the existing `record_status` values `ACTIVE` and `INACTIVE`. No Admin role, roles table, duplicate employee ID, or duplicate workflow table is introduced.

## Validation and errors

The client gives field-level feedback and avoids invalid requests. Bean Validation and service checks repeat required-field, email, duplicate employee code, duplicate email, and enum validation on the server. Errors use a consistent JSON shape with timestamp, status, message, and validation errors. Stack traces, passwords, hashes, and tokens are not returned or logged.

## Team integration

Add future modules under their own route, package, and service namespaces. Keep `/api/hr/**`, `com.company.pms.controller`, and the shared entities/repositories as the integration boundary. Replace lookup query details only when the shared schema contract changes by team agreement. Add the team's Maven Wrapper before CI if Maven is not installed on a developer machine.

## Testing and troubleshooting

The frontend production check is `npm run build`. Backend verification is `mvn clean verify`; Maven must be installed or a wrapper must be added. A backend run requires the real shared PostgreSQL schema and at least one active HR user with a BCrypt `password_hash`. No seed credentials are created by this module.

## Git workflow

Use a feature branch, keep HR changes isolated, run frontend build and backend verification before opening a PR, and coordinate any shared entity/schema changes with the other module owners.
