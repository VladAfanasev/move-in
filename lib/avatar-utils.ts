// Avatar utility functions for generating initials and colors

const AVATAR_COLORS = [
  "#DC2626", // red-600
  "#2563EB", // blue-600
  "#16A34A", // green-600
  "#9333EA", // purple-600
  "#EA580C", // orange-600
  "#0D9488", // teal-600
  "#4F46E5", // indigo-600
  "#DB2777", // pink-600
  "#0891B2", // cyan-600
  "#7C3AED", // violet-600
  "#059669", // emerald-600
  "#0284C7", // sky-600
  "#D97706", // amber-600
  "#E11D48", // rose-600
  "#65A30D", // lime-600
  "#475569", // slate-600
] as const

/**
 * Generate initials from a full name
 */
export function getInitials(name: string): string {
  if (!name?.trim()) return "?"

  const words = name.trim().split(/\s+/)

  if (words.length === 1) {
    // Single word: take first 2 characters
    return words[0].substring(0, 2).toUpperCase()
  }

  // Multiple words: take first character of first and last word
  const firstInitial = words[0][0]
  const lastInitial = words[words.length - 1][0]

  return (firstInitial + lastInitial).toUpperCase()
}

/**
 * Get a consistent color background for a user based on their ID
 */
export function getAvatarColor(userId: string): string {
  // Create a simple hash from the userId
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }

  // Use absolute value and modulo to get a consistent index
  const colorIndex = Math.abs(hash) % AVATAR_COLORS.length
  return AVATAR_COLORS[colorIndex]
}

/**
 * Get avatar props for a user
 */
export function getAvatarProps(userId: string, name: string | null, avatarUrl?: string | null) {
  return {
    initials: getInitials(name || "Unknown User"),
    colorClass: getAvatarColor(userId),
    avatarUrl: avatarUrl || undefined,
  }
}
