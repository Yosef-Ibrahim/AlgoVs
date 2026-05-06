// ══════════════════════════════════════════════════════════════════════════════
//  DFS Graph Visualizer — Canvas + Events + Render Loop
//  Matches BFS Graph Visualizer patterns exactly
// ══════════════════════════════════════════════════════════════════════════════

import { THEMES, SPEED_TABLE, colA } from '../trees/avlTree.js';

const NODE_R = 22;
const NODE_COLORS = ['#5aa0ff', '#37be73', '#ff913c', '#b450f0', '#f54b82', '#2dc3c8'];

export function initDFSVisualizer(container) {
  container.innerHTML = '';
  container.style.display = 'flex';
  container.style.height = '100%';

  // Side panel
  const panel = document.createElement('aside');
  panel.className = 'tree-panel';
  panel.innerHTML = `
    <div class="tree-panel-title">
      <span class="tree-title-main">DFS Graph</span>
      <span class="tree-title-sub">Visualizer</span>
      <span class="tree-title-edition">Educational Edition</span>
    </div>
    <hr class="tree-divider"/>
    <section class="tree-section">
      <div class="tree-section-label">GRAPH SETUP</div>
      <div class="tree-gen-row">
        <label>Nodes:</label>
        <input class="tree-rand-input" id="dfs-node-count" type="number" min="3" max="20" value="6"/>
        <button class="tree-btn tree-btn-green sm" id="dfs-btn-create">Create</button>
      </div>
      <div class="tree-tip">Then click nodes to add edges (source → target)</div>
    </section>
    <hr class="tree-divider"/>
    <section class="tree-section">
      <div class="tree-section-label">EDGE MODE</div>
      <div class="tree-speed-row">
        <button class="tree-speed-btn active" data-dir="undirected">Undirected</button>
        <button class="tree-speed-btn" data-dir="directed">Directed</button>
      </div>
    </section>
    <hr class="tree-divider"/>
    <section class="tree-section">
      <div class="tree-section-label">DFS TRAVERSAL</div>
      <button class="tree-btn tree-btn-accent" id="dfs-btn-start-dfs">Start DFS (Select Node)</button>
      <div id="dfs-stack-display" style="margin-top:8px;font-size:12px;color:var(--text-muted);min-height:20px"></div>
      <div id="dfs-path-display" style="margin-top:4px;font-size:12px;color:var(--accent);min-height:20px"></div>
    </section>
    <hr class="tree-divider"/>
    <section class="tree-section">
      <div class="tree-section-label">EDGE LEGEND</div>
      <div style="display:flex;flex-direction:column;gap:4px;font-size:11px;color:var(--text-muted)">
        <div style="display:flex;align-items:center;gap:6px"><span style="width:12px;height:3px;background:var(--accent);display:inline-block"></span> Tree Edge</div>
        <div style="display:flex;align-items:center;gap:6px"><span style="width:12px;height:3px;background:var(--danger, #ff4b4b);display:inline-block"></span> Back Edge</div>
        <div style="display:flex;align-items:center;gap:6px"><span style="width:12px;height:3px;background:var(--accent3, #48d782);display:inline-block"></span> Forward/Cross Edge</div>
      </div>
    </section>
    <hr class="tree-divider"/>
    <section class="tree-section">
      <div class="tree-section-label">DRAG MODE</div>
      <div class="tree-speed-row">
        <button class="tree-speed-btn active" data-drag="edges">Move with Edges</button>
        <button class="tree-speed-btn" data-drag="node">Move Node Only</button>
      </div>
    </section>
    <hr class="tree-divider"/>
    <section class="tree-section">
      <div class="tree-section-label">EXPORT / PRINT</div>
      <button class="tree-btn tree-btn-ghost sm" id="dfs-btn-adj-list">Print Adjacency List</button>
      <button class="tree-btn tree-btn-ghost sm" id="dfs-btn-adj-matrix">Print Adjacency Matrix</button>
    </section>
    <hr class="tree-divider"/>
    <section class="tree-section">
      <div class="tree-section-label">ANIMATION SPEED</div>
      <div class="tree-speed-row">
        <button class="tree-speed-btn active" data-speed="0">Slow</button>
        <button class="tree-speed-btn" data-speed="1">Normal</button>
        <button class="tree-speed-btn" data-speed="2">Fast</button>
      </div>
    </section>
    <button class="tree-btn tree-btn-danger-dim sm" id="dfs-btn-reset" style="margin:8px 18px">Reset Graph</button>
    <button class="tree-btn tree-btn-danger sm" id="dfs-btn-clear" style="margin:8px 18px">Clear Graph</button>
    <div class="tree-status-bar">
      <div class="tree-status-title">STATUS</div>
      <div class="tree-stat-line1" id="dfs-stat1">Graph Ready</div>
      <div class="tree-stat-line2" id="dfs-stat2">Create graph, then add edges</div>
    </div>
  `;

  // Canvas area
  const canvasWrap = document.createElement('main');
  canvasWrap.className = 'tree-canvas-wrap';
  canvasWrap.innerHTML = `
    <canvas class="tree-canvas" id="dfs-canvas"></canvas>
    <div class="tree-live-stats">
      <div class="tree-ls-label">LIVE STATS</div>
      <div class="tree-ls-nodes" id="dfs-ls-nodes">Nodes: 0</div>
      <div class="tree-ls-edges" id="dfs-ls-edges">Edges: 0</div>
      <div class="tree-ls-dfs" id="dfs-ls-dfs">DFS: Not Started</div>
    </div>
    <div class="tree-hints">Click nodes to add edges &nbsp;|&nbsp; Drag to move &nbsp;|&nbsp; Scroll: Zoom &nbsp;|&nbsp; Right-click+Drag: Pan</div>
    <div class="tree-popup" id="dfs-popup" style="display:none">
      <span class="tree-popup-msg" id="dfs-popup-msg"></span>
      <div class="tree-popup-progress" id="dfs-popup-progress"></div>
    </div>
    <div class="tree-popup" id="dfs-export-popup" style="display:none;top:80px;max-width:400px;max-height:300px;overflow:auto">
      <span class="tree-popup-msg" id="dfs-export-msg"></span>
    </div>
  `;

  container.appendChild(panel);
  container.appendChild(canvasWrap);

  const canvas = canvasWrap.querySelector('#dfs-canvas');
  const ctx = canvas.getContext('2d');
  let speedIdx = 0;
  let destroyed = false;

  // Graph state
  const graph = {
    nodes: [],
    edges: [],
    edgeTypes: new Map(), // key: "from-to", value: 'tree'|'back'|'forward'
    directed: false,
    dragMode: 'edges',
    nodeCount: 0,
    pendingEdgeStart: null,
    dfsRunning: false,
    dfsStack: [],
    dfsVisited: new Set(),
    dfsPath: [],
    dfsCurrent: null,
    time: 0,
    discoveryTime: {},
    finishTime: {},
  };

  const cam = { x: 0, y: 0, zoom: 1, offsetX: 0, offsetY: 0 };
  let camReady = false;
  let isDragging = false, isPanning = false, dragStartX = 0, dragStartY = 0, lastClickTime = 0;
  let draggedNode = null, draggedNodeOffset = { x: 0, y: 0 };

  let popupTimer = 0, popupMaxT = 0;
  const popupEl = canvasWrap.querySelector('#dfs-popup');
  const popupMsg = canvasWrap.querySelector('#dfs-popup-msg');
  const popupProg = canvasWrap.querySelector('#dfs-popup-progress');

  function showPopup(msg, color, dur = 3.5) {
    popupMsg.textContent = msg;
    popupEl.style.setProperty('--popup-border', color);
    popupEl.style.borderColor = color;
    popupEl.style.display = 'block';
    popupEl.style.opacity = '1';
    popupProg.style.width = '100%';
    popupProg.style.background = color;
    popupTimer = dur; popupMaxT = dur;
  }

  function tickPopup(dt) {
    if (popupTimer <= 0) return;
    popupTimer = Math.max(0, popupTimer - dt);
    const frac = popupMaxT > 0 ? popupTimer / popupMaxT : 0;
    const fade = Math.min(1, popupTimer * 3);
    popupEl.style.opacity = fade.toFixed(3);
    popupProg.style.width = (frac * 100).toFixed(1) + '%';
    if (popupTimer <= 0) popupEl.style.display = 'none';
  }

  function setStatus(l1, l2) {
    panel.querySelector('#dfs-stat1').textContent = l1;
    panel.querySelector('#dfs-stat2').textContent = l2;
  }

  function updateLiveStats() {
    canvasWrap.querySelector('#dfs-ls-nodes').textContent = `Nodes: ${graph.nodes.length}`;
    canvasWrap.querySelector('#dfs-ls-edges').textContent = `Edges: ${graph.edges.length}`;
    canvasWrap.querySelector('#dfs-ls-dfs').textContent = graph.dfsRunning
      ? `DFS: ${graph.dfsCurrent !== null ? 'Running...' : 'Starting...'}`
      : 'DFS: Not Started';
  }

  function getT() {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    return isLight ? THEMES.light : THEMES.night;
  }

  function resizeCanvas() {
    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;
    ctx.scale(devicePixelRatio, devicePixelRatio);
    if (!camReady) resetCamera();
  }

  function resetCamera() {
    const W = canvas.clientWidth, H = canvas.clientHeight;
    cam.offsetX = W * 0.5; cam.offsetY = H * 0.5;
    cam.x = 0; cam.y = 0; cam.zoom = 1; camReady = true;
  }

  const onResize = () => { if (!destroyed) resizeCanvas(); };
  window.addEventListener('resize', onResize);
  resizeCanvas();

  // Graph operations
  function createGraph() {
    const count = parseInt(panel.querySelector('#dfs-node-count').value, 10);
    if (isNaN(count) || count < 3 || count > 20) {
      showPopup('Please enter 3-20 nodes', '#ff4b4b', 2);
      return;
    }
    graph.nodes = [];
    graph.edges = [];
    graph.edgeTypes = new Map();
    graph.nodeCount = count;
    graph.dfsRunning = false;
    graph.dfsStack = [];
    graph.dfsVisited = new Set();
    graph.dfsPath = [];
    graph.dfsCurrent = null;
    graph.pendingEdgeStart = null;
    graph.time = 0;
    graph.discoveryTime = {};
    graph.finishTime = {};

    const cx = 0, cy = 0, radius = Math.min(200, 60 + count * 15);
    for (let i = 0; i < count; i++) {
      const angle = (2 * Math.PI * i) / count - Math.PI / 2;
      graph.nodes.push({
        id: i,
        label: String(i),
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
        curX: cx + radius * Math.cos(angle),
        curY: cy + radius * Math.sin(angle),
        color: NODE_COLORS[i % NODE_COLORS.length],
        state: 'default',
        pulseTimer: 0,
        alpha: 0,
        discTime: null,
        finTime: null,
      });
    }

    graph.nodes.forEach(n => n.alpha = 0);
    showPopup(`Created graph with ${count} nodes`, '#48d782', 2);
    setStatus('Graph Created', 'Click nodes to add edges');
    canvasWrap.querySelector('#dfs-stack-display').textContent = '';
    canvasWrap.querySelector('#dfs-path-display').textContent = '';
  }

  function addEdge(fromId, toId) {
    if (fromId === toId) return;
    const exists = graph.edges.some(e =>
      (e.from === fromId && e.to === toId) ||
      (!graph.directed && e.from === toId && e.to === fromId)
    );
    if (exists) return;

    graph.edges.push({ from: fromId, to: toId });
    const label = graph.directed ? `${fromId}→${toId}` : `${fromId}–${toId}`;
    showPopup(`Added edge: ${label}`, '#5aa0ff', 2);
    setStatus('Edge Added', label);
  }

  function resetGraph() {
    graph.edges = [];
    graph.edgeTypes = new Map();
    graph.dfsRunning = false;
    graph.dfsStack = [];
    graph.dfsVisited = new Set();
    graph.dfsPath = [];
    graph.dfsCurrent = null;
    graph.pendingEdgeStart = null;
    graph.time = 0;
    graph.discoveryTime = {};
    graph.finishTime = {};
    graph.nodes.forEach(n => {
      n.state = 'default';
      n.pulseTimer = 0;
      n.discTime = null;
      n.finTime = null;
    });
    canvasWrap.querySelector('#dfs-stack-display').textContent = '';
    canvasWrap.querySelector('#dfs-path-display').textContent = '';
    showPopup('Graph reset', '#ff913c', 2);
    setStatus('Graph Reset', 'Ready for new edges');
  }

  function clearGraph() {
    graph.nodes = [];
    graph.edges = [];
    graph.edgeTypes = new Map();
    graph.nodeCount = 0;
    graph.dfsRunning = false;
    graph.dfsStack = [];
    graph.dfsVisited = new Set();
    graph.dfsPath = [];
    graph.dfsCurrent = null;
    graph.pendingEdgeStart = null;
    graph.time = 0;
    graph.discoveryTime = {};
    graph.finishTime = {};
    canvasWrap.querySelector('#dfs-stack-display').textContent = '';
    canvasWrap.querySelector('#dfs-path-display').textContent = '';
    canvasWrap.querySelector('#dfs-export-popup').style.display = 'none';
    showPopup('Graph cleared', '#ff4b4b', 2);
    setStatus('Graph Cleared', 'Create nodes to start');
  }

  function startDFS() {
    if (graph.nodes.length === 0) {
      showPopup('Create graph first!', '#ff4b4b', 2);
      return;
    }
    graph.dfsRunning = true;
    graph.dfsStack = [];
    graph.dfsVisited = new Set();
    graph.dfsPath = [];
    graph.dfsCurrent = null;
    graph.time = 0;
    graph.discoveryTime = {};
    graph.finishTime = {};
    graph.edgeTypes = new Map();
    graph.nodes.forEach(n => {
      n.state = 'default';
      n.discTime = null;
      n.finTime = null;
    });
    setStatus('DFS Mode', 'Click a node to start DFS');
    showPopup('Select START node for DFS', '#ff913c', 2.5);
  }

  function classifyEdge(fromId, toId) {
    if (!graph.dfsVisited.has(toId)) return 'tree';
    if (!graph.finishTime[toId]) return 'back';
    if (graph.discoveryTime[fromId] < graph.discoveryTime[toId]) return 'forward';
    return 'cross';
  }

  function getEdgeColor(type) {
    const T = getT();
    if (type === 'tree') return T.accent || '#5aa0ff';
    if (type === 'back') return '#ff4b4b';
    return '#48d782';
  }

  async function runDFS(startId) {
    const T = getT();
    const speed = SPEED_TABLE[speedIdx];

    graph.dfsStack = [startId];
    graph.dfsVisited = new Set([startId]);
    graph.dfsPath = [];
    graph.time = 0;
    graph.discoveryTime = {};
    graph.finishTime = {};

    graph.nodes[startId].state = 'visiting';
    graph.nodes[startId].pulseTimer = 1.5;
    graph.discoveryTime[startId] = ++graph.time;

    showPopup(`Starting DFS from node ${startId}`, T.accent, 2);
    setStatus(`DFS from ${startId}`, `Stack: [${startId}]`);
    canvasWrap.querySelector('#dfs-stack-display').textContent = `Stack: [${startId}]`;
    canvasWrap.querySelector('#dfs-path-display').textContent = `Visited: []`;

    await sleep(1200 / speed);

    while (graph.dfsStack.length > 0) {
      const current = graph.dfsStack[graph.dfsStack.length - 1];
      graph.dfsCurrent = current;
      graph.nodes[current].state = 'visited';

      // Check if we need to backtrack
      const neighbors = [];
      graph.edges.forEach(e => {
        if (e.from === current && !graph.dfsVisited.has(e.to)) {
          neighbors.push(e.to);
        }
        if (!graph.directed && e.to === current && !graph.dfsVisited.has(e.from)) {
          neighbors.push(e.from);
        }
      });

      if (neighbors.length > 0) {
        const next = neighbors[0];
        graph.dfsVisited.add(next);
        graph.discoveryTime[next] = ++graph.time;
        graph.dfsStack.push(next);
        graph.nodes[next].state = 'visiting';
        graph.nodes[next].pulseTimer = 1;

        // Classify edge
        const edgeType = classifyEdge(current, next);
        graph.edgeTypes.set(`${current}-${next}`, edgeType);

        const stackStr = '[' + graph.dfsStack.join(', ') + ']';
        const pathStr = '[' + graph.dfsPath.join(', ') + ']';
        setStatus(`Visiting node ${next}`, `Stack: ${stackStr}`);
        canvasWrap.querySelector('#dfs-stack-display').textContent = `Stack: ${stackStr}`;
        canvasWrap.querySelector('#dfs-path-display').textContent = `Visited: ${pathStr}`;

        showPopup(`Exploring ${next} via ${edgeType} edge`, getEdgeColor(edgeType), 1.5);
        await sleep(1000 / speed);
      } else {
        // Backtrack
        const popped = graph.dfsStack.pop();
        graph.finishTime[popped] = ++graph.time;
        graph.nodes[popped].state = 'visited';
        graph.nodes[popped].finTime = graph.finishTime[popped];
        graph.dfsPath.push(popped);

        const stackStr = '[' + graph.dfsStack.join(', ') + ']';
        const pathStr = '[' + graph.dfsPath.join(', ') + ']';
        setStatus(`Backtrack from ${popped}`, `Stack: ${stackStr}`);
        canvasWrap.querySelector('#dfs-stack-display').textContent = `Stack: ${stackStr}`;
        canvasWrap.querySelector('#dfs-path-display').textContent = `Visited: ${pathStr}`;

        showPopup(`Finished node ${popped} (time: ${graph.finishTime[popped]})`, T.accent2, 1);
        await sleep(800 / speed);
      }
    }

    graph.dfsRunning = false;
    graph.dfsCurrent = null;
    const pathStr = graph.dfsPath.join(' → ');
    showPopup(`DFS Complete! Path: ${pathStr}`, T.success, 4);
    setStatus('DFS Complete', `Visited ${graph.dfsPath.length} nodes`);
    canvasWrap.querySelector('#dfs-stack-display').textContent = '';
    canvasWrap.querySelector('#dfs-path-display').textContent = `Final: [${graph.dfsPath.join(', ')}] (d:${graph.discoveryTime[graph.dfsPath[0]]}, f:${graph.finishTime[graph.dfsPath[graph.dfsPath.length-1]]})`;
  }

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  function getAdjacencyList() {
    const adj = {};
    graph.nodes.forEach(n => { adj[n.id] = []; });
    graph.edges.forEach(e => {
      adj[e.from].push(e.to);
      if (!graph.directed) adj[e.to].push(e.from);
    });
    let result = 'Adjacency List:\n\n';
    Object.entries(adj).sort((a,b) => a[0]-b[0]).forEach(([k, v]) => {
      result += `Node ${k}: [${v.sort((a,b) => a-b).join(', ')}]\n`;
    });
    return result;
  }

  function getAdjacencyMatrix() {
    const n = graph.nodes.length;
    const matrix = Array(n).fill(null).map(() => Array(n).fill(0));
    graph.edges.forEach(e => {
      matrix[e.from][e.to] = 1;
      if (!graph.directed) matrix[e.to][e.from] = 1;
    });

    let result = 'Adjacency Matrix:\n\n   ';
    for (let i = 0; i < n; i++) result += ` ${i} `;
    result += '\n';
    for (let i = 0; i < n; i++) {
      result += ` ${i} `;
      for (let j = 0; j < n; j++) {
        result += ` ${matrix[i][j]} `;
      }
      result += '\n';
    }
    return result;
  }

  function showExportPopup(msg) {
    const exportPopup = canvasWrap.querySelector('#dfs-export-popup');
    canvasWrap.querySelector('#dfs-export-msg').textContent = msg;
    exportPopup.style.display = 'block';
    exportPopup.style.borderColor = 'var(--accent)';
    setTimeout(() => { exportPopup.style.display = 'none'; }, 8000);
  }

  // Event handlers - wrap in error checking
  const btnCreate = panel.querySelector('#dfs-btn-create');
  const btnReset = panel.querySelector('#dfs-btn-reset');
  const btnClear = panel.querySelector('#dfs-btn-clear');
  const btnStartDFS = panel.querySelector('#dfs-btn-start-dfs');
  const btnAdjList = panel.querySelector('#dfs-btn-adj-list');
  const btnAdjMatrix = panel.querySelector('#dfs-btn-adj-matrix');

  if (btnCreate) btnCreate.addEventListener('click', createGraph);
  if (btnReset) btnReset.addEventListener('click', resetGraph);
  if (btnClear) btnClear.addEventListener('click', clearGraph);
  if (btnStartDFS) btnStartDFS.addEventListener('click', startDFS);
  if (btnAdjList) btnAdjList.addEventListener('click', () => showExportPopup(getAdjacencyList()));
  if (btnAdjMatrix) btnAdjMatrix.addEventListener('click', () => showExportPopup(getAdjacencyMatrix()));

  panel.querySelectorAll('.tree-speed-btn[data-speed]').forEach(btn => {
    btn.addEventListener('click', () => {
      speedIdx = parseInt(btn.dataset.speed, 10);
      panel.querySelectorAll('.tree-speed-btn[data-speed]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  panel.querySelectorAll('.tree-speed-btn[data-dir]').forEach(btn => {
    btn.addEventListener('click', () => {
      graph.directed = btn.dataset.dir === 'directed';
      panel.querySelectorAll('.tree-speed-btn[data-dir]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      showPopup(graph.directed ? 'Directed edges' : 'Undirected edges', '#5aa0ff', 2);
    });
  });

  panel.querySelectorAll('.tree-speed-btn[data-drag]').forEach(btn => {
    btn.addEventListener('click', () => {
      graph.dragMode = btn.dataset.drag;
      panel.querySelectorAll('.tree-speed-btn[data-drag]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      showPopup(graph.dragMode === 'edges' ? 'Drag moves connected edges' : 'Drag moves node only', '#5aa0ff', 2);
    });
  });

  function getNodeAt(x, y) {
    const wx = (x - cam.offsetX) / cam.zoom + cam.x;
    const wy = (y - cam.offsetY) / cam.zoom + cam.y;
    for (const node of graph.nodes) {
      const dx = node.curX - wx;
      const dy = node.curY - wy;
      if (Math.sqrt(dx*dx + dy*dy) < NODE_R + 5) return node;
    }
    return null;
  }

  canvas.addEventListener('mousedown', (e) => {
    if (e.button === 1 || e.button === 2) { isPanning = true; dragStartX = e.clientX; dragStartY = e.clientY; }
    if (e.button === 0) {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      const node = getNodeAt(mx, my);
      if (node) {
        if (graph.dfsRunning) {
          if (!graph.dfsVisited.has(node.id)) {
            runDFS(node.id);
            return;
          }
          return; // Prevent edge creation while DFS is running
        }
        if (graph.pendingEdgeStart !== null) {
          if (graph.pendingEdgeStart !== node.id) {
            addEdge(graph.pendingEdgeStart, node.id);
            graph.pendingEdgeStart = null;
            graph.nodes.forEach(n => n.state = n.state === 'queued' ? 'default' : n.state);
          }
        } else {
          graph.pendingEdgeStart = node.id;
          node.state = 'queued';
          node.pulseTimer = 2;
          showPopup(`Selected node ${node.id} as source`, '#ff913c', 2);
          setStatus('Edge Mode', 'Click target node to add edge');
        }
        draggedNode = node;
        draggedNodeOffset.x = mx;
        draggedNodeOffset.y = my;
      } else {
        graph.pendingEdgeStart = null;
        graph.nodes.forEach(n => { if (n.state === 'queued') n.state = 'default'; });
      }
      const now = Date.now();
      if (now - lastClickTime < 320) resetCamera();
      lastClickTime = now;
    }
  });

  canvas.addEventListener('contextmenu', e => e.preventDefault());

  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    const wx = (mx - cam.offsetX) / cam.zoom + cam.x;
    const wy = (my - cam.offsetY) / cam.zoom + cam.y;
    const f = e.deltaY < 0 ? 1.12 : 1 / 1.12;
    cam.zoom = Math.max(0.08, Math.min(6, cam.zoom * f));
    cam.offsetX = mx - (wx - cam.x) * cam.zoom;
    cam.offsetY = my - (wy - cam.y) * cam.zoom;
  }, { passive: false });

  const onMouseMove = (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;

    if (isPanning) {
      cam.offsetX += e.clientX - dragStartX;
      cam.offsetY += e.clientY - dragStartY;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
    }
    if (draggedNode) {
      const wx = (mx - cam.offsetX) / cam.zoom + cam.x;
      const wy = (my - cam.offsetY) / cam.zoom + cam.y;
      if (graph.dragMode === 'edges') {
        const dx = wx - draggedNode.x;
        const dy = wy - draggedNode.y;
        draggedNode.x = wx;
        draggedNode.y = wy;
        draggedNode.curX = wx;
        draggedNode.curY = wy;
      } else {
        draggedNode.x = wx;
        draggedNode.y = wy;
        draggedNode.curX = wx;
        draggedNode.curY = wy;
      }
    }
  };
  const onMouseUp = () => { isPanning = false; draggedNode = null; };
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);

  // Render loop
  let lastTime = performance.now();
  let rafId = null;

  function loop(now) {
    if (destroyed) return;
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;
    tickPopup(dt);
    updateLiveStats();

    const W = canvas.clientWidth, H = canvas.clientHeight;
    const T = getT();
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = T.bg;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.translate(cam.offsetX, cam.offsetY);
    ctx.scale(cam.zoom, cam.zoom);
    ctx.translate(-cam.x, -cam.y);

    // Draw edges
    graph.edges.forEach(edge => {
      const fromNode = graph.nodes[edge.from];
      const toNode = graph.nodes[edge.to];
      if (!fromNode || !toNode) return;

      const alpha = Math.min(fromNode.alpha, toNode.alpha);
      const edgeType = graph.edgeTypes.get(`${edge.from}-${edge.to}`) || 'tree';
      const edgeColor = getEdgeColor(edgeType);

      ctx.beginPath();
      ctx.moveTo(fromNode.curX, fromNode.curY);
      ctx.lineTo(toNode.curX, toNode.curY);
      ctx.strokeStyle = colA(edgeColor, alpha * 0.8);
      ctx.lineWidth = 2;
      ctx.stroke();

      if (graph.directed) {
        const angle = Math.atan2(toNode.curY - fromNode.curY, toNode.curX - fromNode.curX);
        const ax = toNode.curX - NODE_R * Math.cos(angle);
        const ay = toNode.curY - NODE_R * Math.sin(angle);
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(ax - 10 * Math.cos(angle - Math.PI / 6), ay - 10 * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(ax - 10 * Math.cos(angle + Math.PI / 6), ay - 10 * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fillStyle = colA(edgeColor, alpha);
        ctx.fill();
      }
    });

    // Draw nodes
    graph.nodes.forEach(node => {
      if (node.alpha < 1) node.alpha = Math.min(1, node.alpha + dt * 2);
      if (node.pulseTimer > 0) node.pulseTimer -= dt;

      const cx = node.curX, cy = node.curY, a = node.alpha;

      if ((node.state === 'queued' || node.state === 'visiting') && node.pulseTimer > 0) {
        const p = Math.sin(node.pulseTimer * 8) * 0.5 + 0.5;
        ctx.beginPath(); ctx.arc(cx, cy, NODE_R + 10 * p, 0, Math.PI * 2);
        ctx.fillStyle = colA('#ffe628', p * 0.4 * a);
        ctx.fill();
      }

      ctx.beginPath(); ctx.arc(cx + 2, cy + 3, NODE_R, 0, Math.PI * 2);
      ctx.fillStyle = colA(T.nodeShadow || 'rgba(0,0,0,0.4)', a * 0.4);
      ctx.fill();

      let nodeColor = node.color;
      if (node.state === 'visited') nodeColor = '#48d782';
      else if (node.state === 'visiting') nodeColor = '#ff913c';
      else if (node.state === 'queued') nodeColor = '#ffc832';

      ctx.beginPath(); ctx.arc(cx, cy, NODE_R, 0, Math.PI * 2);
      ctx.fillStyle = colA(nodeColor, a);
      ctx.fill();

      if (node.id === graph.pendingEdgeStart) {
        ctx.beginPath(); ctx.arc(cx, cy, NODE_R + 5, 0, Math.PI * 2);
        ctx.strokeStyle = colA('#ff913c', a);
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.font = '700 14px JetBrains Mono';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = colA('#ffffff', a);
      ctx.fillText(node.label, cx, cy + 1);

      // Show discovery/finish times if DFS completed
      if (node.discTime !== null && node.finTime !== null) {
        ctx.font = '600 9px JetBrains Mono';
        ctx.fillStyle = colA(T.textDim || '#697698', a * 0.8);
        ctx.fillText(`d:${node.discTime},f:${node.finTime}`, cx, cy + NODE_R + 12);
      }
    });

    ctx.restore();
    rafId = requestAnimationFrame(loop);
  }
  rafId = requestAnimationFrame(loop);

  function destroy() {
    destroyed = true;
    if (rafId) cancelAnimationFrame(rafId);
    window.removeEventListener('resize', onResize);
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
    container.innerHTML = '';
  }

  return { graph, destroy, resetCamera };
}
