---
inclusion: manual
---

# Using Git Worktrees

## Overview

Ensure work happens in an isolated workspace. Prefer native tools. Fall back to manual git worktrees only when no native tool is available.

**Core principle:** Detect existing isolation first. Then use native tools. Then fall back to git. Never fight the harness.

## Step 0: Detect Existing Isolation

Before creating anything, check if you are already in an isolated workspace:

```bash
git rev-parse --git-dir
git rev-parse --git-common-dir
git branch --show-current
```

**If already in a worktree:** Skip creation. Report: "Already in isolated workspace."

**If in a normal repo:** Ask for consent before creating a worktree:
> "Would you like me to set up an isolated worktree? It protects your current branch from changes."

## Step 1: Create Isolated Workspace

Create a new branch and worktree:

```bash
git worktree add .worktrees/<branch-name> -b <branch-name>
cd .worktrees/<branch-name>
```

**Safety:** Verify `.worktrees` is in `.gitignore` before creating. If not, add it.

## Step 2: Project Setup

Auto-detect and run appropriate setup:
- Node.js: `npm install`
- Rust: `cargo build`
- Python: `pip install -r requirements.txt`
- Go: `go mod download`

## Step 3: Verify Clean Baseline

Run tests to ensure workspace starts clean:

```bash
npm test / cargo test / pytest / go test ./...
```

**If tests fail:** Report failures, ask whether to proceed or investigate.
**If tests pass:** Report ready.

## Quick Reference

| Situation | Action |
|-----------|--------|
| Already in worktree | Skip creation |
| Normal repo | Ask consent, then create |
| `.worktrees/` not ignored | Add to .gitignore first |
| Tests fail during baseline | Report + ask |
| No package manager | Skip dependency install |

## Red Flags

**Never:**
- Create a worktree when already in one
- Skip baseline test verification
- Proceed with failing tests without asking
- Create worktree without verifying it's ignored
