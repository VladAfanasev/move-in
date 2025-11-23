import { and, eq } from "drizzle-orm"
import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/db/client"
import {
  costCalculations,
  memberSessionParticipation,
  negotiationSessions,
} from "@/db/schema/cost-calculations"
import { createClient } from "@/lib/supabase/server"

// Simple PDF generation - in production, you'd use a proper PDF library like puppeteer or jsPDF
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ groupId: string; propertyId: string }> },
) {
  try {
    const { groupId, propertyId } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all necessary data
    const { getGroupById, getGroupMembers } = await import("@/lib/groups")
    const { getPropertyById } = await import("@/lib/properties")

    const [group, members, property] = await Promise.all([
      getGroupById(groupId),
      getGroupMembers(groupId),
      getPropertyById(propertyId),
    ])

    if (!(group && property)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    // Get cost calculation
    const calculation = await db
      .select()
      .from(costCalculations)
      .where(
        and(eq(costCalculations.groupId, groupId), eq(costCalculations.propertyId, propertyId)),
      )
      .limit(1)

    if (calculation.length === 0) {
      return NextResponse.json({ error: "No cost calculation found" }, { status: 404 })
    }

    // Get completed session using the same logic as contract page
    const { getCompletedNegotiationSession } = await import("@/lib/cost-calculations")
    const session = await getCompletedNegotiationSession(calculation[0].id)

    if (!session) {
      return NextResponse.json({ error: "No completed session found" }, { status: 404 })
    }

    // Use participants from the session (already processed)
    const participants = session.participants

    const formatCurrency = (amount: string) => {
      const num = Number(amount)
      return new Intl.NumberFormat("nl-NL", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(num)
    }

    const formatDate = (date: Date) => {
      return date.toLocaleDateString("nl-NL", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    }

    // Create HTML content for the contract
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="nl">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Investeringscontract - ${property.address}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; color: #333; line-height: 1.6; }
            .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #ccc; padding-bottom: 20px; }
            .section { margin-bottom: 30px; }
            .participants { margin-top: 20px; }
            .participant { margin-bottom: 15px; padding: 10px; border: 1px solid #ddd; }
            .signature-line { border-bottom: 1px solid #000; width: 200px; display: inline-block; margin-left: 20px; }
            .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #666; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .amount { font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>INVESTERINGSCONTRACT</h1>
            <h2>${property.address}, ${property.zipCode} ${property.city}</h2>
            <p><strong>Groep:</strong> ${group.name}</p>
            <p><strong>Datum:</strong> ${formatDate(new Date())}</p>
          </div>

          <div class="section">
            <h3>1. EIGENDOM INFORMATIE</h3>
            <table>
              <tr><td><strong>Adres</strong></td><td>${property.address}, ${property.zipCode} ${property.city}</td></tr>
              <tr><td><strong>Vraagprijs</strong></td><td>${formatCurrency(property.price)}</td></tr>
              <tr><td><strong>Totale Investering</strong></td><td>${formatCurrency(calculation[0].totalCosts)}</td></tr>
              <tr><td><strong>Type</strong></td><td>${property.propertyType === "house" ? "Huis" : "Appartement"}</td></tr>
              <tr><td><strong>Kamers</strong></td><td>${property.bedrooms || "N/A"}</td></tr>
              <tr><td><strong>Oppervlakte</strong></td><td>${property.squareFeet || "N/A"} m²</td></tr>
            </table>
          </div>

          <div class="section">
            <h3>2. KOSTEN OVERZICHT</h3>
            <table>
              <tr><td><strong>Aankoopprijs</strong></td><td>${formatCurrency(calculation[0].purchasePrice)}</td></tr>
              <tr><td><strong>Notaris kosten</strong></td><td>${formatCurrency(calculation[0].notaryFees || "0")}</td></tr>
              <tr><td><strong>Overdrachtsbelasting</strong></td><td>${formatCurrency(calculation[0].transferTax || "0")}</td></tr>
              <tr><td><strong>Renovatie kosten</strong></td><td>${formatCurrency(calculation[0].renovationCosts || "0")}</td></tr>
              <tr><td><strong>Makelaar kosten</strong></td><td>${formatCurrency(calculation[0].brokerFees || "0")}</td></tr>
              <tr><td><strong>Inspectie kosten</strong></td><td>${formatCurrency(calculation[0].inspectionCosts || "0")}</td></tr>
              <tr><td><strong>Overige kosten</strong></td><td>${formatCurrency(calculation[0].otherCosts || "0")}</td></tr>
              <tr style="font-weight: bold; background-color: #f2f2f2;"><td><strong>TOTAAL</strong></td><td>${formatCurrency(calculation[0].totalCosts)}</td></tr>
            </table>
          </div>

          <div class="section">
            <h3>3. INVESTERING VERDELING</h3>
            <table>
              <thead>
                <tr>
                  <th>Naam</th>
                  <th>Percentage</th>
                  <th>Bedrag</th>
                </tr>
              </thead>
              <tbody>
                ${participants
                  .map(participant => {
                    const member = members.find(m => m.userId === participant.userId)
                    const amount = Math.round(
                      (Number(calculation[0].totalCosts) * participant.currentPercentage) / 100,
                    )
                    return `
                    <tr>
                      <td>${member?.fullName || member?.email?.split("@")[0] || "Onbekend"}</td>
                      <td>${participant.currentPercentage.toFixed(1)}%</td>
                      <td class="amount">${formatCurrency(amount.toString())}</td>
                    </tr>
                  `
                  })
                  .join("")}
              </tbody>
            </table>
          </div>

          <div class="section">
            <h3>4. VOORWAARDEN</h3>
            <p>Door ondertekening van dit contract komen alle partijen overeen tot de volgende voorwaarden:</p>
            <ul>
              <li>Elke investeerder draagt bij volgens het overeengekomen percentage</li>
              <li>Eigendomsrechten worden verdeeld volgens de investeringspercentages</li>
              <li>Alle belangrijke beslissingen betreffende het eigendom vereisen meerderheidsgoedkeuring</li>
              <li>Verkoop van het eigendom vereist unanime goedkeuring van alle investeerders</li>
              <li>Dit contract wordt beheerst door Nederlands recht</li>
            </ul>
          </div>

          <div class="section">
            <h3>5. ONDERTEKENING</h3>
            <p>Door ondertekening hieronder bevestigen alle partijen hun akkoord met de bovenstaande voorwaarden en investeringsbedragen.</p>
            
            <div class="participants">
              ${participants
                .map(participant => {
                  const member = members.find(m => m.userId === participant.userId)
                  const amount = Math.round(
                    (Number(calculation[0].totalCosts) * participant.currentPercentage) / 100,
                  )
                  return `
                  <div class="participant">
                    <p><strong>Naam:</strong> ${member?.fullName || member?.email?.split("@")[0] || "Onbekend"}</p>
                    <p><strong>Investering:</strong> ${formatCurrency(amount.toString())} (${participant.currentPercentage.toFixed(1)}%)</p>
                    <p><strong>Handtekening:</strong> <span class="signature-line"></span> <strong>Datum:</strong> <span class="signature-line"></span></p>
                  </div>
                `
                })
                .join("")}
            </div>
          </div>

          <div class="footer">
            <p>Dit document is automatisch gegenereerd op ${formatDate(new Date())}.</p>
            <p>Voor vragen kunt u contact opnemen met de groepsbeheerder.</p>
          </div>
        </body>
      </html>
    `

    // In a real application, you would use a library like puppeteer to generate a proper PDF
    // For now, return the HTML content with PDF headers so the browser can save it as PDF
    return new Response(htmlContent, {
      status: 200,
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `attachment; filename="contract-${property.address.replace(/\s+/g, "_")}-${formatDate(new Date())}.html"`,
      },
    })
  } catch (error) {
    console.error("Error generating contract PDF:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
