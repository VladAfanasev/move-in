import { type NextRequest, NextResponse } from "next/server"
import {
  getMemberIntentions,
  getOrCreateCostCalculation,
  setMemberIntentions,
} from "@/lib/cost-calculations"
import { getGroupMembers } from "@/lib/groups"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get("groupId")
    const propertyId = searchParams.get("propertyId")

    if (!(groupId && propertyId)) {
      return NextResponse.json({ error: "Missing groupId or propertyId" }, { status: 400 })
    }

    // Get or create cost calculation
    const calculation = await getOrCreateCostCalculation(groupId, propertyId, user)

    // Get group members
    const members = await getGroupMembers(groupId)

    // Get intentions
    const intentions = await getMemberIntentions(calculation.id, members)

    return NextResponse.json({
      intentions,
      calculationId: calculation.id,
    })
  } catch (error) {
    console.error("Error getting intentions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { calculationId, desiredPercentage, maxPercentage } = body

    if (!(calculationId && desiredPercentage && maxPercentage)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    await setMemberIntentions(calculationId, user.id, desiredPercentage, maxPercentage)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error setting intentions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
