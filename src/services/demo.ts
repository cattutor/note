// ============================================================
// Demo Service — 데모 시뮬레이션 데이터 & 자동 재생
// ============================================================

import type { Utterance, Speaker } from "@/types";
import { DEFAULT_SPEAKERS } from "@/lib/constants";
import { translateText } from "./translation";
import { getGlossary } from "./glossary";
import { v4 as uuid } from "uuid";

/** 데모 발화 시나리오 */
const DEMO_SCRIPT: { speakerIdx: number; text: string; delay: number }[] = [
  { speakerIdx: 0, text: "Hello everyone. Let's get started.", delay: 1000 },
  {
    speakerIdx: 0,
    text: "We need to tweak the lighting in the dungeon scene.",
    delay: 3000,
  },
  {
    speakerIdx: 1,
    text: "I agree. The frame rate drops in this area.",
    delay: 3500,
  },
  {
    speakerIdx: 2,
    text: "I think the NPC AI is too aggressive.",
    delay: 3000,
  },
  {
    speakerIdx: 0,
    text: "The shader is causing performance issues.",
    delay: 3000,
  },
  {
    speakerIdx: 1,
    text: "We should nerf the boss damage.",
    delay: 2500,
  },
  {
    speakerIdx: 2,
    text: "Let's push the hotfix before the weekend.",
    delay: 3000,
  },
  {
    speakerIdx: 0,
    text: "The spawn rate is too high.",
    delay: 2000,
  },
  {
    speakerIdx: 1,
    text: "We need more assets for the new level.",
    delay: 3000,
  },
  {
    speakerIdx: 2,
    text: "This task is a piece of cake. I'll handle it.",
    delay: 3000,
  },
  {
    speakerIdx: 0,
    text: "The patch notes are ready. Let's review the gameplay loop.",
    delay: 3500,
  },
  {
    speakerIdx: 1,
    text: "That sounds good. I'll check the bug tracker.",
    delay: 2500,
  },
  {
    speakerIdx: 2,
    text: "We should buff the healer class. Any questions?",
    delay: 3000,
  },
];

export interface DemoController {
  start: () => void;
  stop: () => void;
  isRunning: () => boolean;
}

/**
 * 데모 시뮬레이션 시작.
 * 각 발화를 순차적으로 실행하며, partial → final 트랜지션 시뮬레이션.
 */
export function createDemoController(
  onPartialUtterance: (utterance: Utterance) => void,
  onFinalUtterance: (utterance: Utterance) => void,
  speakers: Speaker[] = DEFAULT_SPEAKERS,
  context: string = "게임 개발 회의"
): DemoController {
  let running = false;
  let timeoutIds: ReturnType<typeof setTimeout>[] = [];

  async function processLine(
    line: (typeof DEMO_SCRIPT)[0]
  ): Promise<Utterance> {
    const speaker = speakers[line.speakerIdx] || speakers[0];
    const glossary = getGlossary();

    // 부분(partial) 발화 시뮬레이션
    const words = line.text.split(" ");
    const partialId = uuid();

    for (let i = 1; i <= words.length; i++) {
      const partialText = words.slice(0, i).join(" ");
      const partial: Utterance = {
        id: partialId,
        speakerId: speaker.id,
        originalText: partialText,
        translatedText: "",
        language: "en",
        timestamp: Date.now(),
        isPartial: true,
      };
      onPartialUtterance(partial);
      await sleep(80 + Math.random() * 60);
    }

    // 최종(final) 발화 + 번역
    const result = await translateText(line.text, context, glossary, true);

    const final: Utterance = {
      id: partialId,
      speakerId: speaker.id,
      originalText: line.text,
      translatedText: result.translatedText,
      language: "en",
      timestamp: Date.now(),
      isPartial: false,
      translatorNotes: result.notes.length > 0 ? result.notes : undefined,
    };

    return final;
  }

  async function run() {
    running = true;
    for (const line of DEMO_SCRIPT) {
      if (!running) break;
      await sleep(line.delay);
      if (!running) break;

      const utterance = await processLine(line);
      if (running) {
        onFinalUtterance(utterance);
      }
    }
    running = false;
  }

  return {
    start: () => {
      if (!running) run();
    },
    stop: () => {
      running = false;
      timeoutIds.forEach(clearTimeout);
      timeoutIds = [];
    },
    isRunning: () => running,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
