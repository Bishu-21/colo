export type ToastType = "success" | "error" | "info";

export function showToast(message: string, type: ToastType = "info") {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("morpee_toast", {
        detail: { message, type },
      })
    );
  }
}
