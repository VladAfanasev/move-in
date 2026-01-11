import { shouldUseRealtimeConnection } from "@/lib/sse-connections"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params
  const url = new URL(request.url)
  const userId = url.searchParams.get("userId")

  if (!userId) {
    return new Response("Missing userId", { status: 400 })
  }

  try {
    const shouldConnect = await shouldUseRealtimeConnection(sessionId, userId)
    
    return Response.json({
      sessionId,
      useRealtime: shouldConnect,
      useDatabase: !shouldConnect,
    })
  } catch (error) {
    console.error("Error checking session mode:", error)
    return new Response("Internal server error", { status: 500 })
  }
}