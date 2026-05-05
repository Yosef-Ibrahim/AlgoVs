import { useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { initDSVisualizer } from '../algorithms/dataStructures/dsVisualizer';
import '../styles/DataStructures.css';

/**
 * Data Structures page — uses useRef + useEffect to safely mount the native
 * data structures visualizer OUTSIDE React's render cycle.
 */
export default function DataStructures() {
  const { type } = useParams();
  const containerRef = useRef(null);
  const vizRef = useRef(null);

  useEffect(() => {
    // Determine which structure to visualize based on the URL parameter
    // Default to 'array' if not provided
    const dsType = type || 'array';

    if (containerRef.current) {
      // Destroy previous instance if it exists (e.g. when changing types)
      if (vizRef.current) {
        vizRef.current.destroy();
        vizRef.current = null;
      }

      vizRef.current = initDSVisualizer(containerRef.current, dsType);
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
      className="ds-page"
      style={{ width: '100%', height: '100%' }}
    />
  );
}
