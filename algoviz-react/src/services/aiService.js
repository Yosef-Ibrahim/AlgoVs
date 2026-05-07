const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const MODEL = import.meta.env.VITE_OPENROUTER_MODEL || 'openrouter/auto';

const IS_PROD = import.meta.env.PROD;
const API_URL = IS_PROD ? '/api/chat' : 'https://openrouter.ai/api/v1/chat/completions';

const CACHE_STORAGE_KEY = 'fcai_visualizer_question_cache';
const MAX_CACHE_PER_KEY = 20;
const BATCH_SIZE = 3;

const questionCache = new Map();

function getCacheKey(topic, subTopic, difficulty, questionMode, language) {
  return `${topic}_${subTopic || topic}_${difficulty}_${questionMode}_${language}`;
}

function loadCacheFromStorage() {
  try {
    const stored = localStorage.getItem(CACHE_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      Object.entries(parsed).forEach(([key, questions]) => {
        questionCache.set(key, questions);
      });
    }
  } catch (e) {
    console.error('Failed to load cache from storage:', e);
  }
}

function saveCacheToStorage() {
  try {
    const cacheObj = Object.fromEntries(questionCache);
    localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(cacheObj));
  } catch (e) {
    console.error('Failed to save cache to storage:', e);
  }
}

function getCachedQuestion(topic, subTopic, difficulty, questionMode, language) {
  if (questionCache.size === 0) {
    loadCacheFromStorage();
  }
  
  const key = getCacheKey(topic, subTopic, difficulty, questionMode, language);
  const questions = questionCache.get(key);
  
  if (questions && questions.length > 0) {
    return questions.pop();
  }
  return null;
}

function cacheQuestions(topic, subTopic, difficulty, questionMode, language, questions) {
  const key = getCacheKey(topic, subTopic, difficulty, questionMode, language);
  const existing = questionCache.get(key) || [];
  
  const combined = [...existing, ...questions].slice(-MAX_CACHE_PER_KEY);
  questionCache.set(key, combined);
  saveCacheToStorage();
}

loadCacheFromStorage();

export async function generateQuestion(topic, subTopic, difficulty, questionType = 'mcq', questionMode = 'general', language = 'javascript') {
  const cached = getCachedQuestion(topic, subTopic, difficulty, questionMode, language);
  if (cached) {
    return cached;
  }

  const useSingleQuestion = questionMode === 'code' || questionMode === 'complexity';
  const questionCount = useSingleQuestion ? 1 : BATCH_SIZE;

  let modeDescription = '';
  const topicName = subTopic || topic;
  const langName = { js: 'JavaScript', python: 'Python', cpp: 'C++', java: 'Java', csharp: 'C#' }[language] || 'JavaScript';

  if (questionMode === 'code') {
    modeDescription = `Include a code snippet in ${langName} in the question. The question should ask about what the code does, identify bugs, or predict output.`;
  } else if (questionMode === 'complexity') {
    modeDescription = 'Focus on time complexity (Big-O) or space complexity. Ask about the complexity of algorithms, operations, or data structures.';
  } else {
    modeDescription = 'Focus on conceptual understanding, algorithms properties, and real-world applications.';
  }

  const systemPrompt = `You are an expert Computer Science educator specializing in algorithms and data structures.
You are helping students learn on FCAI-Visualizer, an interactive visual platform for tracing algorithms and data structures.
Generate ${questionCount} unique ${difficulty} difficulty multiple choice question${questionCount > 1 ? 's' : ''} about ${topicName}.
Each question should test understanding, not just memorization.

${modeDescription}

Guidelines:
- For MCQ: Include 4 options where only ONE is correct per question
- Include a brief explanation of why the correct answer is right
- Make incorrect options plausible (common mistakes students make)
- ${difficulty === 'easy' ? 'Focus on basic concepts and definitions' : difficulty === 'medium' ? 'Require application of concepts' : 'Require analysis, optimization, or debugging skills'}
- Make questions unique and different from common textbook examples
- For trace-related questions, ask about specific steps (e.g., "what happens after this node is deleted", "how does the array look after 2 passes")
- If including code, put it in the question text
- ${questionCount === 1 
  ? `Generate exactly ONE question in JSON format (not an array):
{"question": "...", "type": "${questionType}", "difficulty": "${difficulty}", "topic": "${topic}", "subTopic": "${subTopic || topic}", "questionMode": "${questionMode}", "options": ["A) option1", "B) option2", "C) option3", "D) option4"], "correctAnswer": "A", "explanation": "..."}`
  : `Generate exactly ${BATCH_SIZE} questions in a JSON array:
[{"question": "...", "type": "${questionType}", "difficulty": "${difficulty}", "topic": "${topic}", "subTopic": "${subTopic || topic}", "questionMode": "${questionMode}", "options": ["A) option1", "B) option2", "C) option3", "D) option4"], "correctAnswer": "A", "explanation": "..."}, ...]`
}
- Do NOT include any text outside the JSON`;

  const userPrompt = questionCount === 1
    ? `Generate ONE unique ${difficulty} question about ${topicName} (${questionMode} mode).
Make it different from standard textbook examples. Focus on ${topic} algorithms and include trace-related questions when applicable.`
    : `Generate ${BATCH_SIZE} unique ${difficulty} questions about ${topicName} (${questionMode} mode).
Make them different from standard textbook examples. Focus on ${topic} algorithms and include trace-related questions when applicable.`;

  const maxRetries = 2;
  let lastError = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const isRetryAttempt = attempt > 0;
    const useSingleOnRetry = isRetryAttempt && !useSingleQuestion;

    try {
      const actualQuestionCount = useSingleOnRetry ? 1 : questionCount;
      const actualSystemPrompt = useSingleOnRetry
        ? systemPrompt.replace(`Generate ${BATCH_SIZE} questions`, 'Generate ONE question').replace('in a JSON array:', 'in JSON format (not an array):').replace(/\[[\s\S]*\]/g, '{"question": "...", "type": "mcq", "difficulty": "easy", "topic": "topic", "subTopic": "topic", "questionMode": "general", "options": ["A) opt1", "B) opt2", "C) opt3", "D) opt4"], "correctAnswer": "A", "explanation": "..."}')
        : systemPrompt;

      const actualUserPrompt = useSingleOnRetry
        ? `Generate ONE unique ${difficulty} question about ${topicName} (${questionMode} mode).`
        : userPrompt;

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          ...(IS_PROD ? {} : { 'Authorization': `Bearer ${OPENROUTER_API_KEY}` }),
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://fcai-visualizer.example.com',
          'X-Title': 'FCAI-Visualizer AI Training',
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: 'system', content: actualSystemPrompt },
            { role: 'user', content: actualUserPrompt },
          ],
          max_tokens: 2048,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`API error: ${error}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;

      try {
        let parsed;
        if (actualQuestionCount === 1) {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            parsed = JSON.parse(jsonMatch[0]);
            if (parsed && parsed.question && parsed.options && parsed.correctAnswer) {
              return parsed;
            }
          }
        } else {
          const jsonMatch = content.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            parsed = JSON.parse(jsonMatch[0]);
            if (Array.isArray(parsed) && parsed.length > 0) {
              const questionToReturn = parsed[0];
              const remainingQuestions = parsed.slice(1);
              if (remainingQuestions.length > 0) {
                cacheQuestions(topic, subTopic, difficulty, questionMode, language, remainingQuestions);
              }
              return questionToReturn;
            }
          }
        }
        throw new Error(`Parsed JSON does not have required fields. Content: ${content.substring(0, 200)}`);
      } catch (parseError) {
        console.error(`Parse attempt ${attempt + 1} failed: ${parseError.message}`);
        console.error('Raw response:', content.substring(0, 500));
        lastError = new Error(`Parsing failed: ${parseError.message}. Raw response: ${content.substring(0, 200)}`);
      }
    } catch (error) {
      console.error(`AI Service Attempt ${attempt + 1} failed:`, error);
      lastError = error;
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }

  console.error('All AI retries failed:', lastError?.message);
  throw new Error(`AI failed after ${maxRetries + 1} attempts: ${lastError?.message || 'Unknown error'}`);
}

export async function evaluateAnswer(question, userAnswer, explanation) {
  const prompt = `Evaluate this answer for the question: "${question.question}"
