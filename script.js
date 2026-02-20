// ========== UTILITIES ==========
// Format date to dd/mm/yyyy
function formatDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

// Toast Notifications
function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: '✓',
        error: '✕',
        info: 'ℹ️'
    };
    
    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || icons.info}</span>
        <span class="toast-message">${message}</span>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// Browser Notifications
function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                showToast('Notificaciones activadas', 'success');
            }
        });
    }
}

function showBrowserNotification(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification(title, {
            body: body,
            icon: '⏰',
            badge: '⏰',
            requireInteraction: true
        });
        
        notification.onclick = () => {
            window.focus();
            notification.close();
        };
    }
}

// State Persistence
function saveState(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.error('Error saving state:', e);
    }
}

function loadState(key, defaultValue = null) {
    try {
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : defaultValue;
    } catch (e) {
        console.error('Error loading state:', e);
        return defaultValue;
    }
}

// Save history to localStorage
function saveHistory() {
    const historyList = document.getElementById('historyList');
    const historyItems = Array.from(historyList.children).map(item => item.textContent);
    localStorage.setItem('history', JSON.stringify(historyItems));
}

// Load history from localStorage
function loadHistory() {
    const savedHistory = JSON.parse(localStorage.getItem('history')) || [];
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '';
    savedHistory.forEach(itemText => {
        const listItem = document.createElement('div');
        listItem.textContent = itemText;
        historyList.appendChild(listItem);
    });
}

// Call loadHistory on page load
window.addEventListener('DOMContentLoaded', loadHistory);

// Example: Add to history and save
function addToHistory(itemText) {
    const historyList = document.getElementById('historyList');
    const listItem = document.createElement('div');
    listItem.textContent = itemText;
    historyList.appendChild(listItem);
    saveHistory();
}

// Generate shareable timer link
function generateShareableLink(hours, minutes, seconds) {
    const baseUrl = window.location.href.split('?')[0];
    const params = new URLSearchParams();
    params.set('hours', hours);
    params.set('minutes', minutes);
    params.set('seconds', seconds);
    return `${baseUrl}?${params.toString()}`;
}

// Load timer from URL parameters
function loadTimerFromURL() {
    const params = new URLSearchParams(window.location.search);
    const hours = params.get('hours') || 0;
    const minutes = params.get('minutes') || 0;
    const seconds = params.get('seconds') || 0;
    document.getElementById('hours').value = hours;
    document.getElementById('minutes').value = minutes;
    document.getElementById('seconds').value = seconds;
}

// ========== TAB NAVIGATION ==========
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const mobileTabsToggle = document.getElementById('mobileTabsToggle');
const tabsList = document.getElementById('tabsList');
const currentTabName = document.getElementById('currentTabName');

// Mobile tabs dropdown
if (mobileTabsToggle) {
    mobileTabsToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        tabsList.classList.toggle('active');
        mobileTabsToggle.classList.toggle('active');
    });
}

document.addEventListener('click', (e) => {
    if (!e.target.closest('.tabs')) {
        tabsList.classList.remove('active');
        if (mobileTabsToggle) mobileTabsToggle.classList.remove('active');
    }
});

tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.getAttribute('data-tab');
        switchTab(tabName);
        tabsList.classList.remove('active');
        if (mobileTabsToggle) mobileTabsToggle.classList.remove('active');
    });
});

function switchTab(tabName) {
    tabButtons.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));
    
    const selectedBtn = document.querySelector(`[data-tab="${tabName}"]`);
    selectedBtn.classList.add('active');
    document.getElementById(`tab-${tabName}`).classList.add('active');
    
    if (currentTabName) currentTabName.textContent = selectedBtn.textContent;
    
    saveState('lastTab', tabName);
    
    if (tabName === 'clock') updateClock();
    if (tabName === 'worldclock') updateWorldClocks();
    if (tabName === 'week') updateWeekInfo();
}

// Load last tab
const lastTab = loadState('lastTab', 'timer');
switchTab(lastTab);

// Info Section Toggle
const infoToggle = document.getElementById('infoToggle');
const infoContent = document.getElementById('infoContent');

