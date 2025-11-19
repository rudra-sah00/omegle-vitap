import { getErrorMessage, handleError } from "../errorHandler";

describe("errorHandler utility", () => {
  describe("getErrorMessage", () => {
    it("handles permission errors", () => {
      expect(getErrorMessage({ code: "PERMISSION_DENIED" })).toBe(
        "Permission denied. Please allow access to continue."
      );
      expect(getErrorMessage({ name: "NotAllowedError" })).toBe(
        "Permission denied. Please allow access to continue."
      );
    });

    it("handles device errors", () => {
      expect(getErrorMessage({ name: "NotFoundError" })).toBe(
        "Device not found. Please check your camera and microphone."
      );
      expect(getErrorMessage({ message: "device not found" })).toBe(
        "Device not found. Please check your camera and microphone."
      );
    });

    it("handles network errors", () => {
      expect(getErrorMessage({ message: "network error" })).toBe(
        "Connection issue. Please check your internet and try again."
      );
      expect(getErrorMessage({ message: "connection failed" })).toBe(
        "Connection issue. Please check your internet and try again."
      );
    });

    it("handles timeout errors", () => {
      expect(getErrorMessage({ message: "request timeout" })).toBe(
        "Request timed out. Please try again."
      );
    });

    it("handles firebase errors", () => {
      expect(getErrorMessage({ code: "firebase/internal" })).toBe(
        "Unable to connect. Please try again in a moment."
      );
    });

    it("handles agora errors", () => {
      expect(getErrorMessage({ code: "INVALID_OPERATION" })).toBe(
        "Something went wrong. Please refresh and try again."
      );
      expect(getErrorMessage({ code: "AgoraRTCError" })).toBe(
        "Something went wrong. Please refresh and try again."
      );
    });

    it("handles token errors", () => {
      expect(getErrorMessage({ message: "invalid token" })).toBe(
        "Session expired. Please refresh the page."
      );
    });

    it("returns default message for unknown errors", () => {
      expect(getErrorMessage({})).toBe("Something went wrong. Please try again.");
      expect(getErrorMessage(null)).toBe("Something went wrong. Please try again.");
    });
  });

  describe("handleError", () => {
    it("does not throw", () => {
      expect(() => handleError(new Error("test"))).not.toThrow();
    });
  });
});
