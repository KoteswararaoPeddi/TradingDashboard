# AI Agents — Engineering Decisions

> **Placeholder — no agent code exists in the repo, and none is planned.**

There is currently no agent orchestration in this project — no tool-calling loop, no planner/executor,
no multi-step agent runtime. Trade Journal is a deterministic analytics dashboard with no AI surface
(see [ai.md](ai.md): there is no LLM integration at all, and none is planned).

**If agent code is ever added**, log the non-obvious decisions here, e.g.:
- tool schema design and tool-call validation
- orchestration shape (single loop vs planner→executor vs graph)
- guardrails, step/turn limits, and termination conditions
- state/memory passing between steps
- verification / self-critique before committing a result

Follow the 5-part Learn template in [README.md](README.md). Intentionally empty until such code exists.
`(no lesson — status note)`
