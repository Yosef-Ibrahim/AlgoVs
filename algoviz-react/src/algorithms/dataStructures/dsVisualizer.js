import { ArrayDS } from './ArrayDS.js';
import { StackDS } from './StackDS.js';
import { QueueDS } from './QueueDS.js';
import { LinkedListDS } from './LinkedListDS.js';

const THEMES = {
  night: {
    bg: '#1e1e2e',
    nodeBg: '#2a2a3f',
    nodeBorder: '#6c63ff',
    nodeText: '#ffffff',
    highlight: '#ff6584',
    accent: '#22c55e',
    pointer: '#8888aa',
  },
  light: {
    bg: '#f8f8fc',
    nodeBg: '#ffffff',
    nodeBorder: '#8080c0',
    nodeText: '#1a1a2e',
    highlight: '#ff6584',
    accent: '#10b981',
    pointer: '#6666aa',
  }
};

const SPEED_TABLE = [0.5, 1.0, 2.0];

export function initDSVisualizer(container, type) {
  container.innerHTML = '';
  container.style.display = 'flex';
  container.style.height = '100%';

  // 1. Create Data Structure Engine
  let dsEngine = null;
  let titleMain = 'Data Structure';
  let titleSub = 'Visualizer';

  switch (type) {
    case 'stack':
      titleMain = 'Stack';
      dsEngine = new StackDS();
      break;
    case 'queue':
      titleMain = 'Queue';
      dsEngine = new QueueDS();
      break;
    case 'singly-ll':
    case 'doubly-ll':
    case 'circular-ll':
    case 'ordered-ll':
    case 'linkedlist':
    case 'linked-list':
      titleMain = 'Linked List';
      dsEngine = new LinkedListDS();
      if (type.includes('doubly')) dsEngine.type = 'doubly';
      else if (type.includes('circular')) dsEngine.type = 'circular';
      else if (type.includes('ordered')) dsEngine.type = 'ordered';
      else dsEngine.type = 'singly';
      break;
    case 'array':
    default:
      titleMain = 'Array';
      dsEngine = new ArrayDS();
      break;
  }

  // 2. Build Control Panel
  const panel = document.createElement('aside');
  panel.className = 'ds-panel';
  
  // Base panel structure
  panel.innerHTML = `
    <div class="ds-panel-title">
      <span class="ds-title-main">${titleMain}</span>
      <span class="ds-title-sub">${titleSub}</span>
    </div>
    <hr class="ds-divider"/>
    <div id="ds-controls-container"></div>
    <hr class="ds-divider"/>
    <section class="ds-section">
      <button class="ds-btn ds-btn-ghost" id="ds-btn-clear" style="width:100%;">
        <span style="font-size:16px;">🗑️</span> Clear All
      </button>
    </section>
    <hr class="ds-divider"/>
    <section class="ds-section">
      <div class="ds-section-label">CODE TRACE</div>
      <div class="ds-toggle-row">
        <span class="ds-toggle-label">Step-by-step tracing</span>
        <label class="ds-toggle">
          <input type="checkbox" id="ds-trace-toggle" checked />
          <span class="ds-toggle-slider"></span>
        </label>
      </div>
    </section>
    <hr class="ds-divider"/>
    <section class="ds-section">
      <div class="ds-section-label">ANIMATION SPEED</div>
      <div class="ds-speed-row">
        <button class="ds-speed-btn" data-speed="0">Slow</button>
        <button class="ds-speed-btn active" data-speed="1">Normal</button>
        <button class="ds-speed-btn" data-speed="2">Fast</button>
      </div>
    </section>
  `;

  // Inject specific controls based on engine
  const controlsContainer = panel.querySelector('#ds-controls-container');
  controlsContainer.innerHTML = dsEngine.getHTMLControls();

  // 3. Build Canvas Area
  const canvasWrap = document.createElement('main');
  canvasWrap.className = 'ds-canvas-wrap';
  canvasWrap.innerHTML = `
    <canvas class="ds-canvas" id="ds-canvas"></canvas>
    <div class="ds-live-stats" id="ds-live-stats">
      <div class="ds-ls-label">LIVE STATS</div>
      <div class="ds-ls-item" id="ds-ls-size">Size: 0</div>
    </div>
    <div class="ds-hints">Scroll: Zoom &nbsp;|&nbsp; Right-click+Drag: Pan &nbsp;|&nbsp; Double-click: Reset View</div>
    <div class="ds-popup hidden" id="ds-popup">
      <span class="ds-popup-msg" id="ds-popup-msg"></span>
      <div class="ds-popup-progress" id="ds-popup-progress"></div>
    </div>
    <div class="ds-code-panel" id="ds-code-panel">
      <div class="ds-code-header">
        <span class="ds-code-title">⟨/⟩ Code Trace</span>
        <div style="display:flex;align-items:center;gap:8px;">
          <div class="ds-code-lang-bar" id="ds-code-lang-bar">
            <button class="ds-code-lang-btn active" data-lang="js">JS</button>
            <button class="ds-code-lang-btn" data-lang="python">Python</button>
          </div>
          <button class="ds-code-close-btn" id="ds-code-close" title="Close">✕</button>
        </div>
      </div>
      <div class="ds-code-progress-wrap"><div class="ds-code-progress-bar" id="ds-code-progress"></div></div>
      <div class="ds-code-step-msg" id="ds-code-step-msg">Perform an operation to see code trace</div>
      <pre class="ds-code-pre"><code id="ds-code-lines"></code></pre>
    </div>
  `;

  container.appendChild(panel);
  container.appendChild(canvasWrap);

  // 4. State & References
  const canvas = canvasWrap.querySelector('#ds-canvas');
  const ctx = canvas.getContext('2d');
  let speedIdx = 1;
  let destroyed = false;

  const cam = { x: 0, y: 0, zoom: 1, offsetX: 0, offsetY: 0 };
  let camReady = false;
  let isDragging = false, dragStartX = 0, dragStartY = 0, lastClickTime = 0;

  // Popup state
  let popupTimer = 0, popupMaxT = 0;
  const popupEl = canvasWrap.querySelector('#ds-popup');
  const popupMsg = canvasWrap.querySelector('#ds-popup-msg');
  const popupProg = canvasWrap.querySelector('#ds-popup-progress');

  function showPopup(msg, color, dur = 3.0) {
    popupMsg.textContent = msg;
    popupEl.style.setProperty('--popup-border', color);
    popupEl.classList.remove('hidden');
    popupTimer = dur; 
    popupMaxT = dur;
  }

  function tickPopup(dt) {
    if (popupTimer <= 0) return;
    popupTimer = Math.max(0, popupTimer - dt);
    const frac = popupMaxT > 0 ? popupTimer / popupMaxT : 0;
    popupProg.style.transform = `scaleX(${frac})`;
    if (popupTimer <= 0) popupEl.classList.add('hidden');
  }

  function updateLiveStats() {
    const size = dsEngine.getSize();
    canvasWrap.querySelector('#ds-ls-size').textContent = `Size: ${size}`;
  }

  // ── Code Panel Logic ────────────────────────────────────────────────────
  const codeLinesEl = canvasWrap.querySelector('#ds-code-lines');
  const codeStepMsgEl = canvasWrap.querySelector('#ds-code-step-msg');
  const codeLangBar = canvasWrap.querySelector('#ds-code-lang-bar');
  const codeProgressBar = canvasWrap.querySelector('#ds-code-progress');
  const codePanel = canvasWrap.querySelector('#ds-code-panel');
  const codeCloseBtn = canvasWrap.querySelector('#ds-code-close');
  let currentLang = 'js';
  let currentCodeSnippet = null;  // { js: [...], python: [...] }
  let currentSteps = null;        // [{ line, msg, action? }, ...]
  let stepRunnerTimer = null;
  let currentStepIdx = -1;
  let traceEnabled = true;

  // Trace toggle
  const traceToggle = panel.querySelector('#ds-trace-toggle');
  traceToggle.addEventListener('change', () => {
    traceEnabled = traceToggle.checked;
    if (!traceEnabled) {
      // Stop any running trace and hide the panel
      if (stepRunnerTimer) clearTimeout(stepRunnerTimer);
      codePanel.classList.remove('visible');
    }
  });

  // Close button on code panel
  codeCloseBtn.addEventListener('click', () => {
    if (stepRunnerTimer) clearTimeout(stepRunnerTimer);
    codePanel.classList.remove('visible');
  });

  // Language switcher
  codeLangBar.querySelectorAll('.ds-code-lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentLang = btn.dataset.lang;
      codeLangBar.querySelectorAll('.ds-code-lang-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (currentCodeSnippet) renderCodeLines(currentCodeSnippet, currentStepIdx);
    });
  });

  function renderCodeLines(codeObj, activeLineIdx = -1) {
    if (!codeObj) { codeLinesEl.innerHTML = ''; return; }
    const lines = codeObj[currentLang] || codeObj.js || [];
    codeLinesEl.innerHTML = lines.map((line, idx) => {
      const isPast = idx < activeLineIdx;
      const isActive = idx === activeLineIdx;
      let cls = 'ds-cline';
      if (isActive) cls += ' active';
      else if (isPast) cls += ' visited';
      return `<div class="${cls}">` +
             `<span class="ds-cline-num">${idx + 1}</span>` +
             `<span class="ds-cline-text">${escapeHtml(line)}</span>` +
             (isActive ? '<span class="ds-cline-cursor"></span>' : '') +
             `</div>`;
    }).join('');

    // Auto-scroll active line into view
    if (activeLineIdx >= 0) {
      const activeLine = codeLinesEl.querySelector('.ds-cline.active');
      if (activeLine) activeLine.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  function escapeHtml(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function updateProgress(current, total) {
    const pct = total > 0 ? ((current + 1) / total) * 100 : 0;
    codeProgressBar.style.width = pct + '%';
  }

  /**
   * runSteps — the core step-by-step code tracer.
   * @param {Object} codeObj  - { js: string[], python: string[] }
   * @param {Array}  steps    - [{ line: number, msg: string, action?: Function }]
   */
  function runSteps(codeObj, steps) {
    // If tracing is disabled, just run all actions instantly
    if (!traceEnabled) {
      steps.forEach(s => { if (s.action) s.action(); });
      return;
    }

    // Cancel any running step sequence
    if (stepRunnerTimer) clearTimeout(stepRunnerTimer);
    currentCodeSnippet = codeObj;
    currentSteps = steps;
    currentStepIdx = -1;

    // Show the code panel with animation
    codePanel.classList.add('visible');
    codeProgressBar.style.width = '0%';

    renderCodeLines(codeObj, -1);
    codeStepMsgEl.textContent = '▶ Running...';
    codeStepMsgEl.classList.remove('done');

    const delayMs = [1400, 800, 400][speedIdx] || 800;

    function nextStep() {
      currentStepIdx++;
      if (currentStepIdx >= steps.length) {
        updateProgress(currentStepIdx, steps.length);
        codeStepMsgEl.textContent = '✓ Complete';
        codeStepMsgEl.classList.add('done');
        return;
      }

      const step = steps[currentStepIdx];
      updateProgress(currentStepIdx, steps.length);
      renderCodeLines(codeObj, step.line);
      codeStepMsgEl.textContent = step.msg;

      if (step.action) step.action();

      stepRunnerTimer = setTimeout(nextStep, delayMs);
    }

    stepRunnerTimer = setTimeout(nextStep, 350);
  }

  // 5. Canvas Resize & Camera
  function resizeCanvas() {
    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;
    ctx.scale(devicePixelRatio, devicePixelRatio);
    if (!camReady) resetCamera();
  }

  function resetCamera() {
    const W = canvas.clientWidth, H = canvas.clientHeight;
    cam.offsetX = W * 0.5;
    cam.offsetY = H * 0.5; // Center by default
    cam.x = 0; cam.y = 0; cam.zoom = 1; 
    camReady = true;
  }

  const onResize = () => { if (!destroyed) resizeCanvas(); };
  window.addEventListener('resize', onResize);
  resizeCanvas();

  // 6. Bind Common Events
  panel.querySelectorAll('.ds-speed-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      speedIdx = parseInt(btn.dataset.speed, 10);
      panel.querySelectorAll('.ds-speed-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Clear All button
  panel.querySelector('#ds-btn-clear').addEventListener('click', () => {
    if (stepRunnerTimer) clearTimeout(stepRunnerTimer);
    dsEngine.clear();
    showPopup('Cleared all elements', '#f59e0b');
  });

  // Bind Engine Events (pass runSteps as 4th argument)
  dsEngine.bindEvents(panel, showPopup, THEMES.night, runSteps);

  // 7. Camera Interactions
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    const wx = (mx - cam.offsetX) / cam.zoom + cam.x;
    const wy = (my - cam.offsetY) / cam.zoom + cam.y;
    const f = e.deltaY < 0 ? 1.12 : 1 / 1.12;
    cam.zoom = Math.max(0.1, Math.min(5, cam.zoom * f));
    cam.offsetX = mx - (wx - cam.x) * cam.zoom;
    cam.offsetY = my - (wy - cam.y) * cam.zoom;
  }, { passive: false });

  canvas.addEventListener('mousedown', (e) => {
    if (e.button === 1 || e.button === 2 || e.button === 0) { 
      isDragging = true; dragStartX = e.clientX; dragStartY = e.clientY; 
    }
    if (e.button === 0) { 
      const now = Date.now(); 
      if (now - lastClickTime < 300) resetCamera(); 
      lastClickTime = now; 
    }
  });
  canvas.addEventListener('contextmenu', e => e.preventDefault());

  const onMouseMove = (e) => {
    if (!isDragging) return;
    cam.offsetX += e.clientX - dragStartX; 
    cam.offsetY += e.clientY - dragStartY;
    dragStartX = e.clientX; dragStartY = e.clientY;
  };
  const onMouseUp = () => { isDragging = false; };
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);

  // 8. Render Loop
  let lastTime = performance.now();
  let rafId = null;

  function loop(now) {
    if (destroyed) return;
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    dsEngine.tick(dt, SPEED_TABLE[speedIdx]);
    tickPopup(dt);
    updateLiveStats();

    const W = canvas.clientWidth, H = canvas.clientHeight;
    ctx.clearRect(0, 0, W, H);

    ctx.save();
    ctx.translate(cam.offsetX, cam.offsetY);
    ctx.scale(cam.zoom, cam.zoom);
    ctx.translate(-cam.x, -cam.y);
    
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    const T = isLight ? THEMES.light : THEMES.night;
    
    dsEngine.draw(ctx, T);
    
    ctx.restore();

    rafId = requestAnimationFrame(loop);
  }
  rafId = requestAnimationFrame(loop);

  function destroy() {
    destroyed = true;
    if (rafId) cancelAnimationFrame(rafId);
    if (stepRunnerTimer) clearTimeout(stepRunnerTimer);
    window.removeEventListener('resize', onResize);
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
    container.innerHTML = '';
  }

  return { destroy, resetCamera };
}
