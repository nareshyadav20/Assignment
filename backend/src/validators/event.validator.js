import { z } from 'zod';

const severityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
const eventStatusEnum = z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']);

export const createEventSchema = z.object({
  body: z.object({
    eventType: z.string().min(2, 'Event type must be specified').max(100),
    severity: severityEnum,
    status: eventStatusEnum.optional().default('OPEN'),
    description: z.string().min(3, 'Description is required').max(1000),
    source: z.string().min(2, 'Source is required').max(100),
    sourceIp: z.string().max(100).optional().nullable(),
    assignedUserId: z.string().uuid().optional().nullable()
  })
});

export const updateEventStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid security event ID format')
  }),
  body: z.object({
    status: eventStatusEnum.optional(),
    severity: severityEnum.optional(),
    description: z.string().max(1000).optional(),
    assignedUserId: z.string().uuid().optional().nullable()
  })
});

export const queryEventSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default('10'),
    search: z.string().optional(),
    severity: severityEnum.optional(),
    status: eventStatusEnum.optional(),
    eventType: z.string().optional(),
    range: z.enum(['today', '7d', '30d']).optional()
  })
});
