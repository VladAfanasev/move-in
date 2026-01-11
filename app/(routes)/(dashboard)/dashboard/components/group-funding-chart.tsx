"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface FundingProgress {
  name: string
  target: number
  current: number
  percentage: number
  status: string | null
}

interface GroupFundingChartProps {
  fundingProgress: FundingProgress[]
}

export function GroupFundingChart({ fundingProgress }: GroupFundingChartProps) {
  if (fundingProgress.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Funding Progress</CardTitle>
          <CardDescription>Track your groups' funding goals</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No groups with funding targets yet</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Funding Progress</CardTitle>
        <CardDescription>Track your groups' funding goals</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {fundingProgress.slice(0, 4).map((group) => (
          <div key={group.name} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{group.name}</span>
              <span className="text-muted-foreground">
                {group.percentage.toFixed(0)}%
              </span>
            </div>
            <Progress value={group.percentage} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>€{group.current.toLocaleString()}</span>
              <span>€{group.target.toLocaleString()}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}