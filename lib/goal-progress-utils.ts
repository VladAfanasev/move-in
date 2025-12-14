interface ProgressState {
  message: string
  urgency: "low" | "medium" | "high" | "success" | "warning"
  icon?: string
  actionHint?: string
}

export function getGoalProgressMessage(
  totalPercentage: number,
  allConfirmed: boolean,
  memberCount: number,
): ProgressState {
  const remaining = 100 - totalPercentage
  const excess = totalPercentage - 100

  // All confirmed - celebration state
  if (totalPercentage === 100 && allConfirmed) {
    return {
      message: "🏠 Gelukt! Alle leden hebben bevestigd",
      urgency: "success",
      icon: "🎉",
      actionHint: "Klaar voor de volgende stap!",
    }
  }

  // Exactly 100% but waiting for confirmations
  if (totalPercentage === 100) {
    return {
      message: "Perfect! Wachten op bevestiging van iedereen...",
      urgency: "high",
      icon: "⏳",
      actionHint: "Bevestig jouw aandeel als je dat nog niet hebt gedaan",
    }
  }

  // Over the limit
  if (totalPercentage > 100) {
    return {
      message: `Over de limiet! ${excess.toFixed(1)}% verminderen`,
      urgency: "warning",
      icon: "⚠️",
      actionHint: "Verlaag je percentage om binnen budget te blijven",
    }
  }

  // Very close (95-99%)
  if (totalPercentage >= 95) {
    return {
      message: `Bijna daar! Nog ${remaining.toFixed(1)}% nodig`,
      urgency: "high",
      icon: "🔥",
      actionHint: "Een kleine verhoging en jullie hebben het doel bereikt!",
    }
  }

  // Making good progress (75-94%)
  if (totalPercentage >= 75) {
    return {
      message: `Nog ${remaining.toFixed(1)}% te gaan`,
      urgency: "medium",
      icon: "💪",
      actionHint: "Jullie zijn op de goede weg naar het doel",
    }
  }

  // Halfway there (50-74%)
  if (totalPercentage >= 50) {
    return {
      message: `Nog ${remaining.toFixed(1)}% nodig`,
      urgency: "medium",
      icon: "📈",
      actionHint: "Blijf investeren om het doel te bereiken",
    }
  }

  // Just getting started (25-49%)
  if (totalPercentage >= 25) {
    return {
      message: `Goede start! Nog ${remaining.toFixed(1)}% nodig`,
      urgency: "medium",
      icon: "🚀",
      actionHint: "Verhoog je aandeel of nodig meer leden uit",
    }
  }

  // Very early stage (0-24%)
  if (memberCount <= 2) {
    return {
      message: "Meer investeerders nodig voor dit project",
      urgency: "low",
      icon: "👥",
      actionHint: "Nodig vrienden uit om samen te investeren",
    }
  }

  return {
    message: `Begin fase - nog ${remaining.toFixed(1)}% nodig`,
    urgency: "low",
    icon: "🎯",
    actionHint: "Verhoog je percentage om dichterbij het doel te komen",
  }
}

export function getProgressStateColor(totalPercentage: number, allConfirmed: boolean) {
  if (totalPercentage === 100 && allConfirmed) return "text-green-600"
  if (totalPercentage === 100) return "text-blue-600"
  if (totalPercentage > 100) return "text-red-600"
  if (totalPercentage >= 95) return "text-yellow-600"
  if (totalPercentage >= 75) return "text-orange-500"
  return "text-orange-600"
}
