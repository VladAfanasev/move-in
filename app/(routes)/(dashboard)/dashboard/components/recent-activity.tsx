"use client"

import { formatDistanceToNow } from "date-fns"
import { Activity, Home, MessageSquare } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ActivityItem {
  type: string
  title: string
  description: string
  createdAt: string | Date
  groupName: string
}

interface RecentActivityProps {
  activities: ActivityItem[]
}

export function RecentActivity({ activities }: RecentActivityProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case "comment":
        return <MessageSquare className="h-3 w-3" />
      case "property":
        return <Home className="h-3 w-3" />
      default:
        return <Activity className="h-3 w-3" />
    }
  }

  if (!activities || activities.length === 0) {
    return (
      <Card className="h-fit">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Recente activiteit</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-xs">Geen recente activiteit</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Recente activiteit</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-6 pr-3">
            {activities.slice(0, 8).map((activity, index) => (
              <div key={index} className="relative flex gap-3">
                {/* Time */}
                <div className="text-muted-foreground text-[11px] font-medium w-12 text-right flex-shrink-0 pt-0.5">
                  {formatDistanceToNow(new Date(activity.createdAt), { 
                    addSuffix: false 
                  }).replace('about ', '')
                    .replace('less than a minute', 'nu')
                    .replace('minute', 'min')
                    .replace('minutes', 'min')
                    .replace('hour', 'uur')
                    .replace('hours', 'uur')
                    .replace('day', 'dag')
                    .replace('days', 'dgn')
                    .replace('month', 'mnd')
                    .replace('months', 'mnd')
                    .replace('year', 'jr')
                    .replace('years', 'jr')}
                </div>
                
                {/* Dot and line */}
                <div className="relative flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 z-10"></div>
                  {index < activities.slice(0, 8).length - 1 && (
                    <div className="absolute top-3 w-px h-full bg-border"></div>
                  )}
                </div>
                
                {/* Content */}
                <div className="flex-1 pb-1">
                  <div className="flex items-start gap-2">
                    <div className="rounded p-1 bg-muted">
                      {getIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs text-foreground">
                        {activity.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                        {activity.description}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {activity.groupName}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}