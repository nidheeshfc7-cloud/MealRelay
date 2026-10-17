import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BarChart3,
  Leaf,
  MonitorSmartphone,
  Utensils,
} from "lucide-react";
import s from "@/app/landing.module.css";

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
        <div className={s.mockupWrapper}>
          <Image
            src="/MealRelay Dashboard Mockup.png"
            alt="MealRelay Dashboard Mockup on Laptop and Mobile"
            width={1448}
            height={1086}
            priority
            sizes="(max-width: 540px) 100vw, (max-width: 1100px) 60vw, 650px"
            className={s.mockupImage}
          />
        </div>
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
