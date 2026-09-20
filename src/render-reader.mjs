import { escapeHtml, FAVICON, jsonIsland } from "./html.mjs";
import { GENERAL_TIPS, readingLevel } from "./tips.mjs";

const TECHNIQUE_CARDS = [
  {
    id: "sweep",
    level: "Nível 1 · Iniciante",
    short: "Nível 1",
    name: "Varredura de Pacing",
    desc: "Guias conduzem o olhar sem retrocessos no texto.",
    within: (wpm) => wpm <= 275,
  },
  {
    id: "chunking",
    level: "Nível 2 · Intermediário",
    short: "Nível 2",
    name: "Agrupamento (Chunks)",
    desc: "Blocos de palavras ampliam o foco por fixação.",
    within: (wpm) => wpm > 275 && wpm <= 450,
  },
  {
    id: "peripheral",
    level: "Nível 3 · Avançado",
    short: "Nível 3",
    name: "Salto Periférico",
    desc: "Saltos rítmicos nas margens treinam a visão periférica.",
    within: (wpm) => wpm > 450 && wpm <= 600,
  },
  {
    id: "rsvp",
    level: "Nível 4 · Master",
    short: "Nível 4",
    name: "Foco Centrado RSVP",
    desc: "Palavra a palavra alinhada no ponto de reconhecimento.",
    within: (wpm) => wpm > 600,
  },
];

// One consistent, stroke-based icon set (currentColor) instead of emoji glyphs.
const ICON_PATHS = {
  library:
    '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/>',
  trophy:
    '<path d="M7 4h10v5a5 5 0 0 1-10 0Z"/><path d="M7 6H4v1a3 3 0 0 0 3 3"/><path d="M17 6h3v1a3 3 0 0 1-3 3"/><path d="M12 14v4"/><path d="M8.5 21h7"/>',
  play: '<path d="M7 4.5v15l13-7.5Z" fill="currentColor" stroke="none"/>',
  pause:
    '<rect x="7" y="5" width="4" height="14" rx="1.2" fill="currentColor" stroke="none"/><rect x="13" y="5" width="4" height="14" rx="1.2" fill="currentColor" stroke="none"/>',
  chevronLeft: '<path d="m15 6-6 6 6 6"/>',
  chevronRight: '<path d="m9 6 6 6-6 6"/>',
  reset: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 13 9 5 9-5"/>',
  type: '<path d="M4 7V5h16v2"/><path d="M9 19h6"/><path d="M12 5v14"/>',
  columns:
    '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M12 4v16"/>',
  focus:
    '<circle cx="12" cy="12" r="3"/><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21"/>',
  sparkles:
    '<path d="M12 3.5 13.8 9 19 10.8 13.8 12.6 12 18l-1.8-5.4L5 10.8 10.2 9Z"/>',
  bookmark: '<path d="M6 3.5h12v17l-6-4-6 4Z"/>',
};

function icon(name, className = "h-4 w-4") {
  return `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON_PATHS[name] ?? ""}</svg>`;
}

const ACTIVE_TECH =
  "border-cyan-400/50 bg-cyan-400/10 shadow-[0_0_0_1px_rgba(34,211,238,0.15)]";
const IDLE_TECH =
  "border-white/[0.06] bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]";

function renderTechniqueButton(card, { technique, wpm }) {
  const active = technique === card.id;
  const recommended = card.within(wpm)
    ? '<span class="hidden rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-300 sm:inline-block">Recomendado</span><span class="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400 sm:hidden" title="Recomendado"></span>'
    : "";
  return `<button type="button" data-technique="${card.id}" class="h-full w-full rounded-2xl border p-3 text-left transition-all ${active ? ACTIVE_TECH : IDLE_TECH}">
    <div class="flex items-center justify-between gap-x-2">
      <span class="truncate font-mono text-[9px] font-semibold uppercase tracking-[0.14em] ${active ? "text-cyan-300" : "text-cyan-400/60"}"><span class="sm:hidden">${card.short}</span><span class="hidden sm:inline">${card.level}</span></span>
      ${recommended}
    </div>
    <h4 class="mt-1.5 text-[13px] font-semibold ${active ? "text-white" : "text-white/80"}">${card.name}</h4>
    <p class="mt-0.5 hidden text-[11px] leading-snug text-white/40 sm:block">${card.desc}</p>
  </button>`;
}

