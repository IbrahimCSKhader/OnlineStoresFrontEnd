import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import productApi from "../../API/product.api.js";
import { normalizeListResponse } from "../../utils/collections.js";
import {
  dedupeProducts,
  isProductActive,
  normalizeProductList,
} from "../../utils/products.js";
import { queryKeys } from "../../utils/queryKeys.js";

export default function useStorefrontCatalogProducts(categories = [], options = {}) {
  const categoryIds = useMemo(
    () =>
      categories
        .map((category) => category?.id)
        .filter((id) => id !== undefined && id !== null && id !== ""),
    [categories],
  );

  const queryResults = useQueries({
    queries: categoryIds.map((categoryId) => ({
      queryKey: queryKeys.products.byCategory(categoryId),
      queryFn: () => productApi.getProductsByCategory(categoryId),
      enabled: categoryIds.length > 0 && (options.enabled ?? true),
      staleTime: options.staleTime ?? 30000,
    })),
  });

  const data = useMemo(
    () =>
      dedupeProducts(
        queryResults.flatMap((query) =>
          normalizeProductList(normalizeListResponse(query.data)).filter((product) =>
            isProductActive(product),
          ),
        ),
      ),
    [queryResults],
  );

  return {
    data,
    isLoading: queryResults.some((query) => query.isLoading) && !data.length,
    isFetching: queryResults.some((query) => query.isFetching),
    error: queryResults.find((query) => query.error)?.error || null,
    refetch: () => Promise.all(queryResults.map((query) => query.refetch?.()).filter(Boolean)),
  };
}
