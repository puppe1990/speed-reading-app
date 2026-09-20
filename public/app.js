import {
  computeTickMs,
  renderBoard,
  renderRsvp,
  toWords,
  unitCount,
} from "/reader-engine.js";

const TECH_ACTIVE =
  "group h-full w-full rounded-2xl border p-3 text-left transition-all border-cyan-400/50 bg-cyan-400/10 shadow-[0_0_0_1px_rgba(34,211,238,0.15)]";
const TECH_IDLE =
  "group h-full w-full rounded-2xl border p-3 text-left transition-all border-white/[0.06] bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]";
const TAB_ACTIVE =
  "flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-cyan-400/35 bg-cyan-400/15 px-3 py-2 text-[13px] font-medium text-cyan-300";
const TAB_IDLE =
  "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium text-white/50 transition hover:bg-white/5 hover:text-white";
const CHUNK_ACTIVE =
  "rounded-md bg-cyan-400/20 px-2 py-0.5 font-mono text-[11px] font-bold text-cyan-300 transition";
const CHUNK_IDLE =
  "rounded-md px-2 py-0.5 font-mono text-[11px] font-bold text-white/40 transition hover:text-white";

const island = JSON.parse(document.getElementById("reader-data").textContent);
const paragraphs = island.text.paragraphs;

const state = {
  textId: island.text.id,
  paragraphIndex: island.progress.paragraphIndex,
  wordIndex: island.progress.wordIndex,
  wpm: island.progress.wpm,
  technique: island.progress.technique,
  chunkSize: island.progress.chunkSize,
  fontSize: island.progress.fontSize,
  guideLines: island.progress.guideLines,
  blurAdjacents: island.progress.blurAdjacents,
  isPlaying: false,
};

const el = (id) => document.getElementById(id);
const stage = el("reading-stage");
const modal = el("library-modal");
const toastEl = el("toast");

let timer = null;
let saveTimer = null;
let minuteTimer = null;
let pendingMinutes = 0;

function applyToggle(button, active) {
  button.setAttribute("aria-pressed", String(active));
  button.classList.toggle("border-cyan-400/40", active);
  button.classList.toggle("bg-cyan-400/10", active);
  button.classList.toggle("text-cyan-300", active);
  button.classList.toggle("border-white/10", !active);
  button.classList.toggle("bg-white/[0.03]", !active);
  button.classList.toggle("text-white/50", !active);
}

function updateChrome() {
  el("wpm-value").textContent = String(state.wpm);
  el("font-value").textContent = `${Math.round(state.fontSize * 100)}%`;
  el("technique-label").textContent = state.technique;
  el("paragraph-indicator").textContent =
    `${state.paragraphIndex + 1}/${paragraphs.length}`;
  const percent = paragraphs.length
    ? (state.paragraphIndex / paragraphs.length) * 100
    : 0;
  el("progress-bar").style.width = `${percent}%`;
  el("icon-play").classList.toggle("hidden", state.isPlaying);
  el("icon-pause").classList.toggle("hidden", !state.isPlaying);
  el("pause-badge").classList.toggle("hidden", state.isPlaying);
  el("chunk-group").classList.toggle("hidden", state.technique !== "chunking");
  document.querySelectorAll("[data-technique]").forEach((button) => {
    button.className =
      button.dataset.technique === state.technique ? TECH_ACTIVE : TECH_IDLE;
  });
  document.querySelectorAll("[data-chunk]").forEach((button) => {
    const active = Number(button.dataset.chunk) === state.chunkSize;
    button.className = active ? CHUNK_ACTIVE : CHUNK_IDLE;
  });
  el("guides").classList.toggle("hidden", !state.guideLines);
  applyToggle(el("toggle-guides"), state.guideLines);
  applyToggle(el("toggle-blur"), state.blurAdjacents);
}

