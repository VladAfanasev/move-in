import { expect, test } from "@playwright/test"
import { getAvatarColor, getAvatarProps, getInitials } from "@/lib/avatar-utils"

test.describe("avatar-utils.ts", () => {
  test.describe("getInitials function", () => {
    test("should return initials for full name", () => {
      expect(getInitials("John Doe")).toBe("JD")
      expect(getInitials("Jane Smith")).toBe("JS")
      expect(getInitials("Alexander Johnson")).toBe("AJ")
    })

    test("should handle single words", () => {
      expect(getInitials("John")).toBe("JO")
      expect(getInitials("A")).toBe("A")
      expect(getInitials("AB")).toBe("AB")
    })

    test("should handle multiple middle names", () => {
      expect(getInitials("John Michael Smith")).toBe("JS")
      expect(getInitials("Mary Jane Watson Parker")).toBe("MP")
    })

    test("should handle edge cases", () => {
      expect(getInitials("")).toBe("?")
      expect(getInitials("   ")).toBe("?")
      expect(getInitials("a")).toBe("A")
    })

    test("should handle extra whitespace", () => {
      expect(getInitials("  John   Doe  ")).toBe("JD")
      expect(getInitials("John\t\nDoe")).toBe("JD")
    })

    test("should handle special characters", () => {
      expect(getInitials("Jean-Pierre")).toBe("JE")
      expect(getInitials("O'Connor Smith")).toBe("OS")
    })
  })

  test.describe("getAvatarColor function", () => {
    test("should return consistent colors for same userId", () => {
      const userId = "user123"
      const color1 = getAvatarColor(userId)
      const color2 = getAvatarColor(userId)
      expect(color1).toBe(color2)
    })

    test("should return different colors for different userIds", () => {
      const color1 = getAvatarColor("user1")
      const color2 = getAvatarColor("user2")
      const color3 = getAvatarColor("user3")

      // While not guaranteed, it's very unlikely they'd all be the same
      const allSame = color1 === color2 && color2 === color3
      expect(allSame).toBe(false)
    })

    test("should return valid hex color codes", () => {
      const color = getAvatarColor("test-user")
      expect(color).toMatch(/^#[0-9A-F]{6}$/i)
    })

    test("should handle empty and special character userIds", () => {
      expect(() => getAvatarColor("")).not.toThrow()
      expect(() => getAvatarColor("user@email.com")).not.toThrow()
      expect(() => getAvatarColor("user-123_456")).not.toThrow()
    })

    test("should be deterministic across multiple calls", () => {
      const userId = "deterministic-test"
      const colors = Array.from({ length: 10 }, () => getAvatarColor(userId))
      const uniqueColors = new Set(colors)
      expect(uniqueColors.size).toBe(1)
    })
  })

  test.describe("getAvatarProps function", () => {
    test("should return correct props for complete user data", () => {
      const props = getAvatarProps("user123", "John Doe", "https://example.com/avatar.jpg")

      expect(props).toEqual({
        initials: "JD",
        colorClass: expect.stringMatching(/^#[0-9A-F]{6}$/i),
        avatarUrl: "https://example.com/avatar.jpg",
      })
    })

    test("should handle missing avatar URL", () => {
      const props = getAvatarProps("user123", "John Doe")

      expect(props).toEqual({
        initials: "JD",
        colorClass: expect.stringMatching(/^#[0-9A-F]{6}$/i),
        avatarUrl: undefined,
      })
    })

    test("should handle null avatar URL", () => {
      const props = getAvatarProps("user123", "John Doe", null)

      expect(props).toEqual({
        initials: "JD",
        colorClass: expect.stringMatching(/^#[0-9A-F]{6}$/i),
        avatarUrl: undefined,
      })
    })

    test("should handle missing user name", () => {
      const props = getAvatarProps("user123", null)

      expect(props).toEqual({
        initials: "UU", // "Unknown User" initials
        colorClass: expect.stringMatching(/^#[0-9A-F]{6}$/i),
        avatarUrl: undefined,
      })
    })

    test("should handle empty user name", () => {
      const props = getAvatarProps("user123", "")

      expect(props).toEqual({
        initials: "UU", // "Unknown User" initials
        colorClass: expect.stringMatching(/^#[0-9A-F]{6}$/i),
        avatarUrl: undefined,
      })
    })
  })
})
