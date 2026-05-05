// ═══════════════════════════════════════════════════════════════════════════════
//  Tree Visualizer — Canvas + Events + Render Loop
//  STRICTLY PORTED from native BST.js (lines 526-866)
//  Attaches imperatively to a DOM container — zero React dependencies
// ═══════════════════════════════════════════════════════════════════════════════

import { BST, THEMES, SPEED_TABLE, drawTree } from './avlTree.js';

/**
 * Initialize the tree visualizer inside a container element.
 * @param {HTMLElement} container - DOM element to mount into
 * @returns {{ tree: BST, destroy: () => void, resetCamera: () => void }}
 */
export function initTreeVisualizer(container, type = 'avl') {
  const isBST = type === 'bst';
  const titleName = isBST ? 'Binary Search Tree' : 'AVL Tree';
  const readyMsg = isBST ? 'BST Ready' : 'AVL Tree Ready';

  // ── Build DOM ──────────────────────────────────────────────────────────
  container.innerHTML = '';
  container.style.display = 'flex';
  container.style.height = '100%';

  // Side panel
  const panel = document.createElement('aside');
  panel.className = 'tree-panel';
  panel.innerHTML = `
    <div class="tree-panel-title">
      <span class="tree-title-main">${titleName}</span>
      <span class="tree-title-sub">Visualizer</span>
      <span class="tree-title-edition">Educational Edition</span>
    </div>
    <hr class="tree-divider"/>
    <section class="tree-section">
      <div class="tree-section-label">NODE VALUE</div>
      <div class="tree-input-row"><input class="tree-val-input" id="tv-val-input" type="text" value="0" autocomplete="off" spellcheck="false"/></div>
      <div class="tree-tip">Tip: prefix with <kbd>-</kbd> for negatives</div>
      <button class="tree-btn tree-btn-accent" id="tv-btn-insert">Insert Node</button>
      <button class="tree-btn tree-btn-danger" id="tv-btn-delete">Delete Node</button>
      <button class="tree-btn tree-btn-danger-dim" id="tv-btn-clear">Clear Entire Tree</button>
    </section>
    <hr class="tree-divider"/>
    <section class="tree-section">
      <div class="tree-section-label">SEARCH</div>
      <div class="tree-btn-row-2">
        <button class="tree-btn tree-btn-orange sm" id="tv-btn-pred">Predecessor</button>
        <button class="tree-btn tree-btn-orange sm" id="tv-btn-succ">Successor</button>
      </div>
    </section>
    <hr class="tree-divider"/>
    <section class="tree-section">
      <div class="tree-section-label">TRAVERSALS</div>
      <button class="tree-btn tree-btn-ghost sm tv-trav-btn" data-trav="pre">Pre-Order (Root→L→R)</button>
      <button class="tree-btn tree-btn-ghost sm tv-trav-btn" data-trav="in">In-Order (Sorted)</button>
      <button class="tree-btn tree-btn-ghost sm tv-trav-btn" data-trav="post">Post-Order (L→R→Root)</button>
      <button class="tree-btn tree-btn-ghost sm tv-trav-btn" data-trav="bfs">Breadth-First (Levels)</button>
    </section>
    <hr class="tree-divider"/>
    <section class="tree-section">
      <div class="tree-section-label">RANDOM GENERATOR</div>
      <div class="tree-gen-row">
        <label>N =</label>
        <input class="tree-rand-input" id="tv-rand-input" type="number" min="1" max="99" value="12"/>
        <button class="tree-btn tree-btn-green sm" id="tv-btn-gen">Generate!</button>
      </div>
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
    <div class="tree-status-bar">
      <div class="tree-status-title">STATUS</div>
      <div class="tree-stat-line1" id="tv-stat1">${readyMsg}</div>
      <div class="tree-stat-line2" id="tv-stat2">Type a value and press Insert!</div>
    </div>
  `;

  // Canvas area
  const canvasWrap = document.createElement('main');
  canvasWrap.className = 'tree-canvas-wrap';
  canvasWrap.innerHTML = `
    <canvas class="tree-canvas" id="tv-canvas"></canvas>
    <div class="tree-live-stats">
      <div class="tree-ls-label">LIVE STATS</div>
      <div class="tree-ls-nodes" id="tv-ls-nodes">Nodes: 0</div>
      <div class="tree-ls-height" id="tv-ls-height">Height: 0</div>
      <div class="tree-ls-balance tree-ls-balanced" id="tv-ls-balance">Balanced ✓</div>
    </div>
    <div class="tree-depth-legend">
      <span class="tree-legend-label">Depth:</span>
      <span class="tree-legend-dot" style="background:#5aa0ff"></span>
      <span class="tree-legend-dot" style="background:#37be73"></span>
      <span class="tree-legend-dot" style="background:#ff913c"></span>
      <span class="tree-legend-dot" style="background:#b450f0"></span>
      <span class="tree-legend-dot" style="background:#f54b82"></span>
      <span class="tree-legend-dot" style="background:#2dc3c8"></span>
      <span class="tree-legend-dot" style="background:#e1c828"></span>
      <span class="tree-legend-dot" style="background:#8cd23c"></span>
    </div>
    <div class="tree-hints">Scroll: Zoom &nbsp;|&nbsp; Right-click+Drag: Pan &nbsp;|&nbsp; Double-click: Reset View &nbsp;|&nbsp; Enter: Insert</div>
    <div class="tree-trav-bar" id="tv-trav-bar" style="display:none">
      <span class="tree-trav-title" id="tv-trav-title"></span>
      <span class="tree-trav-result" id="tv-trav-result"></span>
    </div>
    <div class="tree-popup" id="tv-popup" style="display:none">
      <span class="tree-popup-msg" id="tv-popup-msg"></span>
      <div class="tree-popup-progress" id="tv-popup-progress"></div>
    </div>
  `;

  container.appendChild(panel);
  container.appendChild(canvasWrap);

  // ── References ─────────────────────────────────────────────────────────
  const canvas = canvasWrap.querySelector('#tv-canvas');
  const ctx = canvas.getContext('2d');
  const tree = new BST();
  tree.isAVL = !isBST;
  let speedIdx = 0;
  let destroyed = false;

  const cam = { x:0, y:0, zoom:1, offsetX:0, offsetY:0 };
  let camReady = false;
  let isDragging = false, dragStartX = 0, dragStartY = 0, lastClickTime = 0;

  // Popup state
  let popupTimer = 0, popupMaxT = 0;
  const popupEl = canvasWrap.querySelector('#tv-popup');
  const popupMsg = canvasWrap.querySelector('#tv-popup-msg');
  const popupProg = canvasWrap.querySelector('#tv-popup-progress');

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
    panel.querySelector('#tv-stat1').textContent = l1;
    panel.querySelector('#tv-stat2').textContent = l2;
  }

  function setTraversal(title, result) {
    const bar = canvasWrap.querySelector('#tv-trav-bar');
    if (!title) { bar.style.display = 'none'; return; }
    bar.style.display = 'flex';
    canvasWrap.querySelector('#tv-trav-title').textContent = title;
    canvasWrap.querySelector('#tv-trav-result').textContent = result;
  }

  function updateLiveStats() {
    const nc = tree.getNodeCount(), ht = tree.getTreeHeight();
    const bal = nc <= 1 || ht <= Math.ceil(1.45 * Math.log2(nc + 1) + 1.6);
    canvasWrap.querySelector('#tv-ls-nodes').textContent = `Nodes: ${nc}`;
    canvasWrap.querySelector('#tv-ls-height').textContent = `Height: ${ht}`;
    const balEl = canvasWrap.querySelector('#tv-ls-balance');
    if (!tree.isAVL) {
      balEl.textContent = 'Unbalanced Mode';
      balEl.className = 'tree-ls-balance';
      balEl.style.color = '#78829b';
    } else if (bal) { 
      balEl.textContent = 'Balanced ✓'; 
      balEl.className = 'tree-ls-balance tree-ls-balanced'; 
    } else { 
      balEl.textContent = 'Unbalanced!'; 
      balEl.className = 'tree-ls-balance tree-ls-unbalanced'; 
    }
  }

  // ── Canvas resize ──────────────────────────────────────────────────────
  function resizeCanvas() {
    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;
    ctx.scale(devicePixelRatio, devicePixelRatio);
    if (!camReady) resetCamera();
  }

  function resetCamera() {
    const W = canvas.clientWidth, H = canvas.clientHeight;
    cam.offsetX = W * 0.5; cam.offsetY = H * 0.35;
    cam.x = 0; cam.y = 0; cam.zoom = 1; camReady = true;
  }

  const onResize = () => { if (!destroyed) resizeCanvas(); };
  window.addEventListener('resize', onResize);
  resizeCanvas();

  // ── Input helpers ──────────────────────────────────────────────────────
  const valInput = panel.querySelector('#tv-val-input');
  const randInput = panel.querySelector('#tv-rand-input');
  function getVal() { const v = parseInt(valInput.value, 10); return isNaN(v) ? 0 : Math.max(-9999, Math.min(9999, v)); }

  // ── Actions ────────────────────────────────────────────────────────────
  function getT() {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    return isLight ? THEMES.light : THEMES.night;
  }

  function doInsert() {
    const val = getVal(); tree.searchPath = [];
    const T = getT();
    const rotMsg = tree.insertNode(val);
    let m = `Inserted: ${val}`; if (rotMsg) m += `  (${rotMsg})`;
    const statusDetail = tree.isAVL ? (rotMsg || 'No rotation needed') : 'Standard BST insert';
    showPopup(m, rotMsg ? T.accent2 : T.success);
    setStatus(`Inserted ${val}`, statusDetail);
    setTraversal('', '');
  }
  function doDelete() {
    const val = getVal(); tree.searchPath = [];
    const T = getT();
    const rotMsg = tree.deleteNode(val);
    let m = `Deleted: ${val}`; if (rotMsg) m += `  (${rotMsg})`;
    const statusDetail = tree.isAVL ? (rotMsg || 'No rotation needed') : 'Standard BST delete';
    showPopup(m, T.danger);
    setStatus(`Deleted ${val}`, statusDetail);
    setTraversal('', '');
  }
  function doClear() {
    tree.clearTree(); tree.searchPath = [];
    const T = getT();
    setTraversal('', ''); setStatus('Tree cleared', 'Start fresh!');
    showPopup('Tree cleared!', T.danger, 2);
  }
  function doPred() {
    const T = getT();
    const val = getVal(), pv = tree.getPredecessor(val);
    const m = pv !== null ? `Pred(${val}) = ${pv}` : `No predecessor for ${val}`;
    showPopup(m, T.accent2); setStatus(m, 'Path shown in yellow');
  }
  function doSucc() {
    const T = getT();
    const val = getVal(), sv = tree.getSuccessor(val);
    const m = sv !== null ? `Succ(${val}) = ${sv}` : `No successor for ${val}`;
    showPopup(m, T.accent2); setStatus(m, 'Path shown in yellow');
  }
  function doGenerate() {
    const T = getT();
    let count = parseInt(randInput.value, 10);
    if (isNaN(count) || count < 1) count = 1;
    if (count > 99) count = 99;
    tree.clearTree(); tree.searchPath = [];
    const used = new Set(); let ins = 0, att = 0;
    while (ins < count && att < count * 30) {
      const v = Math.floor(Math.random() * 199) - 99;
      if (!used.has(v)) { used.add(v); tree.insertNode(v); ins++; }
      att++;
    }
    showPopup(`Generated ${ins} random nodes!`, T.success);
    setStatus(`Random tree: ${ins} nodes`, 'Add / delete nodes freely!');
    setTraversal('', '');
  }

  // ── Event binding ──────────────────────────────────────────────────────
  valInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') doInsert(); });
  panel.querySelector('#tv-btn-insert').addEventListener('click', doInsert);
  panel.querySelector('#tv-btn-delete').addEventListener('click', doDelete);
  panel.querySelector('#tv-btn-clear').addEventListener('click', doClear);
  panel.querySelector('#tv-btn-pred').addEventListener('click', doPred);
  panel.querySelector('#tv-btn-succ').addEventListener('click', doSucc);
  panel.querySelector('#tv-btn-gen').addEventListener('click', doGenerate);



  panel.querySelectorAll('.tv-trav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const trav = btn.dataset.trav; let title, result;
      switch (trav) {
        case 'pre':  title = 'Pre-Order:';     result = tree.getPreOrderString();     break;
        case 'in':   title = 'In-Order:';      result = tree.getInOrderString();      break;
        case 'post': title = 'Post-Order:';    result = tree.getPostOrderString();    break;
        case 'bfs':  title = 'Breadth-First:'; result = tree.getBreadthFirstString(); break;
      }
      setTraversal(title, result);
    });
  });

  panel.querySelectorAll('.tree-speed-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      speedIdx = parseInt(btn.dataset.speed, 10);
      panel.querySelectorAll('.tree-speed-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // ── Canvas interactions ────────────────────────────────────────────────
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

  canvas.addEventListener('mousedown', (e) => {
    if (e.button === 1 || e.button === 2) { isDragging = true; dragStartX = e.clientX; dragStartY = e.clientY; }
    if (e.button === 0) { const now = Date.now(); if (now - lastClickTime < 320) resetCamera(); lastClickTime = now; }
  });
  canvas.addEventListener('contextmenu', e => e.preventDefault());

  const onMouseMove = (e) => {
    if (!isDragging) return;
    cam.offsetX += e.clientX - dragStartX; cam.offsetY += e.clientY - dragStartY;
    dragStartX = e.clientX; dragStartY = e.clientY;
  };
  const onMouseUp = () => { isDragging = false; };
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);

  // Touch
  let lastTouchDist = 0;
  canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchDist = Math.hypot(dx, dy);
    }
  }, { passive: true });
  canvas.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      cam.zoom = Math.max(0.08, Math.min(6, cam.zoom * (dist / (lastTouchDist || dist))));
      lastTouchDist = dist;
    }
  }, { passive: true });

  // ── Render loop ────────────────────────────────────────────────────────
  let lastTime = performance.now();
  let rafId = null;

  function loop(now) {
    if (destroyed) return;
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;
    tree.tickAnimations(dt, SPEED_TABLE[speedIdx]);
    tickPopup(dt);
    updateLiveStats();

    const W = canvas.clientWidth, H = canvas.clientHeight;
    const T = getT();
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = T.bg; ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.translate(cam.offsetX, cam.offsetY);
    ctx.scale(cam.zoom, cam.zoom);
    ctx.translate(-cam.x, -cam.y);
    drawTree(ctx, tree.root, 0, tree.searchPath, T);
    ctx.restore();

    rafId = requestAnimationFrame(loop);
  }
  rafId = requestAnimationFrame(loop);

  // ── Destroy (cleanup for React useEffect) ──────────────────────────────
  function destroy() {
    destroyed = true;
    if (rafId) cancelAnimationFrame(rafId);
    window.removeEventListener('resize', onResize);
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
    container.innerHTML = '';
  }

  return { tree, destroy, resetCamera };
}
