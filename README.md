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

## 🏛️ System Architecture

[![Ledger Architecture Diagram](docs/architecture.png)](docs/architecture.png)
*🔍 Click the image above to zoom in and explore the full architectural diagram.*

This platform is structured as a full-stack monorepo encompassing a Node.js API gateway and a React SPA, driven by a relational PostgreSQL database to ensure strict ACID compliance for inventory and sales ledgers.

---

## 🎯 Core Modules & Implementation Status

We have strictly adhered to the business requirements, delivering a complete suite of interconnected modules:

### 1. 🔐 Authentication & Roles (100% Complete)
Secure, stateless JWT-based authentication system with strict Role-Based Access Control (RBAC).
- **Supported Roles:** `Admin`, `Sales`, `Warehouse`, `Accounts`.
- **Implementation:** Middleware validates tokens on every request and restricts endpoint access based on the user's role (e.g., only Admin/Warehouse can adjust stock, only Sales/Admin can create Challans).

### 2. 🤝 Customer CRM Module (100% Complete)
A comprehensive CRM system to track and nurture leads into active wholesale clients.
- **Data Points Tracked:** Customer Name, Mobile Number, Email, Business Name, GST Number (Optional), Customer Type (Retail, Wholesale, Distributor), Address, Status (Lead, Active, Inactive), Next Follow-up Date, and specialized Notes.
- **Features:** 
  - Advanced search and filtering by customer status and type.
  - Dedicated Customer Detail Pages showing interaction history.
  - Interactive Follow-up Logging to nurture leads.

### 3. 📦 Product & Inventory Module (100% Complete)
Real-time, ledged-based stock tracking system to prevent overselling.
- **Data Points Tracked:** Product Name, SKU/Code, Category, Unit Price, Current Stock, Minimum Stock Alert Quantity, Location/Warehouse.
- **Features:**
  - Automated Low-Stock Alerts generated on the dashboard.
  - Granular Stock Movement Ledgers (tracking every addition and deduction).
  - Categorization and SKU-based fast searching.

### 4. 🛒 Order / Sales Module (100% Complete)
A robust transaction engine that connects CRM with Inventory.
- **Features:**
  - **Create Sales Challans:** Dynamically add products, auto-calculate subtotals, GST, and grand totals.
  - **Stock Automation:** Upon confirming a Challan, stock is automatically and transactionally deducted from the warehouse.
  - **Status Tracking:** Track orders through `DRAFT`, `CONFIRMED`, `SHIPPED`, and `DELIVERED` states.
  - **Payment Integration:** Track whether a challan is `PENDING`, `PARTIAL`, or `PAID`.

### 5. 📊 Reporting & Analytics Module (100% Complete)
A powerful dashboard providing immediate operational visibility.
- **Features:**
  - **Total Revenue & Sales:** Real-time calculation of generated revenue across all timeframes.
  - **Low Stock Alerts:** Instant visibility into products requiring re-ordering.
  - **Recent Orders:** A live feed of the latest sales challans.
  - **Customer Metrics:** Breakdown of active customers and leads.

---

## 💻 Tech Stack & Engineering Choices

### The Frontend (Client-side)
* **React 19 & Vite:** Lightning-fast HMR and optimized production builds.
* **TypeScript:** End-to-end type safety eliminating runtime errors.
* **Tailwind CSS:** A bespoke, ultra-premium black-on-black minimalist design system. No generic component libraries used.
* **React Query:** Powerful async state management and caching.

### The Backend (Server-side)
* **Node.js & Express.js:** Industry standard, robust REST API architecture.
* **PostgreSQL:** Relational database chosen for its strict data integrity constraints.
* **Prisma ORM:** Type-safe database client ensuring our TypeScript types perfectly match the database schema.
* **Zod:** Strict runtime validation for all incoming API requests to prevent malformed data.

---

## 🛠️ Local Development Setup

### Prerequisites
* **Node.js** (v20.x or higher)
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

<div align="center">
  <p><em>Built with precision for modern enterprise operations.</em></p>
</div>
