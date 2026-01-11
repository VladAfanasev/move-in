"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts"

interface PriceDistribution {
  range: string
  count: number
}

interface PropertyPriceChartProps {
  priceDistribution: PriceDistribution[]
}

export function PropertyPriceChart({ priceDistribution }: PropertyPriceChartProps) {
  if (priceDistribution.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Price Distribution</CardTitle>
          <CardDescription>Properties by price range</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No properties saved yet</p>
        </CardContent>
      </Card>
    )
  }

  const chartConfig = {
    count: {
      label: "Properties",
      color: "#8884d8",
    },
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Price Distribution</CardTitle>
        <CardDescription>Properties by price range</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="max-h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={priceDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="range"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="var(--chart-1)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}