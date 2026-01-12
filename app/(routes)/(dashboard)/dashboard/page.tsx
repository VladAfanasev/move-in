import { redirect } from "next/navigation"
import { SiteHeader } from "@/components/site-header"
import { getDashboardStats } from "@/lib/dashboard-data"
import { requireUser } from "@/lib/supabase/cached"
import { ActionCards } from "./components/action-cards"
import { DashboardStats } from "./components/dashboard-stats"
import { QuickActions } from "./components/quick-actions"
import { RecentActivity } from "./components/recent-activity"

export default async function DashboardPage() {
  const user = await requireUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch dashboard data (cached for 30s)
  const dashboardStats = await getDashboardStats(user.id)

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader title="Dashboard" />
      <div className="@container/main flex flex-1 flex-col gap-4 p-4 lg:p-6">
        {/* Welcome Section */}
        <div className="mb-2">
          <h1 className="font-bold text-2xl lg:text-3xl">Welkom terug!</h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Hier is een overzicht van jouw huizenkoop reis
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-4 lg:grid-cols-4">
          {/* Left Column - Main Content (3/4 columns) */}
          <div className="space-y-4 lg:col-span-3">
            {/* Quick Actions */}
            <QuickActions />

            {/* Stats Cards */}
            <DashboardStats stats={dashboardStats} />

            {/* Action Required Items */}
            <ActionCards actionItems={dashboardStats.actionItems} />
          </div>

          {/* Right Column - Recent Activity Sidebar (1/4 columns) */}
          <div className="lg:col-span-1">
            <RecentActivity activities={dashboardStats.recentActivities} />
          </div>
        </div>
      </div>
    </div>
  )
}
