'use strict';

let G          = {};   // дані після parseVariant
let steps      = [];
let currentStep = -1;
let autoTimer  = null;

function renderMatrixTable(tableEl, matrix) {
    tableEl.innerHTML = '';
    matrix.forEach(row => {
        const tr = document.createElement('tr');
        row.forEach(val => {
            const td = document.createElement('td');
            td.textContent = val;
            td.className = val ? 'cell-one' : 'cell-zero';
            tr.appendChild(td);
        });
        tableEl.appendChild(tr);
    });
}

function matrixHtml(M, title) {
    const n = M.length;
    let h = `<div class="section-title">${title}</div>`;
    h += '<div class="matrix-wrap"><table>';
    h += '<tr><th></th>' + Array.from({ length: n }, (_, j) => `<th>${j+1}</th>`).join('') + '</tr>';
    M.forEach((row, i) => {
        h += `<tr><th>${i+1}</th>`;
        row.forEach(v => { h += `<td class="${v ? 'cell-one' : 'cell-zero'}">${v}</td>`; });
        h += '</tr>';
    });
    h += '</table></div>';
    return h;
}

function degTableHtml(n, columns) {
    const keys = Object.keys(columns);
    let h = '<table class="deg-table"><tr><th>v</th>';
    keys.forEach(k => { h += `<th>${k}</th>`; });
    h += '</tr>';
    for (let i = 0; i < n; i++) {
        h += `<tr><td>${i+1}</td>`;
        keys.forEach(k => { h += `<td>${columns[k][i]}</td>`; });
        h += '</tr>';
    }
    return h + '</table>';
}

function setOutput(html) {
    document.getElementById('output-area').innerHTML = html;
}

function addLog(text, cls = '') {
    const div = document.createElement('div');
    div.className = 'log-line' + (cls ? ' ' + cls : '');
    div.textContent = text;
    const cont = document.getElementById('log-content');
    cont.appendChild(div);
    cont.scrollTop = cont.scrollHeight;
}

function showTwoGraphs() {
    document.getElementById('two-graphs').style.display = 'flex';
    document.getElementById('one-graph').style.display  = 'none';
}

function showOneGraph(label) {
    document.getElementById('two-graphs').style.display = 'none';
    document.getElementById('one-graph').style.display  = 'block';
    document.getElementById('one-graph-label').textContent = label || '';
}

function build() {
    const input = document.getElementById('variant-input').value.trim();
    const result = parseVariant(input);
    const errorEl = document.getElementById('error-msg');

    if (result.error) {
        errorEl.textContent = result.error;
        errorEl.style.display = 'block';
        return;
    }
    errorEl.style.display = 'none';

    if (autoTimer) {
        clearInterval(autoTimer);
        autoTimer = null;
        document.getElementById('auto-btn').textContent = 'Авто';
    }

    G = result;
    steps = buildSteps();
    currentStep = -1;

    document.getElementById('log-content').innerHTML = '';
    document.getElementById('two-graphs').style.display = 'none';
    document.getElementById('one-graph').style.display  = 'none';
    setOutput('<p class="hint">Натисніть «Вперед ▶» для виконання першого кроку.</p>');

    document.getElementById('next-btn').disabled = false;
    document.getElementById('prev-btn').disabled = true;
    document.getElementById('auto-btn').disabled = false;
    updateStepInfo();

    addLog(`Варіант: ${input} | n = ${G.n} | k1 = ${G.k1} | k2 = ${G.k2}`, 'log-step');
}

function nextStep() {
    if (currentStep < steps.length - 1) {
        currentStep++;
        steps[currentStep].run();
        document.getElementById('prev-btn').disabled = false;
        document.getElementById('next-btn').disabled = (currentStep === steps.length - 1);
        updateStepInfo();
    }
}

function prevStep() {
    if (currentStep > 0) {
        currentStep--;
        G = parseVariant(document.getElementById('variant-input').value.trim());
        steps = buildSteps();
        document.getElementById('log-content').innerHTML = '';
        for (let i = 0; i <= currentStep; i++) steps[i].run();
        document.getElementById('prev-btn').disabled = (currentStep === 0);
        document.getElementById('next-btn').disabled = false;
        updateStepInfo();
    }
}

