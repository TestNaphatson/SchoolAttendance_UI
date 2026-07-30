const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5134/api";

export class ApiError extends Error {
  constructor(message: string, public status: number, public data?: unknown) {
    super(message);
  }
}

type ApiOptions = RequestInit & { auth?: boolean };

export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  if (options.auth !== false && typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    cache: "no-store",
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && options.auth !== false && typeof window !== "undefined") {
      clearSession();
      window.location.href = "/login";
    }
    throw new ApiError(body.message ?? "เกิดข้อผิดพลาด กรุณาลองใหม่", response.status, body);
  }
  return body as T;
}

export function saveSession(token: string, user: object) {
  localStorage.setItem("access_token", token);
  localStorage.setItem("user", JSON.stringify(user));
  document.cookie = `access_token=${encodeURIComponent(token)}; path=/; max-age=86400; samesite=lax`;
  const role = "role" in user ? String(user.role) : "";
  document.cookie = `user_role=${encodeURIComponent(role)}; path=/; max-age=86400; samesite=lax`;
}

export function clearSession() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("user");
  document.cookie = "access_token=; path=/; max-age=0; samesite=lax";
  document.cookie = "user_role=; path=/; max-age=0; samesite=lax";
}

export function getUser(): { fullName?: string; username?: string; role?: string } {
  try {
    return JSON.parse(localStorage.getItem("user") ?? "{}");
  } catch {
    return {};
  }
}
