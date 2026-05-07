<p align="center">
  <img src="assets/fcainew.png" width="120" alt="FCAI-Visualizer Logo" />
</p>

<h1 align="center">FCAI-Visualizer</h1>

## An Advanced Educational Platform for Algorithmic and Data Structure Visualization

### Overview
The FCAI Algorithm Visualizer is a sophisticated, web-based platform designed to facilitate the pedagogical study of complex data structures and algorithms. By providing high-fidelity, interactive visualizations, the platform assists students and educators in conceptualizing the internal mechanics of computational processes.

### Core Implementation Modules

#### 1. Tree Structures and Self-Balancing Algorithms
The platform features a robust implementation of Binary Search Trees (BST) with comprehensive support for AVL self-balancing protocols.
- **Dynamic Balancing:** Real-time execution of LL, RR, LR, and RL rotations to maintain tree equilibrium.
- **Layout Optimization:** Implementation of the Reingold-Tilford algorithm for organized node positioning.
- **Traversal Demonstrations:** Sequential visualization of Pre-Order, In-Order, Post-Order, and Breadth-First traversals.
- **Operational Analysis:** Interactive search, predecessor/successor identification, and node deletion with path highlighting.
- **Automated Generation:** Parametric generation of tree structures for varied complexity testing.

#### 2. Graph Theory and Traversal
The system provides interactive environments for the study of graph-based algorithms:
- **Traversal Algorithms:** Sequential visualization of Breadth-First Search (BFS) and Depth-First Search (DFS).
- **Shortest Path Analysis:** Implementation of Dijkstra's algorithm with dynamic edge weight adjustments.
- **Interactive Modeling:** Capabilities for user-defined vertex and edge configuration.

#### 3. AI-Integrated Educational Services
Integration with advanced language models via the OpenRouter API enables the following features:
- **Contextual Inquiry:** Automated generation of educational assessments based on the current visualization state.
- **Trace Analysis:** Detailed textual explanations of algorithmic transitions and state changes.

#### 4. Supplemental Algorithms
- **Sorting:** Implementations of Bubble, Selection, Insertion, Merge, Quick, and Heap sort algorithms.
- **Searching:** Comparative analysis of Linear and Binary search methodologies.
- **Linear Data Structures:** Visualizations for Stacks, Queues, and various Linked List configurations.

### Technical Architecture

The application is engineered with a focus on performance, scalability, and modularity.

- **Frontend Framework:** React 18.3
- **Build Infrastructure:** Vite 5.4
- **Routing:** React Router v6
- **Graphics Engine:** HTML5 Canvas 2D API for high-performance, frame-perfect animations.
- **Design Methodology:** A custom CSS-based design system utilizing CSS Variables for consistent theme application (Light and Dark modes).
- **Architecture Strategy:** Decoupling of core algorithmic logic from the React rendering cycle to ensure performance stability during intensive graphical operations.

### System Requirements and Installation

#### Prerequisites
- Node.js (Version 18.0.0 or higher)
- npm (Node Package Manager)

#### Local Installation Protocol
1. **Clone Repository:**
   ```bash
   git clone https://github.com/Yosef-Ibrahim/AlgoVs.git
   ```
2. **Directory Navigation:**
   ```bash
   cd algoviz-react
   ```
3. **Dependency Acquisition:**
   ```bash
   npm install
   ```
4. **Execution of Development Environment:**
   ```bash
   npm run dev
   ```

### Deployment

The platform is optimized for deployment on Vercel. For production-ready builds, execute the following command:
```bash
npm run build
```

### Contribution Guidelines
Contributions to the FCAI Algorithm Visualizer should follow the established architectural patterns:
1. Algorithmic logic must be implemented as pure JavaScript within the `src/algorithms/` directory.
2. User interface components should be integrated into the `src/pages/` directory.
3. Routing and navigation must be updated in `App.jsx` and `Sidebar.jsx` respectively.

### License
This project is distributed under the MIT License.

