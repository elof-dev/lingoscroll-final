import { CARDS, INITIAL_IDS, cardById, type Card, type Kind } from '../data/cards';

const PROGRESS_KEY = 'lingoscroll-progress-v1';
const SAVED_KEY = 'lingoscroll-favorites-v1';

export type CardProgress = {
  attempts: number;
  correct: number;
  streak: number;
  lastSeen: number;
  dueAt: number;
};

export type LearningState = {
  cards: Record<string, CardProgress>;
  totalAnswers: number;
  totalCorrect: number;
  xp: number;
  dailyDate: string;
  dailyAnswers: number;
};

export type FeedItem = { instance: string; cardId: string };

const today = () => new Date().toLocaleDateString('en-CA');
const INITIAL_STATE: LearningState = {
  cards: {}, totalAnswers: 0, totalCorrect: 0, xp: 0, dailyDate: today(), dailyAnswers: 0,
};

export function loadProgress(): LearningState {
  try {
    const saved = JSON.parse(localStorage.getItem(PROGRESS_KEY) || 'null') as Partial<LearningState> | null;
    if (!saved || typeof saved !== 'object') return INITIAL_STATE;
    return {
      cards: saved.cards && typeof saved.cards === 'object' ? saved.cards : {},
      totalAnswers: Number(saved.totalAnswers) || 0,
      totalCorrect: Number(saved.totalCorrect) || 0,
      xp: Number(saved.xp) || 0,
      dailyDate: saved.dailyDate || today(),
      dailyAnswers: Number(saved.dailyAnswers) || 0,
    };
  } catch { return INITIAL_STATE; }
}

export function persistProgress(state: LearningState) {
  try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(state)); } catch { /* private browsing */ }
}

export function loadFavorites(): string[] {
  try {
    const stored = JSON.parse(localStorage.getItem(SAVED_KEY) || '[]');
    return Array.isArray(stored) ? stored.filter((id): id is string => typeof id === 'string' && !!cardById[id]) : [];
  } catch { return []; }
}

export function persistFavorites(ids: string[]) {
  try { localStorage.setItem(SAVED_KEY, JSON.stringify(ids)); } catch { /* private browsing */ }
}

export function recordAnswer(state: LearningState, cardId: string, isCorrect: boolean): LearningState {
  const now = Date.now();
  const old = state.cards[cardId] || { attempts: 0, correct: 0, streak: 0, lastSeen: 0, dueAt: 0 };
  const streak = isCorrect ? old.streak + 1 : 0;
  const delay = isCorrect
    ? [0, 24, 72, 168, 336][Math.min(streak, 4)] * 60 * 60 * 1000
    : 5 * 60 * 1000;
  return {
    cards: {
      ...state.cards,
      [cardId]: {
        attempts: old.attempts + 1,
        correct: old.correct + Number(isCorrect),
        streak,
        lastSeen: now,
        dueAt: now + delay,
      },
    },
    totalAnswers: state.totalAnswers + 1,
    totalCorrect: state.totalCorrect + Number(isCorrect),
    xp: state.xp + (isCorrect ? 15 : 5),
    dailyDate: today(),
    dailyAnswers: (state.dailyDate === today() ? state.dailyAnswers : 0) + 1,
  };
}

let nextInstance = 0;
const instance = (id: string): FeedItem => ({ cardId: id, instance: `item-${++nextInstance}-${id}` });

export function initialFeed(progress: LearningState): FeedItem[] {
  const anyAnswers = progress.totalAnswers > 0;
  if (!anyAnswers) return INITIAL_IDS.map(instance);
  return buildBatch([], progress, 10);
}

// Offline feed: new cards, misses, scheduled reviews and well-known cards.
// Correctly answered cards never disappear, even after 14 days.
// Around one quarter of each batch is reserved for previously correct cards,
// even if the scheduled review date has not arrived.
const FEED_MIX = [
  'new', 'due', 'new', 'learned', 'new', 'difficult',
  'new', 'learned', 'due', 'new', 'learned', 'difficult',
] as const;
type Pool = (typeof FEED_MIX)[number];

function belongsToPool(card: Card, pool: Pool, progress: LearningState, now: number): boolean {
  const stats = progress.cards[card.id];
  if (pool === 'new') return !stats;
  if (!stats) return false;
  if (pool === 'due') return stats.dueAt <= now;
  if (pool === 'learned') return stats.correct > 0;
  return stats.attempts > stats.correct;
}

