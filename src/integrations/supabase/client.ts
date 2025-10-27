import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = 'https://acabqlnycumtqpggyntf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjYWJxbG55Y3VtdHFwZ2d5bnRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNDUzOTUsImV4cCI6MjA3NjgyMTM5NX0.L1MSkg8a5o9NhnmwGTijKYtV-8DuoYhbnRHqUIhKV4I';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);