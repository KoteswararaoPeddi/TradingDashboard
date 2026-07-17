"use client";

import { Download } from "lucide-react";

import { Button } from "@components/ui/button";

import { filtersToParams } from "../../api/params";
import { useFiltersStore } from "../../stores/filters.store";

/** Same base the shared axios instance uses — the API origin plus `/api`. */
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

/**
 * Downloads the current view as a CSV.
 *
 * The file is built and streamed by the server (`GET /trades/export`), scoped by
 * the very same filter params the table sends — so the download always matches
 * what is on screen, and the browser never has to hold the whole set or shape a
 * single cell. This is just a link click: the server's `Content-Disposition`
 * names and saves the file, so there is no blob or client-side CSV work here.
 */
export function ExportCsvButton() {
  const filters = useFiltersStore((s) => s.filters);

  function onExport(): void {
    const params = filtersToParams(filters);
    const query = new URLSearchParams(
      Object.entries(params).map(([key, value]) => [key, String(value)]),
    ).toString();

    // A transient anchor, not `window.location`: navigating the page to a file
    // URL is what a download-blocker flags, and it would also unmount the app for
    // a frame. The attachment response downloads without ever leaving the page.
    const anchor = document.createElement("a");
    anchor.href = `${API_URL}/trades/export${query ? `?${query}` : ""}`;
    anchor.rel = "noopener";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }

  return (
    <Button variant="outline" size="sm" onClick={onExport}>
      <Download className="size-4" aria-hidden />
      Export CSV
    </Button>
  );
}
