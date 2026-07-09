const DISTRICT_TIMEZONE = "Asia/Kolkata";

/** Calendar date (YYYY-MM-DD) in the district timezone — matches HTML date inputs. */
export function getDistrictDateString(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: DISTRICT_TIMEZONE,
  }).format(date);
}

/** Add calendar days to a YYYY-MM-DD string (district-neutral UTC math). */
export function addDaysToDateString(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.slice(0, 10).split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function isDueDateOnOrAfterReceived(
  dueDate: string,
  receivedDate: string
): boolean {
  return dueDate.slice(0, 10) >= receivedDate.slice(0, 10);
}
