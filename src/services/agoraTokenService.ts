/**
 * Agora RTC Token Service
 * Connects to backend API for RTC token generation
 */

const API_BASE_URL = "http://localhost:8080";

export interface RTCTokenResponse {
  token: string;
  expiresAt: number;
}

/**
 * Request RTC token from backend
 */
export async function requestToken(
  channelName: string,
  uid: number
): Promise<string> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/token/rtc`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        channelName,
        uid,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to get RTC token: ${response.statusText}`);
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
  uid: number
): Promise<string> {
  return requestToken(channelName, uid);
}
