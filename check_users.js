import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';

const envConfig = dotenv.parse(fs.readFileSync('.env.local'))
for (const k in envConfig) {
  process.env[k] = envConfig[k]
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsers() {
  const { data: profiles } = await supabase.from('profiles').select('full_name, role').limit(10);
  console.log("Profiles:", profiles);
}

checkUsers();
