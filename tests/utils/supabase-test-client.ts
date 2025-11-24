/**
 * Test utilities for Supabase database testing
 *
 * This file provides utilities for testing with Supabase cloud database.
 * It includes options for both isolated test database and production database testing.
 */

import type { SupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@supabase/supabase-js"

// Test database configuration
interface TestDatabaseConfig {
  url: string
  serviceRoleKey: string
  anonKey: string
  testSchema?: string
}

/**
 * Creates a Supabase client for testing purposes
 * This should use a separate test database or test schema
 */
export function createTestClient(config?: Partial<TestDatabaseConfig>): SupabaseClient {
  const testConfig: TestDatabaseConfig = {
    url: config?.url || process.env.TEST_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    serviceRoleKey:
      config?.serviceRoleKey ||
      process.env.TEST_SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      "",
    anonKey:
      config?.anonKey ||
      process.env.TEST_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      "",
    testSchema: config?.testSchema || "test_schema",
  }

  if (!(testConfig.url && testConfig.serviceRoleKey)) {
    throw new Error(
      "Missing test database configuration. Please set TEST_SUPABASE_URL and TEST_SUPABASE_SERVICE_ROLE_KEY environment variables.",
    )
  }

  // Create client with service role key for full database access during tests
  return createClient(testConfig.url, testConfig.serviceRoleKey)
}

/**
 * Test user credentials for testing authentication flows
 */
export const TEST_USERS = {
  user1: {
    email: "test.user1@movein-test.com",
    password: "TestPassword123!",
    profile: {
      fullName: "Test User One",
      email: "test.user1@movein-test.com",
    },
  },
  user2: {
    email: "test.user2@movein-test.com",
    password: "TestPassword123!",
    profile: {
      fullName: "Test User Two",
      email: "test.user2@movein-test.com",
    },
  },
  admin: {
    email: "admin@movein-test.com",
    password: "AdminPassword123!",
    profile: {
      fullName: "Admin User",
      email: "admin@movein-test.com",
    },
  },
} as const

/**
 * Database test utilities
 */
export class DatabaseTestUtils {
  private client: SupabaseClient

  constructor(client: SupabaseClient) {
    this.client = client
  }

  /**
   * Clean up test data after tests
   * WARNING: This will delete data! Only use with test database
   */
  async cleanup() {
    const tables = [
      "member_session_participation",
      "negotiation_sessions",
      "member_proposals",
      "cost_calculations",
      "group_properties",
      "group_members",
      "buying_groups",
      "properties",
      "profiles",
    ]

    // Delete in reverse order to handle foreign key constraints
    for (const table of tables.reverse()) {
      const { error } = await this.client
        .from(table)
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000") // Delete all except system records

      if (error && !error.message.includes("does not exist")) {
        console.warn(`Failed to cleanup table ${table}:`, error.message)
      }
    }
  }

  /**
   * Create test user and profile
   */
  async createTestUser(userData: {
    email: string
    password: string
    profile: {
      fullName: string
      email: string
    }
  }) {
    // Create auth user
    const { data: authData, error: authError } = await this.client.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
    })

    if (authError) {
      throw new Error(`Failed to create test user: ${authError.message}`)
    }

    // Create profile
    const { data: profile, error: profileError } = await this.client
      .from("profiles")
      .insert({
        id: authData.user.id,
        full_name: userData.profile.fullName,
        email: userData.profile.email,
      })
      .select()
      .single()

    if (profileError) {
      throw new Error(`Failed to create test profile: ${profileError.message}`)
    }

    return { user: authData.user, profile }
  }

  /**
   * Create test buying group
   */
  async createTestGroup(
    creatorId: string,
    groupData?: Partial<{
      name: string
      description: string
      targetBudget: string
      targetLocation: string
      maxMembers: number
    }>,
  ) {
    const defaultData = {
      name: "Test Group",
      description: "A test buying group",
      targetBudget: "500000",
      targetLocation: "Amsterdam",
      maxMembers: 5,
      ...groupData,
    }

    const { data: group, error: groupError } = await this.client
      .from("buying_groups")
      .insert(defaultData)
      .select()
      .single()

    if (groupError) {
      throw new Error(`Failed to create test group: ${groupError.message}`)
    }

    // Add creator as owner
    const { error: memberError } = await this.client.from("group_members").insert({
      group_id: group.id,
      user_id: creatorId,
      role: "owner",
      status: "active",
      contribution_amount: "100000",
      ownership_percentage: "100",
    })

    if (memberError) {
      throw new Error(`Failed to add group owner: ${memberError.message}`)
    }

    return group
  }

  /**
   * Create test property
   */
  async createTestProperty(
    propertyData?: Partial<{
      title: string
      description: string
      price: string
      location: string
      bedrooms: number
      bathrooms: number
    }>,
  ) {
    const defaultData = {
      title: "Test Property",
      description: "A test property for automated testing",
      price: "450000",
      location: "Amsterdam",
      bedrooms: 3,
      bathrooms: 2,
      property_type: "apartment",
      square_meters: 100,
      year_built: 2020,
      energy_label: "A",
      ...propertyData,
    }

    const { data: property, error } = await this.client
      .from("properties")
      .insert(defaultData)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create test property: ${error.message}`)
    }

    return property
  }

  /**
   * Seed database with test data
   */
  async seedTestData() {
    const testUsers = await Promise.all([
      this.createTestUser(TEST_USERS.user1),
      this.createTestUser(TEST_USERS.user2),
      this.createTestUser(TEST_USERS.admin),
    ])

    const testGroup = await this.createTestGroup(testUsers[0].user.id, {
      name: "Amsterdam Buyers Group",
      description: "Group for buying property in Amsterdam",
      targetBudget: "600000",
    })

    const testProperty = await this.createTestProperty({
      title: "Beautiful Amsterdam Apartment",
      price: "550000",
      location: "Amsterdam Center",
      bedrooms: 3,
    })

    return {
      users: testUsers,
      group: testGroup,
      property: testProperty,
    }
  }
}

/**
 * Helper function to run tests with database setup and teardown
 */
export async function withTestDatabase<T>(
  testFn: (client: SupabaseClient, utils: DatabaseTestUtils) => Promise<T>,
): Promise<T> {
  const client = createTestClient()
  const utils = new DatabaseTestUtils(client)

  try {
    // Setup: Clean existing data
    await utils.cleanup()

    // Run the test
    const result = await testFn(client, utils)

    return result
  } finally {
    // Teardown: Clean up after test
    await utils.cleanup()
  }
}
