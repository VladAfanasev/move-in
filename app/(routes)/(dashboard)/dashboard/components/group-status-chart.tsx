"use client"

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface GroupStatusChartProps {
  groupsByStatus: Record<string, number>
}

const COLORS: Record<string, string> = {
  forming: "#8884d8",
  active: "#82ca9d",
  viewing: "#ffc658",
  offer_made: "#ff8042",
  closed: "#0088fe",
  disbanded: "#d84447",
}

export function GroupStatusChart({ groupsByStatus }: GroupStatusChartProps) {
  const data = Object.entries(groupsByStatus).map(([status, count]) => ({
    name: status.replace("_", " ").charAt(0).toUpperCase() + status.slice(1).replace("_", " "),
    value: count,
  }))

  const chartConfig = {
    value: {
      label: "Groups",
    },
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Group Status</CardTitle>
        <CardDescription>Distribution of your groups by status</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent />} />
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[entry.name.toLowerCase().replace(" ", "_")] || COLORS.forming}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
