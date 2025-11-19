import { requestToken } from "../agoraTokenService";

// Mock fetch
global.fetch = jest.fn();

describe("AgoraTokenService", () => {
  const mockChannelName = "test-channel";
  const mockUid = 12345;
  const mockToken = "mock-agora-token";
  const mockEndpoint = "https://test-endpoint.com";

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_AGORA_TOKEN_ENDPOINT = mockEndpoint;
  });

  it("requests token successfully", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ token: mockToken }),
    });

    const token = await requestToken(mockChannelName, mockUid);

    expect(token).toBe(mockToken);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
      })
    );
  });

  it("sends correct request body", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ token: mockToken }),
    });

    await requestToken(mockChannelName, mockUid);

    const callArgs = (global.fetch as jest.Mock).mock.calls[0];
    const requestBody = JSON.parse(callArgs[1].body);

    expect(requestBody).toEqual({
      channelName: mockChannelName,
      uid: mockUid,
      role: "publisher",
      expiryTime: 3600,
    });
  });

  it("throws error when request fails", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    });

    await expect(requestToken(mockChannelName, mockUid)).rejects.toThrow();
  });

  it("throws error when response is missing token", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    await expect(requestToken(mockChannelName, mockUid)).rejects.toThrow();
  });

  it("throws error when endpoint is not configured", async () => {
    delete process.env.NEXT_PUBLIC_AGORA_TOKEN_ENDPOINT;

    await expect(requestToken(mockChannelName, mockUid)).rejects.toThrow();
  });

  it("handles network errors", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

    await expect(requestToken(mockChannelName, mockUid)).rejects.toThrow("Network error");
  });

  it("validates channel name", async () => {
    await expect(requestToken("", mockUid)).rejects.toThrow();
  });

  it("validates uid", async () => {
    await expect(requestToken(mockChannelName, 0)).rejects.toThrow();
  });
});
