import { ReadingTechnique } from '../types';
import { Play, Pause, ChevronLeft, ChevronRight, RotateCcw, Type, Users } from 'lucide-react';

interface ControlsProps {
  isPlaying: boolean;
  technique: ReadingTechnique;
  guideLines: boolean;
  blurAdjacents: boolean;
  chunkSize: number;
  fontSize: number;
  wpm: number;
  onTogglePlay: () => void;
  onSetTechnique: (tech: ReadingTechnique) => void;
  onToggleGuidelines: () => void;
  onToggleBlurAdjacents: () => void;
  onPrevParagraph: () => void;
  onNextParagraph: () => void;
  onResetReading: () => void;
  onSetChunkSize: (size: number) => void;
  onChangeFontSize: (amount: number) => void;
}

export default function Controls({
  isPlaying,
  technique,
  guideLines,
  blurAdjacents,
  chunkSize,
  fontSize,
  wpm,
  onTogglePlay,
  onSetTechnique,
  onToggleGuidelines,
  onToggleBlurAdjacents,
  onPrevParagraph,
  onNextParagraph,
  onResetReading,
  onSetChunkSize,
  onChangeFontSize
}: ControlsProps) {
  return (
    <footer className="bg-[#050507]/95 border-t border-white/10 p-6 md:p-8 z-30 select-none">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center md:items-end justify-between gap-8">
        
        {/* Left pane: Reading Techniques selection */}
        <div className="w-full md:w-5/12 flex flex-col items-center md:items-start">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-[10px] md:text-xs font-bold text-white/40 uppercase tracking-widest">
              Treinamento Cognitivo por Níveis
            </h3>
            <span className="text-[9px] bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 px-1.5 py-0.5 rounded font-mono font-medium tracking-tight">
              PROGRESSIVO
            </span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-sm sm:max-w-none">
            {/* LEVEL 1: Sweep */}
            <button 
              onClick={() => onSetTechnique('sweep')}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden group ${
                technique === 'sweep' 
                  ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.15)] font-semibold'
                  : 'border-white/5 bg-white/[0.02] text-white/60 hover:text-white hover:border-white/25 hover:bg-white/[0.04]'
              }`}
              id="tech-sweep"
            >
              <div className="flex items-center justify-between pointer-events-none mb-1">
                <span className="text-[9px] font-mono font-semibold text-cyan-400 tracking-wider">
                  NÍVEL 1 • INICIANTE
                </span>
                {wpm <= 275 && (
                  <span className="text-[8px] bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/25 font-bold uppercase tracking-tight">
                    Recomendado
                  </span>
                )}
              </div>
              <h4 className="font-semibold text-xs md:text-sm text-white group-hover:text-cyan-300 transition-colors">
                Varredura de Pacing
              </h4>
              <p className="text-[10px] text-white/45 mt-0.5 leading-tight">
                Guias dinâmicos conduzem o olhar sem retrocessos no texto.
              </p>
            </button>

            {/* LEVEL 2: Chunking */}
            <button 
              onClick={() => onSetTechnique('chunking')}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden group ${
                technique === 'chunking' 
                  ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.15)] font-semibold'
                  : 'border-white/5 bg-white/[0.02] text-white/60 hover:text-white hover:border-white/25 hover:bg-white/[0.04]'
              }`}
              id="tech-chunking"
            >
              <div className="flex items-center justify-between pointer-events-none mb-1">
                <span className="text-[9px] font-mono font-semibold text-cyan-400 tracking-wider">
                  NÍVEL 2 • INTERMEDIÁRIO
                </span>
                {wpm > 275 && wpm <= 450 && (
                  <span className="text-[8px] bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/25 font-bold uppercase tracking-tight">
                    Recomendado
                  </span>
                )}
              </div>
              <h4 className="font-semibold text-xs md:text-sm text-white group-hover:text-cyan-300 transition-colors">
                Agrupamento (Chunks)
              </h4>
              <p className="text-[10px] text-white/45 mt-0.5 leading-tight">
                Agrupa blocos de {chunkSize} palavras para expandir o foco cognitivo.
              </p>
            </button>

            {/* LEVEL 3: Peripheral */}
            <button 
              onClick={() => onSetTechnique('peripheral')}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden group ${
                technique === 'peripheral' 
                  ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.15)] font-semibold'
                  : 'border-white/5 bg-white/[0.02] text-white/60 hover:text-white hover:border-white/25 hover:bg-white/[0.04]'
              }`}
              id="tech-peripheral"
            >
              <div className="flex items-center justify-between pointer-events-none mb-1">
                <span className="text-[9px] font-mono font-semibold text-cyan-400 tracking-wider">
                  NÍVEL 3 • AVANÇADO
                </span>
                {wpm > 450 && wpm <= 600 && (
                  <span className="text-[8px] bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/25 font-bold uppercase tracking-tight">
                    Recomendado
                  </span>
                )}
              </div>
              <h4 className="font-semibold text-xs md:text-sm text-white group-hover:text-cyan-300 transition-colors">
                Salto Periférico
              </h4>
              <p className="text-[10px] text-white/45 mt-0.5 leading-tight">
                Força a captura periférica com saltos rítmicos nas margens.
              </p>
            </button>

            {/* LEVEL 4: RSVP */}
            <button 
              onClick={() => onSetTechnique('rsvp')}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden group ${
                technique === 'rsvp' 
                  ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.15)] font-semibold'
                  : 'border-white/5 bg-white/[0.02] text-white/60 hover:text-white hover:border-white/25 hover:bg-white/[0.04]'
              }`}
              id="tech-rsvp"
            >
              <div className="flex items-center justify-between pointer-events-none mb-1">
                <span className="text-[9px] font-mono font-semibold text-cyan-400 tracking-wider">
                  NÍVEL 4 • MASTER
                </span>
                {wpm > 600 && (
                  <span className="text-[8px] bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/25 font-bold uppercase tracking-tight">
                    Recomendado
                  </span>
                )}
              </div>
              <h4 className="font-semibold text-xs md:text-sm text-white group-hover:text-cyan-300 transition-colors">
                Foco Centrado RSVP
              </h4>
              <p className="text-[10px] text-white/45 mt-0.5 leading-tight">
                Dispara palavra por palavra com alinhamento óptico no Ponto de Reconhecimento.
              </p>
            </button>
          </div>
        </div>

        {/* Center pane: Primary Playback buttons */}
        <div className="flex flex-col items-center gap-3 z-10 w-full sm:max-w-xs md:w-auto">
          <div className="flex items-center gap-4 sm:gap-6">
            <button 
              onClick={onPrevParagraph}
              className="p-2 text-white/40 hover:text-white active:scale-90 transition-all cursor-pointer"
              title="Voltar parágrafo (Teclado Seta Esquerda)"
              id="btn-playback-prev"
            >
              <ChevronLeft className="w-7 h-7" />
            </button>
            <button 
              onClick={onTogglePlay}
              className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
                isPlaying 
                  ? 'bg-cyan-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:bg-cyan-400' 
                  : 'bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-105'
              }`}
              title="Play / Pause (Teclado Espaço)"
              id="btn-playback-play"
            >
              {isPlaying ? (
                <Pause className="w-8 h-8 md:w-10 md:h-10 fill-current" />
              ) : (
                <Play className="w-8 h-8 md:w-10 md:h-10 fill-current ml-1" />
              )}
            </button>
            <button 
              onClick={onNextParagraph}
              className="p-2 text-white/40 hover:text-white active:scale-90 transition-all cursor-pointer"
              title="Avançar parágrafo (Teclado Seta Direita)"
              id="btn-playback-next"
            >
              <ChevronRight className="w-7 h-7" />
            </button>
          </div>
          <div className="flex items-center gap-4 text-[10px] text-white/30 tracking-wider uppercase font-mono">
            <span>Espaço: pausar</span>
            <span>•</span>
            <span>← → : pular</span>
            <span>•</span>
            <button 
              onClick={onResetReading}
              className="text-[10px] text-white/40 hover:text-cyan-400 flex items-center gap-1 cursor-pointer transition-colors"
              title="Reiniciar leitura do início"
              id="btn-playback-reset"
            >
              <RotateCcw className="w-3 h-3" />
              <span>reiniciar</span>
            </button>
          </div>
        </div>

        {/* Right pane: Visual toggles & parameters */}
        <div className="w-full md:w-1/3 flex flex-col items-center md:items-end gap-5">
          <div className="w-full max-w-sm">
            <h3 className="text-[10px] md:text-xs font-bold text-white/40 uppercase tracking-widest mb-3 text-center md:text-right">
              Ajustes de Zoom & Tamanhos
            </h3>
            <div className="flex flex-col sm:flex-row items-center justify-between md:justify-end gap-3.5 mb-2">
              {/* Chunk Size Control */}
              {technique === 'chunking' && (
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-2.5 py-1.5 md:py-1">
                  <span className="text-[10px] text-white/50 tracking-wide uppercase flex items-center gap-1">
                    <Users className="w-3 h-3 text-cyan-400" /> Chunk:
                  </span>
                  <div className="flex items-center gap-1.5">
                    {[2, 3, 4].map((s) => (
                      <button
                        key={s}
                        onClick={() => onSetChunkSize(s)}
                        className={`px-1.5 py-0.5 rounded text-[11px] font-mono font-bold cursor-pointer transition-colors ${
                          chunkSize === s 
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' 
                            : 'text-white/40 hover:text-white'
                        }`}
                        id={`btn-chunk-size-${s}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Font Size Buttons */}
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-2.5 py-1.5 md:py-1">
                <span className="text-[10px] text-white/50 tracking-wide uppercase flex items-center gap-1">
                  <Type className="w-3.5 h-3.5 text-cyan-400" /> Fonte:
                </span>
                <button 
                  onClick={() => onChangeFontSize(-0.15)}
                  className="px-2 py-0.5 bg-white/5 rounded text-xs hover:bg-white/10 font-bold text-white/70 cursor-pointer"
                  title="Diminuir tamanho da fonte"
                  id="btn-font-dec"
                >
                  A-
                </button>
                <span className="text-xs font-mono text-cyan-400 min-w-[24px] text-center font-bold">
                  {Math.round(fontSize * 100)}%
                </span>
                <button 
                  onClick={() => onChangeFontSize(0.15)}
                  className="px-2 py-0.5 bg-white/5 rounded text-xs hover:bg-white/10 font-bold text-white/70 cursor-pointer"
                  title="Aumentar tamanho da fonte"
                  id="btn-font-inc"
                >
                  A+
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 w-full max-w-sm sm:items-end">
            {/* Guide lines Toggle */}
            <div className="flex items-center justify-between sm:justify-end gap-4 w-full">
              <span className="text-xs text-white/60">Linhas Guia de Fixação</span>
              <button 
                onClick={onToggleGuidelines}
                className={`w-10 h-6.5 rounded-full relative p-1 transition-colors cursor-pointer ${
                  guideLines ? 'bg-cyan-500' : 'bg-white/10'
                }`}
                title="Mostrar duas colunas guias para focar apenas no miolo"
                id="toggle-guidelines"
              >
                <span className={`block w-4.5 h-4.5 bg-white rounded-full shadow transition-all duration-200 ${
                  guideLines ? 'translate-x-[14px]' : 'translate-x-[1px]'
                }`}></span>
              </button>
            </div>

            {/* Adjacent focus blur Toggle */}
            <div className="flex items-center justify-between sm:justify-end gap-4 w-full">
              <span className="text-xs text-white/60">Desfocar Adjacentes (Profundidade)</span>
              <button 
                onClick={onToggleBlurAdjacents}
                className={`w-10 h-6.5 rounded-full relative p-1 transition-colors cursor-pointer ${
                  blurAdjacents ? 'bg-cyan-500' : 'bg-white/10'
                }`}
                title="Desfocar parágrafos distantes para aumentar a imersão"
                id="toggle-bluradj"
              >
                <span className={`block w-4.5 h-4.5 bg-white rounded-full shadow transition-all duration-200 ${
                  blurAdjacents ? 'translate-x-[14px]' : 'translate-x-[1px]'
                }`}></span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </footer>
  );
}
