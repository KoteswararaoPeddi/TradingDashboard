# Engineering Decision Log

A **learning-first** record of the non-obvious engineering decisions in **Trade Journal** — a personal,
single-user trading-journal analytics dashboard — the real "forks in the road" where one technique was
chosen over an alternative. It exists so the decisions can be *learned from* and *transferred*, not just
remembered.

This log is deliberately kept **out of the pre-read/context pipeline** (`AGENTS.md` step list).
It is reader-facing documentation, not builder input — read it to learn, don't load it to build.

## Index

| File | Area | Status |
|------|------|--------|
| [frontend.md](frontend.md) | Next.js App Router, rendering, state, data-fetching, UX/a11y | Populated |
| [backend.md](backend.md) | NestJS structure, bootstrap, API envelope, errors | Populated |
| [database.md](database.md) | Prisma schema, relations, indexing, JSON columns | Populated |
| [ai.md](ai.md) | LLM / structured output / retries / cost | Placeholder — no AI code, none planned |
| [ai-agents.md](ai-agents.md) | Agent orchestration | Placeholder — no such code, none planned |
| [mcp.md](mcp.md) | Model Context Protocol integrations | Placeholder — no such code, none planned |

> **Scope note.** Entries reflect what is *actually in the repo today*, not an aspirational total. The
> accounts and trades features aren't built yet, so those areas are thin — what's logged so far is mostly
> the foundations (bootstrap, error handling, the API envelope, the schema, the shared UI layer). Expect
> this log to grow as the feature work lands. Anything broken or surprising is recorded as a **Gotcha**
> rather than dressed up as a decision.

## The standard: the 5-part Learn template

Every **substantive** entry follows this exact shape:

```md
### <Short title>

**What / Where / Why** — the decision, the file it lives in (`path:line`), and the alternative it beats.

**Learn:**
1. **Vocabulary** — define any jargon from scratch. Include *only* when the entry is concept-heavy.
2. **❌ naive vs ✅ our real code** — short contrast snippets. The ✅ side is copied from the actual repo.
3. **Plain-english why** — why the good version wins, using no undefined terms.
4. **Where else you'd use this** — 3–4 other real situations the pattern fits (the transferable part).
5. **Rule of thumb** — the one-line takeaway.
```

**Pure facts** with no transferable lesson stay terse: a one-line What/Where/Why plus a `(no lesson)`
note. Don't pad them into the full template.

**Performance** entries are logged **only after** the optimization has been approved.

## How to append

After a substantive, non-obvious code change, add an entry to the matching file above. Skip pure
boilerplate. Keep entries teaching-clean and transferable — if a future reader can't learn a
reusable pattern from it, it's either a terse pure-fact or it doesn't belong here.
