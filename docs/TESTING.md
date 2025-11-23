# Testing Guide for MoveIn

This document provides comprehensive guidance on testing in the MoveIn application, including unit tests, E2E tests, and database integration tests using Playwright and Supabase.

## Table of Contents

- [Overview](#overview)
- [Test Structure](#test-structure)
- [Setup and Configuration](#setup-and-configuration)
- [Unit Testing](#unit-testing)
- [End-to-End Testing](#end-to-end-testing)
- [Database Integration Testing](#database-integration-testing)
- [Supabase Cloud Database Testing](#supabase-cloud-database-testing)
- [Running Tests](#running-tests)
- [Test Data Management](#test-data-management)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

The MoveIn application uses **Playwright** as the primary testing framework for both unit tests and end-to-end tests. This choice provides:

- **Unified Testing Framework**: One tool for all testing needs
- **Modern Browser Support**: Cross-browser testing capabilities
- **Component Testing**: Can test React components in isolation
- **API Testing**: Built-in support for API testing
- **Rich Debugging Tools**: Screenshots, videos, and trace files
- **Parallel Execution**: Fast test execution

### Test Types

1. **Unit Tests** (`*.unit.spec.ts`): Test individual functions and utilities
2. **E2E Tests** (`*.e2e.spec.ts`): Test complete user workflows
3. **Integration Tests** (`*.integration.spec.ts`): Test database operations and API interactions

## Test Structure

```
tests/
├── unit/                          # Unit tests for utilities and pure functions
│   ├── utils.unit.spec.ts
│   ├── avatar-utils.unit.spec.ts
│   └── cost-calculations.unit.spec.ts
├── e2e/                          # End-to-end user flow tests
│   ├── landing-page.e2e.spec.ts
│   ├── authentication.e2e.spec.ts
│   ├── dashboard-navigation.e2e.spec.ts
│   └── groups-flow.e2e.spec.ts
├── integration/                   # Database and API integration tests
│   └── database.integration.spec.ts
├── fixtures/                     # Test data and fixtures
│   └── test-data.ts
└── utils/                        # Test utilities and helpers
    └── supabase-test-client.ts
```

## Setup and Configuration

### Prerequisites

1. **Node.js** (>= 18)
2. **Bun** package manager
3. **Supabase account** and project
4. **Test database** (recommended: separate Supabase project for testing)

### Installation

```bash
# Install dependencies (already done if you followed main setup)
bun install

# Install Playwright browsers
bunx playwright install
```

### Environment Configuration

Create a `.env.test.local` file for test-specific environment variables:

```bash
# Test Database Configuration
TEST_SUPABASE_URL=https://your-test-project.supabase.co
TEST_SUPABASE_ANON_KEY=your_test_anon_key
TEST_SUPABASE_SERVICE_ROLE_KEY=your_test_service_role_key

# Optional: Use different database schema for tests
TEST_DATABASE_SCHEMA=test_schema
```

> **Important**: Always use a separate test database to avoid affecting production data.

### Playwright Configuration

The project includes a comprehensive Playwright configuration in `playwright.config.ts`:

- **Unit Tests**: Run with Chrome browser, pattern `*.unit.spec.ts`
- **E2E Tests**: Run across multiple browsers (Chrome, Firefox, Safari, Mobile)
- **Test Server**: Automatically starts development server at `http://localhost:3000`
- **Parallel Execution**: Enabled for faster test runs
- **Reporting**: HTML reports with screenshots and videos

## Unit Testing

Unit tests focus on testing individual functions, utilities, and business logic in isolation.

### Example: Testing Utility Functions

```typescript
import { test, expect } from "@playwright/test"
import { getInitials, getAvatarColor } from "@/lib/avatar-utils"

test.describe("avatar-utils.ts", () => {
  test("should return initials for full name", () => {
    expect(getInitials("John Doe")).toBe("JD")
    expect(getInitials("Jane Smith")).toBe("JS")
  })

  test("should return consistent colors for same userId", () => {
    const userId = "user123"
    const color1 = getAvatarColor(userId)
    const color2 = getAvatarColor(userId)
    expect(color1).toBe(color2)
  })
})
```

### What to Test

- **Pure functions**: Utilities that transform input to output
- **Business logic**: Calculation functions, validation logic
- **Edge cases**: Empty inputs, invalid data, boundary conditions
- **Error handling**: How functions handle unexpected inputs

### Unit Test Best Practices

1. **Test behavior, not implementation**: Focus on what the function does, not how
2. **Use descriptive test names**: Clearly state what is being tested
3. **Test edge cases**: Empty strings, null values, extreme numbers
4. **Keep tests isolated**: Each test should be independent
5. **Use meaningful assertions**: Test the actual business requirements

## End-to-End Testing

E2E tests verify complete user workflows from the browser perspective.

### Example: Authentication Flow

```typescript
import { test, expect } from "@playwright/test"

test.describe("Authentication E2E", () => {
  test("should display login form", async ({ page }) => {
    await page.goto("/login")
    
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
  })

  test("should validate email format", async ({ page }) => {
    await page.goto("/login")
    await page.getByLabel(/email/i).fill("invalid-email")
    await page.getByRole("button", { name: /sign in/i }).click()
    
    const emailInput = page.getByLabel(/email/i)
    const isInvalid = await emailInput.evaluate(el => !el.checkValidity())
    expect(isInvalid).toBe(true)
  })
})
```

### Key E2E Test Scenarios

1. **Landing Page**: Navigation, content display, responsiveness
2. **Authentication**: Login, registration, password validation
3. **Dashboard Navigation**: Sidebar, routing, mobile responsiveness
4. **Groups Workflow**: Create, join, manage groups
5. **Properties**: Browse, filter, save properties
6. **Cost Calculations**: Input validation, calculations display

### E2E Test Best Practices

1. **Use semantic selectors**: Prefer `getByRole`, `getByLabel` over CSS selectors
2. **Test user journeys**: Complete workflows, not just individual pages
3. **Handle async operations**: Use proper waiting strategies
4. **Test across devices**: Mobile, tablet, desktop viewports
5. **Mock external dependencies**: APIs, payments, third-party services

## Database Integration Testing

Integration tests verify database operations and data integrity with Supabase.

### Test Database Setup

For database testing, you need either:

1. **Separate Test Database**: Recommended approach
2. **Test Schema**: Use different schema in same database
3. **Local Supabase**: Run Supabase locally for testing

### Example: Database Operations

```typescript
import { withTestDatabase, DatabaseTestUtils } from "../utils/supabase-test-client"

test("should create group with owner", async () => {
  await withTestDatabase(async (client, utils) => {
    const testUser = await utils.createTestUser(TEST_USERS.user1)
    const group = await utils.createTestGroup(testUser.user.id)

    expect(group.name).toBe("Test Group")
    
    // Verify group membership
    const { data: members } = await client
      .from("group_members")
      .select("*")
      .eq("group_id", group.id)

    expect(members).toHaveLength(1)
    expect(members[0].role).toBe("owner")
  })
})
```

### Database Test Utilities

The `DatabaseTestUtils` class provides:

- **User Creation**: Create test users with profiles
- **Group Management**: Create groups with members
- **Property Management**: Create test properties
- **Data Cleanup**: Clean database after tests
- **Seed Data**: Populate database with test data

### Integration Test Best Practices

1. **Use transactions**: Rollback changes after each test
2. **Clean up data**: Ensure tests don't affect each other
3. **Test constraints**: Verify database rules are enforced
4. **Test relationships**: Check foreign key relationships work
5. **Performance testing**: Ensure operations complete in reasonable time

## Supabase Cloud Database Testing

### Testing Approaches

#### 1. Separate Test Project (Recommended)

**Pros:**
- Complete isolation from production
- Full control over schema and data
- Can reset/destroy without risk
- Identical to production environment

**Cons:**
- Additional Supabase project required
- Separate billing/management
- Network latency for CI/CD

**Setup:**
```bash
# Create new Supabase project for testing
# Copy schema from main project
# Configure test environment variables
TEST_SUPABASE_URL=https://test-project.supabase.co
TEST_SUPABASE_SERVICE_ROLE_KEY=test_service_role_key
```

#### 2. Test Schema in Same Database

**Pros:**
- Single database to manage
- Reduced costs
- Faster setup

**Cons:**
- Risk of affecting production data
- Shared resources
- Complex cleanup

**Setup:**
```sql
-- Create test schema
CREATE SCHEMA test_schema;

-- Copy tables to test schema
CREATE TABLE test_schema.profiles (LIKE public.profiles);
-- ... repeat for all tables
```

#### 3. Local Supabase Instance

**Pros:**
- Complete control
- No network dependencies
- Fast execution
- No costs

**Cons:**
- Additional setup complexity
- May differ from production
- Requires Docker

**Setup:**
```bash
# Install Supabase CLI
npm install -g supabase

# Start local instance
supabase start

# Run migrations
supabase db push
```

### Recommended Testing Strategy

For **MoveIn**, we recommend this multi-tier approach:

1. **Local Development**: Use local Supabase for rapid development
2. **CI/CD**: Use separate test Supabase project
3. **Integration**: Test against production-like environment
4. **Unit Tests**: Mock database calls for isolated testing

### Test Data Management

#### Fixtures and Seed Data

```typescript
// Use consistent test data
export const TEST_USERS = {
  user1: {
    email: "test.user1@movein-test.com",
    password: "TestPassword123!",
    profile: { fullName: "Test User One" }
  }
}

// Generate dynamic test data
export function generateTestEmail(prefix: string): string {
  const timestamp = Date.now()
  return `${prefix}.${timestamp}@movein-test.example.com`
}
```

#### Data Cleanup Strategies

```typescript
// Automatic cleanup after each test
test.afterEach(async () => {
  await testUtils.cleanup()
})

// Manual cleanup for specific tests
await client.from("profiles").delete().neq("id", "system-user-id")
```

## Running Tests

### Available Test Scripts

```bash
# Run all tests
bun run test

# Run unit tests only
bun run test:unit

# Run E2E tests only
bun run test:e2e

# Run integration tests only
bun run test:integration

# Run tests in headed mode (see browser)
bun run test:headed

# Run specific test file
bunx playwright test tests/e2e/landing-page.e2e.spec.ts

# Run tests with debugging
bunx playwright test --debug

# Generate test report
bunx playwright show-report
```

### Continuous Integration

Example GitHub Actions workflow:

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      
      - name: Install dependencies
        run: bun install
        
      - name: Install Playwright browsers
        run: bunx playwright install --with-deps
        
      - name: Run unit tests
        run: bun run test:unit
        
      - name: Run E2E tests
        run: bun run test:e2e
        env:
          TEST_SUPABASE_URL: ${{ secrets.TEST_SUPABASE_URL }}
          TEST_SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.TEST_SUPABASE_SERVICE_ROLE_KEY }}
          
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Best Practices

### General Testing Principles

1. **Test Pyramid**: More unit tests, fewer E2E tests
2. **Test Behavior**: Focus on user-facing behavior, not implementation
3. **Deterministic Tests**: Tests should pass/fail consistently
4. **Fast Feedback**: Keep tests fast and focused
5. **Clear Failures**: Test failures should clearly indicate the problem

### Playwright-Specific Best Practices

1. **Use Page Object Models** for complex flows:
```typescript
class LoginPage {
  constructor(private page: Page) {}
  
  async login(email: string, password: string) {
    await this.page.getByLabel(/email/i).fill(email)
    await this.page.getByLabel(/password/i).fill(password)
    await this.page.getByRole("button", { name: /sign in/i }).click()
  }
}
```

2. **Wait for specific conditions**:
```typescript
// Wait for specific element
await expect(page.getByText("Success")).toBeVisible()

// Wait for navigation
await page.waitForURL("/dashboard")

// Wait for API response
await page.waitForResponse(resp => resp.url().includes("/api/groups"))
```

3. **Use data-testid for stable selectors**:
```jsx
// In components
<button data-testid="create-group-button">Create Group</button>

// In tests
await page.getByTestId("create-group-button").click()
```

### Database Testing Best Practices

1. **Isolation**: Each test should be completely independent
2. **Cleanup**: Always clean up test data
3. **Realistic Data**: Use realistic test data that matches production
4. **Test Constraints**: Verify database rules and constraints
5. **Performance**: Monitor test execution time

## Troubleshooting

### Common Issues

#### Tests Timeout
```bash
# Increase timeout for slow operations
test.setTimeout(30000) // 30 seconds

# Or in config
timeout: 30000
```

#### Flaky Tests
```typescript
// Retry flaky tests
test.describe.configure({ retries: 2 })

// Use proper waiting
await expect(element).toBeVisible({ timeout: 10000 })
```

#### Database Connection Issues
```typescript
// Check environment variables
console.log("TEST_SUPABASE_URL:", process.env.TEST_SUPABASE_URL)

// Test connection
const { data, error } = await client.from("profiles").select("count").single()
if (error) console.error("Connection failed:", error)
```

#### Authentication Issues
```typescript
// Clear auth state between tests
await context.clearCookies()
await context.clearPermissions()
```

### Debugging Tests

1. **Run in headed mode**: See browser actions
```bash
bunx playwright test --headed
```

2. **Use debugging mode**: Step through tests
```bash
bunx playwright test --debug
```

3. **Screenshot on failure**: Automatic in Playwright

4. **Console output**: Check browser console
```typescript
page.on("console", msg => console.log(msg.text()))
```

### Performance Optimization

1. **Parallel execution**: Use workers
```typescript
// In config
workers: process.env.CI ? 1 : undefined
```

2. **Reuse browser contexts**: When safe
```typescript
test.describe.configure({ mode: "serial" })
```

3. **Optimize selectors**: Use efficient locators
```typescript
// Good
page.getByRole("button", { name: "Submit" })

// Avoid if possible
page.locator(".complex > .css > .selector")
```

## Conclusion

This testing setup provides comprehensive coverage for the MoveIn application:

- **Unit tests** ensure individual functions work correctly
- **E2E tests** verify user workflows function properly
- **Integration tests** confirm database operations work as expected
- **Supabase integration** enables testing against cloud database

The combination of Playwright's powerful testing capabilities with Supabase's cloud database creates a robust testing environment that can catch issues early and ensure the application works reliably for users.

For questions or improvements to this testing setup, please refer to the project documentation or reach out to the development team.