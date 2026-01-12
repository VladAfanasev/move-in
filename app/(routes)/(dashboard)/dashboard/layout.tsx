import { redirect } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { requireUser } from "@/lib/supabase/cached"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser()

  if (!user) {
    redirect("/")
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "19rem",
        } as React.CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset className="flex min-h-screen flex-col bg-muted/40 p-4">
        <div className="flex min-h-full flex-col rounded-xl border bg-background shadow-sm">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
