---
name: open-pr
description: Use when the user asks to create, open, or submit a Pull Request on GitHub. Creates a branch, commits, pushes, and opens a PR following project conventions.
---

# Open PR

Use this skill when the user asks to open a PR or create a pull request.

## Workflow

1. Ensure working tree is clean (stash or commit pending changes)
2. Create a feature branch from `main` following the branch naming pattern:
   - `^(feat|fix|build|chore|ci|docs|perf|refactor|style|test)\/[a-z0-9._-]+$`
3. Make commits following [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)
4. Push the branch to origin
5. Open a Pull Request to `main` with:

### PR Template

```markdown
## Summary

<!-- Describe the change and why it's needed -->

## Type of Change

<!-- Select the type that matches the branch prefix -->

- [ ] feat — new feature
- [ ] fix — bug fix
- [ ] build — build system or dependencies
- [ ] chore — maintenance
- [ ] ci — CI configuration
- [ ] docs — documentation only
- [ ] perf — performance improvement
- [ ] refactor — code restructuring
- [ ] style — formatting, linting
- [ ] test — adding or fixing tests

## How to Test

<!-- Steps to verify the change -->

## Screenshots (if applicable)

## Checklist

- [ ] Branch name follows `tipo/descricao` pattern
- [ ] Commits follow conventional commits
- [ ] Lint passes (`npm run lint`)
- [ ] Build passes (`npm run build`)
```

Use `gh` if available, otherwise provide the PR link.
