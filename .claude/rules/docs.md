# Documentation Rules

Frontend documentation is co-located with the backend docs at `backend/bola-backend/docs/`.
Frontend-specific concerns (routing, component contracts, API shapes) are reflected there too.

## When to Update Docs (Frontend Changes)

| Change | Files to update |
|--------|----------------|
| New page or route added | `.claude/knowledge/routing.md` |
| New API service method | `.claude/knowledge/api-services.md` |
| New or changed TypeScript type | `.claude/knowledge/data-models.md` |
| New feature visible to users | `backend/bola-backend/docs/specs/<feature>.spec.md` (frontend section) |
| New env var or build config | `.claude/knowledge/config.md` |

## Key Rule

After implementing any feature, always update the relevant `.claude/knowledge/` files.
These are the AI-facing summaries used in future conversations — stale knowledge leads to wrong suggestions.
