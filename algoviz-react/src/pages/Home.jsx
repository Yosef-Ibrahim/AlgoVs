import { Link } from 'react-router-dom';
import HeroAnimation from '../components/layout/HeroAnimation';

const CATEGORIES = [
  { icon: '🌳', title: 'Trees', desc: 'BST & AVL Tree with live animations, rotations, and traversals', to: '/trees/avl', color: '#43d9ad', ready: true },
  { icon: '📊', title: 'Sorting', desc: 'Bubble, Selection, Insertion, Merge, Quick, Heap, Counting, Radix', to: '/sorting', color: '#6c63ff', ready: true },
  { icon: '🔍', title: 'Searching', desc: 'Linear, Binary, and Jump Search with step-by-step visualization', to: '/searching', color: '#ff6584', ready: true },
  { icon: '🗂️', title: 'Data Structures', desc: 'Arrays, Stacks, Queues, and Linked Lists visualized', to: '/data-structures', color: '#f7c59f', ready: true },
  { icon: '🕸️', title: 'Graphs', desc: 'BFS, DFS, and Dijkstra with interactive graph editor', to: '/graphs', color: '#ffd166', ready: true },
  { icon: '🎯', title: 'Practice Mode', desc: 'Test your knowledge with algorithm quizzes', to: '/practice', color: '#a78bfa', ready: true },
];

export default function Home() {
  return (
    <div style={{
      height: '100%', overflow: 'auto', padding: '40px',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      animation: 'fadeIn .5s ease',
    }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: '48px', maxWidth: '600px' }}>
        <h1 style={{
          fontFamily: 'var(--font-head)', fontSize: '42px', fontWeight: 800,
          background: 'linear-gradient(135deg, var(--accent), var(--accent3))',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          backgroundClip: 'text', marginBottom: '12px',
        }}>
          FCAI-Visualizer
        </h1>
        <p style={{
          fontSize: '17px', color: 'var(--text-muted)', lineHeight: 1.6,
          maxWidth: '480px', margin: '0 auto',
        }}>
          A sophisticated platform for visualizing Algorithms & Data Structures.
          Interactive, animated, and built for learning.
        </p>
        <HeroAnimation />
      </div>

      {/* Category Grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '16px', width: '100%', maxWidth: '900px',
      }}>
        {CATEGORIES.map((cat) => {
            const CardWrapper = cat.ready ? Link : 'div';
            const wrapperProps = cat.ready 
              ? { to: cat.to, style: { textDecoration: 'none' } }
              : { 
                  onClick: (e) => {
                    e.preventDefault();
                    alert(`${cat.title} is coming soon! Stay tuned.`);
                  },
                  style: { cursor: 'not-allowed', textDecoration: 'none' }
                };
            
            return (
              <CardWrapper key={cat.title} {...wrapperProps}>
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '24px',
              cursor: cat.ready ? 'pointer' : 'not-allowed',
              transition: 'all .2s',
              position: 'relative',
              overflow: 'hidden',
              opacity: cat.ready ? 1 : 0.85,
            }}
            onMouseEnter={(e) => {
              if (cat.ready) {
                e.currentTarget.style.borderColor = cat.color;
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = `0 8px 24px ${cat.color}22`;
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}>
              {/* Glow accent */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
                background: `linear-gradient(90deg, ${cat.color}, transparent)`,
                opacity: 0.6,
              }} />

              <div style={{ fontSize: '32px', marginBottom: '12px' }}>{cat.icon}</div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px',
              }}>
                <h3 style={{
                  fontFamily: 'var(--font-head)', fontSize: '18px', fontWeight: 700,
                  color: 'var(--text)',
                }}>{cat.title}</h3>
                {!cat.ready && (
                  <span style={{
                    fontSize: '9px', fontFamily: 'var(--font-mono)', fontWeight: 600,
                    padding: '2px 8px', borderRadius: '10px', letterSpacing: '0.5px',
                    background: 'rgba(108,99,255,.12)', color: 'var(--accent)',
                    border: '1px solid rgba(108,99,255,.25)',
                  }}>SOON</span>
                )}
                {cat.ready && (
                  <span style={{
                    fontSize: '9px', fontFamily: 'var(--font-mono)', fontWeight: 600,
                    padding: '2px 8px', borderRadius: '10px', letterSpacing: '0.5px',
                    background: 'rgba(67,217,173,.12)', color: 'var(--accent3)',
                    border: '1px solid rgba(67,217,173,.25)',
                  }}>LIVE</span>
                )}
              </div>
              <p style={{
                fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5,
              }}>{cat.desc}</p>
            </div>
              </CardWrapper>
            );
          })}
      </div>

      {/* Footer */}
      <div style={{
        marginTop: '48px', paddingTop: '20px',
        borderTop: '1px solid var(--border)', textAlign: 'center',
        fontSize: '12px', color: 'var(--text-muted)', width: '100%', maxWidth: '900px',
      }}>
        Built with React + Vite • © 2024 FCAI-Visualizer
      </div>
    </div>
  );
}
