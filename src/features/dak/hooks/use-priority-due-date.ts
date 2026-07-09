"use client";

import { useCallback, useState } from "react";

import { getDistrictDateString } from "@/features/dak/lib/dak-dates";
import { calculateDisposalDueDate } from "@/lib/constants/priority-due-date";
import type { PriorityLevel } from "@/types";

interface UsePriorityDueDateOptions {
  initialPriority?: PriorityLevel;
  minDate?: string;
}

/** Auto-calculate disposal due date from priority with manual override support. */
export function usePriorityDueDate({
  initialPriority = "important",
  minDate = getDistrictDateString(),
}: UsePriorityDueDateOptions = {}) {
  const [priority, setPriorityState] = useState<PriorityLevel>(initialPriority);
  const [dueDate, setDueDate] = useState(() =>
    calculateDisposalDueDate(initialPriority, minDate)
  );
  const [manualOverride, setManualOverride] = useState(false);

  const setPriority = useCallback(
    (nextPriority: PriorityLevel) => {
      setPriorityState(nextPriority);
      if (!manualOverride) {
        setDueDate(calculateDisposalDueDate(nextPriority, minDate));
      }
    },
    [manualOverride, minDate]
  );

  const handleDueDateChange = useCallback(
    (value: string) => {
      setDueDate(value);
      const calculated = calculateDisposalDueDate(priority, minDate);
      setManualOverride(value !== calculated);
    },
    [priority, minDate]
  );

  return {
    priority,
    setPriority,
    dueDate,
    setDueDate: handleDueDateChange,
    minDate,
    manualOverride,
  };
}
