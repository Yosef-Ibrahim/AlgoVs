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

  clear() {
    this.nodes.forEach(n => { n.isDeleted = true; n.targetY = -200; n.targetScale = 0; });
  }

  getOpsCode() {
    return {
      push: {
        js: [
          'function push(stack, val) {',
          '  stack[++top] = val;',
          '  // O(1) — add to top',
          '}',
        ],
        python: [
          'def push(stack, val):',
          '    stack.append(val)',
          '    # O(1) — add to top',
        ],
      },
      pop: {
        js: [
          'function pop(stack) {',
          '  if (top < 0) throw "Underflow";',
          '  let val = stack[top];',
          '  top--;',
          '  return val; // O(1)',
          '}',
        ],
        python: [
          'def pop(stack):',
          '    if not stack: raise "Underflow"',
          '    val = stack[-1]',
          '    stack.pop()',
          '    return val  # O(1)',
        ],
      },
      peek: {
        js: [
          'function peek(stack) {',
          '  if (top < 0) return null;',
          '  return stack[top]; // O(1)',
          '}',
        ],
        python: [
          'def peek(stack):',
          '    if not stack: return None',
          '    return stack[-1]  # O(1)',
        ],
      },
    };
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

  bindEvents(panel, showPopup, T, runSteps) {
    const valInput = panel.querySelector('#st-val');
    const getVal = () => valInput.value || Math.floor(Math.random() * 100).toString();
    const code = this.getOpsCode();

    panel.querySelector('#st-btn-push').addEventListener('click', () => {
      const val = getVal();
      const size = this.getSize();
      runSteps(code.push, [
        { line: 0, msg: `push(stack, "${val}")` },
        { line: 1, msg: `top = ${size}, placing "${val}" at stack[${size}]`, action: () => { this.push(val); showPopup(`Pushed ${val}`, T.accent); } },
        { line: 2, msg: '✓ O(1) — added to top' },
        { line: 3, msg: '✓ Push complete' },
      ]);
    });

    panel.querySelector('#st-btn-pop').addEventListener('click', () => {
      if (this.getSize() === 0) { showPopup(`Stack Underflow!`, T.highlight); return; }
      const active = this.nodes.filter(n => !n.isDeleted);
      const topNode = active[active.length - 1];
      const topVal = topNode ? topNode.val : '?';
      runSteps(code.pop, [
        { line: 0, msg: `pop(stack)` },
        { line: 1, msg: `top = ${this.getSize() - 1}, stack not empty` },
        { line: 2, msg: `val = stack[top] = "${topVal}"` },
        { line: 3, msg: `top-- → ${this.getSize() - 2}`, action: () => { this.pop(); showPopup(`Popped ${topVal}`, T.highlight); } },
        { line: 4, msg: `✓ Returned "${topVal}" — O(1)` },
        { line: 5, msg: '✓ Pop complete' },
      ]);
    });

    panel.querySelector('#st-btn-peek').addEventListener('click', () => {
      const active = this.nodes.filter(n => !n.isDeleted);
      if (active.length === 0) { showPopup(`Stack is empty`, T.highlight); return; }
      const top = active[active.length - 1];
      runSteps(code.peek, [
        { line: 0, msg: `peek(stack)` },
        { line: 1, msg: `top = ${active.length - 1}, stack not empty` },
        { line: 2, msg: `Return stack[top] = "${top.val}" — O(1)`, action: () => { top.highlight = 1; top.scale = 1.1; showPopup(`Peeked ${top.val}`, '#f59e0b'); } },
        { line: 3, msg: '✓ Peek complete' },
      ]);
    });

    panel.querySelector('#st-btn-gen').addEventListener('click', () => {
      const n = parseInt(panel.querySelector('#st-rand-n').value, 10) || 5;
      this.clear();
      setTimeout(() => {
        this.nodes = [];
        for (let i = 0; i < Math.min(n, 30); i++)
          this.push(Math.floor(Math.random() * 100).toString(), true);
        showPopup(`Generated Stack of size ${Math.min(n, 30)}`, T.accent);
      }, 300);
    });
  }

  _recalcTargets() {
    const active = this.nodes.filter(n => !n.isDeleted);
    const totalH = active.length * (this.cellH + this.gap) - this.gap;
    const startY = totalH / 2 - this.cellH / 2;
    active.forEach((n, i) => {
      n.targetX = 0;
      n.targetY = startY - i * (this.cellH + this.gap);
      n.index = i;
    });
  }

  push(val, instant = false) {
    const newNode = {
      id: this.nextId++, val,
      x: 0, y: -200, targetX: 0, targetY: 0,
      scale: instant ? 1 : 0.8, targetScale: 1,
      highlight: 1, isDeleted: false,
    };
    this.nodes.push(newNode);
    this._recalcTargets();
    if (instant) { newNode.y = newNode.targetY; newNode.scale = 1; newNode.highlight = 0; }
  }

  pop() {
    const active = this.nodes.filter(n => !n.isDeleted);
    const top = active[active.length - 1];
    if (top) { top.isDeleted = true; top.targetY = -200; top.targetScale = 0; this._recalcTargets(); return top.val; }
    return '';
  }

  tick(dt, speedMultiplier) {
    const speed = 8 * speedMultiplier;
    this.nodes.forEach(n => {
      n.x += (n.targetX - n.x) * speed * dt;
      n.y += (n.targetY - n.y) * speed * dt;
      n.scale += (n.targetScale - n.scale) * speed * dt;
      if (n.highlight > 0) n.highlight = Math.max(0, n.highlight - dt * 2 * speedMultiplier);
    });
    this.nodes = this.nodes.filter(n => !n.isDeleted || n.scale > 0.05);
  }

  draw(ctx, T) {
    const active = this.nodes.filter(n => !n.isDeleted);
    const totalH = active.length * (this.cellH + this.gap) - this.gap;
    const baseY = totalH / 2 + this.cellH / 2 + 10;
    
    // Base line
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
      ctx.beginPath();
      ctx.roundRect(-this.cellW/2, -this.cellH/2, this.cellW, this.cellH, 4);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Value
      ctx.fillStyle = T.nodeText;
      ctx.font = 'bold 14px JetBrains Mono';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(n.val, 0, 0);

      // Index + TOP indicator
      if (!n.isDeleted) {
        // Index on left side
        ctx.fillStyle = T.pointer;
        ctx.font = 'bold 10px JetBrains Mono';
        ctx.textAlign = 'right';
        ctx.fillText(`[${n.index}]`, -this.cellW/2 - 8, 0);

        if (n.index === active.length - 1) {
          ctx.fillStyle = T.accent;
          ctx.font = 'bold 12px JetBrains Mono';
          ctx.textAlign = 'left';
          ctx.fillText('← TOP', this.cellW/2 + 10, 0);
        }
      }

      ctx.restore();
    });
  }
}
