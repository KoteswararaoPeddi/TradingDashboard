import axiosInstance from "@lib/axios.config";
import type { ApiResponse } from "@shared/types/api-response";

import type { AnalyticsResponse } from "../types/metrics.types";
import type { TradeFilters } from "../types/filter.types";
import { filtersToParams } from "./params";

/**
 * The dashboard's numbers, computed server-side for the filtered set.
 *
 * The frontend performs no analytics of its own: it sends the active filters and
 * renders whatever comes back. `range`/`symbols`/`accountTradeCount` describe the
 * whole account, to seed the filter controls and the "X of Y" counts.
 */
export async function getAnalytics(filters: TradeFilters): Promise<AnalyticsResponse> {
  const res = await axiosInstance.get<ApiResponse<AnalyticsResponse>>("/analytics", {
    params: filtersToParams(filters),
  });
  return res.data.data;
}
