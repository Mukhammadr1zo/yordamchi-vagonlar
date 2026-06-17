"use client";

import { Sankey, Tooltip, ResponsiveContainer, Layer, Rectangle } from "recharts";
import { PALETTE } from "./palette";

export type SankeyData = {
  nodes: { name: string }[];
  links: { source: number; target: number; value: number }[];
};

// Tugun (node) — rangli to'rtburchak + yorliq
function SankeyNode(props: {
  x: number;
  y: number;
  width: number;
  height: number;
  index: number;
  payload: { name: string };
  containerWidth: number;
}) {
  const { x, y, width, height, index, payload, containerWidth } = props;
  const isRight = x + width + 6 > containerWidth;
  return (
    <Layer key={`node-${index}`}>
      <Rectangle
        x={x}
        y={y}
        width={width}
        height={height}
        fill={PALETTE[index % PALETTE.length]}
        fillOpacity={0.9}
        radius={2}
      />
      <text
        x={isRight ? x - 6 : x + width + 6}
        y={y + height / 2}
        textAnchor={isRight ? "end" : "start"}
        dominantBaseline="middle"
        fontSize={11}
        fill="#94a3b8"
      >
        {payload.name}
      </text>
    </Layer>
  );
}

export function FlowSankey({ data }: { data: SankeyData }) {
  if (!data.nodes.length || !data.links.length) {
    return (
      <div className="text-muted-foreground flex h-[300px] items-center justify-center text-sm">
        —
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={300}>
      <Sankey
        data={data}
        nodePadding={24}
        nodeWidth={12}
        linkCurvature={0.5}
        iterations={32}
        margin={{ left: 4, right: 4, top: 8, bottom: 8 }}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        node={(props: any) => <SankeyNode {...props} />}
        link={{ stroke: "#94a3b8", strokeOpacity: 0.25 }}
      >
        <Tooltip
          contentStyle={{
            background: "var(--color-popover)",
            border: "1px solid var(--color-border)",
            borderRadius: 8,
            color: "var(--color-popover-foreground)",
            fontSize: 12,
          }}
        />
      </Sankey>
    </ResponsiveContainer>
  );
}
