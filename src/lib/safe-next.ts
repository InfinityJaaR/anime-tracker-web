/** Solo rutas internas ("/algo"), nunca "//dominio" ni URLs absolutas: evita redirecciones abiertas. */
export function safeNext(value: unknown, fallback = "/lists"): string {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  if (value.length > 300 || value.startsWith("/login")) return fallback;
  return value;
}
