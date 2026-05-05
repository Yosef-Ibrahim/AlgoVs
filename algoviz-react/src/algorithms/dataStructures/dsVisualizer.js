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

  // Bind Engine Events
  dsEngine.bindEvents(panel, showPopup, THEMES.night);

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
    // Draw background grid if light mode maybe?
    // Let's just keep it simple.

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
    window.removeEventListener('resize', onResize);
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
    container.innerHTML = '';
  }

  return { destroy, resetCamera };
}
