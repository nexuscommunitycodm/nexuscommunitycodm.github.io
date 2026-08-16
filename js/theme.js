/**
 * THEME.JS — Nexus Community
 * mono | light | azure
 * Logos full (hero) + wordmarks (navbar / nombre)
 */
(function () {
    const STORAGE_KEY = 'nexus_user_settings';

    const LOGOS = {
        mono:  'logo/logo.png',
        light: 'logo/logo-light.png',
        azure: 'logo/logo-azure.png',
    };

    const WORDMARKS = {
        mono:  'logo/wordmark-mono.jpg',
        light: 'logo/wordmark-light.jpg',
        azure: 'logo/wordmark-azure.jpg',
    };

    function getTheme() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            let t = raw ? JSON.parse(raw).theme : 'mono';
            if (t === 'white') t = 'light';
            if (t === 'mono' || t === 'light' || t === 'azure') return t;
            return 'mono';
        } catch {
            return 'mono';
        }
    }

    function applyLogos(theme) {
        const full = LOGOS[theme] || LOGOS.mono;
        const mark = WORDMARKS[theme] || WORDMARKS.mono;

        document.querySelectorAll('img.hero-logo, img[data-nexus-logo="full"]').forEach(img => {
            img.classList.toggle('logo-blend', theme === 'mono');
            img.classList.remove('logo-invert');
            img.onerror = function () {
                this.onerror = null;
                this.src = LOGOS.mono;
            };
            img.setAttribute('src', full);
        });

        document.querySelectorAll('img.nx-wordmark, img[data-nexus-logo="wordmark"], .nx-logo img').forEach(img => {
            img.classList.remove('logo-invert');
            img.onerror = function () {
                this.onerror = null;
                this.src = WORDMARKS.mono;
            };
            img.setAttribute('src', mark);
        });
    }

    function applyTheme(theme) {
        const t = LOGOS[theme] ? theme : 'mono';
        document.documentElement.setAttribute('data-theme', t);
        applyLogos(t);
        document.querySelectorAll('.theme-card').forEach(card => {
            card.classList.toggle('active', card.getAttribute('data-theme') === t);
        });
    }

    window.NexusTheme = { get: getTheme, apply: applyTheme, LOGOS, WORDMARKS };

    applyTheme(getTheme());

    document.addEventListener('DOMContentLoaded', () => {
        applyTheme(getTheme());
        setTimeout(() => applyTheme(getTheme()), 80);
    });
})();
