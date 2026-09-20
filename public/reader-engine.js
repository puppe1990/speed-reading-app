// Pure helpers for the reading techniques. No DOM access here so the logic
// stays testable and the app shell only wires events.

const PUNCTUATION = /[.,/#!$%^&*;:{}=_`~()?"'-]/g;
const LETTER = /[a-zA-Z0-9áéíóúâêîôûãõçÁÉÍÓÚÂÊÎÔÛÃÕÇ]/;

export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function toWords(paragraph) {
  return String(paragraph ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

export function chunkWords(words, size) {
  const chunks = [];
  for (let index = 0; index < words.length; index += size) {
    chunks.push(words.slice(index, index + size));
  }
  return chunks;
}

export function splitPeripheral(words) {
  const partSize = Math.max(1, Math.floor(words.length / 3));
  return {
    left: words.slice(0, partSize),
    middle: words.slice(partSize, words.length - partSize),
    right: words.slice(words.length - partSize),
  };
}

export function getOrpSplit(word) {
  if (!word) return { prefix: "", orp: "", suffix: "" };
  const length = word.replace(PUNCTUATION, "").length;
  let orpIndex = 4;
  if (length <= 1) orpIndex = 0;
  else if (length <= 5) orpIndex = 1;
  else if (length <= 9) orpIndex = 2;
  else if (length <= 13) orpIndex = 3;

  let mappedIndex = orpIndex;
  let lettersFound = 0;
  for (let index = 0; index < word.length; index++) {
    if (LETTER.test(word[index])) {
      if (lettersFound === orpIndex) {
        mappedIndex = index;
        break;
      }
      lettersFound++;
    }
  }
  if (mappedIndex >= word.length) mappedIndex = word.length - 1;
  if (mappedIndex < 0) mappedIndex = 0;
  return {
    prefix: word.slice(0, mappedIndex),
    orp: word.charAt(mappedIndex),
    suffix: word.slice(mappedIndex + 1),
  };
}

// How many focus units a paragraph holds before it is considered finished.
export function unitCount(words, technique, chunkSize) {
  if (technique === "chunking") return Math.ceil(words.length / chunkSize);
  if (technique === "peripheral") {
    return Math.max(4, Math.ceil(words.length / 5.5));
  }
  return words.length;
}

export function computeTickMs({ wpm, technique, chunkSize }) {
  const wordMs = 60000 / wpm;
  if (technique === "chunking") return wordMs * chunkSize;
  if (technique === "peripheral") return wordMs * 2.8;
  return wordMs;
}

function paragraphClasses(state, index) {
  const base =
    "reading-serif relative my-4 transform text-center leading-relaxed transition-all duration-300 ";
  if (index === state.paragraphIndex) {
    return `${base}text-white font-medium`;
  }
  if (index < state.paragraphIndex) {
    return state.blurAdjacents
      ? `${base}pointer-events-none blur-[1.5px] opacity-20`
      : `${base}opacity-40`;
  }
  return state.blurAdjacents
    ? `${base}pointer-events-none blur-[2px] opacity-15`
    : `${base}opacity-30`;
}

function renderChunks(words, activeIndex, chunkSize) {
  return chunkWords(words, chunkSize)
    .map((chunk, index) => {
      const active = index === activeIndex;
      const classes = active
        ? "inline-block rounded border border-cyan-500/50 bg-cyan-400/10 px-1.5 py-0.5 font-semibold text-cyan-300"
        : "inline-block border border-transparent px-1.5 py-0.5 text-white/60";
      return `<span class="${classes}">${escapeHtml(chunk.join(" "))}</span>`;
    })
    .join("");
}

function renderPeripheral(words, activeIndex) {
  const { left, middle, right } = splitPeripheral(words);
  const leftActive = activeIndex % 2 === 0;
  const highlight =
    "rounded border border-cyan-500/30 bg-cyan-400/10 px-1 font-semibold text-cyan-300";
  const plain = "text-white/60";
  return `<p class="px-4">
    <span class="${leftActive ? highlight : plain}">${escapeHtml(left.join(" "))}</span>
    <span class="text-white/40 opacity-70"> ${escapeHtml(middle.join(" "))} </span>
    <span class="${!leftActive ? highlight : plain}">${escapeHtml(right.join(" "))}</span>
  </p>`;
}

function renderSweep(words, activeIndex) {
  const spans = words
    .map((word, index) => {
      const active = index === activeIndex;
      const classes = active
        ? "relative px-1 font-bold text-cyan-300 transition-all duration-100"
        : "relative px-1 font-light text-white/70 transition-all duration-100";
      const underline = active
        ? '<span class="absolute -bottom-px left-0 right-0 h-[3px] animate-pulse rounded bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,1)]"></span>'
        : "";
      return `<span class="${classes}">${escapeHtml(word)}${underline}</span>`;
    })
    .join(" ");
  return `<span class="flex flex-wrap justify-center gap-x-1.5 px-4">${spans}</span>`;
}

function renderActiveParagraph(paragraph, state) {
  const words = toWords(paragraph);
  if (state.technique === "chunking") {
    return `<div class="relative inline-block max-w-full px-2 pb-2 pt-6"><div class="flex flex-wrap justify-center gap-x-2 gap-y-3">${renderChunks(words, state.wordIndex, state.chunkSize)}</div></div>`;
  }
  if (state.technique === "peripheral") {
    return `<div class="relative inline-block max-w-full px-2 pb-2 pt-6">${renderPeripheral(words, state.wordIndex)}</div>`;
  }
  return `<div class="relative inline-block max-w-full px-2 pb-2 pt-6">${renderSweep(words, state.wordIndex)}</div>`;
}

export function renderBoard({ paragraphs, state }) {
  const blocks = paragraphs
    .map((paragraph, index) => {
      const isActive = index === state.paragraphIndex;
      const content = isActive
        ? renderActiveParagraph(paragraph, state)
        : `<p class="px-4">${escapeHtml(paragraph)}</p>`;
      const badge = isActive
        ? '<span class="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-cyan-300/90">Linha ativa</span>'
        : "";
      return `<div id="paragraph-${index}" class="${paragraphClasses(state, index)}" style="font-size:${state.fontSize}rem">${badge}${content}</div>`;
    })
    .join("");
  return `<div id="scroll-container" class="reading-serif mx-auto flex h-full max-h-[560px] min-h-[200px] max-w-2xl flex-col overflow-hidden px-4 py-24 sm:px-6">${blocks}</div>`;
}

export function renderRsvp({ paragraph, wordIndex, fontSize }) {
  const words = toWords(paragraph);
  const word = words.length ? words[wordIndex % words.length] : "";
  const { prefix, orp, suffix } = getOrpSplit(word);
  const display = word
    ? `<div class="flex w-full items-center justify-center reading-mono font-medium text-white" style="font-size:${fontSize * 1.3}rem">
        <span class="w-[42%] truncate text-right text-white/50 reading-serif">${escapeHtml(prefix)}</span>
        <span class="w-[16%] text-center font-bold text-cyan-400">${escapeHtml(orp)}</span>
        <span class="w-[42%] truncate text-left text-white reading-serif">${escapeHtml(suffix)}</span>
      </div>`
    : '<span class="text-xl italic text-white/25">Preparando…</span>';

  return `<div class="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/[0.07] bg-white/[0.02] px-8 py-14 shadow-2xl">
    <div class="pointer-events-none absolute inset-y-10 left-1/2 w-px -translate-x-1/2 border-l border-dashed border-cyan-400/15"></div>
    <div class="relative mb-10 flex items-center justify-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-cyan-400/70">
      <span class="h-1.5 w-1.5 rounded-full bg-cyan-400"></span> Foco RSVP
    </div>
    <div class="relative flex items-center justify-center">${display}</div>
    <div class="relative mt-10 flex items-center justify-center gap-3 font-mono text-[10px] uppercase tracking-[0.16em] text-white/30">
      <span class="h-px w-8 bg-white/15"></span>
      Foco óptico no ponto de reconhecimento
      <span class="h-px w-8 bg-white/15"></span>
    </div>
  </div>`;
}
