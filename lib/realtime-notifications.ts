import { eq } from "drizzle-orm"
import { db } from "@/db/client"
import { profiles } from "@/db/schema"

// Function to send real-time notification about new member being approved
export async function notifyMemberApproved(
  groupId: string,
  propertyId: string,
  newMemberId: string,
) {
  try {
    // Get new member's profile to get their name
    const memberProfile = await db
      .select({ fullName: profiles.fullName, email: profiles.email })
      .from(profiles)
      .where(eq(profiles.id, newMemberId))
      .limit(1)

    const memberName = memberProfile[0]?.fullName || memberProfile[0]?.email || "New Member"

    // Get all active calculation sessions for this group/property
    const sessionId = `${groupId}-${propertyId}`

    // In a production environment, you would emit to the Socket.IO server here
    // For now, we'll prepare the data structure
    const notificationData = {
      type: "member-approved",
      sessionId,
      groupId,
      propertyId,
      userId: newMemberId,
      userName: memberName,
      timestamp: Date.now(),
    }

    console.log("Member approved notification:", notificationData)

    // TODO: Emit to Socket.IO server when available
    // io.to(sessionId).emit("member-approved", notificationData)

    return { success: true, notificationData }
  } catch (error) {
    console.error("Error sending member approved notification:", error)
    return { success: false, error }
  }
}

// Function to send real-time notification about new join request
export async function notifyJoinRequest(groupId: string, propertyId: string, requesterId: string) {
  try {
    // Get requester's profile to get their name
    const requesterProfile = await db
      .select({ fullName: profiles.fullName, email: profiles.email })
      .from(profiles)
      .where(eq(profiles.id, requesterId))
      .limit(1)

    const requesterName = requesterProfile[0]?.fullName || requesterProfile[0]?.email || "Someone"

    // Get all active calculation sessions for this group/property
    const sessionId = `${groupId}-${propertyId}`

    // In a production environment, you would emit to the Socket.IO server here
    const notificationData = {
      type: "join-request",
      sessionId,
      groupId,
      propertyId,
      userId: requesterId,
      userName: requesterName,
      timestamp: Date.now(),
    }

    console.log("Join request notification:", notificationData)

    // TODO: Emit to Socket.IO server when available
    // io.to(sessionId).emit("join-request", notificationData)

    return { success: true, notificationData }
  } catch (error) {
    console.error("Error sending join request notification:", error)
    return { success: false, error }
  }
}