function render(recenter) {
  if (state.technique === "rsvp") {
    stage.innerHTML = renderRsvp({
      paragraph: paragraphs[state.paragraphIndex] ?? "",
      wordIndex: state.wordIndex,
      fontSize: state.fontSize,
    });
    updateChrome();
    return;
  }
  const previous = stage.querySelector("#scroll-container");
  const previousTop = previous ? previous.scrollTop : 0;
  stage.innerHTML = renderBoard({ paragraphs, state });
  const container = stage.querySelector("#scroll-container");
  if (container) {
    if (recenter) {
      const active = container.querySelector(
        `#paragraph-${state.paragraphIndex}`,
      );
      if (active) {
        container.scrollTop =
          active.offsetTop -
          container.clientHeight / 2 +
          active.clientHeight / 2;
      }
    } else {
      container.scrollTop = previousTop;
    }
  }
  updateChrome();
}

function persist() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(sendProgress, 700);
}

function sendProgress() {
  const minutes = pendingMinutes;
  pendingMinutes = 0;
  const payload = {
    textId: state.textId,
    paragraphIndex: state.paragraphIndex,
    wordIndex: state.wordIndex,
    wpm: state.wpm,
    technique: state.technique,
    chunkSize: state.chunkSize,
    fontSize: state.fontSize,
    guideLines: state.guideLines,
    blurAdjacents: state.blurAdjacents,
    addMinutes: minutes,
  };
  fetch("/api/progress", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {
    pendingMinutes += minutes;
  });
}

function startMinuteCounter() {
  clearInterval(minuteTimer);
  minuteTimer = setInterval(() => {
    pendingMinutes += 1;
    persist();
  }, 60000);
}

function stopMinuteCounter() {
  clearInterval(minuteTimer);
  minuteTimer = null;
}

function toast(message) {
  toastEl.textContent = message;
  toastEl.classList.remove("opacity-0");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => toastEl.classList.add("opacity-0"), 2600);
}

async function complete() {
  stop();
  state.paragraphIndex = 0;
  state.wordIndex = 0;
  const response = await fetch("/api/complete", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ textId: state.textId, wpm: state.wpm }),
  }).catch(() => null);
  if (response && response.ok) {
    const data = await response.json();
    el("highest-wpm").textContent = `${data.stats.highestWpm} WPM`;
    const panel = document.querySelector('[data-panel="stats"]');
    const fresh = await fetch("/api/stats-panel").catch(() => null);
    if (panel && fresh && fresh.ok) panel.innerHTML = await fresh.text();
    toast("Texto concluído! Estatística atualizada.");
  }
  render(true);
  persist();
}

function schedule() {
  clearInterval(timer);
  if (!state.isPlaying) return;
  timer = setInterval(advance, computeTickMs(state));
}

function advance() {
  const words = toWords(paragraphs[state.paragraphIndex] ?? "");
  const units = unitCount(words, state.technique, state.chunkSize);
  const nextWord = state.wordIndex + 1;
  if (nextWord >= units) {
    const nextParagraph = state.paragraphIndex + 1;
    if (nextParagraph >= paragraphs.length) {
      complete();
      return;
    }
    state.paragraphIndex = nextParagraph;
    state.wordIndex = 0;
    render(true);
  } else {
    state.wordIndex = nextWord;
    render(false);
  }
  persist();
}

function play() {
  if (state.isPlaying) return;
  state.isPlaying = true;
  updateChrome();
  schedule();
  startMinuteCounter();
}

function stop() {
  state.isPlaying = false;
  clearInterval(timer);
  timer = null;
  stopMinuteCounter();
  updateChrome();
}

function togglePlay() {
  if (state.isPlaying) {
    stop();
    persist();
  } else {
    play();
  }
}

function moveParagraph(delta) {
  const next = Math.min(
    paragraphs.length - 1,
    Math.max(0, state.paragraphIndex + delta),
  );
  state.paragraphIndex = next;
  state.wordIndex = 0;
  render(true);
  persist();
}

function changeWpm(delta) {
  state.wpm = Math.min(1000, Math.max(100, state.wpm + delta));
  updateChrome();
  schedule();
  persist();
}

