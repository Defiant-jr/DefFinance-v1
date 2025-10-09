import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aevzovvqlbvngjeyegbe.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFldnpvdnZxbGJ2bmdqZXllZ2JlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3Mzc3MDYsImV4cCI6MjA2NDMxMzcwNn0.CmsJMCRIopa3GQN4K_4OZ3tT1celD3e1bftXE1KTSuc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);