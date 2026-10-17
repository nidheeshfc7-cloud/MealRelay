import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  CircleMinus,
  Leaf,
  LineChart,
  MonitorSmartphone,
  Play,
  Utensils,
} from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { CinematicIntro } from "@/components/CinematicIntro";
import { LandingPreview } from "@/components/LandingPreview";
import Footer from "@/components/footer";
import { DEFAULT_MEALS, formatPortionNumber } from "@mealrelay/core";
import s from "./landing.module.css";

const steps = [
  {
    number: "01",
    title: "Predict",
    description:
      "Review demand forecasts, attendance and your safety buffer before the first ingredient hits the pan.",
    Icon: BarChart3,
    href: "/forecasts",
    action: "Explore forecasts",
  },
  {
    number: "02",
    title: "Prepare",
    description:
      "Turn your reviewed forecast into clear breakfast, lunch and dinner quantities. You make the final call.",
    Icon: Utensils,
    href: "/planner",
    action: "Open meal planner",
  },
  {
    number: "03",
    title: "Improve",
    description:
      "Compare prepared and served portions. Understand the planning gap and bring that insight to the next service.",
    Icon: Leaf,
    href: "/analytics",
    action: "View analytics",
  },
];
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

export default function LandingPage() {
  const total = DEFAULT_MEALS.reduce((sum, meal) => sum + meal.base, 0);
  return (
    <div className={s.page}>
      <CinematicIntro />
      <a className={s.skip} href="#main-content">
        Skip to content
      </a>
      <header className={s.header}>
        <div className={`${s.container} ${s.nav}`}>
          <BrandLogo size="md" />
          <nav className={s.navLinks} aria-label="Main navigation">
            <a href="#workflow">How It Works</a>
            <a href="#radar">Forecasting Engine</a>
            <a href="#architecture">Cross-Platform Stack</a>
            <Link href="/analytics">Analytics</Link>
          </nav>
          <div className={s.navActions}>
            <Link href="/login">Log in</Link>
            <Link href="/dashboard" className={s.primary}>
              Explore Demo <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </header>
      <main id="main-content">
        <section className={s.hero} aria-labelledby="hero-title">
          <div className={`${s.container} ${s.heroGrid}`}>
            <div className={s.heroCopy}>
              <span className={s.pill}>
                Demand forecasting for institutional kitchens
              </span>
              <h1 id="hero-title">
                Every meal planned.
                <br />
                Less wasted.
              </h1>
              <p>
                Predict demand, simplify preparation and make every portion
                count. A connected workspace for kitchen teams to plan better
                meals with less guesswork.
              </p>
              <div className={s.actions}>
                <Link href="/dashboard" className={s.primary}>
                  Explore the Dashboard{" "}
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
                <Link href="/planner" className={s.secondary}>
                  See How It Works <Play size={14} aria-hidden="true" />
                </Link>
              </div>
              <div className={s.heroStats}>
                <div>
                  <strong>{formatPortionNumber(total)}</strong>
                  <span>Sample planned portions</span>
                </div>
                <div>
                  <strong>3</strong>
                  <span>Breakfast, lunch & dinner</span>
                </div>
                <div>
                  <strong>+4.8%</strong>
                  <span>Configurable safety buffer</span>
                </div>
              </div>
              <small className={s.sampleNote}>
                Preview uses illustrative data. Your team stays in control.
              </small>
            </div>
            <div id="radar" className={s.heroPreview}>
              <LandingPreview />
            </div>
          </div>
        </section>
        <section
          id="workflow"
          className={s.workflow}
          aria-labelledby="workflow-title"
        >
          <div className={`${s.container} ${s.workflowGrid}`}>
            <div className={s.sectionLead}>
              <p className={s.kicker}>How it works</p>
              <h2 id="workflow-title">
                One rhythm.
                <br />
                <span>Every service.</span>
              </h2>
              <p>
                From forecasts to trays, MealRelay connects the plan, the
                preparation and the outcome.
              </p>
            </div>
            {steps.map(({ number, title, description, Icon, href, action }) => (
              <article key={number} className={s.step}>
                <div className={s.stepHead}>
                  <div className={s.icon}>
                    <Icon size={25} aria-hidden="true" />
                  </div>
                  <span>{number}</span>
                </div>
                <h3>{title}</h3>
                <p>{description}</p>
                <Link href={href}>
                  {action}
                  <ArrowRight size={13} aria-hidden="true" />
                </Link>
              </article>
            ))}
          </div>
        </section>
        <section
          className={s.comparison}
          aria-label="From kitchen challenges to a clearer plan"
        >
          <div className={s.container}>
            <div className={s.comparisonGrid}>
              <article className={s.comparisonCard}>
                <div className={s.comparisonHeading}>
                  <div className={s.icon}>
                    <LineChart size={25} aria-hidden="true" />
                  </div>
                  <div>
                    <h2>The Problem</h2>
                    <p>
                      Unpredictable demand makes it difficult to prepare the
                      right quantities, control costs and see what needs to
                      change.
                    </p>
                  </div>
                </div>
                <ul>
                  {[
                    "Unpredictable demand",
                    "Excess food waste",
                    "Inefficient labor and higher costs",
                    "Limited visibility into performance",
                  ].map((label) => (
                    <li key={label}>
                      <CircleMinus size={19} aria-hidden="true" />
                      {label}
                    </li>
                  ))}
                </ul>
              </article>
              <article className={s.comparisonCard}>
                <div className={s.comparisonHeading}>
                  <div className={s.icon}>
                    <Leaf size={25} aria-hidden="true" />
                  </div>
                  <div>
                    <h2>The Solution</h2>
                    <p>
                      Bring forecasting, preparation and service insights
                      together, so your team can make a more informed plan.
                    </p>
                  </div>
                </div>
                <ul>
                  {[
                    "Demand forecasts you can review",
                    "Clear prep plans and portion quantities",
                    "Visibility into surplus and service gaps",
                    "A feedback loop for the next service",
                  ].map((label) => (
                    <li key={label}>
                      <CheckCircle2 size={19} aria-hidden="true" />
                      {label}
                    </li>
                  ))}
                </ul>
              </article>
            </div>
          </div>
        </section>
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
                analytics. Keep the whole kitchen working from one reviewed
                plan, on any screen.
              </p>
              <Link href="/dashboard" className={s.secondary}>
                Explore the Platform <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
            <div className={s.devices}>
              <div className={s.laptop}>
                <LandingPreview compact />
              </div>
              <div className={s.phone}>
                <span>Tomorrow’s plan</span>
                <strong>{total}</strong>
                <small>Sample planned portions</small>
                <ul>
                  {DEFAULT_MEALS.map((meal) => (
                    <li key={meal.key}>
                      <span>{meal.name}</span>
                      <b>{meal.base}</b>
                    </li>
                  ))}
                </ul>
                <Link href="/planner">Review meal plan</Link>
              </div>
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
      </main>
      <Footer />
    </div>
  );
}
