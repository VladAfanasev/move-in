# MoveIn Platform - Demo Handleiding

> **Duur:** 10 minuten
> **Doelgroep:** Stakeholders, investeerders, technische beoordelaars

---

## Inhoudsopgave

1. [Platform Overzicht](#platform-overzicht)
2. [Kernfunctionaliteiten](#kernfunctionaliteiten)
3. [Technische Werking](#technische-werking)
4. [Demo Structuur](#demo-structuur)
5. [Voorbereiding Checklist](#voorbereiding-checklist)
6. [Veelgestelde Vragen](#veelgestelde-vragen)

---

## Platform Overzicht

### Wat is MoveIn?

**MoveIn** is een collaboratief vastgoedplatform dat groepen mensen in staat stelt om gezamenlijk woningen te kopen door kosten en eigendom te delen. Het platform richt zich op de Nederlandse markt en maakt eigenwoningbezit toegankelijker door transparante kostenverdeling en juridisch bindende overeenkomsten.

### Kernprobleem dat we oplossen

- Stijgende huizenprijzen maken individuele aankoop onbereikbaar
- Groepsaankopen zijn complex en ondoorzichtig
- Gebrek aan transparantie bij kostenverdeling
- Geen gestandaardiseerde contracten voor gedeeld eigendom

### Onze Oplossing

- **Groepen vormen** met gedeelde budgetten en voorkeuren
- **Real-time onderhandelen** over investeringspercentages
- **Automatische contractgeneratie** met juridische geldigheid
- **Volledige transparantie** in alle kosten en verdelingen

---

## Kernfunctionaliteiten

### 1. Groepsbeheer

**Doel:** Koopgroepen aanmaken en beheren voor collectieve woningaankoop

| Functie | Beschrijving |
|---------|--------------|
| Groep aanmaken | Naam, doelbudget, locatie, max. leden (standaard 10) |
| Levenscyclus | `vorming → actief → bezichtiging → bod_gedaan → gesloten` |
| Rollen | `eigenaar` (volledige controle), `beheerder` (leden beheren), `lid` (deelnemer) |

### 2. Uitnodigingssysteem

**Drie manieren om lid te worden:**

| Methode | Werking |
|---------|---------|
| **E-mail uitnodiging** | Unieke token met vervaldatum, rol vooraf toegewezen |
| **QR-code** | Dynamisch gegenereerd, scan om toegang aan te vragen |
| **Deellink** | Directe link om groep te joinen |

**Statusflow:**
```
Uitnodiging verstuurd → Token aangemaakt → Gebruiker klikt/scant →
Verzoek aangemaakt (in afwachting) → Beheerder beoordeelt →
Accepteren/Afwijzen → Lidstatus bijgewerkt
```

### 3. Woningen Verkennen

- Blader door geverifieerde Nederlandse woningaanbiedingen
- Details: adres, prijs, slaapkamers, badkamers, oppervlakte, woningtype
- Woningen opslaan bij groep met notities en beoordelingen (1-5 sterren)
- Status volgen: `opgeslagen → bezichtiging_gepland → bezichtigd → bod_gedaan`

### 4. Real-time Kostenberekening & Onderhandeling

**De kern van het platform** - live collaboratieve kostenverdeling

**Automatisch berekende kosten:**

| Component | Standaard |
|-----------|-----------|
| Koopprijs | Invoer gebruiker |
| Notariskosten | €2.500 |
| Overdrachtsbelasting | 2% |
| Verbouwingskosten | Invoer gebruiker |
| Makelaarskosten | Invoer gebruiker |
| Inspectiekosten | €750 |
| Overige kosten | Invoer gebruiker |

**Sessie Flow:**

```
1. ACTIEF (Real-time)
   └─ Elk groepslid gaat direct naar de kostenberekening
   └─ Leden passen percentages live aan
   └─ Wijzigingen direct zichtbaar voor iedereen
   └─ Online aanwezigheid wordt bijgehouden

2. BEVESTIGING
   └─ Leden klikken "Bevestigen" om percentage te vergrendelen
   └─ Status: aanpassen → bevestigd

3. AUTO-VOLTOOIING
   └─ Wanneer ALLE leden bevestigd EN totaal = 100%
   └─ Sessie wordt automatisch vergrendeld
   └─ Automatische doorverwijzing naar contractpagina
```

### 5. Contractgeneratie

- Automatisch gegenereerd HTML/PDF contract op basis van onderhandelingsresultaat
- Toont volledige kostenuitsplitsing per lid
- Bevat handtekeningregels voor juridische binding
- Klaar voor notarisproces

---

## Technische Werking

### Architectuur Overzicht

| Laag | Technologie |
|------|-------------|
| Framework | Next.js 15 + App Router |
| Taal | TypeScript (strict mode) |
| Database | PostgreSQL + Drizzle ORM |
| Authenticatie | Supabase Auth |
| Real-time | Supabase Realtime + SSE |
| Styling | Tailwind CSS + Radix UI |
| Grafieken | Recharts |
| Validatie | Zod |

### Database Schema

| Tabel | Doel |
|-------|------|
| `profiles` | Gebruikersdata (uitbreiding Supabase auth) |
| `buyingGroups` | Groepsentiteit met budget/locatie |
| `groupMembers` | Lidmaatschap + eigendomspercentage |
| `groupInvitations` | E-mail uitnodigingen |
| `groupJoinRequests` | QR/link verzoeken |
| `properties` | Woningaanbiedingen |
| `groupProperties` | Opgeslagen woningen per groep |
| `costCalculations` | Kostenuitsplitsing per sessie |
| `negotiationSessions` | Real-time sessiestatus |
| `memberSessionParticipation` | Per-lid onderhandelingsstatus |

### Real-time Onderhandeling - Technisch

**Hybride aanpak:** Supabase Realtime + Custom SSE

```
Componenten:
├── components/cost-calculation-page-client.tsx  → Hoofdinterface
├── lib/realtime/use-realtime-session.ts         → Supabase channel hook
└── api/realtime-sessions/[sessionId]/route.ts   → Database persistentie

Supabase Channel: session:{groupId}-{propertyId}

Events:
├── percentage-update  → Lid past percentage aan
├── status-change      → Lid bevestigt/ontgrendelt
└── session-completed  → Sessie automatisch voltooid
```

**Broadcast payload voorbeeld:**
```json
{
  "type": "percentage-update",
  "userId": "abc123",
  "percentage": 35,
  "timestamp": "2026-01-11T14:30:00Z"
}
```

### Contractgeneratie - Technisch

**Endpoint:** `/api/groups/[groupId]/properties/[propertyId]/contract/pdf`

**Proces:**
1. Ophalen vergrendelde onderhandelingssessie
2. Alle kostencomponenten uit `costCalculations` halen
3. Lidpercentages uit `memberSessionParticipation` ophalen
4. Investeringsbedrag per lid berekenen
5. HTML contract genereren met:
   - Woningdetails
   - Volledige kostenuitsplitsing
   - Investeringstabel per lid
   - Handtekeningregels
6. Retourneren als downloadbare PDF/HTML

---

## Demo Structuur

### Tijdlijn (10 minuten)

| Tijd | Onderdeel | Duur | Actie |
|------|-----------|------|-------|
| 0:00 | Introductie | 1 min | Platform concept uitleggen |
| 1:00 | Dashboard Tour | 1 min | Hoofdinterface tonen |
| 2:00 | Groep & Uitnodiging | 2 min | QR-code demo |
| 4:00 | Woningen Verkennen | 1 min | Woning opslaan bij groep |
| 5:00 | **Kostenberekening** | 3 min | Real-time onderhandeling (WOW moment) |
| 8:00 | Contract | 1 min | Automatisch gegenereerd contract tonen |
| 9:00 | Afsluiting & Vragen | 1 min | Samenvatting en Q&A |

---

### Gedetailleerd Demo Script

#### Fase 1: Introductie (0:00 - 1:00)

**Wat te zeggen:**
> "MoveIn is een platform dat groepen mensen helpt om samen een woning te kopen.
> We lossen drie grote problemen op: de complexiteit van groepsaankopen,
> gebrek aan transparantie bij kostenverdeling, en het ontbreken van
> gestandaardiseerde contracten."

**Wat te tonen:**
- Landing page (indien beschikbaar)
- Of direct naar dashboard met uitleg

---

#### Fase 2: Dashboard Tour (1:00 - 2:00)

**Wat te zeggen:**
> "Dit is het dashboard waar gebruikers hun groepen en activiteiten zien.
> Je ziet hier een overzicht van actieve groepen, recente activiteit,
> en acties die aandacht vereisen."

**Wat te tonen:**
- Dashboard hoofdpagina
- Groepsoverzicht
- Snelle statistieken

**Navigatie:** `/dashboard`

---

#### Fase 3: Groep & Uitnodiging (2:00 - 4:00)

**Wat te zeggen:**
> "Laten we kijken hoe je een groep beheert en nieuwe leden uitnodigt.
> We hebben drie manieren: e-mail, QR-code, of een deellink.
> Ik laat nu de QR-code zien - dit is ideaal voor fysieke bijeenkomsten."

**Wat te tonen:**
1. Groepsdetailpagina openen
2. "Lid uitnodigen" knop klikken
3. QR-code popover tonen
4. (Optioneel) Met telefoon scannen om flow te demonstreren

**Navigatie:** `/groups/[groupId]` → Uitnodigingspopover

**Tip:** Heb een tweede apparaat (telefoon) klaar om QR te scannen

---

#### Fase 4: Woningen Verkennen (4:00 - 5:00)

**Wat te zeggen:**
> "Hier bladeren groepsleden door beschikbare woningen.
> Je kunt woningen opslaan bij je groep, notities toevoegen,
> en een beoordeling geven. Dit helpt bij het maken van een gezamenlijke keuze."

**Wat te tonen:**
1. Woningenlijst openen
2. Woningdetails bekijken
3. Woning opslaan bij groep
4. Notitie en beoordeling toevoegen

**Navigatie:** `/properties` → `/properties/[id]`

---

#### Fase 5: Kostenberekening - HET WOW MOMENT (5:00 - 8:00)

> **Dit is het belangrijkste deel van de demo!**

**Setup:** Open TWEE browservensters naast elkaar (verschillende gebruikers)

**Wat te zeggen:**
> "Nu komt het meest innovatieve deel. Stel je voor: de groep heeft een woning
> gekozen en wil de kosten verdelen. In plaats van eindeloos e-mailen of vergaderen,
> onderhandelen ze hier live over hun investeringspercentage."

**Wat te tonen:**

**Stap 1 - Kosten invoeren (30 sec)**
- Kostenberekeningspagina openen
- Koopprijs en andere kosten tonen
- Laten zien hoe totaal automatisch berekend wordt

**Stap 2 - Real-time onderhandeling (2 min)**
- In venster 1: Percentage aanpassen (bijv. 40%)
- In venster 2: Tonen dat dit DIRECT zichtbaar is
- Herhaal met venster 2: Percentage aanpassen (bijv. 35%)
- In venster 1: Tonen dat dit DIRECT zichtbaar is

**Wat te zeggen tijdens aanpassen:**
> "Kijk, zodra ik hier het percentage aanpas, ziet het andere groepslid
> dit onmiddellijk. Geen vertraging, geen refresh nodig.
> Dit is echte real-time synchronisatie."

**Stap 3 - Bevestiging (30 sec)**
- In venster 1: "Bevestigen" klikken
- In venster 2: Tonen dat status verandert naar "bevestigd"
- Uitleggen dat sessie automatisch voltooit bij 100%

**Navigatie:** `/groups/[groupId]/properties/[propertyId]/cost-calculation`

---

#### Fase 6: Contract (8:00 - 9:00)

**Wat te zeggen:**
> "Zodra alle leden hebben bevestigd en het totaal 100% is,
> genereert het systeem automatisch een contract. Dit bevat alle kosten,
> de verdeling per persoon, en handtekeningregels.
> Dit kan direct naar de notaris."

**Wat te tonen:**
1. Contractpagina openen
2. Kostenuitsplitsing per lid tonen
3. "Download PDF" knop klikken
4. Gegenereerd contract tonen

**Navigatie:** `/groups/[groupId]/properties/[propertyId]/contract`

---

#### Fase 7: Afsluiting (9:00 - 10:00)

**Wat te zeggen:**
> "Samengevat: MoveIn maakt groepsaankopen transparant, efficiënt en juridisch
> waterdicht. Van groepsvorming tot ondertekend contract - alles op één platform.
> Zijn er vragen?"

---

## Voorbereiding Checklist

### Dag voor de Demo

- [ ] **Testaccounts aanmaken** - Minimaal 2 accounts voor real-time demo
- [ ] **Testgroep aanmaken** - Met beide accounts als lid
- [ ] **Testwoning toevoegen** - Met realistische gegevens
- [ ] **Kostenberekening voorbereiden** - Sessie klaar om te starten
- [ ] **Browservensters instellen** - Twee vensters naast elkaar
- [ ] **Incognito/privémodus** - Voor tweede account
- [ ] **Internetverbinding testen** - Real-time vereist stabiele verbinding

### Vlak voor de Demo

- [ ] **Beide accounts ingelogd** - In aparte browservensters
- [ ] **Navigatie getest** - Alle pagina's laden correct
- [ ] **Real-time getest** - Wijzigingen synchroniseren
- [ ] **Scherm delen voorbereid** - Presentatiesoftware getest
- [ ] **Backup plan** - Screenshots klaar voor als iets faalt

### Hardware

- [ ] **Laptop** - Voldoende batterij of oplader
- [ ] **Tweede scherm** (optioneel) - Voor eigen notities
- [ ] **Telefoon** (optioneel) - Voor QR-code demo
- [ ] **Stabiele wifi** - Of mobiele hotspot als backup

---

## Veelgestelde Vragen

### Functioneel

**V: Hoe wordt bepaald wie eigenaar wordt?**
> A: De persoon die de groep aanmaakt wordt automatisch eigenaar. Eigenaarschap kan niet worden overgedragen.

**V: Wat gebeurt er als het totaal niet op 100% komt?**
> A: De sessie kan niet worden voltooid. Leden moeten hun percentages aanpassen tot het totaal exact 100% is.

**V: Is het contract juridisch bindend?**
> A: Het contract is ontworpen als basis voor de notaris. De uiteindelijke juridische binding vindt plaats bij de notaris.

**V: Kunnen leden hun bevestiging intrekken?**
> A: Ja, zolang de sessie nog niet is voltooid kunnen leden hun percentage ontgrendelen en aanpassen.

### Technisch

**V: Hoe werkt de real-time synchronisatie?**
> A: We gebruiken Supabase Realtime met WebSocket-verbindingen. Elke sessie heeft een eigen channel waarop alle updates worden gebroadcast.

**V: Wat gebeurt er bij verbindingsverlies?**
> A: Alle wijzigingen worden ook in de database opgeslagen. Bij opnieuw verbinden wordt de laatste status geladen.

**V: Hoeveel gebruikers kunnen tegelijk onderhandelen?**
> A: Technisch onbeperkt, maar praktisch adviseren we maximaal 10 leden per groep voor overzichtelijkheid.

**V: Welke database gebruiken jullie?**
> A: PostgreSQL met Drizzle ORM voor type-safe queries en migraties.

### Business

**V: Hoe verdient het platform geld?**
> A: [Vul in op basis van businessmodel - bijv. commissie, abonnement, notarispartnership]

**V: Wat is de doelmarkt?**
> A: De Nederlandse vastgoedmarkt, specifiek gericht op starters en groepen die samen willen kopen.

---

## Troubleshooting tijdens Demo

| Probleem | Oplossing |
|----------|-----------|
| Real-time werkt niet | Refresh beide vensters, controleer console op errors |
| Pagina laadt niet | Check internetverbinding, probeer andere browser |
| Login faalt | Gebruik backup account, of toon screenshots |
| Contract genereert niet | Zorg dat sessie volledig is (100%, alle bevestigd) |
| QR-code scant niet | Gebruik deellink als alternatief |

---

## Contact & Support

- **Repository:** [GitHub Link]
- **Ontwikkelaar:** Vlad Afanasev
- **Tech Stack Documentatie:** Zie `CLAUDE.md` in root directory

---

*Laatste update: Januari 2026*
