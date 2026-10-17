import Link from "next/link";
import { arc, curveMonotoneX, line, pie } from "d3-shape";
import { scaleLinear, scalePoint } from "d3-scale";
import {
  BarChart3,
  Leaf,
  Utensils,
  LineChart,
  ArrowUpRight,
} from "lucide-react";
import { DEFAULT_MEALS, formatPortionNumber } from "@mealrelay/core";
import s from "@/app/landing.module.css";

const series = [480, 610, 520, 710, 750, 510, 440];
const predictions = [580, 680, 590, 730, 860, 580, 490];
const colors = ["#D5FB53", "#245C40", "#E6FCA8"];

/** Server-rendered D3 geometry keeps this preview free of client-side chart code. */
export function LandingPreview({ compact = false }: { compact?: boolean }) {
  const total = DEFAULT_MEALS.reduce((sum, meal) => sum + meal.base, 0);
  const x = scalePoint<number>()
    .domain(series.map((_, i) => i))
    .range([8, 278]);
  const y = scaleLinear().domain([0, 1000]).range([104, 8]);
  const path = line<number>()
    .x((_, i) => x(i)!)
    .y((d) => y(d))
    .curve(curveMonotoneX);
  const slices = pie<(typeof DEFAULT_MEALS)[number]>()
    .value((meal) => meal.base)
    .sort(null)(DEFAULT_MEALS);
  const ring = arc<(typeof slices)[number]>()
    .innerRadius(30)
    .outerRadius(41)
    .padAngle(0.025);
  return (
    <div className={`${s.preview} ${compact ? s.compactPreview : ""}`}>
      <div className={s.previewTop}>
        <span className={s.previewBrand}>
          <Leaf size={14} aria-hidden="true" /> mealrelay.
        </span>
        <nav aria-label={compact ? "Platform preview" : "Dashboard preview"}>
          <Link href="/dashboard">Overview</Link>
          <Link href="/forecasts">Forecasts</Link>
          <Link href="/planner">Meal planner</Link>
        </nav>
        <span className={s.sampleBadge}>Sample kitchen</span>
      </div>
      <div className={s.previewBody}>
        <nav
          className={s.previewRail}
          aria-label={compact ? "Platform tools" : "Kitchen tools"}
        >
          {[
            { Icon: BarChart3, label: "Overview", href: "/dashboard" },
            { Icon: LineChart, label: "Forecasts", href: "/forecasts" },
            { Icon: Utensils, label: "Meal planning", href: "/planner" },
            { Icon: Leaf, label: "Waste analytics", href: "/analytics" },
          ].map(({ Icon, label, href }) => (
            <Link key={href} href={href}>
              <Icon size={14} aria-hidden="true" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className={s.previewContent}>
          <div className={s.previewTitle}>
            <h3>Tomorrow’s kitchen, in focus.</h3>
            <Link href="/planner" aria-label="Open tomorrow’s meal plan">
              <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </div>
          <div className={s.previewMetrics}>
            <div>
              <strong>{formatPortionNumber(total)}</strong>
              <span>Planned portions</span>
              <small>Across 3 services</small>
            </div>
            <div>
              <strong>+4.8%</strong>
              <span>Safety buffer</span>
              <small>Manager reviewed</small>
            </div>
            <div>
              <strong>3</strong>
              <span>Meal services</span>
              <small>One preparation plan</small>
            </div>
          </div>
          <div className={s.previewCharts}>
            <div className={s.lineChart}>
              <div className={s.chartTitle}>
                <strong>Meal demand forecast</strong>
                <span>
                  <i />
                  Forecast <i />
                  Served
                </span>
              </div>
              <svg
                viewBox="0 0 290 128"
                role="img"
                aria-label="Illustrative weekly forecast and actual servings. Forecasts range from 490 to 860; actuals range from 440 to 750. Both use the same scale."
              >
                {[0, 250, 500, 750, 1000].map((tick) => (
                  <line
                    key={tick}
                    x1="8"
                    x2="278"
                    y1={y(tick)}
                    y2={y(tick)}
                    stroke="rgba(255,255,255,.08)"
                  />
                ))}
                <path
                  d={path(predictions)!}
                  fill="none"
                  stroke="#D5FB53"
                  strokeWidth="2.5"
                />
                <path
                  d={path(series)!}
                  fill="none"
                  stroke="#E6FCA8"
                  strokeWidth="1.5"
                  strokeDasharray="5 3"
                />
                {series.map((_, i) => (
                  <text
                    key={i}
                    x={x(i)}
                    y="122"
                    fill="#E6FCA8"
                    fontSize="9"
                    textAnchor="middle"
                  >
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i]}
                  </text>
                ))}
              </svg>
              <small>Daily servings / illustrative data</small>
            </div>
            <div className={s.mealChart}>
              <strong>Meals by service</strong>
              <div className={s.donutRow}>
                <svg
                  viewBox="0 0 100 100"
                  role="img"
                  aria-label={`${total} sample portions: ${DEFAULT_MEALS.map((m) => `${m.name} ${m.base}`).join(", ")}`}
                >
                  <g transform="translate(50,50)">
                    {slices.map((slice, i) => (
                      <path
                        key={slice.data.key}
                        d={ring(slice)!}
                        fill={colors[i]}
                      />
                    ))}
                  </g>
                  <text
                    x="50"
                    y="48"
                    textAnchor="middle"
                    fill="white"
                    fontSize="17"
                    fontWeight="800"
                  >
                    {total}
                  </text>
                  <text
                    x="50"
                    y="61"
                    textAnchor="middle"
                    fill="#E6FCA8"
                    fontSize="7"
                  >
                    portions
                  </text>
                </svg>
                <ul>
                  {DEFAULT_MEALS.map((meal, i) => (
                    <li key={meal.key}>
                      <i style={{ background: colors[i] }} />
                      <span>{meal.name}</span>
                      <b>{meal.base}</b>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <Link className={s.previewFooter} href="/planner">
            Adjust Portions <ArrowUpRight size={12} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}
