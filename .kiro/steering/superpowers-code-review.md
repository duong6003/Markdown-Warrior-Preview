---
inclusion: manual
---

# Requesting Code Review

Review early, review often. Catch issues before they cascade.

## When to Request Review

**Mandatory:**
- After completing major feature
- Before merge to main

**Optional but valuable:**
- When stuck (fresh perspective)
- Before refactoring (baseline check)
- After fixing complex bug

## How to Request

1. **Identify scope:** What commits/changes to review
2. **Provide context:** Brief summary of what was built and what it should do
3. **Review the diff yourself first:** Self-review catches obvious issues

## Review Checklist

When reviewing code (self or others):

- Does it meet the requirements/spec?
- Are there tests for new behavior?
- Do all tests pass?
- Is the code clear and well-named?
- Are there edge cases not handled?
- Is error handling appropriate?
- Are there security concerns?
- Is it DRY without being over-abstracted?

## Acting on Feedback

- Fix Critical issues immediately
- Fix Important issues before proceeding
- Note Minor issues for later
- Push back if reviewer is wrong (with reasoning)

## Red Flags

**Never:**
- Skip review because "it's simple"
- Ignore Critical issues
- Proceed with unfixed Important issues
- Argue with valid technical feedback without evidence
