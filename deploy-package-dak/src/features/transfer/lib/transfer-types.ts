export const TRANSFER_ACTIONS = [
  { value: "forward_adm", label: "Forward to ADM" },
  { value: "forward_collector", label: "Forward to Collector" },
  { value: "transfer_department", label: "Transfer to Another Department" },
  { value: "return_clarification", label: "Return for Clarification" },
  { value: "manual_escalate", label: "Escalate" },
  { value: "adm_guidance", label: "Guide Department (ADM)" },
] as const;

export type TransferAction = (typeof TRANSFER_ACTIONS)[number]["value"];

export type TransferActionOption = (typeof TRANSFER_ACTIONS)[number];
