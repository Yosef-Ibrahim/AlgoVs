import React, { useEffect, useRef, useState } from 'react';

const HeroAnimation = () => {
  const svgRef = useRef(null);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mediaQuery.matches);
    const handleMotionChange = (e) => setIsReducedMotion(e.matches);
    // Safari compat
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMotionChange);
    } else {
      mediaQuery.addListener(handleMotionChange);
    }

    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleMotionChange);
      } else {
        mediaQuery.removeListener(handleMotionChange);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if (isReducedMotion || !svgRef.current) return;

    let animationFrameId;
    const startTime = performance.now();
    const DURATION = 6000;

    const nodes = Array.from(svgRef.current.querySelectorAll('.anim-node'));
    const edges = Array.from(svgRef.current.querySelectorAll('.anim-edge'));
    
    // In-order traversal: LL, L, LR, Root, RL, R, RR -> 3, 1, 4, 0, 5, 2, 6
    // Mobile (3 nodes): L, Root, R -> 1, 0, 2
    const traversalOrder = isMobile ? [1, 0, 2] : [3, 1, 4, 0, 5, 2, 6];

    const animate = (time) => {
      const elapsed = (time - startTime) % DURATION;
      
      // Phase 1: Nodes appear (0 - 1000ms)
      nodes.forEach((node, i) => {
        const nodeStart = i * 100;
        let scale = 0;
        let opacity = 0;
        let fill = 'var(--surface2)';
        let stroke = 'var(--border)';
        let strokeWidth = 2;
        
        if (elapsed > 5500) {
          // Fade out
          const fadeProgress = (elapsed - 5500) / 500;
          scale = 1 - fadeProgress;
          opacity = 1 - fadeProgress;
        } else if (elapsed > nodeStart) {
          const progress = Math.min((elapsed - nodeStart) / 300, 1);
          // Ease out back
          const c1 = 1.70158;
          const c3 = c1 + 1;
          scale = 1 + c3 * Math.pow(progress - 1, 3) + c1 * Math.pow(progress - 1, 2);
          opacity = progress;
        }

        // Phase 3: Traversal highlight (2500 - 5000ms)
        if (elapsed > 2500 && elapsed < 5500) {
          const highlightStep = 2500 / traversalOrder.length; 
          const currentStep = Math.floor((elapsed - 2500) / highlightStep);
          
          if (currentStep < traversalOrder.length && traversalOrder[currentStep] === i) {
            fill = 'var(--accent)';
            stroke = 'var(--accent3)';
            strokeWidth = 3;
            
            const stepElapsed = (elapsed - 2500) % highlightStep;
            const highlightProgress = Math.min(stepElapsed / 100, 1); 
            scale = 1 + (0.25 * highlightProgress); // pulse to 1.25x
          } else if (traversalOrder.indexOf(i) < currentStep) {
            // Already visited node
            fill = 'var(--surface3)';
            stroke = 'var(--accent)';
            strokeWidth = 2;
          }
        }
        
        node.style.transform = `scale(${Math.max(0, scale)})`;
        node.style.opacity = Math.max(0, opacity);
        node.style.transformOrigin = `${node.getAttribute('cx')}px ${node.getAttribute('cy')}px`;
        node.style.fill = fill;
        node.style.stroke = stroke;
        node.style.strokeWidth = strokeWidth;
      });

      // Phase 2: Edges draw (1000 - 2000ms)
      edges.forEach((edge, i) => {
        const edgeStart = 800 + i * 150;
        
        const x1 = parseFloat(edge.getAttribute('x1'));
        const y1 = parseFloat(edge.getAttribute('y1'));
        const x2 = parseFloat(edge.getAttribute('x2'));
        const y2 = parseFloat(edge.getAttribute('y2'));
        const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        
        if (elapsed > 5500) {
           const fadeProgress = (elapsed - 5500) / 500;
           edge.style.opacity = 1 - fadeProgress;
        } else if (elapsed > edgeStart) {
          const progress = Math.min((elapsed - edgeStart) / 400, 1);
          // Ease out cubic
          const easeProgress = 1 - Math.pow(1 - progress, 3);
          
          edge.style.strokeDasharray = length;
          edge.style.strokeDashoffset = length * (1 - easeProgress);
          edge.style.opacity = 1;
        } else {
          edge.style.opacity = 0;
        }
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrameId);
  }, [isReducedMotion, isMobile]);

  const nodeData = isMobile 
    ? [
        { id: 0, cx: 300, cy: 30 },
        { id: 1, cx: 200, cy: 110 },
        { id: 2, cx: 400, cy: 110 },
      ]
    : [
        { id: 0, cx: 300, cy: 20 },
        { id: 1, cx: 200, cy: 80 },
        { id: 2, cx: 400, cy: 80 },
        { id: 3, cx: 140, cy: 140 },
        { id: 4, cx: 260, cy: 140 },
        { id: 5, cx: 340, cy: 140 },
        { id: 6, cx: 460, cy: 140 },
      ];

  const edgeData = isMobile
    ? [
        { id: 0, x1: 300, y1: 30, x2: 200, y2: 110 },
        { id: 1, x1: 300, y1: 30, x2: 400, y2: 110 },
      ]
    : [
        { id: 0, x1: 300, y1: 20, x2: 200, y2: 80 },
        { id: 1, x1: 300, y1: 20, x2: 400, y2: 80 },
        { id: 2, x1: 200, y1: 80, x2: 140, y2: 140 },
        { id: 3, x1: 200, y1: 80, x2: 260, y2: 140 },
        { id: 4, x1: 400, y1: 80, x2: 340, y2: 140 },
        { id: 5, x1: 400, y1: 80, x2: 460, y2: 140 },
      ];

  const staticNodeStyle = {
    fill: 'var(--surface2)',
    stroke: 'var(--border)',
    strokeWidth: 2,
  };
  const staticEdgeStyle = {
    stroke: 'var(--border)',
    strokeWidth: 2,
    opacity: 0.8,
  };

  return (
    <div style={{ width: '100%', maxWidth: '600px', height: isMobile ? '140px' : '180px', margin: '24px auto 48px auto' }}>
      <svg 
        ref={svgRef} 
        viewBox={isMobile ? "0 0 600 140" : "0 0 600 180"} 
        width="100%" 
        height="100%"
        style={{ overflow: 'visible' }}
      >
        {edgeData.map(edge => (
          <line
            key={`e-${edge.id}`}
            className="anim-edge"
            x1={edge.x1} y1={edge.y1}
            x2={edge.x2} y2={edge.y2}
            style={isReducedMotion ? staticEdgeStyle : { stroke: 'var(--border)', strokeWidth: 2, opacity: 0 }}
          />
        ))}
        {nodeData.map((node, idx) => (
          <circle
            key={`n-${node.id}`}
            className="anim-node"
            cx={node.cx}
            cy={node.cy}
            r={14}
            style={isReducedMotion 
              ? { ...staticNodeStyle, fill: idx === 0 ? 'var(--accent)' : 'var(--surface2)' } 
              : { fill: 'var(--surface2)', stroke: 'var(--border)', strokeWidth: 2, opacity: 0 }
            }
          />
        ))}
      </svg>
    </div>
  );
};

export default HeroAnimation;
