import { useRef } from 'react';

const LETTERS = ['A', 'B', 'C', 'D', 'E'];

export default function Answers({ answers, selectedAnswer, isMultiSelect, onSelect }) {
  const shuffledAnswers = useRef();

  if (!shuffledAnswers.current) {
    shuffledAnswers.current = answers
      .map((answer) => ({ answer }))
      .sort(() => Math.random() - 0.5);
  }

  return (
    <ul id="answers">
      {shuffledAnswers.current.map(({ answer }, i) => {
        const isSelected = isMultiSelect
          ? Array.isArray(selectedAnswer) && selectedAnswer.includes(answer)
          : selectedAnswer === answer;

        return (
          <li key={answer} className="answer">
            <button onClick={() => onSelect(answer)} className={isSelected ? 'selected' : ''}>
              <span className={`answer-letter${isMultiSelect ? ' multi' : ''}`}>
                {isMultiSelect ? (isSelected ? '✓' : LETTERS[i]) : LETTERS[i]}
              </span>
              {answer}
            </button>
          </li>
        );
      })}
    </ul>
  );
}