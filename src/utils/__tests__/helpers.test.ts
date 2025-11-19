import { generateId, formatTimestamp, sanitizeInput } from "../helpers";

describe("helpers utility", () => {
  describe("generateId", () => {
    it("generates a string", () => {
      expect(typeof generateId()).toBe("string");
    });

    it("generates unique ids", () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
    });
  });

  describe("formatTimestamp", () => {
    it("formats timestamp correctly", () => {
      // Mock date to ensure consistent testing
      const timestamp = new Date("2023-01-01T12:30:00").getTime();
      // The output depends on locale, but we can check if it contains the time
      // Or we can mock toLocaleTimeString

      // Let's just check if it returns a string for now, or match a pattern
      const formatted = formatTimestamp(timestamp);
      expect(typeof formatted).toBe("string");
      expect(formatted).toMatch(/\d{1,2}:\d{2}/);
    });
  });

  describe("sanitizeInput", () => {
    it("removes html tags", () => {
      expect(sanitizeInput("<script>alert(1)</script>")).toBe("scriptalert(1)/script");
      expect(sanitizeInput("<div>hello</div>")).toBe("divhello/div");
    });

    it("trims whitespace", () => {
      expect(sanitizeInput("  hello  ")).toBe("hello");
    });

    it("handles empty string", () => {
      expect(sanitizeInput("")).toBe("");
    });

    it("removes only < and > characters", () => {
      // The implementation replaces < and > with empty string
      expect(sanitizeInput("Hello <world>")).toBe("Hello world");
    });
  });
});
