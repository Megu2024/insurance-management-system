# SureGuard — Enterprise Insurance Management System (IMS)

A full-stack, enterprise-grade Insurance Management System built for robust DBMS operations, academic excellence, and production-ready portfolio presentation. The system implements a 16-entity normalized relational database in PostgreSQL, a modular Node.js/Express backend with JWT authentication and strict Role-Based Access Control (RBAC), and a dynamic React 19 / Vite single-page application.

---

## 🌐 Live Cloud Deployment
* **Backend API (Render)**: [`https://insurance-management-system-vylp.onrender.com`](https://insurance-management-system-vylp.onrender.com)
* **API Health Check**: [`https://insurance-management-system-vylp.onrender.com/`](https://insurance-management-system-vylp.onrender.com/)
* **Cloud Database Engine**: PostgreSQL 16 on **[Neon.tech](https://neon.tech)** (Serverless Cloud DB with Connection Pooling)
* **Frontend Hosting**: Optimized for **[Vercel](https://vercel.com)** / **Render Static Sites** with SPA rewrite routing rules included (`vercel.json` & `_redirects`).

---

## 📑 Table of Contents
1. [Live Cloud Deployment](#-live-cloud-deployment)
2. [System Overview & Architecture](#-system-overview--architecture)
3. [Key Capabilities & Features](#-key-capabilities--features)
4. [Technology Stack](#-technology-stack)
5. [Relational Database Design (DBMS)](#-relational-database-design-dbms)
6. [Role-Based Access Control & Approval Workflows](#-role-based-access-control--approval-workflows)
7. [Project Structure](#-project-structure)
8. [Installation & Setup Guide](#-installation--setup-guide)
9. [Database Seeding & Default Credentials](#-database-seeding--default-credentials)
10. [Running the Application](#-running-the-application)
11. [Automated Testing](#-automated-testing)
12. [Cloud Deployment Guide (Neon, Render, Vercel)](#-cloud-deployment-guide-neon-render-vercel)
13. [API Reference Summary](#-api-reference-summary)

---

## 🏛 System Overview & Architecture

SureGuard connects policyholders, insurance agents, field surveyors, and corporate administrators under a unified, secure platform:

```
┌────────────────────────────────────────────────────────┐
│                   React 19 + Vite                      │
│      (Tailored Dashboards, Modals, Forms, RBAC)       │
└───────────────────────────┬────────────────────────────┘
                            │ Axios (JWT Bearer Token)
                            ▼
┌────────────────────────────────────────────────────────┐
│               Node.js + Express 5 Backend              │
│  ┌──────────────────────────────────────────────────┐  │
│  │   Auth Middleware (authenticateToken, requireRole)│  │
│  └────────────────────────┬─────────────────────────┘  │
│                           │                            │
│  ┌────────────────────────▼─────────────────────────┐  │
│  │   Modular Controllers (15+ Business Domains)     │  │
│  └────────────────────────┬─────────────────────────┘  │
└───────────────────────────┼────────────────────────────┘
                            │ Parameterized SQL Queries (pg Pool)
                            ▼
┌────────────────────────────────────────────────────────┐
│             PostgreSQL 14+ Relational Engine           │
│  16 Tables • Sequences • Audit Triggers • Views • FKs  │
└────────────────────────────────────────────────────────┘
```

---

## 🌟 Key Capabilities & Features

### 1. Multi-Role Portals
- **System Administrator**: Global overview, user governance, pending agent/surveyor approval portal, full CRUD across all 15+ business entities, branch oversight, and real-time aggregate statistics.
- **Customer (Policyholder)**: Self-service portal to view active policies, submit and track claims, verify premium payment history, register nominees, and submit identification documents.
- **Insurance Agent**: Manage assigned clients, issue policies, track policyholder claims, verify premium statuses, and view linked branch performance.
- **Field Surveyor**: Inspect filed claims, view medical hospital records, submit damage estimates, and approve or reject claims with custom surveyor recommendations.

### 2. Live PostgreSQL Analytics Dashboard
- Dynamic SQL aggregation calculating live counts: Total Customers, Active Policies, Total Policies, Total Claims, Pending Claims, Registered Agents, Licensed Surveyors, Operating Branches, and Total Premium Collected.
- Role-scoped feeds for recent policies, claims, and transactions.

### 3. Comprehensive Domain Coverage (16 Entities)
- **Core Insurance**: Customers, Policies, Policy Types, Premium Payments, Claims.
- **Insured Asset Specializations (1:1 with Policies)**:
  - *Vehicles*: Registration number, manufacturer, model, engine number.
  - *Properties*: Construction year, market value, usage type, address.
  - *Businesses*: GST number, industry type, annual turnover, employee headcount.
- **Operations & Fieldwork**: Branches, Agents, Surveyors, Hospitals (admission, discharge, and billed costs).
- **Compliance & Security**: Nominees, Verification Documents (Aadhaar, PAN, Passport, Voter ID), Users, and Policy Audit Logs.

---

## 🛠 Technology Stack

### Frontend
- **Framework**: React 19, Vite 8
- **Routing**: React Router v7 (BrowserRouter, Nested Protected Routes, Role Guards)
- **HTTP Client**: Axios with automatic request Bearer token injection
- **Icons**: Lucide React
- **Styling**: Pure Modern CSS (CSS custom properties, glassmorphism, responsive data tables, modals, badges)

### Backend
- **Runtime**: Node.js v20+ / Express 5
- **Database Driver**: `pg` (PostgreSQL connection pool with parameterized queries)
- **Authentication**: `jsonwebtoken` (JWT) + `bcryptjs` (salted password hashing)
- **Security**: CORS, environment variables, ownership verification middleware

### Database
- **Engine**: PostgreSQL
- **Design**: 3NF Normalized schema with Primary Keys, Foreign Keys, Unique 1:1 asset constraints, non-negative income checks, sequences, triggers, and views.

---

## 🗄 Relational Database Design (DBMS)

### Entity-Relationship Architecture
```
[CUSTOMER] 1 ──── ∞ [POLICY] 1 ──── ∞ [PREMIUM_PAYMENT]
   │                   │  │
   │                   │  ├──── 1 ──── 1 [VEHICLE]
   │                   │  ├──── 1 ──── 1 [PROPERTY]
   │                   │  ├──── 1 ──── 1 [BUSINESS]
   │                   │  ├──── 1 ──── ∞ [NOMINEE]
   │                   │  └──── 1 ──── ∞ [CLAIM] 1 ──── 1 [HOSPITAL]
   │                   │                    │
   │                   │                    └─── ∞ ──── 1 [SURVEYOR]
   │                   │
   │                   └─── ∞ ──── 1 [AGENT] ∞ ──── 1 [BRANCH]
   │
   ├──── 1 ──── ∞ [DOCUMENT]
   └──── 1 ──── 1 [USERS]
```

### Table Definitions & Key Schema Highlights
1. **users**: Central authentication table (`user_id`, `email`, `password_hash`, `role`, `status`, `customer_id`, `agent_id`, `surveyor_id`, `created_at`).
2. **customer**: Core client demographics (`customer_id`, `aadhaar_no`, `pan_no`, `dob`, `gender`, `mobile_no`, `email`, `address`, `city`, `state`, `pincode`, `occupation`, `annual_income`, `customer_status`).
3. **policy**: Insurance contracts (`policy_id`, `customer_id`, `policy_type_id`, `start_date`, `end_date`, `premium_amt`, `agent_id`, `policy_no`, `sum_coverage`, `policy_status`, `payment_freq`, `created_date`).
4. **policy_type**: Products catalog (`policy_type_id`, `policy_name`, `category`).
5. **branch**: Office locations (`branch_id`, `branch_name_1`, `phone`, `city`, `state`, `manager_name`).
6. **agent**: Sales force (`agent_id`, `branch_id`, `agent_name`, `mobile_no`, `email`, `license_no`).
7. **surveyor**: Claims loss adjusters (`surveyor_id`, `surveyor_name`, `license_no`, `experience`, `phone`, `email`).
8. **premium_payment**: Financial ledger (`payment_id`, `policy_id`, `payment_date`, `amount`, `payment_status`, `payment_mode`).
9. **claim**: Loss claims (`claim_id`, `policy_id`, `claim_date`, `claim_amount`, `claim_status`, `description`, `surveyor_id`, `approve_amt`).
10. **hospital**: Medical treatment records linked to health claims (`hospital_id`, `hospital_name`, `claim_id`, `city`, `admission_date`, `discharge_date`, `bill_amt`).
11. **vehicle**: Motor insurance assets (`vehicle_id`, `reg_no`, `model`, `policy_id UNIQUE`, `manufacturer`, `engine_no`).
12. **property**: Real-estate insurance assets (`property_id`, `property_type`, `address`, `policy_id UNIQUE`, `city`, `state`, `construction_year`, `market_value`, `usage_type`).
13. **business**: Commercial liability assets (`business_id`, `business_name`, `industry_type`, `address`, `policy_id UNIQUE`, `gst_no`, `annual_turnover`, `employee_count`).
14. **nominee**: Beneficiaries (`nominee_id`, `policy_id`, `nominee_name`, `relationship`, `dob`, `mobile_no`).
15. **document**: KYC records (`document_id`, `customer_id`, `doc_type`, `doc_no`, `verification_status`).
16. **policy_status_audit**: Audit trail automatically logged by trigger on status changes (`audit_id`, `policy_id`, `old_status`, `new_status`, `changed_at`).

---

## 🔒 Role-Based Access Control & Approval Workflows

| Role | Registration Mode | Initial Status | Admin Approval Required? | Login Permitted When |
|---|---|---|---|---|
| **CUSTOMER** | Public Registration Form | `APPROVED` | ❌ No (Instant Access) | Immediately upon signup |
| **AGENT** | Agent Application Form | `PENDING` | ✅ Yes | Only after Admin approves |
| **SURVEYOR** | Surveyor Application Form | `PENDING` | ✅ Yes | Only after Admin approves |
| **ADMIN** | Seeded via CLI / `.env` | `APPROVED` | ❌ No | Immediately |

### Security Enforcement Layers
- **No Role Trusting**: Roles are never accepted blindly from client payloads. Dedicated registration routes enforce the assigned role.
- **Resource Ownership Verification**: Customer routes verify that `req.user.customer_id === target_customer_id` or that the requester is `ADMIN`. Agents can only view clients whose policies they manage.
- **Approval Gate**: Users with `status !== 'APPROVED'` receive an immediate `403 Forbidden` response preventing login or access.

---

## 📁 Project Structure

```
insurance-management-system/
├── backend/
│   ├── config/
│   │   └── db.js                 # PostgreSQL Pool connection
│   ├── controllers/              # 15 domain controllers
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── dashboardController.js
│   │   ├── customerController.js
│   │   ├── policyController.js
│   │   ├── claimController.js
│   │   ├── paymentController.js
│   │   ├── surveyorController.js
│   │   └── ...
│   ├── middleware/
│   │   ├── authMiddleware.js     # authenticateToken, requireRole, requireApproval
│   │   └── errorMiddleware.js    # Global error handler
│   ├── routes/                   # Express modular routes
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── dashboardRoutes.js
│   │   └── ...
│   ├── scripts/
│   │   ├── initDb.js             # DDL execution & sequence synchronization
│   │   ├── seedAdmin.js          # Idempotent programmatic admin bootstrap
│   │   └── testE2eFlow.js        # Automated end-to-end integration test
│   ├── .env                      # Environment config (gitignored)
│   ├── package.json
│   └── server.js                 # Express application root
│
├── frontend/
│   ├── src/
│   │   ├── components/           # Reusable UI library
│   │   │   ├── DataTable.jsx
│   │   │   ├── SearchBar.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── ConfirmDialog.jsx
│   │   │   ├── FormInput.jsx
│   │   │   ├── SelectInput.jsx
│   │   │   ├── StatusBadge.jsx
│   │   │   ├── StatCard.jsx
│   │   │   ├── PageHeader.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   ├── ErrorMessage.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── RoleBasedRoute.jsx
│   │   │   ├── Navbar.jsx
│   │   │   └── Sidebar.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx   # Global auth state, login/logout, tokens
│   │   ├── layouts/
│   │   │   └── MainLayout.jsx    # Responsive grid layout with sidebar & navbar
│   │   ├── pages/                # 18 fully implemented views
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Customers.jsx
│   │   │   ├── Policies.jsx
│   │   │   ├── Payments.jsx
│   │   │   ├── Claims.jsx
│   │   │   ├── Agents.jsx
│   │   │   ├── Surveyors.jsx
│   │   │   ├── Branches.jsx
│   │   │   ├── Hospitals.jsx
│   │   │   ├── Nominees.jsx
│   │   │   ├── Documents.jsx
│   │   │   ├── Vehicles.jsx
│   │   │   ├── Properties.jsx
│   │   │   ├── Businesses.jsx
│   │   │   ├── PolicyTypes.jsx
│   │   │   ├── AdminApprovals.jsx
│   │   │   ├── UserManagement.jsx
│   │   │   └── Profile.jsx
│   │   ├── services/             # 15 Axios API service modules
│   │   │   ├── api.js            # Axios client with interceptor
│   │   │   └── ...
│   │   ├── App.jsx               # React Router configuration
│   │   └── main.jsx
│   ├── .env                      # VITE_API_URL
│   └── package.json
│
├── database/
│   └── schema.sql                # Complete PostgreSQL DDL
├── API.md                        # Full REST API documentation
└── README.md
```

---

## 🚀 Installation & Setup Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [PostgreSQL](https://www.postgresql.org/) (v14 or higher)

### Step 1: Clone Repository
```bash
git clone https://github.com/your-username/insurance-management-system.git
cd insurance-management-system
```

### Step 2: Database Configuration
1. Start your PostgreSQL service.
2. Create the database:
```sql
CREATE DATABASE insurance_management;
```

### Step 3: Backend Environment Setup
Create `backend/.env` (do not commit this file):
```env
PORT=5000
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_NAME=insurance_management
DB_PORT=5432
JWT_SECRET=super_secret_jwt_key_sureguard_2026_ims
ADMIN_EMAIL=admin@insurance.com
ADMIN_PASSWORD=Admin@123456
```

### Step 4: Install Dependencies & Initialize Database
```bash
# Navigate to backend
cd backend
npm install

# Run database schema migrations & sequence setup
npm run init-db
```

### Step 5: Frontend Setup
```bash
# Navigate to frontend
cd ../frontend
npm install
```
Configure `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 🔑 Database Seeding & Default Credentials

The database initialization and administrator setup run programmatically without manual SQL editing. Passwords are salted and hashed using `bcrypt` (10 rounds).

### Run Database Initialization:
```bash
cd backend
npm run init-db
```
- Sets up all sequence starts, column defaults, cascading foreign keys (`ON DELETE SET NULL`), and schema verification.
- **Idempotent**: If the admin account already exists, it safely skips creation and reports that the account is active.

### Default Credentials
| Role | Email / Username | Password | Notes |
|:---|:---|:---|:---|
| **System Administrator** | `admin@insurance.com` *(or `admin`)* | `Admin@123456` | Full platform access & approval dashboard |
| **Insurance Agent** | `priya@insurance.com` | `Password@123` | Official License: `LIC-AGT-724190` (Chennai Main Branch) |
| **Field Surveyor** | `arun@insurance.com` | `Password@123` | Official License: `LIC-SUR-519283` (8 Yrs Experience) |
| **Registered Customer** | `megarajan2026@gmail.com` | `Password@123` | Customer ID `#115` (Megarajan P N) |

---

## 💻 Running the Application Locally

### 1. Start Backend Server
```bash
cd backend
npm run dev   # Uses nodemon for hot-reloading on port 5000
# OR
npm start     # Production start
```
*Backend runs on `http://localhost:5000`.*

### 2. Start Frontend Server
```bash
cd frontend
npm run dev
```
*Frontend runs on `http://localhost:5173`.*

---

## 🧪 Automated Testing

A comprehensive end-to-end integration test is provided in `backend/scripts/testE2eFlow.js`:
```bash
cd backend
node scripts/testE2eFlow.js
```

### What the test verifies:
- [x] Admin authentication and JWT token issuance
- [x] Instant customer registration without admin intervention
- [x] Customer role restriction (Customer attempting to access admin routes receives `403`)
- [x] Agent registration sets account to `PENDING`
- [x] Pending agent is blocked from logging in with an approval pending warning
- [x] Admin approval dashboard retrieves pending agents
- [x] Admin approves pending agent and automatically issues official license (`LIC-AGT-XXXXXX`)
- [x] Approved agent logs in successfully
- [x] Surveyor registration, pending status check, admin approval, and approved login
- [x] Real PostgreSQL aggregations from `/api/dashboard/stats`
- [x] Customer data ownership isolation (Customer cannot fetch another customer's record)
- [x] Policy, branch, and policy-type CRUD retrieval
- [x] Safe branch deletion unlinking assigned agents (`ON DELETE SET NULL`)

---

## 🚀 Cloud Deployment Guide (Neon, Render, Vercel)

The system is architected for zero-cost, high-performance cloud deployment across three dedicated tiers:

### 1. Cloud Database (Neon Serverless PostgreSQL)
1. Sign up on **[Neon.tech](https://neon.tech)** and create a new project named `insurance-db`.
2. Open the Neon **SQL Editor**, paste the contents of [`database/schema.sql`](database/schema.sql), and click **Run**.
3. Copy your project connection string (`DATABASE_URL`):
   ```text
   postgresql://neondb_owner:<password>@ep-<project-id>-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```

### 2. Backend Web Service (Render)
1. Sign in to **[Render.com](https://render.com)** $\rightarrow$ **New +** $\rightarrow$ **Web Service**.
2. Connect your GitHub repository (`insurance-management-system`).
3. Set the following build options:
   * **Root Directory:** `backend`
   * **Build Command:** `npm install`
   * **Start Command:** `npm start`
   * **Instance Type:** `Free`
4. Add the Environment Variables:
   * `DATABASE_URL`: *(Your Neon PostgreSQL connection string)*
   * `JWT_SECRET`: `insurance_management_jwt_secret_key_2026_super_secure`
   * `ADMIN_EMAIL`: `admin@insurance.com`
   * `ADMIN_PASSWORD`: `Admin@123456`
   * `PORT`: `5000`
5. Click **Deploy Web Service** to receive your live API URL (e.g. `https://insurance-management-system-vylp.onrender.com`).

### 3. Frontend Static Application (Vercel)
1. Sign in to **[Vercel.com](https://vercel.com)** $\rightarrow$ **Add New...** $\rightarrow$ **Project**.
2. Import the repository and select **Root Directory:** `frontend`.
3. Framework Preset: `Vite`.
4. Add Environment Variable:
   * **Key:** `VITE_API_URL`
   * **Value:** `https://insurance-management-system-vylp.onrender.com/api`
5. Click **Deploy**. Vercel will output your public shareable website link!

---

## 📖 API Reference Summary

For the complete endpoint specification, request payloads, query parameters, and sample JSON responses, refer to [API.md](API.md).

| Resource | Route Prefix | Permissions |
|---|---|---|
| Authentication | `/api/auth` | Public & Authenticated |
| User Governance | `/api/users` | `ADMIN` only |
| Live Statistics | `/api/dashboard` | Role-Tailored |
| Customers | `/api/customers` | `ADMIN`, `AGENT`, `CUSTOMER` (Self) |
| Policies | `/api/policies` | Role-Scoped |
| Premium Payments | `/api/payments` | Role-Scoped |
| Claims | `/api/claims` | Role-Scoped (`SURVEYOR` assigned) |
| Agents | `/api/agents` | All (Management: `ADMIN`) |
| Surveyors | `/api/surveyors` | All (Management: `ADMIN`) |
| Branches | `/api/branches` | All (Management: `ADMIN`) |
| Hospitals | `/api/hospitals` | All (Management: `ADMIN`, `SURVEYOR`) |
| Nominees | `/api/nominees` | Policy Linked |
| Documents | `/api/documents` | Customer Linked |
| Insured Assets | `/api/vehicles`, `/api/properties`, `/api/businesses` | 1:1 Policy Linked |
| Policy Types | `/api/policy-types` | All (Management: `ADMIN`) |

---

## 📄 License
This project is open-source and available under the [ISC License](LICENSE).
