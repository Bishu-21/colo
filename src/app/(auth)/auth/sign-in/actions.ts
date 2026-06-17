"use server";

import { auth } from "@/lib/auth/server";
import { redirect } from "next/navigation";

export async function signInWithEmail(
  _prevState: { error: string } | null,
  formData: FormData
) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email) {
    return { error: "Email address must be provided." };
  }
  if (!password) {
    return { error: "Password must be provided." };
  }

  try {
    const { error } = await auth.signIn.email({
      email,
      password,
    });

    if (error) {
      return { error: error.message || "Failed to sign in. Verify credentials." };
    }
  } catch (err: any) {
    return { error: err.message || "An unexpected error occurred during signin." };
  }

  const redirectTo = (formData.get("redirect") as string) || "/workspace";
  redirect(redirectTo);
}
