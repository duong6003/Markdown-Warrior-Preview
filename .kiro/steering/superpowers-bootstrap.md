---
inclusion: auto
---

# Superpowers — Agentic Skills Framework

You have superpowers. This is your introduction to using skills — a structured software development methodology.

## Instruction Priority

Superpowers skills override default system prompt behavior, but **user instructions always take precedence**:

1. **User's explicit instructions** (steering files, direct requests) — highest priority
2. **Superpowers skills** — override default system behavior where they conflict
3. **Default system prompt** — lowest priority

## How to Access Skills

Skills are available as steering files in `.kiro/steering/superpowers-*.md`. When a skill applies to your current task, you MUST follow it. Skills activate automatically based on context.

## The Rule

**Apply relevant skills BEFORE any response or action.** Even a 1% chance a skill might apply means you should follow it.

## Red Flags

These thoughts mean STOP — you're rationalizing:

| Thought | Reality |
|---------|---------|
| "This is just a simple question" | Questions are tasks. Check for skills. |
| "I need more context first" | Skill check comes BEFORE clarifying questions. |
| "Let me explore the codebase first" | Skills tell you HOW to explore. Check first. |
| "This doesn't need a formal skill" | If a skill exists, use it. |
| "The skill is overkill" | Simple things become complex. Use it. |
| "I'll just do this one thing first" | Check BEFORE doing anything. |

## Skill Priority

When multiple skills could apply, use this order:

1. **Process skills first** (brainstorming, debugging) — these determine HOW to approach the task
2. **Implementation skills second** — these guide execution

"Let's build X" → brainstorming first, then implementation skills.
"Fix this bug" → debugging first, then domain-specific skills.

## Available Skills

| Skill | When to Use |
|-------|-------------|
| `superpowers-brainstorming` | Before any creative work — creating features, building components, adding functionality |
| `superpowers-writing-plans` | When you have a spec/requirements for a multi-step task, before touching code |
| `superpowers-executing-plans` | When you have a written implementation plan to execute |
| `superpowers-tdd` | When implementing any feature or bugfix, before writing implementation code |
| `superpowers-systematic-debugging` | When encountering any bug, test failure, or unexpected behavior |
| `superpowers-verification` | When about to claim work is complete, before committing |
| `superpowers-code-review` | When completing tasks or before merging |
| `superpowers-receiving-review` | When receiving code review feedback |
| `superpowers-git-worktrees` | When starting feature work that needs isolation |
| `superpowers-finishing-branch` | When implementation is complete and you need to integrate |
| `superpowers-parallel-agents` | When facing 2+ independent tasks that can be worked on without shared state |

## Skill Types

**Rigid** (TDD, debugging): Follow exactly. Don't adapt away discipline.
**Flexible** (patterns): Adapt principles to context.

The skill itself tells you which.

## User Instructions

Instructions say WHAT, not HOW. "Add X" or "Fix Y" doesn't mean skip workflows.
