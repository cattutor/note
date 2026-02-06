"use client";

import React from "react";
import type { Speaker } from "@/types";

interface SpeakerBadgeProps {
  speaker: Speaker;
  size?: "sm" | "md";
}

export function SpeakerBadge({ speaker, size = "md" }: SpeakerBadgeProps) {
  const sizeClasses = size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-2.5 py-1";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md font-semibold ${sizeClasses}`}
      style={{ color: speaker.color }}
    >
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: speaker.color }}
      />
      <span>{speaker.name}</span>
      {speaker.title && (
        <span className="text-zinc-500 font-normal">({speaker.title})</span>
      )}
    </span>
  );
}
