import { useState, useCallback } from "react";
import { fetchLabels, createLabel } from "../api/spending";
import type { Label } from "../types/spending";

export function useLabels() {
  const [labels, setLabels] = useState<Label[]>([]);

  const loadLabels = useCallback(async () => {
    const result = await fetchLabels();
    setLabels(result);
  }, []);

  const addLabel = useCallback(async (name: string) => {
    const label = await createLabel(name);
    setLabels((prev) =>
      [...prev, label].sort((a, b) => a.name.localeCompare(b.name))
    );
    return label;
  }, []);

  return { labels, loadLabels, addLabel };
}
