# Project Overview

## About the Project

**Trade Journal** is a **personal trading-journal analytics dashboard**. A trader records (or
imports) the trades they have executed on a live account, and the app turns that raw trade history
into a performance cockpit: a running **equity curve**, **net P&L**, **win rate**, **profit
factor**, **max drawdown**, **risk/reward**, breakdowns **by asset / direction / weekday / hour**, a
**monthly calendar heatmap**, and a fully **filterable trades table** with running balance. The whole
experience is a single dark-themed, real-time "live performance cockpit" for one account.

The app is split into two deployables:

```
frontend/   → Next.js 16 (App Router) + React 19 + Tailwind v4 + shadcn/ui + Chart.js
backend/    → NestJS + Prisma + PostgreSQL  (REST API, JWT auth, per-user ownership)
```

The frontend never talks to the database directly. It calls **our own** NestJS API; the API owns
authentication, per-user data ownership, and persistence. Secrets live only on the backend.

> **Design source of truth:** `frontend/context/designs/website.index.html` is the reference build
> for the dashboard — the dark theme, the sidebar + topbar shell, the overview strip, the filters,
> the 27 stat cards, the seven Chart.js charts, the insights/leaderboard, the calendar heatmap, and
> the trades table. The context docs describe how to reproduce that design in the Next.js stack.

> **Migration note:** this `frontend/` began life as a copied scaffold from another product
> (a hospital-management SaaS). That domain is being **removed** and replaced with the trading-journal
> domain. Retained scaffolding (auth, the app shell, shared UI primitives, the NestJS bootstrap) is
> rebranded to Trade Journal.

---

## The Problem It Solves

Most traders keep their history in a broker export or a spreadsheet and never see the patterns in it:
which asset actually pays, whether their edge is long or short, which hour or weekday bleeds money,
how deep their worst drawdown really went, and whether their profit factor justifies the risk. Trade
Journal ingests the trade log once and answers all of that on one screen. Every metric, chart, and
the calendar recompute instantly as the trader filters the set (by asset, direction, result, date
range, or P&L window), so the journal becomes an analysis tool, not just a record.

---

## Core User Flow

```
Trader signs up / logs in
      ↓
Create (or select) a trading account → set starting balance + currency
      ↓
Add trades manually OR import a broker CSV  →  trades persist (per user, per account)
      ↓
Dashboard computes analytics from the active trade set
   ├─ Overview: current balance, net profit, max drawdown, profit factor + market board
   ├─ Filters: asset / direction / result / date range / P&L window / sort + quick presets
   ├─ Stats: ~27 core performance metrics
   ├─ Charts: equity curve, daily P&L, weekday, hourly, asset, long-vs-short, win/loss
   ├─ Insights + asset leaderboard + monthly calendar heatmap
   └─ Trades table with running balance and result badges
      ↓
Export the filtered set to CSV · Copy a text summary · Switch accent theme
```

---

## Features In Scope

1. **Authentication** — email + password sign-up (2-step email-OTP) and login; every trade/account
   route is scoped to the authenticated user.
2. **Trading accounts** — a user owns one or more accounts (label, account number, starting balance,
   currency); the dashboard is always scoped to the active account.
3. **Trades** — add / edit / delete trades and **import a broker CSV**; each trade carries symbol,
   direction (LONG / SHORT / LIQUIDATION), size, entry/exit price, gross & net P&L, fees, open/close
   timestamps, ticket, and status.
4. **Overview cockpit** — the account command center: current balance, net profit + growth, max
   drawdown, profit factor, and a market board (win rate, average trade, best/worst trade).
5. **Advanced filters** — search asset, asset, direction, result, from/to date, min/max P&L, sort,
   plus quick-preset chips (All / Today / Last 7 Days / Winners / Losses / Liquidations). Every panel
   recomputes off the filtered set.
6. **Core performance stats** — ~27 metrics (total/winning/losing trades, win rate, gross/net P&L,
   profit factor, best/worst trade, average win/loss, risk/reward, long/short profit & counts,
   liquidation loss, max drawdown, win/loss streaks, balances, growth, average trade).
7. **Charts (Chart.js)** — equity curve (line + gradient), daily P&L (bar), weekday performance,
   hourly performance, asset performance (horizontal bar), long-vs-short, win/loss distribution
   (doughnut).
8. **Risk & edge insights + asset leaderboard** — best/worst asset, best/worst hour, best weekday,
   drawdown-recovery need; per-symbol net P&L leaderboard with proportional bars.
9. **Monthly calendar heatmap** — daily P&L intensity across the selected range.
10. **Export & share** — export the filtered trades to CSV; copy a plain-text performance summary.
11. **Accent themes** — switch the dashboard accent (green / violet / gold) at runtime.
12. **Responsive UI** — the shell collapses the sidebar, grids reflow, and tables scroll on mobile.

---

## Features Out of Scope (for now)

- A native mobile app (the web app is responsive instead).
- Live broker/exchange API connections or real-time price feeds (trades are user-entered / imported).
- Automated trade execution or any order routing — this is a **journal**, not a trading terminal.
- Multi-user organizations / team accounts / shared journals (ownership is strictly per user).
- AI/ML features (no AI is used anywhere in this product).

> Scope grows by phase (see build-plan.md). The **current** focus is pivoting the context + theme to
> the trading-journal design and building the dashboard cockpit against real trade data.

---

## Target Audience

- **Active retail traders** (crypto, forex, futures, equities) who want to understand their own edge.
- **Prop-firm and funded-account traders** who must track drawdown, profit factor, and consistency.
- **Trading coaches / mentored traders** who review a journal together and need clean analytics.

---

## Success Criteria

- A trader can sign up, create an account, add/import trades, and immediately see a correct equity
  curve and metrics.
- Every panel (overview, stats, charts, insights, leaderboard, heatmap, table) recomputes from the
  **active filtered set**, consistently and instantly.
- Metrics are numerically correct (running balance, drawdown, profit factor, streaks) and match a
  hand-check against the trade log.
- Each user's trades are isolated — no user can read or write another user's data.
- The UI matches the design: dark theme, semantic P&L color language (green up / red down), Inter
  type, 8px radius, and the switchable accent.
- Export CSV and Copy Summary reflect exactly the currently filtered set.
