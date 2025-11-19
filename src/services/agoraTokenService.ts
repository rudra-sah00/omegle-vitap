/**
 * Agora RTC Token Service
 * Connects to backend API for RTC token generation
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_AGORA_TOKEN_ENDPOINT || "https://hmvhd4dzxfhp2sagcoamakwn7y0fswvj.lambda-url.us-east-1.on.aws";
const API_KEY = process.env.NEXT_PUBLIC_AGORA_API_KEY || "KrlsUCAAGH4xD+1U26BmUd8THBeepaB9aHv/Bww1t4Q=";

export interface RTCTokenResponse {
  token: string;
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
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Failed to get RTC token: ${response.statusText}. ${errorData.message || ""}`);
    }

    const data: RTCTokenResponse = await response.json();
    return data.token;
  } catch (error) {
    console.error("Error requesting RTC token:", error);
    throw error;
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
