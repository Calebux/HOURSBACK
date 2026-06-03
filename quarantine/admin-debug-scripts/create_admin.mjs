import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import * as fs from 'fs';
dotenv.config({ path: './.env.local' });

// We need the service role key to bypass email confirmation
// Let's ask the user to provide it or check if it exists in another env file
console.log("To bypass email confirmation and create an admin user directly, we need your Supabase Service Role Key.");
console.log("Please run this script again with the SERVICE_ROLE_KEY environment variable set:");
console.log("SERVICE_ROLE_KEY=your_key node create_admin.mjs");

const serviceRoleKey = process.env.SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
    console.log("\nAlternatively, I can just create a SQL script for you to run in the Supabase Dashboard's SQL Editor.");
    const sql = `
-- Run this in your Supabase SQL Editor to elevate the user to admin!
UPDATE profiles 
SET is_admin = true 
WHERE email = 'idahoconnect212@gmail.com';
  `;
    fs.writeFileSync('make_admin.sql', sql);
    console.log("Generated 'make_admin.sql' with the exact command.");
    process.exit(1);
}

const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function run() {
    const email = 'idahoconnect212@gmail.com';
    const password = 'owofasan';

    console.log(`Checking for existing user: ${email}...`);
    // Try to find the user
    const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers();

    if (usersError) {
        console.error("Failed to list users:", usersError);
        return;
    }

    let user = usersData.users.find(u => u.email === email);

    if (user) {
        console.log("User found! Updating password and confirming email...");
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
            password: password,
            email_confirm: true // This is the magic bypass!
        });

        if (updateError) {
            console.error("Failed to update user:", updateError);
            return;
        }
    } else {
        console.log("User not found. Creating new confirmed admin user...");
        const { data: newUserData, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true // Mágica bypass
        });

        if (createError) {
            console.error("Failed to create user:", createError);
            return;
        }
        user = newUserData.user;
    }

    console.log("Ensuring user is marked as Admin in the 'profiles' table...");
    // Upsert the profile to guarantee admin status
    const { error: profError } = await supabaseAdmin.from('profiles').upsert({
        id: user.id,
        email: email,
        is_admin: true
    });

    if (profError) {
        console.error("Failed to elevate profile to Admin:", profError);
    } else {
        console.log("SUCCESS! You can now log into the frontend with these exact credentials.");
        console.log("Head to http://localhost:5173/ and log in. The UI will instantly recognize you as an admin.");
    }
}

run();
