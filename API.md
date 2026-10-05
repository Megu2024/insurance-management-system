# Insurance Management System — REST API Specification

**Base URL**: `http://localhost:5000/api` (Configurable via `VITE_API_URL` on the frontend)

---

## 1. Authentication & Security Headers

All protected endpoints require a JSON Web Token (JWT) passed in the `Authorization` HTTP header:

```http
Authorization: Bearer <your_jwt_token>
```

### Standard Response Codes
- `200 OK`: Request succeeded.
- `201 Created`: Resource successfully created.
- `400 Bad Request`: Missing required fields, invalid input, or validation failure.
- `401 Unauthorized`: Missing or invalid authentication token.
- `403 Forbidden`: Insufficient role permissions or resource ownership violation (or unapproved account status).
- `404 Not Found`: Target resource does not exist.
- `409 Conflict`: Unique constraint violation (e.g. duplicate email, license, or duplicate policy asset).
- `500 Internal Server Error`: Server failure with sanitized error message.

---

## 2. Authentication API (`/api/auth`)

### 2.1 Customer Registration (Instant Activation)
- **Method**: `POST`
- **Path**: `/api/auth/register-customer`
- **Auth**: None (Public)
- **Request Body**:
  ```json
  {
    "first_name": "Rahul",
    "last_name": "Sharma",
    "email": "rahul@gmail.com",
    "password": "Password@123",
    "mobile_no": "9876543210",
    "gender": "Male",
    "dob": "1992-05-15",
    "address": "402 Marine Drive",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001",
    "occupation": "Software Engineer",
    "annual_income": 1200000
  }
  ```
- **Response** (`201 Created`):
  ```json
  {
    "message": "Customer account registered successfully",
    "token": "<jwt_token>",
    "user": {
      "user_id": 2,
      "email": "rahul@gmail.com",
      "role": "CUSTOMER",
      "status": "APPROVED",
      "customer_id": 1,
      "name": "Rahul Sharma"
    }
  }
  ```

### 2.2 Agent Application (Requires Admin Approval)
- **Method**: `POST`
- **Path**: `/api/auth/register-agent`
- **Auth**: None (Public)
- **Request Body**:
  ```json
  {
    "agent_name": "Priya Patel",
    "email": "priya@insurance.com",
    "password": "Password@123",
    "mobile_no": "9876543211",
    "license_no": "AG-LIC-2024-001",
    "branch_id": 1
  }
  ```
- **Response** (`201 Created`):
  ```json
  {
    "message": "Agent application submitted successfully. Pending admin approval.",
    "user": {
      "user_id": 3,
      "email": "priya@insurance.com",
      "role": "AGENT",
      "status": "PENDING"
    }
  }
  ```

### 2.3 Surveyor Application (Requires Admin Approval)
- **Method**: `POST`
- **Path**: `/api/auth/register-surveyor`
- **Auth**: None (Public)
- **Request Body**:
  ```json
  {
    "surveyor_name": "Arun Kumar",
    "email": "arun@insurance.com",
    "password": "Password@123",
    "phone": "9876543212",
    "license_no": "SRV-LIC-2024-001",
    "experience": 7
  }
  ```
- **Response** (`201 Created`):
  ```json
  {
    "message": "Surveyor application submitted successfully. Pending admin approval.",
    "user": {
      "user_id": 4,
      "email": "arun@insurance.com",
      "role": "SURVEYOR",
      "status": "PENDING"
    }
  }
  ```

### 2.4 User Login
- **Method**: `POST`
- **Path**: `/api/auth/login`
- **Auth**: None (Public)
- **Request Body**:
  ```json
  {
    "email": "admin@insurance.com",
    "password": "Admin@123456"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "message": "Login successful",
    "token": "<jwt_token>",
    "user": {
      "user_id": 1,
      "email": "admin@insurance.com",
      "role": "ADMIN",
      "status": "APPROVED",
      "name": "System Administrator"
    }
  }
  ```
- **Note**: If `status === 'PENDING'`, returns `403 Forbidden` (`Your account is pending administrator approval`). If `status === 'REJECTED'`, returns `403 Forbidden` (`Your account has been rejected or suspended`).

