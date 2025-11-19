/**
 * Agora RTC Token Service
 * Connects to backend API for RTC token generation
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_AGORA_TOKEN_ENDPOINT || "http://localhost:8080";
const API_KEY =
  process.env.NEXT_PUBLIC_AGORA_API_KEY || "KrlsUCAAGH4xD+1U26BmUd8THBeepaB9aHv/Bww1t4Q=";

/**
 * Response structure from RTC token endpoint
 */
export interface RTCTokenResponse {
  /** Generated RTC token */
  token: string;
  /** Token expiration timestamp */
  expiresAt: number;
}

/**
 * Request RTC token from backend
 */
export async function requestToken(
  channelName: string,
  uid: number,
  role: "publisher" | "subscriber" = "publisher",
  expiryTime: number = 3600
): Promise<string> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/token/rtc`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": API_KEY,
      },
      body: JSON.stringify({
        channelName,
        uid,
        role,
        expiryTime,
      }),
    });

    if (!response.ok) {
      await response.json().catch(() => ({}));
      throw new Error("Unable to connect to video service. Please try again.");
    }

    const data: RTCTokenResponse = await response.json();

    if (!data.token) {
      throw new Error("Unable to connect to video service. Please try again.");
    }

    return data.token;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Unable to connect to video service. Please try again.");
  }
}

/**
 * Renew RTC token from backend
 */
export async function renewToken(
  channelName: string,
  uid: number,
  role: "publisher" | "subscriber" = "publisher"
): Promise<string> {
  return requestToken(channelName, uid, role, 3600);
}
