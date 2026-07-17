import type { CreateTradeInput, TradeSide } from "../types/trade.types";

/**
 * Parses trades pasted from a broker's history, so a trade can be added without
 * retyping it into the form.
 *
 * The format is one **12-line block per trade**, exactly as the broker lays a
 * row out top to bottom:
 *
 *   S | B                     side (Sell / Buy)
 *   BTCUSD                    symbol
 *   0.35/0.35                 size (requested/filled)
 *   63,277.31                 entry price
 *   62,637.80                 exit price
 *   +223.83                   gross P&L
 *   +223.83                   net P&L
 *   0.00/0.00                 fees (open/close)
 *   17/07/2026 15:04:54       opened
 *   17/07/2026 16:36:59       closed
 *   #1612355311               ticket
 *   Closed                    status
 *
 * Blank lines between blocks are ignored, so a paste of several trades works
 * whether or not the broker separated them. Anything that does not parse is
 * reported per-block rather than silently dropped — this writes to the journal,
 * so a wrong guess must be visible, not swallowed.
 */

const FIELDS_PER_TRADE = 12;

/** A parsed row is exactly a create payload — gross is derived server-side from net + fees. */
export type ParsedTrade = CreateTradeInput;

export interface ParseError {
  /** 1-based block index, for "trade 3 could not be read". */
  block: number;
  reason: string;
  lines: string[];
}

export interface ParseResult {
  trades: ParsedTrade[];
  errors: ParseError[];
}

export function parseTrades(text: string): ParseResult {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const trades: ParsedTrade[] = [];
  const errors: ParseError[] = [];

  for (let i = 0, block = 1; i < lines.length; i += FIELDS_PER_TRADE, block++) {
    const chunk = lines.slice(i, i + FIELDS_PER_TRADE);
    if (chunk.length < FIELDS_PER_TRADE) {
      errors.push({
        block,
        reason: `Expected ${FIELDS_PER_TRADE} lines, found ${chunk.length}. Each trade is ${FIELDS_PER_TRADE} lines.`,
        lines: chunk,
      });
      break;
    }

    const parsed = parseBlock(chunk);
    if ("reason" in parsed) errors.push({ block, reason: parsed.reason, lines: chunk });
    else trades.push(parsed);
  }

  return { trades, errors };
}

function parseBlock(l: string[]): ParsedTrade | { reason: string } {
  // Index 5 is the gross P&L; the journal derives gross from net + fees, so the
  // hole skips it (and keeps it out of the unused-variable list).
  const [rawSide, symbol, size, entry, exit, , net, fees, opened, closed, ticket] = l;

  const side = toSide(rawSide);
  if (!side) return { reason: `Unknown side "${rawSide}" (expected S, B, SHORT or LONG).` };

  const entryPrice = toNumber(entry);
  const exitPrice = toNumber(exit);
  const netPnl = toNumber(net);
  if (netPnl === null) return { reason: `Net P&L "${net}" is not a number.` };
  if (entryPrice === null) return { reason: `Entry price "${entry}" is not a number.` };
  if (exitPrice === null) return { reason: `Exit price "${exit}" is not a number.` };

  const openedAt = toUtcIso(opened);
  const closedAt = toUtcIso(closed);
  if (!closedAt) return { reason: `Close time "${closed}" is not DD/MM/YYYY HH:MM:SS.` };
  if (opened && !openedAt) return { reason: `Open time "${opened}" is not DD/MM/YYYY HH:MM:SS.` };

  // The block lists open above close, but guard the order anyway: a trade cannot
  // close before it opens, and a swapped pair would corrupt the hold time.
  const [open, close] =
    openedAt && openedAt > closedAt ? [closedAt, openedAt] : [openedAt, closedAt];

  return {
    symbol: symbol.toUpperCase(),
    side,
    netPnl,
    closedAt: close,
    openedAt: open ?? undefined,
    size: size || undefined,
    entryPrice: entryPrice ?? undefined,
    exitPrice: exitPrice ?? undefined,
    // Fees are an "open/close" pair; the journal stores their total.
    fees: sumPair(fees) ?? undefined,
    ticket: ticket || undefined,
  };
}

function toSide(raw: string): TradeSide | null {
  switch (raw.trim().toUpperCase()) {
    case "S":
    case "SELL":
    case "SHORT":
      return "SHORT";
    case "B":
    case "BUY":
    case "LONG":
      return "LONG";
    case "L":
    case "LIQ":
    case "LIQUIDATION":
      return "LIQUIDATION";
    default:
      return null;
  }
}

/** "63,277.31" or "+223.83" → 63277.31 / 223.83. Null when not numeric. */
function toNumber(raw: string): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/,/g, "").replace(/^\+/, "").trim();
  if (cleaned === "" || cleaned === "-") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

/** "0.00/0.00" → 0. The two halves are open and close fees; sum them. */
function sumPair(raw: string): number | null {
  if (!raw) return null;
  let total = 0;
  for (const part of raw.split("/")) {
    const n = toNumber(part);
    if (n === null) return null;
    total += n;
  }
  return total;
}

/**
 * "17/07/2026 15:04:54" → "2026-07-17T15:04:54.000Z".
 *
 * Parsed by hand rather than through `new Date(str)`: JS reads an ambiguous
 * `DD/MM/YYYY` in the browser's locale, so on a US machine 07/08 would silently
 * become August. The time is anchored to UTC, matching how the whole app stores
 * timestamps (see AddTradeDialog).
 */
function toUtcIso(raw: string): string | null {
  const m = raw?.match(/^(\d{2})\/(\d{2})\/(\d{4})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) return null;
  const [, dd, mm, yyyy, hh, min, ss = "00"] = m;
  const iso = `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}.000Z`;
  return Number.isNaN(Date.parse(iso)) ? null : iso;
}
