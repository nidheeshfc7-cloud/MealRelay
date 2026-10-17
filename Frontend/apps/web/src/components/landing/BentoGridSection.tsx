"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Leaf, Utensils, BarChart3 } from "lucide-react";
import { area, curveMonotoneX, line } from "d3-shape";
import { scaleLinear, scalePoint } from "d3-scale";
import { DEFAULT_MEALS, formatPortionNumber } from "@mealrelay/core";
import styles from "./BentoGridSection.module.css";
import ingredientPhoto from "../../../../mobile/assets/images/mealrelay-impact-still.jpg";

const TREND = [480, 560, 530, 720, 820, 620, 580];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const planned = DEFAULT_MEALS.reduce((sum, meal) => sum + meal.base, 0);
const served = DEFAULT_MEALS.reduce((sum, meal) => sum + meal.actual, 0);
const x = scalePoint<number>()
  .domain(TREND.map((_, i) => i))
  .range([22, 398]);
const y = scaleLinear().domain([0, 1000]).range([133, 12]);
const demandLine = line<number>()
  .x((_, i) => x(i)!)
  .y((value) => y(value))
  .curve(curveMonotoneX)(TREND)!;
const demandBand = area<number>()
  .x((_, i) => x(i)!)
  .y0((value) => y(value - 65))
  .y1((value) => y(value + 65))
  .curve(curveMonotoneX)(TREND)!;

function CardLink({
  href,
  label,
  text,
}: {
  href: string;
  label: string;
  text?: string;
}) {
  return (
    <Link
      href={href}
      className={text ? styles.textLink : styles.arrowLink}
      aria-label={label}
    >
      {text}
      <ArrowRight size={20} aria-hidden="true" />
    </Link>
  );
}

function DemandTrend() {
  return (
    <div className={styles.trend}>
      <svg
        viewBox="0 0 420 162"
        role="img"
        aria-label={`Illustrative daily demand in servings. ${DAYS.map((day, i) => `${day} ${TREND[i]}`).join(", ")}. Shaded band is a visual sample range, not a measured confidence interval.`}
      >
        {[400, 800].map((tick) => (
          <g key={tick}>
            <line x1="22" x2="398" y1={y(tick)} y2={y(tick)} stroke="#E5EBE1" />
            <text x="21" y={y(tick) - 5} fontSize="9" fill="#718078">
              {tick}
            </text>
          </g>
        ))}
        <path className={styles.band} d={demandBand} fill="#E6FCA8" />
        <path
          className={styles.trendLine}
          d={demandLine}
          fill="none"
          stroke="#003F2F"
          strokeWidth="2.5"
          pathLength="1"
        />
        <line
          x1={x(4)}
          x2={x(4)}
          y1={y(TREND[4])}
          y2="133"
          stroke="#718078"
          strokeDasharray="3 4"
        />
        <circle
          cx={x(4)}
          cy={y(TREND[4])}
          r="6"
          fill="#003F2F"
          stroke="white"
          strokeWidth="3"
        />
        {DAYS.map((day, i) => (
          <text
            key={day}
            x={x(i)}
            y="155"
            textAnchor="middle"
            fontSize="10"
            fill="#718078"
          >
            {day}
          </text>
        ))}
      </svg>
      <div className={styles.chartNote}>
        <span>
          <i />
          Illustrative demand
        </span>
        <span>Servings · sample range</span>
      </div>
    </div>
  );
}

function PreparationList() {
  return (
    <div className={styles.prepPanel}>
      <div className={styles.prepHeading}>
        <Utensils size={17} aria-hidden="true" />
        <div>
          <strong>Tomorrow’s prep</strong>
          <small>Sample plan · 3 services</small>
        </div>
      </div>
      {DEFAULT_MEALS.map((meal, index) => (
        <div key={meal.key} className={styles.prepRow}>
          <span className={styles.mealIcon}>
            <Utensils size={17} aria-hidden="true" />
          </span>
          <div>
            <strong>{meal.name}</strong>
            <small>{meal.base} portions</small>
          </div>
          <Check size={15} aria-hidden="true" />
          <span className={styles.rowNumber}>0{index + 1}</span>
        </div>
      ))}
      <div className={styles.prepTotal}>
        <span>Total planned</span>
        <strong>{formatPortionNumber(planned)}</strong>
      </div>
      <p>Review quantities before approval.</p>
    </div>
  );
}