if (infoToggle) {
    infoToggle.addEventListener('click', () => {
        const isVisible = infoContent.style.display !== 'none';
        infoContent.style.display = isVisible ? 'none' : 'block';
        infoToggle.textContent = isVisible ? '📖 Información y Ayuda' : '✕ Cerrar Información';
    });
}

// Footer links
document.querySelectorAll('.footer-link').forEach(link => {
    link.addEventListener('click', () => {
        const tab = link.getAttribute('data-tab');
        if (tab) {
            switchTab(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });
});

const footerInfoBtn = document.getElementById('footerInfoBtn');
if (footerInfoBtn) {
    footerInfoBtn.addEventListener('click', () => {
        infoContent.style.display = 'block';
        infoToggle.textContent = '✕ Cerrar Información';
        document.getElementById('infoSection').scrollIntoView({ behavior: 'smooth' });
    });
}

// Initialize notifications
requestNotificationPermission();

// ========== THEME & FULLSCREEN ==========
const themeToggle = document.getElementById('themeToggle');
const fullscreenBtn = document.getElementById('fullscreenBtn');

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
});

// Apply saved theme on load
window.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
    }
});

function loadTheme() {
    const savedTheme = loadState('theme', 'light');
    document.body.setAttribute('data-theme', savedTheme);
}

fullscreenBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
        showToast('Modo pantalla completa activado', 'info', 2000);
    } else {
        document.exitFullscreen();
    }
});

loadTheme();

// ========== TIMER ==========
let timerInterval = null;
let totalSeconds = 300;
let remainingSeconds = totalSeconds;
let isRunning = false;

const hoursInput = document.getElementById('hours');
const minutesInput = document.getElementById('minutes');
const secondsInput = document.getElementById('seconds');
const timerDisplay = document.getElementById('timerDisplay');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const presetButtons = document.querySelectorAll('.preset-btn');
const progressCircle = document.querySelector('.progress-ring-circle');
const volumeSlider = document.getElementById('volume');
const volumeValue = document.getElementById('volumeValue');
const alarmSound = document.getElementById('alarmSound');
const notificationsCheckbox = document.getElementById('notifications');
const autoRepeatCheckbox = document.getElementById('autoRepeat');
const historyList = document.getElementById('historyList');

createSVGGradient();
loadTimerState();
loadSettings();
loadHistory();
updateDisplay();
updateProgressRing(100);

function loadTimerState() {
    const state = loadState('timerState');
    if (state) {
        totalSeconds = state.totalSeconds || 300;
        remainingSeconds = state.remainingSeconds || totalSeconds;
        
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        
        hoursInput.value = hours;
        minutesInput.value = minutes;
        secondsInput.value = secs;
    }
}

function saveTimerState() {
    saveState('timerState', {
        totalSeconds,
        remainingSeconds
    });
}

function createSVGGradient() {
    const svg = document.querySelector('.progress-ring-svg');
    if (!svg || svg.querySelector('#gradient')) return;
    
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    gradient.setAttribute('id', 'gradient');
    gradient.setAttribute('x1', '0%');
    gradient.setAttribute('y1', '0%');
    gradient.setAttribute('x2', '100%');
    gradient.setAttribute('y2', '100%');
    
    const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop1.setAttribute('offset', '0%');
    stop1.setAttribute('stop-color', '#6366f1');
    
    const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop2.setAttribute('offset', '100%');
    stop2.setAttribute('stop-color', '#8b5cf6');
    
    gradient.appendChild(stop1);
    gradient.appendChild(stop2);
    defs.appendChild(gradient);
    svg.insertBefore(defs, svg.firstChild);
}

hoursInput.addEventListener('change', handleTimeInputChange);
minutesInput.addEventListener('change', handleTimeInputChange);
secondsInput.addEventListener('change', handleTimeInputChange);

function handleTimeInputChange() {
    if (isRunning) return;
    
    hoursInput.value = Math.max(0, Math.min(23, parseInt(hoursInput.value) || 0));
    minutesInput.value = Math.max(0, Math.min(59, parseInt(minutesInput.value) || 0));
    secondsInput.value = Math.max(0, Math.min(59, parseInt(secondsInput.value) || 0));
    
    totalSeconds = (parseInt(hoursInput.value) * 3600) + 
                   (parseInt(minutesInput.value) * 60) + 
                   parseInt(secondsInput.value);
    
    remainingSeconds = totalSeconds;
    updateDisplay();
    updateProgressRing(100);
    saveTimerState();
}

presetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        if (isRunning) return;
        const seconds = parseInt(btn.getAttribute('data-time'));
        setTime(seconds);
    });
});

function setTime(seconds) {
    totalSeconds = seconds;
    remainingSeconds = seconds;
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    hoursInput.value = hours;
    minutesInput.value = minutes;
    secondsInput.value = secs;
    
    updateDisplay();
    updateProgressRing(100);
    saveTimerState();
}

startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);

function startTimer() {
    if (totalSeconds === 0) {
        showToast('Por favor, establece un tiempo mayor a 0', 'error');
        return;
    }
    
    isRunning = true;
    startBtn.style.display = 'none';
    pauseBtn.style.display = 'block';
    
    hoursInput.disabled = true;
    minutesInput.disabled = true;
    secondsInput.disabled = true;
    
    timerDisplay.classList.add('running');
    showToast('Temporizador iniciado', 'success', 2000);
    
    timerInterval = setInterval(() => {
        remainingSeconds--;
        updateDisplay();
        
        const progress = (remainingSeconds / totalSeconds) * 100;
        updateProgressRing(progress);
        
        if (remainingSeconds <= 0) {
            timerFinished();
        }
    }, 1000);
}

function pauseTimer() {
    isRunning = false;
    clearInterval(timerInterval);
    
    startBtn.style.display = 'block';
    pauseBtn.style.display = 'none';
    startBtn.textContent = '▶ Reanudar';
    
    timerDisplay.classList.remove('running');
    showToast('Temporizador pausado', 'info', 2000);
}

function resetTimer() {
    clearInterval(timerInterval);
    isRunning = false;
    remainingSeconds = totalSeconds;
    
    startBtn.style.display = 'block';
    pauseBtn.style.display = 'none';
    startBtn.textContent = '▶ Iniciar';
    
    hoursInput.disabled = false;
    minutesInput.disabled = false;
    secondsInput.disabled = false;
    
    timerDisplay.classList.remove('running', 'finished');
    
    updateDisplay();
    updateProgressRing(100);
    showToast('Temporizador reiniciado', 'success', 2000);
}

function timerFinished() {
    clearInterval(timerInterval);
    isRunning = false;
    
    timerDisplay.classList.remove('running');
    timerDisplay.classList.add('finished');
    
    playAlarm();
    showBrowserNotification('⏰ ¡Tiempo terminado!', 'Tu temporizador ha finalizado.');
    showToast('¡Temporizador finalizado!', 'success');
    addToHistory();
    
    startBtn.style.display = 'block';
    pauseBtn.style.display = 'none';
    startBtn.textContent = '▶ Iniciar';
    
    hoursInput.disabled = false;
    minutesInput.disabled = false;
    secondsInput.disabled = false;
    
    if (autoRepeatCheckbox.checked) {
        setTimeout(() => {
            resetTimer();
            startTimer();
        }, 3000);
    }
}

function updateDisplay() {
    const hours = Math.floor(remainingSeconds / 3600);
    const minutes = Math.floor((remainingSeconds % 3600) / 60);
    const seconds = remainingSeconds % 60;
    
    let displayText = '';
    
    if (hours > 0) {
        displayText = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
        displayText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    timerDisplay.textContent = displayText;
    document.title = isRunning ? `⏱️ ${displayText} - ChronoHub` : 'ChronoHub - Herramientas de Tiempo';
}

function updateProgressRing(percentage) {
    const radius = 135;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100 * circumference);
    progressCircle.style.strokeDashoffset = offset;
}

function playAlarm() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const volume = (volumeSlider.value / 100) * 0.3;
    
    for (let i = 0; i < 3; i++) {
        setTimeout(() => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            gainNode.gain.value = volume;
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        }, i * 400);
    }
}

// Volume Control
volumeSlider.addEventListener('input', () => {
    volumeValue.textContent = `${volumeSlider.value}%`;
    saveSettings();
});

// Settings
function saveSettings() {
    const settings = {
        alarmSound: alarmSound.value,
        volume: volumeSlider.value,
        notifications: notificationsCheckbox.checked,
        autoRepeat: autoRepeatCheckbox.checked
    };
    saveState('timerSettings', settings);
}

