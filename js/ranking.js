/**
 * RANKING.JS — Nexus Community
 * Formato hoja:
 * S | NOMBRE EQUIPO / CLAN | L | M | X | J | TOTAL | K.S
 * Se muestra: nombre + TOTAL
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
                Aún no hay hoja de cálculo para <strong>${escapeHtml(cfg.label)}</strong>.
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

/**
 * CSV (tras saltar 1ª línea del título):
 * col0=S, col1=NOMBRE, col2=L, col3=M, col4=X, col5=J, col6=TOTAL
 */
function parseSalaRanking(data) {
    if (!data || !data.length) return [];

    return data
        .map(r => {
            const nombre = String(r[1] || '').trim();
            const total = parseFloat(String(r[6] || '0').replace(',', '.')) || 0;
            return { nombre, puntos: total };
        })
        .filter(x => {
            if (!x.nombre) return false;
            const n = x.nombre.toLowerCase();
            if (n.includes('nombre') || n === 's' || n === 'total') return false;
            return true;
        })
        .sort((a, b) => b.puntos - a.puntos || a.nombre.localeCompare(b.nombre));
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
                <div class="rank-score-label">total</div>
            </div>
        </article>`;
    });

    container.innerHTML = html;
}
