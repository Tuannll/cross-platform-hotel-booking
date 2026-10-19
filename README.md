<div align="center">

# 🏨 NoWayHome

**Cross-Platform Hotel Booking System (Web & Mobile) — Academic Capstone Project**  
*Built with NestJS 11, React 18/19, Expo SDK 54, and PostgreSQL 16*

[![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11.x-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com/)
[![React](https://img.shields.io/badge/React-18%20%2F%2019-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Expo](https://img.shields.io/badge/Expo-54-000020?logo=expo&logoColor=white)](https://expo.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Postgres%2016-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-UNLICENSED-lightgrey)](LICENSE)

**English** | [Tiếng Việt](README.vi.md)

**[📌 Overview](#overview) • [✨ Features](#features) • [🏛️ Architecture](#architecture) • [🛠️ Tech Stack](#tech-stack) • [⚡ Quick Start](#quick-start) • [🌐 Access Endpoints](#endpoints) • [🧪 Testing](#testing) • [📁 Directory Structure](#structure) • [❓ FAQ](#faq)**

</div>

---

<a id="overview"></a>
## 📌 Overview

**NoWayHome** is an end-to-end, cross-platform hotel reservation system supporting Web and Mobile clients, designed as an academic capstone project. The system provides unified workflows for three distinct user groups: **Customers** (Web & Mobile App), **Hotel Partners** (Partner Portal), and **Administrators** (Admin Portal).

The platform enforces strict layered architecture, concurrency-safe inventory controls preventing double bookings, secure session management with server-side revocation, and automated E2E testing executed against isolated PostgreSQL instances.

> [!NOTE]
> The payment module operates as a **Demo Simulation** intended for academic demonstration. The system does not process real payment cards, does not integrate production banking gateways, and incurs zero monetary charges.

---

<a id="features"></a>
## ✨ Features

| Subsystem | Target User | Key Capabilities |
| --------- | ----------- | ---------------- |
| **Mobile App (Expo)** | Customers | Search accommodations, apply filters, inspect room details, redeem promotional vouchers, complete demo bookings & simulated payments, manage itineraries, submit reviews. |
| **Web Customer** | Customers | Register, authenticate, search hotels by geographic region, review dynamic daily pricing, and book online. |
| **Web Partner** | Hotel Partners | List properties, configure room types, manage `DailyRate` pricing tables, process incoming reservations, issue discount vouchers & promotional codes. |
| **Web Admin** | Administrators | Monitor revenue analytics, audit and approve/reject partner registrations, manage system users and global vouchers, moderate property reviews. |
| **Backend Core** | Core Services | NestJS 11 + Prisma ORM, granular RBAC guards, JWT session revocation, pessimistic inventory locking against race conditions, isolated database E2E testing. |

---

<a id="architecture"></a>
## 🏛️ Architecture & Data Safety

### 1. Functional Module Decomposition

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        NOWAYHOME HOTEL SYSTEM                          │
├─────────────┬─────────────┬──────────────┬──────────────┬──────────────┤
│  Auth &     │  Properties │   Bookings   │   Payments   │   Vouchers   │
│  RBAC/JWT   │   & Rooms   │ & Concurrency│    (Demo)    │ & Promotions │
└─────────────┴─────────────┴──────────────┴──────────────┴──────────────┘
```

### 2. Runtime Topology

```text
                      [ Customers / Partners / Administrators ]
                                          │
                ┌─────────────────────────┼─────────────────────────┐
                ▼                         ▼                         ▼
       ┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
       │   Mobile App    │       │ 3x Web Portals  │       │   API Docs UI   │
       │  (Expo SDK 54)  │       │ (Admin/Partner/ │       │  (Swagger UI)   │
       │    Port 8081    │       │    Customer)    │       │    Port 3001    │
       └────────┬────────┘       └────────┬────────┘       └────────┬────────┘
                │ Ports 5173-5175         │                         │
                └─────────────────────────┼─────────────────────────┘
                                          │ REST API / JWT
                                          ▼
                             ┌─────────────────────────┐
                             │   Backend API (NestJS)  │
                             │       Port 3001         │
                             └────────────┬────────────┘
                                          │ Prisma ORM
                                          ▼
                             ┌─────────────────────────┐
                             │  PostgreSQL 16 (Docker) │
                             │       Port 5433         │
                             └─────────────────────────┘
```

### 3. Core Data Safety Principles

- **Strict Concurrency Safety**: Reservation transactions acquire pessimistic row locks (`FOR UPDATE`) on the `daily_rates` table and execute conditional atomic increments on voucher usage quotas, completely preventing over-booking and voucher budget race conditions under concurrent load.
- **Test Database Isolation**: E2E test suites run against a dedicated database named `nowayhome_test`. Pre-flight test scripts strictly verify the presence of the `nowayhome_test` suffix before executing migrations or truncation, guaranteeing zero risk to development data.
- **Session Revocation**: JWT access tokens are bound to active server-side `sessionId` records. When a user logs out, the session is invalidated immediately, revoking access token validity across all clients.
- **Strict CORS Policy**: Only explicitly whitelisted client origins declared in `CORS_ORIGINS` are permitted to transmit authentication credentials and session cookies.

---

<a id="tech-stack"></a>
## 🛠️ Tech Stack

| Layer / Domain | Technology | Purpose & Implementation |
|---|---|---|
| **Backend Core** | [NestJS 11](https://nestjs.com/) + TypeScript | Modular RESTful architecture, RBAC authorization guards, Swagger OpenAPI |
| **ORM & Database** | [Prisma ORM](https://www.prisma.io/) + [PostgreSQL 16](https://www.postgresql.org/) | Type-safe queries, migration management, row-level pessimistic locking |
| **Web Customer** | [React 19](https://react.dev/) + [Vite](https://vitejs.dev/) + Tailwind CSS | Online hotel discovery and booking client for end-users |
| **Web Partner** | [React 18](https://react.dev/) + [Vite](https://vitejs.dev/) + Tailwind CSS | Property management, inventory allocation, and rate calendar portal |
| **Web Admin** | [React 18](https://react.dev/) + [Vite](https://vitejs.dev/) + Tailwind CSS | Operations portal: partner approvals, system oversight, revenue metrics |
| **Mobile Application** | [React Native](https://reactnative.dev/) + [Expo SDK 54](https://expo.dev/) | Cross-platform native mobile experience for iOS and Android |
| **State & Data Fetching** | [TanStack React Query v5](https://tanstack.com/query) + [Zustand](https://zustand-demo.pmnd.rs/) | Server-state caching, network synchronization, global client stores |
| **DevOps & Workspace** | [Docker Compose](https://www.docker.com/) + pnpm workspaces | Containerized PostgreSQL, monorepo dependency management |
| **Testing Strategy** | Jest, Supertest, TSX | Isolated unit testing and real PostgreSQL E2E database verification |

---

<a id="quick-start"></a>
## ⚡ Quick Start

### 1. Prerequisites

- **Node.js**: `>= 20.x` (recommended `22.x`)
- **pnpm**: `>= 10.x` (recommended `11.x`)
- **Docker Desktop**: Running with Linux containers enabled for PostgreSQL

```powershell
node --version
pnpm --version
docker --version
```

### 2. Environment Configuration

Install dependencies and duplicate default configuration templates:

```powershell
pnpm install
copy backend\.env.example backend\.env
```

Minimum configuration required in `backend/.env`:

```env
DATABASE_URL="postgresql://nowayhome:nowayhome@127.0.0.1:5433/nowayhome?schema=public"
JWT_ACCESS_SECRET="nowayhome_super_secure_access_secret_demo_key_2026"
JWT_REFRESH_SECRET="nowayhome_super_secure_refresh_secret_demo_key_2026"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=3001
DEMO_PAYMENTS_ENABLED=true
CORS_ORIGINS="http://localhost:5173,http://localhost:5174,http://localhost:5175"
```

---

### 3. Database Initialization & Seeding

> [!TIP]
> Execute the end-to-end setup (spin up Docker container, apply database migrations, seed sample records, and execute automated validation tests) with a **single command**:
> ```powershell
> .\setup-and-verify.bat
> ```

Manual step-by-step setup:

```powershell
# 1. Start PostgreSQL Docker container on host port 5433
docker compose -f backend/docker-compose.yml up -d postgres

# 2. Generate Prisma Client
pnpm --filter backend exec prisma generate --schema prisma/schema.prisma

# 3. Apply schema migrations
pnpm --filter backend exec prisma migrate deploy --schema prisma/schema.prisma

# 4. Populate initial seed dataset
pnpm --filter backend run seed
```

#### 🔑 Pre-configured Demo Accounts (Default Password: `Password123!`):

| Role | Email | Permissions |
| ---- | ----- | ----------- |
| **Administrator** | `admin@nowayhome.local` | Full administrative oversight, partner approval, analytics |
| **Hotel Partner** | `partner@nowayhome.local` | Manage assigned hotels, configure rooms, update pricing & vouchers |
| **Customer** | `customer@nowayhome.local` | Search listings, book rooms, apply discounts, write reviews |

---

### 4. Running the Applications

> [!TIP]
> Launch all services simultaneously (Backend API + 3 Web Portals + Expo Mobile Metro) using:
> ```powershell
> .\start-all.bat
> ```

Or start individual services across separate terminal instances:

```powershell
# 1. Backend API (Port 3001)
pnpm --filter backend run start:dev

# 2. Web Admin (Port 5173)
pnpm --filter webadmin run dev

# 3. Web Partner (Port 5174)
pnpm --filter webpartner run dev

# 4. Web Customer (Port 5175)
pnpm --filter fe-web-user run dev

# 5. Mobile App Metro Bundler (Port 8081)
cd mobile-app
npx expo start
```

---

<a id="endpoints"></a>
## 🌐 Access Endpoints

| Application / Service | URL | Port | Description & Default Credentials |
|---|---|---|---|
| **Web Admin** | [http://localhost:5173](http://localhost:5173) | `5173` | Admin dashboard (`admin@nowayhome.local` / `Password123!`) |
| **Web Partner** | [http://localhost:5174](http://localhost:5174) | `5174` | Partner portal (`partner@nowayhome.local` / `Password123!`) |
| **Web Customer** | [http://localhost:5175](http://localhost:5175) | `5175` | Customer booking portal (`customer@nowayhome.local` / `Password123!`) |
| **Backend REST API** | [http://localhost:3001](http://localhost:3001) | `3001` | Core REST API service |
| **Swagger API Docs** | [http://localhost:3001/api-docs](http://localhost:3001/api-docs) | `3001` | Interactive OpenAPI / Swagger interface |
| **Health Check API** | [http://localhost:3001/api/healthz](http://localhost:3001/api/healthz) | `3001` | Server and database health check endpoint |
| **Mobile Expo Metro** | [http://localhost:8081](http://localhost:8081) | `8081` | Expo Metro development bundler |

---

<a id="testing"></a>
## 🧪 Testing & Quality Assurance

Run all validation checks (Unit tests, TypeScript typechecks, Web builds) with a single command:

```powershell
pnpm run check
```

Or trigger specific test targets:

```powershell
# 1. Backend Unit Tests
pnpm --filter backend run test

# 2. E2E Tests on dedicated PostgreSQL instance
$env:TEST_DATABASE_URL="postgresql://nowayhome:nowayhome@127.0.0.1:5433/nowayhome_test?schema=public"
pnpm --filter backend run test:e2e:prepare
pnpm --filter backend run test:e2e

# 3. TypeScript & Linting verification
pnpm --filter backend run typecheck
pnpm --filter nowayhome-web run typecheck
npm --prefix mobile-app run lint
npm --prefix mobile-app run typecheck

# 4. Production builds for all Web Apps
pnpm run build:web
```

---

<a id="structure"></a>
## 📁 Directory Structure

```text
cross-platform-hotel-booking/
├── backend/                  # NestJS 11 REST API
│   ├── prisma/               # Schema definitions, migrations, seed script
│   ├── src/                  # Core modules: auth, bookings, properties, vouchers, payments...
│   ├── test/e2e/             # Automated E2E test suite running on live PostgreSQL
│   └── docker-compose.yml    # PostgreSQL 16 container definition
├── web/
│   └── apps/
│       ├── admin/            # React + Vite (Admin Portal)
│       ├── partner/          # React + Vite (Partner Portal)
│       └── customer/         # React + Vite (Customer Portal)
├── mobile-app/               # React Native + Expo SDK 54 (Mobile Client)
├── setup-and-verify.bat      # One-click complete system verification script
├── start-all.bat             # Automated multi-service launch script
└── stop-all.bat              # Graceful shutdown script for all processes
```

---

<a id="faq"></a>
## ❓ FAQ

<details>
<summary><b>1. How do I reset the entire database back to default seed data?</b></summary>
<br/>

Run the seeding command:
```powershell
pnpm --filter backend run seed
```
The script will truncate non-static records and recreate default user accounts, hotels, room categories, and promotional vouchers.
</details>

<details>
<summary><b>2. Why is PostgreSQL mapped to port 5433 instead of 5432?</b></summary>
<br/>

Port `5433` avoids conflicts with existing native PostgreSQL instances running on port `5432` on evaluator or contributor workstations, ensuring reliable execution without reconfiguring local database services.
</details>

<details>
<summary><b>3. How can I quickly verify the booking and payment workflow?</b></summary>
<br/>

Sign in as Customer (`customer@nowayhome.local`), select *Khách sạn Hà Nội Luxury & Spa*, choose dates, apply voucher `SUMMER2026`, and confirm demo payment. The booking will transition immediately to **Confirmed**.
</details>

---

## 🔒 Security & Dependency Notes

- **Backend & Web**: Managed via `pnpm workspace`; all typechecks and production builds pass in CI.
- **Mobile Expo**: `npm audit --omit=dev` flags standard upstream transitive advisories from Expo CLI / Metro / Babel SDK 54. Do not execute `npm audit fix --force` as it downgrades core Expo packages and causes runtime incompatibilities.
- **Code Quality**: `npm run lint` and `npm run typecheck` in `mobile-app` pass with zero errors.

---

<a id="license"></a>
## 📄 License

`UNLICENSED` — Developed strictly for academic and educational evaluation purposes.
