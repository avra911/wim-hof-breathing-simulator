import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Platform, StatusBar as RNStatusBar } from 'react-native';
import { Play, Settings, Square, Pause } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useKeepAwake } from 'expo-keep-awake';

import BreathCircle from './components/BreathCircle';
import SettingsPanel from './components/SettingsPanel';
import { t } from './utils/i18n';
import { useBreathing, DEFAULT_SETTINGS } from './hooks/useBreathing';

export default function App() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);

  useKeepAwake();

  // Încărcăm setările salvate
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const saved = await AsyncStorage.getItem('innerfire_settings');
        if (saved) setSettings(JSON.parse(saved));
      } catch (e) {
        console.log('Error loading settings', e);
      }
    };
    loadSettings();
  }, []);

  // Salvăm setările automat când se modifică
  useEffect(() => {
    AsyncStorage.setItem('innerfire_settings', JSON.stringify(settings));
  }, [settings]);

  const { phase, timerText, scaleAnim, progress, isRunning, isPaused, canPause, start, pause, resume, stop, currentRound } = useBreathing(settings);

  // Definim tema de culori ("Level Up") - un spectru de la verde spre alb
  const getThemeColor = (round) => {
    if (!isRunning) return '#22c55e'; // Verde standard când e oprit
    
    // O listă de culori (index 0 e runda 1, index 1 e runda 2 etc.)
    const roundColors = [
      '#22c55e', // Runda 1: Verde (Calm / Bază)
      '#06b6d4', // Runda 2: Turcoaz (Oxigenare)
      '#3b82f6', // Runda 3: Albastru (Ice Man)
      '#6366f1', // Runda 4: Indigo (Profund)
      '#8b5cf6', // Runda 5: Violet (Stare Zen)
      '#d946ef', // Runda 6: Roz/Magenta (Pineal gland)
      '#ffffff'  // Runda 7+: Alb pur (Transcendence)
    ];

    // Dacă runda e mai mare decât numărul de culori pe care le avem, 
    // luăm ultima culoare din listă (în cazul nostru, Alb)
    const colorIndex = Math.min(round - 1, roundColors.length - 1);
    
    return roundColors[colorIndex];
  };
  const activeColor = getThemeColor(currentRound);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar hidden={true} />

      {/* Setările în format de Modal Nativ */}
      <SettingsPanel
        visible={showSettings}
        settings={settings}
        setSettings={setSettings}
        onClose={() => setShowSettings(false)}
      />

      {/* Header Bar - Acum respectă Status Bar-ul de pe Android */}
      <View style={styles.header}>
        <Text style={styles.title}>
          {t('app.title')} <Text style={[styles.titleHighlight, { color: activeColor }]}>{t('app.subtitle')}</Text>
        </Text>
        <TouchableOpacity
          style={[styles.settingsButton, isRunning && { opacity: 0.3 }]}
          onPress={() => setShowSettings(true)}
          disabled={isRunning}
        >
          <Settings color="#9CA3AF" size={26} />
        </TouchableOpacity>
      </View>

      <View style={styles.centerArea}>
        <BreathCircle 
          scaleAnim={scaleAnim} 
          timerText={timerText} 
          progress={progress} 
          themeColor={activeColor} 
        />
      </View>

      <Text style={styles.phaseText}>{phase}</Text>

      <View style={styles.controls}>
        {!isRunning ? (
            <TouchableOpacity style={[styles.button, styles.startButton]} onPress={start}>
            <Play color="#ffffff" size={24} fill="#ffffff" />
              <Text style={styles.buttonText}>{t('startSession')}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.activeControls}>
            {!isPaused ? (
              <TouchableOpacity
                style={[styles.button, styles.pauseButton, !canPause && { opacity: 0.5 }]}
                onPress={pause}
                disabled={!canPause}
              >
                <Pause color="#ffffff" size={24} fill="#ffffff" />
                <Text style={styles.buttonText}>{t('pause')}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[styles.button, styles.resumeButton]} onPress={resume}>
                <Play color="#ffffff" size={24} fill="#ffffff" />
                <Text style={styles.buttonText}>{t('resume')}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={[styles.button, styles.stopButton]} onPress={stop}>
              <Square color="#ffffff" size={24} fill="#ffffff" />
              <Text style={styles.buttonText}>{t('stop')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight + 15 : (Platform.OS === 'web' ? 20 : 0)
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center', // Centram titlul perfect natural
    alignItems: 'center',
    marginBottom: 40,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
    position: 'relative',
    height: 60,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  titleHighlight: {
    color: '#22c55e',
    fontWeight: '300'
  },
  settingsButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    padding: 10,
    backgroundColor: '#111827',
    borderRadius: 50,
    borderWidth: 1,
    borderColor: '#374151',
    zIndex: 10
  },
  centerArea: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  phaseText: { fontSize: 22, color: '#d1d5db', textAlign: 'center', marginBottom: 30, fontWeight: '500' },
  controls: { paddingBottom: 40 },
  button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: 30, gap: 10 },
  activeControls: { flexDirection: 'row', gap: 15 },
  startButton: { backgroundColor: '#16a34a', width: '100%' },
  pauseButton: { backgroundColor: '#ca8a04', flex: 1 },
  resumeButton: { backgroundColor: '#2563eb', flex: 1 },
  stopButton: { backgroundColor: '#dc2626', flex: 1 },
  buttonText: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
});