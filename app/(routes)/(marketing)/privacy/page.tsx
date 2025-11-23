import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function PrivacyPage() {
  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-4">Privacybeleid</h1>
          <p className="text-muted-foreground">
            Laatst bijgewerkt: {new Date().toLocaleDateString('nl-NL')}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welke gegevens verzamelen wij</CardTitle>
            <CardDescription>
              Overzicht van de persoonlijke gegevens die we verzamelen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Accountgegevens</h3>
              <ul className="list-disc pl-6 space-y-1 text-sm">
                <li>E-mailadres en naam (verkregen via registratie)</li>
                <li>Profielinformatie en avatar (optioneel)</li>
                <li>Authenticatiegegevens (beheerd door Supabase)</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Woninggegevens</h3>
              <ul className="list-disc pl-6 space-y-1 text-sm">
                <li>Opgeslagen woningzoekfilters en voorkeuren</li>
                <li>Favoriete woningen en beoordelingen</li>
                <li>Groepslidmaatschap en bijdragegegevens</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Gebruiksgegevens</h3>
              <ul className="list-disc pl-6 space-y-1 text-sm">
                <li>Zoekpatronen en platforminteracties (alleen met toestemming)</li>
                <li>Sessiegegevens en technische informatie</li>
                <li>Groepsvormings- en onderhandelingsgegevens</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cookies en Tracking</CardTitle>
            <CardDescription>
              Hoe we cookies gebruiken op ons platform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Noodzakelijke Cookies</h3>
              <p className="text-sm mb-2">
                Deze cookies zijn essentieel voor de werking van onze website:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-sm">
                <li>Authenticatie en beveiligingscookies</li>
                <li>Sessie- en navigatiecookies</li>
                <li>Cookie-toestemmingsinstellingen</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Analyse Cookies (optioneel)</h3>
              <p className="text-sm mb-2">
                Met uw toestemming gebruiken we deze cookies om:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-sm">
                <li>Woningzoekpatronen te analyseren</li>
                <li>Groepsvormingssuccespercentages te meten</li>
                <li>Platformprestaties te monitoren</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Voorkeur Cookies (optioneel)</h3>
              <p className="text-sm mb-2">
                Deze cookies onthouden uw voorkeuren:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-sm">
                <li>Woningzoekfilters en -criteria</li>
                <li>Dashboard-indeling en weergave-instellingen</li>
                <li>Meldingen en communicatievoorkeuren</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Uw Rechten (AVG)</CardTitle>
            <CardDescription>
              Als EU-inwoner heeft u de volgende rechten betreffende uw gegevens
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Recht op toegang</h3>
                <p className="text-sm">
                  U kunt een kopie opvragen van alle gegevens die we van u bewaren
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Recht op rectificatie</h3>
                <p className="text-sm">
                  U kunt ons verzoeken onjuiste gegevens te corrigeren
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Recht op vergetelheid</h3>
                <p className="text-sm">
                  U kunt verzoeken om verwijdering van uw persoonlijke gegevens
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Recht op bezwaar</h3>
                <p className="text-sm">
                  U kunt bezwaar maken tegen bepaalde vormen van gegevensverwerking
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Recht op gegevensoverdracht</h3>
                <p className="text-sm">
                  U kunt een export opvragen van uw gegevens in een gestructureerd formaat
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Intrekking van toestemming</h3>
                <p className="text-sm">
                  U kunt uw toestemming voor cookies en gegevensverwerking altijd intrekken
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gegevensbeveiliging</CardTitle>
            <CardDescription>
              Hoe we uw gegevens beschermen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>
                <strong>Versleuteling:</strong> Alle gegevens worden versleuteld opgeslagen en verzonden via HTTPS
              </li>
              <li>
                <strong>Toegangscontrole:</strong> Strikte toegangsbeperking tot persoonlijke gegevens
              </li>
              <li>
                <strong>Gegevensminimalisatie:</strong> We verzamelen alleen noodzakelijke gegevens
              </li>
              <li>
                <strong>Reguliere audits:</strong> Periodieke beveiligingsbeoordelingen en updates
              </li>
              <li>
                <strong>Incident response:</strong> Procedures voor melden van datalekken binnen 72 uur
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Derde Partijen</CardTitle>
            <CardDescription>
              Services van derden die we gebruiken
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Supabase (Database & Authenticatie)</h3>
              <p className="text-sm mb-2">
                Locatie: VS/EU • AVG-compliant • Gebruikt voor veilige gegevensopslag
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Google Fonts</h3>
              <p className="text-sm mb-2">
                Locatie: VS • Gebruikt voor website-lettertypen • Minimale gegevensuitwisseling
              </p>
            </div>

            <p className="text-sm text-muted-foreground">
              We delen geen persoonlijke gegevens met andere derde partijen voor marketing doeleinden.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact</CardTitle>
            <CardDescription>
              Vragen over dit privacybeleid of uw gegevens
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-4">
              Voor vragen over uw privacy of om uw rechten uit te oefenen, kunt u contact met ons opnemen:
            </p>
            <div className="space-y-2 text-sm">
              <p><strong>E-mail:</strong> privacy@movein.app</p>
              <p><strong>Reactietijd:</strong> Binnen 30 dagen conform AVG-vereisten</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}