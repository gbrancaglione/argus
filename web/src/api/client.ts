const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

type RequestOptions = {
  method?: string;
  body?: unknown;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });

  if (response.status === 204) return undefined as T;

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }

  return data as T;
}
