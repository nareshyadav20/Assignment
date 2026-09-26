import { z } from 'zod';

export const queryAuditSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default('10'),
    action: z.string().optional(),
    resourceType: z.string().optional(),
    userId: z.string().uuid().optional()
  })
});
