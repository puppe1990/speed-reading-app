import { useState, useEffect } from 'react';
import { INITIAL_BOOKS } from './data';
import { Book, ReadingTechnique, ReadingState, SpeedReadingStat } from './types';
import Header from './components/Header';
import ReadingViewport from './components/ReadingViewport';
import Controls from './components/Controls';
import BooksModal from './components/BooksModal';
import { Flame, BrainCircuit, Play, Layers } from 'lucide-react';

const DEFAULT_STATS: SpeedReadingStat = {
  completedBooks: 3,
  totalMinutesRead: 14,
  averageWpm: 380,
  highestWpm: 450
};

export default function App() {
  // 1. Core Books list (Default loaded + Saved Customs)
  const [books, setBooks] = useState<Book[]>(() => {
    const saved = localStorage.getItem('speed_reading_custom_books');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return [...INITIAL_BOOKS, ...parsed];
      } catch (e) {
        return INITIAL_BOOKS;
      }
    }
    return INITIAL_BOOKS;
  });

  // 2. Reading State
  const [readingState, setReadingState] = useState<ReadingState>({
    currentBookId: 'andar-do-bebado',
    isPlaying: false,
    wpm: 450,
    technique: 'chunking',
    currentParagraphIndex: 0,
    currentWordIndex: 0,
    chunkSize: 3,
    guideLines: true,
    blurAdjacents: true,
    highlightORP: true
  });

  const [fontSize, setFontSize] = useState(1.15); // multiplier in rem
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 3. Overall Progress Stats
  const [stats, setStats] = useState<SpeedReadingStat>(() => {
    const saved = localStorage.getItem('speed_reading_user_stats');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEFAULT_STATS;
      }
    }
    return DEFAULT_STATS;
  });

  const activeBook = books.find(b => b.id === readingState.currentBookId) || books[0];

  // Persist customized books list
  const handleAddCustomBook = (title: string, author: string, content: string) => {
    // Generate simple paragraphs from raw text split double carriage returns
    const rawParagraphs = content
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(p => p.length > 0);

    const newBook: Book = {
      id: `custom-${Date.now()}`,
      title,
      author,
      category: 'Texto Personalizado',
      coverColor: 'from-purple-600 to-indigo-800',
      content,
      paragraphs: rawParagraphs
    };

    const updatedCustoms = books.filter(b => b.id.startsWith('custom-'));
    const allCustoms = [...updatedCustoms, newBook];
    localStorage.setItem('speed_reading_custom_books', JSON.stringify(allCustoms));

    setBooks([...INITIAL_BOOKS, ...allCustoms]);
    
    // Auto-select text
    setReadingState(prev => ({
      ...prev,
      currentBookId: newBook.id,
      currentParagraphIndex: 0,
      currentWordIndex: 0,
      isPlaying: false
    }));
  };

  const handleDeleteBook = (bookId: string) => {
    const updatedCustoms = books.filter(b => b.id.startsWith('custom-') && b.id !== bookId);
    localStorage.setItem('speed_reading_custom_books', JSON.stringify(updatedCustoms));
    setBooks([...INITIAL_BOOKS, ...updatedCustoms]);

    if (readingState.currentBookId === bookId) {
      setReadingState(prev => ({
        ...prev,
        currentBookId: 'andar-do-bebado',
        currentParagraphIndex: 0,
        currentWordIndex: 0,
        isPlaying: false
      }));
    }
  };

  const handleClearStats = () => {
    const reset = {
      completedBooks: 0,
      totalMinutesRead: 0,
      averageWpm: 250,
      highestWpm: 250
    };
    localStorage.setItem('speed_reading_user_stats', JSON.stringify(reset));
    setStats(reset);
  };

  // Keyboard accessibility listeners (Space, Left, Right arrows etc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus element check (don't capture keyboard when inside inputs / textareas)
      const tagName = document.activeElement?.tagName.toLowerCase();
      if (tagName === 'input' || tagName === 'textarea') return;

      if (e.code === 'Space') {
        e.preventDefault();
        setReadingState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handlePrevParagraph();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleNextParagraph();
      } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        handleIncrementWpm(25);
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        handleIncrementWpm(-25);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [books, readingState.currentParagraphIndex]);

  // Main Speed Reading Ticker loop
  useEffect(() => {
    if (!readingState.isPlaying) return;

    // Milliseconds per single word
    let wordMs = 60000 / readingState.wpm;
    let tickMs = wordMs;

    // Scaled tick rate based on technique grouping
    if (readingState.technique === 'chunking') {
      tickMs = wordMs * readingState.chunkSize;
    } else if (readingState.technique === 'peripheral') {
      tickMs = wordMs * 2.8; // Peripheral horizontal jump pacing
    }

    const intervalId = setInterval(() => {
      setReadingState(prev => {
        const book = books.find(b => b.id === prev.currentBookId) || books[0];
        const paragraphs = book.paragraphs;
        const currentPar = paragraphs[prev.currentParagraphIndex];

        if (!currentPar) {
          return { ...prev, isPlaying: false };
        }

        const words = currentPar.trim().split(/\s+/).filter(w => w.length > 0);
        let nextWordIdx = prev.currentWordIndex + 1;
        let nextParIdx = prev.currentParagraphIndex;
        let paragraphEnd = false;

        // Check paragraph completion thresholds per technique
        if (prev.technique === 'rsvp' || prev.technique === 'sweep') {
          if (nextWordIdx >= words.length) {
            paragraphEnd = true;
          }
        } else if (prev.technique === 'chunking') {
          const totalChunks = Math.ceil(words.length / prev.chunkSize);
          if (nextWordIdx >= totalChunks) {
            paragraphEnd = true;
          }
        } else if (prev.technique === 'peripheral') {
          const bouncesCount = Math.max(4, Math.ceil(words.length / 5.5));
          if (nextWordIdx >= bouncesCount) {
            paragraphEnd = true;
          }
        }

        if (paragraphEnd) {
          nextParIdx += 1;
          nextWordIdx = 0;

          // End of entire text
          if (nextParIdx >= paragraphs.length) {
            // Milestone updates
            setStats(s => {
              const updated = {
                ...s,
                completedBooks: s.completedBooks + 1,
              };
              localStorage.setItem('speed_reading_user_stats', JSON.stringify(updated));
              return updated;
            });

            return {
              ...prev,
              isPlaying: false,
              currentParagraphIndex: 0,
              currentWordIndex: 0
            };
          }
        }

        return {
          ...prev,
          currentParagraphIndex: nextParIdx,
          currentWordIndex: nextWordIdx
        };
      });
    }, tickMs);

    return () => clearInterval(intervalId);
  }, [
    readingState.isPlaying, 
    readingState.wpm, 
    readingState.technique, 
    readingState.chunkSize, 
    books
  ]);

  // Track minutes of reading elapsed in background
  useEffect(() => {
    if (!readingState.isPlaying) return;

    const minuteTimerId = setInterval(() => {
      setStats(s => {
        const updated = {
          ...s,
          totalMinutesRead: s.totalMinutesRead + 1
        };
        localStorage.setItem('speed_reading_user_stats', JSON.stringify(updated));
        return updated;
      });
    }, 60000);

    return () => clearInterval(minuteTimerId);
  }, [readingState.isPlaying]);

  const handlePrevParagraph = () => {
    setReadingState(prev => ({
      ...prev,
      currentParagraphIndex: Math.max(0, prev.currentParagraphIndex - 1),
      currentWordIndex: 0
    }));
  };

  const handleNextParagraph = () => {
    setReadingState(prev => {
      const paragraphs = activeBook.paragraphs;
      return {
        ...prev,
        currentParagraphIndex: Math.min(paragraphs.length - 1, prev.currentParagraphIndex + 1),
        currentWordIndex: 0
      };
    });
  };

  const handleResetReading = () => {
    setReadingState(prev => ({
      ...prev,
      currentParagraphIndex: 0,
      currentWordIndex: 0,
      isPlaying: false
    }));
  };

  const handleIncrementWpm = (amount: number) => {
    setReadingState(prev => {
      const nextWpm = Math.min(1000, Math.max(100, prev.wpm + amount));
      
      // Update max speed stats
      if (nextWpm > stats.highestWpm) {
        setStats(s => {
          const updated = { ...s, highestWpm: nextWpm };
          localStorage.setItem('speed_reading_user_stats', JSON.stringify(updated));
          return updated;
        });
      }

      return {
        ...prev,
        wpm: nextWpm
      };
    });
  };

  const handleSelectBook = (bookId: string) => {
    setReadingState(prev => ({
      ...prev,
      currentBookId: bookId,
      currentParagraphIndex: 0,
      currentWordIndex: 0,
      isPlaying: false
    }));
  };

  const progressPercent = activeBook.paragraphs.length > 0
    ? (readingState.currentParagraphIndex / activeBook.paragraphs.length) * 100
    : 0;

  return (
    <div className="w-full h-full bg-[#050507] text-[#e0e0e0] font-sans flex flex-col overflow-hidden relative">
      {/* Immersive Top Header */}
      <Header 
        currentBook={activeBook}
        wpm={readingState.wpm}
        progressPercent={progressPercent}
        onOpenLibrary={() => setIsModalOpen(true)}
        onOpenStats={() => {
          setIsModalOpen(true);
        }}
        onIncrementWpm={handleIncrementWpm}
      />

      {/* Mini Visual Stats Bar */}
      <div className="flex items-center justify-center gap-6 px-6 py-2 bg-gradient-to-r from-cyan-500/5 via-cyan-500/10 to-cyan-500/5 border-b border-white/5 font-mono text-[10px] md:text-xs text-white/50 tracking-wide select-none">
        <div className="flex items-center gap-1.5">
          <Flame className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
          <span>Foco Ativo: <strong className="text-white uppercase">{readingState.technique}</strong></span>
        </div>
        <div className="opacity-40">|</div>
        <div className="flex items-center gap-1.5">
          <BrainCircuit className="w-3.5 h-3.5 text-cyan-400" />
          <span>Parágrafo: <strong className="text-white">{readingState.currentParagraphIndex + 1}/{activeBook.paragraphs.length}</strong></span>
        </div>
        <div className="opacity-40">|</div>
        <div className="hidden sm:flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-cyan-300" />
          <span>Recorde velocidade: <strong className="text-white font-mono">{stats.highestWpm} WPM</strong></span>
        </div>
      </div>

      {/* Central Immersive Reading Viewport */}
      <ReadingViewport 
        currentBook={activeBook}
        isPlaying={readingState.isPlaying}
        technique={readingState.technique}
        currentParagraphIndex={readingState.currentParagraphIndex}
        currentWordIndex={readingState.currentWordIndex}
        wpm={readingState.wpm}
        chunkSize={readingState.chunkSize}
        guideLines={readingState.guideLines}
        blurAdjacents={readingState.blurAdjacents}
        highlightORP={readingState.highlightORP}
        fontSize={fontSize}
      />

      {/* Underneath Action Control Dashboard */}
      <Controls 
        isPlaying={readingState.isPlaying}
        technique={readingState.technique}
        guideLines={readingState.guideLines}
        blurAdjacents={readingState.blurAdjacents}
        chunkSize={readingState.chunkSize}
        fontSize={fontSize}
        wpm={readingState.wpm}
        onTogglePlay={() => setReadingState(prev => ({ ...prev, isPlaying: !prev.isPlaying }))}
        onSetTechnique={(tech) => setReadingState(prev => ({ ...prev, technique: tech, currentWordIndex: 0 }))}
        onToggleGuidelines={() => setReadingState(prev => ({ ...prev, guideLines: !prev.guideLines }))}
        onToggleBlurAdjacents={() => setReadingState(prev => ({ ...prev, blurAdjacents: !prev.blurAdjacents }))}
        onPrevParagraph={handlePrevParagraph}
        onNextParagraph={handleNextParagraph}
        onResetReading={handleResetReading}
        onSetChunkSize={(size) => setReadingState(prev => ({ ...prev, chunkSize: size, currentWordIndex: 0 }))}
        onChangeFontSize={(amount) => setFontSize(prev => Math.min(2.0, Math.max(0.7, prev + amount)))}
      />

      {/* Config tray & catalog modal */}
      <BooksModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        books={books}
        currentBookId={readingState.currentBookId}
        onSelectBook={handleSelectBook}
        onAddCustomBook={handleAddCustomBook}
        onDeleteBook={handleDeleteBook}
        stats={stats}
        onClearStats={handleClearStats}
      />
    </div>
  );
}
