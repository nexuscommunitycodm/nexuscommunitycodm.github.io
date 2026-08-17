/**
 * BANEOS — página privada (sin navbar)
 * Filtros: todos / clan / jugador + búsqueda
 * Copiar: nombre de clan y UID
 */
document.addEventListener('DOMContentLoaded', () => initBaneos());

let _baneos = [];
let _filtroTipo = 'todos';

function escapeHtml(t) {
    const d = document.createElement('div');
    d.textContent = t == null ? '' : String(t);
    return d.innerHTML;
}

function normalizeDriveUrl(url) {
    if (!url) return '';
    url = String(url).trim();
    if (!url) return '';
    if (url.includes('drive.google.com')) {
        let m = url.match(/\/file\/d\/([a-zA-Z0-9_\-]+)/);
        if (m) return `https://drive.google.com/file/d/${m[1]}/view`;
        m = url.match(/[?&]id=([a-zA-Z0-9_\-]+)/);
        if (m) return `https://drive.google.com/file/d/${m[1]}/view`;
    }
    return url;
}

async function initBaneos() {
    const list = document.getElementById('baneosList');
    if (!list) return;

    document.querySelectorAll('#banFiltros .filtro-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#banFiltros .filtro-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            _filtroTipo = btn.getAttribute('data-tipo') || 'todos';
            renderFiltered();
        });
    });

    const search = document.getElementById('banSearch');
    if (search) search.addEventListener('input', () => renderFiltered());

    if (!CONFIG.BANEOS_URL || String(CONFIG.BANEOS_URL).includes('PLACEHOLDER')) {
        list.innerHTML = `<div class="mensaje-cargando">
            Configura <code>BANEOS_URL</code> en config-global.js con el CSV de la hoja.
        </div>`;
        return;
    }

    try {
        const data = await fetchSheetData(CONFIG.BANEOS_URL);
        _baneos = parseBaneos(data);
        renderFiltered();
    } catch (e) {
        console.error(e);
        list.innerHTML = '<div class="error-message">Error al cargar baneos</div>';
    }
}

function parseBaneos(data) {
    if (!data || !data.length) return [];
    const C = CONFIG.BANEOS_COLUMNS || {};
    return data
        .map(row => {
            const tipoRaw = String(row[C.TIPO] || row[1] || '').trim() || 'Clan';
            const tipo = /jugador/i.test(tipoRaw) ? 'jugador' : 'clan';
            return {
                tipo,
                clan: String(row[C.NOMBRE_CLAN] || row[2] || '').trim(),
                tel: String(row[C.TELEFONO_LIDER] || row[3] || '').trim(),
                jugador: String(row[C.NOMBRE_JUGADOR] || row[4] || '').trim(),
                uid: String(row[C.UID] || row[5] || '').trim(),
                razon: String(row[C.RAZON] || row[6] || '').trim(),
                prueba: normalizeDriveUrl(row[C.PRUEBA] || row[7] || ''),
                comunidad: String(row[C.COMUNIDAD] || row[8] || '').trim(),
                fecha: String(row[C.TIMESTAMP] || row[0] || '').trim(),
            };
        })
        .filter(x => x.clan || x.jugador || x.uid)
        .reverse();
}

