import { useRef, useEffect } from 'react';
import { initDFSVisualizer } from '../algorithms/graphs/dfsVisualizer';
import '../styles/TreeVisualizer.css';

export default function DFS() {
  const containerRef = useRef(null);
  const vizRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      if (vizRef.current) {
        vizRef.current.destroy();
        vizRef.current = null;
      }
      vizRef.current = initDFSVisualizer(containerRef.current);
    }

    return () => {
      if (vizRef.current) {
        vizRef.current.destroy();
        vizRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="tree-page"
      style={{ width: '100%', height: '100%' }}
    />
  );
}
