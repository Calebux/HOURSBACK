---
name: security-review
description: Review code for security vulnerabilities. Use when auditing changed files, new features, or Supabase schema changes.
disable-model-invocation: true
---

## Files to review
- Changed files: !`git diff --name-only HEAD~1 2>/dev/null || git diff --name-only`
- Staged files: !`git diff --cached --name-only`

Perform a security review on: $ARGUMENTS

## Checklist

Review for each of the following. Report every finding with file:line reference.

### Supabase / Database
- [ ] All new tables have RLS enabled
- [ ] RLS policies use `auth.uid()` — not a column that could be spoofed
- [ ] No SQL built by string concatenation (injection risk)
- [ ] Service role key never exposed to the client (`VITE_` prefix = client-visible)
- [ ] No direct use of `supabaseAdmin` on the client side

### Authentication
- [ ] Protected routes check `user` from `useAuth()` before rendering
- [ ] API calls include the user's session token, not a hardcoded key
- [ ] No auth bypass via URL params or query strings

### Input handling
- [ ] User-supplied strings are not inserted into HTML (XSS)
- [ ] No `dangerouslySetInnerHTML` with unsanitized input
- [ ] File uploads (if any) validate type and size

### Secrets & environment
- [ ] No secrets hardcoded in source (`sk-`, `Bearer `, API keys)
- [ ] All secrets use `import.meta.env.VITE_` (public) or server-side only
- [ ] `.env` is in `.gitignore`

### API calls
- [ ] External API calls don't expose full user data unnecessarily
- [ ] Error messages don't leak internal implementation details to the UI

## Output format

For each issue found:
```
[SEVERITY: HIGH/MEDIUM/LOW] file:line
Issue: description
Fix: what to do
```

If no issues found, say "No security issues found in reviewed files."
