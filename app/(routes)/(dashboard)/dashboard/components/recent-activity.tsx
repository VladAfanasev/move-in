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
            {activities.slice(0, 8).map((activity, activityIndex) => (
              <div key={`${activity.createdAt}-${activity.title}`} className="relative flex gap-3">
                {/* Time */}
                <div className="w-12 flex-shrink-0 pt-0.5 text-right font-medium text-[11px] text-muted-foreground">
                  {formatDistanceToNow(new Date(activity.createdAt), {
                    addSuffix: false,
                  })
                    .replace("about ", "")
                    .replace("less than a minute", "nu")
                    .replace("minute", "min")
                    .replace("minutes", "min")
                    .replace("hour", "uur")
                    .replace("hours", "uur")
                    .replace("day", "dag")
                    .replace("days", "dgn")
                    .replace("month", "mnd")
                    .replace("months", "mnd")
                    .replace("year", "jr")
                    .replace("years", "jr")}
                </div>

                {/* Dot and line */}
                <div className="relative flex flex-col items-center">
                  <div className="z-10 mt-1.5 h-2 w-2 rounded-full bg-orange-500"></div>
                  {activityIndex < activities.slice(0, 8).length - 1 && (
                    <div className="absolute top-3 h-full w-px bg-border"></div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pb-1">
                  <div className="flex items-start gap-2">
                    <div className="rounded bg-muted p-1">{getIcon(activity.type)}</div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground text-xs">{activity.title}</p>
                      <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">
                        {activity.description}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
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
