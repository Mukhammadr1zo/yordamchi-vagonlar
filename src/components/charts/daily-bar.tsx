"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { PALETTE, AXIS_COLOR } from "./palette";

export function DailyBar({
  data,
  onSelect,
}: {
  data: { label: string; value: number }[];
  onSelect?: (key: string) => void;
}) {
  if (!data.length) {
    return (
      <div className="text-muted-foreground flex h-[260px] items-center justify-center text-sm">
        —
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart
        data={data}
        margin={{ top: 8, right: 8, bottom: 8, left: -16 }}
        className={onSelect ? "cursor-pointer" : undefined}
        onClick={(s) => {
          const lbl = (s as { activeLabel?: string })?.activeLabel;
          if (lbl) onSelect?.(String(lbl));
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={AXIS_COLOR} strokeOpacity={0.2} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: AXIS_COLOR }} tickLine={false} axisLine={false} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: AXIS_COLOR }} tickLine={false} axisLine={false} />
        <Tooltip
          cursor={{ fill: AXIS_COLOR, fillOpacity: 0.1 }}
          contentStyle={{
            background: "var(--color-popover)",
            border: "1px solid var(--color-border)",
            borderRadius: 8,
            color: "var(--color-popover-foreground)",
            fontSize: 12,
          }}
        />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
