import { createClient } from '@supabase/supabase-js';

// These two values are the ONLY thing you put in this file.
// The URL tells the app where the Supabase server is.
// The Key gives your frontend permission to talk to it.

const supabaseUrl = 'https://hwbhjdqpgjsjqtraismo.supabase.co';
const supabaseAnonKey = 'sb_publishable_iBgoDULYA2Eg46VmjJwauQ_GaBb1AwV';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);