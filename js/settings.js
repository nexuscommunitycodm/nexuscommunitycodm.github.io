/**
 * SETTINGS.JS — Nexus Community
 * Temas: mono (negro) | light (blanco) | azure (azul/dorado)
 */

const STORAGE_KEY = 'nexus_user_settings';

const DEFAULTS = {
    theme: 'mono',
    language: 'es',
    notifications: { torneos: true, clanes: true, marketing: false },
    sound: { enabled: true, volume: 50 },
    privacy: { analytics: true },
};

function loadSettings() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return {
                ...DEFAULTS,
                notifications: { ...DEFAULTS.notifications },
                sound: { ...DEFAULTS.sound },
                privacy: { ...DEFAULTS.privacy },
            };
        }
        const parsed = JSON.parse(raw);
        return {
            ...DEFAULTS,
            ...parsed,
            notifications: { ...DEFAULTS.notifications, ...(parsed.notifications || {}) },
            sound: { ...DEFAULTS.sound, ...(parsed.sound || {}) },
            privacy: { ...DEFAULTS.privacy, ...(parsed.privacy || {}) },
        };
    } catch {
        return { ...DEFAULTS };
    }
}

function saveSettings(settings) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

function applyTheme(theme) {
    if (window.NexusTheme) {
        window.NexusTheme.apply(theme);
        return;
    }
    const t = ['mono', 'light', 'azure'].includes(theme) ? theme : 'mono';
    document.documentElement.setAttribute('data-theme', t);
    document.querySelectorAll('.theme-card').forEach(card => {
        card.classList.toggle('active', card.getAttribute('data-theme') === t);
    });
}

function playTestBeep(volume) {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 800;
        osc.type = 'sine';
        const v = (volume / 100) * 0.25;
        gain.gain.setValueAtTime(v, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.1);
    } catch (_) { /* ignore */ }
}

document.addEventListener('DOMContentLoaded', () => {
    const settings = loadSettings();
    applyTheme(settings.theme);

    const menuItems = document.querySelectorAll('.settings-menu-list a');
    const panels = document.querySelectorAll('.settings-panel');
    menuItems.forEach(item => {
        item.addEventListener('click', e => {
            e.preventDefault();
            menuItems.forEach(m => m.classList.remove('active'));
            item.classList.add('active');
            const id = item.getAttribute('href').slice(1);
            panels.forEach(p => {
                p.hidden = p.id !== id;
            });
        });
    });

    document.querySelectorAll('.theme-card').forEach(card => {
        card.addEventListener('click', () => {
            const theme = card.getAttribute('data-theme');
            settings.theme = theme;
            saveSettings(settings);
            applyTheme(theme);
        });
    });

    const lang = document.getElementById('languageSelect');
    if (lang) {
        lang.value = settings.language || 'es';
        lang.addEventListener('change', () => {
            settings.language = lang.value;
            saveSettings(settings);
        });
    }

    [['notifTorneos', 'torneos'], ['notifClanes', 'clanes'], ['notifMarketing', 'marketing']].forEach(([id, key]) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.checked = !!settings.notifications[key];
        el.addEventListener('change', () => {
            settings.notifications[key] = el.checked;
            saveSettings(settings);
        });
    });

    const soundToggle = document.getElementById('soundToggle');
    const volumeControl = document.getElementById('volumeControl');
    const volumeValue = document.getElementById('volumeValue');
    if (soundToggle) {
        soundToggle.checked = settings.sound.enabled !== false;
        soundToggle.addEventListener('change', () => {
            settings.sound.enabled = soundToggle.checked;
            saveSettings(settings);
            if (soundToggle.checked) playTestBeep(settings.sound.volume);
        });
    }
    if (volumeControl) {
        volumeControl.value = settings.sound.volume ?? 50;
        if (volumeValue) volumeValue.textContent = volumeControl.value;
        volumeControl.addEventListener('input', () => {
            settings.sound.volume = parseInt(volumeControl.value, 10);
            if (volumeValue) volumeValue.textContent = volumeControl.value;
            saveSettings(settings);
        });
    }

    const dataTracking = document.getElementById('dataTracking');
    if (dataTracking) {
        dataTracking.checked = settings.privacy.analytics !== false;
        dataTracking.addEventListener('change', () => {
            settings.privacy.analytics = dataTracking.checked;
            saveSettings(settings);
        });
    }

    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            const payload = JSON.stringify({ exported: new Date().toISOString(), settings }, null, 2);
            const blob = new Blob([payload], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'nexus-settings.json';
            a.click();
            URL.revokeObjectURL(url);
        });
    }

    const clearBtn = document.getElementById('clearBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (!confirm('¿Borrar todas las preferencias de Nexus en este navegador?')) return;
            localStorage.removeItem(STORAGE_KEY);
            location.reload();
        });
    }

    const clearCacheBtn = document.getElementById('clearCacheBtn');
    if (clearCacheBtn) {
        clearCacheBtn.addEventListener('click', () => {
            if (typeof clearCache === 'function') clearCache();
            alert('Caché de hojas limpiada.');
        });
    }
});
