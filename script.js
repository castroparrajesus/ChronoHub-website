/* ════════════════════════════════════════════════════
   UTILS
════════════════════════════════════════════════════ */
const p2 = (n) => String(n).padStart(2, '0');
const p3 = (n) => String(n).padStart(3, '0');
const $  = (id) => document.getElementById(id);

function toast(msg, type = 'info', dur = 2800) {
  const c = $('toasts');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  const icon = { success: '✓', error: '✗', info: '◈' }[type] || '◈';
  t.innerHTML = `<span style="font-size:.95rem">${icon}</span><span class="toast-msg">${msg}</span>`;
  c.appendChild(t);
  setTimeout(() => {
    t.style.animation = 'toast-out .18s ease forwards';
    setTimeout(() => t.remove(), 180);
  }, dur);
}

// In-memory store (localStorage not available in all environments)
const _store = {};
function save(k, v) { try { _store[k] = JSON.stringify(v); localStorage.setItem(k, JSON.stringify(v)); } catch(e) { _store[k] = JSON.stringify(v); } }
function load(k, def = null) {
  try {
    const v = _store[k] !== undefined ? _store[k] : localStorage.getItem(k);
    return (v !== null && v !== undefined) ? JSON.parse(v) : def;
  } catch(e) { return def; }
}

// State declarations — must be before tickLive()
let alarms = load('alarms', null) || [];
let worldList = load('worldClocks', null) || ['America/New_York', 'Europe/London', 'Asia/Tokyo', 'America/Bogota'];

function fmtHMS(s) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return h > 0 ? `${p2(h)}:${p2(m)}:${p2(ss)}` : `${p2(m)}:${p2(ss)}`;
}

function requestNotif() {
  if ('Notification' in window && Notification.permission === 'default')
    Notification.requestPermission();
}

function notify(title, body) {
  if ('Notification' in window && Notification.permission === 'granted') {
    const n = new Notification(title, { body, requireInteraction: true });
    n.onclick = () => { window.focus(); n.close(); };
  }
}

/* ════════════════════════════════════════════════════
   NAVIGATION
════════════════════════════════════════════════════ */
const PANEL_LABELS = {
  timer: 'Temporizador', pomodoro: 'Pomodoro', stopwatch: 'Cronómetro',
  alarm: 'Alarma', countdown: 'Cuenta Atrás', clock: 'Reloj',
  world: 'Reloj Mundial', datecalc: 'Calc. Fechas', timecalc: 'Calc. Horas',
  week: 'Semana', age: 'Calc. Edad'
};

function go(id) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn[data-panel], .bnav-btn[data-panel]').forEach(b => b.classList.remove('active'));
  $(`panel-${id}`).classList.add('active');
  document.querySelectorAll(`[data-panel="${id}"]`).forEach(b => b.classList.add('active'));
  $('topbar-label').textContent = PANEL_LABELS[id] || id;
  save('lastPanel', id);
  if (id === 'clock') initClockTicks();
  if (id === 'world') worldRender();
  if (id === 'week')  weekRender();
}

const lastPanel = load('lastPanel', 'timer');
go(lastPanel);

/* ════════════════════════════════════════════════════
   LIVE CLOCK — topbar + clock panel
════════════════════════════════════════════════════ */
function tickLive() {
  const now = new Date();
  const hh = p2(now.getHours()), mm = p2(now.getMinutes()), ss = p2(now.getSeconds());

  $('topbar-clock').textContent = `${hh}:${mm}:${ss}`;

  $('clock-digital').textContent = `${hh}:${mm}:${ss}`;
  const days   = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
  const months = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  $('clock-date-txt').textContent = `${days[now.getDay()]}, ${now.getDate()} de ${months[now.getMonth()]} de ${now.getFullYear()}`;
  $('clock-tz-txt').textContent   = Intl.DateTimeFormat().resolvedOptions().timeZone;
  $('clock-secs-fill').style.width = (now.getSeconds() / 59 * 100) + '%';

  worldTick(now);
  checkAlarms(now);
}

setInterval(tickLive, 1000);
tickLive();

/* ════════════════════════════════════════════════════
   ANALOG CLOCK
════════════════════════════════════════════════════ */
function initClockTicks() {
  const g = $('clock-ticks');
  if (g.children.length > 0) return;
  for (let i = 0; i < 60; i++) {
    const major = i % 5 === 0;
    const rad = (i / 60) * 2 * Math.PI - Math.PI / 2;
    const r1 = major ? 82 : 88, r2 = 95;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', 100 + r1 * Math.cos(rad));
    line.setAttribute('y1', 100 + r1 * Math.sin(rad));
    line.setAttribute('x2', 100 + r2 * Math.cos(rad));
    line.setAttribute('y2', 100 + r2 * Math.sin(rad));
    line.setAttribute('class', major ? 'clock-tick-maj' : 'clock-tick');
    line.setAttribute('stroke-width', major ? '2' : '1');
    g.appendChild(line);
  }
}

