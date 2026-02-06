"use client";

import React from "react";
import type { Speaker, Utterance } from "@/types";
import { SpeakerBadge } from "./SpeakerBadge";

interface SpeakerListProps {
  speakers: Speaker[];
  utterances: Utterance[];
}

export function SpeakerList({ speakers, utterances }: SpeakerListProps) {
  if (speakers.length === 0) return null;

  const getUtteranceCount = (speakerId: string) =>
    utterances.filter((u) => u.speakerId === speakerId).length;

  return (
    <div className="bg-zinc-900 border-b border-zinc-800 px-5 py-2">
      <div className="flex items-center gap-3 overflow-x-auto">
        <span className="text-[10px] text-zinc-600 uppercase tracking-wider flex-shrink-0">
          참여자
        </span>
        {speakers.map((speaker) => (
          <div key={speaker.id} className="flex items-center gap-1.5 flex-shrink-0">
            <SpeakerBadge speaker={speaker} size="sm" />
            <span className="text-[10px] text-zinc-600">
              ({getUtteranceCount(speaker.id)})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
