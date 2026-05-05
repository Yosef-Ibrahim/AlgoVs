let canvas, ctx;
let state = { speed: 5, steps: [], array: [], algo: 'bubble' };
let _anim = { active: false, offsets: {} };
let sortViewMode = 'bars';

function _animReset() { _anim.active = false; _anim.offsets = {}; if (_anim.rafId) cancelAnimationFrame(_anim.rafId); _anim.rafId = null; }
function _easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
function _easeInOutCubic(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
function _easeOutBack(t) { const c1 = 1.70158; const c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); }
function setDsScroll(val) {
  if (!canvas || !canvas.parentElement) return;
  const panel = canvas.parentElement;
  if (val) {
    panel.style.overflowX = 'auto';
    panel.style.overflowY = 'auto';
    canvas.style.width = canvas.width + 'px';
    canvas.style.height = canvas.height + 'px';
  } else {
    canvas.style.width = '100%';
    canvas.style.height = '100%';
  }
}

function _getElementX(idx, arr) {
  const panelW = canvas.clientWidth;
  const n = arr.length;
  if (sortViewMode === 'cells') {
    const cellW = 52, gap = 4;
    const startX = 16;
    return startX + idx * (cellW + gap);
  } else {
    const gap = n > 60 ? 1 : n > 40 ? 1 : 2;
    const barW = Math.max(2, Math.floor((panelW - 20) / n) - gap);
    const totalW = n * (barW + gap) - gap;
    const startX = Math.max(4, (panelW - totalW) / 2);
    return startX + idx * (barW + gap);
  }
}

function getStepColor(i, step) {
  if (!step) return null;
  if (step.found && step.found.includes(i)) return '#ffd166';
  if (step.swap && step.swap.includes(i)) return '#22c55e';
  if (step.compare && step.compare.includes(i)) return '#ff6584';
  if (step.current && step.current.includes(i)) return '#f7c59f';
  if (step.sorted && step.sorted.includes(i)) return '#6c63ff';
  return null;
}

function _animateCompare(stepIdx, callback) {
  const step = state.steps[stepIdx];
  if (!step || !step.compare || step.compare.length === 0) {
    if (callback) callback();
    return;
  }
  _animReset();
  _anim.active = true;
  _anim.type = 'compare';
  _anim.indices = step.compare.filter(i => i >= 0);
  if (_anim.indices.length === 0) { _animReset(); if (callback) callback(); return; }
  _anim.onComplete = callback;
  const speed = state.speed;
  // SLOWER: base 750ms, floor 220ms
  _anim.duration = Math.max(380, 1100 - speed * 72);
  _anim.startTime = performance.now();

  function frame(now) {
    const elapsed = now - _anim.startTime;
    const t = Math.min(1, elapsed / _anim.duration);
    const scale = 1 + 0.04 * Math.sin(t * Math.PI);   // very subtle scale — barely perceptible
    const glow  = 10 * Math.sin(t * Math.PI);           // soft glow only
    const dy    = -2 * Math.sin(t * Math.PI);           // 2px lift — just enough to notice

    _anim.offsets = {};
    _anim.indices.forEach(i => {
      _anim.offsets[i] = { dx: 0, dy, scale, glow, glowColor: '#ff6584' };
    });
    drawStep(stepIdx);

    if (t < 1) {
      _anim.rafId = requestAnimationFrame(frame);
    } else {
      const cb = _anim.onComplete; // save before clearing
      _anim.offsets = {};
      _anim.active = false;
      _anim.onComplete = null;
      drawStep(stepIdx);
      if (cb) cb();
    }
  }
  _anim.rafId = requestAnimationFrame(frame);
}

function _animateSwap(stepIdx, prevStepIdx, callback) {
  const step = state.steps[stepIdx];
  if (!step || !step.swap || step.swap.length < 2) {
    if (callback) callback();
    return;
  }
  _animReset();
  _anim.active = true;
  _anim.type = 'swap';
  const [si, sj] = step.swap;
  _anim.indices = [si, sj];
  _anim.onComplete = callback;
  const speed = state.speed;
  // SLOWER: base 1050ms, floor 320ms
  const totalDuration = Math.max(500, 1600 - speed * 110);
  _anim.duration = totalDuration;
  _anim.startTime = performance.now();

  // slideDistance = pixel gap between positions si and sj
  const arr = step.arr;
  const posI = _getElementX(si, arr);
  const posJ = _getElementX(sj, arr);
  const slideDistance = posJ - posI; // positive when sj is to the right of si

  // At t=0 offsets start at full displacement (pre-swap visual), at t=1 offsets are 0 (post-swap).
  // arr[si] came from sj → at t=0 it should appear at sj → dx = +slideDistance
  // arr[sj] came from si → at t=0 it should appear at si → dx = -slideDistance
  function frame(now) {
    const elapsed = now - _anim.startTime;
    const t = Math.min(1, elapsed / totalDuration);

    // 3-phase: lift (0→0.2), slide (0.2→0.8), drop (0.8→1.0)
    let dxI, dxJ, dyI, dyJ, scI, scJ, glI, glJ;

    if (t < 0.2) {
      // Phase 1: slight lift only
      const pt = _easeOutCubic(t / 0.2);
      dxI = slideDistance;
      dxJ = -slideDistance;
      dyI = -5 * pt;
      dyJ = -5 * pt;
      scI = 1 + 0.03 * pt;
      scJ = 1 + 0.03 * pt;
      glI = 10 * pt;
      glJ = 10 * pt;
    } else if (t < 0.8) {
      // Phase 2: slide — main visual
      const pt = _easeInOutCubic((t - 0.2) / 0.6);
      dxI = slideDistance * (1 - pt);
      dxJ = -slideDistance * (1 - pt);
      dyI = -5;
      dyJ = -5;
      scI = 1.03;
      scJ = 1.03;
      glI = 10;
      glJ = 10;
    } else {
      // Phase 3: settle back down
      const pt = _easeOutBack((t - 0.8) / 0.2);
      dxI = 0;
      dxJ = 0;
      dyI = -5 * (1 - pt);
      dyJ = -5 * (1 - pt);
      scI = 1 + 0.03 * (1 - pt);
      scJ = 1 + 0.03 * (1 - pt);
      glI = 10 * (1 - pt);
      glJ = 10 * (1 - pt);
    }

    _anim.offsets = {};
    _anim.offsets[si] = { dx: dxI, dy: dyI, scale: scI, glow: glI, glowColor: '#22c55e' };
    _anim.offsets[sj] = { dx: dxJ, dy: dyJ, scale: scJ, glow: glJ, glowColor: '#22c55e' };
    drawStep(stepIdx);

    if (t < 1) {
      _anim.rafId = requestAnimationFrame(frame);
    } else {
      const cb = _anim.onComplete;
      _anim.offsets = {};
      _anim.active = false;
      _anim.onComplete = null;
      drawStep(stepIdx);
      if (cb) cb();
    }
  }
  _anim.rafId = requestAnimationFrame(frame);
}

function _animateSorted(stepIdx, callback) {
  const step = state.steps[stepIdx];
  if (!step) { if (callback) callback(); return; }
  const prevStep = stepIdx > 0 ? state.steps[stepIdx - 1] : null;
  const prevSorted = (prevStep && prevStep.sorted) ? prevStep.sorted : [];
  const currSorted = step.sorted || [];
  const newlySorted = currSorted.filter(i => !prevSorted.includes(i));

  if (newlySorted.length === 0 || newlySorted.length > 10) {
    if (callback) callback();
    return;
  }

  _animReset();
  _anim.active = true;
  _anim.type = 'sorted';
  _anim.indices = newlySorted;
  _anim.onComplete = callback;
  const speed = state.speed;
  // SLOWER: base 520ms, floor 180ms
  _anim.duration = Math.max(300, 800 - speed * 50);
  _anim.startTime = performance.now();

  function frame(now) {
    const elapsed = now - _anim.startTime;
    const t = Math.min(1, elapsed / _anim.duration);
    const bounce = 1 + 0.15 * Math.sin(t * Math.PI);
    const glow = 20 * Math.sin(t * Math.PI);

    _anim.offsets = {};
    newlySorted.forEach(i => {
      _anim.offsets[i] = { dx: 0, dy: -4 * Math.sin(t * Math.PI), scale: bounce, glow, glowColor: '#6c63ff' };
    });
    drawStep(stepIdx);

    if (t < 1) {
      _anim.rafId = requestAnimationFrame(frame);
    } else {
      const cb = _anim.onComplete;
      _anim.offsets = {};
      _anim.active = false;
      _anim.onComplete = null;
      drawStep(stepIdx);
      if (cb) cb();
    }
  }
  _anim.rafId = requestAnimationFrame(frame);
}