function setHand(id, deg, cx, cy, tipY) {
  const el = $(id); if (!el) return;
  const a = (deg - 90) * Math.PI / 180;
  const len = cy - tipY;
  el.setAttribute('x2', cx + len * Math.cos(a));
  el.setAttribute('y2', cy + len * Math.sin(a));
}

function setHandWithTail(id, deg, cx, cy, tipY, tailY) {
  const el = $(id); if (!el) return;
  const a = (deg - 90) * Math.PI / 180;
  const lenTip  = cy - tipY;
  const lenTail = tailY - cy;
  el.setAttribute('x1', cx - lenTail * Math.cos(a));
  el.setAttribute('y1', cy - lenTail * Math.sin(a));
  el.setAttribute('x2', cx + lenTip  * Math.cos(a));
  el.setAttribute('y2', cy + lenTip  * Math.sin(a));
}

function tickAnalog() {
  const now = new Date();
  const s = now.getSeconds() + now.getMilliseconds() / 1000;
  const m = now.getMinutes() + s / 60;
  const h = (now.getHours() % 12) + m / 60;
  setHand('hour-hand',        h / 12 * 360, 100, 100, 55);
  setHand('min-hand',         m / 60 * 360, 100, 100, 25);
  setHandWithTail('sec-hand', s / 60 * 360, 100, 100, 20, 115);
}

setInterval(tickAnalog, 50);
tickAnalog();
initClockTicks();

/* ════════════════════════════════════════════════════
   TIMER
════════════════════════════════════════════════════ */
const TI = { total: 300, rem: 300, running: false, iv: null };

function timerGetInput() {
  return (parseInt($('t-h').value) || 0) * 3600
       + (parseInt($('t-m').value) || 0) * 60
       + (parseInt($('t-s').value) || 0);
}

function timerSetInput(s) {
  $('t-h').value = Math.floor(s / 3600);
  $('t-m').value = Math.floor((s % 3600) / 60);
  $('t-s').value = s % 60;
}

function timerUpdateRing() {
  const pct  = TI.total > 0 ? Math.max(0, TI.rem / TI.total) : 1;
  const circ = 2 * Math.PI * 120;
  $('ring-fill').style.strokeDashoffset = (1 - pct) * circ;
  $('ring-time').textContent = fmtHMS(Math.max(0, TI.rem));
}

function timerPreset(s) {
  clearInterval(TI.iv); TI.running = false;
  TI.total = s; TI.rem = s;
  timerSetInput(s);
  $('timer-btn-start').style.display = ''; $('timer-btn-start').textContent = '▶ Iniciar';
  $('timer-btn-pause').style.display = 'none';
  $('ring-fill').className = 'ring-fill';
  $('ring-time').className = 'ring-time';
  $('ring-status').textContent = 'LISTO';
  $('t-h').disabled = $('t-m').disabled = $('t-s').disabled = false;
  timerUpdateRing();
}

function timerStart() {
  if (!TI.running) {
    const inp = timerGetInput();
    if (TI.rem <= 0 && inp <= 0) { toast('Establece un tiempo mayor a 0', 'error'); return; }
    if (TI.rem <= 0) { TI.total = inp; TI.rem = inp; }
    if (TI.total <= 0) TI.total = TI.rem;
  }
  TI.running = true;
  $('timer-btn-start').style.display = 'none';
  $('timer-btn-pause').style.display = '';
  $('ring-fill').classList.add('running');
  $('ring-time').classList.add('running');
  $('ring-status').textContent = 'CORRIENDO';
  $('t-h').disabled = $('t-m').disabled = $('t-s').disabled = true;
  clearInterval(TI.iv);
  TI.iv = setInterval(() => {
    TI.rem--;
    timerUpdateRing();
    document.title = `⏱ ${fmtHMS(TI.rem)} — ChronoHub`;
    if (TI.rem <= 0) timerFinish();
  }, 1000);
  toast('Temporizador iniciado', 'success');
}

function timerPause() {
  TI.running = false; clearInterval(TI.iv);
  $('timer-btn-start').style.display = ''; $('timer-btn-start').textContent = '▶ Reanudar';
  $('timer-btn-pause').style.display = 'none';
  $('ring-fill').classList.remove('running');
  $('ring-time').classList.remove('running');
  $('ring-status').textContent = 'PAUSADO';
  toast('Pausado', 'info', 2000);
}

function timerReset() {
  clearInterval(TI.iv); TI.running = false;
  const inp = timerGetInput();
  TI.total = inp > 0 ? inp : 300;
  TI.rem = TI.total;
  $('timer-btn-start').style.display = ''; $('timer-btn-start').textContent = '▶ Iniciar';
  $('timer-btn-pause').style.display = 'none';
  $('ring-fill').className  = 'ring-fill';
  $('ring-time').className  = 'ring-time';
  $('ring-status').textContent = 'LISTO';
  $('t-h').disabled = $('t-m').disabled = $('t-s').disabled = false;
  timerUpdateRing();
  document.title = 'ChronoHub';
}

