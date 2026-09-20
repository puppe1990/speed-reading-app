export const GENERAL_TIPS = [
  {
    title: "Nível 1 • Varredura de Pacing (Iniciante)",
    description:
      "Excelente para quebrar o hábito de regressão. Os guias visuais treinam seus olhos para manter uma cadência fluida e para frente.",
  },
  {
    title: "Nível 2 • Agrupamento / Chunks (Intermediário)",
    description:
      "Em vez de ler palavra por palavra, agrupe 2 a 4 palavras por fixação. Isso expande sua janela de reconhecimento visual.",
  },
  {
    title: "Nível 3 • Salto Periférico (Avançado)",
    description:
      "Foque apenas nos centros das palavras saltando ritmicamente pelas margens. Suprime a subvocalização.",
  },
  {
    title: "Nível 4 • Foco Centrado RSVP (Master)",
    description:
      "O ápice do neurofoco. Apresenta o texto alinhado pelo ponto focal ótimo de processamento cerebral.",
  },
];

// Thresholds mirror the reading techniques offered in the controls.
export function readingLevel(stats = {}) {
  const highest = Number(stats.highestWpm ?? 0);
  if (highest > 600) {
    return {
      name: "Nível 4 • Master Cognitivo",
      desc: "Processamento visual puro de frases em altíssima velocidade via RSVP.",
      dots: 4,
      color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5",
    };
  }
  if (highest > 450) {
    return {
      name: "Nível 3 • Avançado",
      desc: "Amplitude ampliada por saltos precisos de visão periférica ativa.",
      dots: 3,
      color: "text-indigo-400 border-indigo-500/20 bg-indigo-500/5",
    };
  }
  if (highest > 275) {
    return {
      name: "Nível 2 • Intermediário",
      desc: "Seus olhos já capturam de 2 a 3 palavras juntas por Agrupamento (Chunks).",
      dots: 2,
      color: "text-amber-400 border-amber-500/20 bg-amber-500/5",
    };
  }
  return {
    name: "Nível 1 • Iniciante",
    desc: "Melhorando cadência mecânica e eliminando hábitos de regressão.",
    dots: 1,
    color: "text-cyan-400 border-cyan-500/20 bg-cyan-500/5",
  };
}
