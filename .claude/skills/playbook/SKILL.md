---
name: playbook
description: Create a new playbook definition for the app. Use when the user wants to add a new playbook to the library.
disable-model-invocation: true
---

Create a new playbook: $ARGUMENTS

## Steps

1. Read `src/data/playbooks.ts` to understand the Playbook type and existing entries
2. Read 2-3 existing playbook entries to match the tone, structure, and level of detail
3. Add the new playbook entry to the appropriate category in `src/data/playbooks.ts`:
   - Required fields: `id`, `title`, `description`, `category`, `prompt`, `icon`, `tags`
   - `id` should be kebab-case, unique
   - `prompt` is the actual system prompt sent to the AI — make it detailed and actionable
   - Match the writing style of existing prompts (professional, directive, structured)
4. If the user specified a category that doesn't exist, ask before creating one
5. Show a summary of what was added (id, title, category)
