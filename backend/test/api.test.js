import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

describe('Multi-Tenant Security Platform API Tests', () => {
  let tokenTenantAAdmin = '';
  let tokenTenantAManager = '';
  let tokenTenantAUser = '';
  let tokenTenantBAdmin = '';

  let campaignTenantAId = '';
  let campaignTenantBId = '';

  beforeAll(async () => {
    // 1. Login as Tenant A Admin
    const resAAdmin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@abc.com', password: 'Admin@123' });
    expect(resAAdmin.status).toBe(200);
    tokenTenantAAdmin = resAAdmin.body.token;

    // 2. Login as Tenant A Manager
    const resAManager = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'manager@abc.com', password: 'Admin@123' });
    expect(resAManager.status).toBe(200);
    tokenTenantAManager = resAManager.body.token;

    // 3. Login as Tenant A User
    const resAUser = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'user@abc.com', password: 'Admin@123' });
    expect(resAUser.status).toBe(200);
    tokenTenantAUser = resAUser.body.token;

    // 4. Login as Tenant B Admin
    const resBAdmin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@xyz.com', password: 'Admin@123' });
    expect(resBAdmin.status).toBe(200);
    tokenTenantBAdmin = resBAdmin.body.token;
  });

  describe('Authentication & Identity', () => {
    it('should reject invalid credentials with 401', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'admin@abc.com', password: 'WrongPassword' });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should retrieve current user details via /auth/me', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${tokenTenantAAdmin}`);
      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe('admin@abc.com');
      expect(res.body.tenant.slug).toBe('abc-tech');
    });

    it('should reject unauthenticated requests to protected routes', async () => {
      const res = await request(app).get('/api/v1/campaigns');
      expect(res.status).toBe(401);
    });
  });

  describe('Multi-Tenant Data Isolation', () => {
    it('Tenant A lists campaigns: should only see Tenant A campaigns and NOT Tenant B campaigns', async () => {
      const resA = await request(app)
        .get('/api/v1/campaigns')
        .set('Authorization', `Bearer ${tokenTenantAAdmin}`);

      expect(resA.status).toBe(200);
      expect(resA.body.data.length).toBeGreaterThan(0);
      campaignTenantAId = resA.body.data[0].id;

      // Verify none of the campaigns belong to Tenant B
      const allBelongToTenantA = resA.body.data.every(
        (c) => c.name !== 'Internal Red Team Penetration Test'
      );
      expect(allBelongToTenantA).toBe(true);

      // Now Tenant B lists campaigns
      const resB = await request(app)
        .get('/api/v1/campaigns')
        .set('Authorization', `Bearer ${tokenTenantBAdmin}`);

      expect(resB.status).toBe(200);
      campaignTenantBId = resB.body.data[0].id;

      const hasTenantACampaigns = resB.body.data.some(
        (c) => c.id === campaignTenantAId
      );
      expect(hasTenantACampaigns).toBe(false);
    });

    it('Tenant B cannot access Tenant A campaign by ID (cross-tenant leakage prevention)', async () => {
      const res = await request(app)
        .get(`/api/v1/campaigns/${campaignTenantAId}`)
        .set('Authorization', `Bearer ${tokenTenantBAdmin}`);

      // Must return 404 Not Found to prevent ID enumeration
      expect(res.status).toBe(404);
    });

    it('Tenant B cannot update Tenant A campaign', async () => {
      const res = await request(app)
        .put(`/api/v1/campaigns/${campaignTenantAId}`)
        .set('Authorization', `Bearer ${tokenTenantBAdmin}`)
        .send({ name: 'Hacked by Tenant B' });

      expect(res.status).toBe(404);
    });

    it('Tenant B cannot delete Tenant A campaign', async () => {
      const res = await request(app)
        .delete(`/api/v1/campaigns/${campaignTenantAId}`)
        .set('Authorization', `Bearer ${tokenTenantBAdmin}`);

      expect(res.status).toBe(404);
    });

    it('Tenant B cannot see Tenant A security events', async () => {
      const res = await request(app)
        .get('/api/v1/events')
        .set('Authorization', `Bearer ${tokenTenantBAdmin}`);

      expect(res.status).toBe(200);
      // Ensure no Tenant A specific event descriptions leak
      const leaked = res.body.data.some((e) =>
        e.description.includes('bastion node')
      );
      expect(leaked).toBe(false);
    });
  });

  describe('Role-Based Access Control (RBAC)', () => {
    it('USER role should be forbidden from creating a campaign', async () => {
      const res = await request(app)
        .post('/api/v1/campaigns')
        .set('Authorization', `Bearer ${tokenTenantAUser}`)
        .send({
          name: 'Unauthorized User Campaign',
          description: 'Testing RBAC',
          status: 'DRAFT'
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Access forbidden');
    });

    it('MANAGER role can create a campaign', async () => {
      const res = await request(app)
        .post('/api/v1/campaigns')
        .set('Authorization', `Bearer ${tokenTenantAManager}`)
        .send({
          name: 'Manager Created Assessment',
          description: 'Created by manager',
          status: 'DRAFT'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Manager Created Assessment');
    });

    it('MANAGER role is forbidden from deleting a campaign (ADMIN only)', async () => {
      const res = await request(app)
        .delete(`/api/v1/campaigns/${campaignTenantAId}`)
        .set('Authorization', `Bearer ${tokenTenantAManager}`);

      expect(res.status).toBe(403);
    });

    it('USER role is forbidden from viewing audit logs (ADMIN only)', async () => {
      const res = await request(app)
        .get('/api/v1/audit-logs')
        .set('Authorization', `Bearer ${tokenTenantAUser}`);

      expect(res.status).toBe(403);
    });

    it('ADMIN role can view audit logs', async () => {
      const res = await request(app)
        .get('/api/v1/audit-logs')
        .set('Authorization', `Bearer ${tokenTenantAAdmin}`);

      expect(res.status).toBe(200);
      expect(res.body.logs.length).toBeGreaterThan(0);
    });
  });

  describe('Audit Logging & Observability', () => {
    it('Should verify that creating a campaign generated an audit log entry', async () => {
      const res = await request(app)
        .get('/api/v1/audit-logs?action=CAMPAIGN_CREATE')
        .set('Authorization', `Bearer ${tokenTenantAAdmin}`);

      expect(res.status).toBe(200);
      expect(res.body.logs.length).toBeGreaterThan(0);
      expect(res.body.logs[0].action).toBe('CAMPAIGN_CREATE');
    });
  });

  describe('Dashboard Aggregates & Date Filtering', () => {
    it('Should return isolated dashboard metrics for Tenant A with date filter and event trends', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/overview?range=30d')
        .set('Authorization', `Bearer ${tokenTenantAAdmin}`);

      expect(res.status).toBe(200);
      expect(res.body.data.summary).toBeDefined();
      expect(res.body.data.summary.campaigns.total).toBeGreaterThan(0);
      expect(res.body.data.charts.eventsBySeverity).toBeDefined();
      expect(res.body.data.charts.eventTrends).toBeDefined();
    });

    it('Should support /api route alias without /v1 prefix', async () => {
      const res = await request(app)
        .get('/api/dashboard/overview')
        .set('Authorization', `Bearer ${tokenTenantAAdmin}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('User Security & Role Immutability', () => {
    it('Should forbid a user from modifying their own role', async () => {
      const meRes = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${tokenTenantAAdmin}`);

      const myId = meRes.body.user.id;

      const updateRes = await request(app)
        .patch(`/api/v1/users/${myId}`)
        .set('Authorization', `Bearer ${tokenTenantAAdmin}`)
        .send({ role: 'USER' });

      expect(updateRes.status).toBe(403);
      expect(updateRes.body.message).toContain('cannot modify your own role');
    });
  });

  describe('Security Events with Telemetry & Operator Assignment', () => {
    it('Should create and retrieve a security incident with sourceIp and assigned operator', async () => {
      const createRes = await request(app)
        .post('/api/v1/events')
        .set('Authorization', `Bearer ${tokenTenantAAdmin}`)
        .send({
          eventType: 'BRUTE_FORCE_SSH_ATTACK',
          severity: 'CRITICAL',
          status: 'OPEN',
          description: 'Repeated authentication failures on bastion host.',
          source: 'WAF Suricata',
          sourceIp: '203.0.113.195'
        });

      expect(createRes.status).toBe(201);
      expect(createRes.body.data.sourceIp).toBe('203.0.113.195');

      const eventId = createRes.body.data.id;
      const getRes = await request(app)
        .get(`/api/v1/events/${eventId}`)
        .set('Authorization', `Bearer ${tokenTenantAAdmin}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.data.sourceIp).toBe('203.0.113.195');
    });
  });
});
