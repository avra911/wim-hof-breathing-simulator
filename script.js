// --- Wake Lock ---
let wakeLock = null;
async function requestWakeLock() {
    try {
        if ('wakeLock' in navigator) {
            wakeLock = await navigator.wakeLock.request('screen');
            wakeLock.addEventListener('release', () => {
                console.log('Screen Wake Lock released');
            });
            console.log('Screen Wake Lock acquired');
        }
    } catch (err) {
        console.error(`${err.name}, ${err.message}`);
    }
}
function releaseWakeLock() {
    if (wakeLock) {
        wakeLock.release();
        wakeLock = null;
    }
}

// --- Settings Defaults ---
let DEFAULTS = {};
async function loadDefaults() {
    const stored = localStorage.getItem('wimhof_settings');
    if (stored) {
        DEFAULTS = JSON.parse(stored);
    } else {
        const resp = await fetch('./settings.defaults.json');
        DEFAULTS = await resp.json();
    }
}
function getDefault(key) {
    return DEFAULTS[key];
}
function saveDefaultsToLocalStorage() {
    const settings = {
        prepTime: parseInt(document.getElementById('prepTime').value, 10),
        rounds: parseInt(document.getElementById('rounds').value, 10),
        breathSpeed: parseFloat(document.getElementById('breathSpeed').value),
        numBreaths: parseInt(document.getElementById('numBreaths').value, 10),
        breathOutHold: parseInt(document.getElementById('breathOutHold').value, 10),
        holdTime: parseInt(document.getElementById('holdTime').value, 10),
        deepBreathTime: parseInt(document.getElementById('deepBreathTime').value, 10),
        pauseAfterRound: parseInt(document.getElementById('pauseAfterRound').value, 10),
        customRounds: Array.from(customRounds.entries()).map(([round, time]) => ({ round, time }))
    };
    localStorage.setItem('wimhof_settings', JSON.stringify(settings));
}

// --- Elements ---
const inputIds = [
    'prepTime', 'rounds', 'breathSpeed', 'numBreaths',
    'breathOutHold', 'holdTime', 'deepBreathTime', 'pauseAfterRound'
];
const [
    customRoundNumberInput,
    customRoundTimeInput,
    addCustomRoundBtn,
    customRoundsList,
    maxCustomRoundsText,
    startBtnSimple,
    pauseBtnSimple,
    stopBtnSimple,
    settingsForm,
    settingsToggle,
    contentWrapper,
    simpleControls,
    phaseDisplay,
    timerDisplay,
    restoreDefaultsBtn
] = [
        document.getElementById('customRoundNumberInput'),
        document.getElementById('customRoundTimeInput'),
        document.getElementById('addCustomRoundBtn'),
        document.getElementById('customRoundsList'),
        document.getElementById('maxCustomRoundsText'),
        document.getElementById('startBtnSimple'),
        document.getElementById('pauseBtnSimple'),
        document.getElementById('stopBtnSimple'),
        document.getElementById('settingsForm'),
        document.getElementById('settingsToggle'),
        document.getElementById('contentWrapper'),
        document.getElementById('simpleControls'),
        document.getElementById('phaseDisplay'),
        document.getElementById('timerDisplay'),
        document.getElementById('restoreDefaultsBtn')
    ];

// --- State ---
let stopRequested = false;
let running = false;
let paused = false;
let pauseResolve = null;
let settingsVisible = false;
let customRounds = new Map();

// --- Sound Frequencies ---
const inhaleFreq = 440;
const exhaleFreq = 330;
const holdFreq = 220;
const roundEndFreq = 550;
const prepBeepFreq = 660;

