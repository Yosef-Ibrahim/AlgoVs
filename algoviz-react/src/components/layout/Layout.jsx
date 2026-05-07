import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const THEME_KEY = 'fcai_visualizer_theme';

export default function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => window.innerWidth <= 1199);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 1199px)');
    const handleChange = (e) => {
      setSidebarCollapsed(e.matches);
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  // ── Theme: read from localStorage, default to dark ──────────────────
  const [theme, setTheme] = useState(() => {
    try {
      const stored = localStorage.getItem(THEME_KEY);
      if (stored === 'light' || stored === 'dark') return stored;
    } catch (_) { /* blocked */ }
    return 'dark';
  });

  // Apply theme to <html data-theme="..."> whenever it changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem(THEME_KEY, theme); } catch (_) { /* ignore */ }
  }, [theme]);

  const toggleSidebar = () => setSidebarCollapsed((v) => !v);
  const toggleTheme   = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return (
    <div className="app-layout">
      {!sidebarCollapsed && (
        <div
          className="sidebar-overlay visible"
          onClick={toggleSidebar}
        />
      )}
      <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
      <div className="app-main">
        <Header
          onToggleSidebar={toggleSidebar}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
        <div className="app-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
