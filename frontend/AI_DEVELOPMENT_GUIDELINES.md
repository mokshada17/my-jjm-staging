# AI-Assisted Development Guidelines

**Applies to:** All team members using any AI tool (Copilot, Cursor, ChatGPT, Claude, etc.)
**Enforced via:** Code review, CI checks, team agreement

---

## Core Principles

### 1. You Own the Code
- AI generates suggestions — you approve, modify, or reject
- Every line merged is your responsibility
- If you can't explain it, don't commit it

### 2. Verify Before Trust
- Run tests after AI changes
- Type-check (`npm run typecheck`) before commit
- Lint (`npm run lint`) before commit
- Build (`npm run build`) before PR

### 3. Minimal Necessary Change
- Ask AI for the smallest fix, not a rewrite
- One logical change per commit
- No "while we're here" refactoring unless scoped

---

## Prompting Discipline

### Good Prompts
```
"Fix the type error in src/features/auth/hooks/useAuth.ts:42 — User type missing 'roles' field"
"Add a loading state to UserCard component, follow existing pattern in UserList"
"Write a unit test for validateEmail in src/shared/utils/validators.ts"
```

### Bad Prompts
```
"Make the auth better"
"Refactor the user feature"
"Fix all the bugs"
"Add tests everywhere"
```

### Context Rules
- Paste relevant file contents (not whole repo)
- Include error messages verbatim
- State the exact file:line when possible
- Specify the existing pattern to follow

---

## Code Quality Standards

### TypeScript
- `strict: true` — no `any` unless justified with `// TODO: remove any`
- Prefer `interface` over `type` for object shapes
- Export types from feature `index.ts`, not deep paths
- Use `zod` schemas for runtime validation at boundaries

### React
- Functional components + hooks only
- Colocate: component, hooks, types, tests in same feature folder
- No default exports — named exports only
- Props interface named `ComponentNameProps`

### State Management
- Local state: `useState` / `useReducer`
- Shared feature state: Zustand store in `feature/store.ts`
- Global app state: avoid — pass props or use context sparingly
- Server state: TanStack Query (if added) — no manual fetch in components

### Styling
- Tailwind utility classes — no custom CSS unless design system gap
- Follow existing color/spacing tokens in `tailwind.config.js`
- Responsive: mobile-first, test breakpoints

---

## Testing Requirements

### Unit Tests (Vitest + RTL)
- Every pure function / util / validator
- Every custom hook (`renderHook`)
- Every component with logic (not pure presentational)
- Target: 80%+ coverage on changed files

### Integration Tests
- Feature flows: login, user CRUD, auth guards
- Mock MSW handlers in `src/tests/mocks/handlers.ts`

### Test Naming
```ts
describe('validateEmail', () => {
  it('returns true for valid email', () => {})
  it('returns false for missing @', () => {})
  it('returns false for empty string', () => {})
})
```

---

## Git Workflow

### Branch Naming
```
feat/<short-description>    // new feature
fix/<short-description>     // bug fix
refactor/<short-description> // code change, no behavior change
chore/<short-description>   // deps, config, tooling
```

### Commit Messages
```
<type>(<scope>): <imperative summary>

<body if needed>

<footer: breaking changes, issue refs>
```

Types: `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `chore`, `build`, `ci`

### PR Checklist
- [ ] Typecheck passes
- [ ] Lint passes
- [ ] Tests pass (new + existing)
- [ ] Build passes
- [ ] No `console.log` / debugger left
- [ ] No commented-out code
- [ ] Self-reviewed diff
- [ ] Linked issue / task

---

## AI-Specific Guardrails

### Never Let AI
- Add dependencies without your review
- Modify `package.json`, `tsconfig`, `vite.config` without explicit ask
- Create new files outside the feature you're working on
- Change public APIs / types used by other features
- Write `any` types — ask for proper typing
- Generate tests that don't test real behavior

### Always Review
- Diff before staging (`git diff --staged`)
- Generated types match runtime reality
- Error handling paths (try/catch, Result types)
- Accessibility attributes (aria-*, roles)
- Security: no secrets, no eval, sanitized inputs

### When AI Gets Stuck
1. Re-read the error / requirement
2. Break into smaller sub-tasks
3. Provide more context (adjacent files, patterns)
4. Write the tricky part yourself, ask AI for boilerplate
5. Search codebase for similar pattern (`codegraph_explore`)

---

## Architecture Boundaries

```
src/
├── features/          // Business domains (auth, users, etc.)
│   └── <feature>/
│       ├── components/
│       ├── hooks/
│       ├── types.ts
│       ├── utils.ts
│       ├── store.ts   // optional Zustand
│       ├── api.ts     // optional feature API
│       └── index.ts   // public exports only
├── shared/            // Cross-cutting
│   ├── components/    // UI primitives (Button, Input, Card)
│   ├── hooks/         // useLocalStorage, useDebounce, etc.
│   ├── utils/         // validators, formatters, storage
│   └── types/         // global types (ApiError, Pagination)
├── app/               // App shell, routing, providers
└── config/            // YAML configs, env validation
```

### Import Rules
- Features import from `shared/` and `config/` only
- Features **never** import from other features
- Shared imports from nothing (leaf nodes)
- Use `@/` alias for `src/`

---

## Performance Baseline

- Bundle analysis: `npm run build && npx vite-bundle-analyzer`
- Lazy-load feature routes (`React.lazy` + `Suspense`)
- Memoize expensive computations (`useMemo`, `useCallback`)
- Virtualize long lists (`@tanstack/react-virtual`)
- Image optimization: WebP, proper sizes, lazy loading

---

## Security Checklist

- No secrets in code — use `.env` (validated via `config/environments/`)
- Sanitize user input before render (XSS)
- CSRF tokens on mutating forms
- Content Security Policy headers (configured in hosting)
- Dependency audit: `npm audit` in CI

---

## Accessibility (A11y)

- Semantic HTML first
- Focus management on modals/drawers
- ARIA labels on icon-only buttons
- Color contrast: WCAG AA minimum
- Keyboard navigation for all interactive elements
- Test with axe-core in CI

---

## Documentation

- **Code is primary documentation** — clear names, types, structure
- README per feature if non-obvious (`features/<feature>/README.md`)
- ADR for architectural decisions (`docs/adr/YYYY-MM-DD-title.md`)
- Update `.env.example` when adding env vars

---

## Continuous Improvement

### Weekly
- Review AI-generated code quality in retrospectives
- Update this guide when patterns shift
- Share effective prompts in team channel

### Monthly
- Audit dependency freshness
- Review bundle size trends
- Refactor one high-churn area

---

## Enforcement

| Check | Tool | When |
|-------|------|------|
| TypeScript | `tsc --noEmit` | Pre-commit, CI |
| Lint | `eslint` | Pre-commit, CI |
| Format | `prettier --check` | Pre-commit, CI |
| Tests | `vitest run --coverage` | CI |
| Build | `vite build` | CI |
| A11y | `axe-core` | CI |
| Deps | `npm audit` | Weekly CI |

---

## Quick Reference Card

```
BEFORE ASKING AI:
☐ Exact error / requirement
☐ Relevant file(s) open
☐ Existing pattern identified

AFTER AI RESPONSE:
☐ Read diff fully
☐ Run typecheck + lint
☐ Run related tests
☐ Verify behavior manually
☐ Commit with clear message
```

---

**Remember:** AI accelerates — it doesn't replace engineering judgment. The senior engineer decides *what* and *why*; AI helps with *how*.