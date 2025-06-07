let wakeLock = null;

let DEFAULTS = {};

async function loadDefaults() {
    const resp = await fetch('./settings.defaults.json');
    DEFAULTS = await resp.json();
}

function getDefault(key) {
    return DEFAULTS[key];
}

async function initializeSettingsForm() {
    await loadDefaults();
    document.getElementById('prepTime').value = getDefault('prepTime');
    document.getElementById('rounds').value = getDefault('rounds');
    document.getElementById('breathSpeed').value = getDefault('breathSpeed');
    document.getElementById('numBreaths').value = getDefault('numBreaths');
    document.getElementById('breathOutHold').value = getDefault('breathOutHold');
    document.getElementById('holdTime').value = getDefault('holdTime');
    document.getElementById('deepBreathTime').value = getDefault('deepBreathTime');
    document.getElementById('pauseAfterRound').value = getDefault('pauseAfterRound');

    // Set up customRounds from defaults
    customRounds.clear();
    if (Array.isArray(DEFAULTS.customRounds)) {
        DEFAULTS.customRounds.forEach(({ round, time }) => {
            customRounds.set(round, time);
        });
    }
    renderCustomRounds();
}

// Call this before any code that reads input values
initializeSettingsForm();

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

// Helper sleep function
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Beep using Web Audio API
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

// Elements
const inputs = [
    'prepTime', 'rounds', '', 'numBreaths',
    'breathOutHold', 'holdTime', 'deepBreathTime', 'pauseAfterRound'
].map(id => document.getElementById(id));

const customRoundNumberInput = document.getElementById('customRoundNumberInput');
const customRoundTimeInput = document.getElementById('customRoundTimeInput');
const addCustomRoundBtn = document.getElementById('addCustomRoundBtn');
const customRoundsList = document.getElementById('customRoundsList');
const maxCustomRoundsText = document.getElementById('maxCustomRoundsText');

// Simple controls buttons
const startBtnSimple = document.getElementById('startBtnSimple');
const stopBtnSimple = document.getElementById('stopBtnSimple');

const settingsForm = document.getElementById('settingsForm');
const settingsToggle = document.getElementById('settingsToggle');
const simpleControls = document.getElementById('simpleControls');

const phaseDisplay = document.getElementById('phaseDisplay');
const timerDisplay = document.getElementById('timerDisplay');

let stopRequested = false;
let running = false;

// Frequencies for sounds
const inhaleFreq = 440;
const exhaleFreq = 330;
const holdFreq = 220;
const roundEndFreq = 550;
const prepBeepFreq = 660;

// Store custom rounds in Map: roundNumber -> holdTime
let customRounds = new Map();

// Update max custom rounds text
function updateMaxCustomRoundsText() {
    const rounds = parseInt(document.getElementById('rounds').value, 10) || 1;
    maxCustomRoundsText.textContent = (rounds - 1) > 0 ? (rounds - 1) : 0;
}

// Render custom rounds list
function renderCustomRounds() {
    customRoundsList.innerHTML = '';
    if (customRounds.size === 0) {
        customRoundsList.innerHTML = '<li class="list-group-item text-muted">No custom rounds added</li>';
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
}

// Add custom round handler
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
    // Max custom rounds allowed: rounds - 1
    if (customRounds.size >= maxRounds - 1) {
        alert(`You can only set custom hold times for up to ${maxRounds - 1} rounds.`);
        return;
    }

    customRounds.set(round, time);
    renderCustomRounds();

    customRoundNumberInput.value = '';
    customRoundTimeInput.value = '';
});

// Update max custom rounds text on rounds input change
document.getElementById('rounds').addEventListener('input', () => {
    updateMaxCustomRoundsText();
});

// Settings toggle button
let settingsVisible = false;
settingsToggle.addEventListener('click', () => {
    settingsVisible = !settingsVisible;
    if (settingsVisible) {
        settingsForm.style.display = 'block';
        settingsToggle.innerHTML = '&#10006;'; // X icon
        simpleControls.style.display = 'none'; // Hide simple controls when settings shown
    } else {
        settingsForm.style.display = 'none';
        settingsToggle.innerHTML = '&#9881;'; // Gear icon
        simpleControls.style.display = 'flex';
    }
});

// Initialize max custom rounds text
updateMaxCustomRoundsText();

