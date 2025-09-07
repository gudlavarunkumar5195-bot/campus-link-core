// Production-ready Supabase client configuration
// Uses environment variables for credentials
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Get credentials from environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://sdoidtzxaxpmhgrocpah.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkb2lkdHp4YXhwbWhncm9jcGFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwNjU1OTcsImV4cCI6MjA2ODY0MTU5N30.8OxH3c7V0ZAWLT6KDIGhXgwHY2GBXANjiFh6gk6ACGE';

// Validate required environment variables in development
if (import.meta.env.DEV) {
  if (!SUPABASE_URL || SUPABASE_URL === 'https://sdoidtzxaxpmhgrocpah.supabase.co') {
    console.warn('⚠️ Using default Supabase URL. Set VITE_SUPABASE_URL in your .env file');
  }
  if (!SUPABASE_ANON_KEY || SUPABASE_ANON_KEY.startsWith('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9')) {
    console.warn('⚠️ Using default Supabase anon key. Set VITE_SUPABASE_ANON_KEY in your .env file');
  }
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});