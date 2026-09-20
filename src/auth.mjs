import { createHmac, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";

export const SESSION_COOKIE = "leitor_session";
export const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 30;
export const MIN_PASSWORD_LENGTH = 8;

export async function hashPassword(plain) {
  if (String(plain ?? "").length < MIN_PASSWORD_LENGTH) {
    throw new Error(
      `senha precisa ter ao menos ${MIN_PASSWORD_LENGTH} caracteres`,
    );
  }
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain, hash) {
  if (!plain || !hash) return false;
  return bcrypt.compare(String(plain), String(hash));
}

function sign(secret, value) {
  return createHmac("sha256", secret).update(value).digest("hex");
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

// Token layout: <userId>.<expiresAt>.<hmac>. userId is a UUID (no dots), so
// splitting on "." is unambiguous.
export function createSession(
  secret,
  userId,
  { ttlSeconds = DEFAULT_TTL_SECONDS, now = Date.now() } = {},
) {
  const expiresAt = now + ttlSeconds * 1000;
  const payload = `${userId}.${expiresAt}`;
  return `${payload}.${sign(secret, payload)}`;
}

export function readSession(secret, token, { now = Date.now() } = {}) {
  if (!token) return null;
  const parts = String(token).split(".");
  if (parts.length !== 3) return null;
  const [userId, expiresRaw, signature] = parts;
  const expiresAt = Number(expiresRaw);
  if (!userId || !Number.isFinite(expiresAt) || !signature) return null;
  if (!safeEqual(signature, sign(secret, `${userId}.${expiresAt}`)))
    return null;
  if (expiresAt <= now) return null;
  return { userId };
}

export function parseCookies(header) {
  const cookies = {};
  if (!header) return cookies;
  for (const part of String(header).split(";")) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    const name = part.slice(0, index).trim();
    if (!name) continue;
    cookies[name] = decodeURIComponent(part.slice(index + 1).trim());
  }
  return cookies;
}

export function serializeCookie(
  name,
  value,
  { maxAge, httpOnly = true, sameSite = "Lax", secure = false } = {},
) {
  const parts = [`${name}=${encodeURIComponent(value)}`, "Path=/"];
  if (httpOnly) parts.push("HttpOnly");
  if (sameSite) parts.push(`SameSite=${sameSite}`);
  if (secure) parts.push("Secure");
  if (typeof maxAge === "number") parts.push(`Max-Age=${maxAge}`);
  return parts.join("; ");
}
