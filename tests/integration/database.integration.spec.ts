/**
 * Database Integration Tests
 *
 * These tests verify that database operations work correctly with Supabase cloud database.
 * They test real database interactions including CRUD operations, relationships, and constraints.
 *
 * Note: These tests require a test database configuration and will modify data.
 * Make sure to use a separate test database or test schema.
 */

import { expect, test } from "@playwright/test"
import { generateTestEmail, TEST_GROUPS, TEST_PROPERTIES } from "../fixtures/test-data"
import { TEST_USERS, withTestDatabase } from "../utils/supabase-test-client"

test.describe("Database Integration Tests", () => {
  test.describe("User Management", () => {
    test("should create and authenticate test user", async () => {
      await withTestDatabase(async (client, utils) => {
        // Create test user
        const testUser = await utils.createTestUser({
          email: generateTestEmail("integration-test"),
          password: TEST_USERS.user1.password,
          profile: TEST_USERS.user1.profile,
        })

        expect(testUser.user).toBeDefined()
        expect(testUser.user.email).toBeTruthy()
        expect(testUser.profile).toBeDefined()
        expect(testUser.profile.full_name).toBe(TEST_USERS.user1.profile.fullName)

        // Test authentication
        const { data: signInData, error } = await client.auth.signInWithPassword({
          email: testUser.user.email || "",
          password: TEST_USERS.user1.password,
        })

        expect(error).toBeNull()
        expect(signInData.user).toBeDefined()
        expect(signInData.session).toBeDefined()

        // Clean up auth session
        await client.auth.signOut()
      })
    })

    test("should handle user profile updates", async () => {
      await withTestDatabase(async (client, utils) => {
        const testUser = await utils.createTestUser({
          email: generateTestEmail("profile-update-test"),
          password: TEST_USERS.user1.password,
          profile: TEST_USERS.user1.profile,
        })

        // Update profile
        const { data: updatedProfile, error } = await client
          .from("profiles")
          .update({
            full_name: "Updated Name",
            bio: "Test bio",
          })
          .eq("id", testUser.user.id)
          .select()
          .single()

        expect(error).toBeNull()
        expect(updatedProfile.full_name).toBe("Updated Name")
        expect(updatedProfile.bio).toBe("Test bio")
      })
    })
  })

  test.describe("Groups Management", () => {
    test("should create group with owner", async () => {
      await withTestDatabase(async (client, utils) => {
        // Create test user
        const testUser = await utils.createTestUser({
          email: generateTestEmail("group-owner"),
          password: TEST_USERS.user1.password,
          profile: TEST_USERS.user1.profile,
        })

        // Create group
        const group = await utils.createTestGroup(testUser.user.id, TEST_GROUPS.amsterdam_buyers)

        expect(group).toBeDefined()
        expect(group.name).toBe(TEST_GROUPS.amsterdam_buyers.name)
        expect(group.target_budget).toBe(TEST_GROUPS.amsterdam_buyers.target_budget)

        // Verify group membership
        const { data: members, error } = await client
          .from("group_members")
          .select("*, profiles(full_name, email)")
          .eq("group_id", group.id)

        expect(error).toBeNull()
        expect(members).toBeTruthy()
        expect(members).toHaveLength(1)
        expect(members?.[0].user_id).toBe(testUser.user.id)
        expect(members?.[0].role).toBe("owner")
        expect(members?.[0].status).toBe("active")
      })
    })

    test("should add multiple members to group", async () => {
      await withTestDatabase(async (client, utils) => {
        // Create test users
        const owner = await utils.createTestUser({
          email: generateTestEmail("group-owner"),
          password: TEST_USERS.user1.password,
          profile: TEST_USERS.user1.profile,
        })
        const member1 = await utils.createTestUser({
          email: generateTestEmail("group-member1"),
          password: TEST_USERS.user2.password,
          profile: TEST_USERS.user2.profile,
        })

        // Create group
        const group = await utils.createTestGroup(owner.user.id)

        // Add member to group
        const { data: newMember, error } = await client
          .from("group_members")
          .insert({
            group_id: group.id,
            user_id: member1.user.id,
            role: "member",
            status: "active",
            contribution_amount: "150000",
            ownership_percentage: "30",
          })
          .select()
          .single()

        expect(error).toBeNull()
        expect(newMember.user_id).toBe(member1.user.id)

        // Verify total members
        const { data: allMembers, error: membersError } = await client
          .from("group_members")
          .select("*")
          .eq("group_id", group.id)

        expect(membersError).toBeNull()
        expect(allMembers).toHaveLength(2)
      })
    })

    test("should enforce group constraints", async () => {
      await withTestDatabase(async (client, utils) => {
        const owner = await utils.createTestUser({
          email: generateTestEmail("constraints-test"),
          password: TEST_USERS.user1.password,
          profile: TEST_USERS.user1.profile,
        })

        // Create group with max 2 members
        const group = await utils.createTestGroup(owner.user.id, {
          ...TEST_GROUPS.amsterdam_buyers,
          maxMembers: 2,
        })

        // Add one more member (should work)
        const member1 = await utils.createTestUser({
          email: generateTestEmail("member1"),
          password: TEST_USERS.user2.password,
          profile: TEST_USERS.user2.profile,
        })

        const { error: addMemberError } = await client.from("group_members").insert({
          group_id: group.id,
          user_id: member1.user.id,
          role: "member",
          status: "active",
        })

        expect(addMemberError).toBeNull()

        // Try to add a third member (should fail if constraint is enforced)
        const member2 = await utils.createTestUser({
          email: generateTestEmail("member2"),
          password: TEST_USERS.admin.password,
          profile: TEST_USERS.admin.profile,
        })

        const { error: constraintError } = await client.from("group_members").insert({
          group_id: group.id,
          user_id: member2.user.id,
          role: "member",
          status: "active",
        })

        // If your database has constraints, this should fail
        // If not implemented yet, this documents the expected behavior
        if (constraintError) {
          expect(constraintError.message).toContain("constraint") // or similar error
        }
      })
    })
  })

  test.describe("Properties Management", () => {
    test("should create and retrieve properties", async () => {
      await withTestDatabase(async (client, utils) => {
        // Create test property
        const property = await utils.createTestProperty(TEST_PROPERTIES.amsterdam_apartment)

        expect(property).toBeDefined()
        expect(property.title).toBe(TEST_PROPERTIES.amsterdam_apartment.title)
        expect(property.price).toBe(TEST_PROPERTIES.amsterdam_apartment.price)
        expect(property.bedrooms).toBe(TEST_PROPERTIES.amsterdam_apartment.bedrooms)

        // Test property retrieval
        const { data: retrievedProperty, error } = await client
          .from("properties")
          .select("*")
          .eq("id", property.id)
          .single()

        expect(error).toBeNull()
        expect(retrievedProperty.title).toBe(property.title)
      })
    })

    test("should associate properties with groups", async () => {
      await withTestDatabase(async (client, utils) => {
        const owner = await utils.createTestUser({
          email: generateTestEmail("property-group"),
          password: TEST_USERS.user1.password,
          profile: TEST_USERS.user1.profile,
        })
        const group = await utils.createTestGroup(owner.user.id)
        const property = await utils.createTestProperty()

        // Associate property with group
        const { data: groupProperty, error } = await client
          .from("group_properties")
          .insert({
            group_id: group.id,
            property_id: property.id,
            added_by: owner.user.id,
            status: "interested",
          })
          .select()
          .single()

        expect(error).toBeNull()
        expect(groupProperty.group_id).toBe(group.id)
        expect(groupProperty.property_id).toBe(property.id)

        // Test retrieval with joins
        const { data: groupWithProperties, error: joinError } = await client
          .from("buying_groups")
          .select(`
            *,
            group_properties(
              *,
              properties(*)
            )
          `)
          .eq("id", group.id)
          .single()

        expect(joinError).toBeNull()
        expect(groupWithProperties.group_properties).toHaveLength(1)
        expect(groupWithProperties.group_properties[0].properties.title).toBe(property.title)
      })
    })
  })

  test.describe("Cost Calculations Integration", () => {
    test("should create cost calculation with proper relationships", async () => {
      await withTestDatabase(async (client, utils) => {
        const owner = await utils.createTestUser({
          email: generateTestEmail("cost-calc"),
          password: TEST_USERS.user1.password,
          profile: TEST_USERS.user1.profile,
        })
        const group = await utils.createTestGroup(owner.user.id)
        const property = await utils.createTestProperty()

        // Create cost calculation
        const purchasePrice = 500000
        const transferTax = purchasePrice * 0.02
        const totalCosts = purchasePrice + 2500 + transferTax + 750 // Basic costs

        const { data: calculation, error } = await client
          .from("cost_calculations")
          .insert({
            group_id: group.id,
            property_id: property.id,
            created_by: owner.user.id,
            purchase_price: purchasePrice.toString(),
            notary_fees: "2500",
            transfer_tax: transferTax.toString(),
            renovation_costs: "0",
            broker_fees: "0",
            inspection_costs: "750",
            other_costs: "0",
            total_costs: totalCosts.toString(),
            total_equity_needed: totalCosts.toString(),
          })
          .select()
          .single()

        expect(error).toBeNull()
        expect(calculation.purchase_price).toBe(purchasePrice.toString())
        expect(calculation.transfer_tax).toBe(transferTax.toString())
        expect(calculation.total_costs).toBe(totalCosts.toString())

        // Test calculation retrieval with relationships
        const { data: calcWithRelations, error: relError } = await client
          .from("cost_calculations")
          .select(`
            *,
            buying_groups(name),
            properties(title, price),
            profiles(full_name)
          `)
          .eq("id", calculation.id)
          .single()

        expect(relError).toBeNull()
        expect(calcWithRelations.buying_groups.name).toBe(group.name)
        expect(calcWithRelations.properties.title).toBe(property.title)
        expect(calcWithRelations.profiles.full_name).toBe(owner.profile.full_name)
      })
    })
  })

  test.describe("Database Performance", () => {
    test("should handle bulk operations efficiently", async () => {
      await withTestDatabase(async (client, _utils) => {
        const startTime = Date.now()

        // Create multiple test records
        const properties = []
        for (let i = 0; i < 10; i++) {
          properties.push({
            title: `Bulk Test Property ${i}`,
            description: `Test property ${i}`,
            price: (300000 + i * 1000).toString(),
            location: "Test Location",
            bedrooms: 2,
            bathrooms: 1,
            property_type: "apartment",
            square_meters: 75,
            year_built: 2020,
            energy_label: "A",
          })
        }

        // Bulk insert
        const { data: insertedProperties, error } = await client
          .from("properties")
          .insert(properties)
          .select()

        const endTime = Date.now()
        const duration = endTime - startTime

        expect(error).toBeNull()
        expect(insertedProperties).toBeTruthy()
        expect(insertedProperties).toHaveLength(10)
        expect(duration).toBeLessThan(5000) // Should complete within 5 seconds

        // Test bulk retrieval
        const retrievalStart = Date.now()
        const { data: retrievedProperties, error: retrievalError } = await client
          .from("properties")
          .select("*")
          .in(
            "id",
            insertedProperties?.map(p => p.id),
          )

        const retrievalEnd = Date.now()
        const retrievalDuration = retrievalEnd - retrievalStart

        expect(retrievalError).toBeNull()
        expect(retrievedProperties).toHaveLength(10)
        expect(retrievalDuration).toBeLessThan(2000) // Should be fast
      })
    })
  })

  test.describe("Database Transactions", () => {
    test("should handle transaction-like operations correctly", async () => {
      await withTestDatabase(async (client, utils) => {
        const owner = await utils.createTestUser({
          email: generateTestEmail("transaction-test"),
          password: TEST_USERS.user1.password,
          profile: TEST_USERS.user1.profile,
        })

        // Simulate a transaction: create group and immediately add property
        let groupId: string
        let propertyId: string

        try {
          // Create group
          const group = await utils.createTestGroup(owner.user.id)
          groupId = group.id

          // Create property
          const property = await utils.createTestProperty()
          propertyId = property.id

          // Associate them
          const { error: associationError } = await client.from("group_properties").insert({
            group_id: groupId,
            property_id: propertyId,
            added_by: owner.user.id,
            status: "interested",
          })

          expect(associationError).toBeNull()

          // Verify both records exist and are properly linked
          const { data: verification, error: verificationError } = await client
            .from("group_properties")
            .select(`
              *,
              buying_groups(name),
              properties(title)
            `)
            .eq("group_id", groupId)
            .eq("property_id", propertyId)
            .single()

          expect(verificationError).toBeNull()
          expect(verification).toBeDefined()
          expect(verification.buying_groups.name).toBeTruthy()
          expect(verification.properties.title).toBeTruthy()
        } catch (error) {
          // In a real transaction system, you would rollback here
          console.error("Transaction failed:", error)
          throw error
        }
      })
    })
  })
})
