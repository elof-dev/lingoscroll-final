# LingoScroll V2 — Changes

## Requested changes delivered

1. **English-only interface and lessons.** All 191 active cards now use English prompts, answers, explanations, labels and feedback. Former French-to-English translation cards are now English-only production challenges (say the idea naturally in English).
2. **Grammatically correct distractors.** All 61 full-sentence-choice cards (quiz, conversation, contrast) have been rewritten with grammatical English alternatives and context-specific answers. Missing-word and spot-the-mistake formats intentionally retain grammar-specific traps.
3. **Cleaner card layout.** Removed both upper card headers (e.g. “The difference” and “What is the nuance?”) from **every card**. Favorites and all core interactions remain.

## Preserved from V1

191 stable card IDs, eight card formats, scrolling, colors, local XP, goals, favorites, audio, progression, revisiting correctly answered cards and spaced review selection.

## Technical details

- Same local-storage keys as V1 when opened from the same origin/path.
- No external AI, backend or database.
- Browser-tested standalone demo; React source retained, with syntax checks but no full npm build in this environment.
- The original V1 card content is kept as reference, not rendered.
