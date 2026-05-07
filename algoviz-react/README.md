<p align="center">
  <img src="public/favicon.svg" alt="FCAI-Visualizer Logo" width="80" height="80" />
</p>

<h1 align="center">FCAI-Visualizer</h1>

<p align="center">
  <strong>A Sophisticated Platform for Visualizing Algorithms & Data Structures</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/React_Router-6-CA4245?style=for-the-badge&logo=react-router&logoColor=white" alt="React Router" />
  <img src="https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript" />
  <img src="https://img.shields.io/badge/CSS3-Custom_Properties-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License" />
</p>

<p align="center">
  Interactive, animated visualizations of algorithms and data structures.<br/>
  Built for students, educators, and anyone who wants to <em>see</em> how algorithms work.
</p>

---

## ✨ Features

### 🌳 Tree Visualizer (Live)
- **AVL Tree** with real-time auto-balancing (LL, RR, LR, RL rotations)
- **Smooth Canvas animations** — nodes fade in, pulse on insert, glow during rotations
- **Reingold-Tilford layout** for optimal node positioning
- **Traversals** — Pre-Order, In-Order, Post-Order, Breadth-First
- **Search operations** — Predecessor & Successor with highlighted paths
- **Random tree generator** — generate up to 99 nodes instantly
- **Pan & Zoom** — scroll to zoom, right-click drag to pan, double-click to reset
- **Dark/Light theme** toggle

### 📊 Sorting Algorithms *(Coming Soon)*
Bubble, Selection, Insertion, Merge, Quick, Heap, Counting, Radix Sort

### 🔍 Searching Algorithms *(Coming Soon)*
Linear, Binary, Jump Search

### 🗂️ Data Structures *(Coming Soon)*
Array, Stack, Queue, Singly/Doubly/Circular/Ordered Linked Lists

### 🕸️ Graph Algorithms *(Coming Soon)*
BFS, DFS, Dijkstra

### 🎯 Practice Mode *(Coming Soon)*
Interactive quizzes to test your algorithm knowledge

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | React 18.3 |
| **Build Tool** | Vite 5.4 |
| **Routing** | React Router v6 |
| **Styling** | Vanilla CSS with Custom Properties (Dark/Light themes) |
| **Canvas** | HTML5 Canvas 2D API |
| **Fonts** | JetBrains Mono, Syne, Inter (Google Fonts) |
| **Linting** | ESLint with React Hooks rules |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- npm (comes with Node.js)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/FCAI-Visualizer.git

# 2. Navigate to the project
cd FCAI-Visualizer

# 3. Install dependencies
npm install

# 4. Start the development server
npm run dev
```

The app will open automatically at `http://localhost:5173`

### Build for Production

```bash
npm run build
npm run preview   # Preview the production build locally
```

---

## 📁 Project Structure

```
FCAI-Visualizer/
├── index.html                      # Vite entry (with SEO meta tags)
├── package.json                    # Dependencies & scripts
├── vite.config.js                  # Vite configuration
├── public/
│   └── favicon.svg                 # App favicon
└── src/
    ├── main.jsx                    # React entry point
    ├── App.jsx                     # Router setup
    ├── algorithms/
    │   └── trees/
    │       ├── avlTree.js          # Pure JS AVL/BST logic (ported native)
    │       └── treeVisualizer.js   # Canvas renderer & event system
    ├── components/
    │   └── layout/
    │       ├── Layout.jsx          # App shell (sidebar + header + outlet)
    │       ├── Sidebar.jsx         # Collapsible accordion navigation
    │       ├── Sidebar.css
    │       └── Header.jsx          # Top bar with title & theme toggle
    ├── pages/
    │   ├── Home.jsx                # Landing page with category cards
    │   ├── Trees.jsx               # Tree visualizer (useRef + useEffect)
    │   ├── Sorting.jsx             # Placeholder
    │   ├── Searching.jsx           # Placeholder
    │   ├── DataStructures.jsx      # Placeholder
    │   ├── Graphs.jsx              # Placeholder
    │   └── PracticeMode.jsx        # Placeholder
    └── styles/
        ├── GlobalStyles.css        # Design system & theme variables
        └── TreeVisualizer.css      # Tree-specific scoped styles
```

---

## 🎨 Architecture Decisions

### Native Logic Preservation
The tree visualizer's core algorithm (AVL insertion, deletion, rotations, Reingold-Tilford layout) runs **outside React's render cycle**. This is intentional:

- `avlTree.js` — Pure JavaScript classes (`BST`, `AVLNode`) with zero framework dependencies
- `treeVisualizer.js` — Imperative DOM + Canvas setup via `initTreeVisualizer(container)`
- `Trees.jsx` — Uses `useRef` + `useEffect` to mount the native visualizer safely

React manages only UI chrome (sidebar, routing, theme). Algorithm state is never a React state variable.

### Theming
CSS Custom Properties power the entire theme system. Toggle between dark and light mode by setting `data-theme="light"` on `<html>`.

---

## 🌐 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project on [vercel.com](https://vercel.com)
3. Vercel auto-detects Vite — no config needed
4. Deploy ✅

### Manual

```bash
npm run build
# Upload the `dist/` folder to any static hosting
```

---

## 🤝 Contributing

Contributions are welcome! To add a new algorithm visualizer:

1. Create the pure JS logic in `src/algorithms/<category>/`
2. Create the page component in `src/pages/`
3. Add the route in `src/App.jsx`
4. Add the sidebar link in `src/components/layout/Sidebar.jsx`

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).

---

<p align="center">
  <sub>Built with ❤️ for learning algorithms</sub>
</p>
