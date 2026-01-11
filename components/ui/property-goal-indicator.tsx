"use client"

import { useEffect, useId, useState } from "react"
import { getGoalProgressMessage, getProgressStateColor } from "@/lib/goal-progress-utils"
import { cn } from "@/lib/utils"

interface PropertyGoalIndicatorProps {
  percentage: number
  allConfirmed?: boolean
  memberCount?: number
  className?: string
  size?: "sm" | "md" | "lg"
  showMessage?: boolean
}

export function PropertyGoalIndicator({
  percentage,
  allConfirmed = false,
  memberCount = 1,
  className,
  size = "lg",
  showMessage = true,
}: PropertyGoalIndicatorProps) {
  const [animatedPercentage, setAnimatedPercentage] = useState(0)
  const [showCelebration, setShowCelebration] = useState(false)
  const [lastMilestone, setLastMilestone] = useState(0)
  const progressMessageId = useId()

  // Animate percentage changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedPercentage(percentage)
    }, 100)
    return () => clearTimeout(timer)
  }, [percentage])

  // Milestone celebration effects
  useEffect(() => {
    const currentMilestone = Math.floor(percentage / 25) * 25
    const reachedMilestone =
      (percentage >= 95 && lastMilestone < 95) || (percentage >= 100 && lastMilestone < 100)

    if (reachedMilestone) {
      setShowCelebration(true)
      const timer = setTimeout(() => setShowCelebration(false), 2000)
      return () => clearTimeout(timer)
    }

    setLastMilestone(currentMilestone)
  }, [percentage, lastMilestone])

  // Size configurations - Made significantly smaller to prevent overflow
  const sizes = {
    sm: {
      container: "w-24 h-24 sm:w-28 sm:h-28",
      stroke: "6",
      text: "text-lg sm:text-xl",
      subtext: "text-xs",
    },
    md: {
      container: "w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40",
      stroke: "8",
      text: "text-xl sm:text-2xl",
      subtext: "text-xs",
    },
    lg: {
      container: "w-40 h-40 sm:w-44 sm:h-44 md:w-48 md:h-48 lg:w-52 lg:h-52",
      stroke: "10",
      text: "text-2xl sm:text-3xl",
      subtext: "text-xs sm:text-sm",
    },
  }

  const { container, stroke, text } = sizes[size]
  const radius = 45
  const circumference = 2 * Math.PI * radius
  // Ensure the ring never fully closes until exactly 100% - cap at 95% visual completion to show clear gap
  const visualPercentage = animatedPercentage >= 100 ? 100 : Math.min(95, animatedPercentage)
  const strokeDashoffset = circumference - (visualPercentage / 100) * circumference

  // Determine progress state and colors
  const getProgressState = () => {
    if (percentage < 95) return "far"
    if (percentage >= 95 && percentage < 100) return "close"
    if (percentage === 100 && allConfirmed) return "completed"
    if (percentage === 100) return "reached"
    if (percentage > 100) return "over"
    return "far"
  }

  const progressState = getProgressState()

  // Color mapping for different states
  const stateColors = {
    far: {
      ring: "stroke-orange-500",
      bg: "stroke-muted",
      text: "text-orange-600",
      glow: "",
    },
    close: {
      ring: "stroke-yellow-500",
      bg: "stroke-muted",
      text: "text-yellow-600",
      glow: "drop-shadow-[0_0_8px_rgba(234,179,8,0.3)]",
    },
    reached: {
      ring: "stroke-green-500",
      bg: "stroke-muted",
      text: "text-green-600",
      glow: "drop-shadow-[0_0_12px_rgba(34,197,94,0.4)]",
    },
    completed: {
      ring: "stroke-green-500",
      bg: "stroke-muted",
      text: "text-green-600",
      glow: "drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]",
    },
    over: {
      ring: "stroke-red-500",
      bg: "stroke-muted",
      text: "text-red-600",
      glow: "",
    },
  }

  const colors = stateColors[progressState]
  const progressMessage = getGoalProgressMessage(percentage, allConfirmed, memberCount)

  // Animation classes with progressive pulse speed
  const getPulseSpeed = () => {
    if (percentage < 90) return null // No pulse under 90%
    if (percentage >= 100) return null // No pulse at 100%

    // Progressive speed from 90% to 99.9% (3s -> 0.8s)
    const progressRange = (percentage - 90) / 9.9 // 0 to 1 range
    const minSpeed = 3.0 // Slowest at 90%
    const maxSpeed = 0.8 // Fastest at 99.9%
    return minSpeed - progressRange * (minSpeed - maxSpeed)
  }

  const pulseSpeed = getPulseSpeed()
  const shouldPulse = pulseSpeed !== null
  const shouldCelebrate = progressState === "completed" || showCelebration

  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      {/* Fixed height container for status message to prevent layout shifts */}
      <div className="mb-4 flex h-16 items-center justify-center">
        {showMessage && (
          <div className="text-center" id={progressMessageId}>
            <output
              className={cn(
                "mb-1 flex items-center justify-center gap-2 px-2",
                getProgressStateColor(percentage, allConfirmed),
              )}
              aria-live="polite"
            >
              {progressMessage.icon && (
                <span className="text-base sm:text-lg" aria-hidden="true">
                  {progressMessage.icon}
                </span>
              )}
              <span className="font-semibold text-sm sm:text-base">{progressMessage.message}</span>
            </output>
            {progressMessage.actionHint && (
              <p className="mx-auto max-w-xs px-4 text-muted-foreground text-xs sm:text-sm">
                {progressMessage.actionHint}
              </p>
            )}
          </div>
        )}
      </div>

      <div
        className={cn(
          "relative shrink-0 overflow-hidden rounded-full",
          "will-change-transform contain-layout contain-style",
          container,
        )}
        style={{
          isolation: "isolate",
          transform: "translateZ(0)",
        }}
      >
        {/* Celebration overlay */}
        {showCelebration && (
          <div
            className="absolute inset-0 z-20 flex items-center justify-center"
            style={{
              transform: "translateZ(0)",
              willChange: "opacity",
            }}
          >
            <div
              className="h-full w-full rounded-full bg-yellow-400/20 motion-safe:animate-pulse"
              style={{
                animationDuration: "1.5s",
                animationIterationCount: "3",
              }}
            ></div>
          </div>
        )}

        {/* SVG Progress Ring */}
        <svg
          className={cn(
            "-rotate-90 h-full w-full transform transition-all duration-500",
            "will-change-transform",
            colors.glow,
            shouldPulse && "motion-safe:animate-pulse",
            shouldCelebrate && "motion-safe:animate-pulse",
          )}
          style={{
            transform: "rotate(-90deg) translateZ(0)",
            willChange: shouldPulse || shouldCelebrate ? "filter, transform" : "auto",
            animationDuration: shouldPulse ? `${pulseSpeed}s` : undefined,
          }}
          viewBox="0 0 100 100"
          role="progressbar"
          aria-valuenow={Math.round(animatedPercentage)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Investeringsdoel: ${animatedPercentage.toFixed(1)} procent van 100 procent ${
            allConfirmed && percentage === 100 ? "voltooid" : "bereikt"
          }`}
          aria-describedby={showMessage ? progressMessageId : undefined}
        >
          {/* Background Circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            className={colors.bg}
            strokeWidth={stroke}
            fill="transparent"
          />

          {/* Progress Circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            className={cn(colors.ring, "transition-all duration-700 ease-out")}
            strokeWidth={stroke}
            fill="transparent"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{
              filter: shouldCelebrate ? "drop-shadow(0 0 20px currentColor)" : undefined,
            }}
          />
        </svg>

        {/* Center Content */}
        <div
          className="absolute inset-2 flex flex-col items-center justify-center overflow-hidden rounded-full"
          style={{
            transform: "translateZ(0)",
            willChange: "auto",
          }}
        >
          <span className={cn("font-bold transition-colors duration-500", text, colors.text)}>
            {animatedPercentage.toFixed(1)}%
          </span>

          {/* Celebration indicator - moved inside inset-2 bounds */}
          {shouldCelebrate && (
            <div
              className="absolute top-1 right-1 z-30 text-sm motion-safe:animate-pulse"
              aria-hidden="true"
              style={{
                transform: "translateZ(0) scale(1)",
                willChange: "transform, opacity",
                animationDuration: "1s",
                animationIterationCount: "3",
              }}
            >
              🎉
            </div>
          )}

          {/* Milestone celebration sparkles - contained within center bounds */}
          {showCelebration && (
            <div
              aria-hidden="true"
              className="absolute inset-1 overflow-hidden rounded-full"
              style={{
                transform: "translateZ(0)",
                pointerEvents: "none",
              }}
            >
              <div
                className="absolute top-2 right-2 text-xs text-yellow-400 motion-safe:animate-pulse"
                style={{
                  transform: "translateZ(0) scale(1)",
                  willChange: "transform, opacity",
                  animationDuration: "1.2s",
                  animationDelay: "0.1s",
                  animationIterationCount: "3",
                }}
              >
                ✨
              </div>
              <div
                className="absolute bottom-2 left-2 text-xs text-yellow-400 motion-safe:animate-pulse"
                style={{
                  transform: "translateZ(0) scale(1)",
                  willChange: "transform, opacity",
                  animationDuration: "1.2s",
                  animationDelay: "0.2s",
                  animationIterationCount: "3",
                }}
              >
                ✨
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
