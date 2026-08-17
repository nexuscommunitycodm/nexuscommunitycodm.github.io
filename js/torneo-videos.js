/**
 * Videos estilo TikTok — reproducción en página (embed Drive preview)
 * No hace falta abrir Drive para verlos.
 */
document.addEventListener('DOMContentLoaded', () => initVideos());

function driveId(url) {
    if (!url) return '';
    let m = String(url).match(/\/file\/d\/([a-zA-Z0-9_\-]+)/);
    if (m) return m[1];
    m = String(url).match(/[?&]id=([a-zA-Z0-9_\-]+)/);
    return m ? m[1] : '';
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inside = false;
    for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') inside = !inside;
        else if (c === ',' && !inside) {
            result.push(current);
            current = '';
        } else current += c;
    }
    result.push(current);
    return result;
}

async function initVideos() {
    const feed = document.getElementById('videosFeed');
    const grid = document.getElementById('videosGrid');
    const container = feed || grid;
    if (!container) return;

    const url = CONFIG.TORNEO_VIDEOS_URL;
    if (!url || String(url).includes('PLACEHOLDER')) {
        container.innerHTML = '<div class="mensaje-cargando">No hay hoja de videos configurada</div>';
        return;
    }

    try {
        const res = await fetch(url);
        const text = await res.text();
        const lines = text.trim().split('\n');
        const videos = [];
        for (let i = 1; i < lines.length; i++) {
            const row = parseCSVLine(lines[i]);
            const link = (row[1] || '').trim();
            const id = driveId(link);
            if (id) videos.push({ id });
        }

        if (!videos.length) {
            container.innerHTML = '<div class="mensaje-cargando">Sin videos</div>';
            return;
        }

        // Feed vertical estilo TikTok
        container.className = 'tiktok-feed';
        container.innerHTML = videos
            .map(
                (v, i) => `
            <section class="tiktok-slide" data-index="${i}">
                <div class="tiktok-player">
                    <iframe
                        src="https://drive.google.com/file/d/${v.id}/preview"
                        allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                        allowfullscreen
                        loading="${i === 0 ? 'eager' : 'lazy'}"
                        title="Video ${i + 1}"
                    ></iframe>
                </div>
                <div class="tiktok-ui">
                    <div class="tiktok-info">
                        <span class="tiktok-num">Video ${i + 1} / ${videos.length}</span>
                        <span class="tiktok-hint">Desliza ↑↓ para más</span>
                    </div>
                </div>
            </section>`
            )
            .join('');

        // Snap scroll + optional keyboard
        container.focus?.();
    } catch (e) {
        console.error(e);
        container.innerHTML = '<div class="error-message">Error al cargar videos</div>';
    }
}
