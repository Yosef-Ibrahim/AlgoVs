// ═══════════════════════════════════════════════════════════════════════════════
//  AVL Tree Core Logic — STRICTLY PORTED from native BST.js
//  Pure JS module — zero React dependencies
// ═══════════════════════════════════════════════════════════════════════════════

'use strict';

export const NODE_SEP  = 68;
export const LEVEL_SEP = 92;
export const NODE_R    = 24;

export const NODE_COLORS = [
  '#5aa0ff', '#37be73', '#ff913c', '#b450f0',
  '#f54b82', '#2dc3c8', '#e1c828', '#8cd23c',
];

export const THEMES = {
  night: {
    bg:'#0d0f17', panel:'#141826', panelEdge:'#2a344e', accent:'#5aa0ff',
    accent2:'#ff913c', success:'#48d782', danger:'#ff4b4b', textMain:'#e4e9ff',
    textDim:'#697698', nodeShadow:'rgba(0,0,0,0.45)', edgeCol:'#485478', isNight:true,
  },
  light: {
    bg:'#f0f3fc', panel:'#ffffff', panelEdge:'#c3cde1', accent:'#2d6ee6',
    accent2:'#d26414', success:'#1ea05a', danger:'#d22d2d', textMain:'#161c32',
    textDim:'#78829b', nodeShadow:'rgba(0,0,0,0.18)', edgeCol:'#8291af', isNight:false,
  },
};

export const SPEED_TABLE = [3, 9, 22];

