/** How many page numbers sit either side of the current one before an ellipsis. */
const SIBLINGS = 1;

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
