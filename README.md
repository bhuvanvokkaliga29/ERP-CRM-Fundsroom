<div align="center">
  <h1>⚡ Ledger — Enterprise ERP & CRM Operations Portal</h1>
  <p><strong>A production-grade, full-stack enterprise operations platform designed for wholesale and distribution businesses.</strong></p>

  [![Node.js CI](https://github.com/bhuvanvokkaliga29/ERP-CRM-Fundsroom/actions/workflows/ci.yml/badge.svg)](https://github.com/bhuvanvokkaliga29/ERP-CRM-Fundsroom/actions/workflows/ci.yml)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
</div>

<br />

> **Ledger** seamlessly bridges Customer Relationship Management (CRM), Inventory Control, and Financial Operations into a single, high-performance interface. Designed with enterprise-grade architecture, it guarantees transactional integrity, strict role-based access, and real-time operational visibility.

---

## 🚀 Live Demo & Links

- **GitHub Repository:** [bhuvanvokkaliga29/ERP-CRM-Fundsroom](https://github.com/bhuvanvokkaliga29/ERP-CRM-Fundsroom)
- **Live Frontend (Vercel):** [https://erp-crm-fundsroom-three.vercel.app](https://erp-crm-fundsroom-three.vercel.app)
- **Live Backend API (Render):** [https://erp-crm-fundsroom-6lbo.onrender.com](https://erp-crm-fundsroom-6lbo.onrender.com)
- **API Documentation (Swagger UI):** [https://erp-crm-fundsroom-6lbo.onrender.com/api/docs](https://erp-crm-fundsroom-6lbo.onrender.com/api/docs)

## 🔐 Test Login Credentials

This application features a dual-environment architecture using PostgreSQL schema-based isolation.

### 1. Main Production Environment (Empty)
This is a clean slate instance for judges to test adding data from scratch. 
- **Admin**: `admin@ledger.test` / `password123`

### 2. Demo Prototype Environment (Mock Data)
This environment is pre-filled with hundreds of mock records so you can immediately see the UI in action. You can log into this environment instantly using the **One-Click Demo Login** buttons on the login page!

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** *(Full Access)* | `admin@ledger.test` | `password123` |
| **Sales** *(CRM & Orders)* | `sales@ledger.test` | `password123` |
| **Warehouse** *(Inventory)* | `warehouse@ledger.test` | `password123` |
| **Accounts** *(Finance)* | `accounts@ledger.test` | `password123` |

---

## 🏛️ System Architecture

[![Ledger Architecture Diagram](https://raw.githubusercontent.com/bhuvanvokkaliga29/ERP-CRM-Fundsroom/main/docs/architecture.png)](https://raw.githubusercontent.com/bhuvanvokkaliga29/ERP-CRM-Fundsroom/main/docs/architecture.png)
*(Click the image to zoom in)*

### Architecture Overview
This platform is structured as a decoupled, full-stack enterprise architecture:
1. **Frontend Presentation Layer (React + Vite):** A highly responsive, stateless SPA deployed on Vercel Edge Network. It handles client-side routing, RBAC UI enforcement, and real-time state caching using React Query.
2. **Backend API Gateway (Node.js + Express):** A monolithic RESTful API deployed on Render. It validates all incoming requests using Zod, enforces JWT-based authorization, and handles business logic orchestration.
3. **Database Layer (PostgreSQL):** A strictly relational database (hosted on Render) ensuring ACID compliance for critical financial and inventory ledgers. It is interfaced securely via the Prisma ORM.

---

## 🎯 Core Modules & Features

### 1. 🔐 Authentication & Roles (100% Complete)
Secure, stateless JWT-based authentication system with strict Role-Based Access Control (RBAC). Middleware validates tokens on every request and restricts endpoint access based on the user's role.

### 2. 🤝 Customer CRM Module (100% Complete)
A comprehensive CRM system to track and nurture leads into active wholesale clients. Includes interactive follow-up logging, lead status tracking, and advanced filtering.

### 3. 📦 Product & Inventory Module (100% Complete)
Real-time, ledged-based stock tracking system to prevent overselling. Includes automated low-stock alerts, category management, and granular stock movement ledgers.

### 4. 🛒 Order / Sales Module (100% Complete)
A robust transaction engine that connects CRM with Inventory. Dynamically create Sales Challans, auto-calculate totals, and transactionally deduct stock upon confirmation.

### 5. 📊 Reporting & Analytics Module (100% Complete)
A powerful dashboard providing immediate operational visibility, including Total Revenue, Low Stock Alerts, and Recent Order feeds.

---

## 💻 Tech Stack

### The Frontend (Client-side)
* **React 19 & Vite:** Lightning-fast HMR and optimized production builds.
* **TypeScript:** End-to-end type safety eliminating runtime errors.
* **Tailwind CSS:** A bespoke, ultra-premium black-on-black minimalist design system.
* **React Query:** Powerful async state management and caching.

### The Backend (Server-side)
* **Node.js & Express.js:** Industry standard, robust REST API architecture.
* **PostgreSQL:** Relational database chosen for its strict data integrity constraints.
* **Prisma ORM:** Type-safe database client.
* **Swagger/OpenAPI:** Auto-generated interactive API documentation.

---

## 🛠️ Local Setup & Deployment Instructions

### Prerequisites
* **Node.js** (v20.x or higher)
* **Docker Desktop** (for local PostgreSQL orchestration)

### Local Development

1. **Database Initialization**
   Spin up the PostgreSQL instance using Docker Compose:
   ```bash
   docker-compose up -d
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   npx prisma migrate dev
   npm run db:seed
   npm run dev
   ```
   *API runs on `http://localhost:3000`*

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   npm run dev
   ```
   *Frontend runs on `http://localhost:5173`*

### Production Deployment

#### 1. Deploying the Backend & Database (Render)
1. Create a New PostgreSQL database on Render.
2. Create a New Web Service connected to the `backend` root directory.
3. Set Build Command: `npm install --include=dev && npx prisma generate && npm run build`
4. Set Start Command: `npx prisma db push --accept-data-loss && npm start`
5. Add Environment Variables: `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`, `PORT=10000`.

#### 2. Deploying the Frontend (Vercel)
1. Import the repository into Vercel.
2. Set the Root Directory to `frontend`.
3. Set Framework Preset to `Vite`.
4. Add Environment Variable: `VITE_API_URL` pointing to your Render backend URL (e.g. `https://your-api.onrender.com/api/v1`).
5. Deploy.

---

<div align="center">
  <p><em>Built with precision for modern enterprise operations.</em></p>
</div>
