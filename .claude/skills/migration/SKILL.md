---
name: migration
description: Create a new Supabase SQL migration file. Use when the user asks to add a table, column, index, RLS policy, or any database change.
disable-model-invocation: true
---

Create a Supabase migration for: $ARGUMENTS

## Current state
- Latest migrations: !`ls supabase/migrations/ | tail -5`
- Today's date: !`date +%Y%m%d`

## Steps

1. Generate a timestamp prefix: `YYYYMMDDHHmmss` (use current date/time)
2. Create file at `supabase/migrations/<timestamp>_<short_description>.sql`
3. Write the migration SQL following these rules:
   - Always use `IF NOT EXISTS` / `IF EXISTS` guards
   - Add RLS: `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
   - Add policies for `authenticated` role (select, insert, update, delete as appropriate)
   - Add a `service_role` bypass policy if the table needs to be accessed server-side
   - Use `auth.uid()` for user-scoped policies
   - Add indexes for foreign keys and frequently queried columns
   - Include a comment block at the top describing what the migration does
4. Show the full file content and path
5. Remind the user to run: `npx supabase db push` or apply via Supabase dashboard

## RLS policy template

```sql
-- Select: users can only see their own rows
CREATE POLICY "Users can view own rows" ON <table>
  FOR SELECT USING (auth.uid() = user_id);

-- Insert: authenticated users only
CREATE POLICY "Authenticated users can insert" ON <table>
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Update: users can only update their own rows
CREATE POLICY "Users can update own rows" ON <table>
  FOR UPDATE USING (auth.uid() = user_id);

-- Service role bypass
CREATE POLICY "Service role full access" ON <table>
  USING (auth.role() = 'service_role');
```
