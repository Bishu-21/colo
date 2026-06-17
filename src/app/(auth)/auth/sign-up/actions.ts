"use server";

import { auth } from "@/lib/auth/server";
import { redirect } from "next/navigation";

export async function signUpWithEmail(
  _prevState: { error: string } | null,
  formData: FormData
) {
  const email = formData.get("email") as string;
  const name = formData.get("name") as string;
  const password = formData.get("password") as string;

  if (!email) {
    return { error: "Email address must be provided." };
  }
  if (!name) {
    return { error: "Name must be provided." };
  }
  if (!password || password.length < 6) {
    return { error: "Password must be at least 6 characters long." };
  }

  try {
    const { error } = await auth.signUp.email({
      email,
      name,
      password,
    });

    if (error) {
      return { error: error.message || "Failed to create account" };
    }
  } catch (err: any) {
    return { error: err.message || "An unexpected error occurred during signup." };
  }

  const redirectTo = (formData.get("redirect") as string) || "/workspace";
  redirect(redirectTo);
}
