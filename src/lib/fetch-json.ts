/**
 * fetch + JSON que nunca muestra errores técnicos al usuario: si la respuesta no es
 * JSON (p. ej. una página de error HTML) devuelve un mensaje en español.
 */
export async function fetchJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(input, init);
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") throw e;
    throw new Error("No hay conexión. Revisa tu internet e intenta de nuevo.");
  }
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    /* respuesta no JSON */
  }
  if (!res.ok || body === null) {
    const msg = (body as { error?: unknown } | null)?.error;
    throw new Error(typeof msg === "string" ? msg : "Algo falló en el servidor. Intenta de nuevo.");
  }
  return body as T;
}
