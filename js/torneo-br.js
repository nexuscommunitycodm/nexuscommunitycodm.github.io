/**
 * TORNEOS BR — Nexus Community
 * Col: 0 timestamp | 1 imagen | 2-6 tags | 7 fecha | 8 hora MX
 */

async function initTorneosBR() {
    const grid = document.getElementById('tbrGrid');
    if (!grid) return;
    try {
        const data = await fetchTorneoData();
        if (!data.length) {
            grid.innerHTML = '<div class="mensaje-cargando">No hay torneos disponibles</div>';
            return;
        }
        renderTorneosFromData(data, grid);
    } catch (err) {
        console.error(err);
        grid.innerHTML = '<div class="error-message">Error al cargar los torneos</div>';
    }
}

async function fetchTorneoData() {
    if (!CONFIG.TORNEO_URL || String(CONFIG.TORNEO_URL).includes('PLACEHOLDER')) return [];
    const response = await fetch(CONFIG.TORNEO_URL);
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const csv = await response.text();
    const lines = csv.trim().split('\n');
    if (lines.length <= 1) return [];

    const data = [];
    for (let i = 1; i < lines.length; i++) {
        const row = parseCSVLine(lines[i]);
        if (!row || row.length < 8) continue;
        if (!row[1] || !row[7]) continue;

        data.push({
            timestamp: row[0] || '',
            imagen: limpiarYConvertirURL(String(row[1]).trim()),
            tag1: (row[2] || '').trim(),
            tag2: (row[3] || '').trim(),
            tag3: (row[4] || '').trim(),
            tag4: (row[5] || '').trim(),
            tag5: (row[6] || '').trim(),
            fecha: convertirFecha(String(row[7]).trim()),
            hora: (row[8] || '').trim(),
        });
    }
    data.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    return data;
}

function limpiarYConvertirURL(url) {
    if (!url) return '';
    url = url.replace(/^"|"$/g, '').trim();
    if (!url) return '';
    if (url.includes('drive.google.com')) {
        let match = url.match(/\/file\/d\/([a-zA-Z0-9_\-]+)/);
        if (match && match[1]) return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w600`;
        match = url.match(/[?&]id=([a-zA-Z0-9_\-]+)/);
        if (match && match[1]) return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w600`;
    }
    return url;
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let insideQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') insideQuotes = !insideQuotes;
        else if (char === ',' && !insideQuotes) {
            result.push(current);
            current = '';
        } else current += char;
    }
    result.push(current);
    return result;
}

function convertirFecha(fechaStr) {
    if (!fechaStr) return '';
    fechaStr = fechaStr.trim();
    let partes = fechaStr.split('/');
    if (partes.length !== 3) partes = fechaStr.split('-');
    if (partes.length !== 3) return '';
    // dd/mm/yyyy or already yyyy-mm-dd
    if (partes[0].length === 4) {
        return `${partes[0]}-${partes[1].padStart(2, '0')}-${partes[2].padStart(2, '0')}`;
    }
    const [dia, mes, anio] = partes;
    return `${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
}

function renderTorneosFromData(data, grid) {
    const hoy = new Date();
    grid.innerHTML = '';
    data.forEach((t, i) => {
        let fechaTorneo = null;
        let fechaFormato = 'Sin fecha';
        if (t.fecha) {
            fechaTorneo = new Date(t.fecha + 'T23:59:59');
            if (!isNaN(fechaTorneo.getTime())) {
                fechaFormato = fechaTorneo.toLocaleDateString('es-MX', {
                    day: 'numeric', month: 'long', year: 'numeric',
                });
            }
        }
        const pasado = fechaTorneo && !isNaN(fechaTorneo.getTime()) ? fechaTorneo < hoy : false;
        const estado = pasado ? 'finalizado' : 'proximo';
        const estadoTxt = pasado ? 'FINALIZADO' : 'PRÓXIMO';
        const tags = [t.tag1, t.tag2, t.tag3, t.tag4, t.tag5].filter(Boolean);
        const tagsHTML = tags.map(tag => `<span class="torneo-tag">${escapeHtml(tag)}</span>`).join('');
        const videosFecha = (typeof CONFIG !== 'undefined' && CONFIG.TORNEO_VIDEOS_FECHA) ? CONFIG.TORNEO_VIDEOS_FECHA : '';
        const hasVideos = videosFecha && t.fecha === videosFecha;
        const videosBtn = hasVideos
            ? `<a class="tbr-videos-btn" href="torneo-videos.html?fecha=${encodeURIComponent(t.fecha)}">🎬 Ver videos</a>`
            : '';
        const numTorneo = data.length - i;

        const card = document.createElement('article');
        card.className = `tbr-card${pasado ? '' : ' es-proximo'}`;
        card.innerHTML = `
            <img class="tbr-img" src="${escapeHtml(t.imagen)}" alt="Torneo BR #${numTorneo}"
                 onerror="this.style.display='none'">
            <div class="tbr-body">
                <div class="tbr-num">TORNEO BR · #${numTorneo}</div>
                <div class="tbr-fecha">
                    <span>📅</span>
                    <span>${escapeHtml(fechaFormato)}${t.hora ? ' · 🕗 ' + escapeHtml(t.hora) : ''}</span>
                </div>
                ${tagsHTML ? `<div class="tbr-tags">${tagsHTML}</div>` : ''}
                ${videosBtn}
                <div class="tbr-badge ${estado}">
                    <span class="tbr-dot"></span>
                    <span>${estadoTxt}</span>
                </div>
            </div>`;
        grid.appendChild(card);
    });
}

function escapeHtml(text) {
    const d = document.createElement('div');
    d.textContent = text == null ? '' : String(text);
    return d.innerHTML;
}

async function obtenerTorneosRecientes(cantidad = 4) {
    try {
        const data = await fetchTorneoData();
        return data.slice(0, cantidad);
    } catch {
        return [];
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('tbrGrid')) initTorneosBR();
});

window.obtenerTorneosRecientes = obtenerTorneosRecientes;
window.fetchTorneoData = fetchTorneoData;
