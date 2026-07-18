// Simple REST API client pointing to the Express + MySQL backend in /backend.
// Set VITE_API_URL in a .env file to override the default.

export const API_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:5000";

function getToken(): string | null {
  if (typeof window === "undefined") return null;

  const token = localStorage.getItem("ojt_token");

  // safety cleanup (prevents "undefined"/"null" bugs)
  if (!token || token === "undefined" || token === "null") {
    return null;
  }

  return token;
}

export async function api<T = unknown>(
  path: string,
  options: { method?: string; body?: unknown; auth?: boolean } = {},
): Promise<T> {
  const { method = "GET", body, auth = true } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // attach token safely
  if (auth) {
    const token = getToken();

    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;

  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error(
      `Cannot reach backend at ${API_URL}. Start the Express server and ensure MySQL is running.`,
    );
  }

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    // 🔥 FIXED ERROR HANDLING (NO FAKE "TOKEN EXPIRED")
    let msg = (data && (data.message || data.error)) || `Request failed (${res.status})`;

    // normalize auth errors properly
    if (res.status === 401) {
      msg = "Session expired. Please login again.";

      // auto cleanup invalid token
      localStorage.removeItem("ojt_token");
    }

    if (res.status === 403) {
      msg = "You don't have permission to access this resource.";
    }

    throw new Error(msg);
  }

  return data as T;
}
