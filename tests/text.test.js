// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  clampChunkSize,
  clampFontSize,
  clampWpm,
  techniqueOrDefault,
} from "../src/text.mjs";
import {
  chunkWords,
  computeTickMs,
  getOrpSplit,
  renderBoard,
  renderRsvp,
  splitPeripheral,
  toWords,
  unitCount,
} from "../public/reader-engine.js";

describe("clamps", () => {
  it("bounds wpm, chunk size and font size", () => {
    expect(clampWpm(50)).toBe(100);
    expect(clampWpm(5000)).toBe(1000);
    expect(clampWpm("abc")).toBe(450);
    expect(clampChunkSize(9)).toBe(3);
    expect(clampChunkSize(4)).toBe(4);
    expect(clampFontSize(5)).toBe(2);
    expect(clampFontSize(0)).toBe(0.7);
  });

  it("falls back to a known technique", () => {
    expect(techniqueOrDefault("rsvp")).toBe("rsvp");
    expect(techniqueOrDefault("nope")).toBe("chunking");
  });
});

describe("reader engine", () => {
  it("tokenizes and chunks words", () => {
    const words = toWords("  um   dois três ");
    expect(words).toEqual(["um", "dois", "três"]);
    expect(chunkWords(words, 2)).toEqual([["um", "dois"], ["três"]]);
  });

  it("splits peripheral groups", () => {
    const parts = splitPeripheral(toWords("a b c d e f"));
    expect(parts.left).toEqual(["a", "b"]);
    expect(parts.right).toEqual(["e", "f"]);
  });

  it("computes focus units and tick pacing per technique", () => {
    expect(unitCount(toWords("a b c d"), "sweep", 3)).toBe(4);
    expect(unitCount(toWords("a b c d"), "chunking", 2)).toBe(2);
    expect(unitCount(toWords("a b c d"), "peripheral", 3)).toBe(4);
    expect(
      computeTickMs({ wpm: 600, technique: "chunking", chunkSize: 3 }),
    ).toBe((60000 / 600) * 3);
  });

  it("finds the optimal recognition point", () => {
    expect(getOrpSplit("")).toEqual({ prefix: "", orp: "", suffix: "" });
    const split = getOrpSplit("palavra");
    expect(`${split.prefix}${split.orp}${split.suffix}`).toBe("palavra");
    expect(split.orp.length).toBe(1);
  });

  it("renders the board and escapes user content", () => {
    const html = renderBoard({
      paragraphs: ["<b>oi</b>", "segundo"],
      state: {
        paragraphIndex: 0,
        wordIndex: 0,
        technique: "sweep",
        chunkSize: 3,
        fontSize: 1,
        blurAdjacents: true,
      },
    });
    expect(html).not.toContain("<b>oi</b>");
    expect(html).toContain("&lt;b&gt;oi&lt;/b&gt;");
    expect(html).toContain('id="paragraph-1"');
  });

  it("renders the RSVP focus box", () => {
    const html = renderRsvp({
      paragraph: "foco total",
      wordIndex: 0,
      fontSize: 1,
    });
    expect(html).toContain("Foco óptico");
    expect(html).toContain("f");
  });
});
