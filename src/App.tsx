import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowDown, ArrowLeft, ArrowRight, BarChart3, Bookmark, CheckCircle2, ChevronDown,
  Flame, Headphones, Heart, Home, Lightbulb, MoonStar, Sparkles, Target, TrendingUp, X,
} from 'lucide-react';
import { CARDS, cardById } from './data/cards';
import CardSlide from './components/CardSlide';
import {
  buildBatch, getLearningInsights, initialFeed, loadFavorites, loadProgress,
  persistFavorites, persistProgress, recordAnswer, type FeedItem, type LearningState,
} from './lib/learning';

type Panel = 'saved' | 'stats' | 'about' | null;
const DAILY_GOAL = 12;

function Logo({ compact = false }: { compact?: boolean }) {
  return <div className={`brand ${compact ? 'brand-compact' : ''}`}>
    <span className="brand-mark"><span className="brand-mark-letter">L<span className="brand-dot">.</span></span></span>
    <span className="brand-name">lingo<span>scroll</span></span>
  </div>;
}

function App() {
  const [progress, setProgress] = useState<LearningState>(loadProgress);
  const progressRef = useRef(progress);
  const [favorites, setFavorites] = useState<string[]>(loadFavorites);
  const [queue, setQueue] = useState<FeedItem[]>(() => initialFeed(loadProgress()));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [panel, setPanel] = useState<Panel>(null);
  const [combo, setCombo] = useState(0);
  const [toast, setToast] = useState('');
  const [jumpToLast, setJumpToLast] = useState(false);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const queueRef = useRef(queue);
  const appendingRef = useRef(false);
  const toastTimerRef = useRef<number | undefined>(undefined);

  const insights = useMemo(() => getLearningInsights(progress), [progress]);
  const todaysAnswers = progress.dailyDate === new Date().toLocaleDateString('en-CA') ? progress.dailyAnswers : 0;
  const goalPercent = Math.min(todaysAnswers / DAILY_GOAL * 100, 100);
  const dailyGoalReached = todaysAnswers >= DAILY_GOAL;

  useEffect(() => { progressRef.current = progress; persistProgress(progress); }, [progress]);
  useEffect(() => { persistFavorites(favorites); }, [favorites]);
  useEffect(() => { queueRef.current = queue; }, [queue]);
  useEffect(() => () => window.clearTimeout(toastTimerRef.current), []);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(''), 2300);
  }, []);

  const toggleFavorite = useCallback((cardId: string) => {
    setFavorites(old => {
      const exists = old.includes(cardId);
      showToast(exists ? 'Removed from favorites' : 'Saved for later ♡');
      return exists ? old.filter(id => id !== cardId) : [...old, cardId];
    });
  }, [showToast]);

  const record = useCallback((cardId: string, correct: boolean) => {
    setProgress(old => recordAnswer(old, cardId, correct));
    setCombo(old => correct ? old + 1 : 0);
  }, []);

  const scrollToIndex = useCallback((index: number) => {
    const node = scrollerRef.current;
    if (!node) return;
    const bounded = Math.min(queueRef.current.length - 1, Math.max(0, index));
    node.scrollTo({ top: bounded * node.clientHeight, behavior: 'smooth' });
  }, []);

  const appendMore = useCallback(() => {
    if (appendingRef.current) return;
    appendingRef.current = true;
    setQueue(old => [...old, ...buildBatch(old, progressRef.current, 12)]);
    window.setTimeout(() => { appendingRef.current = false; }, 220);
  }, []);

  const handleScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el || !el.clientHeight) return;
    const index = Math.max(0, Math.round(el.scrollTop / el.clientHeight));
    setCurrentIndex(old => old === index ? old : index);
    if (index >= queueRef.current.length - 5) appendMore();
  }, [appendMore]);

  useEffect(() => {
    if (!jumpToLast) return;
    const target = queue.length - 1;
    const timer = window.setTimeout(() => {
      const node = scrollerRef.current;
      if (node) node.scrollTo({ top: target * node.clientHeight, behavior: 'instant' });
      setCurrentIndex(target);
      setJumpToLast(false);
    }, 30);
    return () => window.clearTimeout(timer);
  }, [queue, jumpToLast]);

  function openFavorite(cardId: string) {
    setPanel(null);
    setQueue(old => [...old, { instance: `favorite-${Date.now()}-${cardId}`, cardId }]);
    setJumpToLast(true);
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (panel || event.altKey || event.ctrlKey || event.metaKey) return;
      const target = event.target as HTMLElement;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.tagName === 'BUTTON') return;
      if (event.key === 'ArrowDown' || event.key === 'PageDown') {
        event.preventDefault(); scrollToIndex(currentIndex + 1);
      } else if (event.key === 'ArrowUp' || event.key === 'PageUp') {
        event.preventDefault(); scrollToIndex(currentIndex - 1);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [panel, currentIndex, scrollToIndex]);

  const currentCard = cardById[queue[currentIndex]?.cardId] || CARDS[0];

  return (
    <div className="app-layout">
      <aside className="desktop-left" aria-label="Introduction">
        <Logo />
        <div className="left-message">
          <div className="left-kicker"><span className="pulse-dot" /> YOUR DAILY ENGLISH BREAK</div>
          <h2>Scroll less.<br /><em>Speak more.</em></h2>
          <p>Your daily dose of real-life English. One question, one small win, one more scroll.</p>
          <div className="vertical-chips"><span>01 <b>Discover</b></span><span>02 <b>Think</b></span><span>03 <b>Remember</b></span></div>
        </div>
        <div className="left-bottom">
          <div className="soft-circle"><MoonStar size={20} /></div>
          <span>Made for your<br /><strong>after-hours English.</strong></span>
        </div>
      </aside>

      <main className="phone-frame" aria-label="English learning feed">
        <div className="feed" ref={scrollerRef} onScroll={handleScroll}>
          {queue.map((item, index) => (
            <section className="feed-slide" key={item.instance} aria-label={`Card ${index + 1}: ${cardById[item.cardId].lesson}`}>
              <CardSlide
                card={cardById[item.cardId]}
                isFavorite={favorites.includes(item.cardId)}
                onFavorite={toggleFavorite}
                onAnswer={record}
                onNext={() => scrollToIndex(index + 1)}
              />
            </section>
          ))}
        </div>

        <header className="mobile-header">
          <Logo compact />
          <div className="daily-progress-top" title={`Today's goal: ${todaysAnswers}/${DAILY_GOAL}`}>
            <span className="progress-mini-track"><span style={{ width: `${goalPercent}%` }} /></span>
            <span>{Math.min(todaysAnswers, DAILY_GOAL)}/{DAILY_GOAL}</span>
          </div>
          <button className="streak-pill" type="button" onClick={() => setPanel('stats')} aria-label={`${combo} correct answers in a row`}>
            <Flame size={16} fill="currentColor" /> <strong>{combo}</strong>
          </button>
        </header>

        <div className="side-dot-indicator" aria-hidden="true"><span/><span className="dot-active"/><span/></div>

        <nav className="bottom-nav" aria-label="Navigation">
          <button type="button" className={panel === null ? 'nav-item active' : 'nav-item'} onClick={() => { setPanel(null); scrollToIndex(0); }} aria-label="Back to the start of the feed"><Home size={19} fill={panel === null ? 'currentColor' : 'none'} /><span>Feed</span></button>
          <button type="button" className={panel === 'saved' ? 'nav-item active' : 'nav-item'} onClick={() => setPanel('saved')} aria-label="Open favorites"><Bookmark size={19} fill={panel === 'saved' ? 'currentColor' : 'none'} /><span>Saved{favorites.length > 0 ? ` · ${favorites.length}` : ''}</span></button>
          <button type="button" className={panel === 'stats' ? 'nav-item active' : 'nav-item'} onClick={() => setPanel('stats')} aria-label="View my progress"><BarChart3 size={19} /><span>Progress</span></button>
        </nav>

        <AnimatePresence>
          {toast && <motion.div className="toast" role="status" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>{toast}</motion.div>}
        </AnimatePresence>

        <AnimatePresence>
          {panel && <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="overlay-bar"><button type="button" className="icon-back" onClick={() => setPanel(null)} aria-label="Close"><ArrowLeft size={20}/></button><span>YOUR SPACE</span><button type="button" className="icon-back" onClick={() => setPanel(null)} aria-label="Close"><X size={20}/></button></div>
            {panel === 'saved' && <div className="overlay-content">
              <span className="overlay-eyebrow">YOUR SAVED CARDS</span>
              <h2>Keep these<br /><em>close.</em> <Heart size={27} fill="#fa8eae" color="#fa8eae" /></h2>
              <p className="overlay-lead">The phrases worth revisiting. Your favorites stay here whenever you need them.</p>
              {favorites.length === 0 ? <div className="empty-state"><Bookmark size={29} /><h3>No saved cards yet.</h3><p>Tap the bookmark on any card to save it for later.</p><button type="button" className="overlay-action" onClick={() => setPanel(null)}>Back to the feed <ArrowRight size={18}/></button></div> :
                <div className="favorite-list">{favorites.map(id => { const card = cardById[id]; return <button type="button" className="favorite-entry" key={id} onClick={() => openFavorite(id)}><span className={`fav-color theme-${card.theme}`}/><span><small>{card.lesson} · {card.level}</small><strong>{card.kind === 'listen' ? card.answer : card.question}</strong></span><ArrowRight size={18}/></button>; })}</div>}
            </div>}
            {panel === 'stats' && <div className="overlay-content">
              <span className="overlay-eyebrow">EVERY SCROLL COUNTS</span>
              <h2>Small steps.<br /><em>Big moves.</em> <Sparkles size={26} color="#c8fc69" /></h2>
              <p className="overlay-lead">Your learning progress is saved automatically in this browser.</p>
              <div className="big-stats"><div><strong>{progress.xp}</strong><span>XP earned</span></div><div><strong>{insights.accuracy}%</strong><span>Accuracy</span></div></div>
              <div className="today-card"><div className="today-card-top"><span><Target size={19}/> Daily goal</span><strong>{todaysAnswers} / {DAILY_GOAL}</strong></div><div className="today-bar"><span style={{width:`${goalPercent}%`}}/></div><p>{dailyGoalReached ? 'Daily goal reached! Keep going if you want it. ✨' : `${DAILY_GOAL - todaysAnswers} quick challenges to reach your goal.`}</p></div>
              <div className="stat-rows"><div><span><CheckCircle2 size={19}/> Cards seen</span><b>{insights.started} / {CARDS.length}</b></div><div><span><TrendingUp size={19}/> Well-known cards</span><b>{insights.mastered}</b></div><div><span><Headphones size={19}/> Reviews due</span><b>{insights.due}</b></div></div>
              {insights.weakTopics.length > 0 && <div className="focus-card"><span className="overlay-eyebrow">PRACTICE THESE MORE</span>{insights.weakTopics.map(({topic, accuracy}) => <div key={topic}><span>{topic}</span><strong>{accuracy}%</strong></div>)}</div>}
              <button type="button" className="overlay-action" onClick={() => setPanel(null)}>Keep learning <ArrowRight size={18}/></button>
            </div>}
            {panel === 'about' && <div className="overlay-content"><span className="overlay-eyebrow">HOW IT WORKS</span><h2>Learn.<br /><em>Repeat.</em></h2><p className="overlay-lead">Think of your answer or choose an option, see why it works, then swipe. Challenging cards appear more often, and familiar cards keep coming back too.</p><button type="button" className="overlay-action" onClick={() => setPanel(null)}>Let's go <ArrowRight size={18}/></button></div>}
          </motion.div>}
        </AnimatePresence>
      </main>

      <aside className="desktop-right" aria-label="Session summary">
        <div className="right-top"><span className="status-circle"/> LEARNING MODE <span className="mini-live">● LIVE</span></div>
        <div className="radar-panel">
          <div className="radar-heading"><span>YOUR RADAR</span><button type="button" onClick={() => setPanel('about')} aria-label="How to use the app"><Lightbulb size={17}/></button></div>
          <div className="xp-hero"><strong>{progress.xp}</strong><span>XP TOTAL</span></div>
          <div className="rail-progress-label"><span>Daily goal</span><b>{todaysAnswers} / {DAILY_GOAL}</b></div>
          <div className="rail-progress"><div style={{ width: `${goalPercent}%` }} /></div>
          <div className="rail-grid"><div><strong>{insights.started}</strong><span>seen</span></div><div><strong>{insights.accuracy}%</strong><span>accuracy</span></div><div><strong>{insights.mastered}</strong><span>familiar</span></div></div>
        </div>
        <div className="right-quote"><span className="star-ornament">✳</span><p>Just one more<br />little <em>scroll.</em></p><span>ENGLISH AFTER HOURS</span></div>
        <div className="right-footer"><span className="swipe-icon"><ChevronDown size={20}/></span> Scroll for your next challenge <ArrowDown size={17}/></div>
        <div className="visible-topic">CURRENT TOPIC <span>{currentCard.topic}</span></div>
      </aside>
    </div>
  );
}

export default App;
