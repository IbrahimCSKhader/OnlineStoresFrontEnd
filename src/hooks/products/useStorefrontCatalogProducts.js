import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import productApi from "../../API/product.api.js";
import { normalizeListResponse } from "../../utils/collections.js";
import {
  isProductActive,
  normalizeProductList,
} from "../../utils/products.js";
import { queryKeys } from "../../utils/queryKeys.js";
import useProductPricingScope from "./useProductPricingScope.js";

export default function useStorefrontCatalogProducts(storeId, options = {}) {
  const pricingScope = useProductPricingScope();
  const query = useQuery({
    queryKey: queryKeys.products.byStore(storeId, pricingScope),
    queryFn: () => productApi.getProductsByStore(storeId),
    enabled: Boolean(storeId) && (options.enabled ?? true),
    staleTime: options.staleTime ?? 30000,
  });

  const data = useMemo(
    () =>
      normalizeProductList(normalizeListResponse(query.data)).filter((product) =>
        isProductActive(product),
      ),
    [query.data],
  );

  return {
    data,
    isLoading: query.isLoading && !data.length,
    isFetching: query.isFetching,
    error: query.error || null,
    refetch: query.refetch,
  };
}
