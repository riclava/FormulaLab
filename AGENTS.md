# AGENTS.md

This file gives Codex and other coding agents project-specific guidance for working on FormulaLab.

## Project Intent

FormulaLab Web V1 is a review-first training tool for formula-based learning. The core product loop is:

```text
Built-in formula set -> Diagnostic -> Today Review -> Feedback -> Memory Hook -> Schedule -> Retention
```

Do not treat V1 as a broad knowledge-base platform. The first version should validate whether users can come back daily, complete focused reviews, recover weak formulas, and attach formulas to personal memory hooks.

## Source Documents

Read these before implementation work:

- `docs/draft.md`: product strategy, domain model, flows, APIs, and V1 scope.
- `docs/tasks.md`: staged development plan and acceptance criteria.
- `docs/demo.tsx`: interaction prototype only.

Use `docs/demo.tsx` as a reference for flow and information structure, especially:

- diagnostic -> review onboarding,
- review card states: prompt -> hint -> answer -> self-assessment,
- Again/Hard -> formula detail -> memory hook recovery loop,
- review summary layout.

Do not copy `docs/demo.tsx` as production code or final visual design. It uses mock data, single-file state, oversized rounded cards, prototype-only interactions, and incomplete accessibility.

## V1 Priorities

Build in this order unless the user asks otherwise:

1. Data model and seeded high-quality formulas.
2. Review-first flow at `/review`.
3. Diagnostic flow at `/diagnostic`.
4. Formula detail and Again/Hard recovery.
5. Memory hooks.
6. Review summary and lightweight analytics.
7. Formula list as a secondary browsing entry.
8. AI content-assist tooling after the learning loop works.

The shortest useful MVP is:

- built-in formula content,
- diagnostic,
- today review,
- Recall / Recognition / Application review items,
- self-assessment,
- simple scheduling,
- formula detail after Again/Hard,
- personal memory hook creation,
- review summary.

## Product Rules

- Review First: the app should prioritize today's review over dashboards.
- Focus one domain first. Prefer "probability and statistics formulas" for Alpha unless changed.
- AI should help content production in V1, not become the main user-facing chat interface.
- Memory hooks support active recall. Do not show hints before the user asks.
- When users choose Again or Hard, provide a recovery path, not just a logged failure.
- Keep Knowledge Graph features lightweight and embedded in formula detail for V1.

## Suggested Stack

The planned stack is:

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- Prisma
- PostgreSQL
- KaTeX
- Vercel

Prefer this stack unless the user explicitly changes direction.

## Frontend Guidance

- Build the usable training surface first, not a marketing landing page.
- Keep the interface quiet, focused, and efficient.
- Avoid excessive nested cards and overly large rounded containers.
- Avoid a one-note slate/indigo palette; use color sparingly to encode task state.
- Use proper semantic elements, labels, keyboard support, visible focus states, and reduced-motion handling.
- Replace prototype patterns such as `transition-all`, `window.location.reload()`, mock-only state, and non-semantic clickable containers.
- Use actual LaTeX rendering for formulas instead of plain monospace text.

## Engineering Guidance

- Keep route, component, service, repository, and type layers separate once the app is scaffolded.
- Prefer small focused components:
  - `DiagnosticQuiz`
  - `ReviewCard`
  - `SelfAssessmentButtons`
  - `FormulaDetailPanel`
  - `LatexRenderer`
  - `MemoryHookPrompt`
  - `MemoryHookSuggestions`
  - `ReviewSummary`
  - `FormulaCard`
- Put review scheduling logic in a service/module that can be unit tested.
- Start with simple scheduling:

```text
again -> 10 minutes
hard  -> 1 day
good  -> 3 days
easy  -> 7 days
```

- Increase intervals after consecutive correct reviews as described in `docs/draft.md`.
- Do not introduce FSRS, a large graph editor, custom formula libraries, or complex course systems in V1 unless explicitly requested.

## Verification

For implementation changes, verify at the smallest useful level:

- Unit test scheduling, review queue generation, diagnostic scoring, and memory hook ranking.
- E2E test the core loop: diagnostic -> review -> hint -> answer -> self-assessment -> Again/Hard recovery -> memory hook -> summary.
- Run responsive checks for review, detail, and summary views.
- Check keyboard navigation and focus states for review and memory hook flows.

If tests cannot be run because the project is not scaffolded yet, state that clearly in the final response.
