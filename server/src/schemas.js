import { z } from 'zod';

const email = z.email().max(160).transform((value) => value.toLowerCase());
const password = z.string().min(8).max(72);

export const signupSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email,
  password,
  role: z.enum(['admin', 'member']).default('member')
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1)
});

export const projectSchema = z.object({
  name: z.string().trim().min(3).max(120),
  description: z.string().trim().max(1000).optional().default('')
});

export const memberSchema = z.object({
  email,
  role: z.enum(['admin', 'member']).default('member')
});

export const taskSchema = z.object({
  title: z.string().trim().min(3).max(140),
  description: z.string().trim().max(1200).optional().default(''),
  assigneeId: z.number().int().positive().nullable().optional(),
  status: z.enum(['todo', 'in_progress', 'review', 'done']).default('todo'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  dueDate: z.string().date().nullable().optional()
});

export const taskUpdateSchema = taskSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: 'At least one field is required'
});

export const commentSchema = z.object({
  comment: z.string().trim().min(1).max(500)
});
