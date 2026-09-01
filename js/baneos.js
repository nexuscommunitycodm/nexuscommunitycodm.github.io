/**
 * BANEOS — página privada
 * Filtros: todos / clan / jugador + búsqueda
 * Pruebas: imágenes embebidas (Drive → vista directa, sin salir de la página)
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

/** Extrae file id de links de Google Drive */
function driveFileId(url) {
    if (!url) return '';
    url = String(url).trim();
    let m = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (m) return m[1];
    m = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (m) return m[1];
    m = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (m) return m[1];
    m = url.match(/\/open\?id=([a-zA-Z0-9_-]+)/);
    if (m) return m[1];
    return '';
}

/**
 * Convierte URL de Drive (o normal) a URL que se puede usar en <img>
 * Prioridad: lh3 → uc export=view → thumbnail
 */
function toEmbedImageUrl(url) {
    if (!url) return '';
    url = String(url).trim();
    if (!url) return '';

    // Ya es imagen directa
    if (/\.(jpe?g|png|gif|webp|bmp)(\?|$)/i.test(url) && !url.includes('drive.google.com')) {
        return url;
    }

    const id = driveFileId(url);
    if (id) {
        // lh3 suele cargar mejor embebido; thumbnail como alternativa
        return `https://lh3.googleusercontent.com/d/${id}=w1200`;
    }

    // imgur, etc.
    if (url.includes('imgur.com/') && !url.includes('i.imgur')) {
        const m = url.match(/imgur\.com\/([a-zA-Z0-9]+)/);
        if (m) return `https://i.imgur.com/${m[1]}.jpg`;
    }

    return url;
}

