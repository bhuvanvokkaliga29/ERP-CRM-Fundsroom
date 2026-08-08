# ⚡ Ledger — Enterprise ERP & CRM Operations Portal

[![Node.js CI](https://github.com/bhuvanvokkaliga29/Trust-builders-replit/actions/workflows/ci.yml/badge.svg)](https://github.com/bhuvanvokkaliga29/Trust-builders-replit/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Code Style: Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://prettier.io/)

> **Ledger** is a production-grade, full-stack enterprise operations platform designed for wholesale and distribution businesses. It seamlessly bridges Customer Relationship Management (CRM), Inventory Control, and Financial Operations into a single, high-performance interface.

---

## 🎯 Architectural Philosophy

This project was built with a strict adherence to **enterprise engineering standards**, prioritizing scalability, type-safety, and maintainability. It avoids "magic" abstractions in favor of explicit, readable, and highly optimized code.

### The Stack
* **Frontend**: React 19, TypeScript, Vite, Tailwind CSS (Custom Design System), React Query, Lucide Icons.
* **Backend**: Node.js, Express.js, TypeScript, Zod (Validation), JWT (Stateless Auth).
* **Database**: PostgreSQL (Relational integrity) + Prisma ORM (Type-safe database client).
* **Infrastructure**: Docker & Docker Compose for guaranteed environment parity.

---

## 🚀 Key Features & Capabilities

### 🛡️ Security & Authentication
* **Stateless JWT Architecture**: Secure, http-only cookie alternatives and local-storage token management.
* **Role-Based Access Control (RBAC)**: Strict API middleware ensuring `ADMIN` vs `USER` boundary enforcement.
* **Input Validation**: Edge-to-edge type safety and runtime validation using `Zod` to prevent injection and malformed data.
* **Audit Logging**: Comprehensive tracking of sensitive actions (Authentication, Stock Adjustments, Challan Confirmations).

### 💼 Business Logic & Operations
* **CRM & Follow-ups**: Intelligent tracking of customer health, revenue contribution, and scheduled follow-up actions.
* **Inventory Management**: Real-time stock tracking with automated low-stock threshold alerts and ledger-style movement history.
* **Sales Challans**: End-to-end lifecycle (Draft ➔ Confirmed) with transactional database operations to guarantee stock integrity.
* **Applied AI Copilot**: A read-only, data-grounded AI assistant capable of analyzing the live database to surface immediate business risks and summaries.

### 🎨 Design Engineering
* **Custom Design System**: Abandoned standard component libraries (like MUI or Bootstrap) in favor of a bespoke, premium black-on-black monochrome aesthetic.
* **Data-Dense UIs**: Optimized for professionals who need high information density without visual clutter.

---

## 🏗️ Repository Structure

This repository is structured as a monolithic repository (monorepo) managing two distinct micro-applications:

```text
.
├── backend/                  # Node.js API Service
│   ├── prisma/               # Database schemas & migrations
│   ├── src/
│   │   ├── controllers/      # Route handlers
│   │   ├── middlewares/      # Auth, RBAC, Validation
│   │   ├── routes/           # Express router definitions
│   │   └── index.ts          # Server entry point
├── frontend/                 # React SPA
│   ├── src/
│   │   ├── components/       # Reusable UI primitives
│   │   ├── contexts/         # Global state (Auth)
│   │   ├── pages/            # Feature-level views
│   │   └── lib/              # Axios interceptors, utils
├── docs/                     # Architecture & API documentation
├── .github/workflows/        # CI/CD Pipelines
├── docker-compose.yml        # Multi-container orchestration
└── Makefile                  # Developer workflow automation
```

---

## 🛠️ Local Development Setup

### Prerequisites
* **Node.js** (v18 or higher)
* **Docker Desktop** (for PostgreSQL orchestration)

### 1. Database Initialization
Spin up the PostgreSQL instance using Docker Compose:
```bash
docker-compose up -d
```

### 2. Backend Setup
```bash
cd backend
npm install

# Setup environment variables
cp .env.example .env

# Run database migrations & seed initial data
npx prisma migrate dev
npm run seed

# Start the API server
npm run dev
```
*The backend will run on `http://localhost:3000`*

### 3. Frontend Setup
Open a new terminal window:
```bash
cd frontend
npm install

# Setup environment variables
cp .env.example .env

# Start the Vite development server
npm run dev
```
*The frontend will run on `http://localhost:5173`*

---

## 🧪 Default Credentials
To access the platform locally, use the seeded admin credentials:
- **Email:** `admin@ledger.test`
- **Password:** `password123`

---

## 📈 Next Steps & Roadmap
- [ ] Implement Redis for response caching on heavy analytics endpoints.
- [ ] Add robust unit and integration testing suite (Jest + Supertest).
- [ ] Integrate a background job queue (BullMQ) for heavy PDF generation.
- [ ] E2E Testing with Playwright.

---
*Built with precision for modern operations.*
