import { z } from 'zod';

const campaignStatusEnum = z.enum(['DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED']);

export const createCampaignSchema = z.object({
  body: z.object({
    name: z.string().min(3, 'Campaign name must be at least 3 characters long').max(100),
    description: z.string().max(1000).optional().nullable(),
    status: campaignStatusEnum.optional().default('DRAFT'),
    startDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional().nullable(),
    endDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional().nullable(),
  })
});

export const updateCampaignSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid campaign ID format')
  }),
  body: z.object({
    name: z.string().min(3).max(100).optional(),
    description: z.string().max(1000).optional().nullable(),
    status: campaignStatusEnum.optional(),
    startDate: z.string().optional().nullable(),
    endDate: z.string().optional().nullable(),
  })
});

export const assignUserSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid campaign ID format')
  }),
  body: z.object({
    userId: z.string().uuid('Invalid user ID format')
  })
});

export const removeUserSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid campaign ID format'),
    userId: z.string().uuid('Invalid user ID format')
  })
});

export const queryCampaignSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default('10'),
    search: z.string().optional(),
    status: campaignStatusEnum.optional(),
    sortBy: z.enum(['name', 'status', 'createdAt', 'startDate', 'endDate']).optional().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
  })
});
