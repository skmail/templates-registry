# Phase Workflow Rules

Phases MUST be completed sequentially. Never advance to the next phase until all gate criteria for the current phase are met.

## Phase 1: Research

- **Goal**: Understand the problem space, competitors, and user needs.
- **Inputs**: The project idea from CLAUDE.md.
- **Activities**: Web research using the `researcher` subagent, competitor analysis, feature cataloging.
- **Gate criteria**:
  - `docs/research.md` exists and contains: competitor list, feature matrix, target audience, and key insights.

## Phase 2: Product Design

- **Goal**: Define MVP scope, user personas, user flows, and a product requirements document.
- **Inputs**: `docs/research.md`
- **Activities**: Define personas, map user flows, prioritize features for MVP, write PRD.
- **Gate criteria**:
  - `docs/prd.md` exists and contains: personas, MVP feature list, user flows, and success metrics.

## Phase 3: Architecture

- **Goal**: Select tech stack, define data models, API surface, and project directory structure.
- **Inputs**: `docs/prd.md`
- **Activities**: Choose technologies, design data models, define API endpoints, plan directory layout.
- **Gate criteria**:
  - `docs/architecture.md` exists and contains: tech stack table, data models, API routes, and directory tree.

## Phase 4: Planning

- **Goal**: Break the architecture into an ordered implementation plan with milestones and dependencies.
- **Inputs**: `docs/architecture.md`
- **Activities**: Create task breakdown, define milestones, identify dependencies, estimate complexity.
- **Gate criteria**:
  - `docs/plan.md` exists and contains: numbered task list, milestones, dependency graph, and build order.

## Phase 5: Test Writing

- **Goal**: Set up test infrastructure and write failing tests (TDD red phase).
- **Inputs**: `docs/plan.md`, `docs/architecture.md`
- **Activities**: Initialize project, configure vitest and playwright, write unit and integration tests that define expected behavior.
- **Gate criteria**:
  - `vitest.config.ts` or `vitest.config.js` exists.
  - At least one `tests/**/*.test.ts` file exists.
  - Tests run but FAIL (they define behavior not yet implemented).
  - **Tests MUST fail.** Do not write passing tests — this is the red phase of TDD.

## Phase 6: Building

- **Goal**: Implement features to make all tests pass (TDD green phase).
- **Inputs**: `docs/plan.md`, all test files
- **Activities**: Implement features task-by-task following the plan, run tests after each feature.
- **Gate criteria**:
  - All tests pass.
  - No `any` types in TypeScript code.
  - Code compiles without errors.
  - **Never modify test expectations.** Fix the implementation, not the tests.

## Phase Verification

Before advancing to the next phase, invoke the `reviewer` subagent to verify all gate criteria are met. If any criterion fails, continue working in the current phase.
