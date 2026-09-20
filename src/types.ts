export interface Book {
  id: string;
  title: string;
  author: string;
  coverColor: string;
  category: string;
  content: string; // The full text
  paragraphs: string[]; // Content split into paragraphs
}

export type ReadingTechnique = 'chunking' | 'peripheral' | 'rsvp' | 'sweep';

export interface ReadingState {
  currentBookId: string;
  isPlaying: boolean;
  wpm: number; // Words Per Minute
  technique: ReadingTechnique;
  currentParagraphIndex: number;
  currentWordIndex: number; // Index of the word/chunk within the paragraph or book
  chunkSize: number; // For chunking: how many words to group
  guideLines: boolean;
  blurAdjacents: boolean;
  highlightORP: boolean; // RSVP Optimal Recognition Point
}

export interface SpeedReadingStat {
  completedBooks: number;
  totalMinutesRead: number;
  averageWpm: number;
  highestWpm: number;
}
