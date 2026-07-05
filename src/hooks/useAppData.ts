import { useEffect, useState, useCallback } from "react";
import type { AppState } from "../types/models";
import { createEmptyState, createSampleState } from "../data/defaults";
import * as storage from "../storage/storage";

export type SaveFn = (updater: AppState | ((prev: AppState) => AppState)) => void;

export function useAppData() {
  const [data, setData] = useState<AppState | null>(null);

  useEffect(() => {
    const loaded = storage.load();
    setData(loaded ?? createEmptyState());
  }, []);

  const save = useCallback<SaveFn>((updater) => {
    setData((prev) => {
      const base = prev ?? createEmptyState();
      const next = typeof updater === "function" ? updater(base) : updater;
      storage.save(next);
      return next;
    });
  }, []);

  const resetToBlank = useCallback(() => {
    const next = createEmptyState();
    storage.save(next);
    setData(next);
  }, []);

  const loadSampleData = useCallback(() => {
    const next = createSampleState();
    storage.save(next);
    setData(next);
  }, []);

  return { data, loading: data === null, save, resetToBlank, loadSampleData };
}