function renderFiltered() {
    const list = document.getElementById('baneosList');
    const countEl = document.getElementById('baneosCount');
    const resultEl = document.getElementById('banResultado');
    const q = (document.getElementById('banSearch')?.value || '').trim().toLowerCase();

    let items = _baneos.filter(b => {
        if (_filtroTipo === 'clan' && b.tipo !== 'clan') return false;
        if (_filtroTipo === 'jugador' && b.tipo !== 'jugador') return false;
        if (!q) return true;
        return [b.clan, b.jugador, b.uid, b.razon, b.comunidad, b.tel]
            .join(' ')
            .toLowerCase()
            .includes(q);
    });

    if (countEl) {
        countEl.textContent = `${_baneos.length} registro${_baneos.length !== 1 ? 's' : ''} · uso interno`;
    }
    if (resultEl) {
        if (q || _filtroTipo !== 'todos') {
            resultEl.textContent = items.length
                ? `${items.length} resultado${items.length !== 1 ? 's' : ''}`
                : 'Sin resultados';
        } else {
            resultEl.textContent = '';
        }
    }

    if (!items.length) {
        list.innerHTML = '<div class="mensaje-cargando">No hay registros con ese filtro</div>';
        return;
    }
    list.innerHTML = items.map(renderBanCard).join('');
    list.querySelectorAll('[data-copy]').forEach(btn => {
        btn.addEventListener('click', () => copyText(btn));
    });
}

function renderBanCard(b) {
    const isPlayer = b.tipo === 'jugador';
    const title = isPlayer ? (b.jugador || b.uid || 'Jugador') : (b.clan || 'Clan');
    const badge = isPlayer ? 'Jugador' : 'Clan';

    const copyBtn = (label, value) => {
        if (!value) return '';
        return `<button type="button" class="ban-copy" data-copy="${escapeHtml(value)}" title="Copiar">${label}</button>`;
    };

    const rows = [];
    if (b.clan) {
        rows.push(`<div class="ban-row">
            <span class="ban-label">Clan</span>
            <span class="ban-value ban-value-row">
                <span>${escapeHtml(b.clan)}</span>
                ${copyBtn('Copiar clan', b.clan)}
            </span>
        </div>`);
    }
    if (isPlayer && b.jugador) {
        rows.push(`<div class="ban-row">
            <span class="ban-label">Jugador</span>
            <span class="ban-value">${escapeHtml(b.jugador)}</span>
        </div>`);
    }
    if (b.tel) {
        rows.push(`<div class="ban-row">
            <span class="ban-label">Tel. líder</span>
            <span class="ban-value ban-value-row">
                <span>${escapeHtml(b.tel)}</span>
                ${copyBtn('Copiar', b.tel)}
            </span>
        </div>`);
    }
    if (b.uid) {
        rows.push(`<div class="ban-row">
            <span class="ban-label">UID</span>
            <span class="ban-value ban-value-row">
                <span class="ban-uid">${escapeHtml(b.uid)}</span>
                ${copyBtn('Copiar UID', b.uid)}
            </span>
        </div>`);
    }
    if (b.razon) {
        rows.push(`<div class="ban-row"><span class="ban-label">Razón</span><span class="ban-value">${escapeHtml(b.razon)}</span></div>`);
    }
    if (b.prueba) {
        rows.push(`<div class="ban-row"><span class="ban-label">Prueba</span><span class="ban-value"><a href="${escapeHtml(b.prueba)}" target="_blank" rel="noopener">Ver evidencia →</a></span></div>`);
    }
    if (b.comunidad) {
        rows.push(`<div class="ban-row"><span class="ban-label">Reportado por</span><span class="ban-value">${escapeHtml(b.comunidad)}</span></div>`);
    }

    return `
    <article class="ban-card">
        <div class="ban-head">
            <span class="ban-badge">${badge}</span>
            <h3 class="ban-title">${escapeHtml(title)}</h3>
        </div>
        <div class="ban-body">${rows.join('')}</div>
    </article>`;
}

async function copyText(btn) {
    const text = btn.getAttribute('data-copy') || '';
    if (!text) return;
    try {
        await navigator.clipboard.writeText(text);
        const old = btn.textContent;
        btn.textContent = '✓ Copiado';
        btn.classList.add('copied');
        setTimeout(() => {
            btn.textContent = old;
            btn.classList.remove('copied');
        }, 1200);
    } catch {
        // fallback
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
        btn.textContent = '✓ Copiado';
        setTimeout(() => { btn.textContent = btn.getAttribute('data-copy') ? 'Copiar' : 'Copiar'; }, 1200);
    }
}
