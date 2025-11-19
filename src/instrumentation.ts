import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

/**
 * Sentry integration for server-side error capture
 * Automatically captures and reports request errors to Sentry
 */
export const onRequestError = Sentry.captureRequestError;
