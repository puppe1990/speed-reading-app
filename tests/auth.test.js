// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  createSession,
  hashPassword,
  MIN_PASSWORD_LENGTH,
  parseCookies,
  readSession,
  serializeCookie,
  SESSION_COOKIE,
  verifyPassword,
} from "../src/auth.mjs";

const SECRET = "test-secret";
const NOW = 1_700_000_000_000;
const USER = "3f0c9d5e-0000-4000-8000-000000000000";

describe("password", () => {
  it("hashes and verifies a password", async () => {
    const hash = await hashPassword("segredo-forte");
    expect(hash).not.toContain("segredo-forte");
    expect(await verifyPassword("segredo-forte", hash)).toBe(true);
    expect(await verifyPassword("outra", hash)).toBe(false);
    expect(await verifyPassword("", hash)).toBe(false);
  });

  it("rejects short passwords", async () => {
    await expect(hashPassword("123")).rejects.toThrow(
      new RegExp(String(MIN_PASSWORD_LENGTH)),
    );
  });
});

describe("session", () => {
  it("round-trips a valid session with the user id", () => {
    const token = createSession(SECRET, USER, { ttlSeconds: 60, now: NOW });
    expect(readSession(SECRET, token, { now: NOW + 1000 })).toEqual({
      userId: USER,
    });
  });

  it("rejects expired, tampered or malformed tokens", () => {
    const token = createSession(SECRET, USER, { ttlSeconds: 60, now: NOW });
    expect(readSession(SECRET, token, { now: NOW + 61_000 })).toBeNull();
    expect(readSession(SECRET, `${token}x`, { now: NOW })).toBeNull();
    expect(readSession("other", token, { now: NOW })).toBeNull();
    expect(readSession(SECRET, "abc", { now: NOW })).toBeNull();
    expect(readSession(SECRET, undefined, { now: NOW })).toBeNull();
  });
});

describe("cookies", () => {
  it("parses a cookie header", () => {
    expect(parseCookies(`a=1; ${SESSION_COOKIE}=abc; b=2`)).toEqual({
      a: "1",
      [SESSION_COOKIE]: "abc",
      b: "2",
    });
  });

  it("serializes an httpOnly cookie and honours secure", () => {
    const cookie = serializeCookie(SESSION_COOKIE, "abc", {
      maxAge: 60,
      secure: true,
    });
    expect(cookie).toContain(`${SESSION_COOKIE}=abc`);
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Secure");
    expect(cookie).toContain("Max-Age=60");
  });
});
