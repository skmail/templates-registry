# Quality Standards

## Code Standards

- TypeScript strict mode (`"strict": true` in tsconfig).
- No `any` types. Use `unknown` and narrow with type guards when the type is truly unknown.
- Prefer explicit return types on exported functions.
- Use `const` by default. Only use `let` when reassignment is necessary.
- No unused variables or imports.

## Testing Standards

- **Unit tests**: vitest. Place in `tests/unit/`.
- **Integration/E2E tests**: playwright. Place in `tests/e2e/`.
- Every public function must have at least one test.
- Test file naming: `<module>.test.ts`.
- Use descriptive test names: `it("should return 404 when user not found")`.
- No test-only code in production files.

## Documentation Standards

- Every phase produces its doc artifact in `docs/`.
- Docs use markdown with clear headings and tables.
- Keep docs concise — prefer tables and bullet lists over long paragraphs.

## Git Conventions

- Commit after completing each meaningful unit of work.
- Commit message format: `<type>: <description>`
  - Types: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`
- Do not commit failing code (except during Phase 5 where tests intentionally fail).

## Anti-Patterns to Avoid

- Do not over-engineer. Build only what the plan specifies.
- Do not add features beyond the MVP scope defined in the PRD.
- Do not modify test expectations to make tests pass — fix the implementation.
- Do not skip phases or gate checks.
- Do not use `console.log` for error handling — use proper error types.
- Do not create god files. Keep modules focused and under 200 lines.
