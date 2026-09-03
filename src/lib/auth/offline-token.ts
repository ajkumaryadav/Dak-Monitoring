export const AUTH_COOKIE_NAME = "dak_auth_token";
const JWT_SECRET =
  process.env.NEXTAUTH_SECRET ||
  process.env.JWT_SECRET ||
  "district-dak-offline-secret-key-10.70.12.73";

export interface AuthUser {
  id: string;
  email: string;
  user_metadata?: {
    name?: string;
    role?: string;
  };
}

function base64UrlEncode(str: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(str).toString("base64url");
  }
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(str: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(str, "base64url").toString("utf8");
  }
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) base64 += "=";
  return atob(base64);
}

function computeOfflineSignature(input: string): string {
  let hash = 0;
  const combined = input + ":" + JWT_SECRET;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

export function signOfflineToken(payload: {
  id: string;
  email: string;
  name?: string;
  role?: string;
}): string {
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const exp = Math.floor(Date.now() / 1000) + 7 * 24 * 3600; // 7 days

  const body = base64UrlEncode(
    JSON.stringify({
      sub: payload.id,
      email: payload.email,
      name: payload.name || "User",
      role: payload.role || "collector",
      exp,
    })
  );

  const sig = computeOfflineSignature(`${header}.${body}`);
  return `${header}.${body}.${sig}`;
}

export function verifyOfflineToken(token: string): AuthUser | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [header, body, signature] = parts;
    const expectedSig = computeOfflineSignature(`${header}.${body}`);
    if (signature !== expectedSig) return null;

    const payload = JSON.parse(base64UrlDecode(body));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return {
      id: payload.sub,
      email: payload.email,
      user_metadata: {
        name: payload.name,
        role: payload.role,
      },
    };
  } catch {
    return null;
  }
}
