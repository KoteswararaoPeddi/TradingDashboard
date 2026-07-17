/** Rows per page in the trades ledger. */
export const PAGE_SIZE = 50;

/** How many page numbers sit either side of the current one before an ellipsis. */
const SIBLINGS = 1;

export interface PageSlice<T> {
  items: T[];
  /** 1-based, and always within [1, pages] even if the caller asks for more. */
  page: number;
  pages: number;
  total: number;
  /** 1-based index of the first row shown, or 0 when there are none. */
  from: number;
  /** 1-based index of the last row shown. */
  to: number;
}

/**
 * Cut one page out of a list.
 *
 * The page is clamped rather than trusted. A filter can shrink the set under a
 * user who is on page 9, and an unclamped slice would hand back an empty array
 * — a blank table that looks like "no results" when the real answer is "that
 * page stopped existing". Clamping lands them on the last real page instead.
 */
export function pageSlice<T>(items: T[], page: number, size = PAGE_SIZE): PageSlice<T> {
  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / size));
  const current = Math.min(Math.max(1, page), pages);
  const start = (current - 1) * size;

  return {
    items: items.slice(start, start + size),
    page: current,
    pages,
    total,
    from: total === 0 ? 0 : start + 1,
    to: Math.min(start + size, total),
  };
}

/**
 * The page numbers to render, with `null` marking an ellipsis gap.
 *
 * `1 … 4 5 [6] 7 8 … 20` — first and last are always present so the ends stay
 * one click away, and the window walks with the current page. Rendering every
 * number would put 26 buttons on a 1,284-trade journal.
 */
export function pageWindow(current: number, pages: number): (number | null)[] {
  // 7 = first + last + current + 2 siblings + 2 potential ellipses. Below that
  // every page fits without a gap, and an ellipsis would hide nothing.
  if (pages <= 7) return range(1, pages);

  const left = Math.max(current - SIBLINGS, 1);
  const right = Math.min(current + SIBLINGS, pages);

  // A gap of exactly one page would render "…" in place of a number it is the
  // same width as, so the neighbour is shown instead.
  const gapLeft = left > 3;
  const gapRight = right < pages - 2;

  if (!gapLeft && gapRight) return [...range(1, 3 + SIBLINGS * 2), null, pages];
  if (gapLeft && !gapRight) return [1, null, ...range(pages - (2 + SIBLINGS * 2), pages)];
  if (gapLeft && gapRight) return [1, null, ...range(left, right), null, pages];

  return range(1, pages);
}

function range(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, i) => from + i);
}
