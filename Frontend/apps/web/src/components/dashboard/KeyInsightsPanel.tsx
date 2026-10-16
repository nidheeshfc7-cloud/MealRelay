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
    <div className="p-6 sm:p-7 rounded-3xl bg-white border border-line-light shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2 pb-5 border-b border-line-light/60">
          <div className="w-8 h-8 rounded-xl bg-sage text-forest flex items-center justify-center">
            <Lightbulb size={18} className="stroke-[2.2]" />
          </div>
          <h2 className="text-xl font-black text-ink tracking-tight">
            Key Insights
          </h2>
        </div>

        <div className="space-y-4 mt-5">
          {insights.map((insight) => {
            return (
              <div
                key={insight.id}
                className="p-4 rounded-2xl bg-canvas border border-line-light hover:border-forest/20 transition-all flex items-start gap-3.5"
              >
                {/* Circular Icon Avatar */}
                <div className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-full bg-forest text-lime flex items-center justify-center shrink-0 shadow-sm">
                  {insight.type === "down" ? (
                    <ArrowDown size={16} className="text-lime stroke-[2.5]" />
                  ) : insight.type === "up" ? (
                    <ArrowUp size={16} className="text-lime stroke-[2.5]" />
                  ) : (
                    <Info size={16} className="text-lime stroke-[2.5]" />
                  )}
                </div>

                {/* Insight Content */}
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-ink">
                    {insight.title}
                  </h3>
                  <p className="text-xs text-ink-secondary mt-0.5 leading-relaxed font-medium">
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
