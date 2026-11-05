# LingoScroll — Personal English Practice

A personal, mobile-first English practice feed. Open it, scroll, think, answer, and come back tomorrow. **No account, server, AI integration, database, or API key is required.**

## Start in one click

1. Extract the ZIP file.
2. Open **`demo.html`** in Chrome, Safari, Edge, or Firefox.
3. Answer the cards and swipe up to keep going.

`demo.html` is the **complete standalone app**. It includes the full lesson deck, interactive explanations, voice playback (if supported by your device), and locally saved progress. It does not require Node, npm or an internet connection for the learning content. Optional web fonts may load when a connection is available.

> **Keep your progress:** Answers and favorites are stored in this browser's local storage. The browser may consider a different file path, URL, profile, or device to be a different storage location. To continue from an existing installation, keep using the same address and browser. Clearing the website's data clears this progress. There is no cross-device synchronization or export tool.

## What's included

- **English-only cards:** say-it-naturally prompts, everyday expressions, quizzes, missing-word exercises, conversations, error corrections, listening cards and contextual comparisons. The standalone build includes every card from the JSON deck.
- The application, all prompts, options, answers, hints, feedback, menus and statistics are **in English**.
- Full-sentence multiple-choice distractors are grammatical English sentences. The challenge is choosing the one that best matches the **time, meaning or situation**, not spotting an absurd sentence.
- Missing-word cards intentionally ask you to select the one preposition or verb form that completes the sentence. Error-correction cards intentionally contain a mistake to identify.
- The two redundant category headers above each card have been removed. The favorite button remains.
- Unlimited scrolling, local XP, progress, daily goal, favorites, spaced reviews, and audio support are preserved from V1.
- Correctly answered cards **keep appearing**. A familiar concept can still return even before its scheduled spaced review.
- On say-it-naturally, expression, error-correction and listening cards, optionally write your answer before revealing the suggested answer. Your text stays visible, read-only, for comparison; other formulations can be correct. Self-assess with **Got it!** or **Practice again**: there is no automatic text grading. Multiple-choice cards are unchanged.
- Written answers stay only in the current page session, separately for each card appearance. Reloading clears them; learning progress and favorites remain saved.

### Development version (React + TypeScript)

The same English deck is used by the standalone app and the included React source code. The **single active lesson deck** is `src/data/englishCards.json`.

Requirements: Node.js 20+ and npm. Inside the folder, run:

```bash
npm install
npm run dev
```

Vite prints the local URL (often `http://localhost:5173`). On the same Wi-Fi network, a mobile device can open the `Network` address printed by Vite. For a production build, use `npm run build` and `npm run preview`.

**Build note:** `npm run build` validates TypeScript and generates the production React bundle.

### Editing the lessons

Edit `src/data/englishCards.json` (IDs must remain stable if you want to retain the related progress). To regenerate the standalone demo from that JSON file:

```bash
python scripts/build_standalone.py
```

You can edit the English JSON directly. After editing it, run `python scripts/build_standalone.py` to keep the standalone app in sync. Keep each existing ID unchanged if you want its progress to stay associated with that card.

For a basic data check without external dependencies:

```bash
python scripts/validate_deck.py
```

## Project files

- `demo.html` — all-in-one app for normal use.
- `src/App.tsx` — navigation, feed, progress and favorites.
- `src/components/CardSlide.tsx` — interactive card display.
- `src/data/englishCards.json` — active English-only content.
- `src/lib/learning.ts` — local feed, mastery, repetition and speech synthesis.
- `src/styles.css` — responsive UI and animations.
- `scripts/build_standalone.py` — regenerate the standalone HTML.

No deployment, credentials, or subscriptions are required to use the downloaded HTML file. This is a **personal learning app**, not a multi-user service or official language-level assessment.
