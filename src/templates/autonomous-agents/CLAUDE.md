# Autonomous Agent Workflow

## Project Idea

__IDEA_DESCRIPTION__

## Phases

| # | Phase | Skill | Gate (file must exist) |
|---|-------|-------|------------------------|
| 1 | Research | `/research` | `docs/research.md` |
| 2 | Product Design | `/design` | `docs/prd.md` |
| 3 | Architecture | `/architect` | `docs/architecture.md` |
| 4 | Planning | `/plan` | `docs/plan.md` |
| 5 | Test Writing | `/test-writer` | `tests/**/*.test.ts` |
| 6 | Building | `/builder` | All tests passing |

## Rules

- Complete phases in order. Never skip a phase.
- Use `TodoWrite` at the start of every phase to track tasks. Update todos as you go.
- Each phase produces doc artifacts consumed by the next phase.
- Read the previous phase's output before starting the next phase.

## How to Begin

Detect current phase by checking which gate files exist:

1. If `docs/research.md` does NOT exist → start with `/research`
2. If `docs/prd.md` does NOT exist → start with `/design`
3. If `docs/architecture.md` does NOT exist → start with `/architect`
4. If `docs/plan.md` does NOT exist → start with `/plan`
5. If no `tests/**/*.test.ts` files exist → start with `/test-writer`
6. Otherwise → continue with `/builder`

Run the appropriate skill command to begin or resume work.
