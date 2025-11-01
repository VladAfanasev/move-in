import { useCallback } from "react"

interface CookieOptions {
  path?: string
  maxAge?: number
  expires?: Date
  domain?: string
  secure?: boolean
  sameSite?: "strict" | "lax" | "none"
}

interface CookieStoreAPI {
  set: (options: {
    name: string
    value: string
    path?: string
    maxAge?: number
    expires?: Date
    domain?: string
    secure?: boolean
    sameSite?: "strict" | "lax" | "none"
  }) => Promise<void>
  get: (name: string) => Promise<{ name: string; value: string } | undefined>
  delete: (name: string) => Promise<void>
}

type WindowWithCookieStore = Window & {
  cookieStore?: CookieStoreAPI
}

/**
 * Custom hook for cookie management with Cookie Store API fallback
 * Uses modern Cookie Store API when available, falls back to document.cookie
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { setCookie, getCookie, deleteCookie } = useCookie()
 *
 *   const handleSave = () => {
 *     setCookie('preferences', 'dark-mode', {
 *       maxAge: 60 * 60 * 24 * 7, // 7 days
 *       path: '/'
 *     })
 *   }
 *
 *   const handleLoad = () => {
 *     const preference = getCookie('preferences')
 *     console.log(preference) // 'dark-mode'
 *   }
 *
 *   return <button onClick={handleSave}>Save Preference</button>
 * }
 * ```
 */
export function useCookie() {
  const setCookie = useCallback((name: string, value: string, options: CookieOptions = {}) => {
    // Use Cookie Store API if available
    if (typeof window !== "undefined" && "cookieStore" in window) {
      const cookieStore = (window as WindowWithCookieStore).cookieStore
      return cookieStore
        ?.set({
          name,
          value,
          path: options.path || "/",
          maxAge: options.maxAge,
          expires: options.expires,
          domain: options.domain,
          secure: options.secure,
          sameSite: options.sameSite,
        })
        .catch(() => {
          // Fallback to document.cookie if Cookie Store API fails
          setCookieClassic(name, value, options)
        })
    } else {
      // Fallback for browsers without Cookie Store API
      setCookieClassic(name, value, options)
      return Promise.resolve()
    }
  }, [])

  const getCookie = useCallback(
    (name: string): string | undefined | Promise<string | undefined> => {
      if (typeof window === "undefined") return undefined

      // Use Cookie Store API if available
      if ("cookieStore" in window) {
        const cookieStore = (window as WindowWithCookieStore).cookieStore
        return cookieStore
          ?.get(name)
          .then(cookie => cookie?.value)
          .catch(() => {
            // Fallback to document.cookie
            return getCookieClassic(name)
          })
      }

      // Fallback for browsers without Cookie Store API
      return getCookieClassic(name)
    },
    [],
  )

  const deleteCookie = useCallback(
    (name: string, options: Pick<CookieOptions, "path" | "domain"> = {}) => {
      // Use Cookie Store API if available
      if (typeof window !== "undefined" && "cookieStore" in window) {
        const cookieStore = (window as WindowWithCookieStore).cookieStore
        return cookieStore?.delete(name).catch(() => {
          // Fallback to document.cookie
          setCookieClassic(name, "", { ...options, maxAge: 0 })
        })
      } else {
        // Fallback for browsers without Cookie Store API
        setCookieClassic(name, "", { ...options, maxAge: 0 })
        return Promise.resolve()
      }
    },
    [],
  )

  return { setCookie, getCookie, deleteCookie }
}

// Helper function for classic document.cookie approach
function setCookieClassic(name: string, value: string, options: CookieOptions = {}) {
  let cookieString = `${name}=${value}`

  if (options.path) cookieString += `; path=${options.path}`
  if (options.maxAge !== undefined) cookieString += `; max-age=${options.maxAge}`
  if (options.expires) cookieString += `; expires=${options.expires.toUTCString()}`
  if (options.domain) cookieString += `; domain=${options.domain}`
  if (options.secure) cookieString += "; secure"
  if (options.sameSite) cookieString += `; samesite=${options.sameSite}`

  // biome-ignore lint/suspicious/noDocumentCookie: Intentional fallback for browsers without Cookie Store API
  document.cookie = cookieString
}

// Helper function for classic document.cookie reading
function getCookieClassic(name: string): string | undefined {
  if (typeof document === "undefined") return undefined

  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)

  if (parts.length === 2) {
    return parts.pop()?.split(";").shift()
  }

  return undefined
}