function loadSettings() {
    const settings = loadState('timerSettings');
    if (settings) {
        alarmSound.value = settings.alarmSound || 'beep';
        volumeSlider.value = settings.volume || 70;
        volumeValue.textContent = `${volumeSlider.value}%`;
        notificationsCheckbox.checked = settings.notifications !== false;
        autoRepeatCheckbox.checked = settings.autoRepeat || false;
    }
}

alarmSound.addEventListener('change', saveSettings);
notificationsCheckbox.addEventListener('change', saveSettings);
autoRepeatCheckbox.addEventListener('change', saveSettings);

// History
function addToHistory() {
    const history = loadState('timerHistory', []);
    const entry = {
        time: formatTime(totalSeconds),
        date: new Date().toLocaleString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }),
        timestamp: Date.now()
    };
    
    history.unshift(entry);
    
    if (history.length > 10) {
        history.pop();
    }
    
    saveState('timerHistory', history);
    loadHistory();
}

function loadHistory() {
    const history = loadState('timerHistory', []);
    
    if (history.length === 0) {
        historyList.innerHTML = '<div class="history-empty">No hay historial aún</div>';
        return;
    }
    
    historyList.innerHTML = history.map(entry => `
        <div class="history-item">
            <span class="history-item-time">${entry.time}</span>
            <span class="history-item-date">${entry.date}</span>
        </div>
    `).join('');
}

