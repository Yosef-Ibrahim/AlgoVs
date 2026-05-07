import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import './Sidebar.css';
import logo from '../../../assets/fcainew.png';

const NAV_SECTIONS = [
  {
    id: 'sorting', icon: '📊', label: 'Sorting',
    children: [
      { to: '/sorting/bubble',    label: 'Bubble Sort' },
      { to: '/sorting/selection', label: 'Selection Sort' },
      { to: '/sorting/insertion', label: 'Insertion Sort' },
      { to: '/sorting/merge',    label: 'Merge Sort' },
      { to: '/sorting/quick',    label: 'Quick Sort' },
      { to: '/sorting/heap',     label: 'Heap Sort' },
      { to: '/sorting/counting', label: 'Counting Sort' },
      { to: '/sorting/radix',    label: 'Radix Sort' },
    ],
  },
  {
    id: 'searching', icon: '🔍', label: 'Searching',
    children: [
      { to: '/searching/linear', label: 'Linear Search' },
      { to: '/searching/binary', label: 'Binary Search' },
      { to: '/searching/jump',   label: 'Jump Search' },
    ],
  },
  {
    id: 'ds', icon: '🗂️', label: 'Data Structures',
    children: [
      { to: '/data-structures/array',       label: 'Array' },
      { to: '/data-structures/stack',       label: 'Stack' },
      { to: '/data-structures/queue',       label: 'Queue' },
      { to: '/data-structures/singly-ll',   label: 'Singly Linked List' },
      { to: '/data-structures/doubly-ll',   label: 'Doubly Linked List' },
      { to: '/data-structures/circular-ll', label: 'Circular Linked List' },
      { to: '/data-structures/ordered-ll',  label: 'Ordered Linked List' },
    ],
  },
  {
    id: 'trees', icon: '🌳', label: 'Trees',
    children: [
      { to: '/trees/bst', label: 'Binary Search Tree' },
      { to: '/trees/avl', label: 'AVL Tree' },
    ],
  },
  {
    id: 'graphs', icon: '🕸️', label: 'Graphs',
    children: [
      { to: '/graphs/bfs',      label: 'BFS' },
      { to: '/graphs/dfs',      label: 'DFS' },
      { to: '/graphs/dijkstra', label: 'Dijkstra' },
    ],
  },
];

export default function Sidebar({ collapsed, onToggle }) {
  const [openSections, setOpenSections] = useState(['trees']);

  const toggleSection = (id) => {
    setOpenSections((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  return (
    <nav className={`sidebar ${collapsed ? 'collapsed' : 'mobile-open'}`}>
      <Link to="/" className="sidebar-header" style={{ textDecoration: 'none' }}>
        <img src={logo} alt="FCAI Logo" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
        <span className="sidebar-logo">FCAI-Visualizer</span>
      </Link>
      <div className="sidebar-nav">
        {NAV_SECTIONS.map((section) => (
          <div
            key={section.id}
            className={`sidebar-section${openSections.includes(section.id) ? ' open' : ''}`}
          >
            <button
              className="sidebar-item"
              onClick={() => toggleSection(section.id)}
            >
              <span className="icon">{section.icon}</span>
              <span className="label">{section.label}</span>
              <span className="sidebar-arrow">▶</span>
            </button>
            <div className="sidebar-children">
              {section.children.map((child) => (
                <NavLink
                  key={child.to}
                  to={child.to}
                  className={({ isActive }) =>
                    `sidebar-child${isActive ? ' active' : ''}`
                  }
                >
                  {child.label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}

        {/* Modes */}
        <div className="sidebar-section-title">Modes</div>
        <NavLink
          to="/practice"
          className={({ isActive }) =>
            `sidebar-mode-item${isActive ? ' active' : ''}`
          }
        >
          <span className="icon">🎯</span>
          Practice Mode
        </NavLink>
      </div>
    </nav>
  );
}
