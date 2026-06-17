"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { PALETTE, AXIS_COLOR } from "./palette";

// Gorizontal reyting (eng ko'p ... ) — uzun nomlar uchun qulay
export function RankBar({
  data,
  onSelect,
}: {
  data: { label: string; value: number }[];
  onSelect?: (key: string) => void;
}) {
  if (!data.length) {
    return (
      <div className="text-muted-foreground flex h-[300px] items-center justify-center text-sm">
        —
      </div>
    );
  }
  const h = Math.max(300, data.length * 34);
  return (
    <ResponsiveContainer width="100%" height={h}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 16, bottom: 4, left: 8 }}
        className={onSelect ? "cursor-pointer" : undefined}
        onClick={(s) => {
          const lbl = (s as { activeLabel?: string })?.activeLabel;
          if (lbl) onSelect?.(String(lbl));
        }}
      >
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: AXIS_COLOR }} tickLine={false} axisLine={false} />
        <YAxis
          type="category"
          dataKey="label"
          width={130}
          tick={{ fontSize: 11, fill: AXIS_COLOR }}
          tickLine={false}
          axisLine={false}
        />
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
        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
