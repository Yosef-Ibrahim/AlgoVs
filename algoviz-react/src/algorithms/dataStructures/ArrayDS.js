export class ArrayDS {
  constructor() {
    this.nodes = [];
    this.nextId = 1;
    this.cellW = 60;
    this.cellH = 60;
    this.gap = 4;
  }

  getSize() {
    return this.nodes.filter(n => !n.isDeleted).length;
  }

  getHTMLControls() {
    return `
      <section class="ds-section">
        <div class="ds-section-label">ARRAY OPERATIONS</div>
        <div class="ds-input-row">
          <input class="ds-val-input" id="arr-val" type="text" placeholder="Value (e.g. 42)" autocomplete="off"/>
        </div>
        <div class="ds-input-row" style="margin-top: 8px;">
          <input class="ds-val-input" id="arr-idx" type="number" placeholder="Index (opt)" min="0" autocomplete="off"/>
        </div>
        <div style="display:flex; gap:8px; margin-top: 12px;">
          <button class="ds-btn ds-btn-accent" id="arr-btn-insert" style="flex:1">Insert</button>
          <button class="ds-btn ds-btn-primary" id="arr-btn-set" style="flex:1">Set</button>
        </div>
        <button class="ds-btn ds-btn-danger" id="arr-btn-delete" style="margin-top: 8px;">Delete at Index</button>
      </section>
      <hr class="ds-divider"/>
      <section class="ds-section">
        <div class="ds-section-label">GENERATOR</div>
        <div class="ds-gen-row">
          <label>N =</label>
          <input class="ds-rand-input" id="arr-rand-n" type="number" min="1" max="50" value="10"/>
          <button class="ds-btn ds-btn-green sm" id="arr-btn-gen">Generate</button>
        </div>
      </section>
    `;
  }

  bindEvents(panel, showPopup, T) {
    const valInput = panel.querySelector('#arr-val');
    const idxInput = panel.querySelector('#arr-idx');

    const getVal = () => valInput.value || Math.floor(Math.random() * 100).toString();
    const getIdx = () => parseInt(idxInput.value, 10);

    panel.querySelector('#arr-btn-insert').addEventListener('click', () => {
      let idx = getIdx();
      const val = getVal();
      const size = this.getSize();
      if (isNaN(idx) || idx < 0 || idx > size) idx = size;
      this.insert(idx, val);
      showPopup(`Inserted ${val} at index ${idx}`, T.accent);
    });

    panel.querySelector('#arr-btn-set').addEventListener('click', () => {
      let idx = getIdx();
      const val = getVal();
      const size = this.getSize();
      if (isNaN(idx) || idx < 0 || idx >= size) {
        showPopup(`Invalid index for Set`, T.highlight);
        return;
      }
      this.setVal(idx, val);
      showPopup(`Set index ${idx} to ${val}`, T.accent);
    });

    panel.querySelector('#arr-btn-delete').addEventListener('click', () => {
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

    panel.querySelector('#arr-btn-gen').addEventListener('click', () => {
      const n = parseInt(panel.querySelector('#arr-rand-n').value, 10) || 10;
      this.nodes = [];
      for(let i=0; i<Math.min(n, 50); i++) {
        this.insert(i, Math.floor(Math.random() * 100).toString(), true);
      }
      showPopup(`Generated Array of size ${Math.min(n, 50)}`, T.accent);
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
    
    // Rebuild main array to keep order
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

  setVal(idx, val) {
    const active = this.nodes.filter(n => !n.isDeleted);
    if (active[idx]) {
      active[idx].val = val;
      active[idx].highlight = 1;
      active[idx].scale = 1.2;
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
    // Remove fully deleted nodes
    this.nodes = this.nodes.filter(n => !n.isDeleted || n.scale > 0.05);
  }

  draw(ctx, T) {
    this.nodes.forEach(n => {
      ctx.save();
      ctx.translate(n.x, n.y);
      ctx.scale(n.scale, n.scale);

      // Box
      ctx.fillStyle = T.nodeBg;
      ctx.beginPath();
      ctx.roundRect(-this.cellW/2, -this.cellH/2, this.cellW, this.cellH, 6);
      ctx.fill();

      // Border / Highlight
      if (n.highlight > 0) {
        ctx.strokeStyle = T.highlight;
        ctx.lineWidth = 3 + 2 * n.highlight;
        ctx.shadowColor = T.highlight;
        ctx.shadowBlur = 15 * n.highlight;
      } else {
        ctx.strokeStyle = T.nodeBorder;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 0;
      }
      ctx.stroke();
      ctx.shadowBlur = 0; // reset

      // Value
      ctx.fillStyle = T.nodeText;
      ctx.font = 'bold 20px JetBrains Mono';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(n.val, 0, 0);

      // Index
      if (!n.isDeleted) {
        ctx.fillStyle = T.pointer;
        ctx.font = '12px JetBrains Mono';
        ctx.fillText(n.index, 0, this.cellH/2 + 16);
      }

      ctx.restore();
    });
  }
}
