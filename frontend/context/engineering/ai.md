# AI — Engineering Decisions

> **Placeholder — no AI/LLM code exists in the repo, and none is planned.**

Trade Journal is a deterministic analytics dashboard: it logs/imports executed trades and computes
performance metrics (equity curve, net P&L, win rate, profit factor, max drawdown, risk/reward,
by-asset/direction/weekday/hour breakdowns, a calendar heatmap). **None of this needs an LLM** — the
numbers come from arithmetic over the user's own trade rows, not a model.

There is currently **no** LLM integration (no Gemini/OpenAI/Anthropic client, no structured-output
parsing, no prompt code, no retry/cost handling), and the design has **no AI features**, so none is
planned.

**If real AI code is ever added**, log entries here for the genuinely non-obvious decisions, e.g.:
- structured / schema-constrained output vs free-text parsing
- retry & timeout strategy on model calls
- token/cost controls and truncation
- prompt/version management and caching
- streaming vs batch responses

Follow the 5-part Learn template in [README.md](README.md). Until then, this file is intentionally empty
of entries. `(no lesson — status note)`
