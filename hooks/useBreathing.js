import { useState, useRef, useCallback } from 'react';
import { Animated } from 'react-native';
import * as Haptics from 'expo-haptics'; // <--- Import Haptics
import AsyncStorage from '@react-native-async-storage/async-storage'; // <--- Import Storage pt istoric
import { sleep, playSound, startLoopingSound, stopLoopingSound } from '../utils/audio';

export const DEFAULT_SETTINGS = {
  prepTime: 10, rounds: 3, breathSpeed: 1.55, numBreaths: 30,
  breathOutHold: 90, holdTime: 15, deepBreathTime: 4, pauseAfterRound: 7,
  customRounds: [{ round: 1, time: 60 }]
};

export function useBreathing(settings = DEFAULT_SETTINGS) {
  const [phase, setPhase] = useState('Pregătit de start');
  const [timerText, setTimerText] = useState('');
  const [progress, setProgress] = useState(0);
  const [currentRound, setCurrentRound] = useState(1); // <--- Știm mereu în ce rundă suntem

  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [canPause, setCanPause] = useState(false);

  const stopRef = useRef(false);
  const pauseRef = useRef(false);
  const pauseResolveRef = useRef(null);

  const displayTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}:${s.toString().padStart(2, '0')} sec` : `${s} sec`;
  };

  const checkPaused = async () => {
    if (pauseRef.current) await new Promise(resolve => pauseResolveRef.current = resolve);
  };

  const animateBreath = ({ duration, inhale }) => {
    return new Promise((resolve) => {
      if (stopRef.current) return resolve();
      Animated.timing(scaleAnim, {
        toValue: inhale ? 1.2 : 0.3, duration: duration * 1000, useNativeDriver: true,
      }).start(() => resolve());
    });
  };

  const runSession = async () => {
    setIsRunning(true); setIsPaused(false);
    stopRef.current = false; pauseRef.current = false;
    setProgress(0); setCurrentRound(1);

    setPhase("Pregătire...");
    startLoopingSound('hold');
    for (let i = settings.prepTime; i > 0; i--) {
      if (stopRef.current) break;
      setProgress(1 - (i / settings.prepTime));
      setTimerText(displayTime(i));
      await sleep(1000);
    }
    stopLoopingSound();
    setProgress(1);

    if (stopRef.current) return reset();

    for (let round = 1; round <= settings.rounds; round++) {
      if (stopRef.current) break;
      setCurrentRound(round);

      for (let breath = 1; breath <= settings.numBreaths; breath++) {
        await checkPaused();
        if (stopRef.current) break;

        const breathsLeft = settings.numBreaths - breath + 1;
        setProgress((breath - 1) / settings.numBreaths);

        // --- INHALE ---
        setPhase(`Runda ${round}/${settings.rounds}`);
        setTimerText(`${breathsLeft} / ${settings.numBreaths}`);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        playSound('inhale');
        await animateBreath({ duration: settings.breathSpeed, inhale: true });

        if (stopRef.current) break;

        // --- EXHALE ---
        setTimerText(`${breathsLeft} / ${settings.numBreaths}`);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        playSound('exhale');
        await animateBreath({ duration: settings.breathSpeed, inhale: false });
        setProgress(breath / settings.numBreaths);
      }

      if (stopRef.current) break;

      const customRoundSetting = settings.customRounds?.find(r => r.round === round);
      const currentHoldTime = customRoundSetting ? customRoundSetting.time : settings.breathOutHold;

      setPhase(`Runda ${round}/${settings.rounds} - ȚINE AERUL`);
      setProgress(0); setCanPause(true);
      startLoopingSound('hold');
      
      for (let i = currentHoldTime; i > 0; i--) {
        await checkPaused();
        if (stopRef.current) break;
        setProgress(1 - (i / currentHoldTime));
        setTimerText(displayTime(i));
        await sleep(1000);
      }
      
      stopLoopingSound(); setCanPause(false); setProgress(1);

      // --- LOGICĂ NOUĂ: SUCCES RETENȚIE ȘI SALVARE ISTORIC ---
      if (!stopRef.current) {
        // Vibrație puternică de succes la finalul retenției
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); 

        // Salvăm timpul în telefon
        try {
          const date = new Date().toISOString().split('T')[0]; // ex: 2026-03-01
          const record = { date, round, time: currentHoldTime };
          const existing = await AsyncStorage.getItem('wimhof_history');
          const history = existing ? JSON.parse(existing) : [];
          history.push(record);
          await AsyncStorage.setItem('wimhof_history', JSON.stringify(history));
        } catch(e) { console.log('Eroare la salvare istoric', e); }
      }
      // --------------------------------------------------------

      if (stopRef.current) break;

      setPhase("Take a deep breath");
      setProgress(0);
      playSound('inhale');
      animateBreath({ duration: settings.deepBreathTime, inhale: true });
      for (let i = settings.deepBreathTime; i > 0; i--) {
        if (stopRef.current) break;
        setTimerText(displayTime(i));
        setProgress(1 - (i / settings.deepBreathTime));
        await sleep(1000);
      }
      setProgress(1);

      if (stopRef.current) break;

      setPhase(`Hold for ${settings.holdTime} seconds`);
      setProgress(0);
      startLoopingSound('hold');
      for (let i = settings.holdTime; i > 0; i--) {
        if (stopRef.current) break;
        setProgress(1 - (i / settings.holdTime));
        setTimerText(displayTime(i));
        await sleep(1000);
      }
      stopLoopingSound();
      setProgress(1);

      if (stopRef.current) break;

      setPhase("Let it go...");
      playSound('exhale');
      setProgress(0);
      animateBreath({ duration: settings.pauseAfterRound, inhale: false });
      for (let i = settings.pauseAfterRound; i > 0; i--) {
        if (stopRef.current) break;
        setTimerText(displayTime(i));
        setProgress(1 - (i / settings.pauseAfterRound));
        await sleep(1000);
      }
      setProgress(1);
    }

    if (!stopRef.current) {
      setPhase('Sesiune Completă!'); setTimerText('Bravo!'); setProgress(1);
      playSound('bowl');
    }
    setTimeout(reset, 3000);
  };

  const reset = () => {
    setIsRunning(false); setIsPaused(false); setCanPause(false); setCurrentRound(1); // Reset runda
    setPhase('Pregătit de start'); setTimerText(''); setProgress(0);
    stopLoopingSound();
    Animated.timing(scaleAnim, { toValue: 0.3, duration: 500, useNativeDriver: true }).start();
  };

  const start = useCallback(() => runSession(), [settings]);
  const pause = useCallback(() => { setIsPaused(true); pauseRef.current = true; setPhase('Pauză'); }, []);
  const resume = useCallback(() => { setIsPaused(false); pauseRef.current = false; setPhase('Sesiune reluată'); if (pauseResolveRef.current) { pauseResolveRef.current(); pauseResolveRef.current = null; } }, []);
  const stop = useCallback(() => { stopRef.current = true; if (pauseRef.current && pauseResolveRef.current) { pauseResolveRef.current(); } reset(); }, []);

  // Exportăm și currentRound ca să îl trimitem către UI
  return { phase, timerText, scaleAnim, progress, isRunning, isPaused, canPause, start, pause, resume, stop, currentRound };
}