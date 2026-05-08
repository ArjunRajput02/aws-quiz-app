import logoImg from "../assets/quiz-logo.png";

export default function Header({ selectedPaper, onBackToHome }) {
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
        {selectedPaper && (
          <button className="btn-back-home" onClick={onBackToHome}>
            ← All Papers
          </button>
        )}
        <div className="header-right">
          <span className="live-dot"></span>
          {selectedPaper ? `Paper ${selectedPaper}` : 'Practice Mode'}
        </div>
      </div>
    </header>
  );
}