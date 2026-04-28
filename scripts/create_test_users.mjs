import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Using public anon key for signup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const users = [
        { email: 'cliente@u-ticket.com', password: 'password123', full_name: 'Usuario Cliente' },
        { email: 'boletero@u-ticket.com', password: 'password123', full_name: 'Usuario Boletero' }
    ];

    for (const user of users) {
        console.log(`Creando ${user.email}...`);
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: user.email,
            password: user.password,
            options: {
                data: { full_name: user.full_name }
            }
        });

        if (authError) {
            if (authError.message.includes('already registered')) {
                console.log(`${user.email} ya existe.`);
            } else {
                console.error(`Error auth ${user.email}:`, authError.message);
            }
        } else {
            console.log(`${user.email} auth creado exitosamente.`);
        }
    }
}

main();
