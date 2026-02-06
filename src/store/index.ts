"use client";

// ============================================================
// 앱 상태 관리 (React Context + useReducer)
// ============================================================

import { createContext, useContext } from "react";
import type {
  AppSettings,
  GlossaryEntry,
  MeetingSession,
  Speaker,
  Utterance,
} from "@/types";
import { DEFAULT_SETTINGS } from "@/lib/constants";

// --- State ---
export interface AppState {
  settings: AppSettings;
  currentSession: MeetingSession | null;
  sessions: MeetingSession[];
  speakers: Speaker[];
  glossary: GlossaryEntry[];
  isRecording: boolean;
  isConnected: boolean;
}

export const initialState: AppState = {
  settings: DEFAULT_SETTINGS,
  currentSession: null,
  sessions: [],
  speakers: [],
  glossary: [],
  isRecording: false,
  isConnected: false,
};

// --- Actions ---
export type AppAction =
  | { type: "SET_SETTINGS"; payload: Partial<AppSettings> }
  | { type: "SET_SESSION"; payload: MeetingSession }
  | { type: "ADD_UTTERANCE"; payload: Utterance }
  | { type: "UPDATE_UTTERANCE"; payload: { id: string; updates: Partial<Utterance> } }
  | { type: "SET_SPEAKERS"; payload: Speaker[] }
  | { type: "ADD_SPEAKER"; payload: Speaker }
  | { type: "SET_GLOSSARY"; payload: GlossaryEntry[] }
  | { type: "ADD_GLOSSARY_ENTRY"; payload: GlossaryEntry }
  | { type: "REMOVE_GLOSSARY_ENTRY"; payload: string }
  | { type: "SET_RECORDING"; payload: boolean }
  | { type: "SET_CONNECTED"; payload: boolean }
  | { type: "CLEAR_SESSION" };

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_SETTINGS":
      return { ...state, settings: { ...state.settings, ...action.payload } };

    case "SET_SESSION":
      return { ...state, currentSession: action.payload };

    case "ADD_UTTERANCE": {
      if (!state.currentSession) return state;
      return {
        ...state,
        currentSession: {
          ...state.currentSession,
          utterances: [...state.currentSession.utterances, action.payload],
          updatedAt: Date.now(),
        },
      };
    }

    case "UPDATE_UTTERANCE": {
      if (!state.currentSession) return state;
      return {
        ...state,
        currentSession: {
          ...state.currentSession,
          utterances: state.currentSession.utterances.map((u) =>
            u.id === action.payload.id ? { ...u, ...action.payload.updates } : u
          ),
          updatedAt: Date.now(),
        },
      };
    }

    case "SET_SPEAKERS":
      return { ...state, speakers: action.payload };

    case "ADD_SPEAKER":
      return { ...state, speakers: [...state.speakers, action.payload] };

    case "SET_GLOSSARY":
      return { ...state, glossary: action.payload };

    case "ADD_GLOSSARY_ENTRY":
      return { ...state, glossary: [...state.glossary, action.payload] };

    case "REMOVE_GLOSSARY_ENTRY":
      return {
        ...state,
        glossary: state.glossary.filter((g) => g.id !== action.payload),
      };

    case "SET_RECORDING":
      return { ...state, isRecording: action.payload };

    case "SET_CONNECTED":
      return { ...state, isConnected: action.payload };

    case "CLEAR_SESSION":
      return { ...state, currentSession: null, isRecording: false };

    default:
      return state;
  }
}

// --- Context ---
export interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

export const AppContext = createContext<AppContextType>({
  state: initialState,
  dispatch: () => {},
});

export function useAppContext() {
  return useContext(AppContext);
}
