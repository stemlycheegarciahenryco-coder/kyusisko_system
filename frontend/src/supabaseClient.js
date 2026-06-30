import { createClient } from '@supabase/supabase-js';

// These two values are the ONLY thing you put in this file.
// The URL tells the app where the Supabase server is.
// The Key gives your frontend permission to talk to it.
dotenv.config(); // Load environment variables from .env file
const supabaseUrl = process.env.SUPABASE_API_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);