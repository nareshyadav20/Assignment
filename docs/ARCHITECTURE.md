# System Architecture & Technical Specifications
## Deep Trace Cybernetics — Multi-Tenant Security Management Platform

### 1. Architectural Overview

The Deep Trace Cybernetics Security Management Platform is designed as a secure, compliant, multi-tenant enterprise system providing centralized visibility over security assessments, threat telemetry, campaigns, and team access.

```
                           +---------------------------+
                           |  React + Vite Frontend    |
                           |  (Tailwind, Recharts)     |
                           +-------------+-------------+
                                         |
                                         | JWT / HTTPS (CORS + Cookies)
                                         v
                      +--------------------------------------+
                      |      Express.js API Gateway          |
                      |   - Helmet & Rate Limiting           |
                      |   - Auth Middleware (JWT verify)     |
                      |   - Tenant Context Enforcement       |
                      |   - RBAC Middleware (Role Gating)    |
                      +------------------+-------------------+
                                         |
                                         | Prisma Client
                                         v
                      +--------------------------------------+
                      |     PostgreSQL (Supabase Pool)       |
                      |   - Tenant-Scoped Relations          |
                      |   - Cascade & Restrict Constraints   |
                      |   - Append-Only Audit Logs           |
                      +--------------------------------------+
```

---

### 2. Multi-Tenant Data Isolation Strategy

Data isolation between tenants is guaranteed through strict multi-layered controls:

1. **Context Derivation from Cryptographic Token**:
   - The tenant ID is **never** accepted from client query strings or request bodies.
   - Upon authentication, the backend validates credentials and extracts the user's authentic `tenantId` from the database.
   - The `enforceTenantContext` middleware explicitly strips any client-submitted `tenantId` to prevent injection attacks and attaches `req.tenantId` strictly from the authenticated database user record.

2. **Scoped Database Access**:
   - Every single database read, write, update, and delete operation mandates `{ tenantId: req.tenantId }`.
   - Accessing a resource belonging to another tenant returns `404 Not Found` (rather than 403) to prevent ID enumeration and resource discovery across tenant boundaries.

3. **Cross-Tenant Assignment Guards**:
   - When assigning team members to security campaigns, the backend verifies that both the campaign and the target user belong to the exact same `tenantId`.

---

### 3. Role-Based Access Control (RBAC) Matrix

The system enforces granular Role-Based Access Control across three core personas:

| Action / Resource | Role: ADMIN | Role: MANAGER | Role: USER | Enforcement Mechanism |
| :--- | :---: | :---: | :---: | :--- |
| **View Dashboard** | Yes | Yes | Yes | `requirePermission('DASHBOARD_VIEW')` |
| **List & Read Campaigns** | Yes | Yes | Yes | `requirePermission('CAMPAIGN_READ')` |
| **Create Campaigns** | Yes | Yes | No | `requirePermission('CAMPAIGN_CREATE')` |
| **Update Campaigns** | Yes | Yes | No | `requirePermission('CAMPAIGN_UPDATE')` |
| **Delete Campaigns** | Yes | No | No | `requirePermission('CAMPAIGN_DELETE')` |
| **Assign / Remove Campaign Users**| Yes | Yes | No | `requirePermission('CAMPAIGN_ASSIGN_USER')` |
| **Log Security Incidents** | Yes | Yes | Yes | `requirePermission('EVENT_CREATE')` |
| **Read Security Events** | Yes | Yes | Yes | `requirePermission('EVENT_READ')` |
| **Triage & Update Events** | Yes | Yes | No | `requirePermission('EVENT_UPDATE_STATUS')` |
| **Delete Security Events** | Yes | No | No | `requirePermission('EVENT_DELETE')` |
| **View Tenant Team Members** | Yes | Yes | No | `requirePermission('USER_VIEW')` |
| **Manage Users (Create/Edit/Delete)**| Yes | No | No | `requirePermission('USER_MANAGE')` |
| **Access Audit Trail** | Yes | No | No | `requirePermission('AUDIT_LOGS_VIEW')` |

---

### 4. Audit Logging & Forensics

All state-modifying actions automatically emit structured, immutable audit log entries:
- **Actor Identity**: User ID, name, and role.
- **Action Type**: Explicit signature (e.g. `CAMPAIGN_CREATE`, `SECURITY_EVENT_UPDATE`).
- **Target Resource**: Resource type (`CAMPAIGN`, `SECURITY_EVENT`, `USER`, `AUTH`) and resource ID.
- **Client IP & Telemetry**: Remote IP address and metadata.
- **Sanitization**: Password hashes, tokens, and secrets are strictly stripped before audit persistence.
