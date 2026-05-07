import { useLocation } from 'react-router-dom';

const TITLES = {
  '/': 'Welcome',
  '/sorting': 'Sorting Algorithms',
  '/searching': 'Searching Algorithms',
  '/data-structures': 'Data Structures',
  '/trees': 'Tree Visualizer',
  '/graphs': 'Graph Algorithms',
  '/practice': 'Practice Mode',
};

function getTitle(pathname) {
  // Check exact match first
  if (TITLES[pathname]) return TITLES[pathname];
  // Check prefix match
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length >= 2) {
    const labels = {
      bubble: 'Bubble Sort', selection: 'Selection Sort', insertion: 'Insertion Sort',
      merge: 'Merge Sort', quick: 'Quick Sort', heap: 'Heap Sort',
      counting: 'Counting Sort', radix: 'Radix Sort',
      linear: 'Linear Search', binary: 'Binary Search', jump: 'Jump Search',
      bst: 'Binary Search Tree', avl: 'AVL Tree',
      bfs: 'BFS', dfs: 'DFS', dijkstra: 'Dijkstra',
      array: 'Array', stack: 'Stack', queue: 'Queue',
      'singly-ll': 'Singly Linked List', 'doubly-ll': 'Doubly Linked List',
      'circular-ll': 'Circular Linked List', 'ordered-ll': 'Ordered Linked List',
    };
    return labels[parts[parts.length - 1]] || parts[parts.length - 1];
  }
  return 'FCAI-Visualizer';
}

export default function Header({ onToggleSidebar, theme, onToggleTheme }) {
  const location = useLocation();
  const title = getTitle(location.pathname);

  return (
    <div style={{
      height: 'var(--header-h)',
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 20px',
      gap: '12px',
      flexShrink: 0,
    }}>
      <button
        onClick={onToggleSidebar}
        style={{
          background: 'none',
          border: '1px solid var(--border)',
          borderRadius: '6px',
          padding: '6px 10px',
          color: 'var(--text-muted)',
          fontSize: '16px',
          cursor: 'pointer',
          lineHeight: 1,
          flexShrink: 0,
          transition: 'background .15s, color .15s',
        }}
        title="Toggle sidebar"
      >
        ☰
      </button>

      <div style={{
        fontFamily: 'var(--font-head)',
        fontSize: '18px',
        fontWeight: 700,
        flex: 1,
      }}>
        {title}
      </div>

      <button
        onClick={onToggleTheme}
        style={{
          background: 'var(--surface2)',
          border: '1px solid var(--border)',
          borderRadius: '20px',
          padding: '6px 14px',
          color: 'var(--text)',
          fontSize: '13px',
          cursor: 'pointer',
          transition: 'background .15s',
        }}
      >
        {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
      </button>
    </div>
  );
}
