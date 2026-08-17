/**
 * CONFIGURACIÓN GLOBAL — NEXUS COMMUNITY
 * =====================================================
 * LOGOS: carpeta "logos/" → nombre = ID del clan + .jpg
 * Si no hay logo → logos/default.jpg
 * =====================================================
 * PUNTOS: solo de las hojas de cada sala
 * TROFEOS (oro/plata/bronce): decorativos, no suman puntos
 * =====================================================
 * Sin sistema de login por ahora.
 */

const CONFIG = {
    // ── Hojas de cálculo ──
    // Clanes + puestos 1º / 2º / 3º (Oro, Plata, Bronce)
    CLANES_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRokGDiYpw_QV0WtS7dqPXdZFsBRrQWawAH5kzK9Jodgun6Cy2lNalOhRiE6XIZ69pwtJFwHWmZBRTP/pub?gid=2010911080&single=true&output=csv',

    // Baneos públicos (formulario → hoja CSV)
    BANEOS_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRokGDiYpw_QV0WtS7dqPXdZFsBRrQWawAH5kzK9Jodgun6Cy2lNalOhRiE6XIZ69pwtJFwHWmZBRTP/pub?gid=621323211&single=true&output=csv',

    // Columnas hoja BANEOS (orden del formulario)
    // 0 Marca temporal | 1 Tipo | 2 Nombre clan | 3 Tel líder | 4 Nombre jugador
    // 5 UID | 6 Razón | 7 Prueba (URL) | 8 Comunidad/CEO | 9 Notas
    BANEOS_COLUMNS: {
        TIMESTAMP: 0,
        TIPO: 1,           // 'Clan' | 'Jugador'
        NOMBRE_CLAN: 2,
        TELEFONO_LIDER: 3,
        NOMBRE_JUGADOR: 4,
        UID: 5,
        RAZON: 6,
        PRUEBA: 7,
        COMUNIDAD: 8,
        NOTAS: 9,
    },

    TORNEO_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRokGDiYpw_QV0WtS7dqPXdZFsBRrQWawAH5kzK9Jodgun6Cy2lNalOhRiE6XIZ69pwtJFwHWmZBRTP/pub?gid=218312983&single=true&output=csv',

    // Ranking semanal de puntos por room (publica cada hoja como CSV)
    SEMANAL_DYNASTY_URL:  'https://docs.google.com/spreadsheets/d/e/2PACX-1vQbMs-YyiS2PSXTryb7rS43TDMErTKGyIfnc9_hy8On5vOVYVH0BhBb5uzplcbNXDDoatTGqrZILUq8/pub?gid=1647175282&single=true&output=csv',
    SEMANAL_LIMITED_URL:  'https://docs.google.com/spreadsheets/d/e/2PACX-1vQdSeXeMNDxDC2az_HTpso5uReMuQh4nYJxFtNjuyIesGvImgiHARnqW7GgYdL7Yfmzvj5f2CWDrL7G/pub?gid=1647175282&single=true&output=csv',
    SEMANAL_VIXEN_URL:    'https://docs.google.com/spreadsheets/d/e/2PACX-1vSLMRkjYbFqEgjwc1XgcsrWqYpwwiRjbvpOZNuh9jBQ49pFTVumMeAEaITNl0BR-vk0esOgPfNV8rmK/pub?gid=1647175282&single=true&output=csv',
    SEMANAL_EMPIRE_URL:   'https://docs.google.com/spreadsheets/d/e/2PACX-1vSeTjwI1vz-7zuWFUs95mQDPCtl-fKZWtvwg0qySlwQ-8xjgt0QTSSI2m5FDziQVnMGZGqW0H3mNSBL/pub?gid=1647175282&single=true&output=csv',

    // Diarios / sanciones (opcional, por room)
    DIARIOS_DYNASTY_URL:  'https://docs.google.com/spreadsheets/d/PLACEHOLDER/pub?gid=0&single=true&output=csv',
    DIARIOS_LIMITED_URL:  'https://docs.google.com/spreadsheets/d/PLACEHOLDER/pub?gid=0&single=true&output=csv',
    DIARIOS_VIXEN_URL:    'https://docs.google.com/spreadsheets/d/PLACEHOLDER/pub?gid=0&single=true&output=csv',
    DIARIOS_EMPIRE_URL:   'https://docs.google.com/spreadsheets/d/PLACEHOLDER/pub?gid=0&single=true&output=csv',

    LOGO_FOLDER:    'logos',
    LOGO_EXTENSION: 'jpg',
    LOGO_DEFAULT:   'logos/default.jpg',

    CACHE_DURATION: 5 * 60 * 1000, // 5 minutos

    // Columnas de la hoja de CLANES
    // Marca temporal | Nombre | Tag | Logo | Líder | Tel | Colider1 | Tel1 | Colider2 | Tel2 | ID | Oro | Plata | Bronce | ...
    CLANES_COLUMNS: {
        TIMESTAMP:      0,
        NOMBRE_DE_CLAN: 1,
        TAG_DEL_CLAN:   2,
        LOGO:           3,
        NOMBRE_LIDER:   4,
        TELEFONO_LIDER: 5,
        NOMBRE_COLIDER1: 6,
        TELEFONO_COLIDER1: 7,
        NOMBRE_COLIDER2: 8,
        TELEFONO_COLIDER2: 9,
        ID:             10,
        ORO:            11,  // 1er lugar
        PLATA:          12,  // 2º lugar
        BRONCE:         13,  // 3er lugar
    },

    // Streamers por sala (TikTok)
    STREAMERS: [
        { nombre: 'Empire',  handle: '@andy_q93',       url: 'https://www.tiktok.com/@andy_q93',       sala: 'Empire Room',  color: '#6A20A6' },
        { nombre: 'Dynasty', handle: '@danielochoa1995', url: 'https://www.tiktok.com/@danielochoa1995', sala: 'Dynasty Room', color: '#E61C8A' },
        { nombre: 'Vixen',   handle: '@toxii',           url: 'https://www.tiktok.com/@toxii',           sala: 'Vixen Room',   color: '#A60201' },
    ],
};

