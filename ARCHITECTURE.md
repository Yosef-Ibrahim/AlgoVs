# FCAI-Visualizer Project Architecture

This document provides a comprehensive overview of the architecture and design of the FCAI-Visualizer project.

## 1. Technology Stack
- **Core**: React 18+ with Vite as the build tool.
- **Routing**: `react-router-dom` for client-side navigation.
- **Visualization**: HTML5 Canvas for high-performance algorithm rendering.
- **AI Integration**: OpenRouter API for dynamic content generation (questions, evaluations, tracing).
- **State Management**: React Hooks (`useState`, `useEffect`, `useRef`) for UI state; domain-specific visualizers for canvas state.
- **Styling**: Vanilla CSS with CSS Variables for a modern, themed look.

## 2. Directory Structure (`/src`)
- `algorithms/`: Logic for algorithm execution.
  - `sorting/`: `sortingGenerators.js` (logic), `sortingVisualizer.js` (rendering).
  - `graphs/`, `trees/`, `searching/`: Similar structures for other categories.
- `components/`: Reusable UI components.
  - `layout/`: `Header`, `Sidebar`, `Layout` wrapper.
  - `sorting/`, `ai/`: Feature-specific components.
- `pages/`: Main view components (e.g., `Sorting.jsx`, `Home.jsx`, `PracticeMode.jsx`).
- `services/`: External integrations.
  - `aiService.js`: Core logic for AI-driven features.
- `hooks/`: Custom React hooks (e.g., `useLang`).
- `data/`: Static metadata and constants (e.g., `algorithmData.js`).
- `styles/`: Component and page-specific styles.

## 3. Core Architectural Patterns

### A. Generator-Visualizer Pattern
Algorithms are implemented using a decoupled approach:
1.  **Generators**: Pure functions that take initial data (e.g., an array) and return an array of "Step" objects.
2.  **Steps**: Contain the state at a specific point in time (array snapshot), indices involved (comparison/swap), and the corresponding source code line.
3.  **Visualizers**: Objects (e.g., `SortingVisualizer`) that take these steps and render them to a Canvas element. They handle the "play/pause/step" logic.

### B. AI-Enhanced Learning
The `aiService.js` provides:
- **Dynamic Quizzes**: Generates MCQs based on the current algorithm, difficulty, and selected programming language.
- **Step Tracing**: Provides natural language explanations for what is happening at a specific step in an algorithm.
- **Persistence**: Caches generated questions in `localStorage` to reduce API calls and improve responsiveness.

### C. Responsive UI & Navigation
- The app uses a sidebar-based navigation for switching between algorithm categories and specific algorithms.
- URL parameters (`/sorting/:algo`) are synced with the internal state to allow deep-linking and browser navigation support.

## 4. Key Data Flow
1.  User selects an algorithm (e.g., "Bubble Sort").
2.  The `Sorting` page loads metadata from `algorithmData.js`.
3.  An initial array is generated.
4.  `genBubbleSteps` (the generator) processes the array and produces a list of steps.
5.  `SortingVisualizer` is initialized with the canvas and the steps.
6.  User interacts with controls (Play, Step Forward) which triggers `SortingVisualizer` to draw specific frames.
7.  (Optional) User enters "Practice Mode" where `aiService` fetches relevant questions for the selected algorithm.

## 5. Project Coverage
The project covers a wide range of computer science topics:
- **Sorting**: Bubble, Selection, Insertion, Merge, Quick, Heap, Counting, Radix.
- **Searching**: Linear, Binary, Jump.
- **Data Structures**: Array, Stack, Queue, Linked Lists (Singly, Doubly, Circular, Ordered).
- **Trees**: BST, AVL, Heap, Binary Tree Traversal.
- **Graphs**: BFS, DFS, Dijkstra, Prim, Kruskal.
