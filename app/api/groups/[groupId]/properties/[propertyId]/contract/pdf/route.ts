import { and, eq } from "drizzle-orm"
import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/db/client"
import { costCalculations } from "@/db/schema/cost-calculations"
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

    // Calculate total costs correctly by summing all individual costs
    const purchasePrice = Number(property.price)
    const notaryFees = Number(calculation[0].notaryFees) || 2500
    const transferTax = purchasePrice * 0.02 // 2% transfer tax in Netherlands
    const renovationCosts = Number(calculation[0].renovationCosts) || 0
    const brokerFees = Number(calculation[0].brokerFees) || 0
    const inspectionCosts = Number(calculation[0].inspectionCosts) || 750
    const otherCosts = Number(calculation[0].otherCosts) || 0

    const totalCosts =
      purchasePrice +
      notaryFees +
      transferTax +
      renovationCosts +
      brokerFees +
      inspectionCosts +
      otherCosts

    const formatCurrency = (amount: string | number) => {
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
            * { box-sizing: border-box; }
            body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              padding: 60px 0; 
              color: #333; 
              line-height: 1.6; 
              max-width: 800px;
              margin: 0 auto;
            }
            .header { 
              text-align: center; 
              margin-bottom: 40px; 
              padding-bottom: 20px; 
              border-bottom: 2px solid #ccc; 
            }
            .header h1 { margin: 0 0 10px 0; font-size: 28px; }
            .header h2 { margin: 0 0 15px 0; font-size: 20px; color: #555; }
            .header p { margin: 0; font-size: 14px; }
            .section { margin-bottom: 30px; padding: 0 20px; }
            .participants { margin-top: 20px; }
            .participant { margin-bottom: 15px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
            .signature-line { border-bottom: 1px solid #000; width: 200px; display: inline-block; margin-left: 20px; }
            .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #666; padding: 0 20px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .amount { font-weight: bold; }
            h3 { color: #2563eb; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
            @media print {
              body { padding: 40px 60px; }
              .section { padding: 0 10px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>INVESTERINGSCONTRACT</h1>
            <h2>${property.address}, ${property.zipCode} ${property.city}</h2>
            <p><strong>Datum:</strong> ${formatDate(new Date())}</p>
          </div>

          <div class="section">
            <h3>1. EIGENDOM INFORMATIE</h3>
            <table>
              <tr><td><strong>Adres</strong></td><td>${property.address}, ${property.zipCode} ${property.city}</td></tr>
              <tr><td><strong>Vraagprijs</strong></td><td>${formatCurrency(purchasePrice)}</td></tr>
              <tr><td><strong>Totale Investering</strong></td><td>${formatCurrency(totalCosts)}</td></tr>
              <tr><td><strong>Type</strong></td><td>${property.propertyType === "house" ? "Huis" : "Appartement"}</td></tr>
              <tr><td><strong>Kamers</strong></td><td>${property.bedrooms || "N/A"}</td></tr>
              <tr><td><strong>Oppervlakte</strong></td><td>${property.squareFeet || "N/A"} m²</td></tr>
            </table>
          </div>

          <div class="section">
            <h3>2. KOSTEN OVERZICHT</h3>
            <table>
              <tr><td><strong>Koopprijs</strong></td><td>${formatCurrency(purchasePrice)}</td></tr>
              <tr><td><strong>Notaris kosten</strong></td><td>${formatCurrency(notaryFees)}</td></tr>
              <tr><td><strong>Overdrachtsbelasting (2%)</strong></td><td>${formatCurrency(transferTax)}</td></tr>
              <tr><td><strong>Renovatie kosten</strong></td><td>${formatCurrency(renovationCosts)}</td></tr>
              <tr><td><strong>Makelaar kosten</strong></td><td>${formatCurrency(brokerFees)}</td></tr>
              <tr><td><strong>Inspectie kosten</strong></td><td>${formatCurrency(inspectionCosts)}</td></tr>
              <tr><td><strong>Overige kosten</strong></td><td>${formatCurrency(otherCosts)}</td></tr>
              <tr style="font-weight: bold; background-color: #f2f2f2;"><td><strong>TOTAAL</strong></td><td>${formatCurrency(totalCosts)}</td></tr>
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
                    const amount = Math.round((totalCosts * participant.currentPercentage) / 100)
                    return `
                    <tr>
                      <td>${member?.fullName || member?.email?.split("@")[0] || "Onbekend"}</td>
                      <td>${participant.currentPercentage.toFixed(1)}%</td>
                      <td class="amount">${formatCurrency(amount)}</td>
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
            </ul>
          </div>

          <div class="section">
            <h3>5. ONDERTEKENING</h3>
            <p>Door ondertekening hieronder bevestigen alle partijen hun akkoord met de bovenstaande voorwaarden en investeringsbedragen.</p>
            
            <div class="participants">
              ${participants
                .map(participant => {
                  const member = members.find(m => m.userId === participant.userId)
                  const amount = Math.round((totalCosts * participant.currentPercentage) / 100)
                  return `
                  <div class="participant">
                    <p><strong>Naam:</strong> ${member?.fullName || member?.email?.split("@")[0] || "Onbekend"}</p>
                    <p><strong>Investering:</strong> ${formatCurrency(amount)} (${participant.currentPercentage.toFixed(1)}%)</p>
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