function _animateFound(stepIdx, callback) {
  const step = state.steps[stepIdx];
  if (!step || !step.found) { if (callback) callback(); return; }

  _animReset();
  _anim.active = true;
  _anim.type = 'found';
  _anim.indices = step.found;
  _anim.onComplete = callback;
  const speed = state.speed;
  // SLOWER: base 850ms, floor 320ms
  _anim.duration = Math.max(450, 1200 - speed * 75);
  _anim.startTime = performance.now();

  function frame(now) {
    const elapsed = now - _anim.startTime;
    const t = Math.min(1, elapsed / _anim.duration);
    const pulse = 1 + 0.25 * Math.sin(t * Math.PI * 2);
    const glow = 30 * Math.sin(t * Math.PI);

    _anim.offsets = {};
    _anim.indices.forEach(i => {
      _anim.offsets[i] = { dx: 0, dy: -6 * Math.sin(t * Math.PI), scale: pulse, glow, glowColor: '#ffd166' };
    });
    drawStep(stepIdx);

    if (t < 1) {
      _anim.rafId = requestAnimationFrame(frame);
    } else {
      const cb = _anim.onComplete;
      _anim.offsets = {};
      _anim.active = false;
      _anim.onComplete = null;
      drawStep(stepIdx);
      if (cb) cb();
    }
  }
  _anim.rafId = requestAnimationFrame(frame);
}

function _animateCurrent(stepIdx, callback) {
  const step = state.steps[stepIdx];
  if (!step || !step.current || step.current.length === 0) {
    if (callback) callback();
    return;
  }
  _animReset();
  _anim.active = true;
  _anim.type = 'current';
  _anim.indices = step.current.filter(i => i >= 0);
  if (_anim.indices.length === 0) { _animReset(); if (callback) callback(); return; }
  _anim.onComplete = callback;
  const speed = state.speed;
  // Shorter than compare — just a gentle highlight
  _anim.duration = Math.max(260, 700 - speed * 44);
  _anim.startTime = performance.now();

  function frame(now) {
    const elapsed = now - _anim.startTime;
    const t = Math.min(1, elapsed / _anim.duration);
    const scale = 1 + 0.1 * Math.sin(t * Math.PI);
    const glow = 12 * Math.sin(t * Math.PI);

    _anim.offsets = {};
    _anim.indices.forEach(i => {
      _anim.offsets[i] = { dx: 0, dy: -3 * Math.sin(t * Math.PI), scale, glow, glowColor: '#f7c59f' };
    });
    drawStep(stepIdx);

    if (t < 1) {
      _anim.rafId = requestAnimationFrame(frame);
    } else {
      const cb = _anim.onComplete;
      _anim.offsets = {};
      _anim.active = false;
      _anim.onComplete = null;
      drawStep(stepIdx);
      if (cb) cb();
    }
  }
  _anim.rafId = requestAnimationFrame(frame);
}

function _animateStep(stepIdx, callback) {
  const step = state.steps[stepIdx];
  if (!step) { if (callback) callback(); return; }

  if (step.radixStep || step.multiArray || step.quickPartition) {
    _animReset();
    _anim.active = true;
    _anim.type = 'static';
    _anim.onComplete = callback;
    const speed = state.speed;
    _anim.duration = Math.max(300, 800 - speed * 50);
    _anim.startTime = performance.now();
    
    function frame(now) {
      const elapsed = now - _anim.startTime;
      const t = Math.min(1, elapsed / _anim.duration);
      drawStep(stepIdx);
      if (t < 1) {
        _anim.rafId = requestAnimationFrame(frame);
      } else {
        const cb = _anim.onComplete;
        _anim.active = false;
        _anim.onComplete = null;
        if (cb) cb();
      }
    }
    _anim.rafId = requestAnimationFrame(frame);
    return;
  }

  // Priority: found > swap > compare > current > sorted
  if (step.found && step.found.length > 0) {
    _animateFound(stepIdx, callback);
  } else if (step.swap && step.swap.length >= 2) {
    _animateSwap(stepIdx, stepIdx > 0 ? stepIdx - 1 : -1, callback);
  } else if (step.compare && step.compare.length > 0 && step.compare.some(c => c >= 0)) {
    _animateCompare(stepIdx, callback);
  } else if (step.current && step.current.length > 0 && step.current.some(c => c >= 0)) {
    _animateCurrent(stepIdx, callback);
  } else if (step.sorted && step.sorted.length > 0) {
    _animateSorted(stepIdx, callback);
  } else {
    if (callback) callback();
  }
}

