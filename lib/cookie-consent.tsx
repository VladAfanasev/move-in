"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

export interface CookieConsent {
  necessary: boolean
  analytics: boolean
  marketing: boolean
  preferences: boolean
}

interface CookieConsentContextType {
  consent: CookieConsent | null
  updateConsent: (consent: Partial<CookieConsent>) => void
  hasConsented: boolean
  showBanner: boolean
  hideBanner: () => void
}

const CookieConsentContext = createContext<CookieConsentContextType | undefined>(undefined)

const COOKIE_NAME = "cookie-consent"
const BANNER_HIDDEN_KEY = "cookie-banner-hidden"

const defaultConsent: CookieConsent = {
  necessary: true, // Always true for essential cookies
  analytics: false,
  marketing: false,
  preferences: false,
}

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<CookieConsent | null>(null)
  const [showBanner, setShowBanner] = useState(false)

  // Load consent from localStorage on mount
  useEffect(() => {
    const savedConsent = localStorage.getItem(COOKIE_NAME)
    const bannerHidden = localStorage.getItem(BANNER_HIDDEN_KEY)
    
    if (savedConsent) {
      setConsent(JSON.parse(savedConsent))
    } else {
      setConsent(defaultConsent)
    }
    
    // Show banner if no consent given and banner not manually hidden
    setShowBanner(!savedConsent && !bannerHidden)
  }, [])

  const updateConsent = (newConsent: Partial<CookieConsent>) => {
    const updatedConsent = { ...consent, ...newConsent, necessary: true }
    setConsent(updatedConsent)
    localStorage.setItem(COOKIE_NAME, JSON.stringify(updatedConsent))
    setShowBanner(false)
    
    // Clean up analytics if disabled
    if (!updatedConsent.analytics) {
      clearAnalyticsCookies()
    }
  }

  const hideBanner = () => {
    setShowBanner(false)
    localStorage.setItem(BANNER_HIDDEN_KEY, "true")
    
    // If no consent given, use defaults
    if (!consent) {
      updateConsent(defaultConsent)
    }
  }

  return (
    <CookieConsentContext.Provider
      value={{
        consent,
        updateConsent,
        hasConsented: !!consent && localStorage.getItem(COOKIE_NAME) !== null,
        showBanner,
        hideBanner,
      }}
    >
      {children}
    </CookieConsentContext.Provider>
  )
}

export function useCookieConsent() {
  const context = useContext(CookieConsentContext)
  if (context === undefined) {
    throw new Error("useCookieConsent must be used within a CookieConsentProvider")
  }
  return context
}

// Analytics helper functions
export function trackEvent(eventName: string, properties?: Record<string, any>) {
  const consent = JSON.parse(localStorage.getItem(COOKIE_NAME) || "null") as CookieConsent | null
  
  if (!consent?.analytics) return
  
  // Simple analytics tracking using cookies and localStorage
  const event = {
    name: eventName,
    properties: properties || {},
    timestamp: new Date().toISOString(),
    sessionId: getSessionId(),
  }
  
  // Store events for demo purposes
  const events = JSON.parse(localStorage.getItem("analytics-events") || "[]")
  events.push(event)
  localStorage.setItem("analytics-events", JSON.stringify(events.slice(-100))) // Keep last 100 events
  
  // Set analytics cookie with event count
  const eventCount = parseInt(document.cookie
    .split("; ")
    .find(row => row.startsWith("analytics-events="))
    ?.split("=")[1] || "0"
  ) + 1
  
  document.cookie = `analytics-events=${eventCount}; path=/; max-age=2592000` // 30 days
}

function getSessionId(): string {
  let sessionId = localStorage.getItem("session-id")
  if (!sessionId) {
    sessionId = Math.random().toString(36).substring(2, 15)
    localStorage.setItem("session-id", sessionId)
  }
  return sessionId
}

function clearAnalyticsCookies() {
  // Remove analytics cookies
  document.cookie = "analytics-events=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
  localStorage.removeItem("analytics-events")
}

// Preference helpers
export function setUserPreference(key: string, value: any) {
  const consent = JSON.parse(localStorage.getItem(COOKIE_NAME) || "null") as CookieConsent | null
  
  if (!consent?.preferences) return
  
  localStorage.setItem(`pref-${key}`, JSON.stringify(value))
  document.cookie = `pref-${key}=${encodeURIComponent(JSON.stringify(value))}; path=/; max-age=2592000`
}

export function getUserPreference(key: string, defaultValue?: any) {
  const consent = JSON.parse(localStorage.getItem(COOKIE_NAME) || "null") as CookieConsent | null
  
  if (!consent?.preferences) return defaultValue
  
  const stored = localStorage.getItem(`pref-${key}`)
  return stored ? JSON.parse(stored) : defaultValue
}