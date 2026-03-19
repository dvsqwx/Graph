'use strict';

class CRand {
    constructor(seed) {
        this.state = (seed >>> 0);
    }

    rand() {
        this.state = ((this.state * 1103515245 + 12345) >>> 0);
        return (this.state >>> 16) & 0x7fff;
    }

    randFloat() {
        return (this.rand() / 32767.0) * 2.0;
    }
}

function buildAdir(seed, n, k) {
    const rng = new CRand(seed);
    const T = Array.from({ length: n }, () =>
        Array.from({ length: n }, () => rng.randFloat())
    );
    return T.map(row => row.map(v => v * k >= 1.0 ? 1 : 0));
}

function buildAundir(Adir) {
    const n = Adir.length;
    const A = Adir.map(r => [...r]);
    for (let i = 0; i < n; i++)
        for (let j = 0; j < n; j++)
            if (Adir[i][j]) { A[i][j] = 1; A[j][i] = 1; }
    return A;
}

function parseVariant(input) {
    const clean = input.replace(/\D/g, '');
    if (clean.length !== 4) return { error: 'Введіть рівно 4 цифри варіанту' };

    const [n1, n2, n3, n4] = clean.split('').map(Number);
    const seed = parseInt(clean, 10);
    const n    = 10 + n3;

    const k1 = parseFloat((1.0 - n3 * 0.01 - n4 * 0.01 - 0.3).toFixed(4));
    const k2 = parseFloat((1.0 - n3 * 0.005 - n4 * 0.005 - 0.27).toFixed(4));

    const Adir   = buildAdir(seed, n, k1);
    const Aundir = buildAundir(Adir);

    return { n1, n2, n3, n4, seed, n, k1, k2, Adir, Aundir };
}

function matMul(A, B) {
    const n = A.length;
    const C = Array.from({ length: n }, () => new Array(n).fill(0));
    for (let i = 0; i < n; i++)
        for (let k = 0; k < n; k++) {
            if (!A[i][k]) continue;
            for (let j = 0; j < n; j++)
                C[i][j] += A[i][k] * B[k][j];
        }
    return C;
}

function toBool(M) {
    return M.map(row => row.map(v => v ? 1 : 0));
}

function warshall(A) {
    const n = A.length;
    const T = Array.from({ length: n }, (_, i) =>
        Array.from({ length: n }, (_, j) => (i === j || A[i][j]) ? 1 : 0)
    );
    for (let k = 0; k < n; k++)
        for (let i = 0; i < n; i++) {
            if (!T[i][k]) continue;
            for (let j = 0; j < n; j++)
                if (T[k][j]) T[i][j] = 1;
        }
    return T;
}

function strongMatrix(T) {
    const n = T.length;
    return Array.from({ length: n }, (_, i) =>
        Array.from({ length: n }, (_, j) => (T[i][j] && T[j][i]) ? 1 : 0)
    );
}

function findSCCs(S) {
    const n = S.length;
    const visited = new Array(n).fill(false);
    const components = [];
    for (let i = 0; i < n; i++) {
        if (visited[i]) continue;
        const comp = [i];
        visited[i] = true;
        for (let j = i + 1; j < n; j++)
            if (!visited[j] && S[i][j]) { comp.push(j); visited[j] = true; }
        components.push(comp);
    }
    return components;
}

function buildCondensation(A, sccs) {
    const m = sccs.length;
    const C = Array.from({ length: m }, () => new Array(m).fill(0));
    const compOf = new Array(A.length);
    sccs.forEach((comp, ci) => comp.forEach(v => (compOf[v] = ci)));
    for (let i = 0; i < A.length; i++)
        for (let j = 0; j < A.length; j++)
            if (A[i][j] && compOf[i] !== compOf[j])
                C[compOf[i]][compOf[j]] = 1;
    return C;
}

function findWalks(A, length, maxCount = 150) {
    const n = A.length;
    const results = [];
    function dfs(path) {
        if (results.length >= maxCount) return;
        if (path.length === length + 1) { results.push([...path]); return; }
        const last = path[path.length - 1];
        for (let j = 0; j < n; j++)
            if (A[last][j]) { path.push(j); dfs(path); path.pop(); }
    }
    for (let i = 0; i < n && results.length < maxCount; i++) dfs([i]);
    return results;
}

function getDegrees(M) {
    return M.map(row => row.reduce((s, v) => s + v, 0));
}

function getHalfDegrees(A) {
    const n = A.length;
    const out = new Array(n).fill(0);
    const inn = new Array(n).fill(0);
    for (let i = 0; i < n; i++)
        for (let j = 0; j < n; j++) {
            out[i] += A[i][j];
            inn[j] += A[i][j];
        }
    return { out, inn };
}