function drawStep(idx) {
  const isSortingMode = ['bubble','selection','insertion','merge','quick','heap','counting','radix',
    'linear-search','binary-search','jump-search'].includes(state.algo);

  const panel = canvas.parentElement;
  const panelW = panel ? panel.clientWidth : 600;
  const panelH = panel ? panel.clientHeight : 300;

  const step = idx >= 0 && state.steps[idx] ? state.steps[idx] : null;
  const arr  = (step && step.arr) ? step.arr : state.array;
  if (!arr || arr.length === 0) {
    canvas.width  = panelW;
    canvas.height = panelH;
    setDsScroll(false);
    ctx.clearRect(0, 0, panelW, panelH);
    return;
  }

  // EDIT 3: Tells the animation engine to use your Buckets drawer, not the standard bars!
  if (state.algo === 'radix' || (step && step.radixStep)) {
    if (typeof drawRadixStep === 'function') {
      drawRadixStep(step || { arr: [...arr], buckets: [], comp: [], swap: [], sorted: [] });
    }
    return; // Stops here so it doesn't accidentally try to draw normal bars!
  }

  if (state.algo === 'counting' || (step && step.multiArray)) {
    if (typeof drawMultiArray === 'function') {
      let cArr = [], oArr = [];
      if (!step && arr && arr.length > 0) {
        const nums = arr.map(n => Number(n) || 0);
        const max = Math.max(...nums);
        cArr = new Array(max + 1).fill(null);
        oArr = new Array(arr.length).fill(null);
      } else if (!step) {
        cArr = [];
        oArr = [];
      }
      drawMultiArray(step || { origArr: arr, countArr: cArr, outputArr: oArr });
    }
    return;
  }

  if (state.algo === 'quick' || (step && step.quickPartition)) {
    if (typeof drawQuickPartition === 'function') {
      drawQuickPartition(step || { arr });
    }
    return;
  }

  if (state.algo === 'merge' || (step && step.mergeTree)) {
    if (typeof drawMergeTree === 'function') {
      drawMergeTree(step || { rows: [] });
    }
    return;
  }

  const n      = arr.length;
  const isLight = document.body.classList.contains('light');
  const offsets = (typeof _anim !== 'undefined' && _anim.active) ? _anim.offsets : {};

  if (typeof sortViewMode !== 'undefined' && sortViewMode === 'cells') {
    const cellW = 52, cellH = 52, gap = 4;
    const totalContentW = n * (cellW + gap) - gap + 32;

    const W = Math.max(panelW, totalContentW);
    const H = panelH;
    canvas.width  = W;
    canvas.height = H;
    setDsScroll(totalContentW > panelW);

    ctx.clearRect(0, 0, W, H);

    ctx.strokeStyle = isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for(let x=0;x<W;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
    for(let y=0;y<H;y+=40){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}

    const startX = 16;
    const startY = Math.max(30, H/2 - cellH/2 - 12);
    const defaultBg     = isLight ? '#e8eaf6' : '#22223a';
    const defaultBorder = isLight ? '#8080c0' : '#4444aa';
    const idxColor      = isLight ? '#6666aa' : '#8888aa';

    if (typeof _anim !== 'undefined' && !_anim.active && step && step.swap && step.swap.length === 2) {
      const [si, sj] = step.swap;
      const ax1 = startX + si * (cellW + gap) + cellW/2;
      const ax2 = startX + sj * (cellW + gap) + cellW/2;
      const ay  = startY - 16;
      ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.moveTo(ax1, ay); ctx.lineTo(ax2, ay); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#22c55e';
      const drawHead = (x, dir) => {
        ctx.beginPath();
        ctx.moveTo(x + dir*8, ay);
        ctx.lineTo(x + dir*2, ay - 5);
        ctx.lineTo(x + dir*2, ay + 5);
        ctx.closePath(); ctx.fill();
      };
      drawHead(ax1, -1);
      drawHead(ax2,  1);
    }

    arr.forEach((val, i) => {
      if (offsets[i]) return; 
      const x = startX + i * (cellW + gap);
      const y = startY;
      const accent = typeof getStepColor === 'function' ? getStepColor(i, step) : null;
      const bg     = accent || defaultBg;
      const border = accent || defaultBorder;

      ctx.fillStyle = bg;
      ctx.beginPath(); ctx.roundRect(x, y, cellW, cellH, 4); ctx.fill();
      ctx.strokeStyle = border; ctx.lineWidth = accent ? 2.5 : 1.5;
      ctx.beginPath(); ctx.roundRect(x, y, cellW, cellH, 4); ctx.stroke();

      if (accent) {
        ctx.shadowColor = accent; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.roundRect(x, y, cellW, cellH, 4); ctx.stroke();
        ctx.shadowBlur = 0;
      }

      ctx.fillStyle = accent ? '#ffffff' : (isLight ? '#1a1a2e' : '#ffffff');
      ctx.font = `bold 14px JetBrains Mono`;
      ctx.textAlign = 'center';
      ctx.fillText(String(val), x + cellW/2, y + cellH/2 + 5);

      ctx.fillStyle = idxColor;
      ctx.font = '9px JetBrains Mono';
      ctx.fillText(i, x + cellW/2, y + cellH + 14);
    });

    arr.forEach((val, i) => {
      const o = offsets[i];
      if (!o) return; 
      const baseX = startX + i * (cellW + gap);
      const baseY = startY;
      const dx = o.dx || 0;
      const dy = o.dy || 0;
      const sc = o.scale || 1;
      const glow = o.glow || 0;
      const glowCol = o.glowColor || '#ff6584';
      const accent = typeof getStepColor === 'function' ? getStepColor(i, step) : null;
      const bg     = accent || defaultBg;
      const border = accent || defaultBorder;

      ctx.save();
      const cx = baseX + dx + cellW/2;
      const cy = baseY + dy + cellH/2;
      ctx.translate(cx, cy);
      ctx.scale(sc, sc);
      ctx.translate(-cellW/2, -cellH/2);

      if (glow > 0) {
        ctx.shadowColor = glowCol;
        ctx.shadowBlur = glow;
      }

      ctx.fillStyle = bg;
      ctx.beginPath(); ctx.roundRect(0, 0, cellW, cellH, 6); ctx.fill();
      ctx.strokeStyle = border; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.roundRect(0, 0, cellW, cellH, 6); ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.fillStyle = accent ? '#ffffff' : (isLight ? '#1a1a2e' : '#ffffff');
      ctx.font = `bold 14px JetBrains Mono`;
      ctx.textAlign = 'center';
      ctx.fillText(String(val), cellW/2, cellH/2 + 5);

      ctx.restore();

      ctx.fillStyle = idxColor;
      ctx.font = isLight ? 'bold 9px JetBrains Mono' : '9px JetBrains Mono';
      ctx.textAlign = 'center';
      ctx.fillText(i, baseX + cellW/2, baseY + cellH + 14);
    });

    if (n > 30) {
      ctx.fillStyle = isLight ? 'rgba(0,0,0,0.25)' : 'rgba(136,136,170,0.4)';
      ctx.font = '10px JetBrains Mono'; ctx.textAlign = 'right';
      ctx.fillText(`${n} elements`, Math.min(W, panelW) - 8, 14);
    }

  } else {
    canvas.width  = panelW;
    canvas.height = panelH;
    setDsScroll(false);

    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    ctx.strokeStyle = isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for(let x=0;x<W;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
    for(let y=0;y<H;y+=40){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}

    const maxVal = Math.max(...arr.map(x => Number(x)||0), 1);
    const gap    = n > 60 ? 1 : n > 40 ? 1 : 2;
    const barW   = Math.max(2, Math.floor((W - 20) / n) - gap);
    const totalW = n * (barW + gap) - gap;
    const startX = Math.max(4, (W - totalW) / 2);

    const showValLabel = barW >= 7;
    const topPad = showValLabel ? 28 : 8;
    const botPad = barW >= 5 ? 18 : 6;
    const maxH = H - topPad - botPad;

    const defaultBarColor = isLight ? '#6c63ff' : '#3d3d6b';

    if (typeof _anim !== 'undefined' && !_anim.active && step && step.swap && step.swap.length === 2) {
      const [si, sj] = step.swap;
      const ax1 = startX + si * (barW + gap) + barW/2;
      const ax2 = startX + sj * (barW + gap) + barW/2;
      const ay  = topPad - 8;
      ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 2; ctx.setLineDash([3,2]);
      ctx.beginPath(); ctx.moveTo(ax1, ay); ctx.lineTo(ax2, ay); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#22c55e';
      [[ax1, -1],[ax2, 1]].forEach(([x, d]) => {
        ctx.beginPath();
        ctx.moveTo(x + d*7, ay); ctx.lineTo(x + d*2, ay-4); ctx.lineTo(x + d*2, ay+4);
        ctx.closePath(); ctx.fill();
      });
    }

    arr.forEach((val, i) => {
      if (offsets[i]) return; 
      const barH = Math.max(2, (Number(val) / maxVal) * maxH);
      const x = startX + i * (barW + gap);
      const y = H - barH - botPad;
      const accent = typeof getStepColor === 'function' ? getStepColor(i, step) : null;
      const color  = accent || defaultBarColor;

      if (barW > 4) { ctx.fillStyle='rgba(0,0,0,0.2)'; ctx.fillRect(x+2,y+2,barW,barH); }

      if (barW >= 4) {
        ctx.beginPath(); ctx.roundRect(x, y, barW, barH, [2,2,0,0]);
        ctx.fillStyle = color; ctx.fill();
      } else {
        ctx.fillStyle = color; ctx.fillRect(x, y, barW, barH);
      }

      if (showValLabel) {
        ctx.fillStyle = isLight ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.9)';
        ctx.font = `bold ${Math.min(10,barW+1)}px JetBrains Mono`;
        ctx.textAlign = 'center';
        ctx.fillText(val, x+barW/2, Math.max(topPad-2, y-4));
      }
    });

    arr.forEach((val, i) => {
      const o = offsets[i];
      if (!o) return; 
      const barH = Math.max(2, (Number(val) / maxVal) * maxH);
      const baseX = startX + i * (barW + gap);
      const baseY = H - barH - botPad;
      const dx = o.dx || 0;
      const dy = o.dy || 0;
      const sc = o.scale || 1;
      const glow = o.glow || 0;
      const glowCol = o.glowColor || '#ff6584';
      const accent = typeof getStepColor === 'function' ? getStepColor(i, step) : null;
      const color  = accent || defaultBarColor;

      ctx.save();
      const cx = baseX + dx + barW/2;
      const cy = baseY + dy + barH;
      ctx.translate(cx, cy);
      ctx.scale(sc, sc);
      ctx.translate(-barW/2, -barH);

      if (glow > 0) {
        ctx.shadowColor = glowCol;
        ctx.shadowBlur = glow;
      }

      if (Math.abs(dx) > 1) {
        ctx.fillStyle = glowCol + '18';
        ctx.fillRect(-dx * 0.15, 0, barW, barH);
      }

      if (barW >= 4) {
        ctx.beginPath(); ctx.roundRect(0, 0, barW, barH, [3,3,0,0]);
        ctx.fillStyle = color; ctx.fill();
        ctx.strokeStyle = glowCol; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.roundRect(0, 0, barW, barH, [3,3,0,0]); ctx.stroke();
      } else {
        ctx.fillStyle = color; ctx.fillRect(0, 0, barW, barH);
      }
      ctx.shadowBlur = 0;

      if (showValLabel) {
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.min(11,barW+2)}px JetBrains Mono`;
        ctx.textAlign = 'center';
        ctx.fillText(val, barW/2, -6);
      }

      ctx.restore();
    });

    if (barW >= 5) {
      const stride = barW >= 10 ? 1 : barW >= 6 ? 2 : 5;
      ctx.font = '8px JetBrains Mono'; ctx.textAlign = 'center';
      arr.forEach((_, i) => {
        if (i % stride !== 0 && i !== n-1) return;
        ctx.fillStyle = isLight ? '#111111' : '#666';
        ctx.fillText(i, startX + i*(barW+gap)+barW/2, H-4);
      });
    }

    if (n > 40) {
      ctx.fillStyle = isLight ? 'rgba(0,0,0,0.25)' : 'rgba(136,136,170,0.5)';
      ctx.font='10px JetBrains Mono'; ctx.textAlign='right';
      ctx.fillText(`${n} elements`, W-8, 14);
    }
  }
}

function drawMergeTree(step, animOverride) {
  if (!step) return;
  const panel   = canvas.parentElement;
  const panelW  = panel ? panel.clientWidth : 700;
  const panelH  = panel ? panel.clientHeight : 400;
  const isLight = document.body.classList.contains('light');

  const rows = step.rows || step.visibleNodes || [];
  if (!rows.length) return;

  // ── Cell geometry ──
  const CW    = 52;
  const CH    = 52;
  const HGAP  = 3;
  const ROW_H = CH + 48;
  const PAD_T = 30;
  const PAD_L = 16;
  const GROUP_GAP = 16;   // extra gap between sibling sub-arrays

  const rootRow = rows.find(r => r.depth === 0);
  if (!rootRow) return;
  const n = rootRow.r - rootRow.l + 1;

  const maxDepth = rows.reduce((m, r) => Math.max(m, r.depth), 0);

  // ── Build PER-DEPTH gap map ──
  // Only rows at depth d show gaps between siblings AT THAT DEPTH.
  // Parent rows remain contiguous.
  const depthNodes = {};
  rows.forEach(nd => {
    if (!depthNodes[nd.depth]) depthNodes[nd.depth] = [];
    depthNodes[nd.depth].push(nd);
  });
  Object.values(depthNodes).forEach(nodes => nodes.sort((a, b) => a.l - b.l));

  // gapAfterAtDepth[depth] = Set of global indices AFTER which a gap appears
  const gapAfterAtDepth = {};
  Object.entries(depthNodes).forEach(([depth, nodes]) => {
    const d = parseInt(depth);
    gapAfterAtDepth[d] = new Set();
    for (let i = 0; i < nodes.length - 1; i++) {
      gapAfterAtDepth[d].add(nodes[i].r);
    }
  });

  // colX: position a cell, applying gaps only for the given depth
  function colX(globalIdx, depth) {
    const gaps = gapAfterAtDepth[depth] || new Set();
    let gapCount = 0;
    gaps.forEach(pos => { if (globalIdx > pos) gapCount++; });
    return PAD_L + globalIdx * (CW + HGAP) + gapCount * GROUP_GAP;
  }

  const totalW = colX(n - 1, 0) + CW + PAD_L;  // root row has no gaps = widest baseline
  // Check max width across all depths
  let maxW = totalW;
  for (let d = 0; d <= maxDepth; d++) {
    const w = colX(n - 1, d) + CW + PAD_L;
    if (w > maxW) maxW = w;
  }
  const W = Math.max(panelW, maxW);
  const H = Math.max(panelH, PAD_T + (maxDepth + 1) * ROW_H + 24);

  canvas.width  = W;
  canvas.height = H;
  setDsScroll(W > panelW || H > panelH);

  ctx.fillStyle = isLight ? '#f8f8fc' : '#0a0a12';
  ctx.fillRect(0, 0, W, H);

  // ── Subtle grid for depth ──
  ctx.strokeStyle = isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.015)';
  ctx.lineWidth = 1;
  for (let d = 0; d <= maxDepth; d++) {
    const gy = PAD_T + d * ROW_H + CH + 20;
    ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
  }

  const PHASE_COL = step.phase === 'split' ? '#f59e0b'
                  : step.phase === 'done'  ? '#6c63ff' : '#10b981';
  const PHASE_LBL = step.phase === 'split' ? '▼ SPLITTING'
                  : step.phase === 'done'  ? '✅ SORTED'  : '▲ MERGING';
  ctx.fillStyle = PHASE_COL;
  ctx.font = 'bold 11px JetBrains Mono';
  ctx.textAlign = 'left';
  ctx.fillText(PHASE_LBL, PAD_L, 18);

  function rowY(depth) { return PAD_T + depth * ROW_H; }

  // Find merging node and its children for circle logic
  const mergingNd = rows.find(nd => nd.state === 'merging');
  // Children of merging node: depth+1 and within merging node's range
  const isChildOfMerging = (nd) => {
    if (!mergingNd) return false;
    return nd.depth === mergingNd.depth + 1 &&
           nd.l >= mergingNd.l && nd.r <= mergingNd.r;
  };

  // Animation override data
  const ao = animOverride || {};
  const t = ao.t !== undefined ? ao.t : 1;
  const animPhase = ao.phase || null;
  const newRowIds = ao.newRowIds || [];
  const fadeOutIds = ao.fadeOutIds || [];

  // ── Draw connecting lines between parent and child rows ──
  rows.forEach(nd => {
    if (nd.depth === 0) return;
    const y = rowY(nd.depth);
    const parentY = rowY(nd.depth - 1);
    const leftX = colX(nd.l, nd.depth);
    const rightX = colX(nd.r, nd.depth) + CW;
    const midX = (leftX + rightX) / 2;

    let lineAlpha = 0.15;
    if (newRowIds.includes(nd.id) && animPhase === 'split-in') {
      lineAlpha = 0.15 * _easeOutCubic(t);
    }

    ctx.strokeStyle = isLight ? `rgba(0,0,0,${lineAlpha})` : `rgba(255,255,255,${lineAlpha})`;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(midX, parentY + CH + 2);
    ctx.lineTo(midX, y - 2);
    ctx.stroke();
    ctx.setLineDash([]);
  });

  // ── Draw group separator markers between sibling sub-arrays ──
  Object.entries(depthNodes).forEach(([depth, nodes]) => {
    const d = parseInt(depth);
    if (d === 0) return; // root row never gets separators
    const gaps = gapAfterAtDepth[d];
    if (!gaps) return;
    for (let i = 0; i < nodes.length - 1; i++) {
      const pos = nodes[i].r;
      if (gaps.has(pos)) {
        const rightEdge = colX(pos, d) + CW + GROUP_GAP * 0.15;
        const leftEdge  = colX(pos + 1, d) - GROUP_GAP * 0.15;
        const midGapX = (rightEdge + leftEdge) / 2;
        const y = rowY(d);
        ctx.fillStyle = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)';
        for (let dy = 10; dy < CH - 5; dy += 8) {
          ctx.beginPath();
          ctx.arc(midGapX, y + dy, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  });

  // ── Draw each row's cells ──
  rows.forEach(nd => {
    let baseY = rowY(nd.depth);
    let rowOpacity = 1;
    let rowScale = 1;
    let rowDy = 0;

    // Animate new rows sliding in
    if (newRowIds.includes(nd.id) && animPhase === 'split-in') {
      const ease = _easeOutCubic(t);
      const parentDepthY = rowY(Math.max(0, nd.depth - 1));
      rowDy = (parentDepthY - baseY) * (1 - ease);
      rowOpacity = ease;
      rowScale = 0.85 + 0.15 * ease;
    }

    // Animate rows fading out
    if (fadeOutIds.includes(nd.id) && animPhase === 'children-out') {
      rowOpacity = 1 - _easeOutCubic(t);
      rowDy = 30 * _easeOutCubic(t);
      rowScale = 1 - 0.1 * _easeOutCubic(t);
    }

    const isMergingNode = nd.state === 'merging';
    const isChild = isChildOfMerging(nd);

    nd.values.forEach((val, ci) => {
      const globalIdx = nd.l + ci;
      const x = colX(globalIdx, nd.depth);
      const y = baseY + rowDy;
      const isEmpty = val === null || val === undefined;

      // ── FIXED: Circles on CHILD rows, not parent ──
      const isCompared = isChild && !isEmpty &&
        (step.compareL === globalIdx || step.compareR === globalIdx);

      // Gold highlight on just-placed cell in PARENT
      const isPlaced = isMergingNode && step.placedParentIdx === globalIdx;

      let fill, stroke, textCol;

      if (isEmpty) {
        fill    = isLight ? '#e8e8f0' : '#1a1a28';
        stroke  = isLight ? '#ccccdd' : '#333355';
        textCol = 'transparent';
      } else if (nd.state === 'sorted' || nd.state === 'merging') {
        fill    = '#22c55e';
        stroke  = isPlaced ? '#f59e0b' : '#16a34a';
        textCol = '#ffffff';
      } else {
        fill    = '#ffffff';
        stroke  = isLight ? '#aaaacc' : '#555577';
        textCol = isLight ? '#1a1a2e' : '#1a1a2e';
      }

      if (isPlaced) stroke = '#f59e0b';

      ctx.save();
      ctx.globalAlpha = rowOpacity;

      let cellScale = rowScale;
      let cellGlow = 0;
      let cellGlowColor = '#22c55e';

      // Animate comparison pulse on CHILDREN
      if (isCompared && animPhase === 'compare-pulse') {
        const pulse = Math.sin(t * Math.PI);
        cellScale *= 1 + 0.12 * pulse;
        cellGlow = 20 * pulse;
        cellGlowColor = '#2563eb';
      }

      // Animate placed cell landing on PARENT
      if (isPlaced && animPhase === 'place-float') {
        const bounce = _easeOutBack(t);
        cellScale *= 0.7 + 0.3 * bounce;
        cellGlow = 25 * (1 - t);
        cellGlowColor = '#f59e0b';
      }

      // Sorted flash
      if (nd.state === 'sorted' && animPhase === 'sorted-flash' && !isEmpty) {
        const flash = Math.sin(t * Math.PI);
        cellGlow = 15 * flash;
        cellGlowColor = '#22c55e';
        cellScale *= 1 + 0.06 * flash;
      }

      const cx = x + CW / 2;
      const cy = y + CH / 2;
      ctx.translate(cx, cy);
      ctx.scale(cellScale, cellScale);
      ctx.translate(-CW / 2, -CH / 2);

      if (cellGlow > 0) {
        ctx.shadowColor = cellGlowColor;
        ctx.shadowBlur = cellGlow;
      }

      ctx.fillStyle = fill;
      ctx.beginPath(); ctx.roundRect(0, 0, CW, CH, 4); ctx.fill();
      ctx.strokeStyle = stroke;
      ctx.lineWidth = (isCompared || isPlaced) ? 3 : 1.5;
      ctx.beginPath(); ctx.roundRect(0, 0, CW, CH, 4); ctx.stroke();
      ctx.shadowBlur = 0;

      if (!isEmpty) {
        ctx.fillStyle = textCol;
        ctx.font = `bold 16px JetBrains Mono`;
        ctx.textAlign = 'center';
        ctx.fillText(String(val), CW / 2, CH / 2 + 6);
      }

      ctx.restore();

      // Index labels
      if ((nd.depth === 0 || maxDepth <= 3) && rowOpacity > 0.5) {
        ctx.save();
        ctx.globalAlpha = rowOpacity;
        ctx.fillStyle = isLight ? '#888' : '#666';
        ctx.font = '9px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.fillText(globalIdx, x + CW / 2, y + CH + 13);
        ctx.restore();
      }

      // ── FIXED: Blue circle ring on CHILD rows being compared ──
      if (isCompared) {
        ctx.save();
        ctx.globalAlpha = rowOpacity;
        let circleScale = 1;
        let circleGlow = 0;
        if (animPhase === 'compare-pulse') {
          const pulse = Math.sin(t * Math.PI);
          circleScale = 1 + 0.15 * pulse;
          circleGlow = 14 * pulse;
        }
        if (circleGlow > 0) {
          ctx.shadowColor = '#2563eb';
          ctx.shadowBlur = circleGlow;
        }
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x + CW/2, y + CH/2, (CW/2 + 6) * circleScale, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.restore();
      }
    });
  });

  // ── FIXED: Animated floating number from CORRECT SOURCE CELL to parent ──
  if (step.placedParentIdx >= 0 && mergingNd && step.phase === 'merge') {
    const parentDepth = mergingNd.depth;
    const placedVal   = mergingNd.values[step.placedParentIdx - mergingNd.l];
    const sourceIdx   = step.placedSourceIdx !== undefined ? step.placedSourceIdx : -1;

    if (placedVal !== null && placedVal !== undefined) {
      const destX  = colX(step.placedParentIdx, parentDepth);
      const destY  = rowY(parentDepth);
      const childDepth = parentDepth + 1;
      const srcX   = sourceIdx >= 0 ? colX(sourceIdx, childDepth) : destX;
      const srcY   = rowY(childDepth);

      // Animate float progress
      let floatT = 1;
      if (animPhase === 'place-float') {
        floatT = _easeOutCubic(t);
      }

      // Interpolate from source cell to destination cell
      const currentX = srcX + (destX - srcX) * floatT + CW / 2;
      const currentY = srcY + (destY - srcY) * floatT;

      // Trail particles
      if (animPhase === 'place-float' && t < 0.9) {
        const trailCount = 5;
        for (let i = 0; i < trailCount; i++) {
          const trailT = Math.max(0, floatT - i * 0.06);
          const tx = srcX + (destX - srcX) * trailT + CW / 2;
          const ty = srcY + (destY - srcY) * trailT;
          const alpha = 0.35 * (1 - i / trailCount) * (1 - t);
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.arc(tx, ty + CH / 2, 4 - i * 0.6, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // Floating number
      const floatAlpha = animPhase === 'place-float' ? 0.5 + 0.5 * (1 - t * 0.6) : 0.92;
      const floatScale = animPhase === 'place-float' ? 1.4 - 0.4 * _easeOutCubic(t) : 1;

      ctx.save();
      ctx.globalAlpha = floatAlpha;
      ctx.translate(currentX, currentY + CH / 2);
      ctx.scale(floatScale, floatScale);
      ctx.fillStyle   = '#f59e0b';
      ctx.font        = 'bold 22px JetBrains Mono';
      ctx.textAlign   = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor  = 'rgba(245,158,11,0.6)';
      ctx.shadowBlur   = 14;
      ctx.fillText(String(placedVal), 0, 0);
      ctx.restore();

      // Guide line from source to dest (when not fully arrived)
      if (floatT < 0.85) {
        ctx.save();
        const guideAlpha = 0.3 * (1 - floatT);
        ctx.strokeStyle = `rgba(245,158,11,${guideAlpha})`;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 4]);
        ctx.beginPath();
        ctx.moveTo(currentX, currentY + CH);
        ctx.lineTo(destX + CW / 2, destY + 4);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }
    }
  }
}

function drawQuickPartition(step) {
  if (!step) return;
  const panel  = canvas.parentElement;
  const panelW = panel ? panel.clientWidth  : 800;
  const panelH = panel ? panel.clientHeight : 460;
  const isLight = document.body.classList.contains('light');

  const arr  = step.arr  || [];
  const rows = step.rows || [];
  const n    = arr.length;
  if (n === 0) return;

  // ── Cell geometry ──
  const CW = 46, CH = 44, GAP = 3;
  const ROW_H = CH + 52;   // row height including labels/pointers
  const PAD_T = 44;        // top padding for phase badge
  const PAD_L = 20;

  const totalCellsW = n * (CW + GAP) - GAP;
  const maxDepth    = rows.length > 0 ? Math.max(...rows.map(r => r.depth)) : 0;
  const W = Math.max(panelW, totalCellsW + PAD_L * 2);
  const H = Math.max(panelH, PAD_T + (maxDepth + 2) * ROW_H + 80);

  canvas.width  = W;
  canvas.height = H;
  setDsScroll(W > panelW || H > panelH);

  const bg = isLight ? '#f4f4f8' : '#0a0a12';
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

  // ── Phase colors ──
  const phaseColors = {
    'select': ['#f59e0b', '▶ PIVOT SELECTED'],
    'scan':   ['#43d9ad', '● SCANNING'],
    'swap':   ['#22c55e', '⇄ SWAPPING'],
    'place':  ['#6c63ff', '✓ PIVOT PLACED'],
    'done':   ['#22c55e', '✅ SORTED'],
  };
  const [phaseCol, phaseLbl] = phaseColors[step.phase] || ['#8888aa', ''];

  // ── Phase badge ──
  ctx.font = 'bold 12px JetBrains Mono';
  const pw = ctx.measureText(phaseLbl).width + 22;
  ctx.fillStyle = phaseCol + '22';
  ctx.beginPath(); ctx.roundRect(14, 8, pw, 24, 6); ctx.fill();
  ctx.strokeStyle = phaseCol + '99'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.roundRect(14, 8, pw, 24, 6); ctx.stroke();
  ctx.fillStyle = phaseCol; ctx.textAlign = 'left';
  ctx.fillText(phaseLbl, 24, 25);

  // ── Draw tree rows (like merge sort) ──
  // Active subarray row is always shown at depth 0 for clarity
  // Past rows are shown grayed out above it
  function rowY(depth) { return PAD_T + depth * ROW_H; }

  // Center of global array cells
  const mainStartX = Math.max(PAD_L, (W - totalCellsW) / 2);
  function globalColX(i) { return mainStartX + i * (CW + GAP); }

  // Draw a single subarray row
  function drawRow(row, isActive) {
    const rLo = row.lo, rHi = row.hi;
    const rCells = row.values || arr.slice(rLo, rHi + 1);
    const rowWidth = rCells.length * (CW + GAP) - GAP;

    // Align subarray to its global position
    const rx = globalColX(rLo);
    const ry = rowY(row.depth);

    // Row state color
    const isSortedRow = row.state === 'sorted';
    const isPartRow   = row.state === 'partitioned';
    const rowAlpha    = isActive ? 1.0 : (isSortedRow ? 0.9 : 0.45);

    ctx.save();
    ctx.globalAlpha = rowAlpha;

    rCells.forEach((val, ci) => {
      const gi = rLo + ci;  // global index
      const x  = rx + ci * (CW + GAP);

      const isPivotCell   = isActive && gi === step.pivotIdx;
      const isSortedCell  = step.sorted && step.sorted.includes(gi);
      const isLeftPtr     = isActive && gi === step.leftPtr  && step.phase !== 'done';
      const isRightPtr    = isActive && gi === step.rightPtr && step.phase !== 'done';
      // Left region (≤ pivot, scanned): lo+1 .. leftPtr-1
      // Left region: lo+1..i (scanned, ≤ pivot) — green
      const inLeft  = isActive && gi > step.lo && gi <= step.leftPtr &&
                      (step.phase === 'scan' || step.phase === 'swap');
      // Lomuto: unscanned cells (j..hi) stay gray — no right region coloring
      const inRight = false;

      let fill, stroke, textCol;
      if (isSortedCell || isSortedRow) {
        fill='#6c63ff'; stroke='#8a83ff'; textCol='#fff';
      } else if (isPivotCell) {
        fill='#f59e0b'; stroke='#fbbf24'; textCol='#1a1a2e';
      } else if (inLeft) {
        fill=isLight?'#bbf7d0':'#14532d'; stroke='#22c55e';
        textCol=isLight?'#14532d':'#4ade80';
      } else if (inRight) {
        fill=isLight?'#fecaca':'#7f1d1d'; stroke='#ef4444';
        textCol=isLight?'#7f1d1d':'#f87171';
      } else if (isPartRow) {
        fill=isLight?'#e0e7ff':'#1e1b4b'; stroke='#6366f1';
        textCol=isLight?'#312e81':'#a5b4fc';
      } else if (isActive) {
        fill=isLight?'#e8eaf6':'#22223a'; stroke=isLight?'#8080c0':'#4444aa';
        textCol=isLight?'#1a1a2e':'#fff';
      } else {
        fill=isLight?'#e8eaf6':'#1a1a28'; stroke=isLight?'#c0c0d8':'#2a2a42';
        textCol=isLight?'#6666aa':'#666688';
      }

      // Pointer glow
      if ((isLeftPtr || isRightPtr || isPivotCell) && isActive) {
        ctx.shadowColor = isPivotCell ? '#f59e0b' : (isLeftPtr ? '#22c55e' : '#43d9ad');
        ctx.shadowBlur  = 12;
      }
      ctx.fillStyle   = fill;
      ctx.beginPath(); ctx.roundRect(x, ry, CW, CH, 5); ctx.fill();
      ctx.strokeStyle = stroke;
      ctx.lineWidth   = (isPivotCell || isLeftPtr || isRightPtr) ? 2.5 : 1.5;
      ctx.beginPath(); ctx.roundRect(x, ry, CW, CH, 5); ctx.stroke();
      ctx.shadowBlur  = 0;

      // Value
      ctx.fillStyle = textCol;
      ctx.font = 'bold 13px JetBrains Mono';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(val), x + CW/2, ry + CH/2);
      ctx.textBaseline = 'alphabetic';

      // Global index below cell
      ctx.fillStyle = isLight ? '#6666aa' : '#444466';
      ctx.font = '8px JetBrains Mono'; ctx.textAlign = 'center';
      ctx.fillText(gi, x + CW/2, ry + CH + 11);

      // Pointer labels below index (only for active row)
      if (isActive) {
        ctx.font = 'bold 10px JetBrains Mono';
        if (isPivotCell) {
          ctx.fillStyle = '#f59e0b'; ctx.textAlign = 'center';
          ctx.fillText('pivot', x + CW/2, ry - 6);
        }
        if (isLeftPtr && !isSortedCell) {
          ctx.fillStyle = '#22c55e'; ctx.textAlign = 'center';
          ctx.fillText('i', x + CW/2, ry + CH + 24);
        }
        if (isRightPtr && !isSortedCell) {
          ctx.fillStyle = '#43d9ad'; ctx.textAlign = 'center';
          ctx.fillText('j', x + CW/2, ry + CH + (isLeftPtr ? 36 : 24));
        }
      }
    });

    // Bracket around this row's subarray
    if (isActive && step.phase !== 'done') {
      const bx1 = rx - 3, bx2 = rx + rowWidth + 3;
      const by  = ry - 20;
      ctx.strokeStyle = phaseCol + 'cc'; ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(bx1, by+8); ctx.lineTo(bx1, by);
      ctx.lineTo(bx2, by); ctx.lineTo(bx2, by+8);
      ctx.stroke();
      ctx.fillStyle = phaseCol; ctx.font = 'bold 10px JetBrains Mono';
      ctx.textAlign = 'center';
      ctx.fillText(`[${rLo}..${rHi}]`, (bx1+bx2)/2, by - 4);
    }

    ctx.restore();
  }

  // Draw all past rows first (grayed)
  rows.forEach(row => {
    const isActive = (row.lo === step.lo && row.hi === step.hi && step.phase !== 'done');
    if (!isActive) drawRow(row, false);
  });

  // Draw active row on top
  if (step.phase !== 'done') {
    const activeRow = rows.find(r => r.lo === step.lo && r.hi === step.hi);
    if (activeRow) drawRow(activeRow, true);
    else {
      // Fallback: draw from arr directly if no row yet
      const fakeRow = {lo:step.lo, hi:step.hi, depth:0,
        values: arr.slice(step.lo, step.hi+1), state:'active'};
      drawRow(fakeRow, true);
    }
  } else {
    // Done: show final sorted top row
    const topRow = {lo:0, hi:n-1, depth:0, values:[...arr], state:'sorted'};
    drawRow(topRow, false);
  }

  // ── Region labels ──
  if (step.phase === 'scan' || step.phase === 'swap') {
    const ry0 = rowY(rows.find(r=>r.lo===step.lo&&r.hi===step.hi)?.depth||0);
    if (step.leftPtr > step.lo && step.leftPtr <= step.hi) {
      const lx1 = globalColX(step.lo + 1);
      const lx2 = globalColX(step.leftPtr - 1) + CW;
      if (lx2 > lx1) {
        ctx.fillStyle = '#22c55e'; ctx.globalAlpha = 0.7;
        ctx.font = 'bold 10px JetBrains Mono'; ctx.textAlign = 'center';
        ctx.fillText('≤ pivot', (lx1+lx2)/2, ry0 + CH + 42);
        ctx.globalAlpha = 1;
      }
    }
    if (step.rightPtr < step.hi) {
      const rx1 = globalColX(step.rightPtr + 1);
      const rx2 = globalColX(step.hi) + CW;
      if (rx2 > rx1) {
        ctx.fillStyle = '#ef4444'; ctx.globalAlpha = 0.7;
        ctx.font = 'bold 10px JetBrains Mono'; ctx.textAlign = 'center';
        ctx.fillText('> pivot', (rx1+rx2)/2, ry0 + CH + 42);
        ctx.globalAlpha = 1;
      }
    }
  }

  // ── Legend ──
  const leg = [
    ['#f59e0b','Pivot'],
    ['#22c55e','i (boundary)'],
    ['#43d9ad','j (scanner)'],
    ['#22c55e','< pivot'],
    ['#ef4444','> pivot'],
    ['#6c63ff','Sorted'],
  ];
  const legDot = 11, legGap = 22;
  ctx.font = `600 12px Inter`;
  let lx2 = 14; const ly2 = H - 12;
  leg.forEach(([col, lbl]) => {
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.roundRect(lx2, ly2 - legDot + 1, legDot, legDot, 3); ctx.fill();
    ctx.fillStyle = isLight ? '#222244' : '#ccccee';
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(lbl, lx2 + legDot + 5, ly2 - legDot/2 + 1);
    lx2 += legDot + 5 + ctx.measureText(lbl).width + legGap;
  });
  ctx.textBaseline = 'alphabetic';
}

function drawRadixStep(step) {
  const panel = canvas.parentElement;
  canvas.width = panel ? panel.clientWidth : 800;
  canvas.height = panel ? panel.clientHeight : 460;
  const W = canvas.width;
  const H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  const isLight = document.body.classList.contains('light');
  ctx.fillStyle = isLight ? '#f0f0f8' : '#0a0a14';
  ctx.fillRect(0, 0, W, H);

  const items = step.arr || [];
  const buckets = step.buckets || Array.from({ length: 10 }, () => []);

  // Draw the main array boxes at the top
  const len = items.length;
  const gap = 6;
  const maxBoxW = 46;
  const boxSize = Math.min(maxBoxW, (W - 60 - len * gap) / len);
  const startX = Math.max(20, (W - len * (boxSize + gap)) / 2);
  const mainY = 60;

  for (let i = 0; i < len; i++) {
    const val = items[i];
    const x = startX + i * (boxSize + gap);
    const y = mainY;
    ctx.fillStyle = isLight ? '#e0e0e8' : '#1a1a26';
    ctx.fillRect(x, y, boxSize, boxSize);
    if (val !== null && val !== undefined) {
      let bg = '#22223a';
      if (step.comp && step.comp.includes(i)) bg = '#ff6584';
      else if (step.swap && step.swap.includes(i)) bg = '#43d9ad';
      else if (step.sorted && step.sorted.includes(i)) bg = '#6c63ff';
      ctx.fillStyle = bg;
      ctx.fillRect(x, y, boxSize, boxSize);
      ctx.strokeStyle = '#4444aa';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x, y, boxSize, boxSize);
      if (boxSize > 15) {
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.max(9, boxSize * 0.4)}px JetBrains Mono`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(val, x + boxSize / 2, y + boxSize / 2);
      }
    }
  }

  // Draw 10 buckets at the bottom
  const bucketW = Math.min(56, (W - 60) / 10 - 10);
  const bucketStartX = Math.max(20, (W - 10 * (bucketW + 10)) / 2);
  const bucketBottomY = H - 30;
  const bucketH = Math.min(150, H - mainY - boxSize - 60);
  const safeBucketH = Math.max(20, bucketH);

  for (let b = 0; b < 10; b++) {
    const x = bucketStartX + b * (bucketW + 10);
    const bucketItems = buckets[b] || [];
    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 15px JetBrains Mono';
    ctx.textAlign = 'center';
    ctx.fillText(`[${b}]`, x + bucketW / 2, bucketBottomY + 20);
    ctx.beginPath();
    ctx.moveTo(x, bucketBottomY - safeBucketH);
    ctx.lineTo(x, bucketBottomY);
    ctx.lineTo(x + bucketW, bucketBottomY);
    ctx.lineTo(x + bucketW, bucketBottomY - safeBucketH);
    ctx.strokeStyle = isLight ? '#8888aa' : '#6c63ff';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Draw elements inside the bucket (stacked from bottom)
    for (let j = 0; j < bucketItems.length; j++) {
      const val = bucketItems[j];
      const itemH = Math.min(26, safeBucketH / Math.max(1, bucketItems.length));
      const ix = x + 4;
      const iw = bucketW - 8;
      const iy = bucketBottomY - (j + 1) * itemH - 2;
      ctx.fillStyle = '#43d9ad';
      ctx.fillRect(ix, iy, iw, itemH);
      if (itemH >= 10) {
        ctx.fillStyle = '#0a0a14';
        ctx.font = `bold ${Math.max(9, itemH * 0.55)}px JetBrains Mono`;
        ctx.fillText(val, ix + iw / 2, iy + itemH / 2);
      }
    }
  }

  // Draw label if present
  if (step.label) {
    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 16px JetBrains Mono';
    ctx.fillText(step.label, W / 2, 30);
  }
}

function drawMultiArray(step) {
  if (!step) return;
  const panel = canvas.parentElement;
  const panelW = panel ? panel.clientWidth : 700;
  const panelH = panel ? panel.clientHeight : 340;
  const isLight = document.body.classList.contains('light');

  const { origArr = [], countArr = [], outputArr = [] } = step;
  const origN = origArr.length;
  const countN = countArr.length;
  const outN = outputArr.length;

  // ── Geometry ──
  const CW = 42, CH = 38, HGAP = 4;
  const ROW_GAP = 52;
  const LABEL_W = 86;
  const PAD_TOP = 18;
  const PAD_BOT = 18;

  const maxCols = Math.max(origN, countN, outN);
  const contentW = LABEL_W + maxCols * (CW + HGAP);
  const W = Math.max(panelW, contentW + 24);
  const H = Math.max(panelH, PAD_TOP + 3 * (CH + ROW_GAP) + PAD_BOT);

  canvas.width = W;
  canvas.height = H;
  setDsScroll(W > panelW || H > panelH);

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = isLight ? '#f8f8fc' : '#0a0a0f';
  ctx.fillRect(0, 0, W, H);

  // ── Helper: draw one row of cells ──
  function drawRow(label, values, rowY, activeIdx) {
    // Row label
    ctx.fillStyle = isLight ? '#6666aa' : '#8888aa';
    ctx.font = 'bold 10px JetBrains Mono';
    ctx.textAlign = 'right';
    ctx.fillText(label, LABEL_W - 8, rowY + CH / 2 + 4);

    values.forEach((val, i) => {
      const x = LABEL_W + i * (CW + HGAP);
      const y = rowY;
      const isActive = i === activeIdx;
      const isEmpty = val === null || val === undefined;

      // Cell colours – light/dark aware
      let bg, border, textCol;
      if (isEmpty) {
        bg = isLight ? '#e0e0f0' : '#1a1a28';
        border = isLight ? '#c0c0e0' : '#333355';
        textCol = isLight ? '#888' : '#666';
      } else {
        bg = isLight ? '#eef2ff' : '#22223a';
        border = isLight ? '#6c63ff' : '#4444aa';
        textCol = isLight ? '#1a1a2e' : '#fff';
      }
      if (isActive && !isEmpty) {
        bg = '#f5b042';           // active highlight (orange)
        border = '#ffb347';
        textCol = '#1a1a2e';
      }

      // Glow for active
      if (isActive) {
        ctx.shadowColor = '#f5b042';
        ctx.shadowBlur = 10;
      }

      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.roundRect(x, y, CW, CH, 4);
      ctx.fill();
      ctx.strokeStyle = border;
      ctx.lineWidth = isActive ? 2.5 : 1.5;
      ctx.beginPath();
      ctx.roundRect(x, y, CW, CH, 4);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Value
      ctx.fillStyle = textCol;
      ctx.font = `bold 13px JetBrains Mono`;
      ctx.textAlign = 'center';
      ctx.fillText(isEmpty ? '' : String(val), x + CW / 2, y + CH / 2 + 4);

      // Index label below cell
      ctx.fillStyle = isLight ? '#888' : '#666';
      ctx.font = '8px JetBrains Mono';
      ctx.fillText(i, x + CW / 2, y + CH + 12);
    });
  }

  // ── Draw arrows (only if active counts or outputs are highlighted) ──
  if (step.activeOrig >= 0 && step.activeCount >= 0) {
    const origCellX = LABEL_W + step.activeOrig * (CW + HGAP) + CW / 2;
    const countCellX = LABEL_W + step.activeCount * (CW + HGAP) + CW / 2;
    const y1 = PAD_TOP + CH;
    const y2 = PAD_TOP + CH + ROW_GAP;
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 3]);
    ctx.beginPath();
    ctx.moveTo(origCellX, y1 + 2);
    ctx.bezierCurveTo(origCellX, y1 + 20, countCellX, y2 - 20, countCellX, y2 - 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.moveTo(countCellX, y2 - 2);
    ctx.lineTo(countCellX - 5, y2 - 10);
    ctx.lineTo(countCellX + 5, y2 - 10);
    ctx.closePath();
    ctx.fill();
  }

  if (step.activeCount >= 0 && step.activeOutput >= 0) {
    const countCellX = LABEL_W + step.activeCount * (CW + HGAP) + CW / 2;
    const outputCellX = LABEL_W + step.activeOutput * (CW + HGAP) + CW / 2;
    const y1 = PAD_TOP + CH + ROW_GAP + CH;
    const y2 = PAD_TOP + CH + ROW_GAP + CH + ROW_GAP;
    ctx.strokeStyle = '#43d9ad';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 3]);
    ctx.beginPath();
    ctx.moveTo(countCellX, y1 + 2);
    ctx.bezierCurveTo(countCellX, y1 + 20, outputCellX, y2 - 20, outputCellX, y2 - 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#43d9ad';
    ctx.beginPath();
    ctx.moveTo(outputCellX, y2 - 2);
    ctx.lineTo(outputCellX - 5, y2 - 10);
    ctx.lineTo(outputCellX + 5, y2 - 10);
    ctx.closePath();
    ctx.fill();
  }

  // ── Draw the three rows ──
  const row0Y = PAD_TOP;
  const row1Y = PAD_TOP + CH + ROW_GAP;
  const row2Y = PAD_TOP + CH + ROW_GAP + CH + ROW_GAP;

  drawRow('ORIGINAL', origArr, row0Y, step.activeOrig);
  drawRow('COUNT[ ]', countArr, row1Y, step.activeCount);
  drawRow('OUTPUT[ ]', outputArr, row2Y, step.activeOutput);

  // Phase label top‑right
  ctx.fillStyle = '#43d9ad';
  ctx.font = 'bold 10px JetBrains Mono';
  ctx.textAlign = 'right';
  const phaseLabel =
    step.activeOrig >= 0 ? '● COUNTING' :
    step.activeOutput >= 0 ? '● BUILDING OUTPUT' : '● INIT';
  ctx.fillText(phaseLabel, W - 10, 14);
}

