# Jira MCP Rules

## Rate Limiting — CRITICAL

Jira Cloud enforces a sliding rate limit. Violating it causes 429 errors that persist
for several minutes and block all subsequent requests.

### Rules for write operations (create / update / comment / transition)
- **Always wait 10 seconds between consecutive write calls** (`sleep 10` via Bash tool)
- Never batch multiple write calls in the same message turn
- If you receive a 429 error, wait **90 seconds** before retrying — shorter waits will fail
- Read operations (get / search) are cheaper but still space them >=2s apart when looping

```
# Correct pattern — one write, then wait, then next write
createJiraIssue(...)   -> sleep 10 -> createJiraIssue(...)   -> sleep 10 -> ...

# Wrong — never fire multiple writes in a single turn without waits
createJiraIssue(...)
createJiraIssue(...)   <- will 429
createJiraIssue(...)   <- will 429
```

---

## Correct Tool Signatures

### `mcp__jira__getJiraIssue`
```
required: cloudId, issueIdOrKey        <- NOT "issueKey", NOT "key"
optional: fields, expand
```

### `mcp__jira__createJiraIssue`
```
required: cloudId, projectKey, issueTypeName, summary
                             ^ NOT "issueType", NOT "type"
optional: description, parent, assignee_account_id, additional_fields
          ^ parent = "LR-13" string (parent issue key for subtasks)
```

### `mcp__jira__searchJiraIssuesUsingJql`
```
required: cloudId, jql
optional: fields (array), maxResults (default 10, max 100), nextPageToken
```

### `mcp__jira__addCommentToJiraIssue`
```
required: cloudId, issueIdOrKey, commentBody   <- commentBody is Markdown string
optional: commentVisibility
```

### `mcp__jira__getJiraProjectIssueTypesMetadata`
```
required: cloudId, projectIdOrKey    <- NOT "projectKey"
optional: maxResults, startAt
```

### `mcp__jira__getTransitionsForJiraIssue`
```
required: cloudId, issueIdOrKey
```

### `mcp__jira__transitionJiraIssue`
```
required: cloudId, issueIdOrKey, transitionId
```

### `mcp__jira__editJiraIssue`
```
required: cloudId, issueIdOrKey
optional: summary, description, additional_fields
```

### `mcp__jira__addWorklogToJiraIssue`
```
required: cloudId, issueIdOrKey, timeSpent
optional: comment, started
```

---

## Issue Type Hierarchy for Project LR

```
Epic  (hierarchyLevel 1)
+-- Story / Tech Story / Bug / Tech Enhancement / UI Enhancement  (hierarchyLevel 0)
    +-- Dev Task / QA Task  (hierarchyLevel -1, subtask: true)
```

| Name | ID | subtask | Use when |
|------|----|---------|----------|
| Epic | 10000 | false | Large feature grouping stories |
| Story | 10014 | false | End-user visible feature |
| Tech Story | 10371 | false | Purely technical work |
| Task | 10155 | false | Standalone small piece of work |
| Bug | 10157 | false | Defect / incorrect behavior |
| Tech Enhancement | 10367 | false | Improve existing technical capability |
| UI Enhancement | 10368 | false | Improve existing user-facing interface |
| Sub-task | 10156 | true | Generic subtask (prefer Dev Task / QA Task instead) |
| **Dev Task** | **10369** | **true** | Developer implementation subtask |
| **QA Task** | **10370** | **true** | QA testing subtask |

> **Always use `Dev Task` and `QA Task`** for subtasks — never the generic `Sub-task`.
> Pass the name string to `issueTypeName`: `"Dev Task"`, `"QA Task"`, `"Story"`, etc.

---

## Subtask Parent Rules

- Dev Task and QA Task are `hierarchyLevel: -1` — they must have a `parent` set to a Story or Tech Story key
- Epics (`hierarchyLevel: 1`) **cannot** be the direct parent of a subtask
- To break down an Epic, first create Stories under it, then create Dev/QA Tasks under those Stories

---

## Recommended Workflow Pattern

### Breaking down a Story into subtasks

```
1. getJiraIssue -> read full description & acceptance criteria
   sleep 2

2. addCommentToJiraIssue -> post Technical Specification
   sleep 10

3. createJiraIssue (Dev Task 1, parent=story)
   sleep 10

4. createJiraIssue (Dev Task 2, parent=story)
   sleep 10

...repeat for each subtask...

N. createJiraIssue (QA Task 1, parent=story)
   sleep 10

N+1. createJiraIssue (QA Task 2, parent=story)
```

### Fetching multiple issues safely

```
getJiraIssue(LR-13)
sleep 2
getJiraIssue(LR-14)
sleep 2
getJiraIssue(LR-15)
```

---

## Common Mistakes to Avoid

| Wrong | Correct |
|-------|---------|
| `issueKey: "LR-13"` | `issueIdOrKey: "LR-13"` |
| `issueType: "Dev Task"` | `issueTypeName: "Dev Task"` |
| `projectKey: "LR"` in getJiraProjectIssueTypesMetadata | `projectIdOrKey: "LR"` |
| Firing 3+ writes without sleep | Wait 10s between each write |
| Retrying 429 after 20s | Wait at least 90s before retrying after a 429 |
| Creating Dev/QA Task under an Epic directly | Create Story first, then subtasks under Story |
| Using `"Sub-task"` as type | Use `"Dev Task"` or `"QA Task"` |

---

## Project Constants

| Field | Value |
|-------|-------|
| Cloud ID | `50dc7e4a-0539-4dcf-9c33-5481a395a5ab` |
| Project Key | `LR` |
| Project ID | `10192` |
