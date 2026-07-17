"use client";

import dynamic from "next/dynamic";

import { Skeleton } from "@components/ui/skeleton";
import { Typography } from "@components/ui/typography";
import { formatMoney, formatPercent } from "@lib/format";
import { cn } from "@lib/utils";

import type { EquityPoint } from "../../types/metrics.types";

// recharts is heavy and measures the DOM, so the spark loads on demand and is
// never server-rendered — ResponsiveContainer has no layout to measure there.
const EquitySpark = dynamic(() => import("./EquitySpark").then((m) => m.EquitySpark), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full rounded-md" />,
});

interface Props {
  equity: number;
  netProfit: number;
  growth: number;
  startingBalance: number;
  equityCurve: EquityPoint[];
  tradeCount: number;
}

/**
 * The command center: where the account stands, and the shape of how it got
 * there, in one glance.
 *
 * The number alone answers "am I up" but not "am I climbing or bleeding back" —
 * a $1,166 balance reads identically at the top of a rally and halfway down a
 * drawdown. Pairing the figure with its curve answers both in the same look,
 * which is the entire job of a 30-second check.
 *
 * The balance itself is deliberately uncoloured. A balance is a *level*, not a
 * signed value; the delta beside it is the judgement. Colouring both would say
 * the same thing twice and cost the green its meaning.
 */
export function AccountHero({
  equity,
  netProfit,
  growth,
  startingBalance,
  equityCurve,
  tradeCount,
}: Props) {
  const up = netProfit >= 0;
  const sign = up ? "+" : "";

  return (
    <div className="grid gap-6 px-4.5 pt-4 pb-5 min-[861px]:grid-cols-[minmax(0,auto)_minmax(0,1fr)] min-[861px]:items-center min-[861px]:gap-10">
      <div className="min-w-0">
        <Typography as="span" variant="label-base" weight="medium" className="block text-muted-foreground">
          Current balance
        </Typography>

        {/* Baseline-aligned so the delta sits on the balance's baseline rather
            than floating against its cap height. */}
        <div className="mt-2.5 flex flex-wrap items-baseline gap-x-3.5 gap-y-1.5">
          <Typography
            as="strong"
            variant="display-2xl"
            weight="black"
            className="leading-none whitespace-nowrap text-foreground"
          >
            {formatMoney(equity)}
          </Typography>

          <Typography
            as="span"
            variant="h3"
            weight="black"
            className={cn("leading-none whitespace-nowrap", up ? "text-up" : "text-down")}
          >
            {sign}
            {formatMoney(netProfit)} ( {sign}
            {formatPercent(growth)} )
          </Typography>
        </div>

        <Typography variant="body-sm" className="mt-2.5 text-subtle-foreground">
          Since {formatMoney(startingBalance)} starting balance
        </Typography>
      </div>

      {/* ResponsiveContainer collapses to zero inside an auto-height box, so the
          spark's height is fixed here rather than inherited. */}
      <div className="min-w-0">
        <div className="h-22 w-full">
          <EquitySpark data={equityCurve} />
        </div>
        <Typography variant="body-sm" className="mt-1 block text-right text-subtle-foreground">
          Balance across {tradeCount} {tradeCount === 1 ? "trade" : "trades"}
        </Typography>
      </div>
    </div>
  );
}
