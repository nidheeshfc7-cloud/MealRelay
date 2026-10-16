import Intro from './Intro';
import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Easing,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  DEFAULT_MEALS,
  INITIAL_PORTIONS,
  adjustPortionQuantity,
  calculateTotalPortions,
  calculateWasteReduction,
  formatPortionNumber,
} from '@mealrelay/core';
import type { MealPortionCounts, MealServiceConfig, MealServiceKey } from '@mealrelay/types';
import { BRAND_PALETTE } from '@mealrelay/config';

const C = {
  bg: BRAND_PALETTE.canvasBg,
  paper: BRAND_PALETTE.paper,
  ink: BRAND_PALETTE.ink,
  secondary: BRAND_PALETTE.inkSubtle,
  green: BRAND_PALETTE.forestGreen,
  green2: '#1D5A40',
  forestDark: BRAND_PALETTE.forestDark,
  lime: BRAND_PALETTE.electricLime,
  sage: BRAND_PALETTE.sage,
  line: BRAND_PALETTE.borderLight,
  orange: BRAND_PALETTE.orangeAccent,
  light: BRAND_PALETTE.lightGreen,
  warmIvory: BRAND_PALETTE.warmIvory,
};

type Tab = 'Home' | 'Plan' | 'Insights' | 'Settings';
type Meal = MealServiceConfig;

const MEALS = DEFAULT_MEALS;
const fmt = formatPortionNumber;
const { width: SW } = Dimensions.get('window');

function Glyph({ name, size = 19, color = C.ink }: { name: any; size?: number; color?: string }) {
  return <Ionicons name={name} size={size} color={color} />;
}

function Txt({ children, style, muted = false }: { children: React.ReactNode; style?: any; muted?: boolean }) {
  return <Text style={[{ color: muted ? C.secondary : C.ink, fontSize: 14 }, style]}>{children}</Text>;
}

function Pill({ label, tone = 'light' }: { label: string; tone?: 'light' | 'dark' | 'lime' }) {
  return (
    <View
      style={{
        borderRadius: 100,
        backgroundColor: tone === 'dark' ? C.green : tone === 'lime' ? C.lime : C.sage,
        paddingVertical: 6,
        paddingHorizontal: 12,
        alignSelf: 'flex-start',
      }}
    >
      <Txt
        style={{
          fontWeight: '800',
          fontSize: 11,
          color: tone === 'dark' ? 'white' : C.green,
          letterSpacing: 0.5,
        }}
      >
        {label}
      </Txt>
    </View>
  );
}

function Button({
  label,
  onPress,
  kind = 'dark',
  icon,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  kind?: 'dark' | 'lime' | 'outline';
  icon?: any;
  disabled?: boolean;
}) {
  const bg = kind === 'dark' ? C.green : kind === 'lime' ? C.lime : 'transparent';
  const fc = kind === 'dark' ? 'white' : C.green;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        {
          backgroundColor: bg,
          borderColor: kind === 'outline' ? C.line : bg,
          borderWidth: 1,
          borderRadius: 16,
          paddingHorizontal: 20,
          paddingVertical: 16,
          opacity: disabled ? 0.4 : pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        },
      ]}
    >
      <Txt style={{ color: fc, fontWeight: '800', fontSize: 15 }}>{label}</Txt>
      {icon && <Glyph name={icon} color={fc} size={17} />}
    </Pressable>
  );
}

function SectionTitle({
  eyebrow,
  title,
  right,
  onRight,
}: {
  eyebrow?: string;
  title: string;
  right?: string;
  onRight?: () => void;
}) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14 }}>
      <View>
        {eyebrow && <Txt muted style={{ fontSize: 10, letterSpacing: 2, fontWeight: '800', marginBottom: 6 }}>{eyebrow.toUpperCase()}</Txt>}
        <Txt style={{ fontWeight: '800', fontSize: 22, letterSpacing: -0.8 }}>{title}</Txt>
      </View>
      {right && (
        <Pressable onPress={onRight} hitSlop={10}>
          <Txt style={{ fontSize: 12, fontWeight: '800', color: C.green2 }}>{right} →</Txt>
        </Pressable>
      )}
    </View>
  );
}

function IconBubble({ name, color = C.green, bg = C.sage, size = 18 }: { name: any; color?: string; bg?: string; size?: number }) {
  return (
    <View style={{ width: 42, height: 42, backgroundColor: bg, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}>
      <Glyph name={name} color={color} size={size} />
    </View>
  );
}

function Bars({ values, height = 85, highlight = values.length - 1 }: { values: number[]; height?: number; highlight?: number }) {
  const peak = Math.max(...values, 1);
  return (
    <View style={{ height, flexDirection: 'row', alignItems: 'flex-end', gap: 7 }}>
      {values.map((v, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            height: Math.max(6, (height * v) / peak),
            borderTopLeftRadius: 5,
            borderTopRightRadius: 5,
            backgroundColor: i === highlight ? C.lime : '#B7CEBA',
          }}
        />
      ))}
    </View>
  );
}

