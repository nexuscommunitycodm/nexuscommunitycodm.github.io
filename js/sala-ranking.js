/**
 * RANKING embebido en página de cada sala
 * Uso: <div id="salaRanking" data-sala="dynasty"></div>
 *      <script src="js/sala-ranking.js"></script>
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

        const hasNew = data.length > 3 && data.slice(3).some(r => {
            const v = parseFloat(r[13]);
            return r[13] !== undefined && !isNaN(v) && v > 0;
        });
        if (hasNew) {
            return data.slice(3)
                .map(r => ({ nombre: (r[1] || '').trim(), puntos: parseFloat(r[13]) || 0 }))
                .filter(x => x.nombre && x.puntos > 0)
                .sort((a, b) => b.puntos - a.puntos);
        }

        const has17 = data.some(r => (r[17] || '').toString().trim() !== '');
        if (has17) {
            return data
                .map(r => ({ nombre: (r[17] || '').trim(), puntos: parseFloat(r[23]) || 0 }))
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
                    <div class="rank-score-label">puntos</div>
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
            el.innerHTML = `
                <div class="mensaje-cargando">
                    Aún no hay hoja de ranking para <strong>${escapeHtml(cfg.label)}</strong>.<br>
                    <span class="text-muted" style="font-size:0.9rem">Configura <code>${cfg.urlKey}</code> en config-global.js</span>
                </div>`;
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
