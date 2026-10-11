import { useCallback, useEffect, useRef, useState } from "react";
import { inventoryService } from "../services/inventoryService";
import { reportsService } from "../services/reportsService";
export function useInventory(enabled) {
  const [state, setState] = useState({
    data: null,
    reports: null,
    loading: true,
    error: "",
  });
  const version = useRef(0);
  const refresh = useCallback(async () => {
    const request = ++version.current;
    try {
      const data = await inventoryService.getSnapshot();
      const reports = await reportsService.getSummary(data);
      if (request === version.current)
        setState({ data, reports, loading: false, error: "" });
    } catch (error) {
      if (request === version.current)
        setState((s) => ({ ...s, loading: false, error: error.message }));
    }
  }, []);
  const invalidate = useCallback(() => {
    version.current += 1;
  }, []);
  useEffect(() => {
    if (!enabled) return;
    refresh();
    const stop = inventoryService.subscribe(refresh);
    return () => {
      invalidate();
      stop();
    };
  }, [enabled, refresh, invalidate]);
  return { ...state, refresh };
}
