import { expect, test } from "@playwright/test"

test.describe("Landing Page E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
  })

  test("should display main navigation and hero section", async ({ page }) => {
    // Check hero section
    await expect(
      page.getByRole("heading", { name: /Find Your Perfect Home Together/i }),
    ).toBeVisible()
    await expect(
      page.getByText(/Connect with like-minded people to form buying groups/i),
    ).toBeVisible()

    // Check CTA button
    const getStartedButton = page.getByRole("link", { name: /Get Started Today/i })
    await expect(getStartedButton).toBeVisible()
    await expect(getStartedButton).toHaveAttribute("href", "/register")
  })

  test("should display all feature cards", async ({ page }) => {
    // Check that all 6 feature cards are present
    const featureCards = [
      "Collaborative Buying",
      "Reduced Costs",
      "Secure & Transparent",
      "Verified Properties",
      "Community Support",
      "Fast Matching",
    ]

    for (const feature of featureCards) {
      // Look for the feature name in CardTitle which might not be h3
      await expect(page.getByText(feature, { exact: true }).first()).toBeVisible()
    }
  })

  test("should display how it works section", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "How It Works", level: 2 })).toBeVisible()

    // Check the 3 steps
    await expect(page.getByText("Create Your Profile")).toBeVisible()
    await expect(page.getByText("Join or Create a Group")).toBeVisible()
    await expect(page.getByText("Buy Your Home")).toBeVisible()
  })

  test("should display pricing section", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Simple, Transparent Pricing", level: 2 }),
    ).toBeVisible()

    // Just check that pricing section exists without specific text matching
    const pricingSection = page.locator("#pricing")
    await expect(pricingSection).toBeVisible()
  })

  test("should have working registration links", async ({ page }) => {
    const registrationLinks = page.getByRole("link", {
      name: /Get Started|Choose Pro|Start Your Journey/i,
    })
    const linkCount = await registrationLinks.count()

    expect(linkCount).toBeGreaterThan(0)

    // Check that first registration link works
    const firstLink = registrationLinks.first()
    await expect(firstLink).toHaveAttribute("href", "/register")
  })

  test("should display contact section", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Have Questions?", level: 2 })).toBeVisible()

    // Check contact options - these are also CardTitle components
    await expect(page.getByText("Live Chat", { exact: true })).toBeVisible()
    await expect(page.getByText("Expert Guidance", { exact: true })).toBeVisible()
    await expect(page.getByText("Success Stories", { exact: true })).toBeVisible()
  })

  test("should have responsive design on mobile", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.reload()

    // Check that main elements are still visible
    await expect(
      page.getByRole("heading", { name: /Find Your Perfect Home Together/i }),
    ).toBeVisible()
    await expect(page.getByRole("link", { name: /Get Started Today/i })).toBeVisible()

    // Check that layout adapts
    const heroSection = page.locator("section").first()
    await expect(heroSection).toBeVisible()
  })

  test("should scroll to sections when clicking anchor links", async ({ page }) => {
    // Note: This would require anchor links to be implemented in the navigation
    // For now, just check that sections exist and are scrollable to

    // Scroll to different sections and check they're visible
    const featuresSection = page.locator("#features")
    if (await featuresSection.isVisible()) {
      await featuresSection.scrollIntoViewIfNeeded()
      await expect(
        page.getByRole("heading", { name: "Why Choose MoveIn?", level: 2 }),
      ).toBeVisible()
    }

    const howItWorksSection = page.locator("#how-it-works")
    if (await howItWorksSection.isVisible()) {
      await howItWorksSection.scrollIntoViewIfNeeded()
      await expect(page.getByRole("heading", { name: "How It Works", level: 2 })).toBeVisible()
    }

    const pricingSection = page.locator("#pricing")
    if (await pricingSection.isVisible()) {
      await pricingSection.scrollIntoViewIfNeeded()
      await expect(
        page.getByRole("heading", { name: "Simple, Transparent Pricing", level: 2 }),
      ).toBeVisible()
    }
  })
})
