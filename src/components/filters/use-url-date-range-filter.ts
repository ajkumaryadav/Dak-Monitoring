"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

import { validateDateRange } from "@/lib/validation/date-range";

/** URL-backed date range filters with validation before navigation. */
export function useUrlDateRangeFilter(basePath?: string) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const dateFrom = searchParams.get("dateFrom") ?? "";
  const dateTo = searchParams.get("dateTo") ?? "";

  const [rangeError, setRangeError] = useState<string | null>(() => {
    const validation = validateDateRange(dateFrom, dateTo);
    return validation.valid ? null : (validation.message ?? null);
  });

  const pushParams = useCallback(
    (params: URLSearchParams) => {
      const path = basePath ?? window.location.pathname;
      router.push(`${path}?${params.toString()}`);
    },
    [router, basePath]
  );

  function updateDateParam(key: "dateFrom" | "dateTo", value: string) {
    const nextFrom = key === "dateFrom" ? value : dateFrom;
    const nextTo = key === "dateTo" ? value : dateTo;
    const validation = validateDateRange(nextFrom, nextTo);

    if (!validation.valid) {
      setRangeError(validation.message ?? null);
      return;
    }

    setRangeError(null);
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    pushParams(params);
  }

  return {
    dateFrom,
    dateTo,
    rangeError,
    updateDateFrom: (value: string) => updateDateParam("dateFrom", value),
    updateDateTo: (value: string) => updateDateParam("dateTo", value),
  };
}
