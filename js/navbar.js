/**
 * NEXUS COMMUNITY — Navbar reutilizable
 * Nombre de la comunidad = wordmark según tema
 */
(function () {
    try {
        const raw = localStorage.getItem('nexus_user_settings');
        let theme = raw ? (JSON.parse(raw).theme || 'mono') : 'mono';
        if (theme === 'white') theme = 'light';
        if (!['mono', 'light', 'azure'].includes(theme)) theme = 'mono';
        document.documentElement.setAttribute('data-theme', theme);
    } catch {
        document.documentElement.setAttribute('data-theme', 'mono');
    }

    const LINKS = [
        { href: 'index.html',    label: 'Inicio' },
        { href: 'clanes.html',   label: 'Clanes' },
        { href: 'ranking.html',  label: 'Ranking' },
        { href: 'salas.html',    label: 'Salas' },
        { href: 'torneos.html',  label: 'Torneos' },
        { href: 'settings.html', label: 'Config' },
    ];

    const REGISTER_URL = 'https://forms.gle/6WthmbfQMmrYBFdx9';

    const WORDMARKS = {
        mono:  'logo/wordmark-mono.jpg',
        light: 'logo/wordmark-light.jpg',
        azure: 'logo/wordmark-azure.jpg',
    };

    function getTheme() {
        try {
            const raw = localStorage.getItem('nexus_user_settings');
            let t = raw ? JSON.parse(raw).theme : 'mono';
            if (t === 'white') t = 'light';
            if (t === 'mono' || t === 'light' || t === 'azure') return t;
            return 'mono';
        } catch {
            return 'mono';
        }
    }

    function getCurrentPage() {
        const path = window.location.pathname;
        const file = path.split('/').pop() || 'index.html';
        return file === '' ? 'index.html' : file;
    }

    function buildNavbar() {
        const current = getCurrentPage();
        const linksHtml = LINKS.map(link => {
            const active = current === link.href ? ' active' : '';
            return `<li><a href="${link.href}" class="${active.trim()}">${link.label}</a></li>`;
        }).join('');
        const mark = WORDMARKS[getTheme()] || WORDMARKS.mono;

        return `
        <nav class="nx-nav" id="nxNav">
            <div class="nx-nav-inner">
                <a href="index.html" class="nx-logo">
                    <img src="${mark}" alt="Nexus Community" class="nx-wordmark" data-nexus-logo="wordmark">
                </a>
                <ul class="nx-nav-links" id="nxNavLinks">
                    ${linksHtml}
                    <li><a href="${REGISTER_URL}" target="_blank" rel="noopener" class="nx-cta">+ Registrar Clan</a></li>
                </ul>
                <button class="nx-hamburger" id="nxHamburger" aria-label="Menú">
                    <span></span><span></span><span></span>
                </button>
            </div>
        </nav>
        <div class="nx-nav-backdrop" id="nxNavBackdrop"></div>`;
    }

    function injectNavbar() {
        const placeholder = document.getElementById('navbar');
        if (placeholder) {
            placeholder.outerHTML = buildNavbar();
        } else {
            document.body.insertAdjacentHTML('afterbegin', buildNavbar());
        }

        if (window.NexusTheme) {
            window.NexusTheme.apply(window.NexusTheme.get());
        }

        const hamburger = document.getElementById('nxHamburger');
        const navLinks  = document.getElementById('nxNavLinks');
        const backdrop  = document.getElementById('nxNavBackdrop');
        if (!hamburger || !navLinks) return;

        function closeMenu() {
            hamburger.classList.remove('active');
            navLinks.classList.remove('active');
            if (backdrop) backdrop.classList.remove('active');
        }

        hamburger.addEventListener('click', () => {
            const opening = !navLinks.classList.contains('active');
            hamburger.classList.toggle('active', opening);
            navLinks.classList.toggle('active', opening);
            if (backdrop) backdrop.classList.toggle('active', opening);
        });

        navLinks.querySelectorAll('a').forEach(a => {
            a.addEventListener('click', closeMenu);
        });

        if (backdrop) {
            backdrop.addEventListener('click', closeMenu);
        }

        document.addEventListener('click', e => {
            if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
                closeMenu();
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectNavbar);
    } else {
        injectNavbar();
    }
})();