import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import productApi from "../../API/product.api.js";
import {
  normalizeListResponse,
  normalizePagedResponse,
} from "../../utils/collections.js";
import {
  isProductActive,
  normalizeProductList,
} from "../../utils/products.js";
import { queryKeys } from "../../utils/queryKeys.js";
import useProductPricingScope from "./useProductPricingScope.js";

export default function useStorefrontCatalogProducts(storeId, options = {}) {
  const pricingScope = useProductPricingScope();
  const { enabled, staleTime, params, ...queryOptions } = options;
  const queryParams = params || {};
  const query = useQuery({
    queryKey: queryKeys.products.byStore(storeId, {
      ...queryParams,
      pricingScope,
    }),
    queryFn: () => productApi.getProductsByStore(storeId, queryParams),
    enabled: Boolean(storeId) && (enabled ?? true),
    staleTime: staleTime ?? 30000,
    keepPreviousData: true,
    ...queryOptions,
  });

  const pagedData = useMemo(() => normalizePagedResponse(query.data), [query.data]);
  const data = useMemo(() => {
    const source = queryParams.page || queryParams.pageSize
      ? pagedData.items
      : normalizeListResponse(query.data);

    return normalizeProductList(source).filter((product) =>
      isProductActive(product),
    );
  }, [pagedData.items, query.data, queryParams.page, queryParams.pageSize]);

  return {
    data,
    pagination: {
      ...pagedData,
      items: data,
    },
    isLoading: query.isLoading && !data.length,
    isFetching: query.isFetching,
    error: query.error || null,
    refetch: query.refetch,
  };
}
