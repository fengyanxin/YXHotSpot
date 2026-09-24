"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { HotListResponse } from "@/lib/types";

type HotMap = Record<string, HotListResponse>;

interface HotDataContextValue {
  data: HotMap;
  loading: boolean;
  refreshing: ReadonlySet<string>;
  refresh: () => Promise<void>;
  refreshSource: (sourceId: string) => Promise<void>;
}

const HotDataContext = createContext<HotDataContextValue | null>(null);

export function HotDataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<HotMap>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState<Set<string>>(() => new Set());

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/hot/all");
      if (!r.ok) throw new Error("fetch failed");
      const json = (await r.json()) as { sources?: HotMap };
      setData(json.sources ?? {});
    } catch {
      /* keep previous data on refresh failure */
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshSource = useCallback(async (sourceId: string) => {
    setRefreshing((prev) => new Set(prev).add(sourceId));
    try {
      const r = await fetch(`/api/hot/${sourceId}?force=1`);
      if (!r.ok) throw new Error("fetch failed");
      const json = (await r.json()) as HotListResponse;
      setData((prev) => ({ ...prev, [sourceId]: json }));
    } catch {
      /* card shows retry */
    } finally {
      setRefreshing((prev) => {
        const next = new Set(prev);
        next.delete(sourceId);
        return next;
      });
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ data, loading, refreshing, refresh, refreshSource }),
    [data, loading, refreshing, refresh, refreshSource]
  );

  return (
    <HotDataContext.Provider value={value}>{children}</HotDataContext.Provider>
  );
}

export function useHotData() {
  const ctx = useContext(HotDataContext);
  if (!ctx) throw new Error("useHotData must be used within HotDataProvider");
  return ctx;
}