// Desktop sidebar: the progressive reading levels live on the left.
function renderSidebar({ progress }) {
  const cards = TECHNIQUE_CARDS.map(
    (card) =>
      `<div>${renderTechniqueButton(card, { technique: progress.technique, wpm: progress.wpm })}</div>`,
  ).join("");
  return `<aside class="hidden w-60 shrink-0 flex-col border-r border-white/[0.06] bg-white/[0.01] lg:flex xl:w-72">
    <div class="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
      <span class="text-cyan-400/70">${icon("layers", "h-4 w-4")}</span>
      <h2 class="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">Níveis de leitura</h2>
    </div>
    <div class="flex-1 space-y-2.5 overflow-y-auto p-3">${cards}</div>
    <div class="border-t border-white/[0.06] px-4 py-3 text-[10px] leading-relaxed text-white/30">Escolha o nível e ajuste a velocidade para treinar por progressão.</div>
  </aside>`;
}

// Mobile/tablet: horizontal scroll row above the transport controls.
function renderTechniqueRow(progress) {
  return TECHNIQUE_CARDS.map(
    (card) =>
      `<div class="w-[154px] shrink-0 snap-start">${renderTechniqueButton(card, { technique: progress.technique, wpm: progress.wpm })}</div>`,
  ).join("");
}

function renderLibraryItem(text, activeTextId) {
  const isActive = text.id === activeTextId;
  const ownership = text.shared ? "Biblioteca" : "Meu texto";
  const action = isActive
    ? `<span class="flex items-center gap-1.5 rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-cyan-300">${icon("play", "h-3 w-3")} Ativo</span>`
    : `<a href="/?text=${encodeURIComponent(text.id)}" class="rounded-lg border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-white/80 transition hover:border-white/25 hover:bg-white hover:text-black">Ler</a>`;
  const remove = text.shared
    ? ""
    : `<form action="/api/texts/${encodeURIComponent(text.id)}/delete" method="post" onsubmit="return confirm('Remover este texto?')">
        <button type="submit" title="Remover texto" class="flex h-8 w-8 items-center justify-center rounded-lg border border-red-400/20 bg-red-400/5 text-red-400/80 transition hover:bg-red-400/15 hover:text-red-300">${icon("close", "h-3.5 w-3.5")}</button>
      </form>`;

  return `<div class="flex min-w-0 items-center justify-between gap-3 overflow-hidden rounded-2xl border ${isActive ? "border-cyan-400/40 bg-cyan-400/[0.07]" : "border-white/[0.06] bg-white/[0.02]"} p-3">
    <div class="flex min-w-0 flex-1 items-center gap-3">
      <div class="flex h-11 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-gradient-to-br ${text.coverColor} text-sm font-bold text-white">${escapeHtml(text.title.charAt(0).toUpperCase())}</div>
      <div class="min-w-0">
        <h4 class="truncate text-sm font-semibold text-white">${escapeHtml(text.title)}</h4>
        <p class="truncate text-xs text-white/45">${escapeHtml(text.author)}</p>
        <div class="mt-0.5 flex min-w-0 items-center gap-2">
          <span class="min-w-0 truncate text-[10px] uppercase tracking-wide text-cyan-400/70">${escapeHtml(text.category)}</span>
          <span class="shrink-0 text-[9px] uppercase tracking-wide text-white/25">${ownership}</span>
        </div>
      </div>
    </div>
    <div class="flex shrink-0 items-center gap-2">${action}${remove}</div>
  </div>`;
}

