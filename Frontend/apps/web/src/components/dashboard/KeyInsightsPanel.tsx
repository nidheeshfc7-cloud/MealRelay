"use client";

import React from "react";
import { ArrowDown, ArrowUp, Info, Lightbulb } from "lucide-react";
import { KeyInsight } from "./types";

interface KeyInsightsPanelProps {
  insights?: KeyInsight[];
}

const DEFAULT_INSIGHTS: KeyInsight[] = [
  {
    id: "ins_1",
    type: "down",
    title: "Lower attendance expected",
    description:
      "Tomorrow's attendance is estimated to be 5% lower than usual for Tuesdays.",
  },
  {
    id: "ins_2",
    type: "up",
    title: "Dal demand slightly higher",
    description:
      "Dal consumption has been 10–15% higher over the past 2 weeks.",
  },
  {
    id: "ins_3",
    type: "info",
    title: "No special events",
    description: "No holidays or special campus events expected tomorrow.",
  },
];

export const KeyInsightsPanel: React.FC<KeyInsightsPanelProps> = ({
  insights = DEFAULT_INSIGHTS,
}) => {
  return (
    <div className="p-6 rounded-2xl bg-white border border-line-light shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-3 pb-5 border-b border-line-light/70">
          <div className="w-10 h-10 rounded-xl bg-sage text-forest flex items-center justify-center shrink-0">
            <Lightbulb size={18} strokeWidth={2} />
          </div>
          <h2 className="text-lg font-extrabold text-ink tracking-tight">
            Key Insights
          </h2>
        </div>

        <div className="space-y-4 mt-5">
          {insights.map((insight) => {
            return (
              <div
                key={insight.id}
                className="p-4 rounded-xl bg-canvas border border-line-light/80 hover:border-forest/20 transition-all flex items-start gap-4"
              >
                {/* Minimalist Micro Icon */}
                <div className="w-9 h-9 rounded-xl bg-white border border-line-light text-forest flex items-center justify-center shrink-0 shadow-sm mt-1">
                  {insight.type === "down" ? (
                    <ArrowDown size={18} strokeWidth={2} className="text-amber-700" />
                  ) : insight.type === "up" ? (
                    <ArrowUp size={18} strokeWidth={2} className="text-forest" />
                  ) : (
                    <Info size={18} strokeWidth={2} className="text-forest" />
                  )}
                </div>

                {/* Insight Content */}
                <div>
                  <h3 className="text-sm font-bold text-ink">
                    {insight.title}
                  </h3>
                  <p className="text-sm text-ink-secondary mt-1 leading-relaxed font-normal">
                    {insight.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};