function timerFinish() {
  clearInterval(TI.iv); TI.running = false;
  $('ring-fill').className = 'ring-fill done';
  $('ring-time').className = 'ring-time done';
  $('ring-status').textContent = '¡TIEMPO!';
  $('timer-btn-start').style.display = ''; $('timer-btn-start').textContent = '▶ Iniciar';
  $('timer-btn-pause').style.display = 'none';
  $('t-h').disabled = $('t-m').disabled = $('t-s').disabled = false;
  beep();
  notify('⏰ ¡Tiempo terminado!', 'Tu temporizador ha finalizado.');
  toast('¡Temporizador completado!', 'success', 4000);
  timerAddHistory();
  document.title = 'ChronoHub';
  if ($('t-auto').checked) {
    setTimeout(() => { TI.rem = TI.total; timerUpdateRing(); timerStart(); }, 2000);
  }
}

function timerAddHistory() {
  const h = load('timerHistory', []);
  h.unshift({
    t: fmtHMS(TI.total),
    d: new Date().toLocaleString('es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  });
  if (h.length > 10) h.pop();
  save('timerHistory', h);
  renderTimerHistory();
}

function renderTimerHistory() {
  const h  = load('timerHistory', []);
  const el = $('timer-history');
  if (!h.length) { el.innerHTML = '<div class="hist-empty">Sin historial aún</div>'; return; }
  el.innerHTML = h.map(x =>
    `<div class="hist-item"><span class="hist-t">${x.t}</span><span class="hist-d">${x.d}</span></div>`
  ).join('');
}

function saveTimerSettings() {
  save('timerSettings', {
    sound: $('t-sound').value,
    vol:   $('t-vol').value,
    auto:  $('t-auto').checked,
    notif: $('t-notif').checked
  });
}

function loadTimerSettings() {
  const s = load('timerSettings');
  if (!s) return;
  $('t-sound').value  = s.sound || 'beep';
  $('t-vol').value    = s.vol   || 70;
  $('t-vol-val').textContent = (s.vol || 70) + '%';
  $('t-auto').checked  = !!s.auto;
  $('t-notif').checked = s.notif !== false;
}

loadTimerSettings();
renderTimerHistory();
timerUpdateRing();

/* ════════════════════════════════════════════════════
   POMODORO
════════════════════════════════════════════════════ */
const POMO = {
  mode: 'work', running: false, iv: null,
  rem: 25 * 60, total: 25 * 60, cycle: 1,
  cfg: { work: 25, short: 5, long: 15, cycles: 4 }
};

function pomoGetTotal(mode) {
  const key = mode === 'work' ? 'work' : mode === 'short' ? 'short' : 'long';
  return POMO.cfg[key] * 60;
}

function pomoMode(m, el) {
  if (POMO.running) pomoPause();
  POMO.mode  = m;
  POMO.total = pomoGetTotal(m);
  POMO.rem   = POMO.total;
  document.querySelectorAll('.pomo-mode').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  pomoUpdateRing();
  $('pomo-status').textContent = { work: 'TRABAJO', short: 'PAUSA CORTA', long: 'PAUSA LARGA' }[m];
  const colors = { work: 'var(--o)', short: 'var(--g)', long: 'var(--c)' };
  $('pomo-ring-fill').style.stroke = colors[m];
}

function pomoUpdateRing() {
  const pct  = POMO.total > 0 ? (POMO.rem / POMO.total) : 1;
  const circ = 2 * Math.PI * 110;
  $('pomo-ring-fill').style.strokeDashoffset = (1 - pct) * circ;
  $('pomo-time').textContent = fmtHMS(POMO.rem);
}

function pomoStart() {
  if (POMO.rem <= 0) { POMO.rem = POMO.total; pomoUpdateRing(); }
  POMO.running = true;
  $('pomo-btn-start').style.display = 'none';
  $('pomo-btn-pause').style.display = '';
  $('pomo-status').textContent = 'CORRIENDO';
  clearInterval(POMO.iv);
  POMO.iv = setInterval(() => {
    POMO.rem--;
    pomoUpdateRing();
    document.title = `🍅 ${fmtHMS(POMO.rem)} — Pomodoro`;
    if (POMO.rem <= 0) pomoFinish();
  }, 1000);
}

function pomoPause() {
  POMO.running = false; clearInterval(POMO.iv);
  $('pomo-btn-start').style.display = ''; $('pomo-btn-start').textContent = '▶ Continuar';
  $('pomo-btn-pause').style.display = 'none';
  $('pomo-status').textContent = 'PAUSADO';
}

function pomoReset() {
  clearInterval(POMO.iv); POMO.running = false;
  POMO.rem = POMO.total;
  $('pomo-btn-start').style.display = ''; $('pomo-btn-start').textContent = '▶ Iniciar';
  $('pomo-btn-pause').style.display = 'none';
  $('pomo-status').textContent = 'LISTO';
  pomoUpdateRing();
  document.title = 'ChronoHub';
}

function pomoSkip() { clearInterval(POMO.iv); POMO.rem = 0; pomoFinish(); }

function pomoFinish() {
  clearInterval(POMO.iv); POMO.running = false;
  beep();
  const wasWork = POMO.mode === 'work';
  $('pomo-btn-start').style.display = ''; $('pomo-btn-start').textContent = '▶ Iniciar';
  $('pomo-btn-pause').style.display = 'none';
  document.title = 'ChronoHub';
  if (wasWork) {
    toast(`🍅 Pomodoro ${POMO.cycle} completado!`, 'success', 4000);
    notify('🍅 Pomodoro completo', '¡Hora de descansar!');
    pomoUpdateDots();
    if (POMO.cycle >= POMO.cfg.cycles) {
      POMO.cycle = 1;
      setTimeout(() => { document.querySelectorAll('.pomo-mode')[2].click(); }, 500);
    } else {
      POMO.cycle++; $('pomo-cycle-num').textContent = POMO.cycle;
      setTimeout(() => { document.querySelectorAll('.pomo-mode')[1].click(); }, 500);
    }
  } else {
    toast('Pausa terminada. ¡A trabajar!', 'info', 3000);
    setTimeout(() => { document.querySelectorAll('.pomo-mode')[0].click(); }, 500);
  }
}

function pomoBuildDots() {
  const d = $('pomo-dots'); d.innerHTML = '';
  for (let i = 0; i < POMO.cfg.cycles; i++) {
    const dot = document.createElement('div');
    dot.className = 'pomo-dot'; dot.id = `pd-${i}`;
    d.appendChild(dot);
  }
  $('pomo-cycle-total').textContent = POMO.cfg.cycles;
  pomoUpdateDots();
}

function pomoUpdateDots() {
  document.querySelectorAll('.pomo-dot').forEach((d, i) => {
    d.classList.remove('done', 'current');
    if (i < POMO.cycle - 1) d.classList.add('done');
    if (i === POMO.cycle - 1) d.classList.add('current');
  });
}

function pomoAdj(k, delta) {
  const min = { work: 1, short: 1, long: 1, cycles: 1 }[k];
  const max = { work: 60, short: 30, long: 60, cycles: 8 }[k];
  POMO.cfg[k] = Math.max(min, Math.min(max, POMO.cfg[k] + delta));
  $(`ps-${k}`).textContent = POMO.cfg[k];
  if (!POMO.running) {
    if (k !== 'cycles') { POMO.total = pomoGetTotal(POMO.mode); POMO.rem = POMO.total; pomoUpdateRing(); }
    else pomoBuildDots();
  }
  save('pomoCfg', POMO.cfg);
}

const savedPomoCfg = load('pomoCfg');
if (savedPomoCfg) {
  POMO.cfg = savedPomoCfg;
  ['work', 'short', 'long', 'cycles'].forEach(k => { if ($(`ps-${k}`)) $(`ps-${k}`).textContent = POMO.cfg[k]; });
}
pomoBuildDots();
pomoUpdateRing();

/* ════════════════════════════════════════════════════
   STOPWATCH
════════════════════════════════════════════════════ */
const SW = { running: false, iv: null, elapsed: 0, start: 0, laps: [] };

function swFmt(ms) {
  const h  = Math.floor(ms / 3600000);
  const m  = Math.floor((ms % 3600000) / 60000);
  const s  = Math.floor((ms % 60000) / 1000);
  const cs = ms % 1000;
  return (h > 0 ? `${p2(h)}:` : '') + (h > 0 ? p2(m) : m) + `:${p2(s)}<span class="ms">.${p3(cs)}</span>`;
}

function swStart() {
  SW.start   = Date.now() - SW.elapsed;
  SW.running = true;
  $('sw-btn-start').style.display = 'none';
  $('sw-btn-pause').style.display = '';
  clearInterval(SW.iv);
  SW.iv = setInterval(() => {
    SW.elapsed = Date.now() - SW.start;
    $('sw-display').innerHTML = swFmt(SW.elapsed);
  }, 30);
}

function swPause() {
  clearInterval(SW.iv); SW.running = false;
  $('sw-btn-start').style.display = ''; $('sw-btn-start').textContent = '▶ Continuar';
  $('sw-btn-pause').style.display = 'none';
}

function swLap() {
  if (!SW.running) return;
  SW.laps.unshift({ total: SW.elapsed, num: SW.laps.length + 1 });
  $('sw-lap-count').textContent = SW.laps.length;
  renderLaps();
}

function swReset() {
  clearInterval(SW.iv); SW.running = false; SW.elapsed = 0; SW.laps = [];
  $('sw-display').innerHTML = '00:00<span class="ms">.000</span>';
  $('sw-btn-start').style.display = ''; $('sw-btn-start').textContent = '▶ Iniciar';
  $('sw-btn-pause').style.display = 'none';
  $('sw-lap-count').textContent = '0';
  $('sw-laps').innerHTML = '';
}

function renderLaps() {
  const times = SW.laps.map((l, i) =>
    i < SW.laps.length - 1 ? l.total - SW.laps[i + 1].total : l.total
  );
  const best = Math.min(...times), worst = Math.max(...times);
  $('sw-laps').innerHTML = SW.laps.map((l, i) => {
    const split = times[i];
    const cls = times.length > 1
      ? (split === best ? 'lap-best' : split === worst ? 'lap-worst' : '')
      : '';
    return `<div class="lap-row ${cls}">
      <div class="lap-num">Vuelta ${SW.laps.length - i}</div>
      <div class="lap-time">${swFmt(split).replace(/<[^>]+>/g, '')}</div>
    </div>`;
  }).join('');
}

/* ════════════════════════════════════════════════════
   ALARM
════════════════════════════════════════════════════ */

function alarmAdd() {
  const t = $('alarm-time').value;
  if (!t) { toast('Selecciona una hora', 'error'); return; }
  const a = { id: Date.now(), time: t, name: $('alarm-name').value || '', on: true };
  alarms.push(a);
  save('alarms', alarms);
  renderAlarms();
  toast('Alarma configurada', 'success');
  $('alarm-name').value = '';
}

function alarmDel(id) {
  alarms = alarms.filter(a => a.id !== id);
  save('alarms', alarms);
  renderAlarms();
  toast('Alarma eliminada', 'success', 2000);
}

function alarmToggle(id) {
  const a = alarms.find(a => a.id === id); if (!a) return;
  a.on = !a.on;
  save('alarms', alarms);
  renderAlarms();
}

function renderAlarms() {
  const el = $('alarms-list');
  if (!alarms.length) { el.innerHTML = '<div class="empty-msg">Sin alarmas activas</div>'; return; }
  el.innerHTML = alarms.map(a => `
    <div class="alarm-card ${a.on ? '' : 'inactive'}">
      <div class="alarm-card-time">${a.time}</div>
      <div class="alarm-card-info">
        <div class="alarm-card-name">${a.name || 'Alarma'}</div>
        <div class="alarm-card-status">${a.on ? 'Activa' : 'Inactiva'}</div>
      </div>
      <button class="alarm-toggle ${a.on ? 'on' : ''}" data-action="alarmToggle(${a.id})"></button>
      <button class="btn btn-r" style="padding:5px 10px;font-size:8px" data-action="alarmDel(${a.id})">✕</button>
    </div>`).join('');
}

function checkAlarms(now) {
  const cur = `${p2(now.getHours())}:${p2(now.getMinutes())}`;
  alarms.forEach(a => {
    if (a.on && a.time === cur && now.getSeconds() === 0 && !a._fired) {
      a._fired = true;
      beep();
      notify(`⏰ Alarma: ${a.time}`, a.name || 'Alarma activada');
      toast(`⏰ Alarma: ${a.time}${a.name ? ' — ' + a.name : ''}`, 'success', 6000);
      setTimeout(() => a._fired = false, 61000);
    }
  });
}

renderAlarms();

/* ════════════════════════════════════════════════════
   COUNTDOWN — MULTIPLE
════════════════════════════════════════════════════ */
let countdowns = []; // [{ id, name, target(ms), total(ms), iv }]

function cdAdd() {
  const d = $('cd-date').value;
  if (!d) { toast('Selecciona una fecha', 'error'); return; }
  const target = new Date(`${d}T${$('cd-time').value || '00:00'}`);
  if (target <= new Date()) { toast('La fecha debe ser futura', 'error'); return; }
  const name = $('cd-name').value.trim() || 'Evento';
  const id   = Date.now();
  const total = target.getTime() - Date.now();
  const cd = { id, name, target: target.getTime(), total, iv: null };
  cd.iv = setInterval(() => cdTickOne(id), 1000);
  countdowns.push(cd);
  cdRender();
  cdTickOne(id);
  $('cd-name').value = '';
  $('cd-date').value = '';
  toast(`"${name}" añadida`, 'success', 2000);
}

function cdDel(id) {
  const cd = countdowns.find(c => c.id === id);
  if (cd && cd.iv) clearInterval(cd.iv);
  countdowns = countdowns.filter(c => c.id !== id);
  cdRender();
}

function cdTickOne(id) {
  const cd = countdowns.find(c => c.id === id);
  if (!cd) return;
  const diff = cd.target - Date.now();
  const card = document.getElementById('cd-card-' + id);
  if (!card) return;

  if (diff <= 0) {
    clearInterval(cd.iv);
    card.classList.add('finished');
    card.querySelector('.cd-card-num-d').textContent = '0';
    card.querySelector('.cd-card-num-h').textContent = '0';
    card.querySelector('.cd-card-num-m').textContent = '0';
    card.querySelector('.cd-card-num-s').textContent = '0';
    card.querySelector('.cd-card-bar').style.width = '100%';
    beep();
    toast(`⌛ ¡${cd.name} ha llegado!`, 'success', 5000);
    return;
  }

  card.querySelector('.cd-card-num-d').textContent = Math.floor(diff / 86400000);
  card.querySelector('.cd-card-num-h').textContent = Math.floor((diff % 86400000) / 3600000);
  card.querySelector('.cd-card-num-m').textContent = Math.floor((diff % 3600000) / 60000);
  card.querySelector('.cd-card-num-s').textContent = Math.floor((diff % 60000) / 1000);
  const pct = Math.min(100, (1 - diff / cd.total) * 100);
  card.querySelector('.cd-card-bar').style.width = pct + '%';
}

function cdRender() {
  const list = $('cd-list');
  const empty = $('cd-empty');
  if (!countdowns.length) {
    if (empty) empty.style.display = '';
    // Remove all cards
    list.querySelectorAll('.cd-card').forEach(c => c.remove());
    return;
  }
  if (empty) empty.style.display = 'none';

  // Add cards for new countdowns (don't re-render existing ones to avoid flicker)
  countdowns.forEach(cd => {
    if (!document.getElementById('cd-card-' + cd.id)) {
      const dateStr = new Date(cd.target).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
      const card = document.createElement('div');
      card.className = 'cd-card';
      card.id = 'cd-card-' + cd.id;
      card.innerHTML = `
        <div class="cd-card-header">
          <span class="cd-card-name">${cd.name}</span>
          <span style="display:flex;align-items:center;gap:6px">
            <span class="cd-card-date">${dateStr}</span>
            <button class="cd-card-del" data-action="cdDel(${cd.id})">✕</button>
          </span>
        </div>
        <div class="cd-card-units">
          <div class="cd-card-unit"><div class="cd-card-num cd-card-num-d">0</div><div class="cd-card-lbl">Días</div></div>
          <div class="cd-card-unit"><div class="cd-card-num cd-card-num-h">0</div><div class="cd-card-lbl">Horas</div></div>
          <div class="cd-card-unit"><div class="cd-card-num cd-card-num-m">0</div><div class="cd-card-lbl">Min</div></div>
          <div class="cd-card-unit"><div class="cd-card-num cd-card-num-s">0</div><div class="cd-card-lbl">Seg</div></div>
        </div>
        <div class="cd-card-progress"><div class="cd-card-bar" style="width:0%"></div></div>
      `;
      list.appendChild(card);
    }
  });
}

/* ════════════════════════════════════════════════════
   WORLD CLOCKS
════════════════════════════════════════════════════ */

function worldAdd() {
  const tz = $('world-select').value;
  if (worldList.includes(tz)) { toast('Ya está añadida', 'error'); return; }
  worldList.push(tz);
  save('worldClocks', worldList);
  worldRender();
  toast('Ciudad añadida', 'success', 2000);
}

function worldDel(tz) {
  worldList = worldList.filter(t => t !== tz);
  save('worldClocks', worldList);
  worldRender();
}

function worldRender() {
  const local = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const now   = new Date();
  $('world-grid').innerHTML = worldList.map(tz => {
    const t    = now.toLocaleTimeString('es-ES', { timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const day  = now.toLocaleDateString('es-ES', { timeZone: tz, weekday: 'short' });
    const city = tz.split('/').pop().replace(/_/g, ' ');
    const id   = 'wc-' + tz.replace(/\//g, '-');
    return `<div class="world-card ${tz === local ? 'local-tz' : ''}" id="${id}">
      <div class="world-city">${city}</div>
      <div class="world-time">${t}</div>
      <div class="world-tz">${tz}</div>
      <div class="world-day">${day}</div>
      ${tz !== local ? `<button class="world-del" data-action="worldDel('${tz}')">✕</button>` : ''}
    </div>`;
  }).join('');
}

function worldTick(now) {
  worldList.forEach(tz => {
    const el = document.getElementById('wc-' + tz.replace(/\//g, '-'));
    if (!el) return;
    el.querySelector('.world-time').textContent = now.toLocaleTimeString('es-ES', { timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    el.querySelector('.world-day').textContent  = now.toLocaleDateString('es-ES', { timeZone: tz, weekday: 'short' });
  });
}

worldRender();

/* ════════════════════════════════════════════════════
   DATE CALC
════════════════════════════════════════════════════ */
function dcDiff() {
  const f = $('dc-from').value, t = $('dc-to').value;
  if (!f || !t) { toast('Completa ambas fechas', 'error'); return; }
  const diff = Math.abs(new Date(t) - new Date(f));
  const days = Math.floor(diff / 86400000);
  $('dc-diff-main').textContent = `${days.toLocaleString()} días`;
  $('dc-diff-sub').innerHTML    = `${Math.floor(days / 7)} semanas · ${Math.floor(days / 30.44)} meses aprox. · ${Math.floor(days / 365.25)} años aprox.`;
  $('dc-diff-result').style.display = 'block';
}

function dcAdd(sign) {
  const bd = $('dc-base-date').value;
  if (!bd) { toast('Completa la fecha', 'error'); return; }
  const d = new Date(`${bd}T${$('dc-base-time').value || '00:00'}`);
  d.setDate(d.getDate()       + sign * (parseInt($('dc-add-d').value) || 0));
  d.setHours(d.getHours()     + sign * (parseInt($('dc-add-h').value) || 0));
  d.setMinutes(d.getMinutes() + sign * (parseInt($('dc-add-m').value) || 0));
  $('dc-add-result').textContent =
    d.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    + ' · '
    + d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

/* ════════════════════════════════════════════════════
   TIME CALC
════════════════════════════════════════════════════ */
function tcCalc(op) {
  const t1 = (parseInt($('tc-h1').value) || 0) * 3600 + (parseInt($('tc-m1').value) || 0) * 60 + (parseInt($('tc-s1').value) || 0);
  const t2 = (parseInt($('tc-h2').value) || 0) * 3600 + (parseInt($('tc-m2').value) || 0) * 60 + (parseInt($('tc-s2').value) || 0);
  const res = op === '+' ? t1 + t2 : Math.abs(t1 - t2);
  $('tc-result').textContent = `${p2(Math.floor(res / 3600))}:${p2(Math.floor((res % 3600) / 60))}:${p2(res % 60)}`;
}

/* ════════════════════════════════════════════════════
   WEEK
════════════════════════════════════════════════════ */
function getWeekNum(d) {
  const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  tmp.setUTCDate(tmp.getUTCDate() + 4 - (tmp.getUTCDay() || 7));
  const y = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  return Math.ceil(((tmp - y) / 86400000 + 1) / 7);
}

function weekRender() {
  const now = new Date();
  const wn  = getWeekNum(now);
  $('week-num').textContent  = wn;
  $('week-pct').style.width  = (wn / 52 * 100) + '%';

  const mon = new Date(now);
  mon.setDate(now.getDate() - (now.getDay() || 7) + 1);
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
  $('week-range').textContent =
    mon.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
    + ' — '
    + sun.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });

  const dayNames = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
  $('week-cal').innerHTML = dayNames.map((dn, i) => {
    const d = new Date(mon); d.setDate(mon.getDate() + i);
    const today = d.toDateString() === now.toDateString();
    return `<div class="week-day ${today ? 'today' : ''}">
      <div class="week-day-name">${dn}</div>
      <div class="week-day-num">${d.getDate()}</div>
    </div>`;
  }).join('');
}

weekRender();

/* ════════════════════════════════════════════════════
   AGE CALC
════════════════════════════════════════════════════ */
function ageCalc() {
  const bv = $('age-birth').value;
  if (!bv) { toast('Selecciona tu fecha de nacimiento', 'error'); return; }
  const birth = new Date(bv), now = new Date();
  if (birth > now) { toast('La fecha debe ser pasada', 'error'); return; }

  let y = now.getFullYear() - birth.getFullYear();
  let m = now.getMonth()   - birth.getMonth();
  let d = now.getDate()    - birth.getDate();
  if (d < 0) { m--; d += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); }
  if (m < 0) { y--; m += 12; }

  $('age-y').textContent = y;
  $('age-m').textContent = m;
  $('age-d').textContent = d;

  const totalD = Math.floor((now - birth) / 86400000);
  const nextB  = new Date(now.getFullYear(), birth.getMonth(), birth.getDate());
  if (nextB <= now) nextB.setFullYear(now.getFullYear() + 1);
  const daysToB = Math.ceil((nextB - now) / 86400000);

  $('age-details').innerHTML = `
    <div class="age-detail-row"><span class="age-detail-label">Fecha de nacimiento</span><span class="age-detail-value">${birth.toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric'})}</span></div>
    <div class="age-detail-row"><span class="age-detail-label">Total en días</span><span class="age-detail-value">${totalD.toLocaleString()}</span></div>
    <div class="age-detail-row"><span class="age-detail-label">Total en semanas</span><span class="age-detail-value">${Math.floor(totalD/7).toLocaleString()}</span></div>
    <div class="age-detail-row"><span class="age-detail-label">Total en meses</span><span class="age-detail-value">${(y*12+m).toLocaleString()}</span></div>
    <div class="age-detail-row"><span class="age-detail-label">Total en horas</span><span class="age-detail-value">${(totalD*24).toLocaleString()}</span></div>
    <div class="age-detail-row"><span class="age-detail-label">Próximo cumpleaños</span><span class="age-detail-value">${nextB.toLocaleDateString('es-ES',{day:'numeric',month:'long'})} (en ${daysToB} días)</span></div>
  `;
  toast('Edad calculada', 'success', 2000);
}

/* ════════════════════════════════════════════════════
   AUDIO — Web Audio API
════════════════════════════════════════════════════ */
function beep() {
  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)();
    const vol  = (parseInt($('t-vol')?.value || 70) / 100) * 0.32;
    const type = $('t-sound')?.value || 'beep';
    const freqs = { beep: [880, 660], bell: [523, 659, 784], digital: [1047, 1047, 1047], soft: [440, 330] };
    const f = freqs[type] || [880];
    f.forEach((freq, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = freq;
      o.type = type === 'bell' ? 'sine' : 'square';
      g.gain.setValueAtTime(0, ctx.currentTime + i * 0.3);
      g.gain.linearRampToValueAtTime(vol, ctx.currentTime + i * 0.3 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.3 + 0.4);
      o.start(ctx.currentTime + i * 0.3);
      o.stop(ctx.currentTime + i * 0.3 + 0.4);
    });
  } catch (e) {}
}

/* ════════════════════════════════════════════════════
   DELEGATED CLICK HANDLER (replaces inline onclick)
════════════════════════════════════════════════════ */
document.addEventListener('click', function(e) {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const action = btn.getAttribute('data-action');
  if (!action) return;

  // Navigation
  if (action.startsWith("go('"))          { const id = action.match(/go\('(\w+)'\)/)[1]; go(id); return; }
  if (action === 'toggleFullscreen()')     { toggleFullscreen(); return; }

  // Timer
  if (action === 'timerStart()')           { timerStart(); return; }
  if (action === 'timerPause()')           { timerPause(); return; }
  if (action === 'timerReset()')           { timerReset(); return; }
  if (action.startsWith('timerPreset('))   { const s = parseInt(action.match(/\d+/)[0]); timerPreset(s); return; }

  // Pomodoro
  if (action.startsWith("pomoMode("))      { const m = action.match(/pomoMode\('(\w+)'/)[1]; pomoMode(m, btn); return; }
  if (action === 'pomoStart()')            { pomoStart(); return; }
  if (action === 'pomoPause()')            { pomoPause(); return; }
  if (action === 'pomoReset()')            { pomoReset(); return; }
  if (action === 'pomoSkip()')             { pomoSkip(); return; }
  if (action.startsWith('pomoAdj('))       { const [,k,d] = action.match(/pomoAdj\('(\w+)',(-?\d+)\)/); pomoAdj(k, parseInt(d)); return; }

  // Stopwatch
  if (action === 'swStart()')              { swStart(); return; }
  if (action === 'swPause()')              { swPause(); return; }
  if (action === 'swLap()')               { swLap(); return; }
  if (action === 'swReset()')              { swReset(); return; }

  // Alarm
  if (action === 'alarmAdd()')             { alarmAdd(); return; }
  if (action.startsWith('alarmDel('))      { const id = parseInt(action.match(/\d+/)[0]); alarmDel(id); return; }
  if (action.startsWith('alarmToggle('))   { const id = parseInt(action.match(/\d+/)[0]); alarmToggle(id); return; }

  // Countdown
  if (action === 'cdAdd()')                { cdAdd(); return; }
  if (action.startsWith('cdDel('))         { const id = parseInt(action.match(/\d+/)[0]); cdDel(id); return; }

  // World
  if (action === 'worldAdd()')             { worldAdd(); return; }
  if (action.startsWith("worldDel('"))     { const tz = action.match(/worldDel\('([^']+)'\)/)[1]; worldDel(tz); return; }

  // Date calc
  if (action === 'dcDiff()')               { dcDiff(); return; }
  if (action === 'dcAdd(1)')               { dcAdd(1); return; }
  if (action === 'dcAdd(-1)')              { dcAdd(-1); return; }

  // Time calc
  if (action === "tcCalc('+')")            { tcCalc('+'); return; }
  if (action === "tcCalc('-')")            { tcCalc('-'); return; }

  // Age
  if (action === 'ageCalc()')              { ageCalc(); return; }

  // Timer settings
  if (action === 'saveTimerSettings()')    { saveTimerSettings(); return; }
  if (action === 'requestNotif()')         { requestNotif(); return; }
});

// Also handle oninput for timer settings (range/checkbox changes)
document.addEventListener('change', function(e) {
  const el = e.target;
  if (el.id === 't-sound' || el.id === 't-vol' || el.id === 't-auto' || el.id === 't-notif') {
    saveTimerSettings();
    if (el.id === 't-notif') requestNotif();
  }
});
document.addEventListener('input', function(e) {
  if (e.target.id === 't-vol') {
    const volVal = document.getElementById('t-vol-val');
    if (volVal) volVal.textContent = e.target.value + '%';
    saveTimerSettings();
  }
});

/* ════════════════════════════════════════════════════
   KEYBOARD SHORTCUTS
════════════════════════════════════════════════════ */
document.addEventListener('keydown', e => {
  if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;
  const active = document.querySelector('.panel.active')?.id;

  if (e.code === 'Space') {
    e.preventDefault();
    if (active === 'panel-timer')     TI.running    ? timerPause() : timerStart();
    if (active === 'panel-stopwatch') SW.running    ? swPause()    : swStart();
    if (active === 'panel-pomodoro')  POMO.running  ? pomoPause()  : pomoStart();
  }
  if (e.key.toLowerCase() === 'r') {
    if (active === 'panel-timer')     timerReset();
    if (active === 'panel-stopwatch') swReset();
    if (active === 'panel-pomodoro')  pomoReset();
  }
  if (e.key.toLowerCase() === 'l') {
    if (active === 'panel-stopwatch') swLap();
  }
});

/* ════════════════════════════════════════════════════
   FULLSCREEN
════════════════════════════════════════════════════ */
function toggleFullscreen() {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen();
  else document.exitFullscreen();
}

/* ════════════════════════════════════════════════════
   INIT
════════════════════════════════════════════════════ */
requestNotif();