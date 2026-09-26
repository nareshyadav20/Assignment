import { z } from 'zod';

const roleEnum = z.enum(['ADMIN', 'MANAGER', 'USER']);
const statusEnum = z.enum(['ACTIVE', 'INACTIVE']);

export const createUserSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters long').max(100),
    email: z.string().email('Please provide a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    role: roleEnum.default('USER'),
    status: statusEnum.optional().default('ACTIVE')
  })
});

export const updateUserSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid user ID format')
  }),
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    email: z.string().email().optional(),
    role: roleEnum.optional(),
    status: statusEnum.optional(),
    password: z.string().min(6).optional()
  })
});

export const queryUserSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default('10'),
    search: z.string().optional(),
    role: roleEnum.optional(),
    status: statusEnum.optional()
  })
});
