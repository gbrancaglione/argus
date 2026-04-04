import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

function loadEnv(): void {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  // mcp/.env lives one level up from dist/
  const envPath = resolve(__dirname, "..", ".env");
  try {
    const content = readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // .env file is optional — env vars can come from shell
  }
}

loadEnv();

const apiUrl = process.env.ARGUS_API_URL || "http://localhost:3000/api";
const email = process.env.ARGUS_EMAIL;
const password = process.env.ARGUS_PASSWORD;

let jwt: string | null = null;

async function login(): Promise<void> {
  if (!email || !password) {
    throw new Error(
      "ARGUS_EMAIL and ARGUS_PASSWORD environment variables are required"
    );
  }

  const res = await fetch(`${apiUrl}/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Login failed (${res.status}): ${body}`);
  }

  const data = (await res.json()) as { token?: string };
  if (!data.token) {
    throw new Error("No token in login response");
  }

  jwt = data.token;
}

export async function apiGet<T>(
  path: string,
  params?: Record<string, string | undefined>
): Promise<T> {
  if (!jwt) await login();

  const url = new URL(`${apiUrl}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== "") url.searchParams.set(k, v);
    }
  }

  let res = await fetch(url, {
    headers: { Authorization: `Bearer ${jwt}` },
  });

  // Re-login once on 401 (token expired)
  if (res.status === 401) {
    await login();
    res = await fetch(url, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
  }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API error (${res.status}): ${body}`);
  }

  return res.json() as Promise<T>;
}

export async function apiPatch<T>(
  path: string,
  body?: Record<string, unknown>
): Promise<T> {
  if (!jwt) await login();

  const url = `${apiUrl}${path}`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${jwt}`,
    "Content-Type": "application/json",
  };

  let res = await fetch(url, {
    method: "PATCH",
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    await login();
    res = await fetch(url, {
      method: "PATCH",
      headers: { ...headers, Authorization: `Bearer ${jwt}` },
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error (${res.status}): ${text}`);
  }

  return res.json() as Promise<T>;
}
