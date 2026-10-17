import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Leaf,
  MonitorSmartphone,
  Utensils,
  Sun,
  Moon,
} from "lucide-react";
import { DEFAULT_MEALS, formatPortionNumber } from "@mealrelay/core";
import { LandingPreview } from "./LandingPreview";
import s from "@/app/landing.module.css";
import device from "./UnifiedPlatformSection.module.css";

const features = [
  {
    title: "Demand forecasting",
    description: "Review predicted portions and the factors behind your plan.",
    Icon: BarChart3,
  },
  {
    title: "Access across devices",
    description: "Use the web workspace on your desktop, tablet or phone.",
    Icon: MonitorSmartphone,
  },
  {
    title: "Meal preparation planning",
    description: "Adjust quantities and approve a plan for every service.",
    Icon: Utensils,
  },
  {
    title: "Waste & service analytics",
    description: "Compare preparation with actual service and leftovers.",
    Icon: Leaf,
  },
];

export function PlatformDevices() {
  const total = DEFAULT_MEALS.reduce((sum, meal) => sum + meal.base, 0);
  return (
    <div className={device.devices}>
      <div className={device.laptop}>
        <div className={device.camera} aria-hidden="true" />
        <div className={device.screen}>
          <LandingPreview compact />
        </div>
        <div className={device.base} aria-hidden="true" />
      </div>
      <div className={device.phone}>
        <div className={device.notch} aria-hidden="true" />
        <p>Tomorrow’s plan</p>
        <strong>{formatPortionNumber(total)}</strong>
        <small>Sample planned portions</small>
        <ul>
          {DEFAULT_MEALS.map((meal, index) => (
            <li key={meal.key}>
              {index === 2 ? (
                <Moon size={14} aria-hidden="true" />
              ) : (
                <Sun size={14} aria-hidden="true" />
              )}
              <span>{meal.name}</span>
              <b>{meal.base}</b>
            </li>
          ))}
        </ul>
        <Link href="/planner">
          Review meal plan <ArrowRight size={12} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

export function UnifiedPlatformSection() {
  return (
    <section
      id="architecture"
      className={s.platform}
      aria-labelledby="platform-title"
    >
      <div className={`${s.container} ${s.platformGrid}`}>
        <div className={s.platformCopy}>
          <p className={s.kicker}>A unified platform</p>
          <h2 id="platform-title">
            One engine. All your
            <br />
            <span>kitchen operations.</span>
          </h2>
          <p>
            A focused workspace for forecasting, meal planning and service
            analytics. Keep the whole kitchen working from one reviewed plan, on
            any screen.
          </p>
          <Link href="/dashboard" className={s.secondary}>
            Explore the Platform <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
        <PlatformDevices />
        <div className={s.features}>
          {features.map(({ title, description, Icon }) => (
            <article key={title} className={s.feature}>
              <div className={s.icon}>
                <Icon size={21} aria-hidden="true" />
              </div>
              <div>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
