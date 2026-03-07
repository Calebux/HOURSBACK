---
name: component
description: Scaffold a new React component for this project. Use when the user asks to create a new component, page, or UI element.
disable-model-invocation: true
---

Create a new React component: $ARGUMENTS

## Project conventions

- Components go in `src/components/` (shared) or `src/pages/` (full pages)
- UI primitives go in `src/components/ui/`
- Use TypeScript with explicit prop interfaces
- Use Tailwind CSS for styling — no inline styles
- Use `lucide-react` for icons
- Use `framer-motion` for animations when needed
- Import path alias: `@/` maps to `src/`
- Reuse existing UI components from `src/components/ui/` (Button, Badge, etc.)

## Steps

1. Determine if this is a page (`src/pages/`) or a shared component (`src/components/`)
2. Read 1-2 similar existing files to match the exact style and patterns
3. Create the file with:
   - Named export (not default)
   - TypeScript interface for props
   - Tailwind classes matching the dark theme used throughout the app
   - `cn()` from `@/lib/utils` for conditional classes
4. If it's a page, check `src/App.tsx` to see how routing is set up and note where to add the route (but don't add it unless asked)
5. Show the created file path and a brief summary of what was created
