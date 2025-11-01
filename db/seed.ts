import "dotenv/config"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import { profiles, properties } from "./schema"

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required")
}

const client = postgres(connectionString)
const db = drizzle(client)

const sampleProfiles = [
  {
    id: "550e8400-e29b-41d4-a716-446655440001",
    email: "jan.de.vries@example.nl",
    fullName: "Jan de Vries",
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440002",
    email: "emma.jansen@example.nl",
    fullName: "Emma Jansen",
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440003",
    email: "pieter.van.den.berg@example.nl",
    fullName: "Pieter van den Berg",
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440004",
    email: "sophie.mulder@example.nl",
    fullName: "Sophie Mulder",
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440005",
    email: "lucas.bakker@example.nl",
    fullName: "Lucas Bakker",
  },
]

const dutchCities = [
  {
    city: "Amsterdam",
    province: "Noord-Holland",
    postalCodes: ["1011", "1012", "1013", "1015", "1016", "1017"],
  },
  {
    city: "Rotterdam",
    province: "Zuid-Holland",
    postalCodes: ["3011", "3012", "3013", "3014", "3015", "3016"],
  },
  {
    city: "Den Haag",
    province: "Zuid-Holland",
    postalCodes: ["2511", "2512", "2513", "2514", "2515", "2516"],
  },
  {
    city: "Utrecht",
    province: "Utrecht",
    postalCodes: ["3511", "3512", "3513", "3514", "3515", "3516"],
  },
  {
    city: "Eindhoven",
    province: "Noord-Brabant",
    postalCodes: ["5611", "5612", "5613", "5614", "5615", "5616"],
  },
  {
    city: "Groningen",
    province: "Groningen",
    postalCodes: ["9711", "9712", "9713", "9714", "9715", "9716"],
  },
  {
    city: "Tilburg",
    province: "Noord-Brabant",
    postalCodes: ["5011", "5012", "5013", "5014", "5015", "5016"],
  },
  {
    city: "Almere",
    province: "Flevoland",
    postalCodes: ["1311", "1312", "1313", "1314", "1315", "1316"],
  },
  {
    city: "Breda",
    province: "Noord-Brabant",
    postalCodes: ["4811", "4812", "4813", "4814", "4815", "4816"],
  },
  {
    city: "Nijmegen",
    province: "Gelderland",
    postalCodes: ["6511", "6512", "6513", "6514", "6515", "6516"],
  },
]

const dutchStreetNames = [
  "Nieuwmarkt",
  "Prinsengracht",
  "Herengracht",
  "Keizersgracht",
  "Damrak",
  "Kalverstraat",
  "Rokin",
  "Spui",
  "Leidseplein",
  "Museumplein",
  "Vondelpark",
  "Jordaan",
  "De Pijp",
  "Oosterdok",
  "Westerpark",
  "Oosterpark",
  "Sarphatipark",
  "Beatrixpark",
  "Zuiderpark",
  "Boerenwetering",
  "Singel",
  "Reguliersgracht",
  "Lauriergracht",
  "Egelantiersgracht",
  "Bloemgracht",
  "Tuinstraat",
  "Rozengracht",
  "Elandsgracht",
  "Lijnbaansgracht",
  "Marnixstraat",
  "Raadhuisstraat",
  "Hartenstraat",
  "Gasthuismolensteeg",
  "Begijnhof",
]

const features = [
  "Parketvloer",
  "Moderne keuken",
  "Inbouwapparatuur",
  "Inloopkast",
  "Tuin",
  "Open haard",
  "Balkon",
  "Garage",
  "Kelder",
  "Zolder",
  "Wasruimte",
  "Thuiskantoor",
  "Airconditioning",
  "Vloerverwarming",
  "Dakraam",
  "Erker",
  "Franse balkons",
  "Lift",
  "Concierge",
  "Fietsenberging",
]

