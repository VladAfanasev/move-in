"use client"

import { Home, Plus, Users } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function QuickActions() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Snelle acties</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2 sm:grid-cols-3">
        <Link href="/dashboard/groups/create">
          <Button variant="outline" className="h-auto w-full justify-start p-3">
            <Plus className="mr-2 h-4 w-4" />
            <div className="text-left">
              <div className="font-medium text-sm">Groep aanmaken</div>
            </div>
          </Button>
        </Link>

        <Link href="/dashboard/properties">
          <Button variant="outline" className="h-auto w-full justify-start p-3">
            <Home className="mr-2 h-4 w-4" />
            <div className="text-left">
              <div className="font-medium text-sm">Woningen zoeken</div>
            </div>
          </Button>
        </Link>

        <Link href="/dashboard/groups">
          <Button variant="outline" className="h-auto w-full justify-start p-3">
            <Users className="mr-2 h-4 w-4" />
            <div className="text-left">
              <div className="font-medium text-sm">Mijn groepen</div>
            </div>
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
