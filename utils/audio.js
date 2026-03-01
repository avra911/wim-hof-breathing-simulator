import { Audio } from 'expo-av';

export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const ZEN_SOUNDS = {
    inhale: require('../assets/sounds/inhale.mp3'),
    exhale: require('../assets/sounds/exhale.mp3'),
    hold: require('../assets/sounds/hold.mp3'),
    bowl: require('../assets/sounds/bowl.mp3'),
};

// Păstrăm o referință către sunetul care rulează în fundal (tic-tac-ul)
let currentLoopingSound = null;

// Funcția pentru sunete scurte (Inhale, Exhale, Bowl)
export async function playSound(type) {
    try {
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: true });

        const { sound } = await Audio.Sound.createAsync(
            ZEN_SOUNDS[type],
            { shouldPlay: true, volume: 0.6 }
        );

        // Curățăm memoria automat EXACT când se termină de cântat
        sound.setOnPlaybackStatusUpdate((status) => {
            if (status.didJustFinish) {
                sound.unloadAsync();
            }
        });
    } catch (error) {
        console.warn('Eroare la playSound:', error);
    }
}

// Funcția pentru sunetul continuu (Tic-Tac-ul de la Hold)
export async function startLoopingSound(type) {
    try {
        await stopLoopingSound(); // Ne asigurăm că oprim orice alt loop vechi mai întâi

        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: true });

        const { sound } = await Audio.Sound.createAsync(
            ZEN_SOUNDS[type],
            { shouldPlay: true, isLooping: true, volume: 0.3 } // Volum puțin mai încet pentru fundal
        );

        currentLoopingSound = sound;
    } catch (error) {
        console.warn('Eroare la startLoopingSound:', error);
    }
}

// Funcția care oprește tic-tac-ul
export async function stopLoopingSound() {
    if (currentLoopingSound) {
        try {
            await currentLoopingSound.stopAsync();
            await currentLoopingSound.unloadAsync();
            currentLoopingSound = null;
        } catch (error) {
            console.warn('Eroare la oprirea sunetului în buclă:', error);
        }
    }
}