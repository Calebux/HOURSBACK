---
name: debug
description: Structured debugging workflow. Use when the user reports a bug, error, or unexpected behavior.
---

Debug the issue: $ARGUMENTS

## Debugging process

Follow these steps in order. Do not skip to solutions before understanding the problem.

### 1. Reproduce
- Ask the user for exact steps to reproduce if not provided
- Identify: what is the expected behavior vs actual behavior?
- Note any error messages, stack traces, or console output

### 2. Locate
- Find the relevant code: which file, which function, which line?
- Read the code — don't assume, read it
- Check recent git changes: `git log --oneline -10` and `git diff HEAD~3`

### 3. Hypothesize
- Form 2-3 specific hypotheses about root cause
- Rank by likelihood
- State what evidence would confirm or rule out each

### 4. Investigate
- Add targeted logging or read relevant state
- Check related files (types, hooks, API calls, Supabase queries)
- For Supabase issues: check RLS policies, check if `auth.uid()` is set, check if service role is needed

### 5. Fix
- Apply the minimal fix that addresses the root cause
- Don't refactor surrounding code unless it's causing the bug
- Explain what was wrong and why the fix works

### 6. Verify
- Describe how to verify the fix works
- Check for regressions: does the fix affect other code paths?
