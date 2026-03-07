---
name: review-pr
description: Review a pull request or set of changes. Use when the user asks to review a PR, diff, or set of changes.
disable-model-invocation: true
context: fork
---

## PR context
- Diff: !`git diff main...HEAD 2>/dev/null || git diff HEAD~1`
- Recent commits: !`git log --oneline -10`
- Changed files: !`git diff --name-only main...HEAD 2>/dev/null || git diff --name-only HEAD~1`

Review the changes: $ARGUMENTS

## Review criteria

### Correctness
- Does the code do what it claims to do?
- Are there edge cases that aren't handled?
- Are async operations properly awaited? Error states handled?

### Supabase / data layer
- Are new queries efficient? Missing indexes?
- Do new RLS policies cover all access patterns?
- Are optimistic updates properly rolled back on error?

### React / UI
- Are hooks called unconditionally (rules of hooks)?
- Are expensive computations memoized where needed?
- Are loading and error states shown to the user?
- No prop drilling that should be context?

### TypeScript
- No `any` types introduced without justification
- Props interfaces are complete and accurate

### Code quality
- No dead code or commented-out blocks
- No console.log left in
- Changes are focused — no unrelated refactors mixed in

## Output format

Structure your review as:

**Summary**: 1-2 sentence overview of what the changes do.

**Issues** (if any):
- 🔴 Blocking: must fix before merge
- 🟡 Non-blocking: worth addressing
- 💡 Suggestion: optional improvement

**Verdict**: ✅ Approve / ⚠️ Approve with comments / 🔴 Request changes
