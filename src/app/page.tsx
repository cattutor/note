"use client";

import React from "react";
import { AppProviders } from "./providers";
import { MeetingView } from "@/components/meeting/MeetingView";

export default function HomePage() {
  return (
    <AppProviders>
      <MeetingView />
    </AppProviders>
  );
}