const descriptions = [
  "Prachtige woning met uitzicht en moderne voorzieningen.",
  "Perfect gelegen in een rustige buurt met goede bereikbaarheid van het centrum.",
  "Ruim en licht met hoge plafonds en grote ramen.",
  "Recent gerenoveerd met hoogwaardige afwerking en inbouwapparatuur.",
  "Charmante woning met originele details en moderne updates.",
  "Toplocatie met wandelafstand tot restaurants, winkels en parken.",
  "Open indeling perfect voor ontvangst met naadloze binnen-buiten overgang.",
  "Rustige omgeving met aangelegde tuin en privé buitenruimte.",
  "Luxe wonen met conciërge service en premium voorzieningen.",
  "Instapklaar huis in uitstekende staat.",
]

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

function getRandomElements<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

function generateRandomProperty(index: number) {
  const cityData = getRandomElement(dutchCities)
  const postalCode = getRandomElement(cityData.postalCodes)
  const propertyType = getRandomElement(["house", "apartment"] as const)
  const listedBy = getRandomElement(sampleProfiles).id

  // Euro pricing: €150K - €1.2M for apartments, €250K - €2M for houses
  const basePrice =
    propertyType === "apartment"
      ? Math.floor(Math.random() * 1050000) + 150000 // €150K - €1.2M
      : Math.floor(Math.random() * 1750000) + 250000 // €250K - €2M

  const bedrooms = Math.floor(Math.random() * 5) + 1 // 1-5 bedrooms
  const bathrooms = Math.floor(Math.random() * 30) / 10 + 1 // 1.0 - 4.0
  const squareMeters =
    propertyType === "apartment"
      ? Math.floor(Math.random() * 120) + 40 // 40-160 m²
      : Math.floor(Math.random() * 200) + 80 // 80-280 m²

  // Only houses have lot size in Netherlands context
  const lotSize =
    propertyType === "house"
      ? Math.floor(Math.random() * 800) + 100 // 100-900 m²
      : null

  const yearBuilt = Math.floor(Math.random() * 70) + 1954 // 1954-2024

  const selectedFeatures = getRandomElements(features, Math.floor(Math.random() * 6) + 3)
  const imageCount = Math.floor(Math.random() * 8) + 3 // 3-10 images
  const images = Array.from(
    { length: imageCount },
    (_, i) => `https://picsum.photos/800/600?random=${index * 10 + i}`,
  )

  // Generate realistic Dutch address
  const streetName = getRandomElement(dutchStreetNames)
  const houseNumber = Math.floor(Math.random() * 299) + 1
  const addition = Math.random() > 0.8 ? getRandomElement(["A", "B", "C", "1", "2", "bis"]) : ""

  return {
    description: getRandomElement(descriptions),
    address: `${streetName} ${houseNumber}${addition}`,
    city: cityData.city,
    state: cityData.province,
    zipCode: `${postalCode} ${getRandomElement(["AA", "AB", "AC", "AD", "AE", "AF", "AG", "AH"])}`,
    country: "Nederland",
    price: basePrice.toString(),
    bedrooms,
    bathrooms: bathrooms.toString(),
    squareFeet: squareMeters, // Using square meters but keeping field name for compatibility
    lotSize: lotSize?.toString(),
    yearBuilt,
    propertyType,
    status: getRandomElement(["available", "in_option", "sold", "archived"] as const),
    images,
    features: selectedFeatures,
    metadata: {
      source: "seed",
      seedIndex: index,
      generatedAt: new Date().toISOString(),
      squareMeters: squareMeters,
      currency: "EUR",
    },
    listedBy,
  }
}

async function seed() {
  console.log("🌱 Starting database seed...")

  try {
    // First, insert sample profiles
    console.log("👥 Inserting sample profiles...")
    await db.insert(profiles).values(sampleProfiles).onConflictDoNothing()

    // Generate and insert 50 properties
    console.log("🏠 Generating 50 mock properties...")
    const mockProperties = Array.from({ length: 50 }, (_, i) => generateRandomProperty(i))

    console.log("💾 Inserting properties into database...")
    await db.insert(properties).values(mockProperties)

    console.log("✅ Seed completed successfully!")
    console.log(`📊 Inserted ${mockProperties.length} properties`)
  } catch (error) {
    console.error("❌ Seed failed:", error)
    throw error
  } finally {
    await client.end()
  }
}

if (require.main === module) {
  seed().catch(error => {
    console.error(error)
    process.exit(1)
  })
}