export function colA(hex, alpha) {
  if (hex.startsWith('rgba') || hex.startsWith('rgb')) {
    const parts = hex.match(/[\d.]+/g).map(Number);
    return `rgba(${parts[0]},${parts[1]},${parts[2]},${alpha.toFixed(3)})`;
  }
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${alpha.toFixed(3)})`;
}

export class AVLNode {
  constructor(data) {
    this.data = data;
    this.left = null;
    this.right = null;
    this.height = 1;
    this.cur_x = 0; this.cur_y = 0;
    this.tgt_x = 0; this.tgt_y = 0;
    this.isNew = false; this.isRotating = false;
    this.alpha = 0; this.pulseTimer = 0; this.highlightVal = 0;
    this.prelim = 0; this.mod = 0;
  }
}

export class BST {
  constructor() {
    this.root = null;
    this.searchPath = [];
    this.isAVL = true;
  }

  clearTree() { this.root = null; }
  getNodeCount()  { return this._countRec(this.root); }
  getTreeHeight() { return this.root ? this.root.height : 0; }

  insertNode(val) {
    this._lastMsg = '';
    this.root = this._insertRec(this.root, val);
    this._rebuildPositions();
    this._snapNewNodesToCurrent();
    return this._lastMsg;
  }

  deleteNode(val) {
    this._lastMsg = '';
    this.root = this._deleteRec(this.root, val);
    this._rebuildPositions();
    return this._lastMsg;
  }

  getPredecessor(val) {
    this.searchPath = [];
    let cur = this.root, pred = null;
    while (cur) {
      this.searchPath.push(cur.data);
      if (val < cur.data) { cur = cur.left; }
      else if (val > cur.data) { pred = cur; cur = cur.right; }
      else {
        if (cur.left) { let t = this._maxNode(cur.left); this.searchPath.push(t.data); return t.data; }
        break;
      }
    }
    return pred ? pred.data : null;
  }

  getSuccessor(val) {
    this.searchPath = [];
    let cur = this.root, succ = null;
    while (cur) {
      this.searchPath.push(cur.data);
      if (val < cur.data) { succ = cur; cur = cur.left; }
      else if (val > cur.data) { cur = cur.right; }
      else {
        if (cur.right) { let t = this._minNode(cur.right); this.searchPath.push(t.data); return t.data; }
        break;
      }
    }
    return succ ? succ.data : null;
  }

  getPreOrderString()  { const v=[]; this._preV(this.root,v);  return this._fmt(v); }
  getInOrderString()   { const v=[]; this._inV(this.root,v);   return this._fmt(v); }
  getPostOrderString() { const v=[]; this._postV(this.root,v); return this._fmt(v); }
  getBreadthFirstString() {
    const v = [];
    if (this.root) {
      const q = [this.root];
      while (q.length) { const n = q.shift(); v.push(n.data); if (n.left) q.push(n.left); if (n.right) q.push(n.right); }
    }
    return this._fmt(v);
  }

  tickAnimations(dt, lerpSpeed) { this._tickNode(this.root, dt, lerpSpeed); }

  // ── Private AVL helpers ──
  _h(n) { return n ? n.height : 0; }
  _bf(n) { return n ? this._h(n.left) - this._h(n.right) : 0; }
  _uh(n) { if (n) n.height = 1 + Math.max(this._h(n.left), this._h(n.right)); }
  _minNode(n) { while (n && n.left) n = n.left; return n; }
  _maxNode(n) { while (n && n.right) n = n.right; return n; }

  _rotR(y) {
    const x = y.left, t = x.right;
    x.right = y; y.left = t;
    this._uh(y); this._uh(x);
    y.isRotating = x.isRotating = true;
    y.highlightVal = x.highlightVal = 1.0;
    return x;
  }
  _rotL(x) {
    const y = x.right, t = y.left;
    y.left = x; x.right = t;
    this._uh(x); this._uh(y);
    x.isRotating = y.isRotating = true;
    x.highlightVal = y.highlightVal = 1.0;
    return y;
  }

  _insertRec(n, val) {
    if (!n) { const nd = new AVLNode(val); nd.isNew = true; nd.pulseTimer = 1.4; nd.alpha = 0; return nd; }
    if (val < n.data) n.left = this._insertRec(n.left, val);
    else if (val > n.data) n.right = this._insertRec(n.right, val);
    else return n;
    this._uh(n);
    if (this.isAVL) {
      const b = this._bf(n);
      if (b >  1 && val < n.left.data)  { this._lastMsg = 'Right Rotation';      return this._rotR(n); }
      if (b < -1 && val > n.right.data) { this._lastMsg = 'Left Rotation';       return this._rotL(n); }
      if (b >  1 && val > n.left.data)  { this._lastMsg = 'Left-Right Rotation'; n.left = this._rotL(n.left); return this._rotR(n); }
      if (b < -1 && val < n.right.data) { this._lastMsg = 'Right-Left Rotation'; n.right = this._rotR(n.right); return this._rotL(n); }
    }
    return n;
  }

  _deleteRec(n, val) {
    if (!n) return null;
    if (val < n.data) n.left = this._deleteRec(n.left, val);
    else if (val > n.data) n.right = this._deleteRec(n.right, val);
    else {
      if (!n.left || !n.right) {
        const child = n.left || n.right;
        if (!child) return null;
        Object.assign(n, child); n.left = child.left; n.right = child.right;
      } else {
        const s = this._minNode(n.right);
        n.data = s.data;
        n.right = this._deleteRec(n.right, s.data);
      }
    }
    if (!n) return null;
    this._uh(n);
    if (this.isAVL) {
      const b = this._bf(n);
      if (b >  1 && this._bf(n.left) >= 0)  { this._lastMsg = 'Right Rotation (rebalance)';      return this._rotR(n); }
      if (b >  1 && this._bf(n.left) <  0)  { this._lastMsg = 'Left-Right Rotation (rebalance)'; n.left = this._rotL(n.left); return this._rotR(n); }
      if (b < -1 && this._bf(n.right) <= 0) { this._lastMsg = 'Left Rotation (rebalance)';       return this._rotL(n); }
      if (b < -1 && this._bf(n.right) >  0) { this._lastMsg = 'Right-Left Rotation (rebalance)'; n.right = this._rotR(n.right); return this._rotL(n); }
    }
    return n;
  }

  _rebuildPositions() {
    if (!this.root) return;
    this._firstWalk(this.root);
    this._secondWalk(this.root, 0, 0);
  }

  _rightContour(n, modAcc, depth, cont) {
    if (!n) return;
    const absX = n.prelim + modAcc;
    if (cont.length <= depth) cont.push(absX); else cont[depth] = Math.max(cont[depth], absX);
    this._rightContour(n.left, modAcc + n.mod, depth + 1, cont);
    this._rightContour(n.right, modAcc + n.mod, depth + 1, cont);
  }
  _leftContour(n, modAcc, depth, cont) {
    if (!n) return;
    const absX = n.prelim + modAcc;
    if (cont.length <= depth) cont.push(absX); else cont[depth] = Math.min(cont[depth], absX);
    this._leftContour(n.left, modAcc + n.mod, depth + 1, cont);
    this._leftContour(n.right, modAcc + n.mod, depth + 1, cont);
  }

  _firstWalk(n) {
    n.prelim = 0; n.mod = 0;
    if (!n.left && !n.right) return;
    if (n.left) this._firstWalk(n.left);
    if (n.right) this._firstWalk(n.right);
    if (n.left && n.right) {
      const rc = [], lc = [];
      this._rightContour(n.left, 0, 0, rc);
      this._leftContour(n.right, 0, 0, lc);
      let shift = 0;
      const levels = Math.min(rc.length, lc.length);
      for (let i = 0; i < levels; i++) shift = Math.max(shift, (rc[i] - lc[i]) + NODE_SEP);
      if (shift < NODE_SEP) shift = NODE_SEP;
      n.left.prelim = -shift * 0.5; n.right.prelim = shift * 0.5;
      n.left.mod = n.left.prelim; n.right.mod = n.right.prelim;
      n.prelim = 0;
    } else if (n.left) { n.prelim = n.left.prelim; }
    else { n.prelim = n.right.prelim; }
  }

  _secondWalk(n, modAcc, depth) {
    if (!n) return;
    n.tgt_x = n.prelim + modAcc;
    n.tgt_y = depth * LEVEL_SEP;
    this._secondWalk(n.left, modAcc + n.mod, depth + 1);
    this._secondWalk(n.right, modAcc + n.mod, depth + 1);
  }

  _snapNewNodesToCurrent() { this._snapNew(this.root); }
  _snapNew(n) {
    if (!n) return;
    if (n.isNew && n.alpha < 0.05) { n.cur_x = n.tgt_x; n.cur_y = n.tgt_y; }
    this._snapNew(n.left); this._snapNew(n.right);
  }

  _tickNode(n, dt, lerpSpeed) {
    if (!n) return;
    const t = 1 - Math.exp(-lerpSpeed * dt);
    n.cur_x += (n.tgt_x - n.cur_x) * t;
    n.cur_y += (n.tgt_y - n.cur_y) * t;
    if (n.alpha < 1) n.alpha = Math.min(1, n.alpha + dt * lerpSpeed * 0.35);
    if (n.pulseTimer > 0) { n.pulseTimer -= dt; if (n.pulseTimer <= 0) { n.pulseTimer = 0; n.isNew = false; } }
    if (n.highlightVal > 0) { n.highlightVal -= dt * 0.9; if (n.highlightVal <= 0) { n.highlightVal = 0; n.isRotating = false; } }
    this._tickNode(n.left, dt, lerpSpeed);
    this._tickNode(n.right, dt, lerpSpeed);
  }

  _preV(n, v)  { if (!n) return; v.push(n.data); this._preV(n.left,v); this._preV(n.right,v); }
  _inV(n, v)   { if (!n) return; this._inV(n.left,v); v.push(n.data); this._inV(n.right,v); }
  _postV(n, v) { if (!n) return; this._postV(n.left,v); this._postV(n.right,v); v.push(n.data); }
  _fmt(v) { return !v.length ? '[ Empty Tree ]' : '[ ' + v.join(',  ') + ' ]'; }
  _countRec(n) { return n ? 1 + this._countRec(n.left) + this._countRec(n.right) : 0; }
}

export function drawTree(ctx, node, depth, searchPath, T) {
  if (!node) return;
  const cx = node.cur_x, cy = node.cur_y, a = node.alpha;

  if (node.left) {
    const ea = Math.min(a, node.left.alpha);
    ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(node.left.cur_x,node.left.cur_y);
    ctx.strokeStyle = colA(T.edgeCol, ea*0.82); ctx.lineWidth = 2.4; ctx.stroke();
    drawTree(ctx, node.left, depth+1, searchPath, T);
  }
  if (node.right) {
    const ea = Math.min(a, node.right.alpha);
    ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(node.right.cur_x,node.right.cur_y);
    ctx.strokeStyle = colA(T.edgeCol, ea*0.82); ctx.lineWidth = 2.4; ctx.stroke();
    drawTree(ctx, node.right, depth+1, searchPath, T);
  }

  const base = NODE_COLORS[depth % 8];

  if (node.isNew && node.pulseTimer > 0) {
    const p = Math.sin(node.pulseTimer*7)*0.5+0.5;
    ctx.beginPath(); ctx.arc(cx,cy,NODE_R+p*12,0,Math.PI*2);
    ctx.fillStyle = colA(base,0.22*a); ctx.fill();
  }
  if (node.isRotating && node.highlightVal > 0) {
    ctx.beginPath(); ctx.arc(cx,cy,NODE_R+12,0,Math.PI*2);
    ctx.fillStyle = colA('#ffc832',node.highlightVal*0.5*a); ctx.fill();
  }
  if (searchPath.includes(node.data)) {
    ctx.beginPath(); ctx.arc(cx,cy,NODE_R+9,0,Math.PI*2);
    ctx.fillStyle = colA('#ffe628',0.42*a); ctx.fill();
  }

  ctx.beginPath(); ctx.arc(cx+3,cy+4,NODE_R,0,Math.PI*2);
  ctx.fillStyle = colA(T.nodeShadow,a*0.5); ctx.fill();
  ctx.beginPath(); ctx.arc(cx,cy,NODE_R,0,Math.PI*2);
  ctx.fillStyle = colA(base,a); ctx.fill();
  ctx.beginPath(); ctx.arc(cx-5,cy-6,10,0,Math.PI*2);
  ctx.fillStyle = colA('#ffffff',0.08*a); ctx.fill();
  ctx.beginPath(); ctx.arc(cx,cy,NODE_R,0,Math.PI*2);
  ctx.strokeStyle = colA('#ffffff',0.18*a); ctx.lineWidth = 1.4; ctx.stroke();

  const val = String(node.data);
  const fs = val.length > 4 ? 11 : val.length > 3 ? 13 : val.length > 2 ? 15 : 18;
  ctx.font = `700 ${fs}px 'JetBrains Mono', monospace`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = colA('#ffffff',a); ctx.fillText(val,cx,cy+1);

  ctx.font = `600 11px 'Space Grotesk', sans-serif`;
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = colA(T.textDim,0.7*a);
  ctx.fillText('h'+node.height, cx+NODE_R-2, cy-NODE_R+2);
}
