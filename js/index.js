/**
 * INDEX.JS — Página principal Nexus Community
 */

document.addEventListener('DOMContentLoaded', () => {
    initIndex();
});

async function initIndex() {
    const container = document.getElementById('clanesDestacados');
    const statClanes = document.getElementById('statClanes');
    const statJugadores = document.getElementById('statJugadores');
    const statSalas = document.getElementById('statSalas');
    const contador = document.getElementById('contadorClanes');

    // Placeholder mientras no haya Sheets reales
    if (!CONFIG.CLANES_URL || CONFIG.CLANES_URL.includes('PLACEHOLDER')) {
        if (statClanes) statClanes.textContent = '0';
        if (statJugadores) statJugadores.textContent = '0';
        if (statSalas) statSalas.textContent = '0';
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
        if (statSalas) statSalas.textContent = '—'; // se puede calcular después
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
