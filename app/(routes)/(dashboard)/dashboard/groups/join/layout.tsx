// Layout specifically for join pages - outside SidebarProvider context
export default function JoinLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-gray-50">{children}</div>
}
