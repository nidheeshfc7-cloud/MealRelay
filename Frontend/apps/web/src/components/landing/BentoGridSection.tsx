"use client";

import { useEffect, useRef, useState, useId } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Utensils } from "lucide-react";
import { area, curveMonotoneX, line } from "d3-shape";
import { scaleLinear, scalePoint } from "d3-scale";
import { DEFAULT_MEALS, formatPortionNumber } from "@mealrelay/core";
import styles from "./BentoGridSection.module.css";
import dashboardMockup from "../../../public/images/MealRelay Dashboard Mockup.png";
import analyticsPhone from "../../../public/images/Angled Mealrelay Kitchen Dashboard Phone.png";

const TREND = [480, 560, 530, 720, 820, 620, 580];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const planned = DEFAULT_MEALS.reduce((sum, meal) => sum + meal.base, 0);
const x = scalePoint<number>()
  .domain(TREND.map((_, i) => i))
  .range([22, 398]);
const y = scaleLinear().domain([0, 1000]).range([172, 66]);
const demandLine = line<number>()
  .x((_, i) => x(i)!)
  .y((value) => y(value))
  .curve(curveMonotoneX)(TREND)!;
const demandFill = area<number>()
  .x((_, i) => x(i)!)
  .y0(178)
  .y1(value => y(value))
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
  const [selected, setSelected] = useState(4);
  const titleId = useId();
  const fillId = useId();
  const pointX = x(selected)!;
  const pointY = y(TREND[selected]);
  const tooltipX = Math.max(70, Math.min(350, pointX));
  function selectPoint(event: React.PointerEvent<SVGSVGElement>) {
    const svg = event.currentTarget;
    const matrix = svg.getScreenCTM();
    if (!matrix) return;
    const point = svg.createSVGPoint();
    point.x = event.clientX; point.y = event.clientY;
    const local = point.matrixTransform(matrix.inverse());
    setSelected(Math.max(0, Math.min(6, Math.round((local.x - 22) / (376 / 6)))));
  }
  return <div className={styles.trend}>
    <svg viewBox="0 0 420 206" role="group" aria-labelledby={titleId}
      onPointerMove={selectPoint} onPointerDown={selectPoint}>
      <title id={titleId}>Illustrative weekly demand in servings. Use arrow keys on the chart to select a day. Shading below the line illustrates the demand trend.</title>
      <defs><linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#D5FB53" stopOpacity=".32" />
        <stop offset="100%" stopColor="#D5FB53" stopOpacity=".07" />
      </linearGradient></defs>
      {[400, 600, 800].map(tick => <line key={tick} className={styles.chartGrid} x1="22" x2="398" y1={y(tick)} y2={y(tick)} />)}
      {DAYS.map((day, i) => <line key={day} className={styles.chartGrid} x1={x(i)} x2={x(i)} y1="66" y2="178" strokeDasharray="3 5" />)}
      <path className={styles.band} d={demandFill} fill={`url(#${fillId})`} />
      <path className={styles.trendLine} d={demandLine} fill="none" stroke="#003F2F" strokeWidth="3" strokeLinecap="round" pathLength="1" />
      <line x1="22" x2="398" y1="178" y2="178" stroke="#dce3d9" />
      <line className={styles.selectedGuide} x1={pointX} x2={pointX} y1={pointY} y2="178" stroke="#718078" strokeDasharray="3 4" />
      <g className={styles.selectedMarker} style={{transform:`translate(${pointX}px, ${pointY}px)`}}>
        <circle r="14" fill="#D5FB53" fillOpacity=".32" />
        <circle r="7" fill="#003F2F" stroke="white" strokeWidth="3" />
      </g>
      <g className={styles.floatingTip} style={{transform:`translate(${tooltipX}px, ${pointY - 55}px)`}} aria-hidden="true">
        <rect x="-64" width="128" height="43" rx="12" fill="white" />
        <path d="M-5 42 L0 48 L5 42" fill="white" />
        <text textAnchor="middle" y="16" fill="#718078" fontSize="10">{DAYS[selected]} · sample forecast</text>
        <text textAnchor="middle" y="33" fill="#003F2F" fontSize="14" fontWeight="750">{TREND[selected]} servings</text>
      </g>
      {[0, 3, 6].map(i => <text key={i} x={x(i)} y="198" textAnchor="middle" fontSize="11" fill="#718078">{DAYS[i]}</text>)}
      <rect x="8" y="4" width="404" height="198" rx="10" fill="transparent" tabIndex={0}
        role="slider" aria-label="Illustrative forecast day" aria-valuemin={0} aria-valuemax={6} aria-valuenow={selected}
        aria-valuetext={`${DAYS[selected]}: ${TREND[selected]} predicted servings, sample data`}
        onKeyDown={event => {
          if (["ArrowRight","ArrowUp","ArrowLeft","ArrowDown","Home","End"].includes(event.key)) {
            event.preventDefault();
            setSelected(current => event.key === "Home" ? 0 : event.key === "End" ? 6 : Math.max(0, Math.min(6, current + (["ArrowRight","ArrowUp"].includes(event.key) ? 1 : -1))));
          }
        }} className={styles.chartInteraction} />
    </svg>
    <div className={styles.chartNote}><span><i className={styles.rangeDot} />Demand trend</span><span><i />Predicted servings</span><span>Illustrative data</span></div>
  </div>;
}

function PreparationList() {
  return (
    <div className={styles.prepPanel}>
      <div className={styles.prepHeading}>
        <Utensils size={17} aria-hidden="true" />
        <div>
          <strong>Tomorrow’s prep</strong>
          <small>Sample plan &middot; 3 services</small>
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
    <div className={styles.phoneVisual}>
      <Image
        src={analyticsPhone}
        alt="Illustrative MealRelay analytics dashboard on a tilted phone"
        sizes="(max-width: 650px) 48vw, (max-width: 1000px) 26vw, 310px"
        quality={90}
        className={styles.phoneImage}
      />
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
            <h2 id="bento-title">Plan <span className={styles.keywordAccent}>smarter.</span> Waste less.</h2>
            <p>
              Forecast demand, plan preparation, and serve the right amount. One
              clear view of the next service.
            </p>
          </div>
          <div className={styles.productVisual}>
            <Image
              src={dashboardMockup}
              alt="MealRelay dashboard displayed on a laptop and phone, with meal quantities and service charts"
              quality={90}
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
          <h3>Anticipate <span className={styles.keywordAccent}>demand.</span></h3>
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
            <h3>Plan the right <span className={styles.keywordAccent}>quantities.</span></h3>
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
              src="/images/new%20veggie%20box"
              alt=""
              fill
              sizes="(max-width: 650px) 100vw, (max-width: 1100px) 50vw, 620px"
              style={{ objectFit: "cover", objectPosition: "center" }}
            />
          </div>
          <div className={styles.bottomCopy}>
            <p className={styles.label}>Waste reduction</p>
            <h3>Cut<br /><span className={styles.keywordAccent}>avoidable</span><br />waste.</h3>
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
            <h3>See what’s <span className={styles.keywordAccent}>working.</span></h3>
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
