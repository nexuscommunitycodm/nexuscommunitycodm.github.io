/**
 * Ranking en página de cada sala
 * 1) Ranking de PUNTOS (semanal / TOTAL) — tabla completa
 * 2) Diario: día + Posición (top 3) / Kills (todos)
 */
(function () {
    const SALAS = {
        dynasty: {
            label: 'Dynasty Room',
            color: '#E61C8A',
            diarioKey: 'DIARIOS_DYNASTY_URL',
            semanalKey: 'SEMANAL_DYNASTY_URL',
        },
        limited: {
            label: 'Limited Room',
            color: '#3DDB6A',
            diarioKey: 'DIARIOS_LIMITED_URL',
            semanalKey: 'SEMANAL_LIMITED_URL',
        },
        vixen: {
            label: 'Vixen Room',
            color: '#A60201',
            diarioKey: 'DIARIOS_VIXEN_URL',
            semanalKey: 'SEMANAL_VIXEN_URL',
        },
        empire: {
            label: 'Empire Room',
            color: '#6A20A6',
            diarioKey: 'DIARIOS_EMPIRE_URL',
            semanalKey: 'SEMANAL_EMPIRE_URL',
        },
    };

    let _cfg = null;
    let _byDay = {};
    let _puntos = [];
    let _dia = 'LUNES';
    let _modo = 'posicion';

    function escapeHtml(text) {
        const d = document.createElement('div');
        d.textContent = text == null ? '' : String(text);
        return d.innerHTML;
    }

    function formatNumber(n) {
        n = Number(n) || 0;
        if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
        return Math.round(n).toString();
    }

    function num(v) {
        const n = parseFloat(String(v == null ? '' : v).replace(',', '.').trim());
        return isNaN(n) ? 0 : n;
    }

    function cleanName(n) {
        return String(n || '').replace(/^►\s*/, '').trim();
    }

    /* ── Semanal: nombre + TOTAL ── */
    function parseSemanal(data) {
        if (!data || !data.length) return [];
        return data
            .map(r => {
                const nombre = cleanName(r[1] || r[0]);
                const puntos = num(r[6]); // TOTAL en formato semanal S|NOMBRE|L|M|X|J|TOTAL|K.S
                // fallback other layouts
                const puntos2 = puntos || num(r[7]) || num(r[2]);
                return { nombre, puntos: puntos2 };
            })
            .filter(x => {
                if (!x.nombre) return false;
                const n = x.nombre.toLowerCase();
                if (n.includes('nombre') || n.includes('equipo') || n === 's' || n === 'total') return false;
                return x.puntos > 0;
            })
            .sort((a, b) => b.puntos - a.puntos || a.nombre.localeCompare(b.nombre));
    }

    /* ── Diario por días ── */
    function normalizeDay(cell) {
        const s = String(cell || '').toUpperCase().normalize('NFD').replace(/\p{M}/gu, '').trim();
        if (s.includes('LUNES')) return 'LUNES';
        if (s.includes('MARTES')) return 'MARTES';
        if (s.includes('MIERCOLES')) return 'MIERCOLES';
        if (s.includes('JUEVES')) return 'JUEVES';
        if (s.includes('VIERNES')) return 'VIERNES';
        return null;
    }

    function parseAllDays(data) {
        const byDay = {};
        let current = null;
        for (let i = 0; i < (data || []).length; i++) {
            const r = data[i];
            const joined = r.map(c => String(c || '')).join(' ');
            const day = normalizeDay(joined) || normalizeDay(r[0]);
            if (day) {
                current = day;
                if (!byDay[current]) byDay[current] = [];
                continue;
            }
            if (!current) continue;
            const c0 = String(r[0] || '').toUpperCase();
            const c1 = String(r[1] || '').toUpperCase();
            if (c0 === 'S' || c1.includes('EQUIPO') || c1.includes('CLAN')) continue;
            const nombre = cleanName(r[1]);
            if (!nombre) continue;
            byDay[current].push({
                nombre,
                p1: num(r[2]),
                k1: num(r[3]),
                p2: num(r[4]),
                k2: num(r[5]),
                total: num(r[7]),
                k: num(r[8]),
            });
        }
        return byDay;
    }

    function topP(items, keyP, keyK, limit) {
        return [...items]
            .filter(x => x[keyP] > 0)
            .sort((a, b) => a[keyP] - b[keyP] || b[keyK] - a[keyK])
            .slice(0, limit);
    }

    function allK(items) {
        return [...items]
            .filter(x => x.k > 0 || x.k1 > 0 || x.k2 > 0)
            .sort((a, b) => b.k - a.k || b.total - a.total);
    }

    function rowPuntos(clan, i) {
        const medals = ['🥇', '🥈', '🥉'];
        return `
        <article class="rank-row${i < 3 ? ' top-' + (i + 1) : ''}">
            <div class="rank-pos">${i < 3 ? medals[i] : i + 1}</div>
            <div class="rank-info">
                <div class="rank-name">${escapeHtml(clan.nombre)}</div>
                <div class="rank-meta">${escapeHtml(_cfg.label)} · Semana</div>
            </div>
            <div class="rank-score">
                <div class="rank-score-num">${formatNumber(clan.puntos)}</div>
                <div class="rank-score-label">puntos</div>
            </div>
        </article>`;
    }

    function rowP(clan, i, keyP, keyK) {
        const medals = ['🥇', '🥈', '🥉'];
        return `
        <article class="rank-row top-${i + 1}">
            <div class="rank-pos">${medals[i] || i + 1}</div>
            <div class="rank-info">
                <div class="rank-name">${escapeHtml(clan.nombre)}</div>
                <div class="rank-meta">${clan[keyK]} kills</div>
            </div>
            <div class="rank-score">
                <div class="rank-score-num">#${clan[keyP]}</div>
                <div class="rank-score-label">puesto</div>
            </div>
        </article>`;
    }

    function rowK(clan, i) {
        const medals = ['🥇', '🥈', '🥉'];
        return `
        <article class="rank-row${i < 3 ? ' top-' + (i + 1) : ''}">
            <div class="rank-pos">${i < 3 ? medals[i] : i + 1}</div>
            <div class="rank-info">
                <div class="rank-name">${escapeHtml(clan.nombre)}</div>
                <div class="rank-meta">K1 ${clan.k1} · K2 ${clan.k2}</div>
            </div>
            <div class="rank-score">
                <div class="rank-score-num">${clan.k}</div>
                <div class="rank-score-label">kills</div>
            </div>
        </article>`;
    }

    function renderDiarioBody() {
        const items = _byDay[_dia] || [];
        if (!items.length) return '<div class="mensaje-cargando">Sin datos para este día</div>';

        if (_modo === 'posicion') {
            const s1 = topP(items, 'p1', 'k1', 3);
            const s2 = topP(items, 'p2', 'k2', 3);
            return `
            <div class="sala-rank-block">
                <h3 class="sala-rank-heading">Sala 1 — Top 3</h3>
                <div class="ranking-list">${s1.length ? s1.map((c, i) => rowP(c, i, 'p1', 'k1')).join('') : '<div class="mensaje-cargando">Sin datos</div>'}</div>
            </div>
            <div class="sala-rank-block">
                <h3 class="sala-rank-heading">Sala 2 — Top 3</h3>
                <div class="ranking-list">${s2.length ? s2.map((c, i) => rowP(c, i, 'p2', 'k2')).join('') : '<div class="mensaje-cargando">Sin datos</div>'}</div>
            </div>`;
        }

        const kills = allK(items);
        return `
        <div class="sala-rank-block">
            <h3 class="sala-rank-heading">Kills — todos</h3>
            <div class="ranking-list">${kills.length ? kills.map((c, i) => rowK(c, i)).join('') : '<div class="mensaje-cargando">Sin kills</div>'}</div>
        </div>`;
    }

    function render() {
        const el = document.getElementById('salaRanking');
        if (!el || !_cfg) return;

        const labels = { LUNES: 'Lun', MARTES: 'Mar', MIERCOLES: 'Mié', JUEVES: 'Jue' };
        const diasUI = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES'];

        const puntosHtml = _puntos.length
            ? _puntos.map((c, i) => rowPuntos(c, i)).join('')
            : '<div class="mensaje-cargando">Sin puntos esta semana</div>';

        el.innerHTML = `
            <div class="sala-rank-block">
                <h3 class="sala-rank-heading">Ranking de puntos (semana)</h3>
                <div class="ranking-list">${puntosHtml}</div>
            </div>

            <div class="sala-rank-block">
                <h3 class="sala-rank-heading">Resultados del día</h3>
                <div class="sala-rank-controls">
                    <div class="filtros" id="diaFiltros">
                        ${diasUI.map(d => `
                            <button type="button" class="filtro-btn${_dia === d ? ' active' : ''}" data-dia="${d}">${labels[d]}</button>
                        `).join('')}
                    </div>
                    <div class="filtros" id="modoFiltros" style="margin-top:0.65rem">
                        <button type="button" class="filtro-btn${_modo === 'posicion' ? ' active' : ''}" data-modo="posicion">Posición</button>
                        <button type="button" class="filtro-btn${_modo === 'kills' ? ' active' : ''}" data-modo="kills">Kills</button>
                    </div>
                </div>
                <div class="sala-rank-content">${renderDiarioBody()}</div>
            </div>
        `;

        el.querySelectorAll('#diaFiltros .filtro-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                _dia = btn.getAttribute('data-dia');
                render();
            });
        });
        el.querySelectorAll('#modoFiltros .filtro-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                _modo = btn.getAttribute('data-modo');
                render();
            });
        });
    }

    async function load() {
        const el = document.getElementById('salaRanking');
        if (!el) return;
        const salaId = (el.getAttribute('data-sala') || '').toLowerCase();
        _cfg = SALAS[salaId];
        if (!_cfg) {
            el.innerHTML = '<div class="error-message">Sala no configurada</div>';
            return;
        }
        el.style.setProperty('--sala-accent', _cfg.color);
        el.innerHTML = `<div class="mensaje-cargando">Cargando ranking...</div>`;

        if (typeof CONFIG === 'undefined' || typeof fetchSheetData !== 'function') {
            el.innerHTML = '<div class="error-message">Falta config-global.js</div>';
            return;
        }

        try {
            const semanalUrl = CONFIG[_cfg.semanalKey];
            const diarioUrl = CONFIG[_cfg.diarioKey];

            if (semanalUrl && !String(semanalUrl).includes('PLACEHOLDER')) {
                const dataS = await fetchSheetData(semanalUrl);
                _puntos = parseSemanal(dataS);
            }

            if (diarioUrl && !String(diarioUrl).includes('PLACEHOLDER')) {
                const dataD = await fetchSheetData(diarioUrl);
                _byDay = parseAllDays(dataD);
                const order = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES'];
                const withData = order.find(d => (_byDay[d] || []).some(x => x.p1 || x.p2 || x.k));
                if (withData) _dia = withData;
            }

            render();
        } catch (e) {
            console.error(e);
            el.innerHTML = '<div class="error-message">Error al cargar ranking</div>';
        }
    }

    document.addEventListener('DOMContentLoaded', load);
})();
