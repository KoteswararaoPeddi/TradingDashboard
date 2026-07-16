// Source data for the seed, transcribed verbatim from the reference design
// (frontend/context/designs/website.index.html). Generated - do not hand-edit.
//
// Field notes:
//   date / openDate - wall-clock strings, no timezone. See seed.ts for how they are anchored.
//   pnl / netPnl    - identical for every row here (fees are zero).
//   size / fees     - "requested/filled" and "open/close" pairs, stored as strings.

export interface DesignTradeRow {
  date: string;
  openDate: string;
  symbol: string;
  side: string;
  size: string;
  entryPrice: number;
  exitPrice: number;
  pnl: number;
  netPnl: number;
  fees: string;
  ticket: string;
  status: string;
}

export const DESIGN_ACCOUNT = {
  label: "Live Account",
  accountNumber: "110920",
  startingBalance: 1000,
  currency: "USD",
};

export const DESIGN_TRADES: DesignTradeRow[] = [
  {"date":"2026-07-15 18:01:35","openDate":"2026-07-15 17:27:23","symbol":"BTCUSD","side":"LONG","size":"1/1","entryPrice":65258.9,"exitPrice":65295.42,"pnl":36.52,"netPnl":36.52,"fees":"0.00/0.00","ticket":"#1598342621","status":"Closed"},
  {"date":"2026-07-14 07:32:20","openDate":"2026-07-14 07:28:36","symbol":"BTCUSD","side":"SHORT","size":"1/1","entryPrice":62637.08,"exitPrice":62712.74,"pnl":-75.66,"netPnl":-75.66,"fees":"0.00/0.00","ticket":"#1587603176","status":"Closed"},
  {"date":"2026-07-12 00:08:07","openDate":"2026-07-12 00:01:47","symbol":"BTCUSD","side":"LONG","size":"1/1","entryPrice":64423.32,"exitPrice":64402,"pnl":-21.32,"netPnl":-21.32,"fees":"0.00/0.00","ticket":"#1576190325","status":"Closed"},
  {"date":"2026-07-11 22:44:41","openDate":"2026-07-11 22:32:59","symbol":"BTCUSD","side":"SHORT","size":"1/1","entryPrice":64239.38,"exitPrice":64292.58,"pnl":-53.2,"netPnl":-53.2,"fees":"0.00/0.00","ticket":"#1576156515","status":"Closed"},
  {"date":"2026-07-11 22:27:23","openDate":"2026-07-11 22:07:09","symbol":"BTCUSD","side":"LONG","size":"1/1","entryPrice":64321.11,"exitPrice":64282.01,"pnl":-39.1,"netPnl":-39.1,"fees":"0.00/0.00","ticket":"#1576147486","status":"Closed"},
  {"date":"2026-07-11 22:05:55","openDate":"2026-07-11 22:04:55","symbol":"BTCUSD","side":"LONG","size":"1/1","entryPrice":64318.44,"exitPrice":64294.83,"pnl":-23.61,"netPnl":-23.61,"fees":"0.00/0.00","ticket":"#1576146873","status":"Closed"},
  {"date":"2026-07-11 18:56:26","openDate":"2026-07-11 18:54:06","symbol":"BTCUSD","side":"LONG","size":"1/1","entryPrice":64112.04,"exitPrice":64165.53,"pnl":53.49,"netPnl":53.49,"fees":"0.00/0.00","ticket":"#1576051107","status":"Closed"},
  {"date":"2026-07-08 16:36:09","openDate":"2026-07-08 16:34:47","symbol":"BTCUSD","side":"LONG","size":"1/1","entryPrice":62053.03,"exitPrice":62042.22,"pnl":-10.81,"netPnl":-10.81,"fees":"0.00/0.00","ticket":"#1559591809","status":"Closed"},
  {"date":"2026-07-08 16:36:07","openDate":"2026-07-08 16:34:37","symbol":"BTCUSD","side":"LONG","size":"1/1","entryPrice":62034.36,"exitPrice":62050.62,"pnl":16.26,"netPnl":16.26,"fees":"0.00/0.00","ticket":"#1559590024","status":"Closed"},
  {"date":"2026-07-08 16:35:39","openDate":"2026-07-08 16:33:12","symbol":"BTCUSD","side":"LONG","size":"1/1","entryPrice":62029.15,"exitPrice":62048.43,"pnl":19.28,"netPnl":19.28,"fees":"0.00/0.00","ticket":"#1559574270","status":"Closed"},
  {"date":"2026-07-08 16:33:06","openDate":"2026-07-08 16:31:10","symbol":"BTCUSD","side":"LONG","size":"1/1","entryPrice":61912.24,"exitPrice":62003.78,"pnl":91.54,"netPnl":91.54,"fees":"0.00/0.00","ticket":"#1559538229","status":"Closed"},
  {"date":"2026-07-08 16:31:05","openDate":"2026-07-08 16:28:55","symbol":"BTCUSD","side":"LONG","size":"1/1","entryPrice":61838.9,"exitPrice":61920.51,"pnl":81.61,"netPnl":81.61,"fees":"0.00/0.00","ticket":"#1559499639","status":"Closed"},
  {"date":"2026-07-08 16:28:42","openDate":"2026-07-08 16:26:16","symbol":"BTCUSD","side":"LONG","size":"1/1","entryPrice":61800.87,"exitPrice":61824.61,"pnl":23.74,"netPnl":23.74,"fees":"0.00/0.00","ticket":"#1559479927","status":"Closed"},
  {"date":"2026-07-08 16:26:19","openDate":"2026-07-08 16:25:42","symbol":"BTCUSD","side":"SHORT","size":"1/1","entryPrice":61752.8,"exitPrice":61798.08,"pnl":-45.28,"netPnl":-45.28,"fees":"0.00/0.00","ticket":"#1559472615","status":"Closed"},
  {"date":"2026-07-08 16:25:00","openDate":"2026-07-08 16:19:21","symbol":"BTCUSD","side":"LONG","size":"1/1","entryPrice":61885.29,"exitPrice":61839.23,"pnl":-46.06,"netPnl":-46.06,"fees":"0.00/0.00","ticket":"#1559423152","status":"Closed"},
  {"date":"2026-07-08 16:21:39","openDate":"2026-07-08 16:18:33","symbol":"BTCUSD","side":"LONG","size":"0.01/0.01","entryPrice":61914.99,"exitPrice":61869.63,"pnl":-0.45,"netPnl":-0.45,"fees":"0.00/0.00","ticket":"#1559419839","status":"Closed"},
  {"date":"2026-07-15 19:39:25","openDate":"2026-07-15 19:08:59","symbol":"BTCUSD","side":"SHORT","size":"0.25/0.25","entryPrice":65182.64,"exitPrice":64850.89,"pnl":82.94,"netPnl":82.94,"fees":"0.00/0.00","ticket":"#1598972579","status":"Closed"},
  {"date":"2026-07-15 19:36:34","openDate":"2026-07-15 19:07:41","symbol":"BTCUSD","side":"SHORT","size":"0.25/0.25","entryPrice":65180.81,"exitPrice":64874.75,"pnl":76.51,"netPnl":76.51,"fees":"0.00/0.00","ticket":"#1598968675","status":"Closed"},
];
