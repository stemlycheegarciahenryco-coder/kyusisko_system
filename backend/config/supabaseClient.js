const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Reads the keys we set up earlier in your backend .env file
const supabaseUrl = process.env.SUPABASE_API_URL; 
const supabaseKey = process.env.SUPABASE_ANON_KEY; 

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = { supabase };