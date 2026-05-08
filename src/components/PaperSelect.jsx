import { ALL_PAPERS } from '../papers.js';

const PAPER_META = {
  1: {
    icon: '📦',
    topics: ['CodeDeploy', 'DynamoDB', 'API Gateway', 'CloudWatch', 'Lambda'],
    difficulty: 'Medium',
  },
  2: {
    icon: '🔧',
    topics: ['CodeCommit', 'KMS', 'S3', 'Cognito', 'EC2'],
    difficulty: 'Medium',
  },
  3: {
    icon: '🛡️',
    topics: ['IAM Policies', 'S3 Performance', 'ECS', 'CloudFormation', 'SQS'],
    difficulty: 'Hard',
  },
  4: {
    icon: '⚡',
    topics: ['ECS Placement', 'Lambda Limits', 'RDS', 'Elastic Beanstalk', 'SAM'],
    difficulty: 'Medium',
  },
  5: {
    icon: '🌐',
    topics: ['CloudFront', 'WAF', 'Lambda Versions', 'DynamoDB Streams', 'X-Ray'],
    difficulty: 'Hard',
  },
  6: {
    icon: '🐳',
    topics: ['ECR', 'DynamoDB', 'API Gateway', 'CI/CD', 'Monitoring'],
    difficulty: 'Hard',
  },
};

const DIFF_COLOR = {
  Medium: { bg: '#e6f4ea', color: '#1e7e34', border: '#a8d5b5' },
  Hard:   { bg: '#fff3cd', color: '#856404', border: '#ffc107' },
};

export default function PaperSelect({ onSelectPaper }) {
  return (
    <div id="paper-select">
      <div id="ps-hero">
        <div id="ps-badge">DVA-C02 Exam Prep</div>
        <h1 id="ps-title">AWS Certified Developer – Associate</h1>
        <p id="ps-subtitle">
          Choose a practice paper to begin. Each paper contains <strong>65 questions</strong> covering
          all exam domains. Score <strong>72%</strong> or above to pass.
        </p>
        <div id="ps-stats">
          <div className="ps-stat">
            <span className="ps-stat-num">6</span>
            <span className="ps-stat-label">Papers</span>
          </div>
          <div className="ps-stat-divider" />
          <div className="ps-stat">
            <span className="ps-stat-num">390</span>
            <span className="ps-stat-label">Questions</span>
          </div>
          <div className="ps-stat-divider" />
          <div className="ps-stat">
            <span className="ps-stat-num">72%</span>
            <span className="ps-stat-label">Pass Mark</span>
          </div>
        </div>
      </div>

      <div id="ps-grid">
        {[1, 2, 3, 4, 5, 6].map((num) => {
          const meta = PAPER_META[num];
          const diff = DIFF_COLOR[meta.difficulty];
          const qCount = ALL_PAPERS[num]?.length || 65;
          return (
            <button key={num} className="ps-card" onClick={() => onSelectPaper(num)}>
              <div className="ps-card-top">
                <div className="ps-card-icon">{meta.icon}</div>
                <div className="ps-card-info">
                  <span className="ps-card-name">Practice Paper {num}</span>
                  <span
                    className="ps-card-diff"
                    style={{ background: diff.bg, color: diff.color, border: `1px solid ${diff.border}` }}
                  >
                    {meta.difficulty}
                  </span>
                </div>
                <span className="ps-card-count">{qCount} Qs</span>
              </div>
              <div className="ps-card-topics">
                {meta.topics.map((t) => (
                  <span key={t} className="ps-topic-tag">{t}</span>
                ))}
              </div>
              <div className="ps-card-cta">Start Paper {num} →</div>
            </button>
          );
        })}
      </div>

      <p id="ps-footer">Questions sourced from Digital Cloud Training · DVA-C02 exam format</p>
    </div>
  );
}