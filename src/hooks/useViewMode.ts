"use client";

import { useState, useEffect } from "react";

export type ViewMode = "detailed" | "table";

const STORAGE_KEY = "interventions-view-mode";

export function useViewMode(): [ViewMode, (mode: ViewMode) => void] {
  const [viewMode, setViewMode] = useState<ViewMode>("detailed");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ViewMode;
    if (stored && (stored === "detailed" || stored === "table")) {
      setViewMode(stored);
    }
  }, []);

  const setAndPersistViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem(STORAGE_KEY, mode);
  };

  return [viewMode, setAndPersistViewMode];
}