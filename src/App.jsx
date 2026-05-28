import { useState, useCallback } from "react";
import Header from "./components/Header.jsx";
import PaperSelect from "./components/PaperSelect.jsx";
import Quiz from "./components/Quiz.jsx";
import NotesPage from "./components/NotesPage.jsx";
import { ALL_PAPERS, totalPaper } from "./papers.js";
import { useTheme } from "./components/ThemeContext.jsx";

const UNLOCK_THRESHOLD = 0;
const STORAGE_KEY = "dva_paper_scores";

function loadScores() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(atob(raw));
  } catch {
    return {};
  }
}

function saveScores(scores) {
  localStorage.setItem(STORAGE_KEY, btoa(JSON.stringify(scores)));
}

function computeUnlocked(scores) {
  const unlocked = { 1: true };
  for (let n = 2; n <= totalPaper.length; n++) {
    unlocked[n] = (scores[n - 1] ?? 0) >= UNLOCK_THRESHOLD;
  }
  return unlocked;
}

function LandingPage({ onSelectMode }) {
  return (
    <div id="landing-page">
      <div id="landing-hero">
        <div id="ps-badge">DVA-C02 Exam Prep</div>
        <h1 id="landing-title">AWS Certified Developer – Associate</h1>
        <p id="landing-subtitle">
          Master the AWS Developer Associate exam with comprehensive study notes
          and realistic practice tests. Choose your mode to get started.
        </p>
        <div id="landing-stats">
          <div className="ps-stat">
            <span className="ps-stat-num">18</span>
            <span className="ps-stat-label">Topics</span>
          </div>
          <div className="ps-stat-divider" />
          <div className="ps-stat">
            <span className="ps-stat-num">390</span>
            <span className="ps-stat-label">Questions</span>
          </div>
          <div className="ps-stat-divider" />
          <div className="ps-stat">
            <span className="ps-stat-num">6</span>
            <span className="ps-stat-label">Papers</span>
          </div>
          <div className="ps-stat-divider" />
          <div className="ps-stat">
            <span className="ps-stat-num">72%</span>
            <span className="ps-stat-label">Pass Mark</span>
          </div>
        </div>
      </div>

      <div id="mode-cards">
        <button
          className="mode-card mode-card--notes"
          onClick={() => onSelectMode("notes")}
        >
          <div className="mode-card-icon">📚</div>
          <div className="mode-card-content">
            <h2 className="mode-card-title">Study Notes</h2>
            <p className="mode-card-desc">
              Browse comprehensive notes for all DVA-C02 topics — IAM, EC2, S3,
              Lambda, DynamoDB, API Gateway, CI/CD, CloudFormation, KMS,
              Cognito, and more. Sourced from arkalim's Notion notes.
            </p>
            <div className="mode-card-meta">
              <span className="mode-meta-pill">📖 18 Topics</span>
              <span className="mode-meta-pill">🔍 Searchable</span>
              <span className="mode-meta-pill">📌 Key Concepts</span>
            </div>
          </div>
          <span className="mode-card-cta">Open Notes →</span>
        </button>

        <button
          className="mode-card mode-card--quiz"
          onClick={() => onSelectMode("quiz")}
        >
          <div className="mode-card-icon">📝</div>
          <div className="mode-card-content">
            <h2 className="mode-card-title">Practice Test</h2>
            <p className="mode-card-desc">
              Take realistic DVA-C02 practice exams with 65 questions each.
              Timed format, instant feedback, detailed explanations, and
              progress tracking across 6 papers.
            </p>
            <div className="mode-card-meta">
              <span className="mode-meta-pill">📋 {totalPaper.length} Papers</span>
              <span className="mode-meta-pill">⏱ 130 min each</span>
              <span className="mode-meta-pill">🏆 Score Tracking</span>
            </div>
          </div>
          <span className="mode-card-cta">Start Practice →</span>
        </button>
      </div>

      <p id="ps-footer">
        Notes from arkalim's DVA-C02 Notion · Questions from Digital Cloud
        Training
      </p>
    </div>
  );
}

function App() {
  const [mode, setMode] = useState("landing"); // 'landing' | 'notes' | 'quiz'
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [scores, setScores] = useState(loadScores);
  const { theme, toggleTheme } = useTheme();

  const darkMode = theme === "dark";
  // ── NOTE: ALL tab-switch detection and abandon logic has been removed from
  // here. It now lives entirely inside Quiz.jsx, which handles 3 warnings
  // then abandons on the 4th switch — and correctly ignores tab switches
  // on the Summary screen. Having a listener here caused immediate abandon
  // on the very first switch, overriding Quiz.jsx's warning system. ──────

  const unlockedMap = computeUnlocked(scores);

  const handleSelectPaper = (paperNum) => {
    if (!unlockedMap[paperNum]) return;
    setSelectedPaper(paperNum);
  };

  const handleBackToHome = useCallback(() => {
    setSelectedPaper(null);
    setMode("landing");
  }, []);

  const handleBackToPapers = useCallback(() => {
    setSelectedPaper(null);
  }, []);

  const handlePaperComplete = useCallback((paperNum, scorePct) => {
    setScores((prev) => {
      const updated = {
        ...prev,
        [paperNum]: Math.max(prev[paperNum] ?? 0, scorePct),
      };
      saveScores(updated);
      return updated;
    });
  }, []);

  return (
    <>
      <Header
        selectedPaper={selectedPaper}
        mode={mode}
        onBackToHome={handleBackToHome}
        onBackToPapers={selectedPaper ? handleBackToPapers : null}
        darkMode={darkMode}
        onToggleTheme={() => toggleTheme()}
      />
      <main>
        {mode === "landing" && <LandingPage onSelectMode={setMode} />}
        {mode === "notes" && <NotesPage />}
        {mode === "quiz" && selectedPaper === null && (
          <PaperSelect
            onSelectPaper={handleSelectPaper}
            unlockedMap={unlockedMap}
            scores={scores}
            unlockThreshold={UNLOCK_THRESHOLD}
          />
        )}
        {mode === "quiz" && selectedPaper !== null && (
          <Quiz
            questions={ALL_PAPERS[selectedPaper]}
            paperNum={selectedPaper}
            onBackToHome={handleBackToPapers}
            onPaperComplete={handlePaperComplete}
          />
        )}
      </main>
    </>
  );
}

export default App;