export function filterTexts(texts, query) {
  const needle = String(query ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
  if (!needle) return texts;
  return texts.filter((text) =>
    `${text.title} ${text.author} ${text.category}`
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .includes(needle),
  );
}

export function renderLibraryPanel({ texts = [], activeTextId = "" } = {}) {
  if (texts.length === 0) {
    return '<p class="py-10 text-center text-sm text-white/40">Nenhum texto encontrado para essa busca.</p>';
  }
  return `<div class="grid gap-2.5">${texts
    .map((text) => renderLibraryItem(text, activeTextId))
    .join("")}</div>`;
}

function statCard(label, value, unit) {
  return `<div class="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3.5 text-center">
    <p class="text-[10px] uppercase tracking-[0.12em] text-white/40">${label}</p>
    <p class="mt-1 font-mono text-xl font-bold text-cyan-300">${value}${unit ? ` <span class="text-[10px] font-normal text-white/35">${unit}</span>` : ""}</p>
  </div>`;
}

function renderStatsTab(stats) {
  const level = readingLevel(stats);
  const dots = [1, 2, 3, 4]
    .map(
      (dot) =>
        `<span class="h-1.5 w-1.5 rounded-full ${dot <= level.dots ? "bg-cyan-400" : "bg-white/10"}"></span>`,
    )
    .join("");

  return `<div class="space-y-6">
    <div class="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
      ${statCard("Textos concluídos", stats.completedTexts)}
      ${statCard("Minutos", stats.totalMinutes)}
      ${statCard("Veloc. média", stats.averageWpm, "wpm")}
      ${statCard("Veloc. pico", stats.highestWpm, "wpm")}
    </div>
    <div class="flex flex-col gap-3 rounded-2xl border ${level.color} p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div class="mb-1 flex items-center gap-2">
          <span class="font-mono text-[9px] font-bold uppercase tracking-[0.14em] opacity-60">Seu domínio de leitura</span>
          <div class="flex gap-1">${dots}</div>
        </div>
        <h4 class="text-sm font-bold tracking-wide text-white">${level.name}</h4>
        <p class="mt-0.5 text-[11px] leading-relaxed text-white/55">${level.desc}</p>
      </div>
      <div class="shrink-0 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center font-mono text-[10px] uppercase tracking-wider text-white/45">Pico · ${stats.highestWpm} wpm</div>
    </div>
    <div class="flex justify-end">
      <form action="/api/stats/clear" method="post">
        <button type="submit" class="rounded-lg border border-white/10 px-3 py-1.5 text-[10px] uppercase tracking-wide text-white/35 transition hover:border-red-400/30 hover:text-red-400">Zerar estatísticas</button>
      </form>
    </div>
    <div>
      <h3 class="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-white/40">${icon("sparkles", "h-3.5 w-3.5 text-cyan-400/70")} Técnicas de leitura rápida</h3>
      <div class="grid gap-2.5">
        ${GENERAL_TIPS.map(
          (
            tip,
            index,
          ) => `<div class="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.01] p-3.5">
            <div class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-400/10 text-[10px] font-bold text-cyan-300">${index + 1}</div>
            <div><h4 class="text-[13px] font-semibold text-white">${tip.title}</h4><p class="mt-0.5 text-xs text-white/50">${tip.description}</p></div>
          </div>`,
        ).join("")}
      </div>
    </div>
  </div>`;
}

function renderHeader({ user, text, wpm }) {
  const initial = escapeHtml((user.name || "?").charAt(0).toUpperCase());
  return `<header class="relative z-40 flex items-center justify-between gap-4 border-b border-white/[0.06] bg-[#070709]/85 px-4 py-3 backdrop-blur-md sm:px-6">
    <div class="flex min-w-0 items-center gap-3">
      <button id="btn-open-library" title="Biblioteca de textos" class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-cyan-400 transition hover:border-cyan-400/40 hover:bg-cyan-400/10">${icon("library", "h-5 w-5")}</button>
      <div class="min-w-0">
        <span class="inline-block rounded-full bg-cyan-400/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-cyan-300">Lendo agora</span>
        <p class="mt-1 truncate text-sm font-semibold text-white sm:text-[15px]">${escapeHtml(text.title)}</p>
        <p class="hidden truncate text-[11px] text-white/45 sm:block">${escapeHtml(text.author)} · <span class="text-cyan-400/70">${escapeHtml(text.category)}</span></p>
      </div>
    </div>
    <div class="flex shrink-0 items-center gap-2 sm:gap-3">
      <div class="flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1">
        <button id="btn-wpm-dec" title="Menos 25 WPM" class="flex h-7 w-7 items-center justify-center rounded-lg text-white/50 transition hover:bg-white/10 hover:text-white">${icon("minus", "h-3.5 w-3.5")}</button>
        <p class="px-2 text-center font-mono text-base font-semibold text-white sm:text-lg"><span id="wpm-value">${wpm}</span> <span class="font-sans text-[10px] font-normal uppercase tracking-wide text-white/35">wpm</span></p>
        <button id="btn-wpm-inc" title="Mais 25 WPM" class="flex h-7 w-7 items-center justify-center rounded-lg text-white/50 transition hover:bg-white/10 hover:text-white">${icon("plus", "h-3.5 w-3.5")}</button>
      </div>
      <button id="btn-open-stats" title="Estatísticas e dicas" class="hidden h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white/60 transition hover:border-amber-400/40 hover:bg-amber-400/10 hover:text-amber-300 sm:flex">${icon("trophy", "h-5 w-5")}</button>
      <div class="hidden items-center gap-2 border-l border-white/10 pl-3 sm:flex">
        <div class="text-right leading-tight">
          <p class="max-w-[120px] truncate text-xs font-semibold text-white/80">${escapeHtml(user.name)}</p>
          <a href="/logout" class="text-[10px] uppercase tracking-wide text-white/35 transition hover:text-red-400">Sair</a>
        </div>
        <div class="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-xs font-bold text-white">${initial}</div>
      </div>
    </div>
    <div id="progress-bar" class="absolute bottom-0 left-0 h-0.5 w-0 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)] transition-all duration-300"></div>
  </header>`;
}

function renderStatusBar({ progress, stats, totalParagraphs }) {
  return `<div class="relative z-30 flex items-center justify-center gap-4 border-b border-white/[0.04] bg-white/[0.01] px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-white/35 sm:gap-8 sm:px-6">
    <span>Foco <strong id="technique-label" class="text-cyan-300">${progress.technique}</strong></span>
    <span class="hidden h-3 w-px bg-white/10 sm:block"></span>
    <span>Parágrafo <strong id="paragraph-indicator" class="text-white/70">${progress.paragraphIndex + 1}/${totalParagraphs}</strong></span>
    <span class="hidden h-3 w-px bg-white/10 sm:block"></span>
    <span>Recorde <strong id="highest-wpm" class="text-white/70">${stats.highestWpm} WPM</strong></span>
  </div>`;
}

function renderControls({ progress }) {
  const techniques = renderTechniqueRow(progress);
  const chunks = [2, 3, 4]
    .map(
      (size) =>
        `<button type="button" data-chunk="${size}" class="${size === progress.chunkSize ? "bg-cyan-400/20 text-cyan-300" : "text-white/40 hover:text-white"} rounded-md px-2 py-0.5 font-mono text-[11px] font-bold transition">${size}</button>`,
    )
    .join("");
  const chunkVisibility = progress.technique === "chunking" ? "flex" : "hidden";
  const toggleChip = (id, label, name, active) =>
    `<button id="${id}" aria-pressed="${active}" class="flex shrink-0 items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-medium transition ${
      active
        ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-300"
        : "border-white/10 bg-white/[0.03] text-white/50 hover:text-white"
    }">${icon(name, "h-3.5 w-3.5")} ${label}</button>`;

  const settings = `
          <div id="chunk-group" class="${chunkVisibility} shrink-0 items-center gap-1 rounded-xl border border-white/10 bg-white/[0.03] px-2.5 py-1.5">
            <span class="mr-1 flex items-center gap-1 text-[10px] uppercase tracking-wide text-white/40">${icon("layers", "h-3.5 w-3.5")} Chunk</span>${chunks}
          </div>
          <div class="flex shrink-0 items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-2.5 py-1.5">
            <span class="mr-0.5 text-white/40">${icon("type", "h-3.5 w-3.5")}</span>
            <button id="btn-font-dec" class="flex h-6 w-6 items-center justify-center rounded-md text-white/50 transition hover:bg-white/10 hover:text-white" title="Diminuir fonte">−</button>
            <span id="font-value" class="min-w-[38px] text-center font-mono text-[11px] font-bold text-cyan-300">${Math.round(progress.fontSize * 100)}%</span>
            <button id="btn-font-inc" class="flex h-6 w-6 items-center justify-center rounded-md text-white/50 transition hover:bg-white/10 hover:text-white" title="Aumentar fonte">+</button>
          </div>
          ${toggleChip("toggle-guides", "Guias", "columns", progress.guideLines)}
          ${toggleChip("toggle-blur", "Foco", "focus", progress.blurAdjacents)}`;

  return `<footer class="z-30 border-t border-white/[0.06] bg-[#070709]/95 px-4 py-3 sm:px-6 lg:py-4">
    <div class="mx-auto flex max-w-5xl flex-col gap-3 lg:gap-4">
      <div class="-mx-1 flex snap-x gap-2.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] lg:hidden">${techniques}</div>
      <div class="flex flex-col items-center gap-3 border-t border-white/[0.06] pt-3 lg:grid lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-center lg:gap-4 lg:border-t-0 lg:pt-0">
        <div class="hidden items-center justify-start gap-2 overflow-hidden text-[10px] uppercase tracking-[0.12em] text-white/30 xl:flex">
          <span class="inline-flex items-center gap-1.5 whitespace-nowrap"><kbd class="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-white/50">Espaço</kbd> pausar</span>
          <span class="text-white/15">·</span>
          <span class="inline-flex items-center gap-1.5 whitespace-nowrap"><kbd class="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-white/50">← →</kbd> pular</span>
          <span class="text-white/15">·</span>
          <span class="inline-flex items-center gap-1.5 whitespace-nowrap"><kbd class="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-white/50">↑ ↓</kbd> wpm</span>
        </div>
        <div class="flex items-center gap-3">
          <button id="btn-prev" title="Parágrafo anterior" class="flex h-10 w-10 items-center justify-center rounded-full text-white/45 transition hover:bg-white/5 hover:text-white active:scale-90">${icon("chevronLeft", "h-5 w-5")}</button>
          <button id="btn-play" title="Play / Pause" class="flex h-14 w-14 items-center justify-center rounded-full bg-cyan-400 text-black shadow-[0_8px_30px_rgba(34,211,238,0.35)] transition hover:bg-cyan-300 active:scale-95 lg:h-16 lg:w-16"><span id="icon-play">${icon("play", "h-6 w-6")}</span><span id="icon-pause" class="hidden">${icon("pause", "h-6 w-6")}</span></button>
          <button id="btn-next" title="Próximo parágrafo" class="flex h-10 w-10 items-center justify-center rounded-full text-white/45 transition hover:bg-white/5 hover:text-white active:scale-90">${icon("chevronRight", "h-5 w-5")}</button>
          <button id="btn-reset" title="Reiniciar leitura" class="ml-1 flex h-10 w-10 items-center justify-center rounded-full text-white/45 transition hover:bg-white/5 hover:text-white active:scale-90">${icon("reset", "h-4 w-4")}</button>
        </div>
        <div class="-mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] lg:mx-0 lg:flex-wrap lg:justify-end lg:overflow-visible lg:px-0 lg:pb-0">${settings}</div>
      </div>
    </div>
  </footer>`;
}

function renderLibraryModal({ texts, activeTextId, stats }) {
  const tab = (name, label, nameIcon) =>
    `<button data-tab="${name}" class="flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-2 py-2 text-xs font-medium transition sm:px-3 sm:text-[13px]"><span class="tab-icon">${icon(nameIcon, "h-4 w-4")}</span>${label}</button>`;
  return `<div id="library-modal" class="fixed inset-0 z-50 hidden select-none bg-black/70 p-4 backdrop-blur-md">
    <div class="absolute inset-0" data-close-library></div>
    <div class="relative z-10 mx-auto flex h-[86vh] max-h-[660px] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0b0d10] shadow-2xl">
      <div class="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
        <div class="flex items-center gap-3">
          <div class="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-400/25 bg-cyan-400/10 text-cyan-300">${icon("bookmark", "h-4 w-4")}</div>
          <div>
            <h2 class="text-[15px] font-bold tracking-wide text-white">Painel do leitor</h2>
            <p class="text-[11px] text-white/40">Textos, técnicas e métricas</p>
          </div>
        </div>
        <button id="btn-close-library" class="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white/55 transition hover:bg-white/10 hover:text-white">${icon("close", "h-4 w-4")}</button>
      </div>
      <div class="flex gap-1.5 border-b border-white/[0.06] bg-black/20 p-2.5">
        ${tab("library", "Biblioteca", "library")}
        ${tab("add", "Adicionar", "plus")}
        ${tab("stats", "Progresso", "trophy")}
      </div>
      <div data-panel="library" class="flex-1 overflow-y-auto p-5 md:p-6">
        <form id="library-search" class="relative mb-4" hx-get="/api/library" hx-target="#library-panel" hx-swap="innerHTML" hx-trigger="input changed delay:250ms from:#library-q, search from:#library-q">
          <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/30"><svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></svg></span>
          <input id="library-q" name="q" type="search" placeholder="Buscar por título, autor ou categoria…" autocomplete="off" class="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2.5 pl-9 pr-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-cyan-400/50 focus:bg-white/[0.05]" />
        </form>
        <div id="library-panel">${renderLibraryPanel({ texts, activeTextId })}</div>
      </div>
      <div data-panel="add" class="hidden flex-1 overflow-y-auto p-5 md:p-6">
        <form action="/api/texts" method="post" class="space-y-4">
          <p class="rounded-xl border border-cyan-400/10 bg-cyan-400/[0.05] p-3.5 text-xs leading-relaxed text-white/60">Cole qualquer notícia, artigo ou texto pessoal. Os parágrafos de treino são gerados automaticamente.</p>
          <label class="block"><span class="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-white/45">Título *</span>
            <input name="title" required placeholder="Ex: Artigo sobre foco" class="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-cyan-400/50" /></label>
          <label class="block"><span class="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-white/45">Autor (opcional)</span>
            <input name="author" placeholder="Ex: Dr. Silva" class="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-cyan-400/50" /></label>
          <label class="block"><span class="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-white/45">Texto completo *</span>
            <textarea name="content" rows="7" required placeholder="Cole aqui o texto inteiro…" class="w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-cyan-400/50"></textarea></label>
          <button type="submit" class="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 py-3 text-sm font-bold text-black transition hover:bg-cyan-300 active:scale-[0.99]">${icon("plus", "h-4 w-4")} Adicionar e treinar leitura</button>
        </form>
      </div>
      <div data-panel="stats" class="hidden flex-1 overflow-y-auto p-5 md:p-6">${renderStatsTab(stats)}</div>
      <div class="flex items-center justify-between gap-3 border-t border-white/[0.06] bg-black/30 px-5 py-3">
        <span class="truncate font-mono text-[10px] text-white/25">Leitor Dinâmico Imersivo · v2.0</span>
        <a href="/logout" class="shrink-0 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-white/60 transition hover:border-red-400/30 hover:text-red-400">Sair</a>
      </div>
    </div>
  </div>`;
}

export function renderReaderPage({ user, texts, text, progress, stats }) {
  const island = {
    text: {
      id: text.id,
      title: text.title,
      author: text.author,
      category: text.category,
      paragraphs: text.paragraphs,
    },
    progress: {
      paragraphIndex: progress.paragraphIndex,
      wordIndex: progress.wordIndex,
      wpm: progress.wpm,
      technique: progress.technique,
      chunkSize: progress.chunkSize,
      fontSize: progress.fontSize,
      guideLines: progress.guideLines,
      blurAdjacents: progress.blurAdjacents,
    },
    stats: {
      completedTexts: stats.completedTexts,
      totalMinutes: stats.totalMinutes,
      averageWpm: stats.averageWpm,
      highestWpm: stats.highestWpm,
    },
  };

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(text.title)} · Leitor Dinâmico Imersivo</title>
    <link rel="icon" href="${FAVICON}" />
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/htmx.org@2.0.4"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400..700;1,400..700&family=JetBrains+Mono:wght@300;400;500;600&display=swap" rel="stylesheet" />
    <style>
      :root { color-scheme: dark; }
      body { font-family: "Inter", ui-sans-serif, system-ui, sans-serif; }
      .reading-serif { font-family: "Playfair Display", Georgia, serif; }
      .reading-mono { font-family: "JetBrains Mono", ui-monospace, monospace; }
      /* Short viewports (landscape phones): keep a usable stage and allow scroll. */
      @media (max-height: 620px) {
        body { overflow-y: auto; }
        .app-shell { height: auto; min-height: 600px; }
      }
      ::-webkit-scrollbar { width: 6px; height: 6px; }
      ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
      ::-webkit-scrollbar-thumb:hover { background: rgba(6,182,212,0.35); }
    </style>
  </head>
  <body class="h-screen w-screen overflow-hidden bg-[#070709] text-[#e7e9ee]">
    <script id="reader-data" type="application/json">${jsonIsland(island)}</script>
    <div class="app-shell flex h-full flex-col">
      ${renderHeader({ user, text, wpm: progress.wpm })}
      ${renderStatusBar({ progress, stats, totalParagraphs: text.paragraphs.length })}
      <div class="flex min-h-0 flex-1 overflow-hidden">
        ${renderSidebar({ progress })}
        <div class="flex min-w-0 flex-1 flex-col">
          <main class="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-6">
            <div class="pointer-events-none absolute left-0 right-0 top-0 z-10 h-24 bg-gradient-to-b from-[#070709] to-transparent"></div>
            <div class="pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-24 bg-gradient-to-t from-[#070709] to-transparent"></div>
            <div id="guides" class="${progress.guideLines ? "" : "hidden"}">
              <div class="pointer-events-none absolute bottom-0 left-[14%] top-0 z-10 border-l border-dashed border-cyan-400/20 sm:left-[20%]"></div>
              <div class="pointer-events-none absolute bottom-0 right-[14%] top-0 z-10 border-r border-dashed border-cyan-400/20 sm:right-[20%]"></div>
              <div class="pointer-events-none absolute left-2 top-1/2 z-20 h-0.5 w-6 -translate-y-1/2 rounded-full bg-cyan-400/60 shadow-[0_0_12px_rgba(34,211,238,0.9)] sm:left-4 md:left-12 sm:w-10"></div>
              <div class="pointer-events-none absolute right-2 top-1/2 z-20 h-0.5 w-6 -translate-y-1/2 rounded-full bg-cyan-400/60 shadow-[0_0_12px_rgba(34,211,238,0.9)] sm:right-4 md:right-12 sm:w-10"></div>
            </div>
            <div id="reading-stage" class="relative z-20 flex h-full w-full max-w-3xl items-center justify-center"></div>
            <div id="pause-badge" class="absolute right-4 top-4 z-30 hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 backdrop-blur">
              <span class="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
              <span class="font-mono text-[10px] uppercase tracking-[0.14em] text-white/50">Pausado</span>
            </div>
          </main>
          ${renderControls({ progress })}
        </div>
      </div>
    </div>
    ${renderLibraryModal({ texts, activeTextId: text.id, stats })}
    <div id="toast" class="pointer-events-none fixed bottom-5 left-1/2 z-[60] -translate-x-1/2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white opacity-0 shadow-xl backdrop-blur transition-opacity"></div>
    <script type="module" src="/app.js"></script>
  </body>
</html>`;
}

export function renderEmptyLibraryPage({ user }) {
  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Sem textos · Leitor Dinâmico Imersivo</title>
    <link rel="icon" href="${FAVICON}" />
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body class="flex min-h-screen items-center justify-center bg-[#070709] p-4 text-[#e7e9ee]">
    <div class="w-full max-w-md rounded-3xl border border-white/[0.08] bg-white/[0.02] p-8 text-center">
      <h1 class="text-xl font-bold text-white">Nenhum texto disponível</h1>
      <p class="mt-2 text-sm text-white/50">Olá, ${escapeHtml(user.name)}. Adicione um texto para começar a treinar sua leitura dinâmica.</p>
      <a href="/logout" class="mt-6 inline-block text-xs uppercase tracking-wide text-white/35 transition hover:text-red-400">Sair</a>
    </div>
  </body>
</html>`;
}

export { renderStatsTab };
