"use client";

import * as React from "react";
import { Check } from "lucide-react";

import type { Activity, Interest, InterestCategory } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** Generic toggle-chip multi-select. */
export function ChipMultiSelect<T extends string>({
  options,
  selected,
  onChange,
}: {
  options: { value: T; label: string; description?: string }[];
  selected: T[];
  onChange: (next: T[]) => void;
}) {
  function toggle(value: T) {
    onChange(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value],
    );
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = selected.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => toggle(opt.value)}
            title={opt.description}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input hover:bg-muted",
            )}
          >
            {active && <Check className="h-3.5 w-3.5" />}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Grouped selector for interests or activities. Items are grouped by category
 * with a friendly heading and emoji chips.
 */
export function TaxonomySelector({
  items,
  selectedIds,
  onChange,
  max,
}: {
  items: (Interest | Activity)[];
  selectedIds: string[];
  onChange: (next: string[]) => void;
  max?: number;
}) {
  const grouped = React.useMemo(() => {
    const map = new Map<InterestCategory, (Interest | Activity)[]>();
    for (const item of items) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }
    return Array.from(map.entries());
  }, [items]);

  function toggle(id: string) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((s) => s !== id));
    } else {
      if (max && selectedIds.length >= max) return;
      onChange([...selectedIds, id]);
    }
  }

  return (
    <div className="space-y-5">
      {grouped.map(([category, list]) => (
        <div key={category}>
          <h4 className="mb-2 text-sm font-semibold text-muted-foreground">
            {CATEGORY_LABELS[category]}
          </h4>
          <div className="flex flex-wrap gap-2">
            {list.map((item) => {
              const active = selectedIds.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggle(item.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input hover:bg-muted",
                  )}
                >
                  <span aria-hidden>{item.emoji}</span>
                  {item.name}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
