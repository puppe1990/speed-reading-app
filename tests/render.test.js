// @vitest-environment node
import { describe, expect, it } from "vitest";
import { escapeHtml } from "../src/html.mjs";
import { splitParagraphs } from "../src/text.mjs";
import { readingLevel, GENERAL_TIPS } from "../src/tips.mjs";
import { renderAuthPage } from "../src/render-auth.mjs";
import {
  filterTexts,
  renderLibraryPanel,
  renderReaderPage,
  renderStatsTab,
} from "../src/render-reader.mjs";

const ownedText = {
  id: "t1",
  title: 'Título "x" & <b>y</b>',
  author: "Ana",
  category: "Base",
  coverColor: "from-cyan-500 to-blue-600",
  paragraphs: ["Um.", "Dois."],
  shared: false,
  userId: "u1",
};
const sharedText = {
  ...ownedText,
  id: "t2",
  title: "Compartilhado",
  shared: true,
};
const user = { id: "u1", name: "Ana & Bia", email: "a@b.com" };
const progress = {
  paragraphIndex: 0,
  wordIndex: 0,
  wpm: 450,
  technique: "chunking",
  chunkSize: 3,
  fontSize: 1.15,
  guideLines: true,
  blurAdjacents: true,
};
const stats = {
  completedTexts: 1,
  totalMinutes: 2,
  averageWpm: 300,
  highestWpm: 500,
};

describe("escapeHtml", () => {
  it("escapes dangerous characters", () => {
    expect(escapeHtml('<a href="x">&\'</a>')).toBe(
      "&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;",
    );
  });
});

describe("splitParagraphs", () => {
  it("splits on blank lines", () => {
    expect(splitParagraphs("Um.\n\nDois.\n\n\nTrês.")).toEqual([
      "Um.",
      "Dois.",
      "Três.",
    ]);
  });

  it("falls back to single newlines and trims", () => {
    expect(splitParagraphs("  Um.  \n  Dois. ")).toEqual(["Um.", "Dois."]);
    expect(splitParagraphs("")).toEqual([]);
  });
});

describe("renderAuthPage", () => {
  it("renders the sign in form", () => {
    const html = renderAuthPage({ mode: "signin" });
    expect(html).toContain('action="/api/login"');
    expect(html).toContain('name="email"');
    expect(html).toContain('href="/signup"');
  });

  it("renders the sign up form with confirm and errors", () => {
    const html = renderAuthPage({
      mode: "signup",
      values: { name: "Ana", email: "a@b.com" },
      errors: ["Senha curta"],
    });
    expect(html).toContain('action="/api/register"');
    expect(html).toContain('name="confirm"');
    expect(html).toContain("Senha curta");
    expect(html).toContain('value="Ana"');
  });
});

describe("renderLibraryPanel", () => {
  it("escapes titles and marks the active text", () => {
    const html = renderLibraryPanel({
      texts: [ownedText, sharedText],
      activeTextId: "t1",
    });
    expect(html).not.toContain("<b>y</b>");
    expect(html).toContain("&lt;b&gt;y&lt;/b&gt;");
    expect(html).toContain("Ativo");
    expect(html).toContain('href="/?text=t2"');
  });

  it("only offers delete for owned texts", () => {
    expect(renderLibraryPanel({ texts: [ownedText] })).toContain("/delete");
    expect(renderLibraryPanel({ texts: [sharedText] })).not.toContain(
      "/delete",
    );
  });

  it("renders an empty state", () => {
    expect(renderLibraryPanel({ texts: [] })).toContain(
      "Nenhum texto encontrado",
    );
  });
});

describe("filterTexts", () => {
  it("matches ignoring accents and case", () => {
    const texts = [{ title: "Coração", author: "A", category: "" }];
    expect(filterTexts(texts, "CORACAO")).toHaveLength(1);
    expect(filterTexts(texts, "zzz")).toHaveLength(0);
    expect(filterTexts(texts, "")).toHaveLength(1);
  });
});

describe("renderReaderPage", () => {
  it("renders the reader shell, escaped user data and the data island", () => {
    const html = renderReaderPage({
      user,
      texts: [ownedText],
      text: ownedText,
      progress,
      stats,
    });
    expect(html).toContain('id="reader-data"');
    expect(html).toContain('src="/app.js"');
    expect(html).toContain('id="reading-stage"');
    expect(html).toContain("Ana &amp; Bia");
    expect(html).not.toContain("<b>y</b>");
  });
});

describe("renderStatsTab", () => {
  it("includes the level badge and tips", () => {
    const html = renderStatsTab(stats);
    expect(html).toContain("Nível 3 • Avançado");
    expect(html).toContain(GENERAL_TIPS[0].title);
  });
});

describe("readingLevel", () => {
  it("maps highest wpm to a level", () => {
    expect(readingLevel({ highestWpm: 100 }).dots).toBe(1);
    expect(readingLevel({ highestWpm: 300 }).dots).toBe(2);
    expect(readingLevel({ highestWpm: 500 }).dots).toBe(3);
    expect(readingLevel({ highestWpm: 700 }).dots).toBe(4);
  });
});