/** Lista de URLs de prueba (soporta varias separadas por coma, espacio o salto de línea) */
function parsePruebaUrls(raw) {
    if (!raw) return [];
    return String(raw)
        .split(/[\n,;|]+/)
        .map(s => s.trim())
        .filter(s => /^https?:\/\//i.test(s));
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

    // Lightbox: click en imagen de prueba
    document.addEventListener('click', (e) => {
        const img = e.target.closest('.ban-prueba-img');
        if (img) {
            e.preventDefault();
            openLightbox(
                img.getAttribute('data-full') || img.getAttribute('src'),
                img.getAttribute('data-full') || img.getAttribute('src')
            );
            return;
        }
        if (e.target.closest('.ban-lightbox-close')) {
            closeLightbox();
            return;
        }
        // click en fondo (stage vacío o overlay)
        if (e.target.id === 'banLightbox' || e.target.classList.contains('ban-lb-stage')) {
            closeLightbox();
        }
    });

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
            const pruebaRaw = String(row[C.PRUEBA] || row[7] || '').trim();
            return {
                tipo,
                clan: String(row[C.NOMBRE_CLAN] || row[2] || '').trim(),
                tel: String(row[C.TELEFONO_LIDER] || row[3] || '').trim(),
                jugador: String(row[C.NOMBRE_JUGADOR] || row[4] || '').trim(),
                uid: String(row[C.UID] || row[5] || '').trim(),
                razon: String(row[C.RAZON] || row[6] || '').trim(),
                prueba: pruebaRaw,
                pruebaUrls: parsePruebaUrls(pruebaRaw).map(toEmbedImageUrl).filter(Boolean),
                comunidad: String(row[C.COMUNIDAD] || row[8] || '').trim(),
                notas: String(row[C.NOTAS] || row[9] || '').trim(),
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
        return [b.clan, b.jugador, b.uid, b.razon, b.comunidad, b.tel, b.notas]
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

function renderPrueba(b) {
    if (b.pruebaUrls && b.pruebaUrls.length) {
        const imgs = b.pruebaUrls.map((src, i) => {
            const id = driveFileId(b.prueba) || '';
            // fallback chain via onerror
            const thumb = id ? `https://drive.google.com/thumbnail?id=${id}&sz=w1200` : src;
            const uc = id ? `https://drive.google.com/uc?export=view&id=${id}` : src;
            return `<img
                class="ban-prueba-img"
                src="${escapeHtml(src)}"
                data-full="${escapeHtml(uc)}"
                alt="Prueba ${i + 1}"
                loading="lazy"
                referrerpolicy="no-referrer"
                onerror="if(!this.dataset.err){this.dataset.err=1;this.src='${escapeHtml(thumb)}';}else if(this.dataset.err==='1'){this.dataset.err=2;this.src='${escapeHtml(uc)}';}else{this.style.display='none';this.nextElementSibling&&(this.nextElementSibling.style.display='inline');}">
            <a class="ban-prueba-fallback" href="${escapeHtml(b.prueba.split(/[\n,;|]/)[i] || b.prueba)}" target="_blank" rel="noopener" style="display:none">Abrir prueba ${i + 1}</a>`;
        }).join('');
        return `<div class="ban-row ban-row-prueba">
            <span class="ban-label">Prueba</span>
            <span class="ban-value ban-prueba-wrap">${imgs}</span>
        </div>`;
    }
    if (b.prueba) {
        return `<div class="ban-row">
            <span class="ban-label">Prueba</span>
            <span class="ban-value"><a href="${escapeHtml(b.prueba)}" target="_blank" rel="noopener">Ver evidencia →</a></span>
        </div>`;
    }
    return '';
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
    rows.push(renderPrueba(b));
    if (b.comunidad) {
        rows.push(`<div class="ban-row"><span class="ban-label">Reportado por</span><span class="ban-value">${escapeHtml(b.comunidad)}</span></div>`);
    }
    if (b.notas) {
        rows.push(`<div class="ban-row ban-row-notas">
            <span class="ban-label">Notas internas</span>
            <span class="ban-value ban-notas">${escapeHtml(b.notas)}</span>
        </div>`);
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

let _lbScale = 1;
let _lbX = 0;
let _lbY = 0;
let _lbDragging = false;
let _lbStartX = 0;
let _lbStartY = 0;
let _lbOrigX = 0;
let _lbOrigY = 0;

function applyLbTransform() {
    const img = document.querySelector('#banLightbox img');
    if (!img) return;
    img.style.transform = `translate(${_lbX}px, ${_lbY}px) scale(${_lbScale})`;
    img.style.cursor = _lbScale > 1 ? 'grab' : 'zoom-in';
}

function setLbZoom(scale, cx, cy) {
    const box = document.getElementById('banLightbox');
    const img = box && box.querySelector('img');
    if (!img) return;
    const prev = _lbScale;
    _lbScale = Math.min(5, Math.max(1, scale));
    if (_lbScale === 1) {
        _lbX = 0;
        _lbY = 0;
    } else if (cx != null && cy != null && prev > 0) {
        // zoom toward pointer
        const rect = img.getBoundingClientRect();
        const mx = cx - (rect.left + rect.width / 2);
        const my = cy - (rect.top + rect.height / 2);
        _lbX = _lbX - mx * (_lbScale / prev - 1);
        _lbY = _lbY - my * (_lbScale / prev - 1);
    }
    applyLbTransform();
    const zlab = document.getElementById('banLbZoomLabel');
    if (zlab) zlab.textContent = Math.round(_lbScale * 100) + '%';
}

function openLightbox(src, full) {
    let box = document.getElementById('banLightbox');
    if (!box) {
        box = document.createElement('div');
        box.id = 'banLightbox';
        box.className = 'ban-lightbox';
        box.innerHTML = `
            <button type="button" class="ban-lightbox-close" aria-label="Cerrar">×</button>
            <div class="ban-lb-toolbar">
                <button type="button" id="banLbZoomOut" title="Alejar">−</button>
                <span id="banLbZoomLabel">100%</span>
                <button type="button" id="banLbZoomIn" title="Acercar">+</button>
                <button type="button" id="banLbZoomReset" title="Restablecer">1:1</button>
            </div>
            <div class="ban-lb-stage">
                <img alt="Prueba" draggable="false">
            </div>
            <p class="ban-lb-hint">Rueda o pellizco para zoom · arrastrá para mover · doble clic para acercar/alejar</p>`;
        document.body.appendChild(box);

        box.querySelector('#banLbZoomIn').addEventListener('click', (e) => {
            e.stopPropagation();
            setLbZoom(_lbScale + 0.35);
        });
        box.querySelector('#banLbZoomOut').addEventListener('click', (e) => {
            e.stopPropagation();
            setLbZoom(_lbScale - 0.35);
        });
        box.querySelector('#banLbZoomReset').addEventListener('click', (e) => {
            e.stopPropagation();
            setLbZoom(1);
        });

        const stage = box.querySelector('.ban-lb-stage');
        const img = box.querySelector('img');

        // wheel zoom
        stage.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.2 : 0.2;
            setLbZoom(_lbScale + delta, e.clientX, e.clientY);
        }, { passive: false });

        // double click toggle
        img.addEventListener('dblclick', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (_lbScale > 1) setLbZoom(1);
            else setLbZoom(2.5, e.clientX, e.clientY);
        });

        // drag
        img.addEventListener('pointerdown', (e) => {
            if (_lbScale <= 1) return;
            _lbDragging = true;
            _lbStartX = e.clientX;
            _lbStartY = e.clientY;
            _lbOrigX = _lbX;
            _lbOrigY = _lbY;
            img.setPointerCapture(e.pointerId);
            img.style.cursor = 'grabbing';
            e.preventDefault();
        });
        img.addEventListener('pointermove', (e) => {
            if (!_lbDragging) return;
            _lbX = _lbOrigX + (e.clientX - _lbStartX);
            _lbY = _lbOrigY + (e.clientY - _lbStartY);
            applyLbTransform();
        });
        img.addEventListener('pointerup', () => {
            _lbDragging = false;
            applyLbTransform();
        });
        img.addEventListener('pointercancel', () => {
            _lbDragging = false;
            applyLbTransform();
        });

        // pinch zoom (touch)
        let pinchDist = 0;
        stage.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                pinchDist = Math.hypot(dx, dy);
            }
        }, { passive: true });
        stage.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2 && pinchDist) {
                e.preventDefault();
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                const dist = Math.hypot(dx, dy);
                const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
                const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
                setLbZoom(_lbScale * (dist / pinchDist), midX, midY);
                pinchDist = dist;
            }
        }, { passive: false });
    }
    const img = box.querySelector('img');
    const url = full || src;
    img.removeAttribute('src');
    img.alt = 'Prueba';
    img.onload = () => { applyLbTransform(); };
    img.onerror = () => {
        // si falla, no mostrar icono roto: cerrar y abrir en pestaña
        closeLightbox();
        if (url) window.open(url, '_blank', 'noopener');
    };
    img.src = url;
    _lbScale = 1;
    _lbX = 0;
    _lbY = 0;
    applyLbTransform();
    box.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    const box = document.getElementById('banLightbox');
    if (box) box.classList.remove('open');
    document.body.style.overflow = '';
    _lbScale = 1;
    _lbX = 0;
    _lbY = 0;
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
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
        btn.textContent = '✓ Copiado';
        setTimeout(() => { btn.textContent = 'Copiar'; }, 1200);
    }
}
