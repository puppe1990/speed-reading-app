import { useEffect, useRef, useMemo } from 'react';
import { Book, ReadingTechnique } from '../types';
import { Sparkles, Eye } from 'lucide-react';

interface ReadingViewportProps {
  currentBook: Book;
  isPlaying: boolean;
  technique: ReadingTechnique;
  currentParagraphIndex: number;
  currentWordIndex: number;
  wpm: number;
  chunkSize: number;
  guideLines: boolean;
  blurAdjacents: boolean;
  highlightORP: boolean;
  fontSize: number; // in px or custom multiplier
}

// Helper to calculate ORP split of a word
function getOrpSplit(word: string) {
  if (!word) return { prefix: '', orp: '', suffix: '' };
  
  // Clean punctuation from word for calculating size, keep it for display
  const cleanWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'']/g, "");
  const len = cleanWord.length;
  
  let orpIdx = 1;
  if (len <= 1) orpIdx = 0;
  else if (len <= 5) orpIdx = 1;
  else if (len <= 9) orpIdx = 2;
  else if (len <= 13) orpIdx = 3;
  else orpIdx = 4;
  
  // Find mapped index in original word with punctuation
  let mappedIdx = orpIdx;
  let lettersFound = 0;
  for (let i = 0; i < word.length; i++) {
    // Check if character is alphanumeric/letter
    if (/[a-zA-Z0-9áéíóúâêîôûãõçÁÉÍÓÚÂÊÎÔÛÃÕÇ]/.test(word[i])) {
      if (lettersFound === orpIdx) {
        mappedIdx = i;
        break;
      }
      lettersFound++;
    }
  }
  
  if (mappedIdx >= word.length) mappedIdx = word.length - 1;
  if (mappedIdx < 0) mappedIdx = 0;

  return {
    prefix: word.substring(0, mappedIdx),
    orp: word.charAt(mappedIdx),
    suffix: word.substring(mappedIdx + 1)
  };
}