// Weighted selection considers recent content without hiding familiar cards.
export function buildBatch(history: FeedItem[], progress: LearningState, count: number): FeedItem[] {
  const output: FeedItem[] = [];
  const now = Date.now();
  for (let n = 0; n < count; n++) {
    const sequence = [...history, ...output];
    const recent = new Set(sequence.slice(-18).map(item => item.cardId));
    const last = sequence.at(-1);
    const previous = last ? cardById[last.cardId] : undefined;
    let candidates = CARDS.filter(card => !recent.has(card.id));
    if (!candidates.length) candidates = CARDS.filter(card => card.id !== last?.cardId);

    const preferred = FEED_MIX[(history.length + n) % FEED_MIX.length];
    const fallback: Pool[] = preferred === 'learned'
      ? ['learned', 'due', 'difficult', 'new']
      : preferred === 'difficult'
        ? ['difficult', 'due', 'learned', 'new']
        : preferred === 'due'
          ? ['due', 'difficult', 'learned', 'new']
          : ['new', 'due', 'difficult', 'learned'];
    for (const pool of fallback) {
      const matches = candidates.filter(card => belongsToPool(card, pool, progress, now));
      if (matches.length) { candidates = matches; break; }
    }

    const weights = candidates.map(card => {
      const stats = progress.cards[card.id];
      // A mastered card stays eligible for spaced reviews.
      const missed = stats ? stats.attempts - stats.correct : 0;
      const elapsedHours = stats ? Math.max(0, (now - stats.lastSeen) / 3_600_000) : 0;
      let weight = stats ? 1.2 + Math.min(3, Math.log1p(elapsedHours) * 0.5) + Math.min(3, missed) : 2;
      if (stats?.dueAt && stats.dueAt <= now) weight *= 1.6;
      if (previous?.kind === card.kind) weight *= 0.47;
      if (previous?.topic === card.topic) weight *= 0.36;
      const priorInQueue = sequence.slice(-60).filter(item => item.cardId === card.id).length;
      weight /= (1 + priorInQueue * 2);
      return Math.max(0.05, weight);
    });

    let draw = Math.random() * weights.reduce((sum, weight) => sum + weight, 0);
    let chosen = candidates[candidates.length - 1];
    for (let i = 0; i < candidates.length; i++) {
      draw -= weights[i];
      if (draw <= 0) { chosen = candidates[i]; break; }
    }
    output.push(instance(chosen.id));
  }
  return output;
}

export const kindInfo: Record<Kind, { label: string; verb: string; index: string }> = {
  translate: { label: 'SAY IT NATURALLY', verb: 'Say it', index: '01' },
  quiz: { label: 'PICK THE BEST FIT', verb: 'Quick quiz', index: '02' },
  gap: { label: 'COMPLETE THE PHRASE', verb: 'Fill the gap', index: '03' },
  error: { label: 'SPOT THE MISTAKE', verb: 'Spot the mistake', index: '04' },
  idiom: { label: 'EVERYDAY ENGLISH', verb: 'Real talk', index: '05' },
  story: { label: 'YOUR TURN', verb: 'Mini story', index: '06' },
  contrast: { label: 'SUBTLE DIFFERENCE', verb: 'Meaning in context', index: '07' },
  listen: { label: 'LISTEN CLOSELY', verb: 'Listening', index: '08' },
};

export function getLearningInsights(state: LearningState) {
  const started = Object.keys(state.cards).length;
  const mastered = Object.values(state.cards).filter(s => s.streak >= 2).length;
  const accuracy = state.totalAnswers ? Math.round(state.totalCorrect / state.totalAnswers * 100) : 0;
  const due = Object.values(state.cards).filter(s => s.dueAt <= Date.now()).length;
  const topicSummary = new Map<string, { total: number; correct: number }>();
  Object.entries(state.cards).forEach(([id, item]) => {
    const topic = cardById[id]?.topic;
    if (!topic) return;
    const data = topicSummary.get(topic) || { total: 0, correct: 0 };
    topicSummary.set(topic, { total: data.total + item.attempts, correct: data.correct + item.correct });
  });
  const weakTopics = [...topicSummary.entries()]
    .filter(([, s]) => s.total >= 1)
    .sort((a, b) => a[1].correct / a[1].total - b[1].correct / b[1].total)
    .slice(0, 3)
    .map(([topic, s]) => ({ topic, accuracy: Math.round(s.correct / s.total * 100) }));
  return { started, mastered, accuracy, due, weakTopics };
}

export function englishForAudio(card: Card): string {
  if ('answer' in card) {
    return card.kind === 'idiom' ? card.question : card.answer;
  }
  return card.options[card.correctIndex];
}

export function speakEnglish(text: string): boolean {
  if (!('speechSynthesis' in window)) return false;
  window.speechSynthesis.cancel();
  const voice = new SpeechSynthesisUtterance(text);
  voice.lang = 'en-US';
  voice.rate = 0.88;
  voice.pitch = 1;
  window.speechSynthesis.speak(voice);
  return true;
}