function toggleAuto() {
    if (autoTimer) {
        clearInterval(autoTimer);
        autoTimer = null;
        document.getElementById('auto-btn').textContent = 'Авто';
        return;
    }
    document.getElementById('auto-btn').textContent = 'Зупинити';
    autoTimer = setInterval(() => {
        if (currentStep >= steps.length - 1) {
            clearInterval(autoTimer);
            autoTimer = null;
            document.getElementById('auto-btn').textContent = 'Авто';
            return;
        }
        nextStep();
    }, 2200);
}

function updateStepInfo() {
    const el = document.getElementById('step-info');
    if (currentStep < 0 || steps.length === 0) {
        el.textContent = '';
        return;
    }
    el.textContent = `Крок ${currentStep + 1} / ${steps.length} — ${steps[currentStep].name}`;
}

function buildSteps() {
    return [

        {
            name: 'Побудова орграфа та неорграфа (як у ЛР3)',
            run() {
                // G.Adir, G.Aundir вже є з parseVariant
                addLog('── Крок 1: Орграф та неорграф ──', 'log-step');
                addLog(`seed = ${G.seed}, n = ${G.n}, k1 = ${G.k1}`, 'log-val');

                showTwoGraphs();
                renderGraph(document.getElementById('canvas-dir'),   G.n, G.n4, G.Adir,   true,  DIR_THEME);
                renderGraph(document.getElementById('canvas-undir'), G.n, G.n4, G.Aundir, false, UNDIR_THEME);

                let h = `<div class="info-box">`;
                h += `seed = ${G.seed} &nbsp;|&nbsp; n = ${G.n}<br>`;
                h += `k₁ = 1.0 − n₃·0.01 − n₄·0.01 − 0.3 = <strong>${G.k1}</strong>`;
                h += `</div>`;
                h += matrixHtml(G.Adir,   'Матриця суміжності A<sub>dir</sub> — орграф');
                h += matrixHtml(G.Aundir, 'Матриця суміжності A<sub>undir</sub> — неорграф');
                setOutput(h);
            }
        },

        {
            name: 'Степені вершин',
            run() {
                const deg = getDegrees(G.Aundir);
                const hd  = getHalfDegrees(G.Adir);

                addLog('── Крок 2: Степені вершин ──', 'log-step');
                addLog(`deg(v): [${deg.join(', ')}]`, 'log-val');
                addLog(`d+(v):  [${hd.out.join(', ')}]`, 'log-val');
                addLog(`d-(v):  [${hd.inn.join(', ')}]`, 'log-val');

                showOneGraph('Орграф A_dir — степені');
                renderGraph(document.getElementById('canvas-main'), G.n, G.n4, G.Adir, true, DIR_THEME);

                let h = '<div class="section-title">Степені вершин неорграфа</div>';
                h += degTableHtml(G.n, { 'd(v)': deg });
                h += '<div class="section-title">Півстепені орграфа</div>';
                h += degTableHtml(G.n, { 'd⁺ (вихід)': hd.out, 'd⁻ (вхід)': hd.inn });
                setOutput(h);
            }
        },

        {
            name: 'Регулярність, висячі та ізольовані вершини',
            run() {
                const deg  = getDegrees(G.Aundir);
                const d0   = deg[0];
                const isReg = deg.every(d => d === d0);
                const pendant  = deg.map((d, i) => d === 1 ? i + 1 : null).filter(Boolean);
                const isolated = deg.map((d, i) => d === 0 ? i + 1 : null).filter(Boolean);

                addLog('── Крок 3: Регулярність, висячі, ізольовані ──', 'log-step');
                addLog(`Регулярний: ${isReg ? 'ТАК, d=' + d0 : 'НІ'}`, 'log-val');
                addLog(`Висячі:     [${pendant.join(', ')  || '—'}]`, 'log-val');
                addLog(`Ізольовані: [${isolated.join(', ') || '—'}]`, 'log-val');

                showOneGraph('Неорграф A_undir — характеристики');
                renderGraph(document.getElementById('canvas-main'), G.n, G.n4, G.Aundir, false, UNDIR_THEME);

                let h = '<div class="info-box">';
                if (isReg) h += `Граф є <strong>однорідним (регулярним)</strong>. Степінь однорідності: <strong>${d0}</strong>`;
                else       h += `Граф є <strong>неоднорідним</strong> (не регулярний).`;
                h += '</div>';
                h += `<div class="info-box">`;
                h += `Висячі вершини (d = 1): <strong>${pendant.join(', ') || '—'}</strong><br>`;
                h += `Ізольовані вершини (d = 0): <strong>${isolated.join(', ') || '—'}</strong>`;
                h += `</div>`;
                setOutput(h);
            }
        },

        {
            name: 'Модифікований орграф (коефіцієнт k₂)',
            run() {
                G.Adir2  = buildAdir(G.seed, G.n, G.k2);
                G.Aundir2 = buildAundir(G.Adir2);
                const hd = getHalfDegrees(G.Adir2);
                G.outDeg2 = hd.out;
                G.inDeg2  = hd.inn;

                addLog('── Крок 4: Новий орграф (k₂) ──', 'log-step');
                addLog(`k₂ = 1.0 − n₃·0.005 − n₄·0.005 − 0.27 = ${G.k2}`, 'log-val');

                showOneGraph('Новий орграф (k₂)');
                renderGraph(document.getElementById('canvas-main'), G.n, G.n4, G.Adir2, true, DIR_THEME);

                let h = `<div class="info-box">`;
                h += `k₂ = 1.0 − n₃·0.005 − n₄·0.005 − 0.27 = <strong>${G.k2}</strong><br>`;
                h += `Той самий seed ${G.seed} — змінений коефіцієнт → інша матриця`;
                h += `</div>`;
                h += matrixHtml(G.Adir2, 'Нова матриця суміжності A<sub>dir</sub>');
                setOutput(h);
            }
        },

        {
            name: 'Півстепені нового орграфа',
            run() {
                addLog('── Крок 5: Півстепені нового орграфа ──', 'log-step');
                addLog(`d+: [${G.outDeg2.join(', ')}]`, 'log-val');
                addLog(`d-: [${G.inDeg2.join(', ')}]`, 'log-val');

                showOneGraph('Новий орграф — півстепені');
                renderGraph(document.getElementById('canvas-main'), G.n, G.n4, G.Adir2, true, DIR_THEME);

                let h = '<div class="section-title">Півстепені нового орграфа</div>';
                h += degTableHtml(G.n, { 'd⁺ (вихід)': G.outDeg2, 'd⁻ (вхід)': G.inDeg2 });
                setOutput(h);
            }
        },


        {
            name: 'Матриці A² і A³, маршрути довжини 2 і 3',
            run() {
                const A   = G.Adir2;
                G.A2      = matMul(A, A);
                G.A3      = matMul(G.A2, A);
                G.walks2  = findWalks(A, 2);
                G.walks3  = findWalks(A, 3);

                addLog('── Крок 6: A², A³, маршрути ──', 'log-step');
                addLog(`Маршрутів довжини 2: ${G.walks2.length}${G.walks2.length >= 150 ? ' (перші 150)' : ''}`, 'log-val');
                addLog(`Маршрутів довжини 3: ${G.walks3.length}${G.walks3.length >= 150 ? ' (перші 150)' : ''}`, 'log-val');

                showOneGraph('Новий орграф — маршрути');
                renderGraph(document.getElementById('canvas-main'), G.n, G.n4, G.Adir2, true, DIR_THEME);

                const A2b = toBool(G.A2), A3b = toBool(G.A3);
                let h = matrixHtml(A2b, 'A² (маршрути довжини 2)');
                h += matrixHtml(A3b, 'A³ (маршрути довжини 3)');

                const fmtWalks = walks => walks
                    .map(p => `<span class="path-item">${p.map(v => v + 1).join('→')}</span>`)
                    .join('');

                h += `<div class="section-title">Маршрути довжини 2 (${G.walks2.length}${G.walks2.length >= 150 ? ', ≥150' : ''})</div>`;
                h += `<div class="paths-box">${fmtWalks(G.walks2)}</div>`;
                h += `<div class="section-title">Маршрути довжини 3 (${G.walks3.length}${G.walks3.length >= 150 ? ', ≥150' : ''})</div>`;
                h += `<div class="paths-box">${fmtWalks(G.walks3)}</div>`;
                setOutput(h);
            }
        },

        {
            name: 'Матриця досяжності (Уоршолл)',
            run() {
                G.T = warshall(G.Adir2);

                addLog('── Крок 7: Матриця досяжності ──', 'log-step');
                addLog('T[i][j] = 1 ⟺ існує шлях від i до j', 'log-val');

                showOneGraph('Новий орграф — досяжність');
                renderGraph(document.getElementById('canvas-main'), G.n, G.n4, G.Adir2, true, DIR_THEME);

                let h = `<div class="info-box">`;
                h += `Алгоритм Уоршолла (транзитивне замикання).<br>`;
                h += `T[i][j] = 1 &nbsp;⟺&nbsp; є шлях від вершини <em>i</em> до вершини <em>j</em> (довжина ≥ 0).<br>`;
                h += `Діагональ = 1: кожна вершина досяжна сама з себе.`;
                h += `</div>`;
                h += matrixHtml(G.T, 'Матриця досяжності T');
                setOutput(h);
            }
        },


        {
            name: "Матриця сильної зв'язності",
            run() {
                G.S = strongMatrix(G.T);

                addLog("── Крок 8: Матриця сильної зв'язності ──", 'log-step');
                addLog('S[i][j] = T[i][j] AND T[j][i]', 'log-val');

                showOneGraph("Новий орграф — сильна зв'язність");
                renderGraph(document.getElementById('canvas-main'), G.n, G.n4, G.Adir2, true, DIR_THEME);

                let h = `<div class="info-box">`;
                h += `S[i][j] = T[i][j] AND T[j][i]<br>`;
                h += `S[i][j] = 1 &nbsp;⟺&nbsp; вершини <em>i</em> та <em>j</em> взаємно досяжні.`;
                h += `</div>`;
                h += matrixHtml(G.S, "Матриця сильної зв'язності S");
                setOutput(h);
            }
        },


        {
            name: "Компоненти сильної зв'язності (КСЗ)",
            run() {
                G.sccs = findSCCs(G.S);
                G.Cond = buildCondensation(G.Adir2, G.sccs);

                addLog("── Крок 9: КСЗ ──", 'log-step');
                addLog(`Кількість компонент: ${G.sccs.length}`, 'log-val');
                G.sccs.forEach((comp, i) =>
                    addLog(`C${i+1} = { ${comp.map(v => v + 1).join(', ')} }`, 'log-val')
                );

                showOneGraph("КСЗ орграфа");
                renderGraph(document.getElementById('canvas-main'), G.n, G.n4, G.Adir2, true, DIR_THEME);

                let h = `<div class="section-title">Компоненти сильної зв'язності (${G.sccs.length})</div>`;
                G.sccs.forEach((comp, i) => {
                    h += `<div class="scc-item"><strong>C${i+1}</strong> = { ${comp.map(v => v + 1).join(', ')} }</div>`;
                });
                h += matrixHtml(G.Cond, 'Матриця суміжності графа конденсації');
                setOutput(h);
            }
        },


        {
            name: 'Граф конденсації',
            run() {
                addLog('── Крок 10: Граф конденсації ──', 'log-step');
                addLog(`Вершин у конденсації: ${G.sccs.length}`, 'log-val');

                showOneGraph('Граф конденсації');
                renderCondGraph(document.getElementById('canvas-main'), G.Cond, G.sccs);

                let h = `<div class="section-title">Граф конденсації (${G.sccs.length} вершин)</div>`;
                G.sccs.forEach((comp, i) => {
                    h += `<div class="scc-item"><strong>C${i+1}</strong> → { ${comp.map(v => v + 1).join(', ')} }</div>`;
                });
                h += matrixHtml(G.Cond, 'Матриця суміжності конденсації');
                h += `<div class="info-box"><strong>Виконання завершено.</strong><br>Зробіть скриншоти кроків для звіту.</div>`;
                setOutput(h);
            }
        },

    ];
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('build-btn').addEventListener('click', build);
    document.getElementById('next-btn').addEventListener('click', nextStep);
    document.getElementById('prev-btn').addEventListener('click', prevStep);
    document.getElementById('auto-btn').addEventListener('click', toggleAuto);
    document.getElementById('variant-input').addEventListener('keydown', e => {
        if (e.key === 'Enter') build();
    });
});
