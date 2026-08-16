/**
 * CLANES.JS — Nexus Community
 * Lista pública de clanes (sin datos de líderes)
 * Oro / Plata / Bronce = 1º / 2º / 3º lugar
 */

document.addEventListener('DOMContentLoaded', () => {
    initClanes();
});

let _todosLosClanes = [];
let _filtroTrofeo = 'todos';

async function initClanes() {
    const container = document.getElementById('clanesContainer');
    if (!container) return;

    try {
        const mainData = await fetchSheetData(CONFIG.CLANES_URL);
        const active = filterActiveClans(mainData);

        if (!active.length) {
            container.innerHTML = '<div class="mensaje-cargando">No hay clanes registrados aún</div>';
            return;
        }

        _todosLosClanes = processClansData(active);
        aplicarFiltros(container);

        const countEl = document.getElementById('clanesCount');
        if (countEl) {
            countEl.textContent = `${_todosLosClanes.length} clanes registrados y compitiendo`;
        }

        const searchInput = document.getElementById('clanSearch');
        if (searchInput) {
            searchInput.addEventListener('input', () => aplicarFiltros(container));
        }

        document.querySelectorAll('.filtros .filtro-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filtros .filtro-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                _filtroTrofeo = btn.getAttribute('data-trofeo');
                aplicarFiltros(container);
            });
        });
    } catch (err) {
        console.error(err);
        container.innerHTML = '<div class="error-message">Error al cargar los datos</div>';
    }
}

function processClansData(data) {
    const cols = CONFIG.CLANES_COLUMNS;
    return data.map(row => {
        const oro    = parseInt(row[cols.ORO])    || 0;
        const plata  = parseInt(row[cols.PLATA])  || 0;
        const bronce = parseInt(row[cols.BRONCE]) || 0;
        return {
            nombre: row[cols.NOMBRE_DE_CLAN] || 'Sin nombre',
            tag:    row[cols.TAG_DEL_CLAN] || '',
            logo:   getLogoUrl(row[cols.ID], row[cols.LOGO]),
            id:     row[cols.ID] || '—',
            oro, plata, bronce,
            medallas: oro + plata + bronce,
        };
    }).sort((a, b) => (parseInt(a.id) || 0) - (parseInt(b.id) || 0));
}

function aplicarFiltros(container) {
    const q = (document.getElementById('clanSearch')?.value || '').trim().toLowerCase();
    const resultado = document.getElementById('clanesResultado');
    const hayBusqueda = q.length > 0;

    let lista = _todosLosClanes.filter(c => {
        if (_filtroTrofeo === 'oro')    return c.oro > 0;
        if (_filtroTrofeo === 'plata')  return c.plata > 0;
        if (_filtroTrofeo === 'bronce') return c.bronce > 0;
        return true;
    });

    if (_filtroTrofeo === 'oro') {
        lista = lista.sort((a, b) => b.oro - a.oro || (parseInt(a.id) || 0) - (parseInt(b.id) || 0));
    } else if (_filtroTrofeo === 'plata') {
        lista = lista.sort((a, b) => b.plata - a.plata || (parseInt(a.id) || 0) - (parseInt(b.id) || 0));
    } else if (_filtroTrofeo === 'bronce') {
        lista = lista.sort((a, b) => b.bronce - a.bronce || (parseInt(a.id) || 0) - (parseInt(b.id) || 0));
    } else {
        lista = lista.sort((a, b) => (parseInt(a.id) || 0) - (parseInt(b.id) || 0));
    }

    if (hayBusqueda) {
        lista = lista.filter(c =>
            c.nombre.toLowerCase().includes(q) ||
            c.tag.toLowerCase().includes(q) ||
            String(c.id).toLowerCase().includes(q)
        );
    }

    displayClanes(lista, container, hayBusqueda || _filtroTrofeo !== 'todos');

    if (resultado) {
        const esFiltrado = hayBusqueda || _filtroTrofeo !== 'todos';
        if (!esFiltrado) {
            resultado.textContent = '';
            return;
        }
        resultado.textContent = lista.length
            ? `${lista.length} clan${lista.length !== 1 ? 'es' : ''} encontrado${lista.length !== 1 ? 's' : ''}`
            : 'No se encontró ningún clan';
    }
}

function displayClanes(clans, container, filtrado = false) {
    if (!clans.length) {
        container.innerHTML = '<div class="mensaje-cargando">No se encontró ningún clan con ese criterio</div>';
        return;
    }

    let html = '';
    clans.forEach((clan, i) => {
        const rank = filtrado ? '—' : (i + 1);
        html += `
        <article class="clan-row">
            <div class="clan-row-main">
                <span class="clan-row-rank">#${rank}</span>
                <img src="${clan.logo}" alt="${clan.nombre}" class="clan-row-logo"
                     onerror="this.src='${CONFIG.LOGO_DEFAULT}'">
                <div class="clan-row-info">
                    <h3 class="clan-row-name">${clan.nombre}</h3>
                    <p class="clan-row-meta">${clan.tag || '—'} · ID ${clan.id}</p>
                </div>
            </div>
            <div class="clan-row-medals">
                <span class="medal" title="1er lugar">🥇 ${clan.oro}</span>
                <span class="medal" title="2º lugar">🥈 ${clan.plata}</span>
                <span class="medal" title="3er lugar">🥉 ${clan.bronce}</span>
            </div>
        </article>`;
    });
    container.innerHTML = html;
}
