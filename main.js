'use strict';

function matrixHtml(M, title) {
    const n = M.length;
    let h = '';
    if (title) h += `<p><strong>${title}</strong></p>`;
    h += '<table>';
    h += '<tr><th></th>';
    for (let j = 0; j < n; j++) h += `<th>${j + 1}</th>`;
    h += '</tr>';
    for (let i = 0; i < n; i++) {
        h += `<tr><th>${i + 1}</th>`;
        for (let j = 0; j < n; j++) {
            const v = M[i][j];
            h += `<td class="${v ? 'one' : ''}">${v}</td>`;
        }
        h += '</tr>';
    }
    h += '</table>';
    return h;
}

function degTableHtml(n, columns) {
    const keys = Object.keys(columns);
    let h = '<table class="deg-table"><tr><th>Вершина</th>';
    keys.forEach(k => { h += `<th>${k}</th>`; });
    h += '</tr>';
    for (let i = 0; i < n; i++) {
        h += `<tr><td>${i + 1}</td>`;
        keys.forEach(k => { h += `<td>${columns[k][i]}</td>`; });
        h += '</tr>';
    }
    h += '</table>';
    return h;
}

function makeCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
}

function section(title) {
    const div = document.createElement('div');
    div.className = 'section';
    div.innerHTML = `<h3>${title}</h3>`;
    document.getElementById('output').appendChild(div);
    return div;
}

function append(div, html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    while (tmp.firstChild) div.appendChild(tmp.firstChild);
}

