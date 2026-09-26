# Deep Trace Cybernetics — Multi-Tenant Security Management Platform

A production-grade, secure, multi-tenant security operations platform built for enterprise threat tracking, security campaigns, access governance, and immutable audit compliance.

---

## 🚀 Key Features

- **Multi-Tenant Architecture**: Strict tenant isolation across all layers (database queries, routing, relations, and cross-assignment guards).
- **Role-Based Access Control (RBAC)**: Fine-grained permissions for `ADMIN`, `MANAGER`, and `USER` roles.
- **Security Incident Telemetry**: Severity tracking (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`), lifecycle triage (`OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`), and SIEM event recording.
- **Security Campaigns**: Phishing drills, penetration tests, SOC 2 audits, and vulnerability sweeps with team assignments.
- **Team & Access Governance**: Tenant user directory, credential management, and role assignments.
- **Immutable Audit Trail**: Append-only compliance logging for all state-changing activities with structured metadata.
- **Interactive Evaluator Mode**: 1-click persona switcher to rapidly test tenant isolation and RBAC live.
- **Automated Integration Test Suite**: 15 Vitest tests validating tenant data isolation, authorization boundaries, and security rules.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend API** | Node.js, Express.js, Prisma ORM, PostgreSQL (Supabase Pooler), Zod |
| **Security & Middleware** | Helmet, CORS, Express Rate Limit, Bcrypt.js, JsonWebToken, Cookie-Parser |
| **Frontend UI** | React 18, Vite, TailwindCSS, Recharts, Lucide Icons, React Router v7 |
| **Testing** | Vitest, Supertest |

---

## 👥 Pre-Seeded Personas for Evaluation

The database is pre-seeded with two isolated tenants and credentials (`Admin@123` for all users):

### Tenant A: **ABC Technologies** (`abc-tech`)
| Persona | Email | Role | Scope |
| :--- | :--- | :--- | :--- |
| **Alice Admin** | `admin@abc.com` | `ADMIN` | Full control: campaigns, events, users, audit logs |
| **Bob Manager** | `manager@abc.com` | `MANAGER` | Campaign create/update, member assignments, event triage |
| **Charlie Analyst** | `user@abc.com` | `USER` | Read-only access, event reporting |

### Tenant B: **XYZ Solutions** (`xyz-solutions`)
| Persona | Email | Role | Scope |
| :--- | :--- | :--- | :--- |
| **Xavier Admin** | `admin@xyz.com` | `ADMIN` | Tenant B administrator |
| **Yvonne Manager** | `manager@xyz.com` | `MANAGER` | Tenant B operations manager |
| **Zack Specialist** | `user@xyz.com` | `USER` | Tenant B security analyst |

> 💡 **Evaluator Mode**: In the frontend application, the header includes a **"Switch Persona (Evaluator Mode)"** dropdown to switch between Tenant A and Tenant B users in a single click!

---

## 🏁 Quickstart Guide

### Prerequisites
- Node.js v18+
- npm v9+

### 1. Backend Setup

```bash
cd backend

# Install dependencies (already installed)
npm install

# Push Prisma Schema to PostgreSQL (if needed)
npm run db:push

# Seed tenants, users, campaigns, events, and audit logs
npm run db:seed

# Run automated integration tests (15 tests passing)
npm test

# Start the Backend Server
npm run dev
# Server will run on: http://localhost:5000
```

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies (already installed)
npm install

# Start Vite Development Server
npm run dev
# Frontend will be live on: http://localhost:5173
```

---

## 🧪 Integration Testing

The backend includes a comprehensive test suite in `backend/test/api.test.js` covering:
- Tenant isolation (Tenant A cannot see, update, delete, or cross-assign Tenant B data).
- RBAC validation (`USER` cannot create/delete campaigns or view audit logs; `MANAGER` cannot delete campaigns).
- Authentication verification (invalid logins, token verification, route protection).
- Audit log generation for all sensitive actions.

Run tests:
```bash
cd backend
npm test
```

---

## 📂 Project Structure

```
d:/Assignment/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma        # Multi-tenant schema with enums and indexes
│   │   └── seed.js              # Comprehensive multi-tenant seed dataset
│   ├── src/
│   │   ├── config/              # Database (Prisma) and environment config
│   │   ├── controllers/         # Auth, Campaigns, Events, Users, Audit, Dashboard
│   │   ├── middleware/          # JWT auth, tenant isolation, RBAC, error handler
│   │   ├── routes/              # Express API routers
│   │   ├── services/            # Audit logging service
│   │   ├── utils/               # AppError classes and JWT utilities
│   │   ├── validators/          # Zod request body & query schemas
│   │   ├── app.js               # Express application configuration
│   │   └── server.js            # Server entrypoint with graceful shutdown
│   └── test/
│       └── api.test.js          # Vitest integration test suite
├── frontend/
│   ├── src/
│   │   ├── api/                 # Axios client with JWT interceptor
│   │   ├── components/          # Common components (Header, Sidebar, Badge, Modal, StatCard)
│   │   ├── context/             # AuthContext with 1-click persona switching & RBAC helpers
│   │   ├── pages/               # Dashboard, Campaigns, Events, Users, AuditLogs, Login
│   │   ├── App.jsx              # Routing and protected layout
│   │   └── main.jsx             # React root entry
│   └── tailwind.config.js       # Custom cyber palette styling
└── docs/
    └── ARCHITECTURE.md          # Multi-tenancy isolation and RBAC architecture
```

---

## 🛡️ Multi-Tenant Security Highlights

1. **Context Derivation**: Tenant ID is derived directly from the authenticated user's database record, completely ignoring any client-supplied `tenantId` parameter.
2. **Preventing ID Enumeration**: When a tenant attempts to read or mutate a resource belonging to another tenant, the API responds with `404 Not Found` rather than `403 Forbidden`, preventing identification of resource IDs.
3. **Cross-Tenant Assignment Blocker**: User assignments to campaigns strictly validate that both the user and campaign belong to the same tenant.
4. **Append-Only Auditing**: Sensitive credentials and passwords are automatically stripped before recording audit trails.
