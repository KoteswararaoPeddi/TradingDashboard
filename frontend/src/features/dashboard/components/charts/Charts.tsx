"use client";

import dynamic from "next/dynamic";

import { Skeleton } from "@components/ui/skeleton";

import { useCockpit } from "../../hooks/use-cockpit";
import { ChartPanel } from "./ChartPanel";
import { ChartsSkeleton } from "./ChartsSkeleton";

/**
 * recharts is heavy and measures the DOM, so every chart is loaded on demand and
 * never server-rendered: `ResponsiveContainer` has no layout to measure on the
 * server, and rendering it there buys nothing but hydration noise.
 */
const loading = () => <Skeleton className="h-full w-full rounded-lg" />;

const EquityChart = dynamic(() => import("./EquityChart").then((m) => m.EquityChart), {
  ssr: false,
  loading,
});
// `dynamic()` erases generics, so the cast restores SignedBarChart's typed
// `categoryKey`/`valueKey` inference. The runtime value is the dynamic wrapper;
// only the type is being restored here.
const SignedBarChart = dynamic(() => import("./SignedBarChart").then((m) => m.SignedBarChart), {
  ssr: false,
  loading,
}) as typeof import("./SignedBarChart").SignedBarChart;
const DirectionChart = dynamic(() => import("./DirectionChart").then((m) => m.DirectionChart), {
  ssr: false,
  loading,
});
const WinLossChart = dynamic(() => import("./WinLossChart").then((m) => m.WinLossChart), {
  ssr: false,
  loading,
});

/** The seven-chart grid, in the design's order. */
export function Charts() {
  const { status, metrics } = useCockpit();

  // The grid is the anchor target, so it must exist even while data loads.
  return (
    <section id="charts" className="grid scroll-mt-6 grid-cols-12 gap-4.5">
      {status !== "ready" || !metrics ? (
        <ChartsSkeleton />
      ) : (
        <>
          <ChartPanel wide title="Equity Curve" description="Running account balance from the selected trade set.">
            <EquityChart data={metrics.equityCurve} />
          </ChartPanel>

          <ChartPanel title="Daily P&L" description="Net result per trading day.">
            <SignedBarChart data={metrics.dailyPnl} categoryKey="date" valueKey="value" name="Daily P&L" />
          </ChartPanel>

          <ChartPanel title="Weekday Performance" description="Where the week is paying or bleeding.">
            <SignedBarChart data={metrics.weekdayPnl} categoryKey="day" valueKey="value" name="P&L" />
          </ChartPanel>

          <ChartPanel title="Hourly Performance" description="P&L grouped by trade hour.">
            <SignedBarChart data={metrics.hourlyPnl} categoryKey="label" valueKey="value" name="Hourly P&L" radius={5} />
          </ChartPanel>

          <ChartPanel title="Asset Performance" description="Net contribution by symbol.">
            <SignedBarChart
              data={metrics.assets}
              categoryKey="symbol"
              valueKey="pnl"
              name="Asset P&L"
              horizontal
            />
          </ChartPanel>

          <ChartPanel title="Long vs Short Performance" description="Directional edge comparison.">
            <DirectionChart direction={metrics.direction} />
          </ChartPanel>

          <ChartPanel title="Win / Loss Distribution" description="Trade count by result.">
            <WinLossChart metrics={metrics} />
          </ChartPanel>
        </>
      )}
    </section>
  );
}
