import { useId, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowDown, Bookmark, Check, CheckCircle2, Ear, Eye,
  Lightbulb, Play, Volume2, X,
} from 'lucide-react';
import type { Card } from '../data/cards';
import { englishForAudio, speakEnglish } from '../lib/learning';

type Props = {
  card: Card;
  isFavorite: boolean;
  onFavorite: (cardId: string) => void;
  onAnswer: (cardId: string, correct: boolean) => void;
  onNext: () => void;
};

export default function CardSlide({ card, isFavorite, onFavorite, onAnswer, onNext }: Props) {
  const [revealed, setRevealed] = useState(false);
  const [chosen, setChosen] = useState<number | null>(null);
  const [rated, setRated] = useState<'known' | 'review' | null>(null);
  const [audioError, setAudioError] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [writtenAnswer, setWrittenAnswer] = useState('');
  const answerId = useId();
  const isChoice = card.kind === 'quiz' || card.kind === 'gap' || card.kind === 'story' || card.kind === 'contrast';
  const completed = isChoice ? chosen !== null : rated !== null;
  const isCorrect = isChoice ? chosen === (isChoice ? card.correctIndex : -1) : rated === 'known';

  function play() {
    const result = speakEnglish(englishForAudio(card));
    if (!result) setAudioError(true);
  }

  function choose(index: number) {
    if (!isChoice || chosen !== null) return;
    setChosen(index);
    onAnswer(card.id, index === card.correctIndex);
  }

  function rate(value: 'known' | 'review') {
    if (isChoice || rated !== null) return;
    setRated(value);
    onAnswer(card.id, value === 'known');
  }

  function reveal() {
    if (!isChoice) setRevealed(true);
  }

  const explanation = card.explanation;
  const detail = card.detail;

  return (
    <div className={`lesson-surface theme-${card.theme} kind-${card.kind}`}>
      <div className="surface-orb orb-top" aria-hidden="true" />
      <div className="surface-orb orb-bottom" aria-hidden="true" />
      <div className="surface-graphic" aria-hidden="true"><span /><span /><span /></div>

      <div className="lesson-content">
        <div className="card-meta-row">
          <button
            type="button"
            className={`save-btn ${isFavorite ? 'is-saved' : ''}`}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            aria-pressed={isFavorite}
            title={isFavorite ? 'Remove from favorites' : 'Save this card'}
            onClick={() => onFavorite(card.id)}
          >
            <Bookmark size={19} fill={isFavorite ? 'currentColor' : 'none'} />
          </button>
        </div>

        <div className="card-heading">
          {card.kind === 'story' && <div className="scene-tag"><span className="avatar">✦</span> {card.character}</div>}
          {card.kind === 'story' && <div className="chat-bubble">{card.context}</div>}
          {card.kind === 'quiz' && card.context && <div className="prompt-context">{card.context}</div>}
          {card.kind === 'listen' ? (
            <>
              <h1 className="main-question">{card.question}</h1>
              <button type="button" onClick={play} className="audio-hero" aria-label="Listen to the English sentence">
                <span className="audio-icon"><Play size={27} fill="currentColor" /></span>
                <span className="audio-wave" aria-hidden="true"><i/><i/><i/><i/><i/><i/><i/><i/><i/></span>
                <span className="audio-caption">Tap to listen</span>
              </button>
              {audioError && <span className="audio-error">Audio isn't available in this browser.</span>}
            </>
          ) : (
            <h1 className={`main-question ${card.kind === 'idiom' ? 'idiom-question' : ''} ${card.kind === 'error' ? 'mistake-question' : ''} ${card.kind === 'gap' ? 'gap-question' : ''}`}>
              {card.question}
            </h1>
          )}
          {!isChoice && card.kind !== 'listen' && !revealed && (
            <p className="thinking-caption">{card.kind === 'idiom' ? 'What does this mean in everyday English?' : card.kind === 'error' ? 'Can you spot what needs fixing?' : 'Try writing your answer before revealing a suggestion.'}</p>
          )}
        </div>

        {!isChoice && (
          <div className="written-answer">
            <label htmlFor={answerId}>Your answer</label>
            <textarea
              id={answerId}
              aria-describedby={`${answerId}-hint`}
              value={writtenAnswer}
              onChange={event => setWrittenAnswer(event.target.value)}
              readOnly={revealed}
              rows={3}
              lang="en"
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="sentences"
              placeholder={card.kind === 'listen' ? 'Write what you hear...' : card.kind === 'error' ? 'Write the corrected sentence...' : card.kind === 'idiom' ? 'Explain it in your own words...' : 'Write your answer in English...'}
            />
            <p id={`${answerId}-hint`} className="writing-hint">{revealed ? 'Compare the meaning, not every word. Other wording can be correct too. You decide whether to practise again.' : 'Writing is optional. Try first, then reveal and compare.'}</p>
          </div>
        )}

        {isChoice && (
          <div className="answers" role="group" aria-label="Answer choices">
            {card.options.map((option, index) => {
              const correctAnswer = chosen !== null && index === card.correctIndex;
              const wrongAnswer = chosen === index && chosen !== card.correctIndex;
              return (
                <button
                  className={`answer-option ${correctAnswer ? 'answer-correct' : ''} ${wrongAnswer ? 'answer-wrong' : ''} ${chosen !== null && !correctAnswer && !wrongAnswer ? 'answer-muted' : ''}`}
                  key={option}
                  onClick={() => choose(index)}
                  disabled={chosen !== null}
                  type="button"
                >
                  <span className="answer-letter">{String.fromCharCode(65 + index)}</span>
                  <span className="answer-text">{option}</span>
                  {correctAnswer && <CheckCircle2 size={19} className="answer-icon" />}
                  {wrongAnswer && <X size={19} className="answer-icon" />}
                </button>
              );
            })}
          </div>
        )}

        <AnimatePresence mode="wait">
          {'answer' in card && revealed && (
            <motion.div className="reveal-panel" key="reveal" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
              <span className="answer-caption">{card.kind === 'error' ? 'CORRECTED VERSION' : card.kind === 'idiom' ? 'IT MEANS…' : card.kind === 'listen' ? 'YOU HEARD…' : 'A NATURAL WAY TO SAY IT'}</span>
              <div className="answer-reveal-line">
                <p>{card.answer}</p>
                <button type="button" onClick={play} className="pronounce-btn" aria-label="Hear the pronunciation" title="Listen in English"><Volume2 size={20} /></button>
              </div>
              {detail && <p className="reveal-detail">{detail}</p>}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="interaction-zone">
        <AnimatePresence mode="wait">
          {isChoice && chosen !== null && (
            <motion.div key="choice-feedback" className={`feedback-box ${isCorrect ? 'feedback-success' : 'feedback-try'}`} initial={{ opacity: 0, y: 9 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <span className="feedback-top">{isCorrect ? <><Check size={16}/> Nice work! +15 XP</> : <><Lightbulb size={16}/> Not quite! +5 XP</>}</span>
              <p>{explanation}</p>
              {detail && <button type="button" className="detail-toggle" onClick={() => setDetailOpen(!detailOpen)}>{detailOpen ? 'Hide details' : 'More context'} <span>{detailOpen ? '−' : '+'}</span></button>}
              {detailOpen && detail && <p className="detail-text">{detail}</p>}
            </motion.div>
          )}
          {!isChoice && revealed && rated === null && (
            <motion.div key="self-rate" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <p className="tiny-explanation"><Lightbulb size={15} />{explanation}</p>
              <div className="rate-heading">Did you get it?</div>
              <div className="rate-actions">
                <button type="button" className="rate-btn rate-later" onClick={() => rate('review')}><Ear size={18} /> Practice again</button>
                <button type="button" className="rate-btn rate-known" onClick={() => rate('known')}><Check size={19} /> Got it!</button>
              </div>
            </motion.div>
          )}
          {!isChoice && !revealed && (
            <motion.div key="before-reveal" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <button type="button" className="primary-action" onClick={reveal}><Eye size={19} /> Reveal answer <span>↗</span></button>
              <div className="action-hint">No pressure. Just a quick challenge. ✨</div>
            </motion.div>
          )}
          {completed && (
            <motion.div key="complete" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {!isChoice && <div className={`completion-caption ${rated === 'known' ? 'positive' : ''}`}>{rated === 'known' ? '✓ Well done! You will see it again.' : '↻ You will get another chance soon.'}</div>}
              <button type="button" className="primary-action" onClick={onNext}>Next card <ArrowDown size={20} /></button>
              <div className="action-hint">Or swipe up to keep going</div>
            </motion.div>
          )}
          {isChoice && chosen === null && (
            <motion.div key="before-choice" className="choice-hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <span className="hint-sparkle">✦</span> Pick an answer to see why
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
