import englishCards from './englishCards.json';

export type Difficulty = 'A2' | 'B1' | 'B2';
export type Theme = 'lime' | 'violet' | 'orange' | 'blue' | 'rose' | 'mint';
export type Kind = 'translate' | 'quiz' | 'gap' | 'error' | 'idiom' | 'story' | 'contrast' | 'listen';

type BaseCard = {
  id: string;
  kind: Kind;
  topic: string;
  level: Difficulty;
  theme: Theme;
  lesson: string;
};

export type RevealCard = BaseCard & {
  kind: 'translate' | 'error' | 'idiom' | 'listen';
  question: string;
  answer: string;
  explanation: string;
  detail?: string;
};

export type ChoiceCard = BaseCard & {
  kind: 'quiz' | 'gap' | 'story' | 'contrast';
  question: string;
  context?: string;
  options: [string, string, string];
  correctIndex: 0 | 1 | 2;
  explanation: string;
  detail?: string;
  character?: string;
};

export type Card = RevealCard | ChoiceCard;

// The English JSON is the single active deck for the React app and standalone demo.
// Stable IDs preserve progress whenever the browser storage origin stays the same.
export const CARDS: Card[] = englishCards as unknown as Card[];

export const INITIAL_IDS = [
  'living-bali', 'first-meeting', 'down-for-that', 'agree-error', 'looking-forward',
  'cafe-story', 'lived-thailand', 'about-to-call', 'as-soon-as', 'no-worries',
];

export const cardById: Record<string, Card> = Object.fromEntries(CARDS.map(card => [card.id, card]));
