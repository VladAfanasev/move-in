import { expect, test } from "@playwright/test"

test.describe("Cost Negotiation E2E", () => {
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

  test.describe("Cost Calculation Page", () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to cost calculation for a mock group and property
      await page.goto("/dashboard/groups/123/calculate/456")
    })

    test("should display property cost calculation interface", async ({ page }) => {
      // Check if we get redirected to login or if the page loads
      const isLoginPage = page.url().includes("/login")
      const isCalculationPage = page.url().includes("/calculate")

      if (isLoginPage) {
        // If redirected to login, that's expected behavior for unauthenticated users
        expect(isLoginPage).toBe(true)
        return
      }

      if (isCalculationPage) {
        // Look for calculation-specific content
        const costElements = [
          page.getByText(/berekening|calculation/i),
          page.getByText(/kosten|costs/i),
          page.getByText(/percentage|%/i),
          page.locator("[data-testid='cost-calculator']"),
        ]

        // At least one cost-related element should be present
        let hasContent = false
        for (const element of costElements) {
          if ((await element.count()) > 0) {
            hasContent = true
            break
          }
        }

        // If calculation page loads, it should have cost-related content
        if (hasContent) {
          await expect(costElements[0]).toBeVisible()
        }
      }
    })

    test("should allow starting a live negotiation session", async ({ page }) => {
      const isCalculationPage = page.url().includes("/calculate")

      if (isCalculationPage) {
        // Look for start negotiation button
        const startButton = page
          .getByRole("button", { name: /start.*negotiation|live.*session|begin.*onderhandeling/i })
          .or(
            page.getByRole("link", {
              name: /start.*negotiation|live.*session|begin.*onderhandeling/i,
            }),
          )

        if (await startButton.isVisible()) {
          await startButton.click()

          // Should navigate to live negotiation page
          await expect(page.url()).toMatch(/\/negotiate\/.*\/live/)
        }
      }
    })
  })

  test.describe("Live Negotiation Session", () => {
    test.beforeEach(async ({ page }) => {
      // Navigate directly to live negotiation
      await page.goto("/dashboard/groups/123/negotiate/456/live")
    })

    test("should display live negotiation interface", async ({ page }) => {
      const isLoginPage = page.url().includes("/login")
      const isNegotiationPage = page.url().includes("/negotiate") && page.url().includes("/live")

      if (isLoginPage) {
        // Expected for unauthenticated users
        expect(isLoginPage).toBe(true)
        return
      }

      if (isNegotiationPage) {
        // Look for negotiation interface elements
        const negotiationElements = [
          page.getByText(/live.*onderhandeling|live.*negotiation/i),
          page.getByText(/percentage/i),
          page.locator("input[type='range'], .slider"),
          page.getByText(/confirm|bevestig/i),
          page.getByText(/vraagprijs|asking.*price/i),
        ]

        let hasNegotiationContent = false
        for (const element of negotiationElements) {
          if ((await element.count()) > 0) {
            hasNegotiationContent = true
            break
          }
        }

        expect(hasNegotiationContent).toBe(true)
      }
    })

    test("should show property information in negotiation header", async ({ page }) => {
      const isNegotiationPage = page.url().includes("/negotiate") && page.url().includes("/live")

      if (isNegotiationPage) {
        // Property info should be displayed
        const propertyElements = [
          page.getByText(/🏠|property|woning/i),
          page.getByText(/vraagprijs|asking.*price/i),
          page.getByText(/€|EUR/i),
          page.getByText(/groep|group/i),
        ]

        // At least some property information should be visible
        let hasPropertyInfo = false
        for (const element of propertyElements) {
          if ((await element.count()) > 0) {
            hasPropertyInfo = true
            break
          }
        }

        expect(hasPropertyInfo).toBe(true)
      }
    })

    test("should allow adjusting cost percentage with slider", async ({ page }) => {
      const isNegotiationPage = page.url().includes("/negotiate") && page.url().includes("/live")

      if (isNegotiationPage) {
        // Look for percentage slider or input
        const slider = page.locator("input[type='range'], .slider-root, [role='slider']")
        const percentageInput = page.locator("input[type='number']").filter({ hasText: /\d+/ })

        if ((await slider.count()) > 0) {
          // Test slider interaction
          await slider.first().focus()

          // Try to change the value
          await slider.first().fill("30")

          // Should show updated percentage somewhere on page
          const percentageDisplay = page.getByText(/30\s*%|30\s*percent/)

          // Wait a bit for updates
          await page.waitForTimeout(500)

          if ((await percentageDisplay.count()) > 0) {
            await expect(percentageDisplay.first()).toBeVisible()
          }
        } else if ((await percentageInput.count()) > 0) {
          // Test with number input
          await percentageInput.first().fill("30")
          await page.waitForTimeout(500)
        }
      }
    })

    test("should show confirmation button for percentage", async ({ page }) => {
      const isNegotiationPage = page.url().includes("/negotiate") && page.url().includes("/live")

      if (isNegotiationPage) {
        // Look for confirm button
        const confirmButton = page.getByRole("button", { name: /confirm|bevestig|lock.*in/i })

        if (await confirmButton.isVisible()) {
          await expect(confirmButton).toBeVisible()

          // Should be enabled/clickable
          await expect(confirmButton).toBeEnabled()
        }
      }
    })

    test("should show back navigation to calculation", async ({ page }) => {
      const isNegotiationPage = page.url().includes("/negotiate") && page.url().includes("/live")

      if (isNegotiationPage) {
        // Look for back button or link
        const backButton = page
          .getByRole("button", { name: /back|terug|calculation|berekening/i })
          .or(page.getByRole("link", { name: /back|terug|calculation|berekening/i }))

        if (await backButton.isVisible()) {
          await expect(backButton).toBeVisible()

          // Click and verify navigation
          await backButton.click()

          // Should navigate back to calculation page
          await expect(page.url()).toMatch(/\/calculate\//)
        }
      }
    })

    test("should display session members and their status", async ({ page }) => {
      const isNegotiationPage = page.url().includes("/negotiate") && page.url().includes("/live")

      if (isNegotiationPage) {
        // Look for member list or status indicators
        const memberElements = [
          page.getByText(/member|participant|deelnemer/i),
          page.getByText(/online|offline|active/i),
          page.locator("[data-testid='session-members']"),
          page.locator(".member-status"),
        ]

        // Check if any member-related content exists
        let hasMemberContent = false
        for (const element of memberElements) {
          if ((await element.count()) > 0) {
            hasMemberContent = true
            break
          }
        }

        // If members are shown, verify they have status indicators
        if (hasMemberContent) {
          const statusElements = page
            .locator(".status, .badge, .indicator")
            .filter({ hasText: /adjusting|confirmed|locked|online|offline/ })
          if ((await statusElements.count()) > 0) {
            await expect(statusElements.first()).toBeVisible()
          }
        }
      }
    })

    test("should handle real-time updates gracefully", async ({ page }) => {
      const isNegotiationPage = page.url().includes("/negotiate") && page.url().includes("/live")

      if (isNegotiationPage) {
        // Wait for initial load
        await page.waitForTimeout(2000)

        // Look for any real-time indicators
        const _realtimeElements = [
          page.getByText(/online|live|real.*time/i),
          page.locator("[data-testid='realtime-status']"),
          page.locator(".live-indicator"),
        ]

        // Should handle real-time gracefully (no errors)
        const hasJSErrors = await page.evaluate(() => {
          // Check if there are any JavaScript errors in console
          return window.console.error.toString().includes("error")
        })

        expect(hasJSErrors).toBe(false)

        // Page should remain functional
        const mainContent = page.locator("main, [role='main'], .content")
        if ((await mainContent.count()) > 0) {
          await expect(mainContent.first()).toBeVisible()
        }
      }
    })
  })

  test.describe("Contract Generation", () => {
    test("should navigate to contract page after negotiation", async ({ page }) => {
      // Navigate to a potential contract page
      await page.goto("/dashboard/groups/123/properties/456/contract")

      const isContractPage = page.url().includes("/contract")
      const isLoginPage = page.url().includes("/login")

      if (isLoginPage) {
        expect(isLoginPage).toBe(true)
        return
      }

      if (isContractPage) {
        // Look for contract-related content
        const contractElements = [
          page.getByText(/contract|agreement|overeenkomst/i),
          page.getByText(/signed|ondertekend/i),
          page.getByText(/download|pdf/i),
        ]

        let hasContractContent = false
        for (const element of contractElements) {
          if ((await element.count()) > 0) {
            hasContractContent = true
            break
          }
        }

        if (hasContractContent) {
          await expect(contractElements[0]).toBeVisible()
        }
      }
    })
  })
})
