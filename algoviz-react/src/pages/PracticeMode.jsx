import { useState, useCallback } from 'react';
import QuizPanel from '../components/ai/QuizPanel';
import TracePanel from '../components/ai/TracePanel';
import ScoreBoard from '../components/ai/ScoreBoard';
import { useProgress } from '../hooks/useProgress';
import '../styles/Training.css';

const TOPICS = {
  sorting: { title: 'Sorting', icon: '⊞' },
  searching: { title: 'Searching', icon: '⌕' },
  trees: { title: 'Trees', icon: '⬡' },
  graphs: { title: 'Graphs', icon: '◇' },
};

const TOPIC_COLORS = {
  sorting: { bg: 'rgba(108, 99, 255, 0.15)', border: '#6c63ff', text: '#6c63ff' },
  searching: { bg: 'rgba(255, 101, 132, 0.15)', border: '#ff6584', text: '#ff6584' },
  trees: { bg: 'rgba(67, 217, 173, 0.15)', border: '#43d9ad', text: '#43d9ad' },
  graphs: { bg: 'rgba(247, 197, 159, 0.15)', border: '#f7c59f', text: '#f7c59f' },
};

const MODES = [
  { id: 'quiz', title: 'AI Quiz', description: 'Multiple choice questions', icon: '⊕' },
  { id: 'trace', title: 'Tracing', description: 'Step-by-step practice', icon: '⟳', comingSoon: true },
];

export default function PracticeMode() {
  const [selectedMode, setSelectedMode] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState('sorting');
  const [showTopicSelect, setShowTopicSelect] = useState(true);
  const { progress, recordAnswer, getTopicScore, getStats, resetProgress } = useProgress();
  
  const stats = getStats();
  const topicScore = getTopicScore(selectedTopic);

  const handleStart = (modeId) => {
    if (modeId === 'trace') return;
    setSelectedMode(modeId);
    setShowTopicSelect(true);
  };

  const handleTopicSelect = () => {
    setShowTopicSelect(false);
  };

  const handleBack = () => {
    if (!showTopicSelect) {
      setShowTopicSelect(true);
    } else {
      setSelectedMode(null);
    }
  };

  const handleComplete = useCallback((topic, isCorrect) => {
    recordAnswer(topic, isCorrect, 'medium');
  }, [recordAnswer]);

  const handleTopicChange = (topic) => {
    setSelectedTopic(topic);
  };

  if (!selectedMode) {
    return (
      <div className="training-page">
        <header className="training-header">
          <h1 className="training-title">
            <span>Practice</span> Mode
          </h1>
          <p className="training-subtitle">
            Test your algorithm knowledge
          </p>
        </header>

        <ScoreBoard stats={stats} onClear={resetProgress} />

        <div className="training-grid">
          {MODES.map((mode, index) => (
            <div
              key={mode.id}
              className={`training-card ${mode.comingSoon ? 'coming-soon' : ''}`}
              onClick={() => handleStart(mode.id)}
              style={{ animationDelay: `${index * 0.1}s`, cursor: mode.comingSoon ? 'not-allowed' : 'pointer', opacity: mode.comingSoon ? 0.6 : 1 }}
            >
              <div className="training-card-icon">
                {mode.icon}
              </div>
              <h3 className="training-card-title">{mode.title}</h3>
              <p className="training-card-desc">{mode.comingSoon ? 'Coming Soon' : mode.description}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="training-page">
      <button 
        className="btn btn-outline" 
        onClick={handleBack}
        style={{ marginBottom: '1.5rem' }}
      >
        ← Back to Menu
      </button>

      

      {showTopicSelect ? (
        <div style={{ 
          textAlign: 'center', 
          maxWidth: '600px', 
          margin: '0 auto',
          padding: '2rem'
        }}>
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>
            Select a Topic
          </h2>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
            gap: '1rem' 
          }}>
            {Object.entries(TOPICS).map(([topicId, topicInfo]) => {
              const color = TOPIC_COLORS[topicId];
              const topicProgress = progress.scores[topicId]?.total || 0;
              return (
                <button
                  key={topicId}
                  onClick={() => {
                    setSelectedTopic(topicId);
                    handleTopicSelect();
                  }}
                  style={{ 
                    padding: '1.5rem 1rem',
                    background: color.bg,
                    border: `2px solid ${color.border}`,
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    opacity: 1
                  }}
                >
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                    {topicInfo.icon}
                  </div>
                  <h3 style={{ 
                    color: color.text, 
                    fontWeight: '700',
                    fontSize: '1.1rem',
                    margin: '0 0 0.25rem 0'
                  }}>
                    {topicInfo.title}
                  </h3>
                  <p style={{ 
                    color: 'var(--text-muted)', 
                    fontSize: '0.8rem',
                    margin: 0
                  }}>
                    {topicProgress} questions
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div>
          <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            {TOPICS[selectedTopic].icon} {selectedMode === 'quiz' ? 'Quiz' : 'Tracing'}: {TOPICS[selectedTopic].title}
          </h2>
          
          {selectedMode === 'quiz' ? (
            <QuizPanel 
              topic={selectedTopic} 
              onComplete={(topic, isCorrect) => handleComplete(topic, isCorrect)}
            />
          ) : (
            <TracePanel 
              topic={selectedTopic}
              onComplete={(topic, isCorrect) => handleComplete(topic, isCorrect)}
            />
          )}
        </div>
      )}
    </div>
  );
}