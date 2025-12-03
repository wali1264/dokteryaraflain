
import { createClient } from '@supabase/supabase-js';

// --- CONFIGURATION ---
const SUPABASE_URL = 'https://vbrtdgschftcotennilm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZicnRkZ3NjaGZ0Y290ZW5uaWxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2ODIyNTYsImV4cCI6MjA4MDI1ODI1Nn0.bjaJAvbBmEyV7wag1K-Ae0a2_ILEyl_iU7Y3MuM-Gks';

// Admin Secret for the Hidden Panel
export const ADMIN_SECRET_CODE = 'Alliwali@1264';

// Database Table Names
export const TABLES = {
  DOCTORS: 'doctors',
  PRESCRIPTIONS: 'prescriptions_archive',
  TEMPLATES: 'templates_archive'
};

export const BUCKETS = {
  HEADERS: 'doctor-headers'
};

// Initialize the Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