export default function ReadingViewport({
  currentBook,
  isPlaying,
  technique,
  currentParagraphIndex,
  currentWordIndex,
  wpm,
  chunkSize,
  guideLines,
  blurAdjacents,
  highlightORP,
  fontSize
}: ReadingViewportProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeParagraphRef = useRef<HTMLDivElement>(null);

  // Smooth scroll active paragraph to container center
  useEffect(() => {
    if (activeParagraphRef.current && containerRef.current) {
      const activeEl = activeParagraphRef.current;
      const container = containerRef.current;
      
      // Calculate active element center relative to the container
      const activeRect = activeEl.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      
      const scrollOffset = 
        activeEl.offsetTop - 
        container.clientHeight / 2 + 
        activeEl.clientHeight / 2;

      container.scrollTo({
        top: scrollOffset,
        behavior: 'smooth'
      });
    }
  }, [currentParagraphIndex, technique]); // Scroll when active paragraph changes or when switching modes

  // Split each paragraph into words list
  const parsedParagraphs = useMemo(() => {
    return currentBook.paragraphs.map((p) => {
      // Clean up triple spaces or weird gaps
      const words = p.trim().split(/\s+/).filter(w => w.length > 0);
      
      // Create word chunks for 'chunking' technique
      const chunked: string[][] = [];
      for (let i = 0; i < words.length; i += chunkSize) {
        chunked.push(words.slice(i, i + chunkSize));
      }

      // Left-Right parts for Peripheral mode
      // Divide the words into 3 groups: Left margins, Center, Right margins
      const partSize = Math.max(1, Math.floor(words.length / 3));
      const leftWords = words.slice(0, partSize);
      const middleWords = words.slice(partSize, words.length - partSize);
      const rightWords = words.slice(words.length - partSize);

      return {
        original: p,
        words,
        chunked,
        peripheral: {
          left: leftWords,
          middle: middleWords,
          right: rightWords
        }
      };
    });
  }, [currentBook, chunkSize]);

  const activeParagraphData = parsedParagraphs[currentParagraphIndex] || { words: [], chunked: [], peripheral: { left: [], middle: [], right: [] } };

  // Determine current RSVP word
  const activeRsvpWord = useMemo(() => {
    if (technique !== 'rsvp') return '';
    const words = activeParagraphData.words;
    if (words.length === 0) return '';
    return words[currentWordIndex % words.length] || '';
  }, [technique, activeParagraphData, currentWordIndex]);

  const rsvpSplit = useMemo(() => {
    if (!activeRsvpWord) return { prefix: '', orp: '', suffix: '' };
    return getOrpSplit(activeRsvpWord);
  }, [activeRsvpWord]);

  // Determine active scan indicators for styles
  const activeChunkIdx = technique === 'chunking' ? currentWordIndex : -1;
  const isPeripheralLeftActive = technique === 'peripheral' && currentWordIndex % 2 === 0;

  return (
    <div className="flex-1 relative flex flex-col items-center justify-center p-4 sm:p-8 select-none overflow-hidden bg-[#050507]">
      {/* Top and Bottom Fading Masks - Create floating immersive look */}
      <div className="absolute top-0 left-0 right-0 h-28 pointer-events-none z-10 bg-gradient-to-b from-[#050507] via-[#050507]/60 to-transparent"></div>
      <div className="absolute bottom-0 left-0 right-0 h-28 pointer-events-none z-10 bg-gradient-to-t from-[#050507] via-[#050507]/60 to-transparent"></div>

      {/* Speed Reading Bounding Baskets (Vertical Fixation Lines) */}
      {guideLines && technique !== 'rsvp' && (
        <>
          <div className="absolute left-[15%] sm:left-[22%] top-0 bottom-0 w-[1px] bg-cyan-500/10 border-l border-dashed border-cyan-400/25 z-10 pointer-events-none">
            <div className="absolute top-1/4 left-0 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-cyan-500/40"></div>
            <div className="absolute top-3/4 left-0 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-cyan-500/40"></div>
          </div>
          <div className="absolute right-[15%] sm:right-[22%] top-0 bottom-0 w-[1px] bg-cyan-500/10 border-r border-dashed border-cyan-400/25 z-10 pointer-events-none">
            <div className="absolute top-1/4 right-0 translate-x-1/2 w-1.5 h-1.5 rounded-full bg-cyan-500/40"></div>
            <div className="absolute top-3/4 right-0 translate-x-1/2 w-1.5 h-1.5 rounded-full bg-cyan-500/40"></div>
          </div>
        </>
      )}

      {/* Anchors on Left/Right for gaze lock */}
      {technique !== 'rsvp' && (
        <>
          <div className="absolute left-2 sm:left-4 md:left-12 top-1/2 -translate-y-1/2 w-6 sm:w-10 h-[2px] bg-cyan-500/50 shadow-[0_0_12px_cyan] z-20 pointer-events-none rounded"></div>
          <div className="absolute right-2 sm:right-4 md:right-12 top-1/2 -translate-y-1/2 w-6 sm:w-10 h-[2px] bg-cyan-500/50 shadow-[0_0_12px_cyan] z-20 pointer-events-none rounded"></div>
        </>
      )}

      {/* RSVP Main Big Box Overlay (Takes center attention) */}
      {technique === 'rsvp' ? (
        <div className="w-full max-w-xl mx-auto flex flex-col items-center justify-center py-16 px-6 bg-white/[0.02] border border-white/5 rounded-3xl backdrop-blur-md relative shadow-2xl z-20">
          <div className="absolute top-4 left-6 flex items-center gap-1.5 text-xs font-mono text-cyan-400 tracking-wider uppercase opacity-80">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Foco RSVP Dinâmico</span>
          </div>

          {/* Left/Right bounding ticks on RSVP focus */}
          <div className="absolute left-6 top-1/2 -translate-y-1/2 w-1 h-8 bg-cyan-500/60 rounded"></div>
          <div className="absolute right-6 top-1/2 -translate-y-1/2 w-1 h-8 bg-cyan-500/60 rounded"></div>

          {/* ORP Alignment Top & Bottom Guides */}
          <div className="absolute left-[35%] right-[65%] top-1/3 -translate-y-4 flex flex-col items-center">
            <div className="w-[1.5px] h-3 bg-red-500/55"></div>
          </div>
          <div className="absolute left-[35%] right-[65%] bottom-1/3 translate-y-4 flex flex-col items-center">
            <div className="w-[1.5px] h-3 bg-red-500/55"></div>
          </div>

          {/* Main word display (Mono or Serif works beautifully) */}
          <div 
            className="flex items-center text-center font-mono select-all transition-transform duration-75 text-4xl sm:text-5xl md:text-6xl text-white font-medium"
            style={{ fontSize: `${fontSize * 1.3}rem` }}
          >
            {activeRsvpWord ? (
              <>
                {/* Prefix */}
                <span className="text-right text-white/50 w-[42%] uppercase-none inline-block font-sans">
                  {rsvpSplit.prefix}
                </span>
                {/* ORP Focus character in neon color */}
                <span className="text-center font-mono text-cyan-400 mx-[1px] relative select-none font-bold scale-105 inline-block w-[16%]">
                  {rsvpSplit.orp}
                  <span className="absolute left-1/2 -translate-x-1/2 top-full mt-1 w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                </span>
                {/* Suffix */}
                <span className="text-left text-white w-[42%] inline-block font-sans">
                  {rsvpSplit.suffix}
                </span>
              </>
            ) : (
              <span className="text-white/20 italic text-xl">Preparando...</span>
            )}
          </div>

          <div className="mt-8 flex flex-col items-center gap-1.5">
            <p className="text-xs font-mono text-white/40 uppercase tracking-widest">
              Foco Óptico no Vermelho Central
            </p>
            <p className="text-[11px] text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded border border-cyan-400/20 max-w-[280px] truncate">
              {currentBook.paragraphs[currentParagraphIndex]?.substring(0, 60)}...
            </p>
          </div>
        </div>
      ) : (
        /* Continuous Paragraph Board */
        <div 
          ref={containerRef}
          className="w-full max-w-3xl h-[420px] sm:h-[480px] overflow-hidden scroll-smooth flex flex-col relative py-20 px-4 sm:px-6 z-15"
          id="scroll-continuous-container"
        >
          {parsedParagraphs.map((parData, pIdx) => {
            const isActive = pIdx === currentParagraphIndex;
            const isCompleted = pIdx < currentParagraphIndex;
            
            // Build visual styling based on active parameters and helper toggles
            let blockStyles = "transition-all duration-300 transform font-serif leading-relaxed my-4 text-center cursor-pointer select-none ";
            
            if (isActive) {
              blockStyles += "scale-101 opacity-100 text-white font-medium ";
            } else if (isCompleted) {
              blockStyles += blurAdjacents 
                ? "blur-[1.5px] opacity-20 scale-95 pointer-events-none " 
                : "opacity-40 scale-98 ";
            } else {
              // Future paragraphs
              blockStyles += blurAdjacents 
                ? "blur-[2px] opacity-15 scale-95 pointer-events-none " 
                : "opacity-30 scale-98 ";
            }

            return (
              <div 
                key={pIdx}
                ref={isActive ? activeParagraphRef : null}
                id={`paragraph-${pIdx}`}
                className={blockStyles}
                style={{ fontSize: `${fontSize}rem` }}
              >
                {/* Visual Anchors for currently scanned active reading item */}
                {isActive && (
                  <div className="absolute top-1 p-0.5 left-1/2 -translate-x-1/2 text-[10px] font-mono tracking-widest text-cyan-400 uppercase bg-cyan-500/10 rounded border border-cyan-500/20 select-none pointer-events-none z-10 flex items-center gap-1">
                    <Eye className="w-3 h-3 text-cyan-400" />
                    <span>
                      {technique === 'chunking' && "Técnica: Agrupamento"}
                      {technique === 'peripheral' && "Técnica: Salto Periférico"}
                      {technique === 'sweep' && "Técnica: Varredura Pace"}
                    </span>
                  </div>
                )}

                {/* Inner Paragraph word structures based on active Reading Techniques */}
                {isActive ? (
                  <div className="relative pt-6 pb-2 inline-block max-w-full">
                    
                    {/* 1. CHUNKING MODE */}
                    {technique === 'chunking' && (
                      <div className="flex flex-wrap justify-center gap-x-2 gap-y-3 px-2">
                        {parData.chunked.map((chunk, cIdx) => {
                          const isChunkActive = cIdx === activeChunkIdx;
                          return (
                            <span 
                              key={cIdx} 
                              className={`px-1.5 py-0.5 rounded transition-all duration-150 inline-block ${
                                isChunkActive 
                                  ? 'bg-cyan-400/10 border border-cyan-500/50 text-cyan-300 font-semibold scale-105 shadow-[0_0_12px_rgba(6,182,212,0.3)]' 
                                  : 'text-white/60 border border-transparent'
                              }`}
                            >
                              {chunk.join(' ')}
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {/* 2. PERIPHERAL MODE (Fixation Training) */}
                    {technique === 'peripheral' && (
                      <p className="px-4">
                        {/* Highlight Left Block */}
                        <span 
                          className={` transition-colors duration-150 rounded ${
                            isPeripheralLeftActive 
                              ? 'text-cyan-300 bg-cyan-400/10 px-1 font-semibold border border-cyan-500/30 shadow-[0_0_8px_rgba(6,182,212,0.2)]' 
                              : 'text-white/60'
                          }`}
                        >
                          {parData.peripheral.left.join(' ')}
                        </span>{' '}
                        {/* Middle remains neutral */}
                        <span className="text-white/40 opacity-70">
                          {parData.peripheral.middle.join(' ')}
                        </span>{' '}
                        {/* Highlight Right Block */}
                        <span 
                          className={`transition-colors duration-150 rounded ${
                            !isPeripheralLeftActive 
                              ? 'text-cyan-300 bg-cyan-400/10 px-1 font-semibold border border-cyan-500/30 shadow-[0_0_8px_rgba(6,182,212,0.2)]' 
                              : 'text-white/60'
                          }`}
                        >
                          {parData.peripheral.right.join(' ')}
                        </span>
                      </p>
                    )}

                    {/* 3. ACTIVE UNDERLINE SWEEP MODE */}
                    {technique === 'sweep' && (
                      <span className="flex flex-wrap justify-center gap-x-1.5 px-4">
                        {parData.words.map((w, wIdx) => {
                          const isWordActive = wIdx === currentWordIndex;
                          return (
                            <span 
                              key={wIdx} 
                              className={`relative px-1 transition-all duration-100 ${
                                isWordActive 
                                  ? 'text-cyan-300 font-bold scale-102 font-serif' 
                                  : 'text-white/70 font-light'
                              }`}
                            >
                              {w}
                              {/* Glowing bottom sweep underline pace block */}
                              {isWordActive && (
                                <span className="absolute bottom-[-1px] left-0 right-0 h-[3px] bg-cyan-400 rounded shadow-[0_0_8px_rgba(34,211,238,1)] animate-pulse"></span>
                              )}
                            </span>
                          );
                        })}
                      </span>
                    )}

                  </div>
                ) : (
                  /* Passive Paragraph Display */
                  <p className="px-4">
                    {parData.original}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Helpful overlay warning when paused */}
      {!isPlaying && (
        <div className="absolute top-4 right-4 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl flex items-center gap-2 pointer-events-none z-30 opacity-70">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
          <span className="text-xs font-mono uppercase text-white/50">Pausado</span>
        </div>
      )}
    </div>
  );
}