function AnalyticsPhone() {
  return (
    <div className={styles.phone}>
      <div className={styles.phoneNotch} aria-hidden="true" />
      <div className={styles.phoneBrand}>
        <Leaf size={17} aria-hidden="true" />
        mealrelay.
      </div>
      <p>
        Service overview <span>Sample data</span>
      </p>
      {[
        { label: "Planned portions", value: planned, Icon: Utensils },
        { label: "Served portions", value: served, Icon: BarChart3 },
        { label: "Preparation gap", value: planned - served, Icon: Leaf },
      ].map(({ label, value, Icon }, index) => (
        <div className={styles.phoneMetric} key={label}>
          <Icon size={17} aria-hidden="true" />
          <div>
            <span>{label}</span>
            <strong>{formatPortionNumber(value)}</strong>
            <small>
              {index === 2
                ? "Planned minus served"
                : "Illustrative service count"}
            </small>
          </div>
          <div className={styles.miniBars} aria-hidden="true">
            {[35, 58, 45, 72, 63].map((height, i) => (
              <i key={i} style={{ height: `${height}%` }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function BentoGridSection() {
  const sectionRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const section = sectionRef.current;
    if (
      !section ||
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).dataset.visible = "true";
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 },
    );
    section.dataset.animated = "true";
    section
      .querySelectorAll("[data-bento-card]")
      .forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="product-capabilities"
      className={styles.section}
      aria-labelledby="bento-title"
    >
      <div className={styles.grid}>
        <article
          data-bento-card
          className={`${styles.card} ${styles.showcase}`}
        >
          <div className={styles.showcaseCopy}>
            <h2 id="bento-title">Plan smarter. Waste less.</h2>
            <p>
              Forecast demand, plan preparation, and serve the right amount. One
              clear view of the next service.
            </p>
          </div>
          <div className={styles.productVisual}>
            <Image
              src="/images/MealRelay Dashboard Mockup.png"
              alt="MealRelay dashboard displayed on a laptop and phone, with meal quantities and service charts"
              width={1448}
              height={1086}
              sizes="(max-width: 650px) 92vw, (max-width: 1000px) 90vw, 720px"
              className={styles.productImage}
            />
          </div>
          <CardLink
            href="/dashboard"
            label="Explore the MealRelay dashboard"
            text="Explore the workspace"
          />
        </article>
        <article
          data-bento-card
          className={`${styles.card} ${styles.forecast}`}
        >
          <p className={styles.label}>Demand forecasting</p>
          <h3>Anticipate demand.</h3>
          <p className={styles.description}>
            Bring tomorrow’s service into focus before preparation begins.
          </p>
          <DemandTrend />
          <CardLink href="/forecasts" label="Explore demand forecasts" />
        </article>
        <article
          data-bento-card
          className={`${styles.card} ${styles.preparation}`}
        >
          <div className={styles.prepCopy}>
            <p className={styles.label}>Preparation planning</p>
            <h3>Plan the right quantities.</h3>
            <p className={styles.description}>
              Clear portion guides for breakfast, lunch, and dinner.
            </p>
            <CardLink
              href="/planner"
              label="Open the meal preparation planner"
            />
          </div>
          <PreparationList />
        </article>
        <article data-bento-card className={`${styles.card} ${styles.waste}`}>
          <div className={styles.wastePhoto}>
            <Image
              src={ingredientPhoto}
              alt=""
              fill
              sizes="(max-width: 650px) 45vw, 340px"
              style={{ objectFit: "cover", objectPosition: "center 60%" }}
            />
          </div>
          <div className={styles.bottomCopy}>
            <p className={styles.label}>Waste reduction</p>
            <h3>Cut avoidable waste.</h3>
            <p className={styles.description}>
              Prepare with purpose. Better portion planning can help reduce
              unnecessary leftovers.
            </p>
            <CardLink
              href="/analytics"
              label="Explore waste and service analytics"
            />
          </div>
        </article>
        <article
          data-bento-card
          className={`${styles.card} ${styles.analytics}`}
        >
          <div className={styles.bottomCopy}>
            <p className={styles.label}>Analytics & insights</p>
            <h3>See what’s working.</h3>
            <p className={styles.description}>
              Compare preparation with service. Bring what you learn into your
              next plan.
            </p>
            <CardLink href="/analytics" label="Open MealRelay analytics" />
          </div>
          <AnalyticsPhone />
        </article>
      </div>
    </section>
  );
}
