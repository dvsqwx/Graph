'use strict';

const VRAD = 18;

const DIR_THEME = {
    edge: '#000',
    nodeFill: '#fff',
    nodeStroke: '#000',
    nodeText: '#000',
};

const UNDIR_THEME = {
    edge: '#000',
    nodeFill: '#fff',
    nodeStroke: '#000',
    nodeText: '#000',
};

function getPositions(n, n4, W, H) {
    const cx = W / 2, cy = H / 2;
    const R = Math.min(W, H) * 0.37;
    const pos = [];

    if (n4 <= 1) {
        for (let i = 0; i < n; i++) {
            const a = (2 * Math.PI * i / n) - Math.PI / 2;
            pos.push([cx + R * Math.cos(a), cy + R * Math.sin(a)]);
        }
    } else if (n4 <= 3) {
        distributeOnRect(n, cx - W * 0.36, cy - H * 0.36, W * 0.72, H * 0.72, pos);
    } else if (n4 <= 5) {
        const tv = [
            [cx,           cy - R * 1.1],
            [cx - R * 0.95, cy + R * 0.65],
            [cx + R * 0.95, cy + R * 0.65],
        ];
        distributeOnTriangle(n, tv, pos);
    } else if (n4 <= 7) {
        pos.push([cx, cy]);
        for (let i = 0; i < n - 1; i++) {
            const a = (2 * Math.PI * i / (n - 1)) - Math.PI / 2;
            pos.push([cx + R * Math.cos(a), cy + R * Math.sin(a)]);
        }
    } else {
        pos.push([cx, cy]);
        distributeOnRect(n - 1, cx - W * 0.36, cy - H * 0.36, W * 0.72, H * 0.72, pos);
    }

    return pos;
}

function distributeOnRect(n, x0, y0, w, h, pos) {
    const perim = 2 * (w + h);
    for (let i = 0; i < n; i++) {
        const t = (i / n) * perim;
        if (t < w)            pos.push([x0 + t,               y0]);
        else if (t < w + h)   pos.push([x0 + w,               y0 + (t - w)]);
        else if (t < 2*w + h) pos.push([x0 + w - (t - w - h), y0 + h]);
        else                  pos.push([x0,                   y0 + h - (t - 2*w - h)]);
    }
}

function distributeOnTriangle(n, verts, pos) {
    const perSide = n / 3;
    for (let i = 0; i < n; i++) {
        const s = Math.min(Math.floor(i / perSide), 2);
        const t = (i - s * perSide) / perSide;
        const [x1, y1] = verts[s];
        const [x2, y2] = verts[(s + 1) % 3];
        pos.push([x1 + (x2 - x1) * t, y1 + (y2 - y1) * t]);
    }
}

function drawArrowHead(ctx, x, y, angle) {
    const s = 11, sp = 0.38;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - s * Math.cos(angle - sp), y - s * Math.sin(angle - sp));
    ctx.moveTo(x, y);
    ctx.lineTo(x - s * Math.cos(angle + sp), y - s * Math.sin(angle + sp));
    ctx.stroke();
}

function drawSelfLoop(ctx, x, y, directed) {
    const r = 15;
    const ox = x + VRAD * 0.7, oy = y - VRAD * 0.7;
    ctx.beginPath();
    ctx.arc(ox, oy, r, 0, 2 * Math.PI);
    ctx.stroke();
    if (directed) {
        const ax = ox + r * Math.cos(2.4);
        const ay = oy + r * Math.sin(2.4);
        drawArrowHead(ctx, ax, ay, 2.4 + Math.PI / 2);
    }
}

function drawEdge(ctx, x1, y1, x2, y2, directed) {
    const dx = x2 - x1, dy = y2 - y1;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 1) return;

    const nx = dx / dist, ny = dy / dist;
    const sx = x1 + nx * VRAD, sy = y1 + ny * VRAD;
    const ex = x2 - nx * VRAD, ey = y2 - ny * VRAD;

    const offset = 28;
    const cpx = (sx + ex) / 2 - ny * offset;
    const cpy = (sy + ey) / 2 + nx * offset;

    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.quadraticCurveTo(cpx, cpy, ex, ey);
    ctx.stroke();

    if (directed) {
        const t = 0.97;
        const tx = 2 * (1 - t) * (cpx - sx) + 2 * t * (ex - cpx);
        const ty = 2 * (1 - t) * (cpy - sy) + 2 * t * (ey - cpy);
        drawArrowHead(ctx, ex, ey, Math.atan2(ty, tx));
    }
}

function renderGraph(canvas, n, n4, A, directed, theme) {
    const W = canvas.width, H = canvas.height;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);

    const pos = getPositions(n, n4, W, H);

    ctx.strokeStyle = theme.edge;
    ctx.lineWidth = 1.8;

    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            if (!A[i][j]) continue;
            if (i === j) {
                drawSelfLoop(ctx, pos[i][0], pos[i][1], directed);
                continue;
            }
            if (!directed && j < i) continue;
            drawEdge(ctx, pos[i][0], pos[i][1], pos[j][0], pos[j][1], directed);
        }
    }

    for (let i = 0; i < n; i++) {
        const [x, y] = pos[i];
        ctx.beginPath();
        ctx.arc(x, y, VRAD, 0, 2 * Math.PI);
        ctx.fillStyle = theme.nodeFill;
        ctx.fill();
        ctx.strokeStyle = theme.nodeStroke;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = theme.nodeText;
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(i + 1, x, y);
    }
}

function renderCondGraph(canvas, C, sccs) {
    const m = sccs.length;
    const W = canvas.width, H = canvas.height;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);

    const cx = W / 2, cy = H / 2;
    const R  = Math.min(W, H) * 0.33;
    const vr = Math.max(20, Math.min(28, Math.floor(260 / Math.max(m, 3))));

    const pos = Array.from({ length: m }, (_, i) => {
        const a = (2 * Math.PI * i / m) - Math.PI / 2;
        return [cx + R * Math.cos(a), cy + R * Math.sin(a)];
    });

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.8;

    for (let i = 0; i < m; i++) {
        for (let j = 0; j < m; j++) {
            if (!C[i][j]) continue;
            const [x1, y1] = pos[i];
            const [x2, y2] = pos[j];
            const dx = x2 - x1, dy = y2 - y1;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 1) continue;
            const nx = dx / dist, ny = dy / dist;
            const sx = x1 + nx * vr, sy = y1 + ny * vr;
            const ex = x2 - nx * vr, ey = y2 - ny * vr;
            const cpx = (sx + ex) / 2 - ny * 28;
            const cpy = (sy + ey) / 2 + nx * 28;
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.quadraticCurveTo(cpx, cpy, ex, ey);
            ctx.stroke();
            const t = 0.97;
            const tx = 2 * (1 - t) * (cpx - sx) + 2 * t * (ex - cpx);
            const ty = 2 * (1 - t) * (cpy - sy) + 2 * t * (ey - cpy);
            drawArrowHead(ctx, ex, ey, Math.atan2(ty, tx));
        }
    }

    for (let i = 0; i < m; i++) {
        const [x, y] = pos[i];
        const label = 'C' + (i + 1);
        const members = '{' + sccs[i].map(v => v + 1).join(',') + '}';

        ctx.beginPath();
        ctx.arc(x, y, vr, 0, 2 * Math.PI);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#000';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, x, y - 5);

        ctx.font = '9px monospace';
        ctx.fillText(members, x, y + 7);
    }
}
