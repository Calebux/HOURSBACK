---
name: deploy-check
description: Run pre-deployment checks before pushing to production. Use before deploying to Vercel.
disable-model-invocation: true
---

## Current state
- Branch: !`git branch --show-current`
- Uncommitted changes: !`git status --short`
- Recent commits: !`git log --oneline -5`

## Pre-deploy checklist

Run each check and report pass/fail:

### 1. Build
```
npm run build
```
Report any TypeScript errors or build failures.

### 2. Lint
```
npm run lint 2>/dev/null || echo "no lint script"
```

### 3. Pending migrations
Check if there are any new `.sql` files in `supabase/migrations/` that haven't been applied (compare with last deploy or ask the user).

### 4. Environment variables
Check `src/` for any `import.meta.env.VITE_` references and verify they're all documented. List any that might be missing from production.

### 5. Console logs
Search for leftover `console.log` statements in `src/`:
```
grep -r "console\.log" src/ --include="*.ts" --include="*.tsx" -l
```

### 6. Hardcoded secrets / test values
Search for obvious test artifacts:
```
grep -r "TODO\|FIXME\|HACK\|localhost:54" src/ --include="*.ts" --include="*.tsx" -l
```

## Summary

After running checks, output a table:

| Check | Status | Notes |
|-------|--------|-------|
| Build | ✅/❌ | ... |
| Lint | ✅/❌ | ... |
| Migrations | ✅/❌ | ... |
| Env vars | ✅/❌ | ... |
| Console logs | ✅/❌ | ... |
| Hardcoded values | ✅/❌ | ... |

Only say "ready to deploy" if all checks pass.
