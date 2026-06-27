import type { PriorityLevel } from "@/types";

export type SlaHealthStatus = "safe" | "due_soon" | "overdue" | "escalated";

export interface SlaRule {
  id: string;
  departmentId: string | null;
  priority: PriorityLevel;
  daysAllowed: number;
  isActive: boolean;
}

export interface SlaDakRow {
  id: string;
  dak_number: string;
  subject: string;
  priority: PriorityLevel;
  status: string;
  sla_due_date: string | null;
  due_date: string | null;
  escalation_level: number;
  assigned_to: string | null;
  department_id: string | null;
  received_date: string | null;
}

export interface SlaComplianceRow extends SlaDakRow {
  department_name: string;
  officer_name: string;
  sla_days_allowed: number;
  is_compliant: boolean;
  days_remaining: number | null;
}

export interface EscalationReportRow extends SlaDakRow {
  department_name: string;
  officer_name: string;
  escalation_label: string;
}
