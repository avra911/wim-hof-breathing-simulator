import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Platform } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function BreathCircle({ scaleAnim, timerText, progress = 0, themeColor = '#22c55e' }) {
  const animatedProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: progress,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const radius = 135; 
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0]
  });

  // --- ANIMAȚIA PENTRU TEXT (se leagă de mișcarea plămânilor) ---
  const numberScale = scaleAnim.interpolate({
    inputRange: [0.3, 1.2],
    outputRange: [0.85, 1.15] // Mic pe Out, Mare pe In
  });

  const numberColor = scaleAnim.interpolate({
    inputRange: [0.3, 1.2],
    outputRange: ['#9ca3af', '#ffffff'] // Gri pe Out, Alb strălucitor pe In
  });

  // Verificăm dacă textul este o fracție (ex: "30 / 30") pentru a anima doar prima parte
  const textParts = timerText.split(' / ');
  const isFraction = textParts.length === 2;

  return (
    <View style={styles.wrapper}>
      
      <View style={styles.textContainer}>
        {isFraction ? (
          <View style={styles.fractionContainer}>
            {/* Numărul de respirații rămas (Animat) */}
            <Animated.Text 
              style={[
                styles.timerText, 
                { 
                  color: numberColor, 
                  transform: [{ scale: numberScale }] 
                }
              ]}
              {...(Platform.OS !== 'web' ? { collapsable: false } : {})}
            >
              {textParts[0]}
            </Animated.Text>
            
            {/* Partea statică cu totalul (ex: " / 30") */}
            <Text style={styles.staticFractionText}>
              {' / ' + textParts[1]}
            </Text>
          </View>
        ) : (
          <Text style={styles.timerText}>{timerText}</Text>
        )}
      </View>

      <View style={styles.circleContainer}>
        <View style={styles.progressRingContainer}>
          <Svg width="300" height="300">
            <Circle cx="150" cy="150" r={radius} stroke="#1f2937" strokeWidth="0.5" fill="none" />
            <AnimatedCircle
              cx="150" cy="150" r={radius} stroke={themeColor} strokeWidth="5"
              fill="none" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
              strokeLinecap="round" transform="rotate(-90 150 150)"
            />
          </Svg>
        </View>

        {/* Plămânii 3D-ish Animați */}
        <Animated.View {...(Platform.OS !== 'web' ? { collapsable: false } : {})} style={[styles.lungsContainer, { transform: [{ scale: scaleAnim }] }]}>
          <Svg width="180" height="180" viewBox="-100 -70 200 200">
            
            {/* 1. Traheea și Bronhiile Principale (mai groase și definite) */}
            <Path 
              d="M -6 -50 L 6 -50 L 6 -15 L 20 2 L 14 8 L 0 -5 L -14 8 L -20 2 L -6 -15 Z" 
              fill={themeColor} opacity="0.95" 
            />

            {/* 2. Plămânul Drept (pe stânga) - formă alungită, bază plată */}
            <Path 
              d="M -15 5 C -15 -25, -30 -40, -45 -35 C -70 -20, -85 20, -75 80 C -65 110, -25 105, -15 85 C -5 65, -10 30, -15 5 Z" 
              fill={themeColor} opacity="0.85" 
            />

            {/* 3. Plămânul Stâng (pe dreapta) - cu scobitură pentru inimă (cardiac notch) */}
            <Path 
              d="M 15 5 C 15 -25, 30 -40, 45 -35 C 70 -20, 85 20, 75 80 C 65 110, 35 105, 20 85 C 35 60, 40 40, 15 5 Z" 
              fill={themeColor} opacity="0.85" 
            />

            {/* 4. Ramificații (Bronhiole) - mutate adânc în interiorul lobilor */}
            <Path 
              d="M -25 15 Q -45 20 -60 30 M -30 35 Q -45 50 -55 65 M -25 60 Q -35 75 -40 85" 
              stroke="#ffffff" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.35" 
            />
            <Path 
              d="M 25 15 Q 45 20 60 30 M 38 35 Q 50 45 55 60 M 40 60 Q 45 75 45 85" 
              stroke="#ffffff" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.35" 
            />

            {/* 5. Highlights 3D - lumina care cade pe lobii superiori */}
            <Path 
              d="M -45 -30 C -65 -15, -75 10, -70 40 C -70 20, -55 -10, -40 -20 Z" 
              fill="#ffffff" opacity="0.25" 
            />
            <Path 
              d="M 45 -30 C 65 -15, 75 10, 70 40 C 70 20, 55 -10, 40 -20 Z" 
              fill="#ffffff" opacity="0.25" 
            />

            {/* 6. Shadows 3D - umbra la bază pentru volum */}
            <Path 
              d="M -75 80 C -65 110, -25 105, -15 85 C -25 100, -60 100, -70 70 Z" 
              fill="#000000" opacity="0.15" 
            />
            <Path 
              d="M 75 80 C 65 110, 35 105, 20 85 C 30 100, 60 100, 70 70 Z" 
              fill="#000000" opacity="0.15" 
            />

          </Svg>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', justifyContent: 'center' },
  textContainer: { 
    height: 60, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginBottom: 10 
  },
  fractionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    color: '#ffffff',
    fontSize: 42,
    fontWeight: 'bold',
  },
  staticFractionText: {
    color: '#4b5563', // Un gri mai închis pentru a nu distrage atenția
    fontSize: 32,
    fontWeight: '600',
    marginTop: 5, // O mică ajustare pentru a-l alinia vizual cu numărul animat
  },
  circleContainer: { width: 300, height: 300, alignItems: 'center', justifyContent: 'center' },
  progressRingContainer: { position: 'absolute' },
  lungsContainer: { position: 'absolute', alignItems: 'center', justifyContent: 'center' }
});