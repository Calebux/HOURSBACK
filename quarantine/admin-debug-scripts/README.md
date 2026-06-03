# Quarantined Admin and Debug Scripts

These scripts were moved out of the project root because they were ad hoc
database/auth utilities for debugging, RLS checks, signup tests, and admin
elevation.

Do not run these against production without first reviewing and updating them.
Several scripts expect privileged Supabase credentials or contain old test
account assumptions. Prefer replacing any still-needed workflow with a reviewed
CLI command, Supabase migration, or documented runbook.