export const SortingVisualizer = {
  init: (canvasEl) => { canvas = canvasEl; ctx = canvas.getContext('2d'); },
  setState: (newState) => { state = { ...state, ...newState }; },
  setMode: (mode) => { sortViewMode = mode; },
  drawStep: (idx) => { drawStep(idx); },
  animateStep: (idx, callback) => { 
    const step = state.steps[idx];
    if (step && step.mergeTree) { _animateMergeTreeStep(idx, idx > 0 ? state.steps[idx-1] : null, callback); }
    else { _animateStep(idx, callback); }
  },
  stopAnimation: () => { _animReset(); },
};
const _mtAnim = { active: false, rafId: null, startTime: 0, duration: 400, prevStep: null, currStep: null, phase: null, onComplete: null, t: 0 };
function _mtAnimReset() { if (_mtAnim.rafId) cancelAnimationFrame(_mtAnim.rafId); _mtAnim.active = false; _mtAnim.rafId = null; }
function _animateMergeTreeStep(stepIdx, prevStep, callback) {
  const step = state.steps[stepIdx];
  if (!step || !step.mergeTree) { if (callback) callback(); return; }

  _mtAnimReset();
  const speed = state.speed;

  // Determine what changed between prev and current step
  const prevRows = prevStep ? (prevStep.rows || []) : [];
  const currRows = step.rows || [];
  const prevIds = new Set(prevRows.map(r => r.id));
  const currIds = new Set(currRows.map(r => r.id));

  const newRowIds = currRows.filter(r => !prevIds.has(r.id)).map(r => r.id);
  const fadeOutIds = prevRows.filter(r => !currIds.has(r.id)).map(r => r.id);

  const prevRowMap = {};
  prevRows.forEach(r => { prevRowMap[r.id] = r; });

  // Determine animation phase — SLOWER timings across the board
  let animPhase = null;
  let duration = Math.max(420, 1100 - speed * 68);

  if (newRowIds.length > 0 && step.phase === 'split') {
    animPhase = 'split-in';
    duration = Math.max(480, 1300 - speed * 82);
  } else if (step.compareL >= 0 || step.compareR >= 0) {
    animPhase = 'compare-pulse';
    duration = Math.max(280, 750 - speed * 47);
  } else if (step.placedParentIdx >= 0) {
    animPhase = 'place-float';
    duration = Math.max(560, 1500 - speed * 94);
  } else if (fadeOutIds.length > 0) {
    animPhase = 'children-out';
    duration = Math.max(450, 1100 - speed * 65);
  } else if (step.phase === 'done') {
    animPhase = 'sorted-flash';
    duration = Math.max(480, 1200 - speed * 72);
  }

  if (!animPhase) {
    drawMergeTree(step);
    if (callback) callback();
    return;
  }

  _mtAnim.active = true;
  _mtAnim.phase = animPhase;
  _mtAnim.currStep = step;
  _mtAnim.prevStep = prevStep;
  _mtAnim.duration = duration;
  _mtAnim.onComplete = callback;
  _mtAnim.startTime = performance.now();

  // For fade-out, inject disappearing rows temporarily
  const ghostRows = fadeOutIds.length > 0 && animPhase === 'children-out'
    ? prevRows.filter(r => fadeOutIds.includes(r.id))
    : [];

  function frame(now) {
    const elapsed = now - _mtAnim.startTime;
    const t = Math.min(1, elapsed / _mtAnim.duration);
    _mtAnim.t = t;

    // For children-out: temporarily add ghost rows
    const renderStep = step; // renamed from 'drawStep' to avoid shadowing
    const origRows = renderStep.rows;
    if (ghostRows.length > 0 && animPhase === 'children-out') {
      renderStep.rows = [...origRows, ...ghostRows];
    }

    drawMergeTree(renderStep, {
      t,
      phase: animPhase,
      newRowIds,
      fadeOutIds: fadeOutIds.concat(ghostRows.map(r => r.id)),
      prevRowMap,
    });

    // Restore original rows
    if (ghostRows.length > 0) {
      renderStep.rows = origRows;
    }

    if (t < 1) {
      _mtAnim.rafId = requestAnimationFrame(frame);
    } else {
      const cb = _mtAnim.onComplete; // save before clearing
      _mtAnim.active = false;
      _mtAnim.onComplete = null;
      drawMergeTree(step); // final clean draw
      if (cb) cb();
    }
  }

  _mtAnim.rafId = requestAnimationFrame(frame);
}

