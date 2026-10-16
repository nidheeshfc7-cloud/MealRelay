import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Dimensions,
  Easing,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface MobileColorFrame {
  id: number;
  text: string;
  line1: string;
  line2?: string;
  bg: string;
  textColor: string;
  accentColor?: string;
  direction: 'up' | 'left' | 'down' | 'right' | 'center';
  scaleShift?: boolean;
  isLightBg: boolean;
  startMs: number;
  endMs: number;
}

export const RAPID_FRAMES: MobileColorFrame[] = [
  {
    id: 1,
    text: 'STILL GUESSING?',
    line1: 'STILL',
    line2: 'GUESSING?',
    bg: '#D5FB53', // Electric lime
    textColor: '#003F2F', // Forest green
    direction: 'up',
    scaleShift: false,
    isLightBg: true,
    startMs: 0,
    endMs: 380,
  },
  {
    id: 2,
    text: 'TOO MUCH FOOD.',
    line1: 'TOO MUCH',
    line2: 'FOOD.',
    bg: '#003F2F', // Forest green
    textColor: '#F7F7F1', // Warm ivory
    direction: 'left',
    scaleShift: false,
    isLightBg: false,
    startMs: 380,
    endMs: 760,
  },
  {
    id: 3,
    text: 'TOO MUCH WASTE.',
    line1: 'TOO MUCH',
    line2: 'WASTE.',
    bg: '#EF693C', // Burnt orange
    textColor: '#FFFFFF', // Pure white
    direction: 'down',
    scaleShift: true,
    isLightBg: false,
    startMs: 760,
    endMs: 1140,
  },
  {
    id: 4,
    text: 'TIME TO CHANGE.',
    line1: 'TIME TO',
    line2: 'CHANGE.',
    bg: '#F7F7F1', // Warm ivory
    textColor: '#080A09', // Near black
    direction: 'right',
    scaleShift: false,
    isLightBg: true,
    startMs: 1140,
    endMs: 1520,
  },
  {
    id: 5,
    text: 'THINK AHEAD.',
    line1: 'THINK',
    line2: 'AHEAD.',
    bg: '#245BFF', // Vibrant cobalt
    textColor: '#FFFFFF', // Pure white
    direction: 'up',
    scaleShift: true,
    isLightBg: false,
    startMs: 1520,
    endMs: 1900,
  },
  {
    id: 6,
    text: 'PREPARE SMARTER.',
    line1: 'PREPARE',
    line2: 'SMARTER.',
    bg: '#080A09', // Near black
    textColor: '#D5FB53', // Electric lime
    direction: 'down',
    scaleShift: false,
    isLightBg: false,
    startMs: 1900,
    endMs: 2280,
  },
  {
    id: 7,
    text: 'WASTE LESS.',
    line1: 'WASTE',
    line2: 'LESS.',
    bg: '#D5FB53', // Electric lime
    textColor: '#003F2F', // Forest green
    direction: 'up',
    scaleShift: true,
    isLightBg: true,
    startMs: 2280,
    endMs: 2700,
  },
  {
    id: 8,
    text: 'MEALRELAY.',
    line1: 'MEALRELAY.',
    bg: '#003F2F', // Forest green
    textColor: '#F7F7F1', // Warm ivory
    accentColor: '#D5FB53', // Electric lime
    direction: 'center',
    scaleShift: true,
    isLightBg: false,
    startMs: 2700,
    endMs: 3200,
  },
];

interface IntroProps {
  onDone: () => void;
}