User's answer: ${userAnswer}
${explanation ? `User's explanation: ${explanation}` : ''}

The correct answer was: ${question.correctAnswer}

Determine if the answer is correct and provide feedback.
Return a JSON with:
{
  "isCorrect": true/false,
  "feedback": "Brief explanation of why they were right or wrong",
  "nextDifficulty": "easier"/"same"/"harder" // based on performance
}`;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        ...(IS_PROD ? {} : { 'Authorization': `Bearer ${OPENROUTER_API_KEY}` }),
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://fcai-visualizer.example.com',
        'X-Title': 'FCAI-Visualizer AI Training',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: 'You are an educational AI that evaluates student answers. Be encouraging but honest.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 512,
        temperature: 0.5,
      }),
    });

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch {
      return { isCorrect: userAnswer === question.correctAnswer, feedback: 'Answer evaluated.', nextDifficulty: 'same' };
    }
  } catch {
    return { isCorrect: userAnswer === question.correctAnswer, feedback: 'Answer evaluated.', nextDifficulty: 'same' };
  }
}

export async function generateTraceStep(algorithm, arrayState, stepNumber) {
  const prompt = `You are tracing the ${algorithm} algorithm.
Current array state: [${arrayState.join(', ')}]
This is step ${stepNumber + 1}

Describe what happens in this step:
- What elements are being compared?
- What elements are being swapped (if any)?
- What is the key/value being processed?
- What will be the next state?

Return JSON:
{
  "action": "compare/swap/key/select/find",
  "description": "What happens in this step",
  "indices": [i, j], // indices involved
  "nextState": [resulting array],
  "question": "What is the correct next state after this step?",
  "options": ["A) [array1]", "B) [array2]", "C) [array3]", "D) [array4]"],
  "correctAnswer": "A"
}`;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        ...(IS_PROD ? {} : { 'Authorization': `Bearer ${OPENROUTER_API_KEY}` }),
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://fcai-visualizer.example.com',
        'X-Title': 'FCAI-Visualizer AI Training',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: 'You are an algorithm tracing teacher. Help students understand each step of algorithms.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 1024,
        temperature: 0.5,
      }),
    });

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch {
      return generateFallbackTraceStep(algorithm, arrayState, stepNumber);
    }
  } catch {
    return generateFallbackTraceStep(algorithm, arrayState, stepNumber);
  }
}

function generateFallbackTraceStep(algorithm, array, step) {
  if (algorithm === 'bubbleSort') {
    if (step === 0) {
      return {
        action: 'compare',
        description: 'Compare first two elements',
        indices: [0, 1],
        nextState: [...array],
        question: 'Should these elements be swapped?',
        options: ['A) Yes, 5 > 3', 'B) No, 5 < 3', 'C) Yes, random', 'D) Cannot determine'],
        correctAnswer: 'A',
      };
    }
  }
  return {
    action: 'compare',
    description: 'Compare adjacent elements',
    indices: [step, step + 1],
    nextState: [...array],
    question: 'What happens in this step?',
    options: ['A) Swap', 'B) No swap', 'C) Move to end', 'D) No change'],
    correctAnswer: 'A',
  };
}