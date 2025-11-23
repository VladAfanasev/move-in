# Supabase Cloud Database Testing Guide

This document provides detailed guidance on testing with Supabase cloud database, including setup, best practices, and implementation strategies for the MoveIn application.

## Table of Contents

- [Overview](#overview)
- [Testing Strategies](#testing-strategies)
- [Setup Instructions](#setup-instructions)
- [Implementation Examples](#implementation-examples)
- [Best Practices](#best-practices)
- [Limitations and Considerations](#limitations-and-considerations)
- [Troubleshooting](#troubleshooting)

## Overview

Testing with Supabase cloud database involves several considerations:

1. **Data isolation**: Ensuring tests don't interfere with production data
2. **Performance**: Managing network latency and connection costs
3. **Authentication**: Testing auth flows with real Supabase auth
4. **Real-time features**: Testing subscriptions and live updates
5. **Database constraints**: Verifying RLS policies and constraints work correctly

## Testing Strategies

### Strategy 1: Separate Test Project (Recommended)

**Description**: Create a dedicated Supabase project exclusively for testing.

**Pros:**
- ✅ Complete isolation from production
- ✅ Identical environment to production
- ✅ Can test RLS policies, triggers, and functions
- ✅ Full control over schema modifications
- ✅ Can reset/destroy data without consequences

**Cons:**
- ❌ Additional project to manage
- ❌ Potential additional costs
- ❌ Network latency in CI/CD
- ❌ Need to sync schema changes

**Setup:**
1. Create new Supabase project for testing
2. Apply same schema as production
3. Configure test environment variables
4. Set up automated schema synchronization

```bash
# Environment variables for test project
TEST_SUPABASE_URL=https://your-test-project-id.supabase.co
TEST_SUPABASE_ANON_KEY=your_test_anon_key
TEST_SUPABASE_SERVICE_ROLE_KEY=your_test_service_role_key
```

### Strategy 2: Test Schema in Production Database

**Description**: Use a separate schema within the production database.

**Pros:**
- ✅ Single database to manage
- ✅ Reduced costs
- ✅ Faster setup
- ✅ Shared configuration

**Cons:**
- ❌ Risk of affecting production data
- ❌ Shared database resources
- ❌ Complex cleanup procedures
- ❌ RLS policies may interfere

**Setup:**
```sql
-- Create test schema
CREATE SCHEMA IF NOT EXISTS test_schema;

-- Grant permissions
GRANT USAGE ON SCHEMA test_schema TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA test_schema TO authenticated;

-- Create test tables (example)
CREATE TABLE test_schema.profiles (LIKE public.profiles INCLUDING ALL);
CREATE TABLE test_schema.buying_groups (LIKE public.buying_groups INCLUDING ALL);
-- ... repeat for all tables
```

### Strategy 3: Local Supabase with Cloud Testing

**Description**: Use local Supabase for development, cloud for integration tests.

**Pros:**
- ✅ Fast local development
- ✅ Cloud integration validation
- ✅ Best of both worlds
- ✅ Cost-effective

**Cons:**
- ❌ Complex setup
- ❌ Potential environment differences
- ❌ Requires Docker for local setup

**Setup:**
```bash
# Install Supabase CLI
npm install -g supabase

# Initialize local project
supabase init

# Start local services
supabase start

# Link to cloud project for testing
supabase link --project-ref your-project-id
```

## Setup Instructions

### Option A: Separate Test Project (Recommended)

#### 1. Create Test Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create new project (e.g., "movein-test")
3. Wait for project initialization

#### 2. Setup Schema

Apply the same schema as your production database:

```bash
# Export schema from production
pg_dump --schema-only "postgresql://[prod-connection-string]" > schema.sql

# Apply to test database
psql "postgresql://[test-connection-string]" < schema.sql
```

Or use Supabase migrations:

```bash
# Generate migration from existing schema
supabase db diff --schema public > supabase/migrations/001_initial_schema.sql

# Apply to test database
supabase db push --db-url "postgresql://[test-connection-string]"
```

#### 3. Configure Environment

Create `.env.test.local`:

```bash
# Test Database Configuration
TEST_SUPABASE_URL=https://your-test-project.supabase.co
TEST_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
TEST_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Original production keys (for comparison/fallback)
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 4. Setup Row Level Security (RLS)

Apply same RLS policies as production:

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE buying_groups ENABLE ROW LEVEL SECURITY;
-- ... repeat for all tables

-- Apply policies (example)
CREATE POLICY "Users can view own profile" ON profiles 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles 
  FOR UPDATE USING (auth.uid() = id);

-- Group policies
CREATE POLICY "Group members can view group" ON buying_groups
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_id = id 
      AND user_id = auth.uid() 
      AND status = 'active'
    )
  );
```

### Option B: Test Schema Approach

#### 1. Create Test Schema

```sql
-- Create test schema
CREATE SCHEMA test_schema;

-- Set default privileges
ALTER DEFAULT PRIVILEGES IN SCHEMA test_schema 
  GRANT ALL ON TABLES TO authenticated;
```

#### 2. Create Test Tables

```sql
-- Copy table structures to test schema
CREATE TABLE test_schema.profiles (LIKE public.profiles INCLUDING ALL);
CREATE TABLE test_schema.buying_groups (LIKE public.buying_groups INCLUDING ALL);
CREATE TABLE test_schema.group_members (LIKE public.group_members INCLUDING ALL);
CREATE TABLE test_schema.properties (LIKE public.properties INCLUDING ALL);
CREATE TABLE test_schema.group_properties (LIKE public.group_properties INCLUDING ALL);
CREATE TABLE test_schema.cost_calculations (LIKE public.cost_calculations INCLUDING ALL);
CREATE TABLE test_schema.member_proposals (LIKE public.member_proposals INCLUDING ALL);
CREATE TABLE test_schema.negotiation_sessions (LIKE public.negotiation_sessions INCLUDING ALL);
CREATE TABLE test_schema.member_session_participation (LIKE public.member_session_participation INCLUDING ALL);

-- Copy constraints and indexes
-- Note: Foreign keys need to reference test schema tables
ALTER TABLE test_schema.group_members 
  ADD CONSTRAINT fk_group_members_group 
  FOREIGN KEY (group_id) REFERENCES test_schema.buying_groups(id);

ALTER TABLE test_schema.group_members 
  ADD CONSTRAINT fk_group_members_user 
  FOREIGN KEY (user_id) REFERENCES test_schema.profiles(id);

-- Continue for all foreign keys...
```

## Implementation Examples

### Test Client Configuration

```typescript
// tests/utils/supabase-test-client.ts
import { createClient } from "@supabase/supabase-js"

export function createTestClient() {
  const isTestSchemaMode = process.env.TEST_MODE === "schema"
  
  if (isTestSchemaMode) {
    // Use production database with test schema
    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // Configure to use test schema
    return configureForTestSchema(client)
  } else {
    // Use separate test project
    return createClient(
      process.env.TEST_SUPABASE_URL!,
      process.env.TEST_SUPABASE_SERVICE_ROLE_KEY!
    )
  }
}

function configureForTestSchema(client: any) {
  // Override table references to use test schema
  const originalFrom = client.from.bind(client)
  client.from = (table: string) => {
    return originalFrom(`test_schema.${table}`)
  }
  return client
}
```

### User Authentication Testing

```typescript
// Test user creation and authentication
export class AuthTestUtils {
  constructor(private client: SupabaseClient) {}

  async createTestUser(userData: {
    email: string
    password: string
    profile?: any
  }) {
    // Create auth user
    const { data: authData, error: authError } = await this.client.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true, // Skip email confirmation
      phone_confirm: true  // Skip phone confirmation
    })

    if (authError) {
      throw new Error(`Failed to create test user: ${authError.message}`)
    }

    // Create profile if provided
    if (userData.profile) {
      const { error: profileError } = await this.client
        .from("profiles")
        .insert({
          id: authData.user.id,
          ...userData.profile
        })

      if (profileError) {
        throw new Error(`Failed to create profile: ${profileError.message}`)
      }
    }

    return authData.user
  }

  async signInTestUser(email: string, password: string) {
    const { data, error } = await this.client.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      throw new Error(`Failed to sign in: ${error.message}`)
    }

    return data
  }

  async cleanupAuthUsers() {
    // List all users (requires service role key)
    const { data: { users }, error } = await this.client.auth.admin.listUsers()

    if (error) {
      console.warn("Failed to list users for cleanup:", error.message)
      return
    }

    // Delete test users (be careful with this!)
    for (const user of users) {
      if (user.email?.includes("test") || user.email?.includes("movein-test")) {
        await this.client.auth.admin.deleteUser(user.id)
      }
    }
  }
}
```

### Real-time Features Testing

```typescript
// Test real-time subscriptions
test("should receive real-time updates", async () => {
  await withTestDatabase(async (client, utils) => {
    const testUser = await utils.createTestUser(TEST_USERS.user1)
    const group = await utils.createTestGroup(testUser.id)

    // Setup subscription
    const updates: any[] = []
    const subscription = client
      .channel("test-group-updates")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "buying_groups",
          filter: `id=eq.${group.id}`
        },
        (payload) => {
          updates.push(payload)
        }
      )
      .subscribe()

    // Wait for subscription to be ready
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Make a change
    await client
      .from("buying_groups")
      .update({ name: "Updated Group Name" })
      .eq("id", group.id)

    // Wait for real-time update
    await new Promise(resolve => setTimeout(resolve, 2000))

    expect(updates).toHaveLength(1)
    expect(updates[0].new.name).toBe("Updated Group Name")

    // Cleanup
    subscription.unsubscribe()
  })
})
```

### RLS Policy Testing

```typescript
// Test Row Level Security policies
test("should enforce RLS policies", async () => {
  await withTestDatabase(async (client, utils) => {
    // Create two users
    const user1 = await utils.createTestUser({
      email: "user1@test.com",
      password: "password123"
    })
    const user2 = await utils.createTestUser({
      email: "user2@test.com", 
      password: "password123"
    })

    // Create group as user1
    const group = await utils.createTestGroup(user1.id)

    // Sign in as user1
    await client.auth.signInWithPassword({
      email: "user1@test.com",
      password: "password123"
    })

    // Should be able to see own group
    const { data: ownGroups, error: ownError } = await client
      .from("buying_groups")
      .select("*")
      .eq("id", group.id)

    expect(ownError).toBeNull()
    expect(ownGroups).toHaveLength(1)

    // Sign in as user2
    await client.auth.signInWithPassword({
      email: "user2@test.com",
      password: "password123"
    })

    // Should NOT be able to see user1's group
    const { data: otherGroups, error: otherError } = await client
      .from("buying_groups")
      .select("*")
      .eq("id", group.id)

    expect(otherError).toBeNull()
    expect(otherGroups).toHaveLength(0) // RLS should filter this out
  })
})
```

### Database Function Testing

```typescript
// Test custom database functions
test("should execute database functions correctly", async () => {
  await withTestDatabase(async (client, utils) => {
    // Test custom function (example: calculate group total investment)
    const { data, error } = await client.rpc("calculate_group_total_investment", {
      group_id: "test-group-id"
    })

    expect(error).toBeNull()
    expect(typeof data).toBe("number")
    expect(data).toBeGreaterThanOrEqual(0)
  })
})
```

## Best Practices

### 1. Data Isolation

```typescript
// Always clean up after tests
test.afterEach(async () => {
  await testUtils.cleanup()
})

// Use unique identifiers
const uniqueEmail = `test.${Date.now()}@example.com`
```

### 2. Performance Optimization

```typescript
// Use transactions when possible
const { data, error } = await client.rpc("begin_transaction")
try {
  // Perform multiple operations
  await client.from("table1").insert(data1)
  await client.from("table2").insert(data2)
  await client.rpc("commit_transaction")
} catch (error) {
  await client.rpc("rollback_transaction")
  throw error
}
```

### 3. Error Handling

```typescript
// Comprehensive error checking
async function safeDbOperation<T>(operation: () => Promise<{ data: T, error: any }>) {
  const { data, error } = await operation()
  
  if (error) {
    console.error("Database operation failed:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    })
    throw new Error(`Database operation failed: ${error.message}`)
  }
  
  return data
}
```

### 4. Test Data Management

```typescript
// Use factories for consistent test data
class TestDataFactory {
  static createUser(overrides = {}) {
    return {
      email: `user.${Date.now()}@test.com`,
      password: "TestPassword123!",
      profile: {
        full_name: "Test User",
        ...overrides
      }
    }
  }

  static createGroup(creatorId: string, overrides = {}) {
    return {
      name: `Test Group ${Date.now()}`,
      description: "Test group",
      target_budget: "500000",
      created_by: creatorId,
      ...overrides
    }
  }
}
```

## Limitations and Considerations

### Supabase Cloud Limitations

1. **Rate Limiting**: API requests are rate limited
2. **Connection Limits**: Database connections are limited
3. **Function Timeouts**: Edge functions have execution limits
4. **Storage Costs**: Test data and logs count toward storage
5. **Network Latency**: Cloud database access adds latency

### Testing Considerations

1. **Test Data Volume**: Large test datasets may be slow
2. **Concurrent Tests**: Multiple tests accessing database simultaneously
3. **Schema Migrations**: Keeping test schema in sync with production
4. **Auth State**: Managing authentication state across tests
5. **Real-time Subscriptions**: Proper cleanup of subscriptions

### Cost Management

1. **Optimize Queries**: Use efficient queries to reduce compute costs
2. **Cleanup Data**: Remove test data regularly
3. **Monitor Usage**: Track database usage in test project
4. **Use Appropriate Tier**: Consider Supabase pricing tiers
5. **Batch Operations**: Group operations to reduce API calls

## Troubleshooting

### Common Issues

#### Connection Errors
```typescript
// Check connection
const { data, error } = await client
  .from("profiles")
  .select("count")
  .single()

if (error) {
  console.error("Connection failed:", error)
  // Check environment variables
  // Verify project URL and keys
  // Check network connectivity
}
```

#### Authentication Issues
```typescript
// Verify auth configuration
const { data: { session } } = await client.auth.getSession()
console.log("Current session:", session)

// Check if service role key is being used correctly
// Verify user has proper permissions
```

#### RLS Policy Conflicts
```sql
-- Debug RLS policies
SELECT * FROM pg_policies WHERE tablename = 'your_table';

-- Test policies with different auth contexts
SET role authenticated;
-- Run query to test as authenticated user

SET role anon;  
-- Run query to test as anonymous user
```

#### Performance Issues
```typescript
// Monitor query performance
console.time("database-operation")
const result = await client.from("table").select("*")
console.timeEnd("database-operation")

// Use explain to analyze query plans
const { data } = await client.rpc("explain_query", { 
  query: "SELECT * FROM profiles WHERE..." 
})
```

### Debug Logging

```typescript
// Enable debug logging
const client = createClient(url, key, {
  auth: {
    debug: true
  },
  global: {
    headers: {
      'x-client-info': 'test-suite'
    }
  }
})

// Log all database operations
client.from = new Proxy(client.from.bind(client), {
  apply(target, thisArg, args) {
    console.log(`Database query: ${args[0]}`)
    return target.apply(thisArg, args)
  }
})
```

### Monitoring and Metrics

```typescript
// Track test database usage
class TestMetrics {
  private static queries = 0
  private static startTime = Date.now()

  static incrementQuery() {
    this.queries++
  }

  static getStats() {
    return {
      totalQueries: this.queries,
      duration: Date.now() - this.startTime,
      queriesPerSecond: this.queries / ((Date.now() - this.startTime) / 1000)
    }
  }
}
```

## Conclusion

Testing with Supabase cloud database requires careful consideration of data isolation, performance, and cost factors. The recommended approach is to use a separate test project for complete isolation while maintaining realistic testing conditions.

Key takeaways:
- **Always use separate test database** to avoid production data issues
- **Implement proper cleanup procedures** to maintain test isolation  
- **Test RLS policies and constraints** to ensure security works correctly
- **Monitor performance and costs** to keep testing efficient
- **Use realistic test data** that matches production scenarios

This setup enables comprehensive testing of database operations while maintaining the benefits of Supabase's cloud platform.