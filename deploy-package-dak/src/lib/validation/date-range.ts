export const DATE_RANGE_ERROR_MESSAGE =
  "From Date cannot be later than To Date.";

export interface DateRangeValidation {
  valid: boolean;
  message?: string;
}

/** Validate that fromDate <= toDate when both are set. */
export function validateDateRange(
  fromDate?: string | null,
  toDate?: string | null
): DateRangeValidation {
  const from = fromDate?.trim().slice(0, 10);
  const to = toDate?.trim().slice(0, 10);

  if (from && to && from > to) {
    return { valid: false, message: DATE_RANGE_ERROR_MESSAGE };
  }

  return { valid: true };
}

/** Drop invalid date filters on the server — prevents bad queries. */
export function sanitizeDateRangeParams(
  fromDate?: string,
  toDate?: string
): { dateFrom?: string; dateTo?: string } {
  const validation = validateDateRange(fromDate, toDate);
  if (!validation.valid) {
    return {};
  }

  return {
    dateFrom: fromDate?.slice(0, 10),
    dateTo: toDate?.slice(0, 10),
  };
}
