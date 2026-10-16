'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Coffee,
  HelpCircle,
  Leaf,
  Minus,
  Moon,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Sun,
  ThumbsUp,
  TrendingDown,
  Utensils,
} from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';

type MealShiftKey = 'breakfast' | 'lunch' | 'dinner';

interface DishItem {
  id: string;
  name: string;
  category: string;
  expectedEaters: number;
  manualOffset: number;
  unit: string;
  smartModel: string;
  reasons: string[];
}

interface ShiftInfo {
  key: MealShiftKey;
  name: string;
  timeWindow: string;
  expectedStudents: number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const SHIFTS: ShiftInfo[] = [
  {
    key: 'breakfast',
    name: 'Breakfast',
    timeWindow: '7:30 AM – 9:30 AM',
    expectedStudents: 135,
    icon: Coffee,
  },
  {
    key: 'lunch',
    name: 'Lunch',
    timeWindow: '12:30 PM – 2:30 PM',
    expectedStudents: 185,
    icon: Sun,
  },
  {
    key: 'dinner',
    name: 'Dinner',
    timeWindow: '7:30 PM – 9:45 PM',
    expectedStudents: 170,
    icon: Moon,
  },
];

const BUFFER_OPTIONS = [
  { value: 0.05, label: '+5% Light', desc: 'Tightest estimate' },
  { value: 0.08, label: '+8% Balanced', desc: 'Recommended for Sunday' },
  { value: 0.1, label: '+10% Safe', desc: 'Higher safety margin' },
  { value: 0.15, label: '+15% Extra Safe', desc: 'For heavy rain or events' },
];

const INITIAL_DISH_DATA: Record<MealShiftKey, DishItem[]> = {
  breakfast: [
    {
      id: 'd_idli',
      name: 'Idli & Sambar',
      category: 'Steamed Main',
      expectedEaters: 110,
      manualOffset: 0,
      unit: 'plates',
      smartModel: 'Smart AI Forecast',
      reasons: [
        '135 students expected for breakfast tomorrow morning',
        'Sunday mornings typically see ~18% lower turnout as students wake up later',
        'Extra cushion added to handle student second-helpings safely',
      ],
    },
    {
      id: 'd_poha',
      name: 'Indori Poha',
      category: 'Light Main',
      expectedEaters: 95,
      manualOffset: 0,
      unit: 'plates',
      smartModel: 'Smart AI Forecast',
      reasons: [
        'Popular weekend breakfast item paired with tea',
        'Turnout steady across the last 4 Sunday mornings',
        'Quick to replenish if attendance surges unexpectedly',
      ],
    },
    {
      id: 'd_dosa',
      name: 'Masala Dosa',
      category: 'Griddle Special',
      expectedEaters: 125,
      manualOffset: 0,
      unit: 'servings',
      smartModel: 'Smart AI Forecast',
      reasons: [
        'Highest demand breakfast dish on campus weekends',
        '88% of attending students choose dosa when available',
        'Cushion helps avoid kitchen staff scrambling at peak 8:45 AM rush',
      ],
    },
    {
      id: 'd_tea',
      name: 'Masala Chai & Filter Coffee',
      category: 'Beverage',
      expectedEaters: 130,
      manualOffset: 0,
      unit: 'cups',
      smartModel: 'Based on Past Averages',
      reasons: [
        'Nearly every student having breakfast takes a hot beverage',
        'Consistent 0.95 cups per attending student benchmark',
      ],
    },
  ],
  lunch: [
    {
      id: 'd_paneer_lunch',
      name: 'Paneer Butter Masala',
      category: 'Main Curry',
      expectedEaters: 154,
      manualOffset: 0,
      unit: 'plates',
      smartModel: 'Smart AI Forecast',
      reasons: [
        '185 students expected for Sunday lunch',
        'High favorite: 83% of dining hall students choose paneer curry on weekends',
        'Safety cushion prevents running out before the late shift at 2:00 PM',
      ],
    },
    {
      id: 'd_dal_tadka',
      name: 'Yellow Dal Tadka',
      category: 'Dal & Lentils',
      expectedEaters: 162,
      manualOffset: 0,
      unit: 'bowls',
      smartModel: 'Smart AI Forecast',
      reasons: [
        'Essential staple consumed alongside rice and rotis',
        'Stable daily consumption pattern with minimal leftover variance',
      ],
    },
    {
      id: 'd_rice_lunch',
      name: 'Steamed Basmati Rice',
      category: 'Rice Staple',
      expectedEaters: 175,
      manualOffset: 0,
      unit: 'portions',
      smartModel: 'Smart AI Forecast',
      reasons: [
        'High volume lunch staple across all hostel wings',
        'Slightly higher intake on weekends during leisurely dining hours',
      ],
    },
    {
      id: 'd_roti_lunch',
      name: 'Phulka Roti',
      category: 'Fresh Breads',
      expectedEaters: 390,
      manualOffset: 0,
      unit: 'pieces',
      smartModel: 'Smart AI Forecast',
      reasons: [
        'Average of 2.2 rotis per attending student for lunch',
        'Freshly made on tawa; easy to pace during the service window',
      ],
    },
    {
      id: 'd_curd',
      name: 'Fresh Sweet Curd',
      category: 'Cooling Side',
      expectedEaters: 140,
      manualOffset: 0,
      unit: 'bowls',
      smartModel: 'Based on Past Averages',
      reasons: [
        'Popular soothing side during warm afternoon meal times',
        'Pre-portioned in small bowls to reduce avoidable waste',
      ],
    },
  ],
  dinner: [
    {
      id: 'd_chicken_dinner',
      name: 'Chicken Curry / Soya Chaap',
      category: 'Main Curry',
      expectedEaters: 158,
      manualOffset: 0,
      unit: 'plates',
      smartModel: 'Smart AI Forecast',
      reasons: [
        '170 students expected for Sunday dinner',
        'Peak attendance dish: Sunday dinner has the lowest absentee rate',
        'Safety cushion strictly recommended to avoid student disappointment',
      ],
    },
    {
      id: 'd_rajma',
      name: 'Punjabi Rajma Masala',
      category: 'Comfort Curry',
      expectedEaters: 145,
      manualOffset: 0,
      unit: 'bowls',
      smartModel: 'Smart AI Forecast',
      reasons: [
        'Strong pairing with jeera rice for vegetarian diners',
        'Consistent 85% pick rate on Sunday dinner rotations',
      ],
    },
    {
      id: 'd_jeera_rice',
      name: 'Aromatic Jeera Rice',
      category: 'Rice Staple',
      expectedEaters: 160,
      manualOffset: 0,
      unit: 'portions',
      smartModel: 'Smart AI Forecast',
      reasons: [
        'Standard weekend dinner staple',
        'Well calibrated portions to reduce end-of-night pot leftovers',
      ],
    },
    {
      id: 'd_roti_dinner',
      name: 'Butter Roti',
      category: 'Fresh Breads',
      expectedEaters: 380,
      manualOffset: 0,
      unit: 'pieces',
      smartModel: 'Smart AI Forecast',
      reasons: [
        'Average 2.3 rotis per student during evening meal',
        'Safety buffer adds 31 rotis to cover late library arrivals',
      ],
    },
    {
      id: 'd_gulab_jamun',
      name: 'Warm Gulab Jamun',
      category: 'Weekend Sweet',
      expectedEaters: 170,
      manualOffset: 0,
      unit: 'pieces',
      smartModel: 'Smart AI Forecast',
      reasons: [
        'Sunday evening treat — 100% attendance rate for dessert',
        'Prepared strictly 1 per attending student plus kitchen cushion',
      ],
    },
  ],
};

export default function DashboardPage() {
  const [activeShift, setActiveShift] = useState<MealShiftKey>('lunch');
  const [safetyBuffer, setSafetyBuffer] = useState<number>(0.08);
  const [dishData, setDishData] = useState<Record<MealShiftKey, DishItem[]>>(INITIAL_DISH_DATA);
  const [isApproved, setIsApproved] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [openReasons, setOpenReasons] = useState<Record<string, boolean>>({});

  // Calculate recommended cooking quantity based on safety buffer and manual chef adjustments
  const calculateDishPrep = (item: DishItem, bufferPct: number): number => {
    const rawWithBuffer = Math.ceil(item.expectedEaters * (1 + bufferPct));
    const finalAmount = rawWithBuffer + item.manualOffset;
    return Math.max(0, finalAmount);
  };

  // Compute total cooking portions across all 3 meal shifts
  const overallDayTotal = useMemo(() => {
    let sum = 0;
    (Object.keys(dishData) as MealShiftKey[]).forEach((shiftKey) => {
      dishData[shiftKey].forEach((dish) => {
        sum += calculateDishPrep(dish, safetyBuffer);
      });
    });
    return sum;
  }, [dishData, safetyBuffer]);

  // Compute total cooking portions for currently selected shift
  const currentShiftTotal = useMemo(() => {
    return dishData[activeShift].reduce((sum, dish) => {
      return sum + calculateDishPrep(dish, safetyBuffer);
    }, 0);
  }, [dishData, activeShift, safetyBuffer]);

  // Adjust portion quantity up or down for a specific dish
  const handleAdjustPortion = (dishId: string, delta: number) => {
    setDishData((prev) => {
      const currentList = prev[activeShift];
      const updatedList = currentList.map((dish) => {
        if (dish.id !== dishId) {
          return dish;
        }
        const currentRecommended = calculateDishPrep(dish, safetyBuffer);
        if (currentRecommended + delta < 0) {
          return dish;
        }
        return {
          ...dish,
          manualOffset: dish.manualOffset + delta,
        };
      });
      return {
        ...prev,
        [activeShift]: updatedList,
      };
    });
    // Any adjustment requires re-confirmation
    setIsApproved(false);
  };

  // Reset shift dishes back to default AI recommendations
  const handleResetShift = () => {
    setDishData((prev) => ({
      ...prev,
      [activeShift]: INITIAL_DISH_DATA[activeShift].map((d) => ({
        ...d,
        manualOffset: 0,
      })),
    }));
    setIsApproved(false);
    showToast('Reset to original smart recommendations.');
  };

  // Toggle explainability accordion
  const toggleReason = (dishId: string) => {
    setOpenReasons((prev) => ({
      ...prev,
      [dishId]: !prev[dishId],
    }));
  };

  // Approve and lock tomorrow's plan
  const handleApprovePlan = () => {
    setIsApproved(true);
    showToast('Tomorrow’s kitchen plan is approved and locked! Kitchen staff notified.');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const currentShiftInfo = SHIFTS.find((s) => s.key === activeShift)!;

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Preserved Unmodified Sidebar */}
        <Sidebar />

        <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-8">
          <Header
            title="Tomorrow's Kitchen Cooking Plan"
            subtitle="Sunday, 18 October 2026 · Sreenidhi Central Mess"
            action={
              <button
                onClick={handleResetShift}
                type="button"
                className="px-4 py-2.5 rounded-xl border border-line-light bg-white hover:bg-canvas text-ink text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
              >
                <RefreshCw size={13} />
                <span>Reset Shift Recommendations</span>
              </button>
            }
          />

          {/* Toast Notification */}
          {toastMessage && (
            <div className="p-4 rounded-2xl bg-forest text-lime border border-lime/30 text-sm font-bold flex items-center justify-between shadow-md transition-all">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 size={18} className="text-lime shrink-0" />
                <span className="text-white">{toastMessage}</span>
              </div>
              <button
                onClick={() => setToastMessage(null)}
                className="text-xs text-lime underline hover:text-lime-soft font-bold"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* 1. HIGH ATTENTION HERO BANNER (Forest Green + Electric Lime) */}
          <div className="rounded-3xl bg-forest p-6 sm:p-10 text-white shadow-xl relative overflow-hidden border border-line-dark">
            <div className="absolute -right-16 -top-16 w-80 h-80 bg-lime/10 rounded-full blur-3xl pointer-events-none" />

            {/* Top row: Status Badge & Date */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
              <div>
                <span className="text-[11px] font-black uppercase tracking-widest text-lime">
                  SUNDAY PREPARATION SUMMARY
                </span>
                <p className="text-sm text-white/70 mt-0.5">
                  Expected Mess Turnout: ~185 students · 3 Shifts Scheduled
                </p>
              </div>

              {/* Status Pill */}
              <div className="flex items-center">
                <span
                  className={`px-3.5 py-1.5 rounded-full text-xs font-black tracking-wide flex items-center gap-2 ${
                    isApproved
                      ? 'bg-lime text-forest-dark border border-lime'
                      : 'bg-white/10 text-lime border border-lime/30'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isApproved ? 'bg-forest-dark' : 'bg-lime animate-pulse'
                    }`}
                  />
                  <span>{isApproved ? 'PLAN CONFIRMED FOR COOKING ✓' : 'AWAITING YOUR CONFIRMATION'}</span>
                </span>
              </div>
            </div>

            {/* Middle row: Big numbers & Action Button */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end pt-8">
              <div className="lg:col-span-7">
                <p className="text-xs font-bold text-white/60 uppercase tracking-wider">
                  Total Recommended Food To Prepare
                </p>
                <div className="flex items-baseline gap-3 mt-1">
                  <span className="text-5xl sm:text-6xl font-black tracking-tight text-white">
                    {overallDayTotal.toLocaleString()}
                  </span>
                  <span className="text-lime text-xl font-bold">total portions & items</span>
                </div>
                <p className="text-sm text-white/80 mt-2 max-w-xl leading-relaxed">
                  Calculated using smart student attendance patterns and your{' '}
                  <span className="text-lime font-bold">+{Math.round(safetyBuffer * 100)}% extra safety cushion</span>,
                  so the kitchen never runs short of food.
                </p>
              </div>

              {/* Confirm Action Button */}
              <div className="lg:col-span-5 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleApprovePlan}
                  type="button"
                  className={`w-full py-4 px-6 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 ${
                    isApproved
                      ? 'bg-white/10 text-white border border-white/20 hover:bg-white/15'
                      : 'bg-lime text-forest-dark hover:bg-lime-soft shadow-lime/20'
                  }`}
                >
                  <CheckCircle2 size={18} />
                  <span>{isApproved ? 'Plan Confirmed (Click to Re-confirm)' : 'Confirm Tomorrow’s Cooking Plan'}</span>
                </button>
              </div>
            </div>

            {/* Bottom 3 Quick Highlights */}
            <div className="grid grid-cols-3 gap-4 pt-8 mt-8 border-t border-white/10 text-center sm:text-left">
              <div>
                <p className="text-xs text-white/50 font-bold uppercase tracking-wider">TOTAL SHIFTS</p>
                <p className="text-lg sm:text-2xl font-black text-white mt-1">3 Meal Shifts</p>
              </div>
              <div>
                <p className="text-xs text-white/50 font-bold uppercase tracking-wider">SAFETY CUSHION</p>
                <p className="text-lg sm:text-2xl font-black text-lime mt-1">
                  +{Math.round(safetyBuffer * 100)}% Extra Food
                </p>
              </div>
              <div>
                <p className="text-xs text-white/50 font-bold uppercase tracking-wider">SHORTAGE RISK</p>
                <p className="text-lg sm:text-2xl font-black text-white mt-1">Zero / Protected</p>
              </div>
            </div>
          </div>

          {/* 2. MEAL SHIFT SWITCHER (Breakfast, Lunch, Dinner) */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <p className="text-xs font-black text-forest uppercase tracking-widest">SELECT MEAL SERVICE</p>
                <h2 className="text-2xl font-black text-ink">Choose Meal Shift to View & Adjust</h2>
              </div>
              <p className="text-xs text-ink-secondary">
                Currently showing: <span className="font-bold text-ink">{currentShiftInfo.name}</span> ({currentShiftInfo.timeWindow})
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {SHIFTS.map((shift) => {
                const Icon = shift.icon;
                const isSelected = activeShift === shift.key;
                const shiftItems = dishData[shift.key];
                const shiftSum = shiftItems.reduce((acc, d) => acc + calculateDishPrep(d, safetyBuffer), 0);

                return (
                  <button
                    key={shift.key}
                    onClick={() => setActiveShift(shift.key)}
                    type="button"
                    className={`p-5 rounded-2xl border text-left transition-all flex items-center justify-between group ${
                      isSelected
                        ? 'bg-forest text-white border-forest shadow-md'
                        : 'bg-white text-ink border-line-light hover:border-forest/30 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${
                          isSelected ? 'bg-lime text-forest-dark' : 'bg-canvas text-forest group-hover:bg-sage'
                        }`}
                      >
                        <Icon size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-base">{shift.name}</h3>
                          {isSelected && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-lime/20 text-lime border border-lime/30">
                              Active
                            </span>
                          )}
                        </div>
                        <p className={`text-xs mt-0.5 ${isSelected ? 'text-white/70' : 'text-ink-secondary'}`}>
                          {shift.timeWindow}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`text-[10px] uppercase font-bold tracking-wider block ${isSelected ? 'text-white/60' : 'text-ink-secondary'}`}>
                        PREP
                      </span>
                      <span className={`text-xl font-black ${isSelected ? 'text-lime' : 'text-forest'}`}>
                        {shiftSum}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. SAFETY CUSHION CONTROL BAR (Visual & Easy to Understand) */}
          <div className="p-6 rounded-3xl bg-white border border-line-light shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-sage text-forest flex items-center justify-center shrink-0">
                <ShieldCheck size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-ink">Kitchen Safety Cushion</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-lime/30 text-forest border border-lime/40">
                    Prevents Food Shortage
                  </span>
                </div>
                <p className="text-xs text-ink-secondary mt-0.5">
                  How much extra food should we prepare so students never run out?
                </p>
              </div>
            </div>

            {/* Quick buffer toggle pills */}
            <div className="flex flex-wrap items-center gap-2">
              {BUFFER_OPTIONS.map((opt) => {
                const isActive = safetyBuffer === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setSafetyBuffer(opt.value);
                      setIsApproved(false);
                    }}
                    type="button"
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center ${
                      isActive
                        ? 'bg-forest text-lime shadow-sm'
                        : 'bg-canvas text-ink hover:bg-line-light border border-line-light'
                    }`}
                  >
                    <span>{opt.label}</span>
                    <span className={`text-[10px] font-normal ${isActive ? 'text-white/70' : 'text-ink-secondary'}`}>
                      {opt.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. DISH-BY-DISH COOKING RECOMMENDATIONS (High Visual Impact) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-forest uppercase tracking-widest">
                  {currentShiftInfo.name.toUpperCase()} MENU ITEMS
                </p>
                <h2 className="text-xl font-black text-ink">
                  How Much to Cook for {currentShiftInfo.name}
                </h2>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-sage text-forest">
                {dishData[activeShift].length} Items on Menu
              </span>
            </div>

            {/* Dish Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {dishData[activeShift].map((dish) => {
                const prepTotal = calculateDishPrep(dish, safetyBuffer);
                const extraPortions = prepTotal - dish.expectedEaters;
                const isOpen = !!openReasons[dish.id];

                return (
                  <div
                    key={dish.id}
                    className="p-6 rounded-3xl bg-white border border-line-light shadow-sm hover:border-forest/30 transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Row: Category & Model Tag */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-canvas text-ink-secondary uppercase tracking-wider">
                          {dish.category}
                        </span>
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-sage text-forest flex items-center gap-1">
                          <Sparkles size={11} className="text-forest" />
                          <span>{dish.smartModel}</span>
                        </span>
                      </div>

                      {/* Dish Name */}
                      <h3 className="text-lg font-black text-ink">{dish.name}</h3>

                      {/* Big Visual Attention Box: How Much to Cook */}
                      <div className="mt-4 p-4 rounded-2xl bg-forest text-white border border-line-dark flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-lime">
                            RECOMMENDED TO COOK
                          </span>
                          <div className="flex items-baseline gap-1.5 mt-0.5">
                            <span className="text-3xl font-black text-white">{prepTotal}</span>
                            <span className="text-xs font-bold text-lime">{dish.unit}</span>
                          </div>
                        </div>

                        {/* In-line +/- Steppers for Mess Supervisor */}
                        <div className="flex items-center gap-1.5 bg-forest-dark/80 p-1 rounded-xl border border-white/10">
                          <button
                            onClick={() => handleAdjustPortion(dish.id, -5)}
                            type="button"
                            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 active:scale-90 text-white flex items-center justify-center transition-all"
                            title="Cook 5 fewer"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="text-[11px] font-black text-white px-1">
                            {dish.manualOffset === 0 ? 'AI' : dish.manualOffset > 0 ? `+${dish.manualOffset}` : dish.manualOffset}
                          </span>
                          <button
                            onClick={() => handleAdjustPortion(dish.id, 5)}
                            type="button"
                            className="w-8 h-8 rounded-lg bg-lime hover:bg-lime-soft active:scale-90 text-forest-dark flex items-center justify-center transition-all"
                            title="Cook 5 more"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Simple Breakdown Bar */}
                      <div className="mt-3.5 space-y-1.5">
                        <div className="flex items-center justify-between text-xs text-ink-secondary">
                          <span>Expected eaters: <strong className="text-ink">{dish.expectedEaters}</strong></span>
                          <span>Extra cushion: <strong className="text-forest font-bold">+{extraPortions}</strong></span>
                        </div>
                        {/* Visual Proportion Bar */}
                        <div className="w-full h-2 rounded-full bg-canvas overflow-hidden flex">
                          <div
                            className="bg-forest h-full"
                            style={{
                              width: `${Math.min(100, (dish.expectedEaters / prepTotal) * 100)}%`,
                            }}
                          />
                          <div
                            className="bg-lime h-full"
                            style={{
                              width: `${Math.max(0, 100 - (dish.expectedEaters / prepTotal) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Explanations Accordion (Customer-Friendly "Why this number?") */}
                    <div className="mt-5 pt-4 border-t border-line-light">
                      <button
                        onClick={() => toggleReason(dish.id)}
                        type="button"
                        className="w-full flex items-center justify-between text-xs font-bold text-forest hover:text-forest-dark transition-colors"
                      >
                        <span className="flex items-center gap-1.5">
                          <HelpCircle size={13} />
                          <span>Why we suggest this quantity?</span>
                        </span>
                        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>

                      {isOpen && (
                        <div className="mt-3 p-3 rounded-xl bg-canvas space-y-1.5 text-xs text-ink-secondary animate-fadeIn">
                          {dish.reasons.map((r, i) => (
                            <p key={i} className="flex items-start gap-1.5">
                              <span className="text-forest font-black">✓</span>
                              <span>{r}</span>
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 5. CUSTOMER-FRIENDLY IMPACT METRICS (No ML Jargon) */}
          <div className="space-y-4 pt-4">
            <div>
              <p className="text-xs font-black text-forest uppercase tracking-widest">KITCHEN RESULTS</p>
              <h2 className="text-xl font-black text-ink">Impact on Food Waste & Costs</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-6 rounded-3xl bg-white border border-line-light shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-sage text-forest flex items-center justify-center mb-3">
                  <Leaf size={20} />
                </div>
                <span className="text-xs font-bold text-ink-secondary uppercase tracking-wider">
                  Food Saved Today
                </span>
                <p className="text-3xl font-black text-forest mt-1">~42.5 kg</p>
                <p className="text-xs text-ink-secondary mt-1">Edible food prevented from going to waste</p>
              </div>

              <div className="p-6 rounded-3xl bg-white border border-line-light shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-lime/20 text-forest flex items-center justify-center mb-3">
                  <TrendingDown size={20} />
                </div>
                <span className="text-xs font-bold text-ink-secondary uppercase tracking-wider">
                  Surplus Reduction
                </span>
                <p className="text-3xl font-black text-forest mt-1">~34% Less</p>
                <p className="text-xs text-ink-secondary mt-1">Compared to unmanaged traditional cooking</p>
              </div>

              <div className="p-6 rounded-3xl bg-white border border-line-light shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-canvas text-ink flex items-center justify-center mb-3">
                  <ThumbsUp size={20} />
                </div>
                <span className="text-xs font-bold text-ink-secondary uppercase tracking-wider">
                  Student Shortage Risk
                </span>
                <p className="text-3xl font-black text-ink mt-1">0% (Safe)</p>
                <p className="text-xs text-ink-secondary mt-1">Buffer ensures every student gets a meal</p>
              </div>

              <div className="p-6 rounded-3xl bg-white border border-line-light shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-sage text-forest flex items-center justify-center mb-3">
                  <CheckCircle2 size={20} />
                </div>
                <span className="text-xs font-bold text-ink-secondary uppercase tracking-wider">
                  Prediction Accuracy
                </span>
                <p className="text-3xl font-black text-forest mt-1">96.5%</p>
                <p className="text-xs text-ink-secondary mt-1">Tested across 60 days of real campus records</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