function Brand({ light = false }: { light?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <View
        style={{
          backgroundColor: light ? C.lime : C.green,
          width: 36,
          height: 36,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ rotate: '-8deg' }],
        }}
      >
        <Glyph name="leaf" color={light ? C.green : 'white'} size={20} />
      </View>
      <Txt style={{ color: light ? 'white' : C.ink, fontSize: 21, fontWeight: '900', letterSpacing: -1.2 }}>
        mealrelay<Text style={{ color: light ? C.lime : C.green2 }}>.</Text>
      </Txt>
    </View>
  );
}

/**
 * Animated Meal-Demand Preview
 * Genuine forecasting preview demonstrating service breakdown, portions, and waste prevention.
 */
function MealDemandPreview() {
  const [selectedService, setSelectedService] = useState<'all' | 'breakfast' | 'lunch' | 'dinner'>('all');
  const barAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    barAnim.setValue(0);
    Animated.timing(barAnim, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [selectedService]);

  const serviceData = {
    all: { label: 'Full Day', count: 661, wasteSaved: '24.6%', buffer: '+4.8%' },
    breakfast: { label: 'Breakfast', count: 182, wasteSaved: '18.2%', buffer: '+4.2%' },
    lunch: { label: 'Lunch', count: 264, wasteSaved: '29.5%', buffer: '+5.1%' },
    dinner: { label: 'Dinner', count: 215, wasteSaved: '22.0%', buffer: '+4.7%' },
  };

  const current = serviceData[selectedService];

  return (
    <View style={landingStyles.previewCard}>
      <View style={landingStyles.previewHeader}>
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={landingStyles.pulseDot} />
            <Text style={landingStyles.previewEyebrow}>LIVE KITCHEN RADAR</Text>
          </View>
          <Text style={landingStyles.previewTitle}>Demands & Buffer Forecast</Text>
        </View>
        <View style={landingStyles.bufferBadge}>
          <Text style={landingStyles.bufferBadgeText}>{current.buffer} BUFFER</Text>
        </View>
      </View>

      {/* Service Switcher Tabs */}
      <View style={landingStyles.serviceTabsRow}>
        {(['all', 'breakfast', 'lunch', 'dinner'] as const).map((key) => {
          const active = selectedService === key;
          return (
            <Pressable
              key={key}
              onPress={() => setSelectedService(key)}
              style={[landingStyles.serviceTab, active && landingStyles.serviceTabActive]}
            >
              <Text style={[landingStyles.serviceTabText, active && landingStyles.serviceTabTextActive]}>
                {key.toUpperCase()}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Dynamic Animated Metric Row */}
      <View style={landingStyles.metricRow}>
        <View style={{ flex: 1 }}>
          <Text style={landingStyles.metricNumber}>{fmt(current.count)}</Text>
          <Text style={landingStyles.metricLabel}>Total planned portions</Text>
        </View>
        <View style={landingStyles.metricDivider} />
        <View style={{ flex: 1, paddingLeft: 12 }}>
          <Text style={[landingStyles.metricNumber, { color: C.green }]}>~{current.wasteSaved}</Text>
          <Text style={landingStyles.metricLabel}>Food waste prevented</Text>
        </View>
      </View>

      {/* Interactive Service Bars */}
      <View style={{ marginTop: 14 }}>
        {MEALS.map((m) => {
          const isHighlighted = selectedService === 'all' || selectedService === m.key;
          const ratio = m.base / 264;
          return (
            <View key={m.key} style={{ marginVertical: 4 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                <Text style={[landingStyles.barLabel, !isHighlighted && { opacity: 0.4 }]}>{m.name}</Text>
                <Text style={[landingStyles.barValue, !isHighlighted && { opacity: 0.4 }]}>{m.base} portions</Text>
              </View>
              <View style={landingStyles.barTrack}>
                <Animated.View
                  style={[
                    landingStyles.barFill,
                    {
                      width: barAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', `${ratio * 100}%`],
                      }),
                      backgroundColor: isHighlighted ? (selectedService === m.key ? C.lime : C.green) : '#D0DDD4',
                    },
                  ]}
                />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

/**
 * Enhanced Landing Screen (Scene 4 & Home Entry)
 */
function Welcome({
  onStart,
  onDemo,
  onReplayIntro,
}: {
  onStart: () => void;
  onDemo: () => void;
  onReplayIntro: () => void;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 480,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 480,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      {/* Editorial Forest Green Hero */}
      <LinearGradient
        colors={[C.green, '#054B38', C.forestDark]}
        style={[
          landingStyles.heroContainer,
          { paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 16 : 28 },
        ]}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {/* Header Row with Brand & Replay Button */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Brand light />
            <Pressable
              onPress={onReplayIntro}
              style={landingStyles.replayPill}
              accessibilityRole="button"
              accessibilityLabel="Replay cinematic intro"
            >
              <Glyph name="play" color="white" size={12} />
              <Text style={landingStyles.replayPillText}>REPLAY INTRO</Text>
            </Pressable>
          </View>

          {/* Hero Typography */}
          <View style={{ marginTop: 42 }}>
            <Pill label="THE SMARTER KITCHEN ERA" tone="lime" />
            <Text style={landingStyles.headline}>
              Every meal{'\n'}planned.{'\n'}
              <Text style={{ color: C.lime }}>Less wasted.</Text>
            </Text>
            <Text style={landingStyles.subcopy}>
              Predict demand before the first ingredient hits the pan. Plan confidently. Waste thoughtfully.
            </Text>
          </View>

          {/* Call to Actions */}
          <View style={{ marginTop: 28, gap: 12 }}>
            <Button label="Explore the dashboard" onPress={onStart} kind="lime" icon="arrow-forward" />
            <Pressable onPress={onDemo} style={landingStyles.secondaryButton}>
              <Text style={landingStyles.secondaryButtonText}>See how it works →</Text>
            </Pressable>
          </View>
        </Animated.View>

        {/* Ambient Architectural Circles */}
        <View style={landingStyles.bgRing1} pointerEvents="none" />
        <View style={landingStyles.bgRing2} pointerEvents="none" />
      </LinearGradient>

      {/* Main Body Content */}
      <View style={{ padding: 22 }}>
        {/* Animated Meal-Demand Preview Card */}
        <MealDemandPreview />

        {/* Workflow Section */}
        <View style={{ marginTop: 28 }}>
          <SectionTitle eyebrow="DESIGNED FOR REAL KITCHENS" title="Less guessing. More impact." />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {[
              { n: '01', t: 'Predict', d: 'Historical trends & headcount modeling.', i: 'analytics-outline' },
              { n: '02', t: 'Prepare', d: 'Portion quantities with safety buffer.', i: 'restaurant-outline' },
              { n: '03', t: 'Improve', d: 'Closed-loop log of leftovers to refine run.', i: 'leaf-outline' },
            ].map((e) => (
              <Pressable
                key={e.n}
                onPress={onDemo}
                style={({ pressed }) => [
                  landingStyles.workflowCard,
                  { transform: [{ scale: pressed ? 0.97 : 1 }] },
                ]}
              >
                <IconBubble name={e.i} />
                <View>
                  <Txt muted style={{ fontSize: 10, fontWeight: '800', letterSpacing: 1.2 }}>{e.n}</Txt>
                  <Txt style={{ fontWeight: '800', fontSize: 15, marginTop: 2 }}>{e.t}</Txt>
                </View>
                <Txt muted style={{ fontSize: 11, lineHeight: 16 }}>{e.d}</Txt>
              </Pressable>
            ))}
          </View>
        </View>

        <Txt muted style={{ textAlign: 'center', fontSize: 11, marginTop: 28 }}>
          MealRelay Mini · High-Precision Food Operations Demo
        </Txt>
      </View>
    </ScrollView>
  );
}

function Demo({ onClose, onStart }: { onClose: () => void; onStart: () => void }) {
  const steps = [
    ['01', 'Understand your kitchen', 'Use past attendance and meal data to estimate demand.', 'stats-chart-outline'],
    ['02', 'Cook with confidence', 'Review recommendations and adjust portions before preparation.', 'restaurant-outline'],
    ['03', 'Learn from every service', 'Record what was served and left over to improve future plans.', 'trending-up-outline'],
  ];

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ padding: 22, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Brand />
        <Pressable onPress={onClose} hitSlop={10}>
          <Glyph name="close-circle" size={32} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ padding: 22, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Pill label="THE MEALRELAY WORKFLOW" />
        <Txt style={{ fontSize: 38, fontWeight: '900', letterSpacing: -1.6, lineHeight: 43, marginTop: 18, marginBottom: 12 }}>
          Make every meal{'\n'}count.
        </Txt>
        <Txt muted style={{ fontSize: 15, lineHeight: 23, marginBottom: 26 }}>
          A simple closed-loop system that turns kitchen data into smarter preparation decisions.
        </Txt>
        {steps.map((s) => (
          <View
            key={s[0]}
            style={{
              flexDirection: 'row',
              gap: 15,
              backgroundColor: 'white',
              padding: 19,
              borderRadius: 21,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: C.line,
            }}
          >
            <IconBubble name={s[3]} />
            <View style={{ flex: 1 }}>
              <Txt muted style={{ fontSize: 10, letterSpacing: 1.4, fontWeight: '800' }}>STEP {s[0]}</Txt>
              <Txt style={{ fontSize: 17, fontWeight: '800', marginTop: 4 }}>{s[1]}</Txt>
              <Txt muted style={{ fontSize: 13, lineHeight: 20, marginTop: 6 }}>{s[2]}</Txt>
            </View>
          </View>
        ))}
        <View style={{ marginTop: 18 }}>
          <Button label="Open interactive demo" onPress={onStart} icon="arrow-forward" />
        </View>
      </ScrollView>
    </View>
  );
}

function Header({ subtitle = 'FRIDAY, 16 OCTOBER', name = 'Kitchen overview' }: { subtitle?: string; name?: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
      <View>
        <Txt muted style={{ fontSize: 10, fontWeight: '800', letterSpacing: 1.5 }}>{subtitle}</Txt>
        <Txt style={{ fontSize: 26, fontWeight: '900', letterSpacing: -1.1, marginTop: 5 }}>{name}</Txt>
      </View>
      <View style={{ width: 44, height: 44, borderRadius: 15, backgroundColor: '#DFE9DC', alignItems: 'center', justifyContent: 'center' }}>
        <Glyph name="person-outline" size={21} />
      </View>
    </View>
  );
}

function Home({
  counts,
  approved,
  onGoPlan,
  onGoInsights,
}: {
  counts: Record<string, number>;
  approved: boolean;
  onGoPlan: () => void;
  onGoInsights: () => void;
}) {
  const total = calculateTotalPortions(counts as MealPortionCounts);

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.page}>
      <Header />
      <LinearGradient colors={[C.green, '#1D5C40']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Txt style={{ color: '#C6DDCD', letterSpacing: 1.5, fontSize: 11, fontWeight: '800' }}>TOMORROW'S PLAN</Txt>
          <Pill label={approved ? 'APPROVED ✓' : 'AWAITING REVIEW'} tone="lime" />
        </View>
        <Txt style={{ color: 'white', fontSize: 50, fontWeight: '900', letterSpacing: -2.5, marginTop: 20 }}>
          {fmt(total)}
          <Text style={{ fontSize: 18, color: '#B9D4C3', fontWeight: '500' }}> portions</Text>
        </Txt>
        <Txt style={{ color: '#D0E5D5', fontSize: 13, marginTop: 2 }}>Recommended across 3 meal services</Txt>
        <View style={{ height: 1, backgroundColor: '#2C6A4F', marginVertical: 24 }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {[
            ['3', 'MEAL SERVICES'],
            ['~4.8%', 'BUFFER*'],
            ['Ready', 'STATUS'],
          ].map((p, i) => (
            <View key={i}>
              <Txt style={{ color: 'white', fontWeight: '800', fontSize: 19 }}>{p[0]}</Txt>
              <Txt style={{ color: '#B6CEBA', letterSpacing: 0.8, fontSize: 9, marginTop: 5 }}>{p[1]}</Txt>
            </View>
          ))}
        </View>
        <Pressable
          style={{
            flexDirection: 'row',
            marginTop: 25,
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: C.lime,
            padding: 16,
            borderRadius: 16,
          }}
          onPress={onGoPlan}
        >
          <Txt style={{ fontSize: 14, fontWeight: '800', color: C.green }}>
            {approved ? 'Review approved plan' : 'Review meal plan'}
          </Txt>
          <Glyph name="arrow-forward" color={C.green} />
        </Pressable>
      </LinearGradient>

      <Txt muted style={{ fontSize: 10, marginTop: 9, marginBottom: 28 }}>
        *Illustrative demo assumption; not a measured forecast.
      </Txt>

      <SectionTitle eyebrow="MEAL-BY-MEAL" title="Your service breakdown" right="See plan" onRight={onGoPlan} />
      {MEALS.map((m) => (
        <Pressable
          onPress={onGoPlan}
          key={m.key}
          style={{
            backgroundColor: C.paper,
            borderWidth: 1,
            borderColor: C.line,
            borderRadius: 20,
            padding: 17,
            marginBottom: 10,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 13,
          }}
        >
          <IconBubble name={m.icon} bg={m.color} />
          <View style={{ flex: 1 }}>
            <Txt style={{ fontSize: 15, fontWeight: '800' }}>{m.name}</Txt>
            <Txt muted style={{ fontSize: 11, marginTop: 4 }}>{m.period}</Txt>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Txt style={{ fontWeight: '900', fontSize: 20 }}>{fmt(counts[m.key])}</Txt>
            <Txt muted style={{ fontSize: 10 }}>portions</Txt>
          </View>
        </Pressable>
      ))}

      <View style={{ marginTop: 25 }}>
        <SectionTitle eyebrow="AT A GLANCE" title="A little more clarity" right="Insights" onRight={onGoInsights} />
        <View style={{ flexDirection: 'row', gap: 11 }}>
          <View style={[styles.stat, { flex: 1 }]}>
            <IconBubble name="trending-up-outline" />
            <Txt style={{ fontSize: 26, fontWeight: '900', marginTop: 12 }}>94.2%</Txt>
            <Txt muted style={{ fontSize: 11, marginTop: 4 }}>Example service rate</Txt>
          </View>
          <View style={[styles.stat, { flex: 1 }]}>
            <IconBubble name="leaf-outline" bg="#FDF1E2" />
            <Txt style={{ fontSize: 26, fontWeight: '900', marginTop: 12 }}>38</Txt>
            <Txt muted style={{ fontSize: 11, marginTop: 4 }}>Demo leftover portions</Txt>
          </View>
        </View>
      </View>
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

function Plan({
  counts,
  setCounts,
  approved,
  setApproved,
}: {
  counts: Record<string, number>;
  setCounts: (v: Record<string, number>) => void;
  approved: boolean;
  setApproved: (v: boolean) => void;
}) {
  const total = calculateTotalPortions(counts as MealPortionCounts);
  const update = (key: string, delta: number) => {
    setCounts({
      ...counts,
      [key]: adjustPortionQuantity(counts[key] || 0, delta),
    });
    setApproved(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
      <Header subtitle="KITCHEN OPERATIONS" name="Plan your meals" />
      <View style={{ backgroundColor: C.sage, borderRadius: 20, padding: 19, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 27 }}>
        <IconBubble name="sparkles-outline" bg={C.lime} />
        <View style={{ flex: 1 }}>
          <Txt style={{ fontSize: 14, fontWeight: '800' }}>Your kitchen. Your call.</Txt>
          <Txt muted style={{ fontSize: 12, lineHeight: 18, marginTop: 4 }}>
            Adjust the suggested quantities before confirming tomorrow's prep.
          </Txt>
        </View>
      </View>

      <SectionTitle eyebrow="SATURDAY · 17 OCT" title="Preparation quantities" />
      {MEALS.map((m) => (
        <View key={m.key} style={{ backgroundColor: 'white', borderWidth: 1, borderColor: C.line, borderRadius: 23, marginBottom: 13, padding: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <IconBubble name={m.icon} bg={m.color} />
              <View>
                <Txt style={{ fontWeight: '800', fontSize: 17 }}>{m.name}</Txt>
                <Txt muted style={{ fontSize: 11, marginTop: 4 }}>{m.period}</Txt>
              </View>
            </View>
            <Pill label="SUGGESTED" />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 23 }}>
            <View>
              <Txt muted style={{ fontSize: 11 }}>Prepare</Txt>
              <Txt style={{ fontSize: 36, fontWeight: '900', letterSpacing: -1.6 }}>
                {fmt(counts[m.key])}
                <Text style={{ fontSize: 13, color: C.secondary, fontWeight: '500' }}> servings</Text>
              </Txt>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13 }}>
              <Pressable accessibilityLabel={`Decrease ${m.name}`} onPress={() => update(m.key, -5)} style={styles.adjust}>
                <Glyph name="remove" size={20} />
              </Pressable>
              <Pressable accessibilityLabel={`Increase ${m.name}`} onPress={() => update(m.key, 5)} style={[styles.adjust, { backgroundColor: C.green }]}>
                <Glyph name="add" size={20} color="white" />
              </Pressable>
            </View>
          </View>
          <Txt muted style={{ fontSize: 11, marginTop: 15 }}>
            Initial illustrative estimate: {m.base} servings · Adjust in steps of 5
          </Txt>
        </View>
      ))}

      <View style={{ backgroundColor: C.green, borderRadius: 22, padding: 21, marginTop: 10 }}>
        <Txt style={{ color: '#BFD9C5', fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>TOTAL PLANNED PREPARATION</Txt>
        <Txt style={{ color: 'white', fontSize: 40, fontWeight: '900', marginTop: 7 }}>
          {fmt(total)} <Text style={{ fontSize: 16, fontWeight: '500' }}>servings</Text>
        </Txt>
        <View style={{ marginTop: 18 }}>
          <Button
            kind="lime"
            icon={approved ? 'checkmark-circle' : 'checkmark'}
            label={approved ? 'Plan approved' : 'Approve preparation plan'}
            onPress={() => {
              setApproved(true);
              Alert.alert('Plan approved', 'Your meal quantities are saved locally on this device for the demo.');
            }}
          />
        </View>
      </View>
      <Txt muted style={{ fontSize: 11, lineHeight: 18, marginTop: 13, textAlign: 'center' }}>
        Demo values only. No forecasting model or live kitchen data is connected.
      </Txt>
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

function Insights({ counts }: { counts: Record<string, number> }) {
  const vals = [510, 588, 535, 621, 571, 624, 661];
  const today = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
      <Header subtitle="PERFORMANCE REVIEW" name="Kitchen insights" />
      <Pill label="ILLUSTRATIVE DATA · DEMO" />
      <Txt style={{ fontSize: 32, fontWeight: '900', letterSpacing: -1.2, marginTop: 20, lineHeight: 37 }}>
        Clarity in every{'\n'}decision.
      </Txt>
      <Txt muted style={{ fontSize: 13, lineHeight: 21, marginTop: 10, marginBottom: 26 }}>
        See how preparation decisions could be reviewed over time. These charts use example data.
      </Txt>
      <View style={styles.stat}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Txt style={{ fontSize: 15, fontWeight: '800' }}>Servings planned this week</Txt>
          <IconBubble name="bar-chart-outline" />
        </View>
        <Txt style={{ fontSize: 36, fontWeight: '900', marginTop: 12 }}>4,110</Txt>
        <Txt muted style={{ fontSize: 11, marginTop: 3 }}>Illustrative 7-day totals</Txt>
        <View style={{ marginTop: 22 }}>
          <Bars values={vals} highlight={6} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 9 }}>
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((t, i) => (
              <Txt key={i} muted style={{ fontSize: 10, flex: 1, textAlign: 'center' }}>{t}</Txt>
            ))}
          </View>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 11, marginTop: 13 }}>
        <View style={[styles.stat, { flex: 1 }]}>
          <IconBubble name="analytics-outline" />
          <Txt style={{ fontSize: 27, fontWeight: '900', marginTop: 16 }}>{fmt(today)}</Txt>
          <Txt muted style={{ fontSize: 11, marginTop: 5 }}>Next-day plan</Txt>
        </View>
        <View style={[styles.stat, { flex: 1 }]}>
          <IconBubble name="leaf-outline" bg="#FFF1E2" />
          <Txt style={{ fontSize: 27, fontWeight: '900', marginTop: 16 }}>38</Txt>
          <Txt muted style={{ fontSize: 11, marginTop: 5 }}>Example leftovers</Txt>
        </View>
      </View>

      <View style={{ marginTop: 28 }}>
        <SectionTitle eyebrow="THE PROCESS" title="How decisions improve" />
        {[
          ['1', 'Forecast', 'Estimate demand from attendance and meal history.'],
          ['2', 'Prepare', 'Approve quantities with a sensible buffer.'],
          ['3', 'Measure', 'Log meals served and leftovers after service.'],
        ].map((a) => (
          <View key={a[0]} style={{ flexDirection: 'row', gap: 15, paddingVertical: 14, borderBottomWidth: 1, borderColor: C.line }}>
            <View style={{ backgroundColor: C.lime, borderRadius: 13, width: 35, height: 35, alignItems: 'center', justifyContent: 'center' }}>
              <Txt style={{ fontWeight: '900', color: C.green }}>{a[0]}</Txt>
            </View>
            <View style={{ flex: 1 }}>
              <Txt style={{ fontSize: 15, fontWeight: '800' }}>{a[1]}</Txt>
              <Txt muted style={{ fontSize: 12, lineHeight: 19, marginTop: 4 }}>{a[2]}</Txt>
            </View>
          </View>
        ))}
      </View>
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

function Settings({
  org,
  setOrg,
  notifications,
  setNotifications,
  reset,
  onReplayIntro,
}: {
  org: string;
  setOrg: (v: string) => void;
  notifications: boolean;
  setNotifications: (v: boolean) => void;
  reset: () => void;
  onReplayIntro: () => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
      <Header subtitle="YOUR WORKSPACE" name="Settings" />
      <View style={[styles.stat, { marginBottom: 20 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13 }}>
          <IconBubble name="business-outline" />
          <View style={{ flex: 1 }}>
            <Txt muted style={{ fontSize: 10, letterSpacing: 1 }}>DEMO ORGANIZATION</Txt>
            <Txt style={{ fontSize: 17, fontWeight: '800', marginTop: 3 }}>{org || 'Your kitchen'}</Txt>
          </View>
        </View>
      </View>

      <SectionTitle eyebrow="PREFERENCES" title="Make it yours" />
      <Txt muted style={{ fontSize: 12, marginBottom: 8 }}>Kitchen name</Txt>
      <TextInput
        style={{
          backgroundColor: 'white',
          borderWidth: 1,
          borderColor: C.line,
          borderRadius: 15,
          padding: 16,
          color: C.ink,
          fontSize: 15,
          marginBottom: 18,
        }}
        maxLength={45}
        placeholder="Your kitchen name"
        value={org}
        onChangeText={setOrg}
      />

      <View style={[styles.stat, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Txt style={{ fontWeight: '800', fontSize: 14 }}>Demo notifications</Txt>
          <Txt muted style={{ fontSize: 11, marginTop: 5 }}>Save your preference locally</Txt>
        </View>
        <Switch
          value={notifications}
          onValueChange={setNotifications}
          trackColor={{ true: C.green, false: '#D4DDD0' }}
          thumbColor={'white'}
        />
      </View>

      <View style={{ marginTop: 27 }}>
        <SectionTitle eyebrow="ABOUT THIS DEMO" title="Made to explore" />
        <Txt muted style={{ lineHeight: 21, fontSize: 13, marginBottom: 19 }}>
          MealRelay Mini demonstrates the product interface and planning workflow. It does not include production authentication, real prediction models, or a connected database.
        </Txt>
        <Button kind="dark" label="Replay cinematic intro" onPress={onReplayIntro} icon="play-circle-outline" />
        <View style={{ height: 10 }} />
        <Button
          kind="outline"
          label="Reset local demo data"
          onPress={() =>
            Alert.alert('Reset the demo?', 'This restores default meal quantities and settings.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Reset', style: 'destructive', onPress: reset },
            ])
          }
          icon="refresh-outline"
        />
      </View>
      <Txt muted style={{ textAlign: 'center', fontSize: 11, marginTop: 35 }}>
        MealRelay Mini · Made with React Native & Expo
      </Txt>
    </ScrollView>
  );
}

function Bottom({ current, onChange }: { current: Tab; onChange: (t: Tab) => void }) {
  const tabs: { label: Tab; icon: any; active: any }[] = [
    { label: 'Home', icon: 'home-outline', active: 'home' },
    { label: 'Plan', icon: 'calendar-outline', active: 'calendar' },
    { label: 'Insights', icon: 'stats-chart-outline', active: 'stats-chart' },
    { label: 'Settings', icon: 'options-outline', active: 'options' },
  ];

  return (
    <View
      style={{
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderColor: C.line,
        flexDirection: 'row',
        paddingTop: 12,
        paddingBottom: Platform.OS === 'android' ? 18 : 10,
        paddingHorizontal: 10,
      }}
    >
      {tabs.map((t) => (
        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: current === t.label }}
          key={t.label}
          onPress={() => onChange(t.label)}
          style={{ flex: 1, alignItems: 'center', gap: 5 }}
        >
          <View
            style={{
              width: 48,
              height: 34,
              borderRadius: 13,
              backgroundColor: current === t.label ? C.sage : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Glyph name={current === t.label ? t.active : t.icon} size={20} color={current === t.label ? C.green : C.secondary} />
          </View>
          <Txt
            style={{
              fontSize: 10,
              fontWeight: current === t.label ? '800' : '500',
              color: current === t.label ? C.green : C.secondary,
            }}
          >
            {t.label}
          </Txt>
        </Pressable>
      ))}
    </View>
  );
}

const STORAGE_KEY = 'mealrelay-mini-v1';
const INTRO_SEEN_KEY = '@mealrelay_cinematic_intro_seen_v2';
const INITIAL: MealPortionCounts = INITIAL_PORTIONS;

export default function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [ready, setReady] = useState(false);
  const [page, setPage] = useState<'welcome' | 'demo' | 'app'>('welcome');
  const [tab, setTab] = useState<Tab>('Home');
  const [counts, setCounts] = useState<Record<string, number>>(INITIAL);
  const [approved, setApproved] = useState(false);
  const [org, setOrg] = useState('Sreenidhi Campus Kitchen');
  const [notifications, setNotifications] = useState(true);

  // Load persistent states
  useEffect(() => {
    (async () => {
      try {
        const [savedData, introSeen] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem(INTRO_SEEN_KEY),
        ]);

        if (savedData) {
          const saved = JSON.parse(savedData);
          if (saved.counts && typeof saved.counts === 'object') setCounts({ ...INITIAL, ...saved.counts });
          if (typeof saved.approved === 'boolean') setApproved(saved.approved);
          if (typeof saved.org === 'string') setOrg(saved.org);
          if (typeof saved.notifications === 'boolean') setNotifications(saved.notifications);
        }

        // Only auto-play intro for fresh sessions
        if (introSeen === 'true') {
          setShowIntro(false);
        } else {
          setShowIntro(true);
        }
      } catch (e) {
        console.warn('Storage read failed', e);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  // Sync state changes to storage
  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ counts, approved, org, notifications })).catch((e) =>
      console.warn('Storage save failed', e)
    );
  }, [ready, counts, approved, org, notifications]);

  const handleIntroDone = () => {
    setShowIntro(false);
    AsyncStorage.setItem(INTRO_SEEN_KEY, 'true').catch(() => {});
  };

  const handleReplayIntro = () => {
    setShowIntro(true);
  };

  const reset = () => {
    setCounts(INITIAL);
    setApproved(false);
    setOrg('Sreenidhi Campus Kitchen');
    setNotifications(true);
  };

  const launch = () => {
    setPage('app');
    setTab('Home');
  };

  if (!ready) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={C.green} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
        <StatusBar barStyle={showIntro ? "light-content" : "dark-content"} backgroundColor={showIntro ? "#050505" : C.bg} />
        {page === 'welcome' ? (
          <Welcome onStart={launch} onDemo={() => setPage('demo')} onReplayIntro={handleReplayIntro} />
        ) : page === 'demo' ? (
          <Demo onClose={() => setPage('welcome')} onStart={launch} />
        ) : (
          <>
            <View style={{ flex: 1 }}>
              {tab === 'Home' ? (
                <Home counts={counts} approved={approved} onGoPlan={() => setTab('Plan')} onGoInsights={() => setTab('Insights')} />
              ) : tab === 'Plan' ? (
                <Plan counts={counts} setCounts={setCounts} approved={approved} setApproved={setApproved} />
              ) : tab === 'Insights' ? (
                <Insights counts={counts} />
              ) : (
                <Settings
                  org={org}
                  setOrg={setOrg}
                  notifications={notifications}
                  setNotifications={setNotifications}
                  reset={reset}
                  onReplayIntro={handleReplayIntro}
                />
              )}
            </View>
            <Bottom current={tab} onChange={setTab} />
          </>
        )}
      </SafeAreaView>
      {showIntro && <Intro onDone={handleIntroDone} />}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { padding: 23, paddingBottom: 28 },
  hero: { borderRadius: 26, padding: 21, overflow: 'hidden' },
  stat: { backgroundColor: 'white', borderRadius: 21, padding: 19, borderWidth: 1, borderColor: C.line },
  adjust: { width: 42, height: 42, borderRadius: 14, borderWidth: 1, borderColor: C.line, backgroundColor: C.light, alignItems: 'center', justifyContent: 'center' },
});

const landingStyles = StyleSheet.create({
  heroContainer: {
    paddingHorizontal: 24,
    paddingBottom: 34,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    minHeight: 520,
    overflow: 'hidden',
  },
  replayPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  replayPillText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  headline: {
    fontSize: Math.min(SW * 0.118, 48),
    color: 'white',
    fontWeight: '900',
    letterSpacing: -2.4,
    lineHeight: 52,
    marginTop: 20,
  },
  subcopy: {
    color: '#C9DCCF',
    fontSize: 15,
    lineHeight: 24,
    marginTop: 18,
    maxWidth: 310,
  },
  secondaryButton: {
    padding: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 15,
  },
  bgRing1: {
    position: 'absolute',
    right: -70,
    top: 50,
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1,
    borderColor: '#49725C',
    opacity: 0.35,
  },
  bgRing2: {
    position: 'absolute',
    right: -36,
    top: 80,
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: '#7EAB8A',
    opacity: 0.22,
  },
  previewCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: C.line,
    marginTop: -22,
    shadowColor: '#07241A',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 4,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1EAA58',
  },
  previewEyebrow: {
    color: '#557262',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.6,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: C.ink,
    marginTop: 3,
    letterSpacing: -0.4,
  },
  bufferBadge: {
    backgroundColor: '#EDF5EB',
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 8,
  },
  bufferBadgeText: {
    color: C.green,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  serviceTabsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 14,
    backgroundColor: C.light,
    padding: 3,
    borderRadius: 12,
  },
  serviceTab: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 9,
  },
  serviceTabActive: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 1,
  },
  serviceTabText: {
    fontSize: 10,
    fontWeight: '800',
    color: C.secondary,
    letterSpacing: 0.8,
  },
  serviceTabTextActive: {
    color: C.green,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: '#EFF3EB',
  },
  metricNumber: {
    fontSize: 26,
    fontWeight: '900',
    color: C.ink,
    letterSpacing: -1,
  },
  metricLabel: {
    fontSize: 11,
    color: C.secondary,
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 34,
    backgroundColor: '#E5EBE1',
  },
  barLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: C.ink,
  },
  barValue: {
    fontSize: 11,
    fontWeight: '600',
    color: C.secondary,
  },
  barTrack: {
    height: 6,
    backgroundColor: '#EDF2E7',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  workflowCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: C.line,
  },
});
