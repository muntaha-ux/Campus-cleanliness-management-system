import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().default('http://127.0.0.1:54321'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).default('mock_anon_key_for_dev'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).default('mock_service_role_key_for_dev'),
  CAMPUS_TIMEZONE: z.string().default('Asia/Dhaka'),
  NEXT_PUBLIC_APP_URL: z.string().default('http://localhost:3000'),
});

export const env = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock_anon_key_for_dev',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || 'mock_service_role_key_for_dev',
  CAMPUS_TIMEZONE: process.env.CAMPUS_TIMEZONE || 'Asia/Dhaka',
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
};

