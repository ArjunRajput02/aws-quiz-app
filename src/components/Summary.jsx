const PASS_THRESHOLD = 72;

function isAnswerCorrect(userAnswer, question) {
  if (question.isMultiSelect) {
    const correctAnswers = question.correctAnswerIndices.map(i => question.answers[i]);
    if (!Array.isArray(userAnswer)) return false;
    if (userAnswer.length !== correctAnswers.length) return false;
    return correctAnswers.every(a => userAnswer.includes(a));
  } else {
    return userAnswer === question.answers[question.correctAnswerIndex];
  }
}

export default function Summary({ userAnswers, questions, paperNum, onBackToHome }) {
  const correct = userAnswers.filter((answer, index) =>
    answer !== null && isAnswerCorrect(answer, questions[index])
  ).length;

  const skipped = userAnswers.filter((a) => a === null).length;
  const wrong = userAnswers.length - correct - skipped;
  const scorePct = Math.round((correct / userAnswers.length) * 100);
  const passed = scorePct >= PASS_THRESHOLD;

  return (
    <div id="summary">
      <div id="summary-header">
        <h2>Paper {paperNum} Complete</h2>
        <p>Score: {scorePct}% · Passing threshold: {PASS_THRESHOLD}%</p>
      </div>

      <div id="score-grid">
        <div className="score-card">
          <span className="score-num correct">{correct}</span>
          <span className="score-label">Correct</span>
        </div>
        <div className="score-card">
          <span className="score-num wrong">{wrong}</span>
          <span className="score-label">Incorrect</span>
        </div>
        <div className="score-card">
          <span className="score-num skipped">{skipped}</span>
          <span className="score-label">Unanswered</span>
        </div>
      </div>

      <div className={`pass-badge ${passed ? 'pass' : 'fail'}`}>
        {passed ? `✓ PASS — ${scorePct}%` : `✗ FAIL — ${scorePct}%`}
      </div>

      <div className="summary-actions">
        <button className="btn-back-papers" onClick={onBackToHome}>
          ← Back to All Papers
        </button>
      </div>

      <h3 className="review-heading">Review</h3>

      <ol id="review-list">
        {userAnswers.map((answer, index) => {
          const q = questions[index];
          const isSkipped = answer === null;
          const isCorrect = !isSkipped && isAnswerCorrect(answer, q);
          const status = isSkipped ? 'skipped' : isCorrect ? 'correct' : 'wrong';
          const correctAnswers = q.correctAnswerIndices.map(i => q.answers[i]);

          return (
            <li key={index} className="review-item">
              <div className="review-item-header">
                <div>
                  {q.isMultiSelect && <p className="review-domain">Select TWO</p>}
                  <p className="review-q-text">{q.text}</p>
                </div>
                <span className={`result-badge ${status}`}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </span>
              </div>

              <div className="review-item-body">
                <div className="review-answer-row">
                  <span className="review-answer-label">Your answer:</span>
                  {isSkipped ? (
                    <span className="review-answer-val skipped-val">Not answered</span>
                  ) : (
                    <span className={`review-answer-val ${isCorrect ? 'your-correct' : 'your-wrong'}`}>
                      {Array.isArray(answer) ? answer.join(' & ') : answer}
                    </span>
                  )}
                </div>
                {!isCorrect && (
                  <div className="review-answer-row">
                    <span className="review-answer-label">Correct:</span>
                    <span className="review-answer-val correct-ans">
                      {correctAnswers.join(' & ')}
                    </span>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}