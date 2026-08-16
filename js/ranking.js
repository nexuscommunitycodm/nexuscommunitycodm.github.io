/**
 * RANKING.JS — Nexus Community
 * Ranking semanal de puntos por sala (4 rooms)
 * Las URLs van en config-global.js (SEMANAL_*_URL)
 */

document.addEventListener('DOMContentLoaded', () => {
    initRanking();
});

const SALAS = {
    dynasty: {
        label: 'Dynasty Room',
        color: '#E61C8A',
        urlKey: 'SEMANAL_DYNASTY_URL',
    },
    limited: {
        label: 'Limited Room',
        color: '#183A15',
        urlKey: 'SEMANAL_LIMITED_URL',
    },
    vixen: {
        label: 'Vixen Room',
        color: '#A60201',
        urlKey: 'SEMANAL_VIXEN_URL',
    },
    empire: {
        label: 'Empire Room',
        color: '#6A20A6',
        urlKey: 'SEMANAL_EMPIRE_URL',
    },
};

function escapeHtml(text) {
    const d = document.createElement('div');
    d.textContent = text == null ? '' : String(text);
    return d.innerHTML;
}

function formatNumber(num) {
    const n = Number(num) || 0;
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    return Math.round(n).toString();
}

function getSalaUrl(salaId) {
    const cfg = SALAS[salaId];
    if (!cfg) return null;
    const url = CONFIG[cfg.urlKey];
    if (!url || String(url).includes('PLACEHOLDER')) return null;
    return url;
}

async function initRanking() {
    const container = document.getElementById('rankingContainer');
    const filterBtns = document.querySelectorAll('#rankingFiltros .filtro-btn');
    if (!container) return;

    const first = filterBtns[0];
    const firstSala = first ? first.getAttribute('data-sala') : 'dynasty';
    await loadSalaRanking(firstSala, container);

    filterBtns.forEach(btn => {
        btn.addEventListener('click', async () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            await loadSalaRanking(btn.getAttribute('data-sala'), container);
        });
    });
}

async function loadSalaRanking(salaId, container) {
    const cfg = SALAS[salaId];
    if (!cfg) {
        container.innerHTML = '<div class="error-message">Sala no encontrada</div>';
        return;
    }

    container.style.setProperty('--sala-accent', cfg.color);
    container.innerHTML = `<div class="mensaje-cargando">Cargando ${escapeHtml(cfg.label)}...</div>`;

    const url = getSalaUrl(salaId);
    if (!url) {
        container.innerHTML = `
            <div class="mensaje-cargando">
                Aún no hay hoja de cálculo para <strong>${escapeHtml(cfg.label)}</strong>.<br>
                <span class="text-muted" style="font-size:0.9rem;display:block;margin-top:0.5rem">
                    En <code>config-global.js</code> pega el CSV en <code>${cfg.urlKey}</code>
                </span>
            </div>`;
        return;
    }

    try {
        const data = await fetchSheetData(url);
        const items = parseSalaRanking(data);
        displaySala(items, cfg, container);
    } catch (e) {
        console.error(e);
        container.innerHTML = `<div class="error-message">Error al cargar ${escapeHtml(cfg.label)}</div>`;
    }
}

function parseSalaRanking(data) {
    if (!data || !data.length) return [];

    const hasNew = data.length > 3 && data.slice(3).some(r => {
        const v = parseFloat(r[13]);
        return r[13] !== undefined && !isNaN(v) && v > 0;
    });
    if (hasNew) {
        return data.slice(3)
            .map(r => ({
                nombre: (r[1] || '').trim(),
                puntos: parseFloat(r[13]) || 0,
            }))
            .filter(x => x.nombre && x.puntos > 0)
            .sort((a, b) => b.puntos - a.puntos);
    }

    const has17 = data.some(r => (r[17] || '').toString().trim() !== '');
    if (has17) {
        return data
            .map(r => ({
                nombre: (r[17] || '').trim(),
                puntos: parseFloat(r[23]) || 0,
            }))
            .filter(x => x.nombre)
            .sort((a, b) => b.puntos - a.puntos);
    }

    return data
        .map(r => ({
            nombre: (r[1] || r[0] || '').trim(),
            puntos: parseFloat(r[2] || r[13] || r[7]) || 0,
        }))
        .filter(x => x.nombre && !/^lugar$/i.test(x.nombre) && x.puntos > 0)
        .sort((a, b) => b.puntos - a.puntos);
}

function displaySala(items, cfg, container) {
    if (!items.length) {
        container.innerHTML = `<div class="mensaje-cargando">Sin datos para ${escapeHtml(cfg.label)} esta semana</div>`;
        return;
    }

    const medals = ['🥇', '🥈', '🥉'];
    let html = '';

    items.forEach((clan, i) => {
        const pos = i + 1;
        const posLabel = medals[i] || String(pos);
        const topClass = pos <= 3 ? ` top-${pos}` : '';

        html += `
        <article class="rank-row${topClass}" style="--sala-accent:${cfg.color}">
            <div class="rank-pos">${posLabel}</div>
            <div class="rank-info">
                <div class="rank-name">${escapeHtml(clan.nombre)}</div>
                <div class="rank-meta">${escapeHtml(cfg.label)} · Semana actual</div>
            </div>
            <div class="rank-score">
                <div class="rank-score-num">${formatNumber(clan.puntos)}</div>
                <div class="rank-score-label">puntos</div>
            </div>
        </article>`;
    });

    container.innerHTML = html;
}
