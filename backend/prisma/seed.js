import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding for Multi-Tenant Security Platform...');

  // Common development password for all seed accounts
  const DEV_PASSWORD = 'Admin@123';
  const passwordHash = await bcrypt.hash(DEV_PASSWORD, 10);

  // 1. Clean existing seed data
  console.log('Cleaning existing records...');
  await prisma.auditLog.deleteMany({});
  await prisma.campaignUser.deleteMany({});
  await prisma.securityEvent.deleteMany({});
  await prisma.campaign.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.tenant.deleteMany({});

  // 2. Create Tenant A: ABC Technologies
  console.log('Creating Tenant A (ABC Technologies)...');
  const tenantA = await prisma.tenant.create({
    data: {
      name: 'ABC Technologies',
      slug: 'abc-tech',
      status: 'ACTIVE'
    }
  });

  // 3. Create Tenant B: XYZ Solutions
  console.log('Creating Tenant B (XYZ Solutions)...');
  const tenantB = await prisma.tenant.create({
    data: {
      name: 'XYZ Solutions',
      slug: 'xyz-solutions',
      status: 'ACTIVE'
    }
  });

  // 4. Create Users for Tenant A
  const adminA = await prisma.user.create({
    data: {
      tenantId: tenantA.id,
      name: 'Alice Admin',
      email: 'admin@abc.com',
      passwordHash,
      role: 'ADMIN',
      status: 'ACTIVE'
    }
  });

  const managerA = await prisma.user.create({
    data: {
      tenantId: tenantA.id,
      name: 'Bob Manager',
      email: 'manager@abc.com',
      passwordHash,
      role: 'MANAGER',
      status: 'ACTIVE'
    }
  });

  const userA = await prisma.user.create({
    data: {
      tenantId: tenantA.id,
      name: 'Charlie Analyst',
      email: 'user@abc.com',
      passwordHash,
      role: 'USER',
      status: 'ACTIVE'
    }
  });

  // 5. Create Users for Tenant B
  const adminB = await prisma.user.create({
    data: {
      tenantId: tenantB.id,
      name: 'Xavier Admin',
      email: 'admin@xyz.com',
      passwordHash,
      role: 'ADMIN',
      status: 'ACTIVE'
    }
  });

  const managerB = await prisma.user.create({
    data: {
      tenantId: tenantB.id,
      name: 'Yvonne Manager',
      email: 'manager@xyz.com',
      passwordHash,
      role: 'MANAGER',
      status: 'ACTIVE'
    }
  });

  const userB = await prisma.user.create({
    data: {
      tenantId: tenantB.id,
      name: 'Zack Specialist',
      email: 'user@xyz.com',
      passwordHash,
      role: 'USER',
      status: 'ACTIVE'
    }
  });

  // 6. Create Campaigns for Tenant A
  const campaignA1 = await prisma.campaign.create({
    data: {
      tenantId: tenantA.id,
      name: 'Q3 Phishing Simulation Assessment',
      description: 'Enterprise-wide email spear-phishing resilience evaluation for Q3.',
      status: 'ACTIVE',
      startDate: new Date('2026-07-01'),
      endDate: new Date('2026-09-30'),
      createdById: adminA.id
    }
  });

  const campaignA2 = await prisma.campaign.create({
    data: {
      tenantId: tenantA.id,
      name: 'Cloud Infrastructure Vulnerability Sweep',
      description: 'Automated vulnerability scanning across AWS and Azure production workloads.',
      status: 'ACTIVE',
      startDate: new Date('2026-08-15'),
      endDate: new Date('2026-10-15'),
      createdById: managerA.id
    }
  });

  const campaignA3 = await prisma.campaign.create({
    data: {
      tenantId: tenantA.id,
      name: 'SOC 2 Type II Readiness Audit',
      description: 'Annual compliance and access control verification for SOC 2 certification.',
      status: 'COMPLETED',
      startDate: new Date('2026-01-10'),
      endDate: new Date('2026-06-30'),
      createdById: adminA.id
    }
  });

  const campaignA4 = await prisma.campaign.create({
    data: {
      tenantId: tenantA.id,
      name: 'Zero Trust Network Architecture Audit',
      description: 'Comprehensive review of perimeter firewalls and microsegmentation rules.',
      status: 'DRAFT',
      startDate: new Date('2026-10-01'),
      endDate: new Date('2026-12-31'),
      createdById: adminA.id
    }
  });

  // Assign users to Tenant A campaigns
  await prisma.campaignUser.createMany({
    data: [
      { tenantId: tenantA.id, campaignId: campaignA1.id, userId: managerA.id },
      { tenantId: tenantA.id, campaignId: campaignA1.id, userId: userA.id },
      { tenantId: tenantA.id, campaignId: campaignA2.id, userId: userA.id }
    ]
  });

  // 7. Create Campaigns for Tenant B
  const campaignB1 = await prisma.campaign.create({
    data: {
      tenantId: tenantB.id,
      name: 'Internal Red Team Penetration Test',
      description: 'Hostile simulation targeting internal API gateways and databases.',
      status: 'ACTIVE',
      startDate: new Date('2026-09-01'),
      endDate: new Date('2026-11-30'),
      createdById: adminB.id
    }
  });

  const campaignB2 = await prisma.campaign.create({
    data: {
      tenantId: tenantB.id,
      name: 'Endpoint Ransomware Detection Drill',
      description: 'Evaluating EDR telemetry responses against staged ransomware payloads.',
      status: 'DRAFT',
      startDate: new Date('2026-10-15'),
      endDate: new Date('2026-11-15'),
      createdById: managerB.id
    }
  });

  // Assign users to Tenant B campaigns
  await prisma.campaignUser.createMany({
    data: [
      { tenantId: tenantB.id, campaignId: campaignB1.id, userId: managerB.id },
      { tenantId: tenantB.id, campaignId: campaignB1.id, userId: userB.id }
    ]
  });

  // 8. Create Security Events for Tenant A
  await prisma.securityEvent.createMany({
    data: [
      {
        tenantId: tenantA.id,
        eventType: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        severity: 'CRITICAL',
        status: 'OPEN',
        description: 'Repeated brute force SSH login failures detected from IP 198.51.100.42 on bastion node.',
        source: 'Perimeter Firewall'
      },
      {
        tenantId: tenantA.id,
        eventType: 'SUSPICIOUS_TOKEN_REFRESH',
        severity: 'HIGH',
        status: 'IN_PROGRESS',
        description: 'Anomalous geographic JWT refresh token usage detected across dual continents within 5 minutes.',
        source: 'Auth Identity Guard'
      },
      {
        tenantId: tenantA.id,
        eventType: 'MALWARE_SIGNATURE_MATCH',
        severity: 'CRITICAL',
        status: 'OPEN',
        description: 'Heuristic detection of encoded PowerShell staging script in temporary directory.',
        source: 'EDR Agent v4.2'
      },
      {
        tenantId: tenantA.id,
        eventType: 'CONFIGURATION_DRIFT',
        severity: 'MEDIUM',
        status: 'RESOLVED',
        description: 'S3 bucket policy briefly permitted unauthenticated read access during terraform run.',
        source: 'CloudTrail Monitor'
      },
      {
        tenantId: tenantA.id,
        eventType: 'PASSWORD_EXPIRY_WARNING',
        severity: 'LOW',
        status: 'CLOSED',
        description: 'Service account credentials reached 90-day rotation threshold.',
        source: 'IAM Policy Engine'
      }
    ]
  });

  // 9. Create Security Events for Tenant B
  await prisma.securityEvent.createMany({
    data: [
      {
        tenantId: tenantB.id,
        eventType: 'PORT_SCAN_DETECTED',
        severity: 'MEDIUM',
        status: 'OPEN',
        description: 'SYN scan targeting TCP ports 1000-5000 detected against load balancer.',
        source: 'WAF Suricata'
      },
      {
        tenantId: tenantB.id,
        eventType: 'DATA_EXFILTRATION_SPIKE',
        severity: 'CRITICAL',
        status: 'OPEN',
        description: 'Unusual outbound data transfer volume (15 GB) to unregistered foreign destination.',
        source: 'Network Flow Analyzer'
      },
      {
        tenantId: tenantB.id,
        eventType: 'CERTIFICATE_NEAR_EXPIRY',
        severity: 'LOW',
        status: 'RESOLVED',
        description: 'Wildcard SSL certificate for *.xyz.internal expires in 14 days.',
        source: 'Cert Manager'
      }
    ]
  });

  // 10. Create Audit Logs for Tenant A
  await prisma.auditLog.createMany({
    data: [
      {
        tenantId: tenantA.id,
        userId: adminA.id,
        action: 'USER_LOGIN_SUCCESS',
        resourceType: 'AUTH',
        resourceId: adminA.id,
        description: 'Administrator Alice Admin successfully logged in.',
        ipAddress: '192.168.1.10',
        metadata: { browser: 'Chrome 122', os: 'Windows 11' }
      },
      {
        tenantId: tenantA.id,
        userId: adminA.id,
        action: 'CAMPAIGN_CREATE',
        resourceType: 'CAMPAIGN',
        resourceId: campaignA1.id,
        description: 'Created new campaign: Q3 Phishing Simulation Assessment',
        ipAddress: '192.168.1.10',
        metadata: { campaignName: campaignA1.name, status: 'ACTIVE' }
      },
      {
        tenantId: tenantA.id,
        userId: managerA.id,
        action: 'CAMPAIGN_MEMBER_ASSIGN',
        resourceType: 'CAMPAIGN',
        resourceId: campaignA1.id,
        description: 'Assigned user Charlie Analyst to campaign Q3 Phishing Simulation Assessment',
        ipAddress: '192.168.1.15',
        metadata: { assignedUserId: userA.id }
      },
      {
        tenantId: tenantA.id,
        userId: adminA.id,
        action: 'SECURITY_EVENT_CREATE',
        resourceType: 'SECURITY_EVENT',
        description: 'Created security alert for UNAUTHORIZED_ACCESS_ATTEMPT',
        ipAddress: '192.168.1.10',
        metadata: { severity: 'CRITICAL' }
      }
    ]
  });

  // 11. Create Audit Logs for Tenant B
  await prisma.auditLog.createMany({
    data: [
      {
        tenantId: tenantB.id,
        userId: adminB.id,
        action: 'USER_LOGIN_SUCCESS',
        resourceType: 'AUTH',
        resourceId: adminB.id,
        description: 'Administrator Xavier Admin successfully logged in.',
        ipAddress: '10.0.0.5',
        metadata: { browser: 'Firefox 123', os: 'Linux x86_64' }
      },
      {
        tenantId: tenantB.id,
        userId: adminB.id,
        action: 'CAMPAIGN_CREATE',
        resourceType: 'CAMPAIGN',
        resourceId: campaignB1.id,
        description: 'Created new campaign: Internal Red Team Penetration Test',
        ipAddress: '10.0.0.5',
        metadata: { campaignName: campaignB1.name, status: 'ACTIVE' }
      }
    ]
  });

  console.log('✅ Seed completed successfully!');
  console.log('--- Development Credentials ---');
  console.log('Tenant A (ABC Technologies):');
  console.log('  Admin:   admin@abc.com    / Admin@123');
  console.log('  Manager: manager@abc.com  / Admin@123');
  console.log('  User:    user@abc.com     / Admin@123');
  console.log('Tenant B (XYZ Solutions):');
  console.log('  Admin:   admin@xyz.com    / Admin@123');
  console.log('  Manager: manager@xyz.com  / Admin@123');
  console.log('  User:    user@xyz.com     / Admin@123');
  console.log('-------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
