// @vitest-environment node
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createApi } from "../src/api.mjs";
import { createSession, hashPassword, SESSION_COOKIE } from "../src/auth.mjs";
import { openDb } from "../src/db.mjs";

const SECRET = "test-secret";
const PASSWORD = "segredo123";
const TEXTS = [
  {
    id: "shared-1",
    title: "Texto Base",
    author: "Equipe",
    category: "Base",
    paragraphs: ["Um.", "Dois."],
  },
  {
    id: "shared-2",
    title: "Segundo Texto",
    author: "Equipe",
    category: "Base",
    paragraphs: ["Três.", "Quatro."],
  },
];

let db;
let api;
let user;
let authCookies;

function sessionFrom(response) {
  const raw = response.headers["set-cookie"] ?? "";
  return raw.split(";")[0].split("=")[1];
}

beforeEach(async () => {
  const dir = mkdtempSync(join(tmpdir(), "leitor-api-"));
  db = await openDb({ url: `file:${join(dir, "test.db")}` });
  await db.seed(TEXTS);
  api = createApi({ db, secret: SECRET });
  user = await db.createUser({
    name: "Ana",
    email: "ana@example.com",
    passwordHash: await hashPassword(PASSWORD),
  });
  authCookies = {
    [SESSION_COOKIE]: createSession(SECRET, user.id, { ttlSeconds: 3600 }),
  };
});

afterEach(() => {
  db.close();
});

describe("auth routes", () => {
  it("redirects anonymous users and protects the library", async () => {
    const root = await api({ method: "GET", pathname: "/", cookies: {} });
    expect(root.status).toBe(302);
    expect(root.headers.location).toBe("/signin");

    const library = await api({
      method: "GET",
      pathname: "/api/library",
      cookies: {},
    });
    expect(library.status).toBe(401);
  });

  it("renders the sign in and sign up screens", async () => {
    const signin = await api({ method: "GET", pathname: "/signin" });
    expect(signin.status).toBe(200);
    expect(signin.body).toContain('action="/api/login"');
    expect(signin.body).toContain('href="/signup"');

    const signup = await api({ method: "GET", pathname: "/signup" });
    expect(signup.body).toContain('action="/api/register"');
    expect(signup.body).toContain('name="confirm"');
  });

  it("rejects invalid sign up and creates a valid account", async () => {
    const invalid = await api({
      method: "POST",
      pathname: "/api/register",
      form: { name: "", email: "x", password: "123", confirm: "456" },
    });
    expect(invalid.status).toBe(400);
    expect(invalid.body).toContain("Informe seu nome");

    const created = await api({
      method: "POST",
      pathname: "/api/register",
      form: {
        name: "Bia",
        email: "bia@example.com",
        password: PASSWORD,
        confirm: PASSWORD,
      },
    });
    expect(created.status).toBe(302);
    expect(created.headers.location).toBe("/");

    const me = await api({
      method: "GET",
      pathname: "/api/me",
      cookies: { [SESSION_COOKIE]: sessionFrom(created) },
    });
    expect(JSON.parse(me.body)).toMatchObject({
      authenticated: true,
      user: { email: "bia@example.com" },
    });
  });

  it("logs in with the right password and clears the cookie on logout", async () => {
    const bad = await api({
      method: "POST",
      pathname: "/api/login",
      form: { email: "ana@example.com", password: "errada" },
    });
    expect(bad.status).toBe(401);

    const good = await api({
      method: "POST",
      pathname: "/api/login",
      form: { email: "ANA@example.com", password: PASSWORD },
    });
    expect(good.status).toBe(302);
    expect(good.headers["set-cookie"]).toContain(SESSION_COOKIE);

    const logout = await api({
      method: "GET",
      pathname: "/logout",
      cookies: authCookies,
    });
    expect(logout.status).toBe(302);
    expect(logout.headers["set-cookie"]).toContain("Max-Age=0");
  });
});

