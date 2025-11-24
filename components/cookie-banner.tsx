"use client"

import { Cookie, Settings, X } from "lucide-react"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { type CookieConsent, useCookieConsent } from "@/lib/cookie-consent"

export function CookieBanner() {
  const { consent, updateConsent, showBanner, hideBanner } = useCookieConsent()
  const [showSettings, setShowSettings] = useState(false)
  const [tempConsent, setTempConsent] = useState<Partial<CookieConsent>>({})

  if (!showBanner) return null

  const handleAcceptAll = () => {
    updateConsent({
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
    })
  }

  const handleAcceptNecessary = () => {
    updateConsent({
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false,
    })
  }

  const handleSaveSettings = () => {
    updateConsent(tempConsent)
    setShowSettings(false)
  }

  const updateTempConsent = (key: keyof CookieConsent, value: boolean) => {
    setTempConsent(prev => ({ ...prev, [key]: value }))
  }

  if (showSettings) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <Card className="max-h-[80vh] w-full max-w-2xl overflow-y-auto">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Cookie Voorkeuren
              </CardTitle>
              <CardDescription>
                Bepaal welke cookies we mogen gebruiken om uw ervaring te verbeteren
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowSettings(false)}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg bg-muted p-4">
                <div className="flex-1">
                  <h4 className="font-medium">Noodzakelijke Cookies</h4>
                  <p className="text-muted-foreground text-sm">
                    Vereist voor authenticatie, beveiliging en basisfunctionaliteit van de site
                  </p>
                </div>
                <Badge variant="secondary">Altijd Aan</Badge>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex-1">
                  <h4 className="font-medium">Analyse Cookies</h4>
                  <p className="text-muted-foreground text-sm">
                    Helpen ons woningzoekpatronen en groepsvorming te begrijpen
                  </p>
                </div>
                <Checkbox
                  checked={tempConsent.analytics ?? consent?.analytics ?? false}
                  onCheckedChange={checked => updateTempConsent("analytics", !!checked)}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex-1">
                  <h4 className="font-medium">Voorkeur Cookies</h4>
                  <p className="text-muted-foreground text-sm">
                    Onthouden uw woningfilters, dashboard-indeling en meldingsinstellingen
                  </p>
                </div>
                <Checkbox
                  checked={tempConsent.preferences ?? consent?.preferences ?? false}
                  onCheckedChange={checked => updateTempConsent("preferences", !!checked)}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex-1">
                  <h4 className="font-medium">Marketing Cookies</h4>
                  <p className="text-muted-foreground text-sm">
                    Volgen conversiepercentages en helpen relevante woningaanbevelingen te tonen
                  </p>
                </div>
                <Checkbox
                  checked={tempConsent.marketing ?? consent?.marketing ?? false}
                  onCheckedChange={checked => updateTempConsent("marketing", !!checked)}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleSaveSettings} className="flex-1">
                Voorkeuren Opslaan
              </Button>
              <Button variant="outline" onClick={() => setShowSettings(false)}>
                Annuleren
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed right-0 bottom-0 left-0 z-40 border-t bg-background p-4 shadow-lg">
      <div className="container mx-auto">
        <Card className="border-none shadow-none">
          <CardContent className="pt-6">
            <div className="flex flex-col items-start gap-4 lg:flex-row lg:items-center">
              <div className="flex flex-1 items-start gap-3">
                <Cookie className="mt-1 h-6 w-6 flex-shrink-0 text-primary" />
                <div className="space-y-1">
                  <h3 className="font-semibold text-lg">Wij respecteren uw privacy</h3>
                  <p className="text-muted-foreground text-sm">
                    Wij gebruiken cookies om uw woningzoekervaring te verbeteren, uw voorkeuren te
                    onthouden en groepsvormingspatronen te analyseren om ons platform te verbeteren.
                  </p>
                </div>
              </div>

              <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
                <Button variant="outline" size="sm" onClick={() => setShowSettings(true)}>
                  <Settings className="mr-2 h-4 w-4" />
                  Aanpassen
                </Button>
                <Button variant="outline" size="sm" onClick={handleAcceptNecessary}>
                  Alleen Noodzakelijk
                </Button>
                <Button size="sm" onClick={handleAcceptAll}>
                  Alles Accepteren
                </Button>
                <Button variant="ghost" size="sm" onClick={hideBanner}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
