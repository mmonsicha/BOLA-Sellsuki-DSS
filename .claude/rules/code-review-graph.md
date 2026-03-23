# Code Review Graph

This project has a pre-built knowledge graph (`.code-review-graph/`).
Use it to navigate the codebase efficiently — instead of guessing where code lives.

## When to use

- **Finding code** — `semantic_search_nodes_tool(query)` or `query_graph_tool(pattern="children_of", target="src/entity")` to locate relevant files
- **Understanding dependencies** — `imports_of` / `importers_of` before refactoring
- **Assessing impact** — `get_impact_radius_tool(target)` before changing shared code
- **Code review** — `get_review_context_tool(file_path)` for structural context on changed files
- **After significant changes** — `build_or_update_graph_tool()` to keep the graph current

## Available tools

All tools use `mcp__plugin_code-review-graph_code-review-graph__` prefix:

| Tool | Purpose |
|------|---------|
| `query_graph_tool(pattern, target)` | Explore code structure (see patterns below) |
| `get_impact_radius_tool(target)` | Assess blast radius before making changes |
| `get_review_context_tool(file_path)` | Get full context for reviewing a file |
| `semantic_search_nodes_tool(query)` | Find code by meaning/concept |
| `build_or_update_graph_tool()` | Rebuild graph after significant changes |

## Query patterns

| Pattern | Purpose | Example target |
|---------|---------|---------------|
| `children_of` | List contents of a file/package | `src/entity` |
| `file_summary` | All exports in a file | `src/use_case/order.go` |
| `callers_of` | Who calls this function | `CreateOrder` |
| `callees_of` | What this function calls | `CreateOrder` |
| `imports_of` | What a file imports | `src/use_case/order.go` |
| `importers_of` | Who imports this package | `src/entity/order` |
| `tests_for` | Find tests for a target | `CreateOrder` |
| `inheritors_of` | Find implementations | `OrderRepository` |