describe("reader routes", () => {
  it("renders the reader page with the data island", async () => {
    const response = await api({
      method: "GET",
      pathname: "/",
      cookies: authCookies,
    });
    expect(response.status).toBe(200);
    expect(response.body).toContain('id="reader-data"');
    expect(response.body).toContain("Texto Base");
    expect(response.body).toContain('src="/app.js"');
  });

  it("returns the library fragment after search", async () => {
    const all = await api({
      method: "GET",
      pathname: "/api/library",
      cookies: authCookies,
    });
    expect(all.status).toBe(200);
    expect(all.body).toContain("Texto Base");

    const none = await api({
      method: "GET",
      pathname: "/api/library",
      query: { q: "inexistente" },
      cookies: authCookies,
    });
    expect(none.body).toContain("Nenhum texto encontrado");
  });

  it("creates and deletes an owned text", async () => {
    const created = await api({
      method: "POST",
      pathname: "/api/texts",
      form: { title: "Meu texto", author: "Eu", content: "A.\n\nB." },
      cookies: authCookies,
    });
    expect(created.status).toBe(302);
    expect(created.headers.location).toMatch(/^\/\?text=custom-/);

    const id = decodeURIComponent(
      created.headers.location.replace("/?text=", ""),
    );
    expect(await db.getText(id, user.id)).toMatchObject({ title: "Meu texto" });

    const removed = await api({
      method: "POST",
      pathname: `/api/texts/${id}/delete`,
      cookies: authCookies,
    });
    expect(removed.status).toBe(302);
    expect(await db.getText(id, user.id)).toBeNull();
  });

  it("stores progress and completes a text", async () => {
    const progress = await api({
      method: "POST",
      pathname: "/api/progress",
      form: {
        textId: "shared-1",
        paragraphIndex: 1,
        wordIndex: 2,
        wpm: 520,
        technique: "rsvp",
        guideLines: true,
      },
      cookies: authCookies,
    });
    expect(progress.status).toBe(200);
    expect(JSON.parse(progress.body).ok).toBe(true);
    expect(await db.getProgress(user.id, "shared-1")).toMatchObject({
      paragraphIndex: 1,
      wpm: 520,
      technique: "rsvp",
    });

    const complete = await api({
      method: "POST",
      pathname: "/api/complete",
      form: { textId: "shared-1", wpm: 600 },
      cookies: authCookies,
    });
    expect(complete.status).toBe(200);
    expect(JSON.parse(complete.body).stats).toMatchObject({
      completedTexts: 1,
      highestWpm: 600,
    });
  });

  it("persists reader preferences and reuses them for another text", async () => {
    await api({
      method: "POST",
      pathname: "/api/progress",
      form: {
        textId: "shared-1",
        wpm: 620,
        technique: "peripheral",
        chunkSize: 4,
        fontSize: 1.4,
        guideLines: false,
        blurAdjacents: true,
      },
      cookies: authCookies,
    });
    expect(await db.getPreferences(user.id)).toMatchObject({
      wpm: 620,
      technique: "peripheral",
      chunkSize: 4,
      fontSize: 1.4,
      guideLines: false,
    });

    const page = await api({
      method: "GET",
      pathname: "/",
      query: { text: "shared-2" },
      cookies: authCookies,
    });
    expect(page.body).toContain('"wpm":620');
    expect(page.body).toContain('"technique":"peripheral"');
  });

  it("accumulates active reading minutes", async () => {
    const post = (addMinutes) =>
      api({
        method: "POST",
        pathname: "/api/progress",
        form: { textId: "shared-1", wpm: 400, addMinutes },
        cookies: authCookies,
      });
    await post(3);
    await post(2);
    expect((await db.getStats(user.id)).totalMinutes).toBe(5);
  });

  it("computes the running average wpm on completion", async () => {
    await db.saveStats(user.id, { averageWpm: 300, completedTexts: 1 });
    const response = await api({
      method: "POST",
      pathname: "/api/complete",
      form: { textId: "shared-1", wpm: 500 },
      cookies: authCookies,
    });
    expect(JSON.parse(response.body).stats).toMatchObject({
      completedTexts: 2,
      averageWpm: 400,
      highestWpm: 500,
    });
  });

  it("clears stats", async () => {
    await db.saveStats(user.id, { completedTexts: 4, highestWpm: 700 });
    const response = await api({
      method: "POST",
      pathname: "/api/stats/clear",
      cookies: authCookies,
    });
    expect(response.status).toBe(302);
    expect(await db.getStats(user.id)).toMatchObject({
      completedTexts: 0,
      highestWpm: 250,
    });
  });

  it("404s unknown paths", async () => {
    const response = await api({
      method: "GET",
      pathname: "/api/nada",
      cookies: authCookies,
    });
    expect(response.status).toBe(404);
  });
});
