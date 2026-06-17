import { createNeonAuth } from "@neondatabase/auth/next/server";

export const auth = createNeonAuth({
  baseUrl:
    process.env.NEON_AUTH_BASE_URL ||
    "https://ep-bold-frog-ao5uzymm.neonauth.c-2.ap-southeast-1.aws.neon.tech/neondb/auth",
  cookies: {
    secret:
      process.env.NEON_AUTH_COOKIE_SECRET ||
      "dev_only_temporary_cookie_secret_key_at_least_32_chars_long",
  },
  logLevel: process.env.NODE_ENV === "production" ? "warn" : "debug",
});
