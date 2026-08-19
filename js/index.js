/**
 * INDEX.JS — Página principal Nexus Community
 */

document.addEventListener('DOMContentLoaded', () => {
    initIndex();
});

async function initIndex() {
    loadTorneosHome();
    loadStreamersHome();

    const container = document.getElementById('clanesDestacados');
    const statClanes = document.getElementById('statClanes');
    const statJugadores = document.getElementById('statJugadores');
    const statSalas = document.getElementById('statSalas');
    const contador = document.getElementById('contadorClanes');

    // Placeholder mientras no haya Sheets reales
    if (!CONFIG.CLANES_URL || CONFIG.CLANES_URL.includes('PLACEHOLDER')) {
        if (statClanes) statClanes.textContent = '0';
        if (statJugadores) statJugadores.textContent = '0';
        if (statSalas) statSalas.textContent = '4';
        if (contador) contador.textContent = 'Conecta las hojas de cálculo para ver los datos';
        if (container) {
            container.innerHTML = `
                <div class="mensaje-cargando" style="grid-column:1/-1">
                    Aún no hay clanes cargados.<br>
                    <span class="text-muted" style="font-size:0.9rem">Configura CLANES_URL en config-global.js</span>
                </div>`;
        }
        return;
    }

    try {
        const data = await fetchSheetData(CONFIG.CLANES_URL);
        const allClans = filterActiveClans(data);

        if (!allClans.length) {
            if (container) {
                container.innerHTML = '<p class="mensaje-cargando">Aún no hay clanes activos registrados.</p>';
            }
            return;
        }

        const processed = processAndSort(allClans);
        const byMedallero = [...processed].sort((a, b) =>
            (b.oro + b.plata + b.bronce) - (a.oro + a.plata + a.bronce) || b.total - a.total
        );

        if (statClanes) statClanes.textContent = processed.length + '+';
        if (statJugadores) statJugadores.textContent = (processed.length * 4) + '+';
        if (statSalas) statSalas.textContent = '4';
        if (contador) {
            contador.textContent = `${processed.length} clanes compitiendo — estos lideran en el medallero`;
        }

        renderDestacados(byMedallero.slice(0, 6));
    } catch (err) {
        console.error('Error en index:', err);
        if (container) {
            container.innerHTML = '<p class="error-message">No se pudieron cargar los datos.</p>';
        }
    }
}

function processAndSort(clans) {
    const cols = CONFIG.CLANES_COLUMNS;
    return clans.map(row => {
        const oro    = parseInt(row[cols.ORO])    || 0;
        const plata  = parseInt(row[cols.PLATA])  || 0;
        const bronce = parseInt(row[cols.BRONCE]) || 0;
        const total  = typeof calcularPuntos === 'function' ? calcularPuntos(row) : 0;
        return {
            nombre: row[cols.NOMBRE_DE_CLAN] || 'Sin nombre',
            tag:    row[cols.TAG_DEL_CLAN] || '',
            logo:   getLogoUrl(row[cols.ID], row[cols.LOGO]),
            id:     row[cols.ID],
            oro, plata, bronce,
            medallas: oro + plata + bronce,
            total,
        };
    }).sort((a, b) => b.total - a.total);
}

function renderDestacados(clans) {
    const container = document.getElementById('clanesDestacados');
    if (!container) return;

    if (!clans.length) {
        container.innerHTML = '<p class="mensaje-cargando">Sin clanes para mostrar.</p>';
        return;
    }

    let html = '';
    clans.forEach((clan, i) => {
        const rank = i + 1;
        const rankClass = rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : '';
        const isLeader = rank === 1;

        html += `
        <div class="clan-card${isLeader ? ' leader' : ''}">
            <div class="clan-rank ${rankClass}">#${rank}</div>
            <img src="${clan.logo}" alt="${clan.nombre}" class="clan-logo"
                 onerror="this.src='${CONFIG.LOGO_DEFAULT}'">
            <div class="clan-name">${clan.nombre}</div>
            <div class="clan-tag">${clan.tag}</div>
            <div class="clan-stats">
                <div>
                    <div class="clan-stat-value">🏅 ${clan.medallas}</div>
                    <div class="clan-stat-label">Medallas</div>
                </div>
                <div>
                    <div class="clan-stat-value">🥇${clan.oro} 🥈${clan.plata} 🥉${clan.bronce}</div>
                    <div class="clan-stat-label">Desglose</div>
                </div>
            </div>
        </div>`;
    });

    container.innerHTML = html;
}


