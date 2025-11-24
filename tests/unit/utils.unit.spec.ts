import { expect, test } from "@playwright/test"
import { cn } from "@/lib/utils"

test.describe("utils.ts", () => {
  test.describe("cn function", () => {
    test("should combine class names correctly", () => {
      expect(cn("class1", "class2")).toBe("class1 class2")
    })

    test("should handle conditional classes", () => {
      expect(cn("class1", false, "class3")).toBe("class1 class3")
      expect(cn("class1", "class2", "class3")).toBe("class1 class2 class3")
    })

    test("should merge Tailwind classes correctly", () => {
      expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4")
      expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500")
    })

    test("should handle empty and undefined inputs", () => {
      expect(cn("")).toBe("")
      expect(cn(undefined)).toBe("")
      expect(cn(null)).toBe("")
      expect(cn("class1", undefined, "class2")).toBe("class1 class2")
    })

    test("should handle arrays of classes", () => {
      expect(cn(["class1", "class2"])).toBe("class1 class2")
      expect(cn("base", ["class1", "class2"], "end")).toBe("base class1 class2 end")
    })

    test("should handle objects with conditional keys", () => {
      expect(cn({ class1: true, class2: false, class3: true })).toBe("class1 class3")
    })
  })
})
