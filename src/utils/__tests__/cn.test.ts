import { cn } from "../cn";

describe("cn utility", () => {
  it("merges class names correctly", () => {
    expect(cn("c-1", "c-2")).toBe("c-1 c-2");
  });

  it("handles conditional classes", () => {
    expect(cn("c-1", true && "c-2", false && "c-3")).toBe("c-1 c-2");
  });

  it("merges tailwind classes correctly", () => {
    expect(cn("px-2 py-1", "p-4")).toBe("p-4");
    expect(cn("bg-red-500", "bg-blue-500")).toBe("bg-blue-500");
  });

  it("handles arrays and objects", () => {
    expect(cn(["c-1", "c-2"])).toBe("c-1 c-2");
    expect(cn({ "c-1": true, "c-2": false })).toBe("c-1");
  });

  it("handles undefined and null", () => {
    expect(cn("c-1", undefined, null, "c-2")).toBe("c-1 c-2");
  });
});
