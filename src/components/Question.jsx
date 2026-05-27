import { useState } from "react";
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
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("theme") === "dark",
  );
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
      <h2 style={darkMode ? { color: "white" } : {}}>
        {question.text.split("\n").map((line, i) => (
          <p key={i} style={darkMode ? { color: "white" } : {}}>{line}</p>
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
