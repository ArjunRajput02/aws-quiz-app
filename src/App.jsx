import { useEffect, useState, useCallback } from 'react';

import Header from './components/Header.jsx';
import PaperSelect from './components/PaperSelect.jsx';
import Quiz from './components/Quiz.jsx';

import { ALL_PAPERS } from './papers.js';

// ─── Helpers ────────────────────────────────────────────────────────────────

const UNLOCK_THRESHOLD = 80; // percent needed to unlock next paper
const STORAGE_KEY = 'dva_paper_scores';

function loadScores() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) return {};

    // Decode base64 → JSON
    return JSON.parse(atob(raw));
  } catch {
    return {};
  }
}


function saveScores(scores) {
  // JSON → base64
  const encoded = btoa(JSON.stringify(scores));

  localStorage.setItem(STORAGE_KEY, encoded);
}

/** Paper N is unlocked if N===1 OR paper N-1 has score >= UNLOCK_THRESHOLD */
function computeUnlocked(scores) {
  const unlocked = { 1: true };
  for (let n = 2; n <= 6; n++) {
    unlocked[n] = (scores[n - 1] ?? 0) >= UNLOCK_THRESHOLD;
  }
  return unlocked;
}

// ─── App ────────────────────────────────────────────────────────────────────

function App() {
  const [selectedPaper, setSelectedPaper]   = useState(null);
  const [scores, setScores]                 = useState(loadScores);
  const [abandoned, setAbandoned]           = useState(false);

  // THEME STATE
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  // APPLY THEME
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Tab-switch / visibility proctoring
  useEffect(() => {
    if (!selectedPaper) return;

    const handleVisibility = () => {
      if (document.hidden) {
        setAbandoned(true);
        setSelectedPaper(null);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [selectedPaper]);

  const unlockedMap = computeUnlocked(scores);

  const handleSelectPaper = (paperNum) => {
    if (!unlockedMap[paperNum]) return;
    setAbandoned(false);
    setSelectedPaper(paperNum);
  };

  const handleBackToHome = useCallback(() => {
    setSelectedPaper(null);
    setAbandoned(false);
  }, []);

  const handlePaperComplete = useCallback((paperNum, scorePct) => {
    setScores((prev) => {
      const updated = { ...prev, [paperNum]: Math.max(prev[paperNum] ?? 0, scorePct) };
      saveScores(updated);
      return updated;
    });
  }, []);

  return (
    <>
      <Header
        selectedPaper={selectedPaper}
        onBackToHome={handleBackToHome}
        darkMode={darkMode}
        onToggleTheme={() => setDarkMode((prev) => !prev)}
      />

      <main>
        {abandoned && (
          <div id="abandon-banner">
            <div id="abandon-card">
              <span id="abandon-icon">🚫</span>
              <h2>Exam Abandoned</h2>
              <p>
                You switched tabs or left the exam window. For integrity reasons
                your attempt has been <strong>automatically cancelled</strong>.
              </p>
              <button className="btn-abandon-back" onClick={() => setAbandoned(false)}>
                Return to Papers →
              </button>
            </div>
          </div>
        )}

        {!abandoned && selectedPaper === null && (
          <PaperSelect
            onSelectPaper={handleSelectPaper}
            unlockedMap={unlockedMap}
            scores={scores}
            unlockThreshold={UNLOCK_THRESHOLD}
          />
        )}

        {!abandoned && selectedPaper !== null && (
          <Quiz
            questions={ALL_PAPERS[selectedPaper]}
            paperNum={selectedPaper}
            onBackToHome={handleBackToHome}
            onPaperComplete={handlePaperComplete}
          />
        )}
      </main>
    </>
  );
}

export default App;