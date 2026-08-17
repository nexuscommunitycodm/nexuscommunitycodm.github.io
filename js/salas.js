/**
 * SALAS.JS — Contador en vivo
 * Zona: America/Mexico_City
 * - Salas: lunes a viernes
 * - Sábado y domingo: sin salas
 * - Anotaciones: domingo 12:00 PM MX
 */

document.addEventListener('DOMContentLoaded', () => {
    initSalasCounter();
});

function getMexicoNow() {
    const fmt = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Mexico_City',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        weekday: 'short',
    });
    const parts = fmt.formatToParts(new Date());
    const get = type => {
        const p = parts.find(x => x.type === type);
        return p ? p.value : null;
    };

    const wdRaw = get('weekday') || '';
    const map = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    let weekday = map[wdRaw];
    if (weekday === undefined) {
        const y = +get('year'), m = +get('month'), d = +get('day');
        weekday = new Date(Date.UTC(y, m - 1, d, 18, 0, 0)).getUTCDay();
    }

    const hour = parseInt(get('hour'), 10) || 0;
    const minute = parseInt(get('minute'), 10) || 0;
    const second = parseInt(get('second'), 10) || 0;

    return {
        hour, minute, second, weekday,
        totalMinutes: hour * 60 + minute,
        totalSeconds: hour * 3600 + minute * 60 + second,
    };
}

function parseHora(horaStr) {
    if (horaStr == null || horaStr === '') return null;
    const s = String(horaStr).trim().toLowerCase().replace(/\s*mx\s*/gi, '').trim();
    const ampm = s.match(/^(\d{1,2}):(\d{2})\s*(a\.?m\.?|p\.?m\.?)?$/i);
    if (ampm) {
        let h = parseInt(ampm[1], 10);
        const m = parseInt(ampm[2], 10) || 0;
        const ap = (ampm[3] || '').toLowerCase().replace(/\./g, '');
        if (ap.startsWith('p') && h < 12) h += 12;
        if (ap.startsWith('a') && h === 12) h = 0;
        return h * 60 + m;
    }
    const parts = s.split(':');
    if (parts.length >= 2) {
        const h = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) || 0;
        if (!isNaN(h)) return h * 60 + m;
    }
    return null;
}

function formatCountdown(totalSeconds) {
    let s = Math.max(0, Math.floor(totalSeconds));
    const d = Math.floor(s / 86400);
    s %= 86400;
    const h = Math.floor(s / 3600);
    s %= 3600;
    const m = Math.floor(s / 60);
    const sec = s % 60;
    const pad = n => String(n).padStart(2, '0');
    if (d > 0) return `${d}d ${pad(h)}h ${pad(m)}m ${pad(sec)}s`;
    if (h > 0) return `${h}h ${pad(m)}m ${pad(sec)}s`;
    return `${m}m ${pad(sec)}s`;
}

function formatHoraDisplay(horaStr) {
    const mins = parseHora(horaStr);
    if (mins == null) return String(horaStr || '');
    let h = Math.floor(mins / 60);
    const m = mins % 60;
    const ap = h >= 12 ? 'pm' : 'am';
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, '0')} ${ap} mx`;
}

function secondsUntilSundayNoon(mx) {
    const noon = 12 * 60;
    let daysUntil = (0 - mx.weekday + 7) % 7;
    if (daysUntil === 0 && mx.totalMinutes >= noon) daysUntil = 7;
    if (daysUntil === 0) return noon * 60 - mx.totalSeconds;
    const restToday = 86400 - mx.totalSeconds;
    return restToday + (daysUntil - 1) * 86400 + noon * 60;
}

/** Próxima sala solo lun–vie */
function secondsUntilNextSala(horaMins, mx) {
    const wd = mx.weekday;

    if (wd === 0) {
        // domingo → lunes
        return (86400 - mx.totalSeconds) + horaMins * 60;
    }
    if (wd === 6) {
        // sábado → lunes
        return (86400 - mx.totalSeconds) + 86400 + horaMins * 60;
    }

    // lun–vie
    if (mx.totalMinutes < horaMins) {
        return horaMins * 60 - mx.totalSeconds;
    }

    const restToday = 86400 - mx.totalSeconds;
    if (wd === 5) {
        // viernes pasado → lunes
        return restToday + 86400 + 86400 + horaMins * 60;
    }
    // lun–jue pasado → mañana
    return restToday + horaMins * 60;
}

function isWeekday(mx) {
    return mx.weekday >= 1 && mx.weekday <= 5;
}

function updateSalaTimer(card) {
    const horaStr = card.getAttribute('data-hora');
    const timerEl = card.querySelector('.room-time');
    const countdownEl = card.querySelector('.room-countdown');
    if (!timerEl || !countdownEl) return;

    const roomColor = (getComputedStyle(card).getPropertyValue('--room-color') || '#ffffff').trim();
    const mx = getMexicoNow();
    const horaMins = parseHora(horaStr);

    if (horaMins == null) {
        timerEl.textContent = horaStr || '—';
        countdownEl.innerHTML = '<div class="countdown-main">Horario no configurado</div>';
        return;
    }

    const secSala = secondsUntilNextSala(horaMins, mx);
    const secAnot = secondsUntilSundayNoon(mx);

    // Verde Limited demasiado oscuro → usar tono legible
    let displayColor = roomColor;
    if (/#183a15/i.test(roomColor)) displayColor = '#3DDB6A';

    timerEl.textContent = formatHoraDisplay(horaStr);
    timerEl.style.setProperty('--room-color', displayColor);
    timerEl.style.color = displayColor;
    timerEl.style.borderColor = displayColor;
    timerEl.style.textShadow = 'none';
    timerEl.style.boxShadow = 'none';

    let statusClass = 'status-normal';
    let mainText = '';

    if (!isWeekday(mx)) {
        statusClass = 'status-weekend';
        const dia = mx.weekday === 0 ? 'domingo' : 'sábado';
        mainText = `Sin salas el ${dia} · próxima en ${formatCountdown(secSala)}`;
    } else if (secSala <= 90) {
        // ventana en vivo ~1.5 min alrededor del inicio
        statusClass = 'status-active';
        mainText = '🔴 ¡SALA EN VIVO!';
    } else if (secSala <= 15 * 60) {
        statusClass = 'status-warning';
        mainText = `Próxima sala en ${formatCountdown(secSala)}`;
    } else {
        mainText = `Próxima sala en ${formatCountdown(secSala)}`;
    }

    timerEl.className = 'room-time ' + statusClass;

    const anotText = `📝 Anotaciones: domingo 12:00 pm mx · en ${formatCountdown(secAnot)}`;

    countdownEl.innerHTML =
        `<div class="countdown-main">${mainText}</div>` +
        `<div class="countdown-anot">${anotText}</div>`;
}

function initSalasCounter() {
    const cards = document.querySelectorAll('.room-card[data-hora]');
    if (!cards.length) {
        console.warn('Nexus salas: no se encontraron .room-card[data-hora]');
        return;
    }
    const tick = () => {
        try {
            cards.forEach(updateSalaTimer);
        } catch (e) {
            console.error('Nexus salas timer:', e);
        }
    };
    tick();
    setInterval(tick, 1000);
}
