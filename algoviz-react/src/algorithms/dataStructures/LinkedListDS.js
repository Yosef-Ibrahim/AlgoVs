export class LinkedListDS {
  constructor() {
    this.nodes = [];
    this.nextId = 1;
    this.cellW = 70;
    this.cellH = 50;
    this.gap = 50;
    this.type = 'singly'; // singly, doubly, circular
  }

  getSize() {
    return this.nodes.filter(n => !n.isDeleted).length;
  }

  getHTMLControls() {
    return `
      <section class="ds-section">
        <div class="ds-section-label">OPERATIONS</div>
        <div class="ds-input-row">
          <input class="ds-val-input" id="ll-val" type="text" placeholder="Value" autocomplete="off"/>
        </div>
        ${this.type !== 'ordered' ? `
        <div class="ds-input-row" style="margin-top: 8px;">
          <input class="ds-val-input" id="ll-idx" type="number" placeholder="Index (opt)" min="0" autocomplete="off"/>
        </div>` : ''}
        <div style="display:flex; gap:8px; margin-top: 12px; flex-wrap: wrap;">
          ${this.type === 'ordered' 
            ? `<button class="ds-btn ds-btn-accent" id="ll-btn-ins-ord" style="flex:1 1 100%; padding: 8px;">Insert Node</button>
               <button class="ds-btn ds-btn-danger" id="ll-btn-del-val" style="flex:1 1 100%; padding: 8px;">Delete by Value</button>`
            : `<button class="ds-btn ds-btn-primary" id="ll-btn-ins-head" style="flex:1 1 45%; padding: 8px;">Ins Head</button>
               <button class="ds-btn ds-btn-primary" id="ll-btn-ins-tail" style="flex:1 1 45%; padding: 8px;">Ins Tail</button>
               <button class="ds-btn ds-btn-accent" id="ll-btn-ins-idx" style="flex:1 1 45%; padding: 8px;">Ins Index</button>
               <button class="ds-btn ds-btn-danger" id="ll-btn-del-idx" style="flex:1 1 45%; padding: 8px;">Del Index</button>`
          }
        </div>
      </section>
      <hr class="ds-divider"/>
      <section class="ds-section">
        <div class="ds-section-label">GENERATOR</div>
        <div class="ds-gen-row">
          <label>N =</label>
          <input class="ds-rand-input" id="ll-rand-n" type="number" min="1" max="15" value="5"/>
          <button class="ds-btn ds-btn-green sm" id="ll-btn-gen">Generate</button>
        </div>
      </section>
    `;
  }

  bindEvents(panel, showPopup, T) {
    const valInput = panel.querySelector('#ll-val');
    const idxInput = panel.querySelector('#ll-idx');

    const getVal = () => valInput.value || Math.floor(Math.random() * 100).toString();
    const getIdx = () => idxInput ? parseInt(idxInput.value, 10) : 0;

    const btnInsHead = panel.querySelector('#ll-btn-ins-head');
    if (btnInsHead) btnInsHead.addEventListener('click', () => {
      const val = getVal();
      this.insert(0, val);
      showPopup(`Inserted ${val} at Head`, T.accent);
    });

    const btnInsTail = panel.querySelector('#ll-btn-ins-tail');
    if (btnInsTail) btnInsTail.addEventListener('click', () => {
      const val = getVal();
      this.insert(this.getSize(), val);
      showPopup(`Inserted ${val} at Tail`, T.accent);
    });

    const btnInsIdx = panel.querySelector('#ll-btn-ins-idx');
    if (btnInsIdx) btnInsIdx.addEventListener('click', () => {
      let idx = getIdx();
      const size = this.getSize();
      if (isNaN(idx) || idx < 0 || idx > size) idx = size;
      const val = getVal();
      this.insert(idx, val);
      showPopup(`Inserted ${val} at index ${idx}`, T.accent);
    });

    const btnDelIdx = panel.querySelector('#ll-btn-del-idx');
    if (btnDelIdx) btnDelIdx.addEventListener('click', () => {
      let idx = getIdx();
      const size = this.getSize();
      if (isNaN(idx) || idx < 0 || idx >= size) {
        let defaultIdx = size - 1;
        if (defaultIdx < 0) return;
        idx = defaultIdx;
      }
      const val = this.delete(idx);
      showPopup(`Deleted ${val} at index ${idx}`, T.highlight);
    });

    const btnInsOrd = panel.querySelector('#ll-btn-ins-ord');
    if (btnInsOrd) btnInsOrd.addEventListener('click', () => {
      const val = getVal();
      const numVal = parseInt(val, 10);
      const active = this.nodes.filter(n => !n.isDeleted);
      let idx = 0;
      while (idx < active.length) {
        const currVal = parseInt(active[idx].val, 10);
        if (!isNaN(numVal) && !isNaN(currVal) && numVal <= currVal) break;
        idx++;
      }
      this.insert(idx, val);
      showPopup(`Inserted ${val} at index ${idx}`, T.accent);
    });

    const btnDelVal = panel.querySelector('#ll-btn-del-val');
    if (btnDelVal) btnDelVal.addEventListener('click', () => {
      const val = getVal();
      const active = this.nodes.filter(n => !n.isDeleted);
      const idx = active.findIndex(n => n.val === val);
      if (idx !== -1) {
        this.delete(idx);
        showPopup(`Deleted ${val}`, T.highlight);
      } else {
        showPopup(`Value ${val} not found`, T.highlight);
      }
    });

    panel.querySelector('#ll-btn-gen').addEventListener('click', () => {
      const n = parseInt(panel.querySelector('#ll-rand-n').value, 10) || 5;
      this.nodes = [];
      for(let i=0; i<Math.min(n, 20); i++) {
        const val = Math.floor(Math.random() * 100).toString();
        if (this.type === 'ordered') {
           const active = this.nodes.filter(n => !n.isDeleted);
           let idx = 0;
           const numVal = parseInt(val, 10);
           while (idx < active.length && numVal > parseInt(active[idx].val, 10)) idx++;
           this.insert(idx, val, true);
        } else {
           this.insert(i, val, true);
        }
      }
      showPopup(`Generated List of size ${Math.min(n, 20)}`, T.accent);
    });
  }

  _recalcTargets() {
    const active = this.nodes.filter(n => !n.isDeleted);
    const totalW = active.length * (this.cellW + this.gap) - this.gap;
    const startX = -totalW / 2 + this.cellW / 2;

    active.forEach((n, i) => {
      n.targetX = startX + i * (this.cellW + this.gap);
      n.targetY = 0;
      n.index = i;
    });
  }

  insert(idx, val, instant = false) {
    const active = this.nodes.filter(n => !n.isDeleted);
    
    const newNode = {
      id: this.nextId++,
      val: val,
      x: 0, y: -80,
      targetX: 0, targetY: 0,
      scale: instant ? 1 : 0.1,
      targetScale: 1,
      highlight: 1,
      isDeleted: false
    };

    active.splice(idx, 0, newNode);
    this.nodes = this.nodes.filter(n => n.isDeleted).concat(active);
    this._recalcTargets();

    if (instant) {
      newNode.x = newNode.targetX;
      newNode.y = newNode.targetY;
      newNode.highlight = 0;
    } else {
      newNode.x = newNode.targetX;
    }
  }

  delete(idx) {
    const active = this.nodes.filter(n => !n.isDeleted);
    const node = active[idx];
    if (node) {
      node.isDeleted = true;
      node.targetScale = 0;
      node.targetY = 80;
      this._recalcTargets();
      return node.val;
    }
    return '';
  }

  tick(dt, speedMultiplier) {
    const speed = 8 * speedMultiplier;
    this.nodes.forEach(n => {
      n.x += (n.targetX - n.x) * speed * dt;
      n.y += (n.targetY - n.y) * speed * dt;
      n.scale += (n.targetScale - n.scale) * speed * dt;
      if (n.highlight > 0) {
        n.highlight = Math.max(0, n.highlight - dt * 2 * speedMultiplier);
      }
    });
    this.nodes = this.nodes.filter(n => !n.isDeleted || n.scale > 0.05);
  }

  drawArrow(ctx, x1, y1, x2, y2, color, isDouble = false) {
    const headlen = 10;
    const angle = Math.atan2(y2 - y1, x2 - x1);
    
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Arrowhead at dest
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headlen * Math.cos(angle - Math.PI / 6), y2 - headlen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(x2 - headlen * Math.cos(angle + Math.PI / 6), y2 - headlen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();

    if (isDouble) {
      // Arrowhead at source pointing back
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x1 + headlen * Math.cos(angle - Math.PI / 6), y1 + headlen * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(x1 + headlen * Math.cos(angle + Math.PI / 6), y1 + headlen * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fill();
    }
  }

  drawCurvedArrow(ctx, x1, y1, x2, y2, color) {
    const headlen = 10;
    
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    
    // Control points for a bottom curve
    const cp1x = x1;
    const cp1y = y1 + 100;
    const cp2x = x2;
    const cp2y = y2 + 100;
    
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x2, y2);
    ctx.stroke();

    // Arrow head (approximate angle at the end of the curve)
    // The curve approaches (x2, y2) from below-ish
    const dx = x2 - cp2x;
    const dy = y2 - cp2y;
    const angle = Math.atan2(dy, dx);

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headlen * Math.cos(angle - Math.PI / 6), y2 - headlen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(x2 - headlen * Math.cos(angle + Math.PI / 6), y2 - headlen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
  }

  draw(ctx, T) {
    const active = this.nodes.filter(n => !n.isDeleted);
    
    // Draw edges first so they go behind nodes
    for (let i = 0; i < active.length - 1; i++) {
      const n1 = active[i];
      const n2 = active[i+1];
      
      const x1 = n1.x + (this.cellW / 2) * n1.scale;
      const y1 = n1.y;
      const x2 = n2.x - (this.cellW / 2) * n2.scale - 4; // slight offset for arrow head
      const y2 = n2.y;

      if (this.type === 'doubly') {
        // Draw top line for forward, bottom line for backward
        this.drawArrow(ctx, x1, y1 - 8, x2, y2 - 8, T.pointer, false);
        this.drawArrow(ctx, x2, y2 + 8, x1, y1 + 8, T.pointer, false);
      } else {
        this.drawArrow(ctx, x1, y1, x2, y2, T.pointer, false);
      }
    }

    // Circular Edge
    if (this.type === 'circular' && active.length > 1) {
      const first = active[0];
      const last = active[active.length - 1];
      
      const x1 = last.x + (this.cellW / 2) * last.scale;
      const y1 = last.y + (this.cellH / 2) * last.scale;
      const x2 = first.x;
      const y2 = first.y + (this.cellH / 2) * first.scale + 4;

      this.drawCurvedArrow(ctx, x1, y1, x2, y2, T.pointer);
    }

    // Draw nodes
    this.nodes.forEach(n => {
      ctx.save();
      ctx.translate(n.x, n.y);
      ctx.scale(n.scale, n.scale);

      ctx.fillStyle = T.nodeBg;
      ctx.beginPath();
      // Draw split box (data | next)
      ctx.roundRect(-this.cellW/2, -this.cellH/2, this.cellW, this.cellH, 6);
      ctx.fill();

      // Divider line
      ctx.strokeStyle = T.nodeBorder;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(this.cellW/2 - 20, -this.cellH/2);
      ctx.lineTo(this.cellW/2 - 20, this.cellH/2);
      ctx.stroke();

      if (this.type === 'doubly') {
        ctx.beginPath();
        ctx.moveTo(-this.cellW/2 + 20, -this.cellH/2);
        ctx.lineTo(-this.cellW/2 + 20, this.cellH/2);
        ctx.stroke();
      }

      if (n.highlight > 0) {
        ctx.strokeStyle = T.highlight;
        ctx.lineWidth = 3 + 2 * n.highlight;
        ctx.shadowColor = T.highlight;
        ctx.shadowBlur = 15 * n.highlight;
        ctx.beginPath();
        ctx.roundRect(-this.cellW/2, -this.cellH/2, this.cellW, this.cellH, 6);
        ctx.stroke();
      } else {
        ctx.strokeStyle = T.nodeBorder;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.roundRect(-this.cellW/2, -this.cellH/2, this.cellW, this.cellH, 6);
        ctx.stroke();
      }

      ctx.fillStyle = T.nodeText;
      ctx.font = 'bold 16px JetBrains Mono';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      let textX = 0;
      if (this.type === 'singly' || this.type === 'circular') textX = -10;
      ctx.fillText(n.val, textX, 0);

      // Indicators
      if (!n.isDeleted) {
        ctx.fillStyle = T.accent;
        ctx.font = 'bold 11px JetBrains Mono';
        if (n.index === 0) {
          ctx.fillText('HEAD', 0, -this.cellH/2 - 12);
        }
        if (n.index === active.length - 1) {
          ctx.fillText('TAIL', 0, this.cellH/2 + 16);
        }
      }

      ctx.restore();
    });
  }
}
