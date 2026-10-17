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
        <div className="flex items-center gap-2.5 pb-4 border-b border-line-light/70">
          <div className="w-8 h-8 rounded-lg bg-sage text-forest flex items-center justify-center shrink-0">
            <Lightbulb size={16} className="stroke-[2.2]" />
          </div>
          <h2 className="text-base font-bold text-ink tracking-tight">
            Key Insights
          </h2>
        </div>

        <div className="space-y-3 mt-4">
          {insights.map((insight) => {
            return (
              <div
                key={insight.id}
                className="p-3.5 rounded-xl bg-canvas border border-line-light/70 hover:border-forest/20 transition-all flex items-start gap-3"
              >
                {/* Minimalist Micro Icon */}
                <div className="w-7 h-7 rounded-lg bg-white border border-line-light text-forest flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                  {insight.type === "down" ? (
                    <ArrowDown size={14} className="text-amber-700 stroke-[2.4]" />
                  ) : insight.type === "up" ? (
                    <ArrowUp size={14} className="text-forest stroke-[2.4]" />
                  ) : (
                    <Info size={14} className="text-forest stroke-[2.4]" />
                  )}
                </div>

                {/* Insight Content */}
                <div>
                  <h3 className="text-xs font-bold text-ink">
                    {insight.title}
                  </h3>
                  <p className="text-xs text-ink-secondary mt-1 leading-relaxed font-medium">
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

