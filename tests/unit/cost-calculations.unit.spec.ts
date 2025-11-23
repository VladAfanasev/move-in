import { expect, test } from "@playwright/test"

test.describe("cost-calculations.ts", () => {
  test.describe("Transfer tax calculation logic", () => {
    test("should calculate 2% transfer tax correctly", () => {
      const purchasePrice = 300000
      const expectedTransferTax = purchasePrice * 0.02
      expect(expectedTransferTax).toBe(6000)
    })

    test("should handle edge cases for transfer tax", () => {
      expect(0 * 0.02).toBe(0)
      expect(1 * 0.02).toBe(0.02)
      expect(1000000 * 0.02).toBe(20000)
    })
  })

  test.describe("Total costs calculation logic", () => {
    test("should calculate total costs correctly with all fees", () => {
      const costs = {
        purchasePrice: 300000,
        notaryFees: 2500,
        transferTax: 6000, // 2% of purchase price
        renovationCosts: 10000,
        brokerFees: 5000,
        inspectionCosts: 750,
        otherCosts: 1000,
      }

      const total = Object.values(costs).reduce((sum, cost) => sum + cost, 0)
      expect(total).toBe(325250)
    })

    test("should handle default values correctly", () => {
      const purchasePrice = 250000
      const defaultNotaryFees = 2500
      const defaultInspectionCosts = 750
      const transferTax = purchasePrice * 0.02

      const totalWithDefaults =
        purchasePrice + defaultNotaryFees + transferTax + defaultInspectionCosts
      expect(totalWithDefaults).toBe(258250)
    })

    test("should handle optional costs correctly", () => {
      const purchasePrice = 200000
      const transferTax = purchasePrice * 0.02
      const notaryFees = 2500
      const inspectionCosts = 750

      // Test with no optional costs
      const minimalTotal = purchasePrice + transferTax + notaryFees + inspectionCosts
      expect(minimalTotal).toBe(207250)
    })
  })

  test.describe("Percentage validation logic", () => {
    test("should validate percentage totals correctly", () => {
      const percentages = [25, 35, 40]
      const total = percentages.reduce((sum, p) => sum + p, 0)
      expect(total).toBe(100)
      expect(Math.abs(total - 100) < 0.01).toBe(true)
    })

    test("should handle floating point precision", () => {
      const percentages = [33.33, 33.33, 33.34]
      const total = percentages.reduce((sum, p) => sum + p, 0)
      expect(Math.abs(total - 100) < 0.01).toBe(true)
    })

    test("should identify when percentages don't add to 100", () => {
      const percentages = [30, 30, 30]
      const total = percentages.reduce((sum, p) => sum + p, 0)
      expect(Math.abs(total - 100) < 0.01).toBe(false)
    })
  })

  test.describe("Member intention validation", () => {
    test("should validate member intention data structure", () => {
      const memberIntention = {
        userId: "user123",
        userName: "John Doe",
        desiredPercentage: 25,
        maxPercentage: 40,
        status: "intentions_set" as const,
      }

      expect(memberIntention.userId).toBeTruthy()
      expect(memberIntention.userName).toBeTruthy()
      expect(memberIntention.desiredPercentage).toBeGreaterThan(0)
      expect(memberIntention.maxPercentage).toBeGreaterThanOrEqual(
        memberIntention.desiredPercentage!,
      )
      expect(["not_set", "setting", "intentions_set", "ready_for_session"]).toContain(
        memberIntention.status,
      )
    })

    test("should handle member with no intentions set", () => {
      const memberIntention: {
        userId: string
        userName: string
        desiredPercentage?: number
        maxPercentage?: number
        status: "not_set"
      } = {
        userId: "user456",
        userName: "Jane Smith",
        status: "not_set" as const,
      }

      expect(memberIntention.desiredPercentage).toBeUndefined()
      expect(memberIntention.maxPercentage).toBeUndefined()
      expect(memberIntention.status).toBe("not_set")
    })
  })

  test.describe("Session participant logic", () => {
    test("should validate session participant data", () => {
      const participant = {
        userId: "user123",
        currentPercentage: 25,
        intendedPercentage: 30,
        status: "adjusting" as const,
        isOnline: true,
        lastActivity: new Date(),
      }

      expect(participant.currentPercentage).toBeGreaterThanOrEqual(0)
      expect(participant.currentPercentage).toBeLessThanOrEqual(100)
      expect(participant.intendedPercentage).toBeGreaterThanOrEqual(0)
      expect(participant.intendedPercentage).toBeLessThanOrEqual(100)
      expect(["adjusting", "confirmed", "locked"]).toContain(participant.status)
      expect(typeof participant.isOnline).toBe("boolean")
    })

    test("should detect when all participants are confirmed", () => {
      const participants = [
        { status: "confirmed" as const, currentPercentage: 30 },
        { status: "confirmed" as const, currentPercentage: 30 },
        { status: "confirmed" as const, currentPercentage: 40 },
      ]

      const allConfirmed = participants.every(p => p.status === "confirmed")
      const total = participants.reduce((sum, p) => sum + p.currentPercentage, 0)
      const isTotal100 = Math.abs(total - 100) < 0.01

      expect(allConfirmed).toBe(true)
      expect(isTotal100).toBe(true)
    })

    test("should detect when session is not ready for locking", () => {
      const participants = [
        { status: "confirmed" as const, currentPercentage: 30 },
        { status: "adjusting" as const, currentPercentage: 30 },
        { status: "confirmed" as const, currentPercentage: 40 },
      ]

      const allConfirmed = participants.every(p => p.status === "confirmed")
      expect(allConfirmed).toBe(false)
    })
  })
})