function build() {
    const input = document.getElementById('variant-input').value.trim();
    const errorEl = document.getElementById('error-msg');
    const G = parseVariant(input);

    if (G.error) {
        errorEl.textContent = G.error;
        return;
    }
    errorEl.textContent = '';
    document.getElementById('output').innerHTML = '';
    
    const sec1 = section('Завдання 1. Орграф та неорграф');

    append(sec1, `<p class="info">
        Варіант: <strong>${input}</strong> &nbsp;|&nbsp;
        n = <strong>${G.n}</strong> &nbsp;|&nbsp;
        seed = <strong>${G.seed}</strong><br>
        k₁ = 1.0 − n₃·0.01 − n₄·0.01 − 0.3 = <strong>${G.k1}</strong>
    </p>`);
    
    const wrap1 = document.createElement('div');
    wrap1.className = 'two-canvases';

    const cDir = makeCanvas(300, 280);
    const cUndir = makeCanvas(300, 280);

    const b1dir = document.createElement('div');
    b1dir.innerHTML = '<p>Орграф (напрямлений)</p>';
    b1dir.appendChild(cDir);

    const b1undir = document.createElement('div');
    b1undir.innerHTML = '<p>Неорграф (ненапрямлений)</p>';
    b1undir.appendChild(cUndir);

    wrap1.appendChild(b1dir);
    wrap1.appendChild(b1undir);
    sec1.appendChild(wrap1);

    renderGraph(cDir,   G.n, G.n4, G.Adir,   true,  DIR_THEME);
    renderGraph(cUndir, G.n, G.n4, G.Aundir, false, UNDIR_THEME);

    append(sec1, matrixHtml(G.Adir,   'Матриця суміжності орграфа A<sub>dir</sub>'));
    append(sec1, matrixHtml(G.Aundir, 'Матриця суміжності неорграфа A<sub>undir</sub>'));
    
    const sec2 = section('Завдання 2. Степені вершин');

    const deg  = getDegrees(G.Aundir);
    const hd   = getHalfDegrees(G.Adir);
    const d0   = deg[0];
    const isReg = deg.every(d => d === d0);
    const pendant  = deg.map((d, i) => d === 1 ? i + 1 : null).filter(Boolean);
    const isolated = deg.map((d, i) => d === 0 ? i + 1 : null).filter(Boolean);

    append(sec2, '<p><strong>Степені вершин неорграфа:</strong></p>');
    append(sec2, degTableHtml(G.n, { 'd(v)': deg }));

    append(sec2, '<p><strong>Півстепені орграфа:</strong></p>');
    append(sec2, degTableHtml(G.n, { 'd⁺ (вихід)': hd.out, 'd⁻ (вхід)': hd.inn }));

    let regText = isReg
        ? `Граф є <strong>однорідним (регулярним)</strong>. Степінь однорідності: <strong>${d0}</strong>.`
        : `Граф є <strong>неоднорідним</strong> (ступені вершин різняться).`;
    append(sec2, `<p>${regText}</p>`);
    append(sec2, `<p>Висячі вершини (d = 1): <strong>${pendant.join(', ') || '—'}</strong></p>`);
    append(sec2, `<p>Ізольовані вершини (d = 0): <strong>${isolated.join(', ') || '—'}</strong></p>`);
    
    const sec3 = section('Завдання 3. Модифікований орграф (k₂)');

    const Adir2  = buildAdir(G.seed, G.n, G.k2);
    const hd2    = getHalfDegrees(Adir2);

    append(sec3, `<p class="info">
        k₂ = 1.0 − n₃·0.005 − n₄·0.005 − 0.27 = <strong>${G.k2}</strong><br>
        Той самий seed — змінений коефіцієнт → інша матриця.
    </p>`);

    const cDir2 = makeCanvas(500, 280);
    sec3.appendChild(cDir2);
    renderGraph(cDir2, G.n, G.n4, Adir2, true, DIR_THEME);

    append(sec3, matrixHtml(Adir2, 'Нова матриця суміжності A<sub>dir</sub>'));

    append(sec3, '<p><strong>Півстепені нового орграфа:</strong></p>');
    append(sec3, degTableHtml(G.n, { 'd⁺ (вихід)': hd2.out, 'd⁻ (вхід)': hd2.inn }));
    
    const sec4 = section('Завдання 4. Маршрути, досяжність, зв\'язність');
    
    const A2 = matMul(Adir2, Adir2);
    const A3 = matMul(A2, Adir2);
    const w2 = findWalks(Adir2, 2);
    const w3 = findWalks(Adir2, 3);

    append(sec4, matrixHtml(toBool(A2), 'A² — маршрути довжини 2'));
    append(sec4, matrixHtml(toBool(A3), 'A³ — маршрути довжини 3'));

    const fmtWalks = walks => walks
        .map(p => `<span class="walk">${p.map(v => v + 1).join('→')}</span>`)
        .join('');

    append(sec4, `<p><strong>Маршрути довжини 2 (${w2.length}${w2.length >= 150 ? ', перші 150' : ''}):</strong></p>`);
    append(sec4, `<div class="walks">${fmtWalks(w2)}</div>`);

    append(sec4, `<p><strong>Маршрути довжини 3 (${w3.length}${w3.length >= 150 ? ', перші 150' : ''}):</strong></p>`);
    append(sec4, `<div class="walks">${fmtWalks(w3)}</div>`);
    
    const T = warshall(Adir2);
    append(sec4, matrixHtml(T, 'Матриця досяжності T (алгоритм Уоршолла)'));
    
    const S = strongMatrix(T);
    append(sec4, matrixHtml(S, "Матриця сильної зв'язності S"));
    
    const sccs = findSCCs(S);
    const Cond = buildCondensation(Adir2, sccs);

    append(sec4, `<p><strong>Компоненти сильної зв'язності (${sccs.length}):</strong></p>`);
    sccs.forEach((comp, i) => {
        append(sec4, `<p class="scc">C${i + 1} = { ${comp.map(v => v + 1).join(', ')} }</p>`);
    });

    append(sec4, matrixHtml(Cond, 'Матриця суміжності графа конденсації'));
    
    append(sec4, '<p><strong>Граф конденсації:</strong></p>');
    const cCond = makeCanvas(500, 280);
    sec4.appendChild(cCond);
    renderCondGraph(cCond, Cond, sccs);
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('build-btn').addEventListener('click', build);
    document.getElementById('variant-input').addEventListener('keydown', e => {
        if (e.key === 'Enter') build();
    });
});
