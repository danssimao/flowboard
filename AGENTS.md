# Flowboard Widget — Project Conventions

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/):

```
<type>(<optional scope>): <description>

[optional body]

BREAKING CHANGE: <description>
```

Allowed types: `feat`, `fix`, `build`, `chore`, `ci`, `docs`, `perf`, `refactor`, `style`, `test`.

- `feat:` — new feature (minor bump)
- `fix:` — bug fix (patch bump)
- `BREAKING CHANGE` or `!` — major bump

## Branch Naming

Must follow the pattern `tipo/descricao`:

```
^(feat|fix|build|chore|ci|docs|perf|refactor|style|test)\/[a-z0-9._-]+$
```

Examples: `feat/add-widget`, `fix/button-color`, `chore/update-deps`

## Workflow

1. Create a feature branch from `main` following the naming pattern above
2. Make commits following conventional commits
3. Push the branch and open a Pull Request to `main`
4. **WAIT for user confirmation before merging**
5. Squash merge the PR into `main`
6. Semantic-release automatically creates a git tag and GitHub Release

## ⚠️ Critical Rules

1. **NEVER merge a PR without asking the user first**
2. Always wait for explicit confirmation before:
   - Merging a PR
   - Force pushing
   - Deleting branches
   - Making breaking changes

## Versioning

- Tags follow semver: `v{MAJOR}.{MINOR}.{PATCH}`
- `fix:` → PATCH, `feat:` → MINOR, `BREAKING CHANGE` → MAJOR
- The first version tag will be `v0.1.0`
