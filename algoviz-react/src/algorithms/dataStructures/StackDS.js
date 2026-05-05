export class StackDS {
  constructor() {
    this.nodes = [];
    this.nextId = 1;
    this.cellW = 120;
    this.cellH = 40;
    this.gap = 4;
  }

  getSize() {
    return this.nodes.filter(n => !n.isDeleted).length;
  }

  getHTMLControls() {
    return `
      <section class="ds-section">
        <div class="ds-section-label">STACK OPERATIONS</div>
        <div class="ds-input-row">
          <input class="ds-val-input" id="st-val" type="text" placeholder="Value" autocomplete="off"/>
        </div>
        <div style="display:flex; gap:8px; margin-top: 12px;">
          <button class="ds-btn ds-btn-accent" id="st-btn-push" style="flex:1">Push</button>
          <button class="ds-btn ds-btn-danger" id="st-btn-pop" style="flex:1">Pop</button>
        </div>
        <button class="ds-btn ds-btn-orange" id="st-btn-peek" style="margin-top: 8px;">Peek</button>
      </section>
      <hr class="ds-divider"/>
      <section class="ds-section">
        <div class="ds-section-label">GENERATOR</div>
        <div class="ds-gen-row">
          <label>N =</label>
          <input class="ds-rand-input" id="st-rand-n" type="number" min="1" max="20" value="5"/>
          <button class="ds-btn ds-btn-green sm" id="st-btn-gen">Generate</button>
        </div>
      </section>
    `;
  }

  bindEvents(panel, showPopup, T) {
    const valInput = panel.querySelector('#st-val');
    const getVal = () => valInput.value || Math.floor(Math.random() * 100).toString();

    panel.querySelector('#st-btn-push').addEventListener('click', () => {
      const val = getVal();
      this.push(val);
      showPopup(`Pushed ${val}`, T.accent);
    });

    panel.querySelector('#st-btn-pop').addEventListener('click', () => {
      if (this.getSize() === 0) {
        showPopup(`Stack Underflow!`, T.highlight);
        return;
      }
      const val = this.pop();
      showPopup(`Popped ${val}`, T.highlight);
    });

    panel.querySelector('#st-btn-peek').addEventListener('click', () => {
      const active = this.nodes.filter(n => !n.isDeleted);
      if (active.length === 0) {
        showPopup(`Stack is empty`, T.highlight);
        return;
      }
      const top = active[active.length - 1];
      top.highlight = 1;
      top.scale = 1.1;
      showPopup(`Peeked ${top.val}`, '#f59e0b');
    });

    panel.querySelector('#st-btn-gen').addEventListener('click', () => {
      const n = parseInt(panel.querySelector('#st-rand-n').value, 10) || 5;
      this.nodes = [];
      for(let i=0; i<Math.min(n, 30); i++) {
        this.push(Math.floor(Math.random() * 100).toString(), true);
      }
      showPopup(`Generated Stack of size ${Math.min(n, 30)}`, T.accent);
    });
  }

  _recalcTargets() {
    const active = this.nodes.filter(n => !n.isDeleted);
    const totalH = active.length * (this.cellH + this.gap) - this.gap;
    const startY = totalH / 2 - this.cellH / 2;

    // In a stack, index 0 is bottom, last is top.
    // Drawing bottom-up means index 0 has the highest Y (lowest on screen).
    active.forEach((n, i) => {
      n.targetX = 0;
      n.targetY = startY - i * (this.cellH + this.gap);
      n.index = i;
    });
  }

  push(val, instant = false) {
    const newNode = {
      id: this.nextId++,
      val: val,
      x: 0, y: -200, // Drop from top
      targetX: 0, targetY: 0,
      scale: instant ? 1 : 0.8,
      targetScale: 1,
      highlight: 1,
      isDeleted: false
    };

    this.nodes.push(newNode);
    this._recalcTargets();

    if (instant) {
      newNode.y = newNode.targetY;
      newNode.scale = 1;
      newNode.highlight = 0;
    }
  }

  pop() {
    const active = this.nodes.filter(n => !n.isDeleted);
    const top = active[active.length - 1];
    if (top) {
      top.isDeleted = true;
      top.targetY = -200; // Fly up
      top.targetScale = 0;
      this._recalcTargets();
      return top.val;
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

  draw(ctx, T) {
    // Draw base line
    const active = this.nodes.filter(n => !n.isDeleted);
    const totalH = active.length * (this.cellH + this.gap) - this.gap;
    const baseY = totalH / 2 + this.cellH / 2 + 10;
    
    ctx.strokeStyle = T.pointer;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-this.cellW/2 - 20, baseY);
    ctx.lineTo(this.cellW/2 + 20, baseY);
    ctx.stroke();

    this.nodes.forEach(n => {
      ctx.save();
      ctx.translate(n.x, n.y);
      ctx.scale(n.scale, n.scale);

      ctx.fillStyle = T.nodeBg;
      ctx.beginPath();
      ctx.roundRect(-this.cellW/2, -this.cellH/2, this.cellW, this.cellH, 4);
      ctx.fill();

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
      ctx.shadowBlur = 0;

      ctx.fillStyle = T.nodeText;
      ctx.font = 'bold 16px JetBrains Mono';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(n.val, 0, 0);

      // Top indicator
      if (!n.isDeleted && n.index === active.length - 1) {
        ctx.fillStyle = T.accent;
        ctx.font = 'bold 12px JetBrains Mono';
        ctx.fillText('← TOP', this.cellW/2 + 30, 0);
      }

      ctx.restore();
    });
  }
}
