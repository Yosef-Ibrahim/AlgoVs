import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Trees from './pages/Trees';
import Sorting from './pages/Sorting';
import Searching from './pages/Searching';
import DataStructures from './pages/DataStructures';
import Graphs from './pages/Graphs';
import PracticeMode from './pages/PracticeMode';
import { Analytics } from '@vercel/analytics/react';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />

          {/* Trees — fully functional */}
          <Route path="trees" element={<Trees />} />
          <Route path="trees/:type" element={<Trees />} />

          {/* Sorting — placeholders */}
          <Route path="sorting" element={<Sorting />} />
          <Route path="sorting/:algo" element={<Sorting />} />

          {/* Searching — placeholders */}
          <Route path="searching" element={<Searching />} />
          <Route path="searching/:algo" element={<Searching />} />

          {/* Data Structures — placeholders */}
          <Route path="data-structures" element={<DataStructures />} />
          <Route path="data-structures/:type" element={<DataStructures />} />

          {/* Graphs — placeholders */}
          <Route path="graphs" element={<Graphs />} />
          <Route path="graphs/:algo" element={<Graphs />} />

          {/* Practice Mode */}
          <Route path="practice" element={<PracticeMode />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      <Analytics />
    </BrowserRouter>
  );
}
