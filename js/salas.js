/**
 * SALAS.JS — Contador en vivo
 * Zona: America/Mexico_City
 *
 * - Salas: LUNES a VIERNES únicamente
 * - Sábado y domingo: no hay salas de juego
 * - Anotaciones: domingo 12:00 PM MX
 * - Color del reloj = color de la sala
 */

document.addEventListener('DOMContentLoaded', () => {
    initSalasCounter();
});

function getMexicoNow() {
    const now = new Date();
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Mexico_City',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        weekday: 'short',
    }).formatToParts(now);

    const get = type => {
        const p = parts.find(x => x.type === type);
        return p ? p.value : null;
    };

    // weekday: Sun Mon Tue Wed Thu Fri Sat
    const wdRaw = get('weekday') || '';
    const weekdayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    let weekday = weekdayMap[wdRaw];
    if (weekday === undefined) {
        // fallback: calcular desde fecha MX
        const y = +get('year');
        const m = +get('month');
        const d = +get('day');
        // mediodía UTC aprox para evitar bordes
        weekday = new Date(Date.UTC(y, m - 1, d, 18, 0, 0)).getUTCDay();
    }

    const hour = parseInt(get('hour'), 10) || 0;
    const minute = parseInt(get('minute'), 10) || 0;
    const second = parseInt(get('second'), 10) || 0;

    return {
        hour,
        minute,
        second,
        weekday, // 0=dom … 6=sáb
        totalMinutes: hour * 60 + minute,
        totalSeconds: hour * 3600 + minute * 60 + second,
    };
}

function parseHora(horaStr) {
    if (!horaStr) return null;
    const s = String(horaStr).trim().toLowerCase().replace(/\s*mx\s*/g, '').trim();
    const ampm = s.match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/i);
    if (ampm) {
        let h = parseInt(ampm[1], 10);
        const m = parseInt(ampm[2], 10);
        const ap = (ampm[3] || '').toLowerCase();
        if (ap === 'pm' && h < 12) h += 12;
        if (ap === 'am' && h === 12) h = 0;
        return h * 60 + m;
    }
    const parts = s.split(':').map(Number);
    if (parts.length >= 2 && !isNaN(parts[0])) return parts[0] * 60 + (parts[1] || 0);
    return null;
}

function formatCountdown(totalSeconds) {
    if (totalSeconds < 0) totalSeconds = 0;
    const d = Math.floor(totalSeconds / 86400);
    const h = Math.floor((totalSeconds % 86400) / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    const pad = n => String(n).padStart(2, '0');
    if (d > 0) return `${d}d ${pad(h)}h ${pad(m)}m ${pad(s)}s`;
    if (h > 0) return `${h}h ${pad(m)}m ${pad(s)}s`;
    return `${m}m ${pad(s)}s`;
}

function formatHoraDisplay(horaStr) {
    const mins = parseHora(horaStr);
    if (mins == null) return horaStr;
    let h = Math.floor(mins / 60);
    const m = mins % 60;
    const ap = h >= 12 ? 'pm' : 'am';
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, '0')} ${ap} mx`;
}

/** Segundos hasta el próximo domingo 12:00 MX (anotaciones) */
function secondsUntilSundayNoon(mx) {
    const noon = 12 * 60; // 12:00
    let daysUntil = (0 - mx.weekday + 7) % 7;
    if (daysUntil === 0 && mx.totalMinutes >= noon) daysUntil = 7;
    if (daysUntil === 0) return noon * 60 - mx.totalSeconds;
    const restToday = 86400 - mx.totalSeconds;
    return restToday + (daysUntil - 1) * 86400 + noon * 60;
}

/**
 * Próxima sala: SOLO lunes a viernes.
 * - Dom (0): → lunes a esa hora
 * - Sáb (6): → lunes a esa hora
 * - Lun–Vie: si aún no llega hoy → hoy; si ya pasó → siguiente día hábil
 */
function secondsUntilNextSala(horaMins, mx) {
    const wd = mx.weekday; // 0=dom … 6=sáb

    // Domingo: resto del domingo + lunes hasta la hora
    if (wd === 0) {
        const restToday = 86400 - mx.totalSeconds;
        return restToday + horaMins * 60;
    }

    // Sábado: resto del sábado + domingo completo + lunes hasta la hora
    if (wd === 6) {
        const restToday = 86400 - mx.totalSeconds;
        return restToday + 86400 + horaMins * 60;
    }

    // Lunes a viernes (1–5)
    if (mx.totalMinutes < horaMins) {
        // Aún no llega hoy
        return horaMins * 60 - mx.totalSeconds;
    }

    // Ya pasó hoy → siguiente día hábil
    const restToday = 86400 - mx.totalSeconds;

    // Viernes después de la hora → lunes
    if (wd === 5) {
        // resto vie + sáb + dom + lun hasta hora
        return restToday + 86400 + 86400 + horaMins * 60;
    }

    // Lun–Jue después de la hora → mañana
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

    const roomColor = getComputedStyle(card).getPropertyValue('--room-color').trim() || '#fff';
    const mx = getMexicoNow();
    const horaMins = parseHora(horaStr);
    if (horaMins == null) {
        countdownEl.textContent = '—';
        return;
    }

    timerEl.textContent = formatHoraDisplay(horaStr);
    timerEl.style.color = roomColor;
    timerEl.style.borderColor = roomColor;
    timerEl.style.boxShadow = `0 0 12px ${roomColor}88, 0 0 24px ${roomColor}44`;

    const secSala = secondsUntilNextSala(horaMins, mx);
    const secAnot = secondsUntilSundayNoon(mx);

    let statusClass = 'status-normal';
    let mainText = '';

    // Fin de semana: no hay salas
    if (!isWeekday(mx)) {
        statusClass = 'status-weekend';
        const dia = mx.weekday === 0 ? 'domingo' : 'sábado';
        mainText = `Sin salas el ${dia} · próxima en ${formatCountdown(secSala)}`;
    } else if (secSala <= 60) {
        statusClass = 'status-active';
        mainText = '🔴 ¡SALA EN VIVO!';
    } else if (secSala <= 15 * 60) {
        statusClass = 'status-warning';
        mainText = `Próxima sala en ${formatCountdown(secSala)}`;
    } else {
        mainText = `Próxima sala en ${formatCountdown(secSala)}`;
    }

    timerEl.className = `room-time ${statusClass}`;
    timerEl.style.color = roomColor;
    timerEl.style.borderColor = roomColor;
    timerEl.style.boxShadow = `0 0 12px ${roomColor}88, 0 0 24px ${roomColor}44`;

    const anotText = `📝 Anotaciones: domingo 12:00 pm mx · en ${formatCountdown(secAnot)}`;

    countdownEl.innerHTML =
        `<div class="countdown-main">${mainText}</div>` +
        `<div class="countdown-anot">${anotText}</div>`;
}

function initSalasCounter() {
    const cards = document.querySelectorAll('.room-card[data-hora]');
    if (!cards.length) return;
    const tick = () => cards.forEach(updateSalaTimer);
    tick();
    setInterval(tick, 1000);
}
