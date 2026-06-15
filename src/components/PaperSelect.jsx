import { ALL_PAPERS, PAPER_NAMES, totalPaper } from "../papers.js";

const PAPER_META = {
  1: {
    icon: "📦",
    topics: ["CodeDeploy", "DynamoDB", "API Gateway", "CloudWatch", "Lambda"],
    difficulty: "Medium",
  },
  2: {
    icon: "🔧",
    topics: ["CodeCommit", "KMS", "S3", "Cognito", "EC2"],
    difficulty: "Medium",
  },
  3: {
    icon: "🛡️",
    topics: ["IAM Policies", "S3 Performance", "ECS", "CloudFormation", "SQS"],
    difficulty: "Hard",
  },
  4: {
    icon: "⚡",
    topics: [
      "ECS Placement",
      "Lambda Limits",
      "RDS",
      "Elastic Beanstalk",
      "SAM",
    ],
    difficulty: "Medium",
  },
  5: {
    icon: "🌐",
    topics: [
      "CloudFront",
      "WAF",
      "Lambda Versions",
      "DynamoDB Streams",
      "X-Ray",
    ],
    difficulty: "Hard",
  },
  6: {
    icon: "🐳",
    topics: ["ECR", "DynamoDB", "API Gateway", "CI/CD", "Monitoring"],
    difficulty: "Hard",
  },
  7: {
    icon: "😍",
    topics: ["ECR", "DynamoDB", "API Gateway", "CI/CD", "Monitoring", "AWS"],
    difficulty: "Medium",
  },
  8: {
    icon: "😍",
    topics: ["ECR", "DynamoDB", "API Gateway", "CI/CD", "Monitoring", "AWS"],
    difficulty: "Medium",
  },
  9: {
    icon: "😍",
    topics: ["ECR", "DynamoDB", "API Gateway", "CI/CD", "Monitoring", "AWS"],
    difficulty: "Medium",
  },
  10: {
    icon: "😍",
    topics: ["ECR", "DynamoDB", "API Gateway", "CI/CD", "Monitoring", "AWS"],
    difficulty: "Medium",
  },
  11: {
    icon: "😍",
    topics: ["ECR", "DynamoDB", "API Gateway", "CI/CD", "Monitoring", "AWS"],
    difficulty: "Medium",
  },
  12: {
    icon: "😍",
    topics: ["ECR", "DynamoDB", "API Gateway", "CI/CD", "Monitoring", "AWS"],
    difficulty: "Medium",
  },
  13: {
    icon: "😍",
    topics: ["ECR", "DynamoDB", "API Gateway", "CI/CD", "Monitoring", "AWS"],
    difficulty: "Medium",
  },
};

const DIFF_COLOR = {
  Medium: { bg: "#e6f4ea", color: "#1e7e34", border: "#a8d5b5" },
  Hard: { bg: "#fff3cd", color: "#856404", border: "#ffc107" },
};

export default function PaperSelect({
  onSelectPaper,
  unlockedMap,
  scores,
  unlockThreshold,
}) {
  return (
    <div id="paper-select">
      <div id="ps-hero">
        <div id="ps-badge">DVA-C02 Exam Prep</div>
        <h1 id="ps-title">AWS Certified Developer – Associate</h1>
        <p id="ps-subtitle">
          Choose a practice paper to begin. Each paper contains{" "}
          <strong>65 questions</strong> covering all exam domains. Score{" "}
          <strong>72%</strong> or above to pass. You must score{" "}
          <strong>{unlockThreshold}%</strong> to unlock the next paper.
        </p>
        <div id="ps-stats">
          <div className="ps-stat">
            <span className="ps-stat-num">{totalPaper.length}</span>
            <span className="ps-stat-label">Papers</span>
          </div>
          <div className="ps-stat-divider" />
          <div className="ps-stat">
            <span className="ps-stat-num">
              {totalPaper.reduce(
                (sum, n) => sum + (ALL_PAPERS[n]?.length || 0),
                0,
              )}
            </span>
            <span className="ps-stat-label">Questions</span>
          </div>
          <div className="ps-stat-divider" />
          <div className="ps-stat">
            <span className="ps-stat-num">72%</span>
            <span className="ps-stat-label">Pass Mark</span>
          </div>
          <div className="ps-stat-divider" />
          <div className="ps-stat">
            <span className="ps-stat-num">{unlockThreshold}%</span>
            <span className="ps-stat-label">To Unlock Next</span>
          </div>
        </div>
      </div>

      <div id="ps-grid">
        {totalPaper.map((num) => {
          const meta = PAPER_META[num];
          const diff = DIFF_COLOR[meta.difficulty];
          const qCount = ALL_PAPERS[num]?.length || 65;
          const isLocked = !unlockedMap[num];
          const bestScore = scores[num] ?? null;
          const prevScore = scores[num - 1] ?? null;

          return (
            <div
              key={num}
              className={`ps-card-wrap ${isLocked ? "ps-card-locked" : ""}`}
            >
              <button
                className={`ps-card ${isLocked ? "ps-card--locked" : ""}`}
                onClick={() => onSelectPaper(num)}
                disabled={isLocked}
                aria-disabled={isLocked}
              >
                {/* Lock overlay shown on hover for locked cards */}
                {isLocked && (
                  <div className="ps-lock-overlay">
                    <span className="ps-lock-icon">🔒</span>
                    <span className="ps-lock-msg">
                      Score {unlockThreshold}% on Paper {num - 1} to unlock
                      {prevScore !== null && (
                        <span className="ps-lock-prev">
                          {" "}
                          (your best: {prevScore}%)
                        </span>
                      )}
                    </span>
                  </div>
                )}

                <div className="ps-card-top">
                  <div className="ps-card-icon">
                    {isLocked ? "🔒" : meta.icon}
                  </div>
                  <div className="ps-card-info">
                    <span className="ps-card-name">{PAPER_NAMES[num]}</span>
                    <span
                      className="ps-card-diff"
                      style={
                        isLocked
                          ? {}
                          : {
                              background: diff.bg,
                              color: diff.color,
                              border: `1px solid ${diff.border}`,
                            }
                      }
                    >
                      {isLocked ? "Locked" : meta.difficulty}
                    </span>
                  </div>
                  <span className="ps-card-count">
                    {isLocked ? "—" : `${qCount} Qs`}
                  </span>
                </div>

                <div className="ps-card-topics">
                  {isLocked ? (
                    <span className="ps-topic-tag ps-topic-locked">
                      Complete Paper {num - 1} with {unlockThreshold}%+
                    </span>
                  ) : (
                    meta.topics.map((t) => (
                      <span key={t} className="ps-topic-tag">
                        {t}
                      </span>
                    ))
                  )}
                </div>

                {/* Best score badge */}
                {bestScore !== null && !isLocked && (
                  <div
                    className={`ps-best-score ${bestScore >= unlockThreshold ? "ps-score-pass" : "ps-score-fail"}`}
                  >
                    Best: {bestScore}%{" "}
                    {bestScore >= unlockThreshold ? "✓" : "✗"}
                  </div>
                )}

                <div className="ps-card-cta">
                  {isLocked ? "🔒 Locked" : `Start Paper ${num} →`}
                </div>
              </button>
            </div>
          );
        })}
      </div>

      <p id="ps-footer">
        Questions sourced from Digital Cloud Training · DVA-C02 exam format
      </p>
    </div>
  );
}
