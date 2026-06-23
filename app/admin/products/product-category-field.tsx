"use client";

import { useId, useMemo, useState } from "react";

export type ProductCategoryOption = {
  label: string;
  routeKey: string | null;
  productCount: number;
  metadataBacked: boolean;
};

type ProductCategoryFieldProps = {
  categories: ProductCategoryOption[];
  deleteCategoryAction: (formData: FormData) => void | Promise<void>;
};

function normalizeCategories(categories: ProductCategoryOption[]) {
  const seen = new Set<string>();
  return categories
    .map((category) => ({
      ...category,
      label: category.label.trim(),
      routeKey: category.routeKey?.trim() || null
    }))
    .filter((category) => category.label)
    .filter((category) => {
      const key = category.label.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export function ProductCategoryField({ categories, deleteCategoryAction }: ProductCategoryFieldProps) {
  const categoryId = useId();
  const options = useMemo(() => normalizeCategories(categories), [categories]);
  const [selectedCategory, setSelectedCategory] = useState(options[0]?.label ?? "");
  const selectedOption = options.find((category) => category.label === selectedCategory) ?? options[0] ?? null;
  const usageLabel = selectedOption
    ? selectedOption.productCount === 1
      ? "1 product uses this"
      : `${selectedOption.productCount} products use this`
    : "No category selected";

  return (
    <div data-product-category-field className="grid gap-2">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={categoryId} className="text-xs font-medium text-[var(--platform-text-muted)]">
          Category
        </label>
        <button
          type="submit"
          formAction={deleteCategoryAction}
          formNoValidate
          data-product-delete-category-action
          disabled={!selectedOption}
          onClick={(event) => {
            if (!selectedOption) {
              event.preventDefault();
              return;
            }
            const warning = selectedOption.productCount > 0
              ? `Category "${selectedOption.label}" is used by ${selectedOption.productCount} product(s), so deletion will be blocked until those products are moved. Continue?`
              : `Delete category "${selectedOption.label}" from category metadata?`;
            if (!window.confirm(warning)) {
              event.preventDefault();
            }
          }}
          className="rounded-md px-2.5 py-1 text-xs font-medium text-[var(--platform-danger)] transition-colors hover:bg-[var(--platform-danger-soft)] disabled:cursor-not-allowed disabled:opacity-45"
        >
          Delete
        </button>
      </div>
      <input type="hidden" name="category_route_key" value={selectedOption?.routeKey ?? ""} />
      {options.length ? (
        <select
          id={categoryId}
          name="category"
          required
          value={selectedCategory}
          onChange={(event) => setSelectedCategory(event.target.value)}
          className="h-10 w-full rounded-[10px] border-0 bg-[var(--platform-surface-muted)] px-3 text-sm text-[var(--platform-text-primary)] outline-none focus:bg-[var(--platform-accent-soft)] focus:ring-2 focus:ring-[var(--platform-focus-ring)]"
        >
          {options.map((category) => (
            <option key={category.label} value={category.label}>
              {category.label}
            </option>
          ))}
        </select>
      ) : (
        <div className="rounded-[10px] bg-[var(--platform-warning-soft)] px-3 py-2 text-xs leading-5 text-[var(--platform-warning)]">
          No existing categories were returned. Add a category first, then return here to create the product.
        </div>
      )}
      {selectedOption ? (
        <p data-product-category-usage className="text-xs leading-5 text-[var(--platform-text-muted)]">
          {usageLabel}. Delete removes the CMS category row only after products are moved out.
        </p>
      ) : null}
    </div>
  );
}
