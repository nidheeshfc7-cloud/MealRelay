import React from "react";
import Link from "next/link";
import { Leaf } from "lucide-react";

interface BrandLogoProps {
  light?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
  iconOnly?: boolean;
}

export function BrandLogo({
  light = false,
  className = "",
  size = "md",
  iconOnly = false,
}: BrandLogoProps) {
  const iconSize = size === "sm" ? 16 : size === "lg" ? 24 : 20;
  const boxSize =
    size === "sm"
      ? "w-7 h-7 rounded-lg"
      : size === "lg"
        ? "w-11 h-11 rounded-2xl"
        : "w-9 h-9 rounded-xl";
  const textSize =
    size === "sm" ? "text-lg" : size === "lg" ? "text-2xl" : "text-xl";

  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-2.5 group transition-transform active:scale-95 ${className}`}
    >
      <div
        className={`${boxSize} flex items-center justify-center transition-transform ${
          light ? "bg-lime text-forest-dark" : "bg-forest text-lime"
        } -rotate-6 shadow-sm`}
      >
        <Leaf size={iconSize} className="stroke-[2.5]" />
      </div>
      {!iconOnly && (
        <span
          className={`font-black tracking-tight ${textSize} ${light ? "text-white" : "text-ink"}`}
        >
          mealrelay<span className={light ? "text-lime" : "text-forest"}>.</span>
        </span>
      )}
    </Link>
  );
}
