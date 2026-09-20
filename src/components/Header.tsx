import { Book } from '../types';
import { BookOpen, Settings, Trophy, ListCollapse } from 'lucide-react';

interface HeaderProps {
  currentBook: Book;
  wpm: number;
  progressPercent: number;
  onOpenLibrary: () => void;
  onOpenStats: () => void;
  onIncrementWpm: (amount: number) => void;
}

export default function Header({
  currentBook,
  wpm,
  progressPercent,
  onOpenLibrary,
  onOpenStats,
  onIncrementWpm
}: HeaderProps) {
  return (
    <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 py-4 sm:px-8 sm:py-5 border-b border-white/10 bg-[#050507]/90 backdrop-blur-md gap-4 z-40 select-none">
      {/* Current Book Info */}
      <div className="flex items-center gap-4 w-full sm:w-auto">
        <button 
          onClick={onOpenLibrary}
          className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 active:scale-95 transition-all cursor-pointer"
          title="Selecionar Livro / Texto"
          id="btn-open-library-header"
        >
          <BookOpen className="w-5 h-5 text-cyan-400" />
        </button>
        <div className="overflow-hidden">
          <h1 className="text-xs font-semibold tracking-wide uppercase text-white/40">Lendo Agora</h1>
          <p className="text-sm sm:text-base font-semibold text-white truncate max-w-[280px] sm:max-w-[400px]">
            {currentBook.title}
          </p>
          <p className="text-xs text-white/60 truncate">
            {currentBook.author} • <span className="text-cyan-400/80">{currentBook.category}</span>
          </p>
        </div>
      </div>

      {/* Speed & Stats & Actions */}
      <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
        {/* Speed Controls */}
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => onIncrementWpm(-25)}
              className="text-xs px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 active:scale-95 cursor-pointer"
              title="Diminuir velocidade (-25 WPM)"
              id="btn-wpm-dec"
            >
              -
            </button>
            <p className="text-xl sm:text-2xl font-mono text-cyan-400 font-semibold">
              {wpm} <span className="text-xs text-white/40 font-sans font-normal">WPM</span>
            </p>
            <button 
              onClick={() => onIncrementWpm(25)}
              className="text-xs px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 active:scale-95 cursor-pointer"
              title="Aumentar velocidade (+25 WPM)"
              id="btn-wpm-inc"
            >
              +
            </button>
          </div>
          <div className="w-28 sm:w-36 h-1.5 bg-white/10 mt-1.5 rounded-full overflow-hidden relative">
            <div 
              className="h-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)] transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
              title={`Progresso: ${Math.round(progressPercent)}%`}
            ></div>
          </div>
        </div>

        {/* Library & Stats Buttons */}
        <div className="flex items-center gap-2">
          <button 
            onClick={onOpenStats}
            className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white/80 hover:text-white active:scale-95 transition-all cursor-pointer"
            title="Ver Estatísticas Gerais"
            id="btn-open-stats"
          >
            <Trophy className="w-5 h-5 text-amber-400" />
          </button>
          <button 
            onClick={onOpenLibrary}
            className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 text-cyan-400 hover:text-cyan-300 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
            title="Lista de Livros e Textos"
            id="btn-open-library"
          >
            <ListCollapse className="w-5 h-5" />
            <span className="hidden md:inline text-xs font-semibold uppercase tracking-wider">Biblioteca</span>
          </button>
        </div>
      </div>
    </header>
  );
}
