"use client";

import { Check, Loader2 } from "lucide-react";
import styles from "./OcrScanProgress.module.css";

interface OcrScanProgressProps {
  completedCheckpoints: number;
  status?: string;
}

const CHECKPOINTS = ["Check photo", "Analyze menu", "Prepare review"] as const;

/** Presentation only: scan timing and recognition remain owned by the import modal. */
export function OcrScanProgress({ completedCheckpoints, status }: OcrScanProgressProps) {
  const completed = Math.max(0, Math.min(CHECKPOINTS.length, completedCheckpoints));
  const message = completed === CHECKPOINTS.length
    ? "Ready — opening your extracted items."
    : completed === 2
      ? "Finishing analysis. Your items will appear when ready."
      : "Checking your photo and reading the menu. Please wait.";

  return (
    <div
      className={styles.scanProgress}
      role="status"
      aria-live="polite"
      aria-label="Menu analysis progress"
    >
      <h3>Analyzing your menu</h3>
      <ol className={styles.checkpoints}>
        {CHECKPOINTS.map((label, index) => {
          const complete = index < completed;
          const active = index === completed;
          return (
            <li
              key={label}
              className={complete ? styles.complete : active ? styles.active : undefined}
              aria-current={active ? "step" : undefined}
            >
              <span className={styles.circle} aria-hidden="true">
                {complete ? (
                  <Check size={19} />
                ) : active ? (
                  <Loader2 size={19} className={styles.spinner} />
                ) : index + 1}
              </span>
              <span>{label}</span>
              <span className={styles.screenReader}>
                {complete ? "Complete" : active ? "In progress" : "Waiting"}
              </span>
            </li>
          );
        })}
      </ol>
      <p>{message}</p>
      {status && <span className={styles.screenReader}>{status}</span>}
    </div>
  );
}
