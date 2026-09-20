import { randomUUID } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DEFAULT_PREFERENCES, splitParagraphs } from "./text.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const DEFAULT_URL =
  process.env.TURSO_DATABASE_URL || `file:${join(here, "data/leitor.db")}`;

const COVER_COLORS = [
  "from-cyan-500 to-blue-600",
  "from-purple-600 to-indigo-800",
  "from-amber-600 to-red-800",
  "from-emerald-500 to-teal-700",
];

export const DEFAULT_STATS = {
  activeTextId: null,
  completedTexts: 0,
  totalMinutes: 0,
  averageWpm: 250,
  highestWpm: 250,
};

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS texts (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    title TEXT NOT NULL,
    author TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL DEFAULT '',
    cover_color TEXT NOT NULL DEFAULT 'from-cyan-500 to-blue-600',
    content TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS reading_stats (
    user_id TEXT PRIMARY KEY,
    active_text_id TEXT,
    completed_texts INTEGER NOT NULL DEFAULT 0,
    total_minutes INTEGER NOT NULL DEFAULT 0,
    average_wpm INTEGER NOT NULL DEFAULT 250,
    highest_wpm INTEGER NOT NULL DEFAULT 250,
    updated_at TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS reading_progress (
    user_id TEXT NOT NULL,
    text_id TEXT NOT NULL,
    paragraph_index INTEGER NOT NULL DEFAULT 0,
    word_index INTEGER NOT NULL DEFAULT 0,
    wpm INTEGER NOT NULL DEFAULT 450,
    technique TEXT NOT NULL DEFAULT 'chunking',
    chunk_size INTEGER NOT NULL DEFAULT 3,
    font_size REAL NOT NULL DEFAULT 1.15,
    guide_lines INTEGER NOT NULL DEFAULT 1,
    blur_adjacents INTEGER NOT NULL DEFAULT 1,
    updated_at TEXT,
    PRIMARY KEY (user_id, text_id)
  )`,
  `CREATE TABLE IF NOT EXISTS user_preferences (
    user_id TEXT PRIMARY KEY,
    wpm INTEGER NOT NULL DEFAULT 450,
    technique TEXT NOT NULL DEFAULT 'chunking',
    chunk_size INTEGER NOT NULL DEFAULT 3,
    font_size REAL NOT NULL DEFAULT 1.15,
    guide_lines INTEGER NOT NULL DEFAULT 1,
    blur_adjacents INTEGER NOT NULL DEFAULT 1,
    updated_at TEXT
  )`,
];

export function pickClientModule(databaseUrl) {
  return String(databaseUrl).startsWith("file:") ? "node" : "web";
}

async function loadClient(databaseUrl, authToken) {
  const module =
    pickClientModule(databaseUrl) === "node"
      ? await import("@libsql/client")
      : await import("@libsql/client/web");
  return module.createClient({ url: databaseUrl, authToken });
}

export function normalizeEmail(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function rowToUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    createdAt: row.created_at,
  };
}

function rowToText(row) {
  return {
    id: row.id,
    userId: row.user_id ?? null,
    shared: row.user_id === null,
    title: row.title,
    author: row.author ?? "",
    category: row.category ?? "",
    coverColor: row.cover_color ?? COVER_COLORS[0],
    content: row.content ?? "",
    paragraphs: splitParagraphs(row.content),
    createdAt: row.created_at,
  };
}

export function rowToStats(row) {
  if (!row) return { ...DEFAULT_STATS };
  return {
    activeTextId: row.active_text_id ?? null,
    completedTexts: Number(row.completed_texts ?? 0),
    totalMinutes: Number(row.total_minutes ?? 0),
    averageWpm: Number(row.average_wpm ?? DEFAULT_STATS.averageWpm),
    highestWpm: Number(row.highest_wpm ?? DEFAULT_STATS.highestWpm),
  };
}

export function rowToProgress(row) {
  if (!row) return null;
  return {
    textId: row.text_id,
    paragraphIndex: Number(row.paragraph_index ?? 0),
    wordIndex: Number(row.word_index ?? 0),
    wpm: Number(row.wpm ?? 450),
    technique: row.technique ?? "chunking",
    chunkSize: Number(row.chunk_size ?? 3),
    fontSize: Number(row.font_size ?? 1.15),
    guideLines: Boolean(row.guide_lines),
    blurAdjacents: Boolean(row.blur_adjacents),
  };
}

export function rowToPreferences(row) {
  if (!row) return { ...DEFAULT_PREFERENCES };
  return {
    wpm: Number(row.wpm ?? DEFAULT_PREFERENCES.wpm),
    technique: row.technique ?? DEFAULT_PREFERENCES.technique,
    chunkSize: Number(row.chunk_size ?? DEFAULT_PREFERENCES.chunkSize),
    fontSize: Number(row.font_size ?? DEFAULT_PREFERENCES.fontSize),
    guideLines: Boolean(row.guide_lines),
    blurAdjacents: Boolean(row.blur_adjacents),
  };
}

export async function openDb({ url, authToken } = {}) {
  const client = await loadClient(
    url || DEFAULT_URL,
    authToken ?? process.env.TURSO_AUTH_TOKEN,
  );

  for (const statement of SCHEMA) await client.execute(statement);

  async function getUser(id) {
    const result = await client.execute({
      sql: "SELECT * FROM users WHERE id = ?",
      args: [id],
    });
    return result.rows[0] ? rowToUser(result.rows[0]) : null;
  }

  async function findUserByEmail(email) {
    const result = await client.execute({
      sql: "SELECT * FROM users WHERE email = ?",
      args: [normalizeEmail(email)],
    });
    const row = result.rows[0];
    return row ? { ...rowToUser(row), passwordHash: row.password_hash } : null;
  }

  async function createUser({ name, email, passwordHash }) {
    const cleanName = String(name ?? "").trim();
    const cleanEmail = normalizeEmail(email);
    if (!cleanName) throw new Error("nome é obrigatório");
    if (!cleanEmail) throw new Error("e-mail é obrigatório");
    if (!passwordHash) throw new Error("hash de senha é obrigatório");
    if (await findUserByEmail(cleanEmail)) {
      throw new Error(`e-mail já cadastrado: ${cleanEmail}`);
    }
    const user = {
      id: randomUUID(),
      name: cleanName,
      email: cleanEmail,
      passwordHash,
      createdAt: new Date().toISOString(),
    };
    await client.execute({
      sql: "INSERT INTO users (id, name, email, password_hash, created_at) VALUES (?, ?, ?, ?, ?)",
      args: [user.id, user.name, user.email, user.passwordHash, user.createdAt],
    });
    return rowToUser(user);
  }

  async function getStats(userId) {
    const result = await client.execute({
      sql: "SELECT * FROM reading_stats WHERE user_id = ?",
      args: [userId],
    });
    if (result.rows[0]) return rowToStats(result.rows[0]);
    await client.execute({
      sql: "INSERT INTO reading_stats (user_id, updated_at) VALUES (?, ?)",
      args: [userId, new Date().toISOString()],
    });
    return { ...DEFAULT_STATS };
  }

  async function saveStats(userId, patch = {}) {
    const current = await getStats(userId);
    const next = {
      activeTextId:
        patch.activeTextId !== undefined
          ? patch.activeTextId
          : current.activeTextId,
      completedTexts:
        patch.completedTexts !== undefined
          ? Math.max(0, Number(patch.completedTexts) || 0)
          : current.completedTexts,
      totalMinutes:
        patch.totalMinutes !== undefined
          ? Math.max(0, Number(patch.totalMinutes) || 0)
          : current.totalMinutes,
      averageWpm:
        patch.averageWpm !== undefined
          ? Number(patch.averageWpm) || current.averageWpm
          : current.averageWpm,
      highestWpm:
        patch.highestWpm !== undefined
          ? Math.max(current.highestWpm, Number(patch.highestWpm) || 0)
          : current.highestWpm,
    };
    await client.execute({
      sql: `UPDATE reading_stats SET active_text_id = ?, completed_texts = ?, total_minutes = ?, average_wpm = ?, highest_wpm = ?, updated_at = ? WHERE user_id = ?`,
      args: [
        next.activeTextId,
        next.completedTexts,
        next.totalMinutes,
        next.averageWpm,
        next.highestWpm,
        new Date().toISOString(),
        userId,
      ],
    });
    return next;
  }

  async function clearStats(userId) {
    await getStats(userId);
    await client.execute({
      sql: `UPDATE reading_stats SET active_text_id = NULL, completed_texts = 0, total_minutes = 0, average_wpm = ?, highest_wpm = ?, updated_at = ? WHERE user_id = ?`,
      args: [
        DEFAULT_STATS.averageWpm,
        DEFAULT_STATS.highestWpm,
        new Date().toISOString(),
        userId,
      ],
    });
    return { ...DEFAULT_STATS };
  }

  async function listTexts(userId) {
    const result = await client.execute({
      sql: "SELECT * FROM texts WHERE user_id IS NULL OR user_id = ? ORDER BY user_id IS NOT NULL, created_at, title",
      args: [userId],
    });
    return result.rows.map(rowToText);
  }

  async function getText(id, userId) {
    const result = await client.execute({
      sql: "SELECT * FROM texts WHERE id = ? AND (user_id IS NULL OR user_id = ?)",
      args: [id, userId],
    });
    return result.rows[0] ? rowToText(result.rows[0]) : null;
  }

  async function createText(userId, { title, author, category, content }) {
    const cleanTitle = String(title ?? "").trim();
    const cleanContent = String(content ?? "").trim();
    if (!cleanTitle) throw new Error("título é obrigatório");
    if (!cleanContent) throw new Error("conteúdo do texto é obrigatório");
    const text = {
      id: `custom-${randomUUID()}`,
      userId,
      title: cleanTitle,
      author: String(author ?? "").trim() || "Autor Desconhecido",
      category: String(category ?? "").trim() || "Texto Personalizado",
      coverColor: COVER_COLORS[Math.floor(Math.random() * COVER_COLORS.length)],
      content: cleanContent,
      createdAt: new Date().toISOString(),
    };
    await client.execute({
      sql: "INSERT INTO texts (id, user_id, title, author, category, cover_color, content, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      args: [
        text.id,
        text.userId,
        text.title,
        text.author,
        text.category,
        text.coverColor,
        text.content,
        text.createdAt,
      ],
    });
    return rowToText({
      ...text,
      user_id: text.userId,
      cover_color: text.coverColor,
    });
  }

  async function deleteText(id, userId) {
    const result = await client.execute({
      sql: "DELETE FROM texts WHERE id = ? AND user_id = ?",
      args: [id, userId],
    });
    if (!result.rowsAffected) throw new Error(`texto não encontrado: ${id}`);
    return true;
  }

  async function getProgress(userId, textId) {
    const result = await client.execute({
      sql: "SELECT * FROM reading_progress WHERE user_id = ? AND text_id = ?",
      args: [userId, textId],
    });
    return rowToProgress(result.rows[0]);
  }

  async function saveProgress(userId, patch = {}) {
    const textId = patch.textId;
    if (!textId) throw new Error("textId é obrigatório");
    const current = (await getProgress(userId, textId)) ?? {
      paragraphIndex: 0,
      wordIndex: 0,
      wpm: 450,
      technique: "chunking",
      chunkSize: 3,
      fontSize: 1.15,
      guideLines: true,
      blurAdjacents: true,
    };
    const next = {
      paragraphIndex:
        patch.paragraphIndex !== undefined
          ? Math.max(0, Number(patch.paragraphIndex) || 0)
          : current.paragraphIndex,
      wordIndex:
        patch.wordIndex !== undefined
          ? Math.max(0, Number(patch.wordIndex) || 0)
          : current.wordIndex,
      wpm: patch.wpm !== undefined ? Number(patch.wpm) : current.wpm,
      technique: patch.technique ?? current.technique,
      chunkSize:
        patch.chunkSize !== undefined
          ? Number(patch.chunkSize)
          : current.chunkSize,
      fontSize:
        patch.fontSize !== undefined
          ? Number(patch.fontSize)
          : current.fontSize,
      guideLines:
        patch.guideLines !== undefined
          ? Boolean(patch.guideLines)
          : current.guideLines,
      blurAdjacents:
        patch.blurAdjacents !== undefined
          ? Boolean(patch.blurAdjacents)
          : current.blurAdjacents,
    };
    await client.execute({
      sql: `INSERT INTO reading_progress (user_id, text_id, paragraph_index, word_index, wpm, technique, chunk_size, font_size, guide_lines, blur_adjacents, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(user_id, text_id) DO UPDATE SET
              paragraph_index = excluded.paragraph_index,
              word_index = excluded.word_index,
              wpm = excluded.wpm,
              technique = excluded.technique,
              chunk_size = excluded.chunk_size,
              font_size = excluded.font_size,
              guide_lines = excluded.guide_lines,
              blur_adjacents = excluded.blur_adjacents,
              updated_at = excluded.updated_at`,
      args: [
        userId,
        textId,
        next.paragraphIndex,
        next.wordIndex,
        next.wpm,
        next.technique,
        next.chunkSize,
        next.fontSize,
        next.guideLines ? 1 : 0,
        next.blurAdjacents ? 1 : 0,
        new Date().toISOString(),
      ],
    });
    return { textId, ...next };
  }

  async function getPreferences(userId) {
    const result = await client.execute({
      sql: "SELECT * FROM user_preferences WHERE user_id = ?",
      args: [userId],
    });
    if (result.rows[0]) return rowToPreferences(result.rows[0]);
    await client.execute({
      sql: "INSERT INTO user_preferences (user_id, updated_at) VALUES (?, ?)",
      args: [userId, new Date().toISOString()],
    });
    return { ...DEFAULT_PREFERENCES };
  }

  async function savePreferences(userId, patch = {}) {
    const current = await getPreferences(userId);
    const next = {
      wpm: patch.wpm !== undefined ? Number(patch.wpm) : current.wpm,
      technique: patch.technique ?? current.technique,
      chunkSize:
        patch.chunkSize !== undefined
          ? Number(patch.chunkSize)
          : current.chunkSize,
      fontSize:
        patch.fontSize !== undefined
          ? Number(patch.fontSize)
          : current.fontSize,
      guideLines:
        patch.guideLines !== undefined
          ? Boolean(patch.guideLines)
          : current.guideLines,
      blurAdjacents:
        patch.blurAdjacents !== undefined
          ? Boolean(patch.blurAdjacents)
          : current.blurAdjacents,
    };
    await client.execute({
      sql: `INSERT INTO user_preferences (user_id, wpm, technique, chunk_size, font_size, guide_lines, blur_adjacents, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
              wpm = excluded.wpm,
              technique = excluded.technique,
              chunk_size = excluded.chunk_size,
              font_size = excluded.font_size,
              guide_lines = excluded.guide_lines,
              blur_adjacents = excluded.blur_adjacents,
              updated_at = excluded.updated_at`,
      args: [
        userId,
        next.wpm,
        next.technique,
        next.chunkSize,
        next.fontSize,
        next.guideLines ? 1 : 0,
        next.blurAdjacents ? 1 : 0,
        new Date().toISOString(),
      ],
    });
    return next;
  }

  async function seed(texts) {
    if (!texts.length) return;
    const now = new Date().toISOString();
    await client.batch(
      texts.map((text) => ({
        sql: `INSERT INTO texts (id, user_id, title, author, category, cover_color, content, created_at)
              VALUES (?, NULL, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(id) DO UPDATE SET
                title = excluded.title,
                author = excluded.author,
                category = excluded.category,
                cover_color = excluded.cover_color,
                content = excluded.content`,
        args: [
          text.id,
          text.title,
          text.author ?? "",
          text.category ?? "",
          text.coverColor ?? COVER_COLORS[0],
          text.content ?? (text.paragraphs ?? []).join("\n\n"),
          text.createdAt ?? now,
        ],
      })),
      "write",
    );
  }

  return {
    getUser,
    findUserByEmail,
    createUser,
    getStats,
    saveStats,
    clearStats,
    listTexts,
    getText,
    createText,
    deleteText,
    getProgress,
    saveProgress,
    getPreferences,
    savePreferences,
    seed,
    close: () => client.close(),
  };
}
