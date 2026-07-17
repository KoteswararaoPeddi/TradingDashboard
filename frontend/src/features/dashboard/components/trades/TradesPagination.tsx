"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@components/ui/button";
import { Pagination, PaginationContent, PaginationItem } from "@components/ui/pagination";
import { Typography } from "@components/ui/typography";
import { cn } from "@lib/utils";

import { pageWindow } from "../../lib/pagination";

interface Props {
  page: number;
  pages: number;
  from: number;
  to: number;
  total: number;
  onPage: (page: number) => void;
}

/**
 * The ledger's pager: which rows you are looking at, and how to move.
 *
 * Built from shadcn's `Pagination` wrappers (`nav` > `ul` > `li`) with `Button`
 * inside, rather than its `PaginationLink`. That primitive renders an `<a>` for
 * URL-driven paging; this page lives in client state, and an anchor with no
 * `href` is unreachable by keyboard. The semantics come from shadcn either way.
 */
export function TradesPagination({ page, pages, from, to, total, onPage }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border p-4.5">
      {/* Stated even on a single page: paging should never hide how much there is. */}
      <Typography variant="body-sm" className="text-subtle-foreground tabular-nums">
        Showing {from}–{to} of {total}
      </Typography>

      {pages > 1 ? (
        <Pagination className="mx-0 w-auto justify-end">
          <PaginationContent>
            <PaginationItem>
              <Button
                variant="ghost"
                size="icon"
                disabled={page <= 1}
                onClick={() => onPage(page - 1)}
                aria-label="Go to previous page"
              >
                <ChevronLeft className="size-4" aria-hidden />
              </Button>
            </PaginationItem>

            {pageWindow(page, pages).map((n, i) =>
              n === null ? (
                <PaginationItem key={`gap-${i}`}>
                  <span className="px-1 text-subtle-foreground" aria-hidden>
                    …
                  </span>
                </PaginationItem>
              ) : (
                <PaginationItem key={n}>
                  <Button
                    variant={n === page ? "default" : "ghost"}
                    size="icon"
                    onClick={() => onPage(n)}
                    aria-label={`Go to page ${n}`}
                    // The current page is a state, not decoration: colour alone
                    // says nothing to a screen reader.
                    aria-current={n === page ? "page" : undefined}
                    className={cn("tabular-nums", n === page && "pointer-events-none")}
                  >
                    {n}
                  </Button>
                </PaginationItem>
              ),
            )}

            <PaginationItem>
              <Button
                variant="ghost"
                size="icon"
                disabled={page >= pages}
                onClick={() => onPage(page + 1)}
                aria-label="Go to next page"
              >
                <ChevronRight className="size-4" aria-hidden />
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      ) : null}
    </div>
  );
}
