export class QueueDS {
  constructor() {
    this.nodes = [];
    this.nextId = 1;
    this.cellW = 80;
    this.cellH = 80;
    this.gap = 8;
  }

  getSize() {
    return this.nodes.filter(n => !n.isDeleted).length;
  }

  clear() {
    this.nodes.forEach(n => { n.isDeleted = true; n.targetX = -300; n.targetScale = 0; });
  }

  getOpsCode() {
    return {
      enqueue: {
        js: [
          'function enqueue(queue, val) {',
          '  queue[rear] = val;',
          '  rear++;',
          '  // O(1) — add to rear',
          '}',
        ],
        python: [
          'def enqueue(queue, val):',
          '    queue.append(val)',
          '    # O(1) — add to rear',
        ],
      },
      dequeue: {
        js: [
          'function dequeue(queue) {',
          '  if (front > rear) throw "Empty";',
          '  let val = queue[front];',
          '  front++;',
          '  return val; // O(1)',
          '}',
        ],
        python: [
          'def dequeue(queue):',
          '    if not queue: raise "Empty"',
          '    val = queue[0]',
          '    queue.pop(0)',
          '    return val  # O(1)',
        ],
      },
      peek: {
        js: [
          'function peekFront(queue) {',
          '  if (front > rear) return null;',
          '  return queue[front]; // O(1)',
          '}',
        ],
        python: [
          'def peek_front(queue):',
          '    if not queue: return None',
          '    return queue[0]  # O(1)',
        ],
      },
    };
  }

  getHTMLControls() {
    return `
      <section class="ds-section">
        <div class="ds-section-label">QUEUE OPERATIONS</div>
        <div class="ds-input-row">
          <input class="ds-val-input" id="q-val" type="text" placeholder="Value" autocomplete="off"/>
        </div>
        <div style="display:flex; gap:8px; margin-top: 12px;">
          <button class="ds-btn ds-btn-accent" id="q-btn-enq" style="flex:1">Enqueue</button>
          <button class="ds-btn ds-btn-danger" id="q-btn-deq" style="flex:1">Dequeue</button>
        </div>
        <button class="ds-btn ds-btn-orange" id="q-btn-peek" style="margin-top: 8px;">Peek Front</button>
      </section>
      <hr class="ds-divider"/>
      <section class="ds-section">
        <div class="ds-section-label">GENERATOR</div>
        <div class="ds-gen-row">
          <label>N =</label>
          <input class="ds-rand-input" id="q-rand-n" type="number" min="1" max="20" value="5"/>
          <button class="ds-btn ds-btn-green sm" id="q-btn-gen">Generate</button>
        </div>
      </section>
    `;
  }