// --- Utility Functions ---
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function playBeep(freq, duration) {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.frequency.value = freq;
        oscillator.type = 'sine';
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.start();
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + duration / 1000);
        oscillator.stop(audioCtx.currentTime + duration / 1000);
        setTimeout(() => audioCtx.close(), duration + 50);
    } catch {
        // AudioContext might be blocked or unavailable
    }
}
function displayTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}:${s.toString().padStart(2, '0')} sec` : `${s} sec`;
}

function showTimer() {
    timerDisplay.style.display = 'block';
}
function hideTimer() {
    timerDisplay.style.display = 'none';
}

// --- Settings Form Initialization ---
async function initializeSettingsForm() {
    await loadDefaults();
    inputIds.forEach(id => {
        document.getElementById(id).value = getDefault(id);
    });
    // Set up customRounds from defaults
    customRounds.clear();
    if (Array.isArray(DEFAULTS.customRounds)) {
        DEFAULTS.customRounds.forEach(({ round, time }) => {
            customRounds.set(round, time);
        });
    }
    renderCustomRounds();
}

// --- Custom Rounds ---
function updateMaxCustomRoundsText() {
    const rounds = parseInt(document.getElementById('rounds').value, 10) || 1;
    maxCustomRoundsText.textContent = (rounds - 1) > 0 ? (rounds - 1) : 0;
}
function renderCustomRounds() {
    customRoundsList.innerHTML = '';
    if (customRounds.size === 0) {
        customRoundsList.innerHTML = '<li class="list-group-item text-muted">No custom rounds added</li>';
        saveDefaultsToLocalStorage();
        return;
    }
    [...customRounds.entries()]
        .sort((a, b) => a[0] - b[0])
        .forEach(([round, time]) => {
            const li = document.createElement('li');
            li.className = 'list-group-item d-flex justify-content-between align-items-center';
            li.textContent = `Round ${round}: Hold Time = ${time} sec`;
            const btn = document.createElement('button');
            btn.className = 'btn btn-sm btn-danger';
            btn.textContent = 'Remove';
            btn.onclick = () => {
                customRounds.delete(round);
                renderCustomRounds();
            };
            li.appendChild(btn);
            customRoundsList.appendChild(li);
        });
    saveDefaultsToLocalStorage();
}

// --- Pause Logic ---
pauseBtnSimple.addEventListener('click', () => {
    if (!paused) {
        paused = true;
        pauseBtnSimple.textContent = 'Resume';
        phaseDisplay.textContent = 'Paused';
    } else {
        paused = false;
        pauseBtnSimple.textContent = 'Pause';
        phaseDisplay.textContent = 'Resumed';
        if (pauseResolve) pauseResolve();
    }
});
async function checkPaused() {
    if (paused) {
        await new Promise(resolve => pauseResolve = resolve);
        pauseResolve = null;
    }
}

// --- Event Listeners ---
inputIds.forEach(id => {
    document.getElementById(id).addEventListener('input', saveDefaultsToLocalStorage);
});
addCustomRoundBtn.addEventListener('click', () => {
    const round = parseInt(customRoundNumberInput.value, 10);
    const time = parseInt(customRoundTimeInput.value, 10);
    const maxRounds = parseInt(document.getElementById('rounds').value, 10) || 1;

    if (!round || round < 1 || round > maxRounds) {
        alert(`Round number must be between 1 and ${maxRounds}`);
        return;
    }
    if (!time || time < 1) {
        alert('Hold time must be a positive number');
        return;
    }
    if (customRounds.has(round)) {
        alert(`Custom hold time for Round ${round} is already set. Remove it first to add a new one.`);
        return;
    }
    if (customRounds.size >= maxRounds - 1) {
        alert(`You can only set custom hold times for up to ${maxRounds - 1} rounds.`);
        return;
    }
    customRounds.set(round, time);
    renderCustomRounds();
    saveDefaultsToLocalStorage();
    customRoundNumberInput.value = '';
    customRoundTimeInput.value = '';
});
document.getElementById('rounds').addEventListener('input', updateMaxCustomRoundsText);
settingsToggle.addEventListener('click', () => {
    settingsVisible = !settingsVisible;
    if (settingsVisible) {
        settingsForm.style.display = 'block';
        settingsToggle.innerHTML = '&#10006;'; // X icon
        contentWrapper.style.setProperty('display', 'none');
    } else {
        settingsForm.style.display = 'none';
        settingsToggle.innerHTML = '&#9881;'; // Gear icon
        contentWrapper.style.setProperty('display', 'block');
    }
});
restoreDefaultsBtn.addEventListener('click', async () => {
    localStorage.removeItem('wimhof_settings');
    await initializeSettingsForm();
});
document.addEventListener('visibilitychange', async () => {
    if (!running) return;

    if (document.visibilityState === 'visible') {
        try {
            if (!wakeLock && 'wakeLock' in navigator) {
                wakeLock = await navigator.wakeLock.request('screen');
                console.log('Wake Lock re-acquired on visibility');
                wakeLock.addEventListener('release', () => {
                    console.log('Wake Lock released');
                    wakeLock = null;
                });
            }
        } catch (err) {
            console.error('Failed to re-acquire Wake Lock:', err);
        }
    } else {
        if (wakeLock) {
            await wakeLock.release();
            wakeLock = null;
            console.log('Wake Lock released because tab is hidden');
        }
    }
});

// --- UI State ---
function resetUI() {
    pauseBtnSimple.disabled = true;
    pauseBtnSimple.textContent = 'Pause';
    paused = false;
    running = false;
    stopRequested = false;
    releaseWakeLock();
    startBtnSimple.disabled = false;
    stopBtnSimple.disabled = true;
    hideTimer();
    timerDisplay.textContent = '';
}
updateMaxCustomRoundsText();

// --- Main Breathing Logic ---
async function runBreathing() {
    stopRequested = false;
    running = true;

    await requestWakeLock();

    const prepTime = parseInt(document.getElementById('prepTime').value, 10) || getDefault('prepTime');
    const totalRounds = parseInt(document.getElementById('rounds').value, 10) || getDefault('rounds');
    const breathSpeed = parseFloat(document.getElementById('breathSpeed').value) || getDefault('breathSpeed');
    const numBreaths = parseInt(document.getElementById('numBreaths').value, 10) || getDefault('numBreaths');
    const breathOutHold = parseInt(document.getElementById('breathOutHold').value, 10) || getDefault('breathOutHold');
    const holdTime = parseInt(document.getElementById('holdTime').value, 10) || getDefault('holdTime');
    const deepBreathTime = parseInt(document.getElementById('deepBreathTime').value, 10) || getDefault('deepBreathTime');
    const pauseAfterRound = parseInt(document.getElementById('pauseAfterRound').value, 10) || getDefault('pauseAfterRound');

    startBtnSimple.disabled = true;
    pauseBtnSimple.disabled = true;
    stopBtnSimple.disabled = false;

    // Preparation Phase
    phaseDisplay.textContent = "Get Ready...";
    showTimer();
    timerDisplay.textContent = displayTime(prepTime);
    for (let i = prepTime; i > 0; i--) {
        if (stopRequested) break;
        timerDisplay.textContent = displayTime(i);
        playBeep(prepBeepFreq, 150);
        await sleep(1000);
    }

    if (stopRequested) {
        resetUI();
        return;
    }

    for (let round = 1; round <= totalRounds; round++) {
        if (stopRequested) break;

        // Breathing phase: numBreaths cycles inhale/exhale
        phaseDisplay.textContent = `Round ${round}/${totalRounds}`;

        for (let breath = 1; breath <= numBreaths; breath++) {
            await checkPaused();
            // hideTimer();
            if (stopRequested) break;

            const breathsLeft = numBreaths - breath + 1;

            // Inhale
            phaseDisplay.textContent = `Round ${round}/${totalRounds}`;
            timerDisplay.textContent = `${breathsLeft} In`;
            playBeep(inhaleFreq, 200);
            await new Promise(resolve => {
                window.animateBreath({
                    duration: breathSpeed,
                    inhale: true,
                    onDone: resolve
                });
            });
            if (stopRequested) break;

            // Exhale
            phaseDisplay.textContent = `Round ${round}/${totalRounds}`;
            timerDisplay.textContent = `${breathsLeft} Out`;
            playBeep(exhaleFreq, 200);
            await new Promise(resolve => {
                window.animateBreath({
                    duration: breathSpeed,
                    inhale: false,
                    onDone: resolve
                });
            });
        }
        if (stopRequested) break;

        // Hold after breath out
        let holdAfterBreathOut = customRounds.has(round) ? customRounds.get(round) : breathOutHold;
        phaseDisplay.textContent = `Round ${round}/${totalRounds} - HOLD`;

        pauseBtnSimple.disabled = false;
        for (let i = holdAfterBreathOut; i > 0; i--) {
            await checkPaused();
            if (stopRequested) break;
            timerDisplay.textContent = displayTime(i);
            playBeep(holdFreq, 150);
            await sleep(1000);
        }
        pauseBtnSimple.disabled = true;
        if (stopRequested) break;

        // Deep breath in
        phaseDisplay.textContent = `Round ${round}/${totalRounds} - Fully In`;
        
        await Promise.all([
            // Animate the breath
            new Promise(resolve => {
                window.animateBreath({
                    duration: deepBreathTime,
                    inhale: true,
                    onDone: resolve
                });
            }),
            // Timer and beep loop
            (async () => {
                playBeep(inhaleFreq, 200);
                for (let i = deepBreathTime; i > 0; i--) {
                    if (stopRequested) break;
                    timerDisplay.textContent = displayTime(i);
                    await sleep(1000);
                }
            })()
        ]);

        if (stopRequested) break;

        // Hold after deep breath
        phaseDisplay.textContent = `Round ${round}/${totalRounds} - HOLD`;
        for (let i = holdTime; i > 0; i--) {
            if (stopRequested) break;
            timerDisplay.textContent = displayTime(i);
            playBeep(holdFreq, 150);
            await sleep(1000);
        }
        if (stopRequested) break;

        // Let it go
        phaseDisplay.textContent = `Round ${round}/${totalRounds} - Let Go`;

        // Run timer and exhale animation in parallel
        await Promise.all([
            new Promise(resolve => {
                window.animateBreath({
                    duration: pauseAfterRound,
                    inhale: false,
                    onDone: resolve
                });
            }),
            (async () => {
                playBeep(inhaleFreq, 200);
                for (let i = pauseAfterRound; i > 0; i--) {
                    if (stopRequested) break;
                    timerDisplay.textContent = displayTime(i);
                    await sleep(1000);
                }
            })()
        ]);

        playBeep(roundEndFreq, 300);
    }

    phaseDisplay.textContent = 'Finished!';
    timerDisplay.textContent = '';
    resetUI();
}

// --- Controls ---
startBtnSimple.addEventListener('click', () => {
    if (!running) runBreathing();
});
stopBtnSimple.addEventListener('click', () => {
    if (running) {
        stopRequested = true;
        phaseDisplay.textContent = 'Stopping...';
    }
});

// --- Init ---
initializeSettingsForm();
resetUI();