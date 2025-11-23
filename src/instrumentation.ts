// Instrumentation disabled for static export
// Sentry is initialized via client-side configuration only

export async function register() {
  // Static export doesn't support server-side instrumentation
  // Client-side Sentry is initialized in sentry.client.config.ts
}
