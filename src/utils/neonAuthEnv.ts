function isProduction() {
  return process.env.NODE_ENV === "production";
}

export function getNeonAuthBaseUrl() {
  const baseUrl = process.env.NEON_AUTH_BASE_URL;

  if (!baseUrl) {
    throw new Error(
      isProduction()
        ? "CRITICAL: NEON_AUTH_BASE_URL environment variable is missing in production."
        : "NEON_AUTH_BASE_URL is missing. Add it to .env.local for local development."
    );
  }

  return baseUrl;
}

export function getNeonAuthCookieSecret() {
  const secret = process.env.NEON_AUTH_COOKIE_SECRET;

  if (!secret) {
    throw new Error(
      isProduction()
        ? "CRITICAL: NEON_AUTH_COOKIE_SECRET environment variable is missing in production."
        : "NEON_AUTH_COOKIE_SECRET is missing. Add it to .env.local for local development."
    );
  }

  if (secret.length < 32) {
    throw new Error(
      "CRITICAL: NEON_AUTH_COOKIE_SECRET must be at least 32 characters long."
    );
  }

  return secret;
}

export function getNeonAuthJwksUrl() {
  return new URL(".well-known/jwks.json", getNeonAuthBaseUrl()).toString();
}
