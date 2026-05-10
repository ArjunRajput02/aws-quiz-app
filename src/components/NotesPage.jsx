// src/components/NotesPage.jsx  ← NEW FILE
import { useState } from 'react';
import NOTES_TOPICS from '../notes.js';

function SubtopicCard({ subtopic }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="subtopic-card">
      <button
        className={`subtopic-header ${expanded ? 'open' : ''}`}
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <span className="subtopic-title">{subtopic.title}</span>
        <span className="subtopic-chevron">{expanded ? '▲' : '▼'}</span>
      </button>
      {expanded && (
        <ul className="subtopic-content">
          {subtopic.content.map((point, i) => (
            <li key={i} className="subtopic-point">
              <span className="point-bullet">•</span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TopicCard({ topic, onOpen }) {
  return (
    <button
      className="topic-card"
      onClick={() => onOpen(topic)}
      style={{ '--topic-color': topic.color, '--topic-border': topic.borderColor }}
    >
      <div className="topic-card-icon">{topic.icon}</div>
      <div className="topic-card-body">
        <div className="topic-card-title">{topic.title}</div>
        <div className="topic-card-count">{topic.subtopics.length} subtopics</div>
      </div>
      <span className="topic-card-arrow">→</span>
    </button>
  );
}

function TopicDetail({ topic, onBack }) {
  return (
    <div className="topic-detail">
      <div className="topic-detail-header">
        <button className="btn-topic-back" onClick={onBack}>← Back to Topics</button>
        <div className="topic-detail-title-row">
          <span className="topic-detail-icon">{topic.icon}</span>
          <h2 className="topic-detail-title">{topic.title}</h2>
        </div>
      </div>
      <div className="subtopics-list">
        {topic.subtopics.map((sub, i) => (
          <SubtopicCard key={i} subtopic={sub} />
        ))}
      </div>
    </div>
  );
}

export default function NotesPage() {
  const [activeTopic, setActiveTopic] = useState(null);
  const [search, setSearch] = useState('');

  if (activeTopic) {
    return <TopicDetail topic={activeTopic} onBack={() => setActiveTopic(null)} />;
  }

  const filtered = search.trim()
    ? NOTES_TOPICS.filter(
        (t) =>
          t.title.toLowerCase().includes(search.toLowerCase()) ||
          t.subtopics.some(
            (s) =>
              s.title.toLowerCase().includes(search.toLowerCase()) ||
              s.content.some((c) => c.toLowerCase().includes(search.toLowerCase()))
          )
      )
    : NOTES_TOPICS;

  return (
    <div id="notes-page">
      <div id="notes-hero">
        <div id="ps-badge">DVA-C02 Study Notes</div>
        <h1 id="notes-title">AWS Developer Associate — Notes</h1>
        <p id="notes-subtitle">
          Comprehensive notes covering all exam topics. Click any topic to explore subtopics and key concepts.
        </p>
        <div className="notes-search-wrap">
          <input
            className="notes-search"
            type="text"
            placeholder="🔍  Search topics, subtopics, or concepts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div id="notes-stats">
          <div className="ps-stat">
            <span className="ps-stat-num">{NOTES_TOPICS.length}</span>
            <span className="ps-stat-label">Topics</span>
          </div>
          <div className="ps-stat-divider" />
          <div className="ps-stat">
            <span className="ps-stat-num">{NOTES_TOPICS.reduce((a, t) => a + t.subtopics.length, 0)}</span>
            <span className="ps-stat-label">Subtopics</span>
          </div>
          <div className="ps-stat-divider" />
          <div className="ps-stat">
            <span className="ps-stat-num">{NOTES_TOPICS.reduce((a, t) => a + t.subtopics.reduce((b, s) => b + s.content.length, 0), 0)}</span>
            <span className="ps-stat-label">Key Points</span>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="notes-empty">No topics match your search.</div>
      ) : (
        <div id="topics-grid">
          {filtered.map((topic) => (
            <TopicCard key={topic.id} topic={topic} onOpen={setActiveTopic} />
          ))}
        </div>
      )}

      <p id="ps-footer">Notes sourced from arkalim's DVA-C02 Notion notes · AWS Certified Developer – Associate</p>
    </div>
  );
}