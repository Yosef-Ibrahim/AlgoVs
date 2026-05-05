import { useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { initTreeVisualizer } from '../algorithms/trees/treeVisualizer';
import '../styles/TreeVisualizer.css';

/**
 * Trees page — uses useRef + useEffect to safely mount the native
 * tree visualizer OUTSIDE React's render cycle.
 *
 * CRITICAL: React manages ZERO tree state. The native BST class
 * owns all algorithm state. React only provides the container.
 */
export default function Trees() {
  const containerRef = useRef(null);
  const vizRef = useRef(null);
  const { type } = useParams();

  useEffect(() => {
    if (containerRef.current) {
      if (vizRef.current) {
        vizRef.current.destroy();
        vizRef.current = null;
      }
      vizRef.current = initTreeVisualizer(containerRef.current, type);
    }

    return () => {
      if (vizRef.current) {
        vizRef.current.destroy();
        vizRef.current = null;
      }
    };
  }, [type]);

  return (
    <div
      ref={containerRef}
      className="tree-page"
      style={{ width: '100%', height: '100%' }}
    />
  );
}
