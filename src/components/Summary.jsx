import { useState, useEffect } from "react";

const PASS_THRESHOLD = 72;

function isAnswerCorrect(userAnswer, question) {
  if (question.isMultiSelect) {
    const correctAnswers = question.correctAnswerIndices.map(
      (i) => question.answers[i],
    );
    if (!Array.isArray(userAnswer)) return false;
    if (userAnswer.length !== correctAnswers.length) return false;
    return correctAnswers.every((a) => userAnswer.includes(a));
  } else {
    return userAnswer === question.answers[question.correctAnswerIndex];
  }
}

function ReviewItem({ answer, question, index }) {
  const [expanded, setExpanded] = useState(false);

  const isSkipped = answer === null;
  const isCorrect = !isSkipped && isAnswerCorrect(answer, question);
  const status = isSkipped ? "skipped" : isCorrect ? "correct" : "wrong";
  const correctAnswers = question.correctAnswerIndices.map(
    (i) => question.answers[i],
  );

  const mainExplanation = question.explanation || "";

  const getAnswerReason = (choiceText) => {
    if (!question.answerExplanations) return null;
    const idx = question.answers.indexOf(choiceText);
    if (idx === -1) return null;
    return question.answerExplanations[idx] || null;
  };

  const userAnswerArr = Array.isArray(answer) ? answer : answer ? [answer] : [];

  return (
    <li className={`review-item review-item--${status}`}>
      {/* ── Header row ── */}
      <div className="review-item-header">
        <div className="review-item-meta">
          <span className="review-q-num">Q{index + 1}</span>
          {question.isMultiSelect && (
            <span className="review-domain">Select TWO</span>
          )}
        </div>
        <span className={`result-badge ${status}`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </div>

      {/* ── Question text ── */}
      <p className="review-q-text">{question.text}</p>

      {/* ── Answer rows ── */}
      <div className="review-item-body">
        <div className="review-answer-row">
          <span className="review-answer-label">Your answer:</span>
          {isSkipped ? (
            <span className="review-answer-val skipped-val">Not answered</span>
          ) : (
            <span
              className={`review-answer-val ${
                isCorrect ? "your-correct" : "your-wrong"
              }`}
            >
              {userAnswerArr.join(" & ")}
            </span>
          )}
        </div>

        {!isCorrect && (
          <div className="review-answer-row">
            <span className="review-answer-label">Correct:</span>
            <span className="review-answer-val correct-ans">
              {correctAnswers.join(" & ")}
            </span>
          </div>
        )}
      </div>

      {/* ── Toggle explanation button ── */}
      {mainExplanation && (
        <button
          className={`explain-toggle ${expanded ? "open" : ""}`}
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
        >
          {expanded ? "Hide explanation ▲" : "Why? ▼"}
        </button>
      )}

      {/* ── Expandable explanation panel ── */}
      {expanded && mainExplanation && (
        <div className="explanation-panel">
          <p className="explanation-main">{mainExplanation}</p>

          <ul className="choice-breakdown">
            {question.answers.map((choice, idx) => {
              const isChoiceCorrect =
                question.correctAnswerIndices.includes(idx);
              const reason = getAnswerReason(choice);
              const wasChosen = userAnswerArr.includes(choice);

              return (
                <li
                  key={idx}
                  className={`choice-row ${
                    isChoiceCorrect ? "choice-correct" : "choice-incorrect"
                  } ${wasChosen ? "choice-chosen" : ""}`}
                >
                  <div className="choice-row-header">
                    <span className="choice-indicator">
                      {isChoiceCorrect ? "✓" : "✗"}
                    </span>
                    <span className="choice-text">{choice}</span>
                    {wasChosen && (
                      <span className="choice-yours-tag">Your pick</span>
                    )}
                  </div>
                  {reason && <p className="choice-reason">{reason}</p>}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </li>
  );
}

export default function Summary({
  userAnswers,
  questions,
  paperNum,
  onBackToHome,
  onPaperComplete,
  timeTaken,
}) {
  const [filter, setFilter] = useState("all");

  const correct = userAnswers.filter(
    (answer, index) =>
      answer !== null && isAnswerCorrect(answer, questions[index]),
  ).length;

  const skipped = userAnswers.filter((a) => a === null).length;
  const wrong = userAnswers.length - correct - skipped;
  const scorePct = Math.round((correct / userAnswers.length) * 100);
  const passed = scorePct >= PASS_THRESHOLD;

  // Format time taken
  const timeMins = timeTaken != null ? Math.floor(timeTaken / 60) : null;
  const timeSecs = timeTaken != null ? timeTaken % 60 : null;
  const timeStr =
    timeMins != null
      ? timeMins > 0
        ? `${timeMins}m ${String(timeSecs).padStart(2, "0")}s`
        : `${timeSecs}s`
      : null;

  // Report score to parent so unlock logic can run
  useEffect(() => {
    if (onPaperComplete) onPaperComplete(paperNum, scorePct);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Donut chart math
  const total = userAnswers.length;
  const circumference = 2 * Math.PI * 42; // r=42
  const correctArc = (correct / total) * circumference;
  const wrongArc = (wrong / total) * circumference;
  const correctOffset = 0;
  const wrongOffset = -correctArc;

  const filteredIndices = userAnswers
    .map((answer, index) => {
      const isSkipped = answer === null;
      const isCorrect = !isSkipped && isAnswerCorrect(answer, questions[index]);
      const status = isSkipped ? "skipped" : isCorrect ? "correct" : "wrong";
      return { index, status };
    })
    .filter(({ status }) => filter === "all" || status === filter);

  return (
    <div id="summary">
      {/* ── Hero card ── */}
      <div id="summary-hero">
        <h2>Paper {paperNum} Complete</h2>
        <p id="summary-hero-sub">
          Score: {scorePct}% · Passing threshold: {PASS_THRESHOLD}%
        </p>
        {timeStr && (
          <p id="summary-time-taken">
            ⏱ Completed in <strong>{timeStr}</strong> out of 130 min
          </p>
        )}

        {/* Donut + legend */}
        <div id="summary-donut-row">
          <div className="summary-donut-wrap">
            <svg width="108" height="108" viewBox="0 0 108 108">
              {/* Background track */}
              <circle
                cx="54"
                cy="54"
                r="42"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="11"
              />
              {/* Correct arc (green) */}
              {correct > 0 && (
                <circle
                  cx="54"
                  cy="54"
                  r="42"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="11"
                  strokeDasharray={`${correctArc} ${circumference}`}
                  strokeDashoffset={correctOffset}
                  strokeLinecap="round"
                  style={{
                    transform: "rotate(-90deg)",
                    transformOrigin: "54px 54px",
                  }}
                />
              )}
              {/* Wrong arc (red) */}
              {wrong > 0 && (
                <circle
                  cx="54"
                  cy="54"
                  r="42"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="11"
                  strokeDasharray={`${wrongArc} ${circumference}`}
                  strokeDashoffset={wrongOffset}
                  strokeLinecap="round"
                  style={{
                    transform: "rotate(-90deg)",
                    transformOrigin: "54px 54px",
                  }}
                />
              )}
            </svg>
            <div className="summary-donut-center">
              <span className="summary-donut-pct">{scorePct}%</span>
              <span className="summary-donut-lbl">score</span>
            </div>
          </div>

          <div className="summary-legend">
            <div className="summary-legend-row">
              <div
                className="summary-legend-dot"
                style={{ background: "#22c55e" }}
              />
              Correct
              <span className="summary-legend-val">{correct}</span>
            </div>
            <div className="summary-legend-row">
              <div
                className="summary-legend-dot"
                style={{ background: "#ef4444" }}
              />
              Incorrect
              <span className="summary-legend-val">{wrong}</span>
            </div>
            <div className="summary-legend-row">
              <div
                className="summary-legend-dot"
                style={{ background: "#94a3b8" }}
              />
              Skipped
              <span className="summary-legend-val">{skipped}</span>
            </div>
          </div>
        </div>

        {/* Pass / Fail pill */}
        <div className={`pass-pill ${passed ? "pass" : "fail"}`}>
          {passed ? `✓ Passed — ${scorePct}%` : `✗ Failed — ${scorePct}%`}
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="summary-actions">
        <button className="btn-back-papers" onClick={onBackToHome}>
          ← Back to All Papers
        </button>
      </div>

      {/* ── Filter bar ── */}
      <div className="review-filter-bar">
        <h3 className="review-heading">Review</h3>
        <div className="filter-tabs">
          {["all", "correct", "wrong", "skipped"].map((f) => (
            <button
              key={f}
              className={`filter-tab ${filter === f ? "active" : ""} filter-tab--${f}`}
              onClick={() => setFilter(f)}
            >
              {f === "all"
                ? `All (${userAnswers.length})`
                : f === "correct"
                  ? `Correct (${correct})`
                  : f === "wrong"
                    ? `Incorrect (${wrong})`
                    : `Skipped (${skipped})`}
            </button>
          ))}
        </div>
      </div>

      {/* ── Review list ── */}
      <ol id="review-list">
        {filteredIndices.map(({ index }) => (
          <ReviewItem
            key={index}
            answer={userAnswers[index]}
            question={questions[index]}
            index={index}
          />
        ))}
      </ol>
    </div>
  );
}
