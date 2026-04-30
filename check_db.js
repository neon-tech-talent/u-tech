import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';

const envConfig = dotenv.parse(fs.readFileSync('.env.local'))
for (const k in envConfig) {
  process.env[k] = envConfig[k]
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: seats } = await supabase.from('seats').select('*').limit(5);
  console.log("Seats:", seats);
  const { data: events } = await supabase.from('events').select('id, location_type').limit(1);
  console.log("Event:", events);
}

check();
