import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import s from "./HowItWorks.module.css";

const cards = [
  {title: "Forecast Demand", description: "Use smart forecasts to plan the right quantities, reduce overproduction, and keep service running smoothly.", image: "Forest Green Meal Dashboard Card.png", href: "/forecasts", action: "Explore forecasts", step: "Predict"},
  {title: "Plan Preparation", description: "Turn forecasts into clear preparation plans with portion counts and task lists for your kitchen team.", image: "Cozy Kitchen Meal Prep Plan.png", href: "/planner", action: "Open meal planner", step: "Prepare"},
  {title: "Reduce Waste", description: "Track leftovers, identify patterns, and make better decisions to reduce food waste.", image: "Food Waste Dashboard in a Kitchen.png", href: "/analytics", action: "View analytics", step: "Improve"},
];

export function HowItWorks() {
  return (
    <section id="workflow" className={s.section} aria-labelledby="workflow-title">
      <div className={s.container}>
        <header className={s.heading}>
          <div><p className={s.eyebrow}>How it works</p><h2 id="workflow-title">One connected<br />kitchen platform</h2></div>
          <div className={s.introduction}><p>Plan demand, prepare meals and improve service with one simple workflow built for hostels and local kitchens.</p><small>Predict → Prepare → Improve · Illustrative product previews</small></div>
        </header>
        <div className={s.grid}>
          {cards.map(({title, description, image, href, action, step}, i) => (
            <article key={title} className={`${s.card} ${i === 1 ? s.light : ""}`} aria-label={`${step}: ${title}`}>
              <Image src={`/images/${image}`} alt="" fill sizes="(max-width: 600px) 100vw, (max-width: 850px) 50vw, 33vw" className={s.background} />
              <div className={s.copy}><h3>{title}</h3><p>{description}</p></div>
              <Link className={`${s.cta} ${i > 0 ? s.embeddedCta : ""}`} href={href} aria-label={action}>
                {i === 0 && <ArrowRight size={23} aria-hidden="true" />}
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