async function loadTorneosHome() {
    const el = document.getElementById('torneosHome');
    if (!el) return;
    try {
        if (typeof obtenerTorneosRecientes !== 'function') {
            el.innerHTML = '<div class="mensaje-cargando">Torneos no disponibles</div>';
            return;
        }
        const data = await obtenerTorneosRecientes(4);
        if (!data.length) {
            el.innerHTML = '<div class="mensaje-cargando">Aún no hay torneos publicados</div>';
            return;
        }
        // reutilizar renderer si existe tbrGrid pattern
        el.innerHTML = '';
        const hoy = new Date();
        data.forEach((t, i) => {
            let fechaFormato = 'Sin fecha';
            let pasado = false;
            if (t.fecha) {
                const ft = new Date(t.fecha + 'T23:59:59');
                if (!isNaN(ft.getTime())) {
                    fechaFormato = ft.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
                    pasado = ft < hoy;
                }
            }
            const tags = [t.tag1, t.tag2, t.tag3, t.tag4, t.tag5].filter(Boolean)
                .map(tag => `<span class="torneo-tag">${escapeHome(tag)}</span>`).join('');
            const card = document.createElement('article');
            card.className = `tbr-card${pasado ? '' : ' es-proximo'}`;
            card.innerHTML = `
                <img class="tbr-img" src="${escapeHome(t.imagen)}" alt="Torneo"
                     onerror="this.style.display='none'">
                <div class="tbr-body">
                    <div class="tbr-num">TORNEO BR</div>
                    <div class="tbr-fecha"><span>📅</span><span>${escapeHome(fechaFormato)}${t.hora ? ' · 🕗 ' + escapeHome(t.hora) : ''}</span></div>
                    ${tags ? `<div class="tbr-tags">${tags}</div>` : ''}
                    <div class="tbr-badge ${pasado ? 'finalizado' : 'proximo'}">
                        <span class="tbr-dot"></span>
                        <span>${pasado ? 'FINALIZADO' : 'PRÓXIMO'}</span>
                    </div>
                </div>`;
            el.appendChild(card);
        });
    } catch (e) {
        console.error(e);
        el.innerHTML = '<div class="error-message">No se pudieron cargar los torneos</div>';
    }
}

function escapeHome(text) {
    const d = document.createElement('div');
    d.textContent = text == null ? '' : String(text);
    return d.innerHTML;
}

function loadStreamersHome() {
    const el = document.getElementById('streamersHome');
    if (!el || !CONFIG.STREAMERS) return;
    if (!CONFIG.STREAMERS.length) {
        el.innerHTML = '';
        return;
    }
    el.innerHTML = CONFIG.STREAMERS.map(s => `
        <a class="streamer-card" href="${s.url}" target="_blank" rel="noopener" style="--room-color:${s.color || '#fff'}">
            ${s.img ? `<img src="${s.img}" alt="${s.nombre}" style="width:72px;height:72px;object-fit:cover;border-radius:12px;margin:0 auto 0.5rem;display:block" onerror="this.style.display='none'">` : ''}
            <div class="streamer-sala">${s.sala || s.nombre}</div>
            <div class="streamer-name">${s.nombre}</div>
            <div class="streamer-handle">${s.handle}</div>
            <span class="streamer-cta">Ver en TikTok →</span>
        </a>
    `).join('');
}