/* ── Logo: URL de la hoja o carpeta local por ID ── */
function getLogoUrl(clanId, logoUrl) {
    if (logoUrl && String(logoUrl).trim() !== '' && String(logoUrl).trim() !== '—') {
        const url = String(logoUrl).trim();
        if (url.includes('drive.google.com')) {
            const matchFile = url.match(/\/file\/d\/([a-zA-Z0-9_\-]+)/);
            const matchOpen = url.match(/[?&]id=([a-zA-Z0-9_\-]+)/);
            const fileId = (matchFile && matchFile[1]) || (matchOpen && matchOpen[1]);
            if (fileId) return `https://drive.google.com/thumbnail?id=${fileId}&sz=w200`;
        }
        if (url.startsWith('http')) return url;
    }
    if (!clanId || String(clanId).trim() === '' || String(clanId).trim() === '—') {
        return CONFIG.LOGO_DEFAULT;
    }
    const cleanId = String(clanId).trim().replace(/[^a-zA-Z0-9_\-]/g, '');
    if (!cleanId) return CONFIG.LOGO_DEFAULT;
    return `${CONFIG.LOGO_FOLDER}/${cleanId}.${CONFIG.LOGO_EXTENSION}`;
}

/* ── CSV Parser ── */
function parseCSV(text) {
    const lines = text.split('\n');
    const result = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const values = [];
        let current = '';
        let inQuotes = false;
        for (let c = 0; c < line.length; c++) {
            if (line[c] === '"') {
                inQuotes = !inQuotes;
            } else if (line[c] === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += line[c];
            }
        }
        values.push(current.trim());
        if (values.length > 1) result.push(values);
    }
    return result;
}

/* ── Fetch con caché ── */
function getSheetCacheKeyId(url) {
    const s = String(url || '');
    let hash = 2166136261;
    for (let i = 0; i < s.length; i++) {
        hash ^= s.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
}

function getSheetCacheKeys(url) {
    const id = getSheetCacheKeyId(url);
    return {
        data: 'nexus_data_' + id,
        time: 'nexus_time_' + id,
    };
}

async function fetchSheetData(url) {
    url = url || CONFIG.CLANES_URL;
    const keys = getSheetCacheKeys(url);
    const cached = localStorage.getItem(keys.data);
    const ts = localStorage.getItem(keys.time);
    if (cached && ts && (Date.now() - parseInt(ts)) < CONFIG.CACHE_DURATION) {
        return JSON.parse(cached);
    }
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = parseCSV(await res.text());
        localStorage.setItem(keys.data, JSON.stringify(data));
        localStorage.setItem(keys.time, Date.now().toString());
        return data;
    } catch (err) {
        if (cached) return JSON.parse(cached);
        throw err;
    }
}

function filterActiveClans(data) {
    return data || [];
}

function clearCache() {
    Object.keys(localStorage)
        .filter(k => k.startsWith('nexus_'))
        .forEach(k => localStorage.removeItem(k));
}

function calcularPuntos(/* row */) {
    return 0; // Se calculará desde las hojas de salas
}

/* ── Exportar al scope global ── */
window.CONFIG            = CONFIG;
window.fetchSheetData    = fetchSheetData;
window.getLogoUrl        = getLogoUrl;
window.filterActiveClans = filterActiveClans;
window.calcularPuntos    = calcularPuntos;
window.clearCache        = clearCache;
window.parseCSV          = parseCSV;
