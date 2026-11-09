import { z } from 'zod';

export const passwordComplexitySchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const signUpSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: passwordComplexitySchema,
  full_name: z.string().min(2, 'Full name must be at least 2 characters').max(150),
  role: z.enum(['STUDENT', 'TEACHER', 'STAFF', 'ADMIN']).default('STUDENT'),
  department: z.string().max(100).optional(),
  student_or_employee_id: z.string().max(50).optional(),
});

export const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export const resetPasswordSchema = z.object({
  password: passwordComplexitySchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const updateProfileSchema = z.object({
  full_name: z.string().min(2).max(150).optional(),
  department: z.string().max(100).optional().nullable(),
  student_or_employee_id: z.string().max(50).optional().nullable(),
  profile_photo_url: z.string().url().optional().nullable(),
  notification_preferences: z
    .object({
      email: z.boolean(),
      in_app: z.boolean(),
    })
    .optional(),
});

export const updateRoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['STUDENT', 'TEACHER', 'STAFF', 'ADMIN']),
});

export const updateActiveStatusSchema = z.object({
  userId: z.string().uuid(),
  isActive: z.boolean(),
});

