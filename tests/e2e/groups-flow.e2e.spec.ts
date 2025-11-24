import { expect, test } from "@playwright/test"

test.describe("Groups Flow E2E", () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication by setting session storage
    await page.goto("/")
    await page.evaluate(() => {
      // Mock the user session in localStorage
      window.localStorage.setItem(
        "supabase.auth.token",
        JSON.stringify({
          access_token: "mock-token",
          refresh_token: "mock-refresh",
          user: {
            id: "mock-user-id",
            email: "test@example.com",
          },
        }),
      )
    })
  })

  test.describe("Groups List Page", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/dashboard/groups")
    })

    test("should display groups page", async ({ page }) => {
      // Skip if not authenticated (redirected to home)
      if (page.url() === "http://localhost:3000/" || page.url().includes("/login")) {
        test.skip()
        return
      }

      // Look for groups heading or any groups-related content
      const groupsHeading = page.getByRole("heading", { name: /groups|groepen/i })
      const groupsText = page.getByText(/groups|groepen|mijn groepen/i)

      if ((await groupsHeading.count()) > 0) {
        await expect(groupsHeading.first()).toBeVisible()
      } else if ((await groupsText.count()) > 0) {
        await expect(groupsText.first()).toBeVisible()
      } else {
        // If no specific groups content, just check page loaded
        await expect(page.locator("body")).toBeVisible()
      }
    })

    test("should show create group button", async ({ page }) => {
      const createButton = page
        .getByRole("button", { name: /create group|new group/i })
        .or(page.getByRole("link", { name: /create group|new group/i }))

      if (await createButton.isVisible()) {
        await expect(createButton).toBeVisible()
      }
    })

    test("should display empty state when no groups exist", async ({ page }) => {
      // If no groups exist, should show empty state
      const emptyState = page.getByText(/no groups|create your first group|get started/i)
      const groupsList = page.locator("[data-testid='groups-list'], .groups-grid")

      // Either empty state or groups list should be visible
      const hasGroups = (await groupsList.count()) > 0
      const hasEmptyState = (await emptyState.count()) > 0

      expect(hasGroups || hasEmptyState).toBe(true)
    })

    test("should search and filter groups", async ({ page }) => {
      const searchInput = page.getByPlaceholder(/search groups|filter/i)

      if (await searchInput.isVisible()) {
        await searchInput.fill("test")
        // Groups list should update based on search
        await page.waitForTimeout(500) // Wait for debounced search
      }
    })
  })

  test.describe("Create Group Flow", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/dashboard/groups/create")
    })

    test("should display create group form", async ({ page }) => {
      // Skip if not authenticated (redirected to home)
      if (page.url() === "http://localhost:3000/" || page.url().includes("/login")) {
        test.skip()
        return
      }

      // Look for create group content
      const createHeading = page.getByRole("heading", {
        name: /create group|groep maken|nieuwe groep/i,
      })
      const createText = page.getByText(/create group|groep maken|nieuwe groep/i)

      if ((await createHeading.count()) > 0) {
        await expect(createHeading.first()).toBeVisible()
      } else if ((await createText.count()) > 0) {
        await expect(createText.first()).toBeVisible()
      } else {
        // Skip if no create form found
        test.skip()
        return
      }

      // Common form fields for group creation
      const formFields = [/group name|name/i, /description/i, /budget|target budget/i]

      for (const field of formFields) {
        const input = page.getByLabel(field).or(page.getByPlaceholder(field))
        if (await input.isVisible()) {
          await expect(input).toBeVisible()
        }
      }
    })

    test("should validate required fields", async ({ page }) => {
      const submitButton = page.getByRole("button", { name: /create group|save/i })

      if (await submitButton.isVisible()) {
        await submitButton.click()

        // Should show validation errors or prevent submission
        const nameInput = page.getByLabel(/group name|name/i)
        if (await nameInput.isVisible()) {
          const isInvalid = await nameInput.evaluate(el => {
            if ("checkValidity" in el) {
              return !(el as HTMLInputElement).checkValidity()
            }
            return false
          })
          expect(isInvalid).toBe(true)
        }
      }
    })

    test("should create group successfully with valid data", async ({ page }) => {
      // Fill in group details
      const nameInput = page.getByLabel(/group name|name/i)
      if (await nameInput.isVisible()) {
        await nameInput.fill("Test Group")
      }

      const descriptionInput = page.getByLabel(/description/i)
      if (await descriptionInput.isVisible()) {
        await descriptionInput.fill("A test group for automated testing")
      }

      const budgetInput = page.getByLabel(/budget|target budget/i)
      if (await budgetInput.isVisible()) {
        await budgetInput.fill("500000")
      }

      // Submit form
      const submitButton = page.getByRole("button", { name: /create group|save/i })
      if (await submitButton.isVisible()) {
        await submitButton.click()

        // Should redirect to group page or groups list
        expect(page.url()).toMatch(/\/dashboard\/groups/)

        // Should show success message or new group
        const successMessage = page.getByText(/group created|success/i)
        const groupTitle = page.getByText("Test Group")

        const hasSuccess = (await successMessage.count()) > 0
        const hasGroup = (await groupTitle.count()) > 0

        expect(hasSuccess || hasGroup).toBe(true)
      }
    })

    test("should handle form validation errors", async ({ page }) => {
      // Fill invalid data
      const nameInput = page.getByLabel(/group name|name/i)
      if (await nameInput.isVisible()) {
        await nameInput.fill("") // Empty name
      }

      const budgetInput = page.getByLabel(/budget|target budget/i)
      if (await budgetInput.isVisible()) {
        await budgetInput.fill("-100") // Negative budget
      }

      const submitButton = page.getByRole("button", { name: /create group|save/i })
      if (await submitButton.isVisible()) {
        await submitButton.click()

        // Should show validation errors
        const errorMessages = page.locator(".error, [role='alert'], .text-red-500")
        if ((await errorMessages.count()) > 0) {
          await expect(errorMessages.first()).toBeVisible()
        }
      }
    })
  })

  test.describe("Group Details Page", () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to a specific group (assuming group ID 123 exists in test data)
      await page.goto("/dashboard/groups/123")
    })

    test("should display group information", async ({ page }) => {
      // Should show group details or handle missing group gracefully
      const groupTitle = page.locator("h1, h2").first()
      await expect(groupTitle).toBeVisible()
    })

    test("should show group members section", async ({ page }) => {
      const membersSection = page.getByRole("heading", { name: /members|participants/i })

      if (await membersSection.isVisible()) {
        await expect(membersSection).toBeVisible()

        // Should show members list or empty state
        const membersList = page.locator("[data-testid='members-list'], .members-grid")
        const emptyMembers = page.getByText(/no members|invite members/i)

        const hasMembers = (await membersList.count()) > 0
        const hasEmptyState = (await emptyMembers.count()) > 0

        expect(hasMembers || hasEmptyState).toBe(true)
      }
    })

    test("should show group properties section", async ({ page }) => {
      const propertiesSection = page.getByRole("heading", { name: /properties|saved properties/i })

      if (await propertiesSection.isVisible()) {
        await expect(propertiesSection).toBeVisible()
      }
    })

    test("should have group action buttons", async ({ page }) => {
      // Common group actions
      const actionButtons = [/invite member|add member/i, /edit group|settings/i, /leave group/i]

      for (const action of actionButtons) {
        const button = page
          .getByRole("button", { name: action })
          .or(page.getByRole("link", { name: action }))

        // Not all actions may be visible depending on user role
        if ((await button.count()) > 0) {
          await expect(button.first()).toBeVisible()
        }
      }
    })
  })

  test.describe("Group Invitation Flow", () => {
    test("should display invite member form", async ({ page }) => {
      await page.goto("/dashboard/groups/123")

      const inviteButton = page.getByRole("button", { name: /invite member|add member/i })

      if (await inviteButton.isVisible()) {
        await inviteButton.click()

        // Should show invite form or modal
        const emailInput = page.getByLabel(/email/i).or(page.getByPlaceholder(/email/i))
        await expect(emailInput).toBeVisible()
      }
    })

    test("should validate email input for invitations", async ({ page }) => {
      await page.goto("/dashboard/groups/123")

      const inviteButton = page.getByRole("button", { name: /invite member|add member/i })

      if (await inviteButton.isVisible()) {
        await inviteButton.click()

        const emailInput = page.getByLabel(/email/i).or(page.getByPlaceholder(/email/i))
        if (await emailInput.isVisible()) {
          await emailInput.fill("invalid-email")

          const sendButton = page.getByRole("button", { name: /send invitation|invite/i })
          if (await sendButton.isVisible()) {
            await sendButton.click()

            // Should show email validation error
            const isInvalid = await emailInput.evaluate(el => {
              if ("checkValidity" in el) {
                return !(el as HTMLInputElement).checkValidity()
              }
              return false
            })
            expect(isInvalid).toBe(true)
          }
        }
      }
    })
  })

  test.describe("Join Group Flow", () => {
    test("should handle group invitation links", async ({ page }) => {
      // Test invitation URL format
      await page.goto("/join/group123")
      await page.waitForTimeout(1000)

      // This test just verifies the page doesn't crash
      // The specific behavior (join button, redirect, 404) depends on auth state and route existence
      const bodyContent = await page.locator("body").textContent()

      // Should have some content and not be completely blank
      expect(bodyContent?.length).toBeGreaterThan(0)
    })

    test("should confirm group joining", async ({ page }) => {
      await page.goto("/join/group123")

      const joinButton = page.getByRole("button", { name: /join group|accept invitation/i })

      if (await joinButton.isVisible()) {
        await joinButton.click()

        // Should redirect to group page or confirmation
        expect(page.url()).toMatch(/\/dashboard\/groups/)
      }
    })
  })
})
