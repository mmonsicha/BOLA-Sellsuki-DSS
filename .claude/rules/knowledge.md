# Knowledge Files

`.claude/knowledge/` contains frontend context that is NOT auto-loaded.
Do NOT read all files upfront — read only what your task requires.

## Inventory

| File | Contains | Read when |
|------|----------|-----------|
| `api-services.md` | All API service modules, client patterns, request/response shapes | Adding/modifying API calls or service files |
| `data-models.md` | All TypeScript interfaces in `src/types/index.ts` | Working with data types, adding new entities |
| `config.md` | Vite config, env vars, Tailwind setup, auth localStorage keys, build scripts | Adding env vars, config, build targets |
| `routing.md` | Client-side route table, navigation pattern, page directory structure | Adding/modifying pages or routes |

## Rules

- Read only the file(s) relevant to your task BEFORE making changes
- When delegating to sub-agents, tell them WHICH knowledge files to read (not "all")
- After adding a new domain/route/type/service, update the relevant knowledge file
- The `rules/` directory is auto-loaded — knowledge files are not
