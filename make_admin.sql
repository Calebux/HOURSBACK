
-- Run this in your Supabase SQL Editor to elevate the user to admin!
UPDATE profiles 
SET is_admin = true 
WHERE email = 'idahoconnect212@gmail.com';
  