import "dotenv/config"
import { eq } from "drizzle-orm"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import { properties } from "./schema"

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required")
}

const client = postgres(connectionString)
const db = drizzle(client)

// Betrouwbare Unsplash afbeeldingen voor Nederlandse woningen
const houseImages = [
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1598228723793-52759bba239c?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1599427303058-f04cbcf4756f?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1576941089067-2de3c901e126?w=800&h=600&fit=crop",
]

const apartmentImages = [
  "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&h=600&fit=crop",
]

const interiorImages = [
  "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1600573472591-ee6c563aaec9?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800&h=600&fit=crop",
]

function getRandomElements<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, Math.min(count, array.length))
}

function generateImagesForProperty(propertyType: string, index: number): string[] {
  const mainImages = propertyType === "house" ? houseImages : apartmentImages

  // Eerste afbeelding is altijd de hoofdafbeelding (exterieur)
  const mainImage = mainImages[index % mainImages.length]

  // 2-4 extra interieur afbeeldingen
  const extraCount = Math.floor(Math.random() * 3) + 2
  const extraImages = getRandomElements(interiorImages, extraCount)

  // 1-2 extra exterieur afbeeldingen
  const exteriorCount = Math.floor(Math.random() * 2) + 1
  const otherExterior = getRandomElements(
    mainImages.filter(img => img !== mainImage),
    exteriorCount,
  )

  return [mainImage, ...otherExterior, ...extraImages]
}

async function updateImages() {
  console.log("🖼️  Woningafbeeldingen bijwerken...")

  try {
    // Alle woningen ophalen
    const allProperties = await db.select().from(properties)

    console.log(`📊 ${allProperties.length} woningen gevonden`)

    // Elke woning updaten met nieuwe afbeeldingen
    for (let i = 0; i < allProperties.length; i++) {
      const property = allProperties[i]
      const newImages = generateImagesForProperty(property.propertyType || "apartment", i)

      await db.update(properties).set({ images: newImages }).where(eq(properties.id, property.id))

      console.log(`✅ ${i + 1}/${allProperties.length}: ${property.address} bijgewerkt`)
    }

    console.log("\n🎉 Alle afbeeldingen succesvol bijgewerkt!")
  } catch (error) {
    console.error("❌ Fout bij bijwerken:", error)
    throw error
  } finally {
    await client.end()
  }
}

updateImages().catch(error => {
  console.error(error)
  process.exit(1)
})
