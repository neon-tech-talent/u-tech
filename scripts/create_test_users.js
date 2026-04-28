const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// Using anon key because email conf is off, we can use standard signup 
// and then use the anon key to just update profiles which might be open, OR we can't because of RLS.
// Wait, `profiles_update_all` or `profiles_read_own`. RLS on profiles might forbid anon update.
// Let's use the DB directly if RLS is strict, or since we disable email conf we let them log in and self-update?
// But we actually have `NEXT_PUBLIC_SUPABASE_ANON_KEY` only in `.env.local`. We don't have the service_role key readily visible.

// Let's try to sign up using standard sign_up. 
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const users = [
        { email: 'cliente@u-ticket.com', password: 'password123', full_name: 'Usuario Cliente', role: 'CUSTOMER' },
        { email: 'boletero@u-ticket.com', password: 'password123', full_name: 'Usuario Boletero', role: 'SCANNER' }
    ];

    for (const user of users) {
        console.log(`Creando ${user.email}...`);
        // 1. Sign Up
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: user.email,
            password: user.password,
            options: {
                data: { full_name: user.full_name }
            }
        });

        if (authError) {
            console.error(`Error auth ${user.email}:`, authError.message);
            // Wait, if it already exists, let's just log in
            if (authError.message.includes('already registered')) {
                const { data: loginData } = await supabase.auth.signInWithPassword({
                    email: user.email,
                    password: user.password
                });
                if (loginData.user) {
                    // Update profile using the session token! Wait, user can update their own profile? Only if RLS allows. 
                    // Let's just create an SQL statement for the user to run to force the roles, it's 100% reliable.
                }
            }
        } else {
            console.log(`${user.email} auth creado (id: ${authData.user.id}).`);
            // 2. We can try to update the role. Wait, RLS on `profiles` is `USING (id = auth.uid())` for SELECT, 
            // but no UPDATE policy defined! So normal users can't update their role.
            // So the trigger created it as 'CUSTOMER'. 
        }
    }
}

main();
