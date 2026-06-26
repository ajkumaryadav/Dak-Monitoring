const DISTRICT_TIMEZONE = "Asia/Kolkata";

/** Calendar date (YYYY-MM-DD) in the district timezone — matches HTML date inputs. */
export function getDistrictDateString(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: DISTRICT_TIMEZONE,
  }).format(date);
}

export function isDueDateOnOrAfterReceived(
  dueDate: string,
  receivedDate: string
): boolean {
  return dueDate.slice(0, 10) >= receivedDate.slice(0, 10);
}
