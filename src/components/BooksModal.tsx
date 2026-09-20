import React, { useState } from 'react';
import { Book, SpeedReadingStat } from '../types';
import { GENERAL_TIPS } from '../data';
import { X, BookOpen, Plus, Trophy, BookPlus, Flame, Play, Trash2, Milestone } from 'lucide-react';

interface BooksModalProps {
  isOpen: boolean;
  onClose: () => void;
  books: Book[];
  currentBookId: string;
  onSelectBook: (bookId: string) => void;
  onAddCustomBook: (title: string, author: string, content: string) => void;
  onDeleteBook: (bookId: string) => void;
  stats: SpeedReadingStat;
  onClearStats: () => void;
}

type ModalTab = 'library' | 'add' | 'stats';

export default function BooksModal({
  isOpen,
  onClose,
  books,
  currentBookId,
  onSelectBook,
  onAddCustomBook,
  onDeleteBook,
  stats,
  onClearStats
}: BooksModalProps) {
  const [activeTab, setActiveTab] = useState<ModalTab>('library');
  const [customTitle, setCustomTitle] = useState('');
  const [customAuthor, setCustomAuthor] = useState('');
  const [customContent, setCustomContent] = useState('');
  const [formError, setFormError] = useState('');

  const highestWpm = stats.highestWpm;
  let levelBadge = {
    name: "Nível 1 • Iniciante",
    desc: "Melhorando cadência mecânica, eliminando hábitos de regressão e calibrando velocidade de leitura por Varredura de Pacing.",
    color: "text-cyan-400 border-cyan-500/20 bg-cyan-500/5",
    dots: 1
  };

  if (highestWpm > 275 && highestWpm <= 450) {
    levelBadge = {
      name: "Nível 2 • Intermediário",
      desc: "Seus olhos já capturam de 2 a 3 palavras juntas, expandindo sua velocidade de retenção por Agrupamento (Chunks).",
      color: "text-amber-400 border-amber-500/20 bg-amber-500/5",
      dots: 2
    };
  } else if (highestWpm > 450 && highestWpm <= 600) {
    levelBadge = {
      name: "Nível 3 • Avançado",
      desc: "Excelente capacidade de captação lateral. Amplitude ampliada por saltos precisos de visão periférica ativa.",
      color: "text-indigo-400 border-indigo-500/20 bg-indigo-500/5",
      dots: 3
    };
  } else if (highestWpm > 600) {
    levelBadge = {
      name: "Nível 4 • Master Cognitivo",
      desc: "Processamento visual puro de frases em altíssima velocidade. Super amplitude ativada por exibição RSVP.",
      color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5",
      dots: 4
    };
  }

  if (!isOpen) return null;

  const handleSubmitCustom = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!customTitle.trim()) {
      setFormError('Insira um título para o texto.');
      return;
    }
    if (!customContent.trim()) {
      setFormError('O conteúdo do texto não pode estar vazio.');
      return;
    }

    const finalAuthor = customAuthor.trim() || 'Autor Desconhecido';
    onAddCustomBook(customTitle.trim(), finalAuthor, customContent.trim());
    
    // Reset form & go to library
    setCustomTitle('');
    setCustomAuthor('');
    setCustomContent('');
    setActiveTab('library');
  };

  return (
    <div className="fixed inset-0 bg-[#050507]/90 backdrop-blur-lg z-50 flex items-center justify-center p-4 select-none">
      
      {/* Absolute Close Backdrop click trigger */}
      <div className="absolute inset-0 cursor-default" onClick={onClose}></div>

      {/* Main glass card container */}
      <div 
        className="relative bg-white/[0.03] border border-white/10 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl z-10 flex flex-col h-[85vh] max-h-[640px]"
        id="books-modal-container"
      >
        {/* Header toolbar */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-white/[0.01]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/30">
              <BookOpen className="w-4.5 h-4.5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">Painel do Leitor</h2>
              <p className="text-[11px] text-white/50">Gerencie livros, técnicas e métricas</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/15 hover:text-white transition-all text-white/60 active:scale-90 cursor-pointer"
            id="btn-close-modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher pills */}
        <div className="flex border-b border-white/10 p-3 bg-black/20 gap-2">
          <button
            onClick={() => setActiveTab('library')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
              activeTab === 'library'
                ? 'bg-cyan-500/15 border border-cyan-500/35 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.1)]'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
            id="tab-library"
          >
            <BookOpen className="w-4 h-4" />
            <span>Biblioteca</span>
          </button>
          
          <button
            onClick={() => setActiveTab('add')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
              activeTab === 'add'
                ? 'bg-cyan-500/15 border border-cyan-500/35 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.1)]'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
            id="tab-add"
          >
            <BookPlus className="w-4 h-4" />
            <span>Adicionar Texto</span>
          </button>

          <button
            onClick={() => setActiveTab('stats')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
              activeTab === 'stats'
                ? 'bg-cyan-500/15 border border-cyan-500/35 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.1)]'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
            id="tab-stats"
          >
            <Trophy className="w-4 h-4" />
            <span>Progresso & Dicas</span>
          </button>
        </div>

        {/* Modal scrolling content pane */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          
          {/* TAB 1: Library catalog */}
          {activeTab === 'library' && (
            <div className="space-y-6">
              <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest">
                Selecione um título para começar:
              </h3>
              
              <div className="grid gap-3.5">
                {books.map((b) => {
                  const isCurrent = b.id === currentBookId;
                  return (
                    <div 
                      key={b.id}
                      className={`group relative flex items-center justify-between p-4.5 rounded-2xl border transition-all ${
                        isCurrent 
                          ? 'bg-cyan-500/10 border-cyan-500/45 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_0_15px_rgba(6,182,212,0.15)]' 
                          : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-4.5 overflow-hidden flex-1">
                        <div className={`w-10 h-13 rounded-lg bg-gradient-to-br ${b.coverColor} flex flex-col items-center justify-center p-1 font-sans text-right relative flex-shrink-0 border border-white/10 shadow`}>
                          <span className="text-[9px] font-mono opacity-50 absolute top-1 right-1.5 uppercase tracking-tighter">
                            Book
                          </span>
                          <span className="text-white font-bold text-[14px] leading-tight select-none">
                            {b.title[0]}
                          </span>
                        </div>
                        <div className="overflow-hidden">
                          <h4 className="font-semibold text-white group-hover:text-cyan-400 transition-colors text-sm sm:text-base truncate">
                            {b.title}
                          </h4>
                          <p className="text-white/60 text-xs truncate">{b.author}</p>
                          <p className="text-[10px] text-cyan-400 mt-0.5 uppercase tracking-wide opacity-85">
                            {b.category}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        {isCurrent ? (
                          <div className="px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-[10px] font-mono uppercase text-cyan-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                            Ativo
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              onSelectBook(b.id);
                              onClose();
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white/80 text-xs hover:bg-white hover:text-black hover:border-white transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer font-medium"
                            id={`btn-select-${b.id}`}
                          >
                            <Play className="w-3 h-3 fill-current" />
                            Ler
                          </button>
                        )}

                        {/* Can only delete customized user books */}
                        {b.id !== 'andar-do-bebado' && b.id !== 'dom-casmurro' && b.id !== 'arte-da-guerra' && (
                          <button
                            onClick={() => onDeleteBook(b.id)}
                            className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all active:scale-90 cursor-pointer"
                            title="Remover texto customizado"
                            id={`btn-delete-${b.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: Add custom text */}
          {activeTab === 'add' && (
            <form onSubmit={handleSubmitCustom} className="space-y-4">
              <div className="flex items-center gap-2 mb-2 bg-cyan-400/5 border border-cyan-400/10 p-3.5 rounded-2xl">
                <Milestone className="w-4 h-4 text-cyan-400" />
                <p className="text-xs text-white/70">
                  Insira qualquer notícia, artigo ou texto pessoal abaixo. Nosso motor dividirá o texto automaticamente em sequências de treino para agilizar sua leitura.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-1.5">
                  Título do Texto *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Artigo Científico sobre Foco"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:bg-white/[0.08] transition-all"
                  id="add-custom-title"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-1.5">
                  Autor (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Dr. Silva ou link do site"
                  value={customAuthor}
                  onChange={(e) => setCustomAuthor(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:bg-white/[0.08] transition-all"
                  id="add-custom-author"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-1.5">
                  Artigo/Livro Completo *
                </label>
                <textarea
                  placeholder="Cole aqui o texto inteiro que deseja ler de forma dinâmica..."
                  rows={6}
                  value={customContent}
                  onChange={(e) => setCustomContent(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:bg-white/[0.08] transition-all resize-none"
                  id="add-custom-content"
                ></textarea>
              </div>

              {formError && (
                <p className="text-xs text-red-400 font-mono font-bold bg-red-400/10 px-3 py-1.5 rounded-lg border border-red-500/20">
                  ⚠ Error: {formError}
                </p>
              )}

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-cyan-500 text-black hover:bg-cyan-400 transition-all flex items-center justify-center gap-2 font-bold cursor-pointer shadow-[0_4px_15px_rgba(6,182,212,0.3)] active:scale-98"
                id="btn-submit-custom-book"
              >
                <Plus className="w-5 h-5 fill-current" />
                Adicionar Livremente & Treinar Leitura
              </button>
            </form>
          )}

          {/* TAB 3: Statistics and Reader guidelines */}
          {activeTab === 'stats' && (
            <div className="space-y-6">
              
              {/* Learning progress cards */}
              <div>
                <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3.5">
                  Seu Progresso de Treino
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col items-center text-center">
                    <span className="text-white/40 text-[10px] tracking-wide uppercase uppercase-none">Palavras</span>
                    <span className="text-xl sm:text-2xl font-mono text-cyan-400 font-bold mt-1">
                      {stats.completedBooks}
                    </span>
                  </div>
                  
                  <div className="p-3.5 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col items-center text-center">
                    <span className="text-white/40 text-[10px] tracking-wide uppercase">Minutos</span>
                    <span className="text-xl sm:text-2xl font-mono text-cyan-400 font-bold mt-1">
                      {stats.totalMinutesRead}
                    </span>
                  </div>

                  <div className="p-3.5 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col items-center text-center">
                    <span className="text-white/40 text-[10px] tracking-wide uppercase">Veloc. Média</span>
                    <span className="text-xl sm:text-2xl font-mono text-cyan-400 font-bold mt-1">
                      {stats.averageWpm} <span className="text-[10px] text-white/40">wpm</span>
                    </span>
                  </div>

                  <div className="p-3.5 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col items-center text-center">
                    <span className="text-white/40 text-[10px] tracking-wide uppercase">Veloc. Pico</span>
                    <span className="text-xl sm:text-2xl font-mono text-cyan-400 font-bold mt-1">
                      {stats.highestWpm} <span className="text-[10px] text-white/40">wpm</span>
                    </span>
                  </div>
                </div>

                {/* Dynamic Level Status Badge */}
                <div className={`mt-4 p-4 rounded-xl border ${levelBadge.color} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[9px] font-bold tracking-widest uppercase font-mono opacity-60">Seu Domínio de Leitura</span>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4].map((dot) => (
                          <span 
                            key={dot} 
                            className={`w-1.5 h-1.5 rounded-full ${
                              dot <= levelBadge.dots ? 'bg-cyan-400' : 'bg-white/10'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-white tracking-wide">{levelBadge.name}</h4>
                    <p className="text-[11px] text-white/60 mt-0.5 leading-relaxed">{levelBadge.desc}</p>
                  </div>
                  <div className="text-[9px] bg-white/5 border border-white/10 px-2.5 py-1.5 rounded-xl text-white/40 uppercase font-mono tracking-wider text-center self-stretch sm:self-auto flex items-center justify-center">
                    {highestWpm > 0 ? `Performance Max: ${highestWpm} WPM` : "Pronto para Iniciar"}
                  </div>
                </div>

                <div className="mt-2.5 flex justify-end">
                  <button 
                    onClick={onClearStats}
                    className="text-[10px] text-white/30 hover:text-red-400 transition-colors pointer-events-auto cursor-pointer"
                    id="btn-clear-stats"
                  >
                    Zerar Estatísticas
                  </button>
                </div>
              </div>

              {/* Tips cheat sheet */}
              <div>
                <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">
                  Técnicas de Leitura Rápida
                </h3>
                <div className="grid gap-3">
                  {GENERAL_TIPS.map((tip, idx) => (
                    <div 
                      key={idx}
                      className="p-3.5 rounded-xl border border-white/5 bg-white/[0.01] flex gap-3 items-start"
                    >
                      <div className="w-5 h-5 rounded-full bg-cyan-400/10 border border-cyan-400/20 text-cyan-300 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <div>
                        <h4 className="font-semibold text-white text-xs sm:text-sm">
                          {tip.title}
                        </h4>
                        <p className="text-white/60 text-xs mt-0.5">
                          {tip.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer info lock */}
        <div className="p-4 bg-black/40 border-t border-white/10 text-center text-[10px] text-white/30 font-mono">
          Desenvolvido com Foco Neurocognitivo • Versão 1.5
        </div>

      </div>
    </div>
  );
}
