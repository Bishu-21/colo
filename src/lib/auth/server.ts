import { createNeonAuth } from "@neondatabase/auth/next/server";
import {
  getNeonAuthBaseUrl,
  getNeonAuthCookieSecret,
} from "@/utils/neonAuthEnv";

export const auth = createNeonAuth({
  baseUrl: getNeonAuthBaseUrl(),
  cookies: {
    secret: getNeonAuthCookieSecret(),
  },
  logLevel: process.env.NODE_ENV === "production" ? "warn" : "debug",
});