export default function Intro({ onDone }: IntroProps) {
  const [frameIdx, setFrameIdx] = useState<number>(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  // Animation values for directional reveals & exit
  const textTranslateX = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(36)).current;
  const textScale = useRef(new Animated.Value(1)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const screenFadeOut = useRef(new Animated.Value(1)).current;

  const finished = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const later = (fn: () => void, ms: number) => {
    const t = setTimeout(fn, ms);
    timers.current.push(t);
    return t;
  };

  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    timers.current.forEach(clearTimeout);
    timers.current = [];

    // Smooth coordinated dismiss into application dashboard
    Animated.timing(screenFadeOut, {
      toValue: 0,
      duration: 340,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      onDone();
    });
  };

  // Check reduced motion accessibility
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => setReduceMotion(enabled))
      .catch(() => {});
  }, []);

  const triggerDirectionalReveal = (frame: MobileColorFrame) => {
    // Reset initial directional offsets
    let initX = 0;
    let initY = 0;
    let initScale = frame.scaleShift ? 1.05 : 1.0;

    switch (frame.direction) {
      case 'up':
        initY = 38;
        break;
      case 'down':
        initY = -38;
        break;
      case 'left':
        initX = -46;
        break;
      case 'right':
        initX = 46;
        break;
      case 'center':
        initScale = 0.92;
        break;
    }

    textTranslateX.setValue(initX);
    textTranslateY.setValue(initY);
    textScale.setValue(initScale);
    textOpacity.setValue(0);

    // Fast masked directional reveal (115ms)
    Animated.parallel([
      Animated.timing(textTranslateX, {
        toValue: 0,
        duration: 115,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
        useNativeDriver: true,
      }),
      Animated.timing(textTranslateY, {
        toValue: 0,
        duration: 115,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
        useNativeDriver: true,
      }),
      Animated.timing(textScale, {
        toValue: 1,
        duration: 130,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
        useNativeDriver: true,
      }),
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 85,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Main Stage 1.1 Rapid-Fire Sequence Timeline
  useEffect(() => {
    if (reduceMotion) {
      // Accessible pacing for reduced-motion users
      setFrameIdx(5); // PREPARE SMARTER.
      triggerDirectionalReveal(RAPID_FRAMES[5]);

      later(() => {
        setFrameIdx(6); // WASTE LESS.
        triggerDirectionalReveal(RAPID_FRAMES[6]);
      }, 1000);

      later(() => {
        setFrameIdx(7); // MEALRELAY.
        triggerDirectionalReveal(RAPID_FRAMES[7]);
      }, 2000);

      later(() => finish(), 3100);
      return;
    }

    // Schedule exact rapid cuts
    RAPID_FRAMES.forEach((frame, idx) => {
      later(() => {
        setFrameIdx(idx);
        triggerDirectionalReveal(frame);
      }, frame.startMs);
    });

    // 3.20s: Final transition smoothly toward the application
    later(() => {
      finish();
    }, 3200);

    return () => {
      timers.current.forEach(clearTimeout);
      textTranslateX.stopAnimation();
      textTranslateY.stopAnimation();
      textScale.stopAnimation();
      textOpacity.stopAnimation();
      screenFadeOut.stopAnimation();
    };
  }, [reduceMotion]);

  const topInset = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 12 : 54;
  const currentFrame = RAPID_FRAMES[frameIdx] || RAPID_FRAMES[0];

  return (
    <Animated.View
      style={[
        styles.root,
        {
          backgroundColor: currentFrame.bg,
          opacity: screenFadeOut,
        },
      ]}
    >
      <StatusBar
        barStyle={currentFrame.isLightBg ? 'dark-content' : 'light-content'}
        translucent
        backgroundColor="transparent"
      />

      {/* Adaptive High-Contrast Skip Button */}
      <Pressable
        onPress={finish}
        accessibilityRole="button"
        accessibilityLabel="Skip intro"
        style={[
          styles.skipButton,
          {
            top: topInset,
            backgroundColor: currentFrame.isLightBg ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.12)',
            borderColor: currentFrame.isLightBg ? 'rgba(0, 0, 0, 0.18)' : 'rgba(255, 255, 255, 0.2)',
          },
        ]}
        hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
      >
        <Text
          style={[
            styles.skipText,
            { color: currentFrame.textColor },
          ]}
        >
          SKIP INTRO
        </Text>
        <Ionicons
          name="arrow-forward"
          size={12}
          color={currentFrame.textColor}
          style={{ opacity: 0.85 }}
        />
      </Pressable>

      {/* Kinetic Typography Stage with Fast Directional Reveal */}
      <View style={styles.centerStage}>
        <Animated.View
          style={[
            styles.textContainer,
            {
              opacity: textOpacity,
              transform: [
                { translateX: textTranslateX },
                { translateY: textTranslateY },
                { scale: textScale },
              ],
            },
          ]}
        >
          {currentFrame.id !== 8 ? (
            <View style={styles.phraseWrapper}>
              <Text
                style={[
                  styles.heroWord,
                  { color: currentFrame.textColor },
                  currentFrame.scaleShift && styles.heroEmphasis,
                ]}
              >
                {currentFrame.line1}
              </Text>
              {currentFrame.line2 && (
                <Text
                  style={[
                    styles.heroWord,
                    { color: currentFrame.textColor },
                    currentFrame.scaleShift && styles.heroEmphasis,
                  ]}
                >
                  {currentFrame.line2}
                </Text>
              )}
            </View>
          ) : (
            /* Frame 8: Brand Wordmark Climax */
            <View style={styles.brandRow}>
              <View style={styles.brandIconBox}>
                <Ionicons name="leaf" size={26} color="#003F2F" />
              </View>
              <Text style={styles.brandTitle}>
                MEALRELAY<Text style={styles.limePeriod}>.</Text>
              </Text>
            </View>
          )}
        </Animated.View>
      </View>

      {/* Editorial Baseline Bar with Frame Counter */}
      <View style={[styles.bottomBar, { bottom: Math.max(34, topInset - 16) }]}>
        <View style={styles.bottomLeftGroup}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: currentFrame.textColor },
            ]}
          />
          <Text
            style={[
              styles.bottomBarText,
              { color: currentFrame.textColor },
            ]}
          >
            STAGE 1.1 · RAPID COLOR CUTS
          </Text>
        </View>

        {/* Counter: 01 / 08 .. 08 / 08 */}
        <Text
          style={[
            styles.counterText,
            { color: currentFrame.textColor },
          ]}
        >
          0{currentFrame.id} / 08
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    zIndex: 9999,
  },
  skipButton: {
    position: 'absolute',
    right: 20,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: 100,
    borderWidth: 1,
  },
  skipText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  centerStage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    overflow: 'hidden',
  },
  textContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  phraseWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroWord: {
    fontSize: Math.min(SCREEN_WIDTH * 0.135, 52),
    lineHeight: Math.min(SCREEN_WIDTH * 0.145, 56),
    fontWeight: '900',
    letterSpacing: -1.5,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  heroEmphasis: {
    fontSize: Math.min(SCREEN_WIDTH * 0.148, 58),
    lineHeight: Math.min(SCREEN_WIDTH * 0.158, 62),
    letterSpacing: -2,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 16,
  },
  brandIconBox: {
    width: Math.min(SCREEN_WIDTH * 0.11, 44),
    height: Math.min(SCREEN_WIDTH * 0.11, 44),
    borderRadius: 14,
    backgroundColor: '#D5FB53',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-6deg' }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  brandTitle: {
    color: '#F7F7F1',
    fontSize: Math.min(SCREEN_WIDTH * 0.105, 42),
    fontWeight: '900',
    letterSpacing: -1.5,
    textTransform: 'uppercase',
  },
  limePeriod: {
    color: '#D5FB53',
  },
  bottomBar: {
    position: 'absolute',
    left: 24,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bottomLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    opacity: 0.9,
  },
  bottomBarText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
    opacity: 0.85,
  },
  counterText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
    opacity: 0.9,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});