// Timer display helper
function displayTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}:${s.toString().padStart(2, '0')}` : s.toString();
}

// Show timer display
function showTimer() {
    timerDisplay.style.display = 'block';
}

// Hide timer display
function hideTimer() {
    timerDisplay.style.display = 'none';
}

// Main async breathing loop
async function runBreathing() {
    stopRequested = false;
    running = true;

    await requestWakeLock();

    const prepTime = parseInt(document.getElementById('prepTime').value, 10) || getDefault('prepTime');
    const totalRounds = parseInt(document.getElementById('rounds').value, 10) || getDefault('rounds');
    const breathSpeed = parseInt(document.getElementById('breathSpeed').value, 10) || getDefault('breathSpeed');
    const numBreaths = parseInt(document.getElementById('numBreaths').value, 10) || getDefault('numBreaths');
    const breathOutHold = parseInt(document.getElementById('breathOutHold').value, 10) || getDefault('breathOutHold');
    const holdTime = parseInt(document.getElementById('holdTime').value, 10) || getDefault('holdTime');
    const deepBreathTime = parseInt(document.getElementById('deepBreathTime').value, 10) || getDefault('deepBreathTime');
    const pauseAfterRound = parseInt(document.getElementById('pauseAfterRound').value, 10) || getDefault('pauseAfterRound');

    startBtnSimple.disabled = true;
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
    hideTimer();

    if (stopRequested) {
        resetUI();
        return;
    }

    for (let round = 1; round <= totalRounds; round++) {
        if (stopRequested) break;

        // Breathing phase: numBreaths cycles inhale/exhale
        phaseDisplay.textContent = `Round ${round} - Breathing`;

        for (let breath = 1; breath <= numBreaths; breath++) {
            hideTimer();
            if (stopRequested) break;

            // Inhale
            phaseDisplay.textContent = `Round ${round} - Breath ${breath} Inhale`;
            timerDisplay.textContent = displayTime(breathSpeed);
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
            phaseDisplay.textContent = `Round ${round} - Breath ${breath} Exhale`;
            timerDisplay.textContent = displayTime(breathSpeed);
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
        phaseDisplay.textContent = `Round ${round} - Hold after breath out`;
        showTimer();
        for (let i = holdAfterBreathOut; i > 0; i--) {
            if (stopRequested) break;
            timerDisplay.textContent = displayTime(i);
            playBeep(holdFreq, 150);
            await sleep(1000);
        }
        hideTimer();
        if (stopRequested) break;

        // Deep breath in
        phaseDisplay.textContent = `Round ${round} - Deep Breath Inhale`;
        timerDisplay.textContent = displayTime(deepBreathTime);
        playBeep(inhaleFreq, 200);
        await new Promise(resolve => {
            window.animateBreath({
                duration: deepBreathTime,
                inhale: true,
                onDone: resolve
            });
        });

        if (stopRequested) break;

        // Hold after deep breath
        phaseDisplay.textContent = `Round ${round} - Hold after Deep Breath`;
        showTimer();
        for (let i = holdTime; i > 0; i--) {
            if (stopRequested) break;
            timerDisplay.textContent = displayTime(i);
            playBeep(holdFreq, 150);
            await sleep(1000);
        }
        hideTimer();
        if (stopRequested) break;

        // Pause after round except after last
        if (round !== totalRounds) {
            phaseDisplay.textContent = `Round ${round} - Breath out`;
            showTimer();

            // Run timer and exhale animation in parallel
            await Promise.all([
                // Animate exhale (shrinking) during pause
                new Promise(resolve => {
                    window.animateBreath({
                        duration: pauseAfterRound,
                        inhale: false,
                        onDone: resolve
                    });
                }),
                // Timer countdown
                (async () => {
                    for (let i = pauseAfterRound; i > 0; i--) {
                        if (stopRequested) break;
                        timerDisplay.textContent = displayTime(i);
                        await sleep(1000);
                    }
                })()
            ]);

            hideTimer();
        }

        playBeep(roundEndFreq, 300);
    }

    phaseDisplay.textContent = 'Finished!';
    hideTimer();
    timerDisplay.textContent = '';

    resetUI();
}

// Reset UI to initial state
function resetUI() {
    running = false;
    stopRequested = false;
    releaseWakeLock();
    startBtnSimple.disabled = false;
    stopBtnSimple.disabled = true;
    hideTimer();
    timerDisplay.textContent = '';
}

startBtnSimple.addEventListener('click', () => {
    if (!running) {
        runBreathing();
    }
});

stopBtnSimple.addEventListener('click', () => {
    if (running) {
        stopRequested = true;
        phaseDisplay.textContent = 'Stopping...';
    }
});

// Initialize UI
resetUI();