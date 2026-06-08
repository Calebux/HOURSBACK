DO $$
DECLARE
  target_email text := 'petersoncalebc@gmail.com';
  target_user_id uuid;
BEGIN
  SELECT id
    INTO target_user_id
    FROM auth.users
   WHERE lower(email) = lower(target_email)
   LIMIT 1;

  IF target_user_id IS NULL THEN
    RAISE NOTICE 'No auth user found for %', target_email;
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1
      FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'profiles'
       AND column_name = 'subscription_expires_at'
  ) THEN
    UPDATE public.profiles
       SET subscription_status = 'pro',
           subscription_expires_at = now() + interval '30 days'
     WHERE id = target_user_id
        OR lower(coalesce(email, '')) = lower(target_email);
  ELSE
    UPDATE public.profiles
       SET subscription_status = 'pro'
     WHERE id = target_user_id
        OR lower(coalesce(email, '')) = lower(target_email);
  END IF;

  RAISE NOTICE 'Upgraded % to pro for testing', target_email;
END $$;