### 2.5 Get Authenticated User Profile
- **Method**: `GET`
- **Path**: `/api/auth/me`
- **Auth**: Required (`ADMIN`, `CUSTOMER`, `AGENT`, `SURVEYOR`)

### 2.6 Change Password
- **Method**: `POST`
- **Path**: `/api/auth/change-password`
- **Auth**: Required
- **Request Body**:
  ```json
  {
    "currentPassword": "OldPassword@123",
    "newPassword": "NewPassword@123"
  }
  ```

---

## 3. User Governance & Approvals (`/api/users`)
*Requires `ADMIN` role.*

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/users` | List all users with query filters `?role=...&status=...&search=...` |
| `GET` | `/api/users/pending` | List all pending agent & surveyor applications |
| `PUT` | `/api/users/:id/approve` | Approve a pending user account |
| `PUT` | `/api/users/:id/reject` | Reject a user application |
| `PUT` | `/api/users/:id/status` | Change user status (`APPROVED`, `PENDING`, `REJECTED`, `INACTIVE`) |
| `DELETE` | `/api/users/:id` | Remove user account (Admin protected) |

---

## 4. Live Dashboard Analytics (`/api/dashboard`)

| Method | Endpoint | Roles Allowed | Description |
|---|---|---|---|
| `GET` | `/api/dashboard/stats` | Any Authenticated | Live PostgreSQL aggregate counts tailored to user role |
| `GET` | `/api/dashboard/recent-policies` | `ADMIN`, `AGENT`, `CUSTOMER` | Recent policies (restricted by role ownership) |
| `GET` | `/api/dashboard/recent-claims` | `ADMIN`, `AGENT`, `SURVEYOR`, `CUSTOMER` | Recent claims (restricted by role ownership) |
| `GET` | `/api/dashboard/recent-payments` | `ADMIN`, `AGENT`, `CUSTOMER` | Recent payments (restricted by role ownership) |

---

## 5. Customers Module (`/api/customers`)

| Method | Endpoint | Roles Allowed | Description |
|---|---|---|---|
| `GET` | `/api/customers` | `ADMIN`, `AGENT` | List customers (Agent sees handled clients) |
| `GET` | `/api/customers/:id` | `ADMIN`, `AGENT`, `CUSTOMER` | Customer details (Customer can only view own ID) |
| `POST` | `/api/customers` | `ADMIN`, `AGENT` | Direct customer creation |
| `PUT` | `/api/customers/:id` | `ADMIN`, `AGENT`, `CUSTOMER` | Update customer record |
| `DELETE` | `/api/customers/:id` | `ADMIN` | Soft-deactivate or delete customer |
| `GET` | `/api/customers/:id/policies` | `ADMIN`, `AGENT`, `CUSTOMER` | Get all policies for customer |
| `GET` | `/api/customers/:id/documents` | `ADMIN`, `AGENT`, `CUSTOMER` | Get documents submitted by customer |

---

## 6. Policies Module (`/api/policies`)

| Method | Endpoint | Roles Allowed | Description |
|---|---|---|---|
| `GET` | `/api/policies` | All Roles | List policies (`CUSTOMER` sees own; `AGENT` sees handled; `ADMIN` sees all) |
| `GET` | `/api/policies/:id` | All Roles | Policy details + type + customer + agent info |
| `POST` | `/api/policies` | `ADMIN`, `AGENT` | Issue new insurance policy |
| `PUT` | `/api/policies/:id` | `ADMIN`, `AGENT` | Update policy parameters |
| `PUT` | `/api/policies/:id/status` | `ADMIN`, `AGENT` | Update status (`Active`, `Lapsed`, `Claimed`, `Cancelled`, `Expired`) |
| `DELETE` | `/api/policies/:id` | `ADMIN` | Cancel/remove policy |
| `GET` | `/api/policies/:id/payments` | All Roles | View premium payment schedule & receipts |
| `GET` | `/api/policies/:id/claims` | All Roles | View claims raised on this policy |
| `GET` | `/api/policies/:id/nominees` | All Roles | View registered nominees |
| `GET` | `/api/policies/:id/vehicle` | All Roles | View 1:1 linked vehicle asset |
| `GET` | `/api/policies/:id/property` | All Roles | View 1:1 linked property asset |
| `GET` | `/api/policies/:id/business` | All Roles | View 1:1 linked business asset |

---

## 7. Payments Module (`/api/payments`)

| Method | Endpoint | Roles Allowed | Description |
|---|---|---|---|
| `GET` | `/api/payments` | All Roles | Payment history (role ownership enforced) |
| `GET` | `/api/payments/:id` | All Roles | Single payment receipt details |
| `POST` | `/api/payments` | `ADMIN`, `AGENT`, `CUSTOMER` | Record premium payment |
| `PUT` | `/api/payments/:id` | `ADMIN` | Update payment details/status |
| `DELETE` | `/api/payments/:id` | `ADMIN` | Remove payment record |

---

## 8. Claims Module (`/api/claims`)

| Method | Endpoint | Roles Allowed | Description |
|---|---|---|---|
| `GET` | `/api/claims` | All Roles | Claims list (Surveyor sees assigned, Customer sees own) |
| `GET` | `/api/claims/:id` | All Roles | Full claim details with surveyor and policy |
| `POST` | `/api/claims` | `ADMIN`, `AGENT`, `CUSTOMER` | File insurance claim |
| `PUT` | `/api/claims/:id` | `ADMIN`, `AGENT`, `SURVEYOR` | Update claim description/surveyor assignment |
| `PUT` | `/api/claims/:id/status` | `ADMIN`, `SURVEYOR` | Update status (`Pending`, `Under Review`, `Approved`, `Rejected`, `Settled`) |
| `DELETE` | `/api/claims/:id` | `ADMIN` | Delete claim record |
| `GET` | `/api/claims/:id/hospital` | All Roles | Hospital admission/discharge/bills for health claims |

---

## 9. Agents Module (`/api/agents`)

| Method | Endpoint | Roles Allowed | Description |
|---|---|---|---|
| `GET` | `/api/agents` | All Roles | List active agents |
| `GET` | `/api/agents/:id` | All Roles | Agent profile details |
| `POST` | `/api/agents` | `ADMIN` | Create agent record |
| `PUT` | `/api/agents/:id` | `ADMIN`, `AGENT` | Update agent details |
| `DELETE` | `/api/agents/:id` | `ADMIN` | Deactivate agent |
| `GET` | `/api/agents/:id/policies` | `ADMIN`, `AGENT` | Policies managed by this agent |
| `GET` | `/api/agents/:id/customers` | `ADMIN`, `AGENT` | Customers assigned to this agent |

---

## 10. Surveyors Module (`/api/surveyors`)

| Method | Endpoint | Roles Allowed | Description |
|---|---|---|---|
| `GET` | `/api/surveyors` | All Roles | List licensed surveyors |
| `GET` | `/api/surveyors/:id` | All Roles | Surveyor profile details |
| `POST` | `/api/surveyors` | `ADMIN` | Create surveyor profile |
| `PUT` | `/api/surveyors/:id` | `ADMIN`, `SURVEYOR` | Update surveyor information |
| `DELETE` | `/api/surveyors/:id` | `ADMIN` | Deactivate surveyor |
| `GET` | `/api/surveyors/:id/claims` | `ADMIN`, `SURVEYOR` | Claims assigned to this surveyor |

---

## 11. Branches Module (`/api/branches`)

| Method | Endpoint | Roles Allowed | Description |
|---|---|---|---|
| `GET` | `/api/branches` | All Roles | List company branches |
| `GET` | `/api/branches/:id` | All Roles | Single branch information |
| `POST` | `/api/branches` | `ADMIN` | Register new branch office |
| `PUT` | `/api/branches/:id` | `ADMIN` | Update branch contact / manager |
| `DELETE` | `/api/branches/:id` | `ADMIN` | Decommission branch office |
| `GET` | `/api/branches/:id/agents` | All Roles | Agents assigned to branch |

---

## 12. Hospitals Module (`/api/hospitals`)

| Method | Endpoint | Roles Allowed | Description |
|---|---|---|---|
| `GET` | `/api/hospitals` | All Roles | List hospital records |
| `GET` | `/api/hospitals/:id` | All Roles | Hospital detail record |
| `POST` | `/api/hospitals` | `ADMIN`, `AGENT` | Add hospital claim admission details |
| `PUT` | `/api/hospitals/:id` | `ADMIN`, `AGENT`, `SURVEYOR` | Update hospital / bill amounts |
| `DELETE` | `/api/hospitals/:id` | `ADMIN` | Delete hospital record |

---

## 13. Nominees Module (`/api/nominees`)

| Method | Endpoint | Roles Allowed | Description |
|---|---|---|---|
| `GET` | `/api/nominees` | All Roles | List nominees (filtered by user ownership) |
| `GET` | `/api/nominees/:id` | All Roles | Nominee details |
| `POST` | `/api/nominees` | `ADMIN`, `AGENT`, `CUSTOMER` | Register nominee for a policy |
| `PUT` | `/api/nominees/:id` | `ADMIN`, `AGENT`, `CUSTOMER` | Update nominee info |
| `DELETE` | `/api/nominees/:id` | `ADMIN`, `CUSTOMER` | Remove nominee from policy |

---

## 14. Documents Module (`/api/documents`)

Supports single or batch multi-document uploads with file attachments (PDF, PNG, JPG), automatic metadata tracking (`file_name`, `file_type`, `file_size`, `file_data`, `uploaded_at`), and in-browser preview/download.

| Method | Endpoint | Roles Allowed | Description |
|---|---|---|---|
| `GET` | `/api/documents` | All Roles | List customer verification documents with file indicators |
| `GET` | `/api/documents/:id` | All Roles | Document details including full base64 file data for preview/download |
| `POST` | `/api/documents` | `ADMIN`, `AGENT`, `CUSTOMER` | Upload/register single or multiple documents (accepts `{ customer_id, documents: [...] }` or single object) |
| `PUT` | `/api/documents/:id` | `ADMIN`, `AGENT`, `CUSTOMER` | Update document details / replace attached file |
| `PUT` | `/api/documents/:id/status` | `ADMIN`, `AGENT` | Verification status (`Pending`, `Verified`, `Rejected`) |
| `DELETE` | `/api/documents/:id` | `ADMIN` | Remove document record |

---

## 15. Assets Modules (`/api/vehicles`, `/api/properties`, `/api/businesses`)
*Respects `UNIQUE(policy_id)` 1:1 constraints.*

| Method | Endpoint | Roles Allowed | Description |
|---|---|---|---|
| `GET` | `/api/vehicles` | All Roles | List covered vehicles |
| `POST` | `/api/vehicles` | `ADMIN`, `AGENT` | Link motor vehicle to policy |
| `PUT` | `/api/vehicles/:id` | `ADMIN`, `AGENT` | Update vehicle info |
| `DELETE` | `/api/vehicles/:id` | `ADMIN` | Remove vehicle record |
| `GET` | `/api/properties` | All Roles | List covered properties |
| `POST` | `/api/properties` | `ADMIN`, `AGENT` | Link real-estate property to policy |
| `PUT` | `/api/properties/:id` | `ADMIN`, `AGENT` | Update property info |
| `DELETE` | `/api/properties/:id` | `ADMIN` | Remove property record |
| `GET` | `/api/businesses` | All Roles | List covered commercial businesses |
| `POST` | `/api/businesses` | `ADMIN`, `AGENT` | Link enterprise to policy |
| `PUT` | `/api/businesses/:id` | `ADMIN`, `AGENT` | Update business info |
| `DELETE` | `/api/businesses/:id` | `ADMIN` | Remove business record |

---

## 16. Policy Types Module (`/api/policy-types`)

| Method | Endpoint | Roles Allowed | Description |
|---|---|---|---|
| `GET` | `/api/policy-types` | All Roles | List policy products (Life, Health, Motor, Property) |
| `GET` | `/api/policy-types/:id` | All Roles | Policy product details |
| `POST` | `/api/policy-types` | `ADMIN` | Create new insurance product |
| `PUT` | `/api/policy-types/:id` | `ADMIN` | Update product category / name |
| `DELETE` | `/api/policy-types/:id` | `ADMIN` | Remove policy product |