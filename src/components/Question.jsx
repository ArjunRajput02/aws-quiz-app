import Answers from "./Answers.jsx";

export default function Question({
  index,
  total,
  question,
  selectedAnswer,
  isFlagged,
  onSelectAnswer,
  onFlag,
}) {
  return (
    <div id="question">
      <div className="question-nav-row">
        <span className="q-badge">
          Question {index + 1} of {total}
          {question.isMultiSelect && (
            <span className="multi-badge"> · Select TWO</span>
          )}
        </span>
        <button
          className={`flag-btn${isFlagged ? " flagged" : ""}`}
          onClick={onFlag}
        >
          {isFlagged ? "⚑ Flagged" : "⚐ Flag"}
        </button>
      </div>

      {/* <h2 style={{ whiteSpace: "pre-line" }}>{question.text}</h2> */}
      <h2>
      {question.text.split("\n").map((line, i) => (
        <p key={i}>{line}</p>
      ))}
      </h2>

      <Answers
        answers={question.answers}
        selectedAnswer={selectedAnswer}
        isMultiSelect={question.isMultiSelect}
        onSelect={onSelectAnswer}
      />
    </div>
  );
}
