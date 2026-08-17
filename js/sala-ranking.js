/**
 * RANKING embebido en página de cada sala
 * Muestra: nombre del equipo + TOTAL
 */
(function () {
    const SALAS = {
        dynasty: { label: 'Dynasty Room', color: '#E61C8A', urlKey: 'SEMANAL_DYNASTY_URL' },
        limited: { label: 'Limited Room', color: '#183A15', urlKey: 'SEMANAL_LIMITED_URL' },
        vixen:   { label: 'Vixen Room',   color: '#A60201', urlKey: 'SEMANAL_VIXEN_URL' },
        empire:  { label: 'Empire Room',  color: '#6A20A6', urlKey: 'SEMANAL_EMPIRE_URL' },
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

    function render(container, items, cfg) {
        if (!items.length) {
            container.innerHTML = `<div class="mensaje-cargando">Sin datos de ranking para ${escapeHtml(cfg.label)} esta semana</div>`;
            return;
        }
        const medals = ['🥇', '🥈', '🥉'];
        let html = '';
        items.forEach((clan, i) => {
            const pos = i + 1;
            const top = pos <= 3 ? ` top-${pos}` : '';
            html += `
            <article class="rank-row${top}" style="--sala-accent:${cfg.color}">
                <div class="rank-pos">${medals[i] || pos}</div>
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

    async function load() {
        const el = document.getElementById('salaRanking');
        if (!el) return;

        const salaId = (el.getAttribute('data-sala') || '').toLowerCase();
        const cfg = SALAS[salaId];
        if (!cfg) {
            el.innerHTML = '<div class="error-message">Sala no configurada</div>';
            return;
        }

        el.style.setProperty('--sala-accent', cfg.color);
        el.innerHTML = `<div class="mensaje-cargando">Cargando ranking de ${escapeHtml(cfg.label)}...</div>`;

        if (typeof CONFIG === 'undefined' || typeof fetchSheetData !== 'function') {
            el.innerHTML = '<div class="error-message">Falta config-global.js</div>';
            return;
        }

        const url = CONFIG[cfg.urlKey];
        if (!url || String(url).includes('PLACEHOLDER')) {
            el.innerHTML = `<div class="mensaje-cargando">Aún no hay hoja de ranking para <strong>${escapeHtml(cfg.label)}</strong>.</div>`;
            return;
        }

        try {
            const data = await fetchSheetData(url);
            render(el, parseSalaRanking(data), cfg);
        } catch (e) {
            console.error(e);
            el.innerHTML = `<div class="error-message">Error al cargar ranking de ${escapeHtml(cfg.label)}</div>`;
        }
    }

    document.addEventListener('DOMContentLoaded', load);
})();
