import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'fcai_visualizer_training_progress';

const DEFAULT_PROGRESS = {
  scores: {
    sorting: { total: 0, correct: 0, streak: 0, difficulty: 'easy' },
    searching: { total: 0, correct: 0, streak: 0, difficulty: 'easy' },
    trees: { total: 0, correct: 0, streak: 0, difficulty: 'easy' },
    graphs: { total: 0, correct: 0, streak: 0, difficulty: 'easy' },
  },
  history: [],
  settings: {
    soundEnabled: true,
    showHints: true,
    autoAdvance: false,
  },
};

export function useProgress() {
  const [progress, setProgress] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_PROGRESS;
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_PROGRESS, ...parsed };
      }
    } catch (e) {
      console.error('Failed to load progress:', e);
    }
    return DEFAULT_PROGRESS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (e) {
      console.error('Failed to save progress:', e);
    }
  }, [progress]);

  const recordAnswer = useCallback((topic, isCorrect, difficulty) => {
    setProgress((prev) => {
      const topicScore = prev.scores[topic] || { total: 0, correct: 0, streak: 0, difficulty: 'easy' };
      const newStreak = isCorrect ? topicScore.streak + 1 : 0;
      const newDifficulty = calculateNewDifficulty(topicScore.difficulty, isCorrect, newStreak);
      
      const newHistory = [
        { topic, isCorrect, difficulty, timestamp: Date.now() },
        ...prev.history.slice(0, 49),
      ];

      return {
        ...prev,
        scores: {
          ...prev.scores,
          [topic]: {
            total: topicScore.total + 1,
            correct: topicScore.correct + (isCorrect ? 1 : 0),
            streak: newStreak,
            difficulty: newDifficulty,
          },
        },
        history: newHistory,
      };
    });
  }, []);

  const getTopicScore = useCallback((topic) => {
    return progress.scores[topic] || { total: 0, correct: 0, streak: 0, difficulty: 'easy' };
  }, [progress]);

  const getDifficulty = useCallback((topic) => {
    return progress.scores[topic]?.difficulty || 'easy';
  }, [progress]);

  const updateSettings = useCallback((newSettings) => {
    setProgress((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...newSettings },
    }));
  }, []);

  const resetProgress = useCallback(() => {
    setProgress(DEFAULT_PROGRESS);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear progress:', e);
    }
  }, []);

  const getStats = useCallback(() => {
    const allTopics = Object.values(progress.scores);
    const totalQuestions = allTopics.reduce((sum, s) => sum + s.total, 0);
    const totalCorrect = allTopics.reduce((sum, s) => sum + s.correct, 0);
    const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
    const bestStreak = Math.max(...allTopics.map((s) => s.streak), 0);
    
    return {
      totalQuestions,
      totalCorrect,
      accuracy,
      bestStreak,
      topics: progress.scores,
    };
  }, [progress]);

  return {
    progress,
    recordAnswer,
    getTopicScore,
    getDifficulty,
    updateSettings,
    resetProgress,
    getStats,
  };
}

function calculateNewDifficulty(currentDifficulty, isCorrect, streak) {
  if (!isCorrect) {
    const difficulties = ['easy', 'medium', 'hard'];
    const currentIndex = difficulties.indexOf(currentDifficulty);
    return difficulties[Math.max(0, currentIndex - 1)];
  }
  
  if (streak >= 5 && currentDifficulty === 'easy') return 'medium';
  if (streak >= 10 && currentDifficulty === 'medium') return 'hard';
  
  return currentDifficulty;
}