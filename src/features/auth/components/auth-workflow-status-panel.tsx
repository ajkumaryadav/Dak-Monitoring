import { BarChart3, TrendingUp } from "lucide-react";

import type { PortalWorkflowStatusRow } from "@/features/auth/services/portal-workflow-stats";

const chartWidth = 320;
const chartHeight = 128;
const barWidth = 38;
const barGap = 14;
const chartPadX = 18;
const chartBaseY = 108;
const maxBarHeight = 82;

interface AuthWorkflowStatusPanelProps {
  statusData: PortalWorkflowStatusRow[];
  unavailable?: boolean;
}

/** Live workflow status chart for the login portal. */
export function AuthWorkflowStatusPanel({
  statusData,
  unavailable = false,
}: AuthWorkflowStatusPanelProps) {
  const total = statusData.reduce((sum, row) => sum + row.value, 0);
  const max = Math.max(...statusData.map((row) => row.value), 1);
  const hasData = total > 0;

  return (
    <div className="auth-step-rise overflow-hidden rounded-2xl border border-border/60 bg-card/90 shadow-lg backdrop-blur-sm">
      <div className="auth-tricolor-bar h-1 w-full" aria-hidden />

      <div className="relative p-3.5 sm:p-4">
        <div className="auth-visual-orb pointer-events-none absolute -right-4 -top-4 size-20 rounded-full bg-primary/8 blur-2xl" />

        <div className="relative flex flex-wrap items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
              <BarChart3 className="size-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Workflow Status</p>
              <p className="text-[10px] text-muted-foreground">
                Live district DAK pipeline
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.07] px-3 py-1.5">
            <TrendingUp className="size-3.5 text-emerald-600" />
            <div className="text-right">
              <p className="text-base font-bold tabular-nums text-foreground">
                {total}
              </p>
              <p className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
                Total DAK
              </p>
            </div>
          </div>
        </div>

        {unavailable ? (
          <p className="mt-4 rounded-xl border border-dashed border-amber-500/40 bg-amber-500/[0.07] px-4 py-8 text-center text-xs text-amber-800 dark:text-amber-200">
            Workflow counts are temporarily unavailable. Please refresh in a
            moment.
          </p>
        ) : !hasData ? (
          <p className="mt-4 rounded-xl border border-dashed border-border/60 bg-muted/30 px-4 py-8 text-center text-xs text-muted-foreground">
            No DAK records registered yet. Counts will appear here as entries
            are added to the system.
          </p>
        ) : (
          <>
            <div className="relative mt-4 overflow-hidden rounded-xl bg-muted/50 p-1 ring-1 ring-border/40">
              <div className="flex h-7 overflow-hidden rounded-lg shadow-inner">
                {statusData.map((row, i) => (
                  <div
                    key={row.label}
                    className="auth-chart-bar relative min-w-[2px] transition-opacity hover:opacity-90"
                    style={{
                      width: `${Math.max((row.value / total) * 100, row.value > 0 ? 1.5 : 0)}%`,
                      background: `linear-gradient(180deg, ${row.gradientFrom}, ${row.gradientTo})`,
                      animationDelay: `${i * 0.07}s`,
                    }}
                    title={`${row.label}: ${row.value}`}
                  />
                ))}
              </div>
            </div>

            <div className="relative mt-4">
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="w-full"
                role="img"
                aria-label="Live DAK workflow status bar chart"
              >
                <defs>
                  {statusData.map((row, i) => (
                    <linearGradient
                      key={`grad-${row.label}`}
                      id={`auth-wf-grad-${i}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor={row.gradientFrom} />
                      <stop offset="100%" stopColor={row.gradientTo} />
                    </linearGradient>
                  ))}
                  <filter
                    id="auth-wf-shadow"
                    x="-20%"
                    y="-20%"
                    width="140%"
                    height="140%"
                  >
                    <feDropShadow
                      dx="0"
                      dy="2"
                      stdDeviation="2"
                      floodColor="#0f172a"
                      floodOpacity="0.12"
                    />
                  </filter>
                </defs>

                {[0.25, 0.5, 0.75].map((pct) => {
                  const y = chartBaseY - pct * maxBarHeight;
                  return (
                    <line
                      key={pct}
                      x1={chartPadX}
                      y1={y}
                      x2={chartWidth - chartPadX}
                      y2={y}
                      stroke="currentColor"
                      strokeOpacity="0.08"
                      strokeDasharray="4 4"
                    />
                  );
                })}

                {statusData.map((row, i) => {
                  const x = chartPadX + i * (barWidth + barGap);
                  const height =
                    row.value > 0
                      ? Math.max((row.value / max) * maxBarHeight, 10)
                      : 4;
                  const y = chartBaseY - height;

                  return (
                    <g key={row.label}>
                      <rect
                        x={x}
                        y={y}
                        width={barWidth}
                        height={height}
                        rx="6"
                        fill={
                          row.value > 0
                            ? `url(#auth-wf-grad-${i})`
                            : "currentColor"
                        }
                        fillOpacity={row.value > 0 ? 1 : 0.12}
                        filter={row.value > 0 ? "url(#auth-wf-shadow)" : undefined}
                        className="auth-wf-bar"
                        style={{ animationDelay: `${0.15 + i * 0.08}s` }}
                      />
                      {row.value > 0 && (
                        <rect
                          x={x + 4}
                          y={y + 4}
                          width={barWidth - 14}
                          height={Math.min(height * 0.35, 12)}
                          rx="3"
                          fill="white"
                          opacity="0.22"
                        />
                      )}
                      <text
                        x={x + barWidth / 2}
                        y={y - 6}
                        textAnchor="middle"
                        fill="currentColor"
                        style={{ fontSize: 10, fontWeight: 700 }}
                      >
                        {row.value}
                      </text>
                      <text
                        x={x + barWidth / 2}
                        y={chartBaseY + 12}
                        textAnchor="middle"
                        fill="currentColor"
                        fillOpacity="0.65"
                        style={{ fontSize: 8 }}
                      >
                        {row.short}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {statusData.map((row) => (
                <li
                  key={row.label}
                  className="flex items-center gap-2 rounded-lg border border-border/40 bg-background/70 px-2.5 py-1.5"
                >
                  <span
                    className="size-2.5 shrink-0 rounded-full ring-2 ring-white/80"
                    style={{ backgroundColor: row.color }}
                  />
                  <span className="min-w-0 truncate text-[10px] text-muted-foreground">
                    {row.label}
                  </span>
                  <span className="ml-auto tabular-nums text-[10px] font-semibold text-foreground">
                    {row.value}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