  bindEvents(panel, showPopup, T, runSteps) {
    const valInput = panel.querySelector('#q-val');
    const getVal = () => valInput.value || Math.floor(Math.random() * 100).toString();
    const code = this.getOpsCode();

    panel.querySelector('#q-btn-enq').addEventListener('click', () => {
      const val = getVal();
      const size = this.getSize();
      runSteps(code.enqueue, [
        { line: 0, msg: `enqueue(queue, "${val}")` },
        { line: 1, msg: `Place "${val}" at rear position ${size}`, action: () => { this.enqueue(val); showPopup(`Enqueued ${val}`, T.accent); } },
        { line: 2, msg: `rear++ → ${size + 1}` },
        { line: 3, msg: '✓ O(1) — added to rear' },
        { line: 4, msg: '✓ Enqueue complete' },
      ]);
    });

    panel.querySelector('#q-btn-deq').addEventListener('click', () => {
      if (this.getSize() === 0) { showPopup(`Queue is Empty!`, T.highlight); return; }
      const active = this.nodes.filter(n => !n.isDeleted);
      const frontVal = active[0] ? active[0].val : '?';
      runSteps(code.dequeue, [
        { line: 0, msg: `dequeue(queue)` },
        { line: 1, msg: `Queue not empty, front = 0` },
        { line: 2, msg: `val = queue[front] = "${frontVal}"` },
        { line: 3, msg: `front++`, action: () => { this.dequeue(); showPopup(`Dequeued ${frontVal}`, T.highlight); } },
        { line: 4, msg: `✓ Returned "${frontVal}" — O(1)` },
        { line: 5, msg: '✓ Dequeue complete' },
      ]);
    });

    panel.querySelector('#q-btn-peek').addEventListener('click', () => {
      const active = this.nodes.filter(n => !n.isDeleted);
      if (active.length === 0) { showPopup(`Queue is empty`, T.highlight); return; }
      const front = active[0];
      runSteps(code.peek, [
        { line: 0, msg: `peekFront(queue)` },
        { line: 1, msg: `Queue not empty` },
        { line: 2, msg: `Return queue[front] = "${front.val}" — O(1)`, action: () => { front.highlight = 1; front.scale = 1.1; showPopup(`Peeked Front: ${front.val}`, '#f59e0b'); } },
        { line: 3, msg: '✓ Peek complete' },
      ]);
    });

    panel.querySelector('#q-btn-gen').addEventListener('click', () => {
      const n = parseInt(panel.querySelector('#q-rand-n').value, 10) || 5;
      this.clear();
      setTimeout(() => {
        this.nodes = [];
        for (let i = 0; i < Math.min(n, 30); i++)
          this.enqueue(Math.floor(Math.random() * 100).toString(), true);
        showPopup(`Generated Queue of size ${Math.min(n, 30)}`, T.accent);
      }, 300);
    });
  }

  _recalcTargets() {
    const active = this.nodes.filter(n => !n.isDeleted);
    const totalW = active.length * (this.cellW + this.gap) - this.gap;
    const startX = totalW / 2 - this.cellW / 2;
    active.forEach((n, i) => {
      n.targetX = -startX + i * (this.cellW + this.gap);
      n.targetY = 0;
      n.index = i;
    });
  }

  enqueue(val, instant = false) {
    const newNode = {
      id: this.nextId++, val,
      x: 300, y: 0, targetX: 0, targetY: 0,
      scale: instant ? 1 : 0.5, targetScale: 1,
      highlight: 1, isDeleted: false,
    };
    this.nodes.push(newNode);
    this._recalcTargets();
    if (instant) { newNode.x = newNode.targetX; newNode.scale = 1; newNode.highlight = 0; }
  }

  dequeue() {
    const active = this.nodes.filter(n => !n.isDeleted);
    const front = active[0];
    if (front) { front.isDeleted = true; front.targetX = -300; front.targetScale = 0; this._recalcTargets(); return front.val; }
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

    this.nodes.forEach(n => {
      ctx.save();
      ctx.translate(n.x, n.y);
      ctx.scale(n.scale, n.scale);

      ctx.beginPath();
      ctx.arc(0, 0, this.cellW/2, 0, Math.PI*2);
      ctx.fillStyle = T.nodeBg;
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

      // Value
      ctx.fillStyle = T.nodeText;
      ctx.font = 'bold 18px JetBrains Mono';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(n.val, 0, -2);

      // Index inside node (small, at bottom)
      if (!n.isDeleted) {
        ctx.fillStyle = T.pointer;
        ctx.font = 'bold 10px JetBrains Mono';
        ctx.fillText(`[${n.index}]`, 0, 16);
      }

      // Indicators
      if (!n.isDeleted) {
        if (n.index === 0) {
          ctx.fillStyle = T.accent;
          ctx.font = 'bold 11px JetBrains Mono';
          ctx.fillText('FRONT', 0, -this.cellH/2 - 12);
        }
        if (n.index === active.length - 1) {
          ctx.fillStyle = '#f59e0b';
          ctx.font = 'bold 11px JetBrains Mono';
          ctx.fillText('REAR', 0, this.cellH/2 + 14);
        }
      }

      ctx.restore();
    });
  }
}
