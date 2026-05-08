import { useState } from 'react';
import Header from './components/Header.jsx';
import PaperSelect from './components/PaperSelect.jsx';
import Quiz from './components/Quiz.jsx';
import { ALL_PAPERS } from './papers.js';

function App() {
  const [selectedPaper, setSelectedPaper] = useState(null);

  const handleSelectPaper = (paperNum) => {
    setSelectedPaper(paperNum);
  };

  const handleBackToHome = () => {
    setSelectedPaper(null);
  };

  return (
    <>
      <Header
        selectedPaper={selectedPaper}
        onBackToHome={handleBackToHome}
      />
      <main>
        {selectedPaper === null ? (
          <PaperSelect onSelectPaper={handleSelectPaper} />
        ) : (
          <Quiz
            questions={ALL_PAPERS[selectedPaper]}
            paperNum={selectedPaper}
            onBackToHome={handleBackToHome}
          />
        )}
      </main>
    </>
  );
}

export default App;