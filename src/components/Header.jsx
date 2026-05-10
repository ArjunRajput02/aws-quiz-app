import logoImg from "../assets/quiz-logo.png";

export default function Header({ selectedPaper, mode, onBackToHome, onBackToPapers, darkMode, onToggleTheme }) {
  return (
    <header id="main-header">
      <div className="header-left">
        <img src={logoImg} alt="AWS Quiz logo" />
        <div>
          <h1>AWS Quiz</h1>
          <p>DVA-C02 Mock Examination</p>
        </div>
      </div>
      <div className="header-right-group">
        <button className="theme-toggle" onClick={onToggleTheme}>
          {darkMode ? "☀ Light" : "🌙 Dark"}
        </button>
        {selectedPaper && (
          <button className="btn-back-home" onClick={onBackToPapers}>← All Papers</button>
        )}
        {mode !== 'landing' && (
          <button className="btn-back-home btn-back-landing" onClick={onBackToHome}>🏠 Home</button>
        )}
        <div className="header-right">
          <span className="live-dot"></span>
          {mode === 'landing' ? 'Exam Prep' : mode === 'notes' ? 'Study Notes' : selectedPaper ? `Paper ${selectedPaper}` : 'Practice Mode'}
        </div>
      </div>
    </header>
  );
}