import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { algorithms } from '../data/algorithmData';
import {
  genBubbleSteps, genSelectionSteps, genInsertionSteps,
  genMergeSteps, genQuickSteps, genHeapSteps,
  genCountingSteps, genRadixSteps
} from '../algorithms/sorting/sortingGenerators';
import { SortingVisualizer } from '../algorithms/sorting/sortingVisualizer';
import { useLang } from '../hooks/useLang';

import ControlPanel from '../components/sorting/ControlPanel';
import CodePanel from '../components/sorting/CodePanel';
import ComplexityPanel from '../components/sorting/ComplexityPanel';

import '../styles/Sorting.css';

// Only the sorting subset of the full algorithms map
const SORTING_KEYS = ['bubble','selection','insertion','merge','quick','heap','counting','radix'];
const sortingAlgorithms = Object.fromEntries(
  Object.entries(algorithms).filter(([k]) => SORTING_KEYS.includes(k))
);

const generators = {
  bubble:    genBubbleSteps,
  selection: genSelectionSteps,
  insertion: genInsertionSteps,
  merge:     genMergeSteps,
  quick:     genQuickSteps,
  heap:      genHeapSteps,
  counting:  genCountingSteps,
  radix:     genRadixSteps,
};

export default function Sorting() {
  const { algo: urlAlgo } = useParams();
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  const initialAlgo = urlAlgo && sortingAlgorithms[urlAlgo] ? urlAlgo : 'bubble';

  const [algo,      setAlgo]      = useState(initialAlgo);
  const [arraySize, setArraySize] = useState(20);
  const [speed,     setSpeed]     = useState(5);
  const [array,     setArray]     = useState([]);
  const [steps,     setSteps]     = useState([]);
  const [stepIdx,   setStepIdx]   = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const playTimerRef = useRef(null);

  // ── Custom input ──────────────────────────────────────────────────────
  const [customInput, setCustomInput] = useState('');

  // ── Language persistence ──────────────────────────────────────────────
  const [lang, setLang] = useLang('js');

  // ── URL sync ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (urlAlgo && sortingAlgorithms[urlAlgo] && urlAlgo !== algo) {
      setAlgo(urlAlgo);
      generateArray(arraySize, urlAlgo);
      reset();
    }
  }, [urlAlgo]);

  // ── Canvas init ───────────────────────────────────────────────────────
  useEffect(() => {
    if (canvasRef.current) SortingVisualizer.init(canvasRef.current);
    return () => SortingVisualizer.stopAnimation();
  }, []);

  // ── Array generation ──────────────────────────────────────────────────
  const generateArray = (size, currentAlgo = algo) => {
    let newArr;
    if (currentAlgo === 'counting') {
      newArr = Array.from({ length: size }, () => Math.floor(Math.random() * 15) + 1);
    } else if (currentAlgo === 'radix') {
      newArr = Array.from({ length: size }, () => Math.floor(Math.random() * 900) + 100);
    } else {
      newArr = Array.from({ length: size }, () => Math.floor(Math.random() * 90) + 10);
    }
    setArray(newArr);
    setCustomInput('');
    return newArr;
  };

  const applyCustomInput = (nums) => {
    setArray(nums);
  };

  useEffect(() => { generateArray(arraySize, algo); }, [arraySize]);

  // ── Step generation ───────────────────────────────────────────────────
  useEffect(() => {
    if (array.length > 0) {
      const generator = generators[algo];
      if (generator) {
        const newSteps = generator([...array]);
        setSteps(newSteps);
        setStepIdx(-1);
        SortingVisualizer.setState({ array, steps: newSteps, algo, speed });
        SortingVisualizer.drawStep(-1);
      }
    }
  }, [array, algo, speed]);

  useEffect(() => { SortingVisualizer.setState({ speed }); }, [speed]);

  // ── Controls ──────────────────────────────────────────────────────────
  const reset = () => {
    setIsPlaying(false);
    if (playTimerRef.current) clearTimeout(playTimerRef.current);
    SortingVisualizer.stopAnimation();
    setStepIdx(-1);
    SortingVisualizer.drawStep(-1);
  };

  const stepForward = () => {
    if (stepIdx < steps.length - 1) {
      const next = stepIdx + 1;
      setStepIdx(next);
      SortingVisualizer.animateStep(next, null);
    }
  };

  const stepBack = () => {
    if (stepIdx >= 0) {
      const prev = stepIdx - 1;
      setStepIdx(prev);
      SortingVisualizer.drawStep(prev);
    }
  };

  // ── Play loop ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (isPlaying) {
      if (stepIdx < steps.length - 1) {
        SortingVisualizer.animateStep(stepIdx + 1, () => {
          setStepIdx(prev => prev + 1);
        });
      } else {
        setIsPlaying(false);
      }
    }
    return () => SortingVisualizer.stopAnimation();
  }, [isPlaying, stepIdx]);

  // ── Derived ───────────────────────────────────────────────────────────
  const activeStep       = stepIdx >= 0 && steps[stepIdx] ? steps[stepIdx] : null;
  const activeLine       = activeStep
    ? (activeStep.codeLines?.[lang] ?? activeStep.codeLine ?? -1)
    : -1;
  const currentAlgoData  = sortingAlgorithms[algo];

  return (
    <div className="sorting-page">
      <div className="sorting-header">
        <h2>{currentAlgoData?.name}</h2>
        {activeStep && (
          <div className="step-msg">{activeStep.msg}</div>
        )}
      </div>

      <ControlPanel
        isPlaying={isPlaying}
        onPlayPause={() => setIsPlaying(!isPlaying)}
        onReset={reset}
        onStepBack={stepBack}
        onStepForward={stepForward}
        onGenerateRandom={() => generateArray(arraySize)}
        algorithm={algo}
        setAlgorithm={(a) => { setAlgo(a); navigate(`/sorting/${a}`); reset(); }}
        arraySize={arraySize}
        setArraySize={setArraySize}
        speed={speed}
        setSpeed={setSpeed}
        algorithms={sortingAlgorithms}
        customInput={customInput}
        setCustomInput={setCustomInput}
        onApplyCustom={applyCustomInput}
      />

      <div className="sorting-main">
        <div className="sorting-viz-container">
          <div className="sorting-canvas-wrapper">
            <canvas ref={canvasRef} />
          </div>
        </div>

        <div className="sorting-side-panel">
          <ComplexityPanel complexity={currentAlgoData?.complexity} />

          <div className="panel-card">
            <h3>Description</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              {currentAlgoData?.description}
            </p>
          </div>

          <CodePanel
            codeByLang={currentAlgoData?.codeByLang}
            codeSnippet={currentAlgoData?.code?.js}
            activeLine={activeLine}
            lang={lang}
            setLang={setLang}
          />
        </div>
      </div>
    </div>
  );
}
