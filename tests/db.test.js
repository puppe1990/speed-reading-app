// @vitest-environment node
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { openDb, pickClientModule, DEFAULT_STATS } from "../src/db.mjs";

const TEXTS = [
  {
    id: "shared-1",
    title: "Compartilhado",
    author: "Equipe",
    category: "Base",
    coverColor: "from-cyan-500 to-blue-600",
    paragraphs: ["Primeiro parágrafo.", "Segundo parágrafo."],
  },
];

let db;

beforeEach(async () => {
  const dir = mkdtempSync(join(tmpdir(), "leitor-db-"));
  db = await openDb({ url: `file:${join(dir, "test.db")}` });
  await db.seed(TEXTS);
});

afterEach(() => {
  db.close();
});

describe("pickClientModule", () => {
  it("uses the native client only for local files", () => {
    expect(pickClientModule("file:local.db")).toBe("node");
    expect(pickClientModule("libsql://db.turso.io")).toBe("web");
  });
});

describe("users", () => {
  it("creates and finds a user, normalizing the email", async () => {
    const user = await db.createUser({
      name: "Ana",
      email: "Ana@Example.com ",
      passwordHash: "hash",
    });
    expect(user.email).toBe("ana@example.com");

    const found = await db.findUserByEmail("ANA@example.com");
    expect(found).toMatchObject({
      id: user.id,
      name: "Ana",
      passwordHash: "hash",
    });
    expect(await db.getUser(user.id)).toMatchObject({
      email: "ana@example.com",
    });
  });

  it("rejects duplicate emails", async () => {
    await db.createUser({ name: "Ana", email: "a@b.com", passwordHash: "h" });
    await expect(
      db.createUser({ name: "Bia", email: "A@B.com", passwordHash: "h" }),
    ).rejects.toThrow(/já cadastrado/i);
  });
});

describe("texts", () => {
  it("seeds shared texts and splits paragraphs", async () => {
    const texts = await db.listTexts("user-1");
    expect(texts).toHaveLength(1);
    expect(texts[0]).toMatchObject({ id: "shared-1", shared: true });
    expect(texts[0].paragraphs).toEqual([
      "Primeiro parágrafo.",
      "Segundo parágrafo.",
    ]);
  });

  it("is idempotent on re-seed", async () => {
    await db.seed([...TEXTS, { ...TEXTS[0], title: "Compartilhado 2" }]);
    const texts = await db.listTexts("user-1");
    expect(texts).toHaveLength(1);
    expect(texts[0].title).toBe("Compartilhado 2");
  });

  it("creates owned texts and enforces ownership on read/delete", async () => {
    const text = await db.createText("user-1", {
      title: "Meu artigo",
      content: "Linha um.\n\nLinha dois.",
    });
    expect(text.shared).toBe(false);
    expect(text.paragraphs).toEqual(["Linha um.", "Linha dois."]);

    expect(await db.getText(text.id, "user-1")).toMatchObject({ id: text.id });
    expect(await db.getText(text.id, "user-2")).toBeNull();
    expect(await db.getText("shared-1", "user-2")).not.toBeNull();

    await expect(db.deleteText(text.id, "user-2")).rejects.toThrow();
    await db.deleteText(text.id, "user-1");
    expect(await db.getText(text.id, "user-1")).toBeNull();
  });

  it("requires a title and content", async () => {
    await expect(
      db.createText("u", { title: "", content: "x" }),
    ).rejects.toThrow();
    await expect(
      db.createText("u", { title: "x", content: " " }),
    ).rejects.toThrow();
  });
});

describe("stats and progress", () => {
  it("creates default stats and keeps the highest wpm", async () => {
    expect(await db.getStats("user-1")).toEqual(DEFAULT_STATS);
    await db.saveStats("user-1", { highestWpm: 500, completedTexts: 2 });
    const stats = await db.saveStats("user-1", { highestWpm: 400 });
    expect(stats.highestWpm).toBe(500);
    expect(stats.completedTexts).toBe(2);
  });

  it("clears stats back to defaults", async () => {
    await db.saveStats("user-1", { highestWpm: 700, completedTexts: 3 });
    expect(await db.clearStats("user-1")).toEqual(DEFAULT_STATS);
    expect(await db.getStats("user-1")).toEqual(DEFAULT_STATS);
  });

  it("upserts reading progress per text", async () => {
    expect(await db.getProgress("user-1", "shared-1")).toBeNull();
    await db.saveProgress("user-1", {
      textId: "shared-1",
      paragraphIndex: 1,
      wordIndex: 4,
      wpm: 500,
      technique: "rsvp",
      guideLines: false,
    });
    const progress = await db.getProgress("user-1", "shared-1");
    expect(progress).toMatchObject({
      paragraphIndex: 1,
      wordIndex: 4,
      wpm: 500,
      technique: "rsvp",
      guideLines: false,
    });
    await db.saveProgress("user-1", { textId: "shared-1", wordIndex: 0 });
    expect((await db.getProgress("user-1", "shared-1")).paragraphIndex).toBe(1);
  });

  it("keeps reader preferences per user and merges patches", async () => {
    expect(await db.getPreferences("user-1")).toEqual({
      wpm: 450,
      technique: "chunking",
      chunkSize: 3,
      fontSize: 1.15,
      guideLines: true,
      blurAdjacents: true,
    });
    await db.savePreferences("user-1", {
      wpm: 700,
      technique: "rsvp",
      guideLines: false,
    });
    expect(await db.getPreferences("user-1")).toMatchObject({
      wpm: 700,
      technique: "rsvp",
      guideLines: false,
      chunkSize: 3,
    });
    expect(await db.getPreferences("user-2")).toMatchObject({ wpm: 450 });
  });
});
