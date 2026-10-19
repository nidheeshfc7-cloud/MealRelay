import Image from "next/image";
import { Leaf } from "lucide-react";
import hostelMessImg from "../../../public/images/hostel-mess.jpg";
import collegeCanteenImg from "../../../public/images/college-canteen.jpg";
import styles from "./KitchensWeServe.module.css";

const KITCHEN_STAGES = [
  {
    tag: "OUR STARTING POINT",
    title: "Hostel messes",
    description: "Plan daily meals around attendance, demand and leftovers.",
    image: hostelMessImg,
    alt: "Hostel mess kitchen and dining hall preparation",
    pills: ["Attendance Sync", "Daily Leftover Logging", "Shift Batch Sizing"],
    isPrimary: true,
  },
  {
    tag: "WHERE WE'RE HEADED",
    title: "College dining",
    description: "Extend smarter preparation planning across larger campus kitchens.",
    image: collegeCanteenImg,
    alt: "Large college campus dining hall and food service counters",
    pills: ["Multi-Station Prep", "Campus Aggregation", "Scale Buffering"],
    isPrimary: false,
  },
];

export function KitchensWeServe() {
  return (
    <section
      id="who-we-serve"
      className={styles.section}
      aria-labelledby="kitchens-section-title"
    >
      <div className={styles.container}>
        {/* Section Header */}
        <header className={styles.header}>
          <div className={styles.eyebrow}>
            <span className={styles.eyebrowDot} aria-hidden="true" />
            <span>START SMALL. MAKE A BIG DIFFERENCE.</span>
          </div>
          <h2 id="kitchens-section-title" className={styles.headline}>
            Every kitchen deserves a smarter plan.
          </h2>
          <p className={styles.description}>
            Starting with local hostel messes, MealRelay is designed to make daily food
            planning simpler, more predictable and less wasteful—with room to grow into
            campus dining.
          </p>
        </header>

        {/* Two-Column Image Cards */}
        <div className={styles.cardsGrid}>
          {KITCHEN_STAGES.map((stage) => (
            <article key={stage.title} className={styles.card}>
              <div className={styles.imageFrame}>
                <Image
                  src={stage.image}
                  alt={stage.alt}
                  fill
                  sizes="(max-width: 900px) 100vw, 50vw"
                  className={styles.cardImage}
                  quality={95}
                />
              </div>

              <div className={styles.cardContent}>
                <div className={styles.cardHeader}>
                  <span
                    className={`${styles.stageTag} ${
                      !stage.isPrimary ? styles.stageTagSecondary : ""
                    }`}
                  >
                    {stage.tag}
                  </span>
                </div>

                <h3 className={styles.cardTitle}>{stage.title}</h3>
                <p className={styles.cardDescription}>{stage.description}</p>

                <div className={styles.cardPills}>
                  {stage.pills.map((pill) => (
                    <span key={pill} className={styles.pill}>
                      {pill}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Footer Area */}
        <footer className={styles.footerArea}>
          <div className={styles.footerBadge}>
            <Leaf size={15} className={styles.footerLeaf} aria-hidden="true" />
            <span>One purpose. Better planning at every scale.</span>
          </div>
        </footer>
      </div>
    </section>
  );
}

export default KitchensWeServe;
