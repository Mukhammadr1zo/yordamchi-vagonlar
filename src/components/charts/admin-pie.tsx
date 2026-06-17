"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { PALETTE } from "./palette";

export function AdminPie({
  data,
  onSelect,
}: {
  data: { name: string; value: number }[];
  onSelect?: (key: string) => void;
}) {
  if (!data.length) {
    return <Empty />;
  }
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={90}
          paddingAngle={2}
          className={onSelect ? "cursor-pointer" : undefined}
          onClick={(_, index) => onSelect?.(data[index]?.name)}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={PALETTE[i % PALETTE.length]} stroke="transparent" />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: "var(--color-popover)",
            border: "1px solid var(--color-border)",
            borderRadius: 8,
            color: "var(--color-popover-foreground)",
            fontSize: 12,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

function Empty() {
  return (
    <div className="text-muted-foreground flex h-[260px] items-center justify-center text-sm">
      —
    </div>
  );
}
