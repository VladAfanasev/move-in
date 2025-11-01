"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getAvatarProps } from "@/lib/avatar-utils"
import { cn } from "@/lib/utils"

interface UserAvatarProps {
  userId: string
  name: string | null
  avatarUrl?: string | null
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
  showName?: boolean
}

export function UserAvatar({
  userId,
  name,
  avatarUrl,
  size = "md",
  className,
  showName = false,
}: UserAvatarProps) {
  const { initials, colorClass } = getAvatarProps(userId, name, avatarUrl)

  const sizeClasses = {
    sm: "h-6 w-6 text-xs",
    md: "h-8 w-8 text-sm",
    lg: "h-10 w-10 text-base",
    xl: "h-12 w-12 text-lg",
  }

  if (showName) {
    return (
      <div className={cn("flex items-center space-x-2", className)}>
        <Avatar className={sizeClasses[size]}>
          <AvatarImage src={avatarUrl || undefined} alt={name || ""} />
          <AvatarFallback
            className="font-bold text-white"
            style={{
              backgroundColor: colorClass,
              textShadow: "0 1px 2px rgba(0, 0, 0, 0.8)",
            }}
          >
            {initials}
          </AvatarFallback>
        </Avatar>
        {name && <span className="font-medium text-gray-900 text-sm">{name}</span>}
      </div>
    )
  }

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      <AvatarImage src={avatarUrl || undefined} alt={name || ""} />
      <AvatarFallback
        className="font-bold text-white"
        style={{
          backgroundColor: colorClass,
          textShadow: "0 1px 2px rgba(0, 0, 0, 0.8)",
        }}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  )
}