function changeFont(delta) {
  state.fontSize = Math.min(
    2,
    Math.max(0.7, Number((state.fontSize + delta).toFixed(2))),
  );
  render(true);
  persist();
}

function setTechnique(technique) {
  state.technique = technique;
  state.wordIndex = 0;
  render(true);
  schedule();
  persist();
}

function selectTab(name) {
  document.querySelectorAll("[data-tab]").forEach((button) => {
    button.className = button.dataset.tab === name ? TAB_ACTIVE : TAB_IDLE;
  });
  document.querySelectorAll("[data-panel]").forEach((panel) => {
    panel.classList.toggle("hidden", panel.dataset.panel !== name);
  });
}

function openLibrary(tab = "library") {
  modal.classList.remove("hidden");
  selectTab(tab);
}

function closeLibrary() {
  modal.classList.add("hidden");
}

// ------------------------------------------------------------------ wiring
el("btn-play").addEventListener("click", togglePlay);
el("btn-prev").addEventListener("click", () => moveParagraph(-1));
el("btn-next").addEventListener("click", () => moveParagraph(1));
el("btn-reset").addEventListener("click", () => {
  stop();
  state.paragraphIndex = 0;
  state.wordIndex = 0;
  render(true);
  persist();
});
el("btn-wpm-dec").addEventListener("click", () => changeWpm(-25));
el("btn-wpm-inc").addEventListener("click", () => changeWpm(25));
el("btn-font-dec").addEventListener("click", () => changeFont(-0.15));
el("btn-font-inc").addEventListener("click", () => changeFont(0.15));

document.querySelectorAll("[data-technique]").forEach((button) => {
  button.addEventListener("click", () =>
    setTechnique(button.dataset.technique),
  );
});
document.querySelectorAll("[data-chunk]").forEach((button) => {
  button.addEventListener("click", () => {
    state.chunkSize = Number(button.dataset.chunk);
    state.wordIndex = 0;
    render(true);
    schedule();
    persist();
  });
});

el("toggle-guides").addEventListener("click", () => {
  state.guideLines = !state.guideLines;
  render(true);
  persist();
});
el("toggle-blur").addEventListener("click", () => {
  state.blurAdjacents = !state.blurAdjacents;
  render(true);
  persist();
});

el("btn-open-library").addEventListener("click", () => openLibrary("library"));
el("btn-open-stats").addEventListener("click", () => openLibrary("stats"));
el("btn-close-library").addEventListener("click", closeLibrary);
document
  .querySelectorAll("[data-close-library]")
  .forEach((node) => node.addEventListener("click", closeLibrary));
document
  .querySelectorAll("[data-tab]")
  .forEach((button) =>
    button.addEventListener("click", () => selectTab(button.dataset.tab)),
  );

document.addEventListener("keydown", (event) => {
  if (event.code === "Escape" && !modal.classList.contains("hidden")) {
    closeLibrary();
    return;
  }
  const tag = document.activeElement?.tagName?.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return;
  if (event.code === "Space") {
    event.preventDefault();
    togglePlay();
  } else if (event.code === "ArrowLeft") {
    event.preventDefault();
    moveParagraph(-1);
  } else if (event.code === "ArrowRight") {
    event.preventDefault();
    moveParagraph(1);
  } else if (event.code === "ArrowUp") {
    event.preventDefault();
    changeWpm(25);
  } else if (event.code === "ArrowDown") {
    event.preventDefault();
    changeWpm(-25);
  }
});

window.addEventListener("beforeunload", () => {
  const payload = new Blob(
    [
      JSON.stringify({
        textId: state.textId,
        paragraphIndex: state.paragraphIndex,
        wordIndex: state.wordIndex,
        wpm: state.wpm,
        technique: state.technique,
        chunkSize: state.chunkSize,
        fontSize: state.fontSize,
        guideLines: state.guideLines,
        blurAdjacents: state.blurAdjacents,
        addMinutes: pendingMinutes,
      }),
    ],
    { type: "application/json" },
  );
  navigator.sendBeacon("/api/progress", payload);
});

render(true);
