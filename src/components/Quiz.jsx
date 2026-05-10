import { useState, useCallback, useEffect, useRef } from "react";
import Question from "./Question.jsx";
import Summary from "./Summary.jsx";

const EXAM_DURATION = 130 * 60; // 130 minutes in seconds

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function Quiz({
  questions,
  paperNum,
  onBackToHome,
  onPaperComplete,
}) {
  const [userAnswers, setUserAnswers] = useState(
    new Array(questions.length).fill(null),
  );
  const [currentQ, setCurrentQ] = useState(0);
  const [flagged, setFlagged] = useState(
    new Array(questions.length).fill(false),
  );
  const [submitted, setSubmitted] = useState(false);

  // ── Timer ──────────────────────────────────────────────────────────────
  const [timeLeft, setTimeLeft] = useState(EXAM_DURATION);
  const [timeTaken, setTimeTaken] = useState(0); // seconds elapsed when submitted
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    if (submitted) return;
    const id = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          // Auto-submit when time runs out
          setTimeTaken(EXAM_DURATION);
          setSubmitted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [submitted]);

  // ── Urgency colour ─────────────────────────────────────────────────────
  const timerUrgent = timeLeft <= 10 * 60; // last 10 min → red
  const timerWarning = timeLeft <= 30 * 60; // last 30 min → amber

  // ── Handlers ───────────────────────────────────────────────────────────
  const handleSelectAnswer = useCallback(
    (selectedAnswer) => {
      const q = questions[currentQ];
      if (q.isMultiSelect) {
        setUserAnswers((prev) => {
          const updated = [...prev];
          const current = Array.isArray(updated[currentQ])
            ? [...updated[currentQ]]
            : [];
          const idx = current.indexOf(selectedAnswer);
          if (idx === -1) current.push(selectedAnswer);
          else current.splice(idx, 1);
          updated[currentQ] = current.length > 0 ? current : null;
          return updated;
        });
      } else {
        setUserAnswers((prev) => {
          const updated = [...prev];
          updated[currentQ] = selectedAnswer;
          return updated;
        });
      }
    },
    [currentQ, questions],
  );

  const handleFlag = useCallback(() => {
    setFlagged((prev) => {
      const updated = [...prev];
      updated[currentQ] = !updated[currentQ];
      return updated;
    });
  }, [currentQ]);

  const handleSubmit = useCallback(() => {
    const unanswered = userAnswers.filter((a) => a === null).length;
    if (unanswered > 0) {
      const confirmed = window.confirm(
        `You have ${unanswered} unanswered question(s). Submit anyway?`,
      );
      if (!confirmed) return;
    }
    const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
    setTimeTaken(elapsed);
    setSubmitted(true);
  }, [userAnswers]);

  const answeredCount = userAnswers.filter((a) => a !== null).length;

  if (submitted) {
    return (
      <Summary
        userAnswers={userAnswers}
        questions={questions}
        paperNum={paperNum}
        onBackToHome={onBackToHome}
        onPaperComplete={onPaperComplete}
        timeTaken={timeTaken}
      />
    );
  }

  return (
    <div id="quiz">
      <div id="quiz-header">
        <span id="quiz-title">DVA-C02 · Paper {paperNum}</span>
        <div id="quiz-meta">
          <span>
            {answeredCount} / {questions.length} answered
          </span>
          <span>{flagged.filter(Boolean).length} flagged</span>

          {/* ── Countdown timer ── */}
          <span
            id="quiz-timer"
            className={
              timerUrgent ? "timer-urgent" : timerWarning ? "timer-warning" : ""
            }
          >
            ⏱ {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      <div id="progress-bar">
        <div
          id="progress-fill"
          style={{
            width: `${Math.round((answeredCount / questions.length) * 100)}%`,
          }}
        />
      </div>

      <div id="quiz-body">
        <Question
          key={currentQ}
          index={currentQ}
          total={questions.length}
          question={questions[currentQ]}
          selectedAnswer={userAnswers[currentQ]}
          isFlagged={flagged[currentQ]}
          onSelectAnswer={handleSelectAnswer}
          onFlag={handleFlag}
        />

        <div id="q-sidebar">
          <span className="sidebar-label">Navigator</span>
          <div id="q-grid">
            {questions.map((_, i) => {
              let cls = "q-dot";
              if (i === currentQ) cls += " active";
              else if (flagged[i]) cls += " flagged-dot";
              else if (userAnswers[i] !== null) cls += " answered";
              return (
                <button key={i} className={cls} onClick={() => setCurrentQ(i)}>
                  {i + 1}
                </button>
              );
            })}
          </div>
          <div className="legend">
            <div className="legend-item">
              <span className="legend-dot answered-dot" />
              Answered
            </div>
            <div className="legend-item">
              <span className="legend-dot active-dot" />
              Current
            </div>
            <div className="legend-item">
              <span className="legend-dot flagged-legend-dot" />
              Flagged
            </div>
            <div className="legend-item">
              <span className="legend-dot unanswered-dot" />
              Unanswered
            </div>
          </div>
        </div>
      </div>

      <div id="nav-footer">
        <button
          className="btn-nav"
          onClick={() => setCurrentQ((q) => q - 1)}
          disabled={currentQ === 0}
        >
          ← Previous
        </button>
        <button className="btn-submit" onClick={handleSubmit}>
          Submit Exam
        </button>
        <button
          className="btn-nav"
          onClick={() => setCurrentQ((q) => q + 1)}
          disabled={currentQ === questions.length - 1}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