function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
        return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${secs}s`;
    } else {
        return `${secs}s`;
    }
}

// ========== ALARM ==========
const alarmTime = document.getElementById('alarmTime');
const setAlarmBtn = document.getElementById('setAlarm');
const cancelAlarmBtn = document.getElementById('cancelAlarm');
const alarmsList = document.getElementById('alarmsList');
let alarms = [];

loadAlarms();

setAlarmBtn.addEventListener('click', () => {
    if (!alarmTime.value) {
        showToast('Por favor, selecciona una hora', 'error');
        return;
    }
    
    const alarm = {
        id: Date.now(),
        time: alarmTime.value
    };
    
    alarms.push(alarm);
    saveAlarms();
    renderAlarms();
    alarmTime.value = '';
    showToast('Alarma configurada correctamente', 'success');
});

cancelAlarmBtn.addEventListener('click', () => {
    alarms = [];
    saveAlarms();
    renderAlarms();
    showToast('Todas las alarmas canceladas', 'info');
});

function renderAlarms() {
    if (alarms.length === 0) {
        alarmsList.innerHTML = '<p style="text-align:center;color:var(--text-secondary)">No hay alarmas configuradas</p>';
        return;
    }
    
    alarmsList.innerHTML = alarms.map(alarm => `
        <div class="alarm-item">
            <div class="alarm-time-display">${alarm.time}</div>
            <button class="alarm-delete" onclick="deleteAlarm(${alarm.id})">Eliminar</button>
        </div>
    `).join('');
}

function deleteAlarm(id) {
    alarms = alarms.filter(a => a.id !== id);
    saveAlarms();
    renderAlarms();
    showToast('Alarma eliminada', 'success', 2000);
}

function saveAlarms() {
    saveState('alarms', alarms);
}

function loadAlarms() {
    alarms = loadState('alarms', []);
    renderAlarms();
}

setInterval(() => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    alarms.forEach(alarm => {
        if (alarm.time === currentTime && !alarm.triggered) {
            alarm.triggered = true;
            playAlarm();
            showBrowserNotification('⏰ Alarma', `Es hora: ${alarm.time}`);
            showToast(`⏰ ¡Alarma! ${alarm.time}`, 'success');
            setTimeout(() => alarm.triggered = false, 60000);
        }
    });
}, 1000);

// ========== COUNTDOWN ==========
const countdownDate = document.getElementById('countdownDate');
const countdownTime = document.getElementById('countdownTime');
const countdownName = document.getElementById('countdownName');
const setCountdownBtn = document.getElementById('setCountdown');
const cdDays = document.getElementById('cdDays');
const cdHours = document.getElementById('cdHours');
const cdMinutes = document.getElementById('cdMinutes');
const cdSeconds = document.getElementById('cdSeconds');
const countdownEventName = document.getElementById('countdownEventName');

let countdownInterval = null;
let targetDate = null;

setCountdownBtn.addEventListener('click', () => {
    if (!countdownDate.value) {
        showToast('Por favor, selecciona una fecha', 'error');
        return;
    }
    
    const dateStr = countdownDate.value + (countdownTime.value ? 'T' + countdownTime.value : 'T00:00');
    targetDate = new Date(dateStr);
    
    if (targetDate < new Date()) {
        showToast('La fecha debe ser futura', 'error');
        return;
    }
    
    const eventName = countdownName.value || 'Cuenta atrás';
    const dateDisplay = formatDate(targetDate);
    const timeDisplay = countdownTime.value ? countdownTime.value : '00:00';
    
    countdownEventName.textContent = `${eventName} • ${dateDisplay} ${timeDisplay}`;
    
    if (countdownInterval) clearInterval(countdownInterval);
    
    countdownInterval = setInterval(updateCountdown, 1000);
    updateCountdown();
    showToast('Cuenta atrás configurada', 'success');
});

function updateCountdown() {
    if (!targetDate) return;
    
    const now = new Date();
    const diff = targetDate - now;
    
    if (diff <= 0) {
        clearInterval(countdownInterval);
        cdDays.textContent = '0';
        cdHours.textContent = '0';
        cdMinutes.textContent = '0';
        cdSeconds.textContent = '0';
        playAlarm();
        showBrowserNotification('⏳ ¡Cuenta atrás terminada!', countdownEventName.textContent);
        showToast('¡Cuenta atrás finalizada!', 'success');
        return;
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    cdDays.textContent = days;
    cdHours.textContent = hours;
    cdMinutes.textContent = minutes;
    cdSeconds.textContent = seconds;
}

// ========== STOPWATCH ==========
const stopwatchDisplay = document.getElementById('stopwatchDisplay');
const startStopwatch = document.getElementById('startStopwatch');
const pauseStopwatch = document.getElementById('pauseStopwatch');
const resetStopwatch = document.getElementById('resetStopwatch');
const lapStopwatch = document.getElementById('lapStopwatch');
const lapsList = document.getElementById('lapsList');

let stopwatchInterval = null;
let stopwatchTime = 0;
let laps = [];

startStopwatch.addEventListener('click', () => {
    startStopwatch.style.display = 'none';
    pauseStopwatch.style.display = 'block';
    
    const startTime = Date.now() - stopwatchTime;
    stopwatchInterval = setInterval(() => {
        stopwatchTime = Date.now() - startTime;
        updateStopwatchDisplay();
    }, 10);
    
    showToast('Cronómetro iniciado', 'success', 2000);
});

pauseStopwatch.addEventListener('click', () => {
    clearInterval(stopwatchInterval);
    startStopwatch.style.display = 'block';
    pauseStopwatch.style.display = 'none';
    startStopwatch.textContent = '▶ Continuar';
    showToast('Cronómetro pausado', 'info', 2000);
});

resetStopwatch.addEventListener('click', () => {
    clearInterval(stopwatchInterval);
    stopwatchTime = 0;
    laps = [];
    updateStopwatchDisplay();
    lapsList.innerHTML = '';
    startStopwatch.style.display = 'block';
    pauseStopwatch.style.display = 'none';
    startStopwatch.textContent = '▶ Iniciar';
    showToast('Cronómetro reiniciado', 'success', 2000);
});

lapStopwatch.addEventListener('click', () => {
    if (stopwatchTime === 0) return;
    laps.push(stopwatchTime);
    renderLaps();
    showToast(`Vuelta ${laps.length} registrada`, 'success', 1500);
});

function updateStopwatchDisplay() {
    const hours = Math.floor(stopwatchTime / 3600000);
    const minutes = Math.floor((stopwatchTime % 3600000) / 60000);
    const seconds = Math.floor((stopwatchTime % 60000) / 1000);
    const milliseconds = stopwatchTime % 1000;
    
    stopwatchDisplay.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
}

function renderLaps() {
    lapsList.innerHTML = laps.map((lap, index) => {
        const hours = Math.floor(lap / 3600000);
        const minutes = Math.floor((lap % 3600000) / 60000);
        const seconds = Math.floor((lap % 60000) / 1000);
        const milliseconds = lap % 1000;
        const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
        
        return `
            <div class="lap-item">
                <span class="lap-number">Vuelta ${laps.length - index}</span>
                <span class="lap-time">${timeStr}</span>
            </div>
        `;
    }).reverse().join('');
}

// ========== CLOCK ==========
const digitalClock = document.getElementById('digitalClock');
const clockDate = document.getElementById('clockDate');
const hourHand = document.getElementById('hourHand');
const minuteHand = document.getElementById('minuteHand');
const secondHand = document.getElementById('secondHand');

function updateClock() {
    const now = new Date();
    
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    
    digitalClock.textContent = `${hours}:${minutes}:${seconds}`;
    
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    clockDate.textContent = `${dayNames[now.getDay()]}, ${now.getDate()} de ${monthNames[now.getMonth()]} de ${now.getFullYear()}`;
    
    const hoursAngle = (now.getHours() % 12 + now.getMinutes() / 60) * 30;
    const minutesAngle = (now.getMinutes() + now.getSeconds() / 60) * 6;
    const secondsAngle = now.getSeconds() * 6;
    
    hourHand.setAttribute('transform', `rotate(${hoursAngle} 100 100)`);
    minuteHand.setAttribute('transform', `rotate(${minutesAngle} 100 100)`);
    secondHand.setAttribute('transform', `rotate(${secondsAngle} 100 100)`);
}

setInterval(updateClock, 1000);
updateClock();

// ========== WORLD CLOCK ==========
const timezoneSelect = document.getElementById('timezoneSelect');
const addTimezoneBtn = document.getElementById('addTimezone');
const worldClockList = document.getElementById('worldClockList');
let worldClocks = [];

loadWorldClocks();

addTimezoneBtn.addEventListener('click', () => {
    const timezone = timezoneSelect.value;
    const cityName = timezoneSelect.options[timezoneSelect.selectedIndex].text;
    
    if (worldClocks.find(wc => wc.timezone === timezone)) {
        showToast('Esta ciudad ya está agregada', 'error');
        return;
    }
    
    worldClocks.push({ timezone, cityName });
    saveWorldClocks();
    renderWorldClocks();
    showToast(`${cityName} agregado`, 'success');
});

function renderWorldClocks() {
    worldClockList.innerHTML = worldClocks.map(wc => `
        <div class="worldclock-item">
            <div class="worldclock-city">${wc.cityName}</div>
            <div class="worldclock-time" data-timezone="${wc.timezone}">--:--:--</div>
            <button class="worldclock-delete" onclick="deleteWorldClock('${wc.timezone}')">✕</button>
        </div>
    `).join('');
}

function deleteWorldClock(timezone) {
    const city = worldClocks.find(wc => wc.timezone === timezone);
    worldClocks = worldClocks.filter(wc => wc.timezone !== timezone);
    saveWorldClocks();
    renderWorldClocks();
    showToast(`${city.cityName} eliminado`, 'success', 2000);
}

function updateWorldClocks() {
    worldClocks.forEach(wc => {
        const element = document.querySelector(`[data-timezone="${wc.timezone}"]`);
        if (element) {
            const time = new Date().toLocaleTimeString('es-ES', {
                timeZone: wc.timezone,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            element.textContent = time;
        }
    });
}

function saveWorldClocks() {
    saveState('worldClocks', worldClocks);
}

function loadWorldClocks() {
    worldClocks = loadState('worldClocks', []);
    renderWorldClocks();
}

setInterval(updateWorldClocks, 1000);

// ========== DATE CALCULATOR ==========
const dateFrom = document.getElementById('dateFrom');
const dateTo = document.getElementById('dateTo');
const calcDateDiffBtn = document.getElementById('calcDateDiff');
const dateDiffResult = document.getElementById('dateDiffResult');
const baseDate = document.getElementById('baseDate');
const baseTime = document.getElementById('baseTime');
const daysAmount = document.getElementById('daysAmount');
const hoursAmount = document.getElementById('hoursAmount');
const minutesAmount = document.getElementById('minutesAmount');
const calcAddDaysBtn = document.getElementById('calcAddDays');
const calcSubDaysBtn = document.getElementById('calcSubDays');
const dateAddResult = document.getElementById('dateAddResult');

calcDateDiffBtn.addEventListener('click', () => {
    if (!dateFrom.value || !dateTo.value) {
        showToast('Completa ambas fechas', 'error');
        return;
    }
    
    const d1 = new Date(dateFrom.value);
    const d2 = new Date(dateTo.value);
    const diff = Math.abs(d2 - d1);
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);
    
    dateDiffResult.innerHTML = `
        <strong>${days} días</strong><br>
        (${weeks} semanas, ${months} meses, ${years} años aprox.)
    `;
});

calcAddDaysBtn.addEventListener('click', () => {
    if (!baseDate.value) {
        showToast('Completa la fecha', 'error');
        return;
    }
    
    const dateTimeStr = `${baseDate.value}T${baseTime.value || '00:00'}`;
    const date = new Date(dateTimeStr);
    
    const days = parseInt(daysAmount.value) || 0;
    const hours = parseInt(hoursAmount.value) || 0;
    const minutes = parseInt(minutesAmount.value) || 0;
    
    date.setDate(date.getDate() + days);
    date.setHours(date.getHours() + hours);
    date.setMinutes(date.getMinutes() + minutes);
    
    dateAddResult.innerHTML = `
        <strong>${formatDate(date)}</strong><br>
        <span style="font-size: 0.95rem; opacity: 0.8;">
            ${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
        </span>
    `;
});

calcSubDaysBtn.addEventListener('click', () => {
    if (!baseDate.value) {
        showToast('Completa la fecha', 'error');
        return;
    }
    
    const dateTimeStr = `${baseDate.value}T${baseTime.value || '00:00'}`;
    const date = new Date(dateTimeStr);
    
    const days = parseInt(daysAmount.value) || 0;
    const hours = parseInt(hoursAmount.value) || 0;
    const minutes = parseInt(minutesAmount.value) || 0;
    
    date.setDate(date.getDate() - days);
    date.setHours(date.getHours() - hours);
    date.setMinutes(date.getMinutes() - minutes);
    
    dateAddResult.innerHTML = `
        <strong>${formatDate(date)}</strong><br>
        <span style="font-size: 0.95rem; opacity: 0.8;">
            ${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
        </span>
    `;
});

// ========== TIME CALCULATOR ==========
const tcHours1 = document.getElementById('tcHours1');
const tcMinutes1 = document.getElementById('tcMinutes1');
const tcSeconds1 = document.getElementById('tcSeconds1');
const tcHours2 = document.getElementById('tcHours2');
const tcMinutes2 = document.getElementById('tcMinutes2');
const tcSeconds2 = document.getElementById('tcSeconds2');
const tcAddBtn = document.getElementById('tcAdd');
const tcSubtractBtn = document.getElementById('tcSubtract');
const timeCalcResult = document.getElementById('timeCalcResult');

tcAddBtn.addEventListener('click', () => {
    const time1 = (parseInt(tcHours1.value) || 0) * 3600 + (parseInt(tcMinutes1.value) || 0) * 60 + (parseInt(tcSeconds1.value) || 0);
    const time2 = (parseInt(tcHours2.value) || 0) * 3600 + (parseInt(tcMinutes2.value) || 0) * 60 + (parseInt(tcSeconds2.value) || 0);
    
    const result = time1 + time2;
    displayTimeResult(result);
});

tcSubtractBtn.addEventListener('click', () => {
    const time1 = (parseInt(tcHours1.value) || 0) * 3600 + (parseInt(tcMinutes1.value) || 0) * 60 + (parseInt(tcSeconds1.value) || 0);
    const time2 = (parseInt(tcHours2.value) || 0) * 3600 + (parseInt(tcMinutes2.value) || 0) * 60 + (parseInt(tcSeconds2.value) || 0);
    
    const result = Math.abs(time1 - time2);
    displayTimeResult(result);
});

function displayTimeResult(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    timeCalcResult.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// ========== WEEK INFO ==========
const weekNumber = document.getElementById('weekNumber');
const weekRange = document.getElementById('weekRange');
const weekCalendar = document.getElementById('weekCalendar');

function updateWeekInfo() {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const days = Math.floor((now - startOfYear) / (1000 * 60 * 60 * 24));
    const weekNum = Math.ceil((days + startOfYear.getDay() + 1) / 7);
    
    weekNumber.textContent = weekNum;
    
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    weekRange.textContent = `${formatDate(startOfWeek)} - ${formatDate(endOfWeek)}`;
    
    const days_es = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    
    weekCalendar.innerHTML = '';
    for (let i = 0; i < 7; i++) {
        const day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i);
        
        const isToday = day.toDateString() === now.toDateString();
        
        weekCalendar.innerHTML += `
            <div class="week-day ${isToday ? 'today' : ''}">
                <div class="week-day-name">${days_es[i]}</div>
                <div class="week-day-number">${day.getDate()}</div>
            </div>
        `;
    }
}

updateWeekInfo();

// ========== AGE CALCULATOR ==========
const birthDate = document.getElementById('birthDate');
const calcAgeBtn = document.getElementById('calcAge');
const ageYears = document.getElementById('ageYears');
const ageMonths = document.getElementById('ageMonths');
const ageDays = document.getElementById('ageDays');
const ageDetails = document.getElementById('ageDetails');

calcAgeBtn.addEventListener('click', () => {
    if (!birthDate.value) {
        showToast('Por favor, selecciona tu fecha de nacimiento', 'error');
        return;
    }
    
    const birth = new Date(birthDate.value);
    const now = new Date();
    
    if (birth > now) {
        showToast('La fecha de nacimiento debe ser pasada', 'error');
        return;
    }
    
    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    let days = now.getDate() - birth.getDate();
    
    if (days < 0) {
        months--;
        days += new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    }
    
    if (months < 0) {
        years--;
        months += 12;
    }
    
    ageYears.textContent = years;
    ageMonths.textContent = months;
    ageDays.textContent = days;
    
    const totalDays = Math.floor((now - birth) / (1000 * 60 * 60 * 24));
    const totalWeeks = Math.floor(totalDays / 7);
    const totalMonths = years * 12 + months;
    const totalHours = totalDays * 24;
    
    const nextBirthday = new Date(now.getFullYear(), birth.getMonth(), birth.getDate());
    if (nextBirthday < now) {
        nextBirthday.setFullYear(now.getFullYear() + 1);
    }
    const daysToNext = Math.floor((nextBirthday - now) / (1000 * 60 * 60 * 24));
    
    ageDetails.innerHTML = `
        <div class="age-detail-item">
            <span class="age-detail-label">Fecha de nacimiento:</span>
            <span class="age-detail-value">${formatDate(birth)}</span>
        </div>
        <div class="age-detail-item">
            <span class="age-detail-label">Total en días:</span>
            <span class="age-detail-value">${totalDays.toLocaleString()}</span>
        </div>
        <div class="age-detail-item">
            <span class="age-detail-label">Total en semanas:</span>
            <span class="age-detail-value">${totalWeeks.toLocaleString()}</span>
        </div>
        <div class="age-detail-item">
            <span class="age-detail-label">Total en meses:</span>
            <span class="age-detail-value">${totalMonths}</span>
        </div>
        <div class="age-detail-item">
            <span class="age-detail-label">Total en horas:</span>
            <span class="age-detail-value">${totalHours.toLocaleString()}</span>
        </div>
        <div class="age-detail-item">
            <span class="age-detail-label">Próximo cumpleaños:</span>
            <span class="age-detail-value">${formatDate(nextBirthday)} (${daysToNext} días)</span>
        </div>
    `;
    
    showToast('Edad calculada correctamente', 'success');
});

// ========== KEYBOARD SHORTCUTS ==========
document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
    
    switch(e.key.toLowerCase()) {
        case ' ':
            e.preventDefault();
            if (document.getElementById('tab-timer').classList.contains('active')) {
                if (isRunning) pauseTimer();
                else startTimer();
            }
            break;
        case 'r':
            e.preventDefault();
            if (document.getElementById('tab-timer').classList.contains('active')) {
                resetTimer();
            }
            break;
        case 'f':
            e.preventDefault();
            fullscreenBtn.click();
            break;
        case 't':
            e.preventDefault();
            themeToggle.click();
            break;
    }
});

window.addEventListener('keydown', (e) => {
    if (e.key === ' ' && e.target === document.body) {
        e.preventDefault();
    }
});
