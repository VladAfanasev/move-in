/**
 * Test data fixtures for consistent test data across test suites
 */

export const TEST_PROPERTIES = {
  amsterdam_apartment: {
    title: "Modern Amsterdam Apartment",
    description: "Beautiful 3-bedroom apartment in the heart of Amsterdam",
    price: "550000",
    location: "Amsterdam Center",
    bedrooms: 3,
    bathrooms: 2,
    property_type: "apartment",
    square_meters: 120,
    year_built: 2019,
    energy_label: "A",
    has_parking: true,
    has_garden: false,
    has_balcony: true,
  },
  rotterdam_house: {
    title: "Rotterdam Family House",
    description: "Spacious family house with garden in Rotterdam",
    price: "425000",
    location: "Rotterdam Noord",
    bedrooms: 4,
    bathrooms: 3,
    property_type: "house",
    square_meters: 180,
    year_built: 2015,
    energy_label: "B",
    has_parking: true,
    has_garden: true,
    has_balcony: false,
  },
  utrecht_studio: {
    title: "Cozy Utrecht Studio",
    description: "Perfect starter home near Utrecht Central",
    price: "275000",
    location: "Utrecht",
    bedrooms: 1,
    bathrooms: 1,
    property_type: "apartment",
    square_meters: 45,
    year_built: 2021,
    energy_label: "A+",
    has_parking: false,
    has_garden: false,
    has_balcony: true,
  },
} as const

export const TEST_GROUPS = {
  amsterdam_buyers: {
    name: "Amsterdam Young Professionals",
    description: "Group of young professionals looking to buy in Amsterdam",
    target_budget: "600000",
    target_location: "Amsterdam",
    max_members: 4,
  },
  family_group: {
    name: "Growing Families Group",
    description: "Families looking for spacious homes with gardens",
    target_budget: "500000",
    target_location: "Rotterdam",
    max_members: 3,
  },
  investor_group: {
    name: "Property Investors Alliance",
    description: "Experienced investors pooling resources for investment properties",
    target_budget: "1000000",
    target_location: "Multiple cities",
    max_members: 6,
  },
} as const

export const TEST_COST_CALCULATIONS = {
  standard_apartment: {
    purchase_price: 550000,
    notary_fees: 2500,
    transfer_tax: 11000, // 2% of purchase price
    renovation_costs: 25000,
    broker_fees: 8000,
    inspection_costs: 750,
    other_costs: 2000,
  },
  budget_property: {
    purchase_price: 275000,
    notary_fees: 2000,
    transfer_tax: 5500,
    renovation_costs: 15000,
    broker_fees: 4000,
    inspection_costs: 500,
    other_costs: 1000,
  },
  luxury_property: {
    purchase_price: 850000,
    notary_fees: 3500,
    transfer_tax: 17000,
    renovation_costs: 50000,
    broker_fees: 15000,
    inspection_costs: 1000,
    other_costs: 5000,
  },
} as const

export const TEST_MEMBER_INTENTIONS = {
  balanced_group: [
    {
      user_id: "user1",
      desired_percentage: 25,
      max_percentage: 35,
      status: "intentions_set" as const,
    },
    {
      user_id: "user2",
      desired_percentage: 25,
      max_percentage: 30,
      status: "intentions_set" as const,
    },
    {
      user_id: "user3",
      desired_percentage: 25,
      max_percentage: 40,
      status: "intentions_set" as const,
    },
    {
      user_id: "user4",
      desired_percentage: 25,
      max_percentage: 30,
      status: "intentions_set" as const,
    },
  ],
  unbalanced_group: [
    {
      user_id: "user1",
      desired_percentage: 50,
      max_percentage: 60,
      status: "intentions_set" as const,
    },
    {
      user_id: "user2",
      desired_percentage: 30,
      max_percentage: 40,
      status: "intentions_set" as const,
    },
    {
      user_id: "user3",
      desired_percentage: 20,
      max_percentage: 25,
      status: "intentions_set" as const,
    },
  ],
  incomplete_group: [
    {
      user_id: "user1",
      desired_percentage: 40,
      max_percentage: 50,
      status: "intentions_set" as const,
    },
    {
      user_id: "user2",
      status: "not_set" as const,
    },
    {
      user_id: "user3",
      desired_percentage: 30,
      max_percentage: 35,
      status: "intentions_set" as const,
    },
  ],
} as const

export const TEST_NEGOTIATION_SESSIONS = {
  active_session: {
    status: "active" as const,
    total_percentage: 95,
    participants: [
      {
        user_id: "user1",
        current_percentage: 35,
        intended_percentage: 30,
        status: "adjusting" as const,
        is_online: true,
      },
      {
        user_id: "user2",
        current_percentage: 30,
        intended_percentage: 30,
        status: "confirmed" as const,
        is_online: true,
      },
      {
        user_id: "user3",
        current_percentage: 30,
        intended_percentage: 35,
        status: "adjusting" as const,
        is_online: false,
      },
    ],
  },
  completed_session: {
    status: "completed" as const,
    total_percentage: 100,
    participants: [
      {
        user_id: "user1",
        current_percentage: 35,
        intended_percentage: 35,
        status: "locked" as const,
        is_online: false,
      },
      {
        user_id: "user2",
        current_percentage: 30,
        intended_percentage: 30,
        status: "locked" as const,
        is_online: false,
      },
      {
        user_id: "user3",
        current_percentage: 35,
        intended_percentage: 35,
        status: "locked" as const,
        is_online: false,
      },
    ],
  },
} as const

/**
 * Helper function to get test data with dynamic IDs
 */
export function getTestData() {
  return {
    properties: TEST_PROPERTIES,
    groups: TEST_GROUPS,
    costCalculations: TEST_COST_CALCULATIONS,
    memberIntentions: TEST_MEMBER_INTENTIONS,
    negotiationSessions: TEST_NEGOTIATION_SESSIONS,
  }
}

/**
 * Generate realistic test email addresses
 */
export function generateTestEmail(prefix: string): string {
  const timestamp = Date.now()
  return `${prefix}.${timestamp}@movein-test.example.com`
}

/**
 * Generate random test data
 */
export function generateRandomProperty() {
  const cities = ["Amsterdam", "Rotterdam", "Utrecht", "The Hague", "Eindhoven"]
  const types = ["apartment", "house", "studio"]
  const labels = ["A+", "A", "B", "C"]

  return {
    title: `Test Property ${Math.floor(Math.random() * 1000)}`,
    description: "Automatically generated test property",
    price: (Math.floor(Math.random() * 500000) + 200000).toString(),
    location: cities[Math.floor(Math.random() * cities.length)],
    bedrooms: Math.floor(Math.random() * 5) + 1,
    bathrooms: Math.floor(Math.random() * 3) + 1,
    property_type: types[Math.floor(Math.random() * types.length)],
    square_meters: Math.floor(Math.random() * 150) + 50,
    year_built: Math.floor(Math.random() * 30) + 1995,
    energy_label: labels[Math.floor(Math.random() * labels.length)],
  }
}

export function generateRandomGroup() {
  const adjectives = ["Young", "Experienced", "Professional", "Family", "Investment"]
  const nouns = ["Buyers", "Group", "Alliance", "Collective", "Partners"]

  return {
    name: `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${nouns[Math.floor(Math.random() * nouns.length)]}`,
    description: "Automatically generated test group",
    target_budget: (Math.floor(Math.random() * 600000) + 300000).toString(),
    target_location: "Amsterdam",
    max_members: Math.floor(Math.random() * 4) + 3,
  }
}
