import { useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import ProductCard from "./ProductCard.jsx";

function LazyProductCard({ children }) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(
    () => typeof IntersectionObserver === "undefined",
  );

  useEffect(() => {
    if (isVisible) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "360px 0px" },
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [isVisible]);

  return (
    <Box ref={ref} className="product-card-lazy-shell">
      {isVisible ? children : <Box className="product-card-placeholder" />}
    </Box>
  );
}

export default function ProductGrid({
  products,
  storeSlug,
  onAddToCart,
  addingProductId,
  disableCartActions = false,
  linkSearch = "",
  className = "",
  scrollAnchorScope = "products",
}) {
  return (
    <Box
      className={["storefront-products-grid", className]
        .filter(Boolean)
        .join(" ")}
    >
      {products.map((product, index) => (
        <LazyProductCard key={product.id ?? `${product.name}-${product.slug}`}>
          <ProductCard
            product={product}
            storeSlug={storeSlug}
            onAddToCart={onAddToCart}
            adding={addingProductId === product.id}
            disableCartActions={disableCartActions}
            linkSearch={linkSearch}
            scrollAnchorScope={scrollAnchorScope}
            scrollAnchorIndex={index}
          />
        </LazyProductCard>
      ))}
    </Box>
  );
}

export function ProductGridSkeleton({
  count = 8,
  className = "",
}) {
  return (
    <Box
      className={["storefront-products-grid", className]
        .filter(Boolean)
        .join(" ")}
      aria-hidden
    >
      {Array.from({ length: count }).map((_, index) => (
        <Box className="product-card product-card--skeleton" key={index}>
          <Skeleton
            variant="rectangular"
            className="product-card__skeleton-media"
          />
          <Box className="product-card__skeleton-body">
            <Skeleton variant="text" width="42%" height={18} />
            <Skeleton variant="text" width="82%" height={26} />
            <Skeleton variant="text" width="48%" height={22} />
            <Skeleton variant="text" width="100%" height={18} />
            <Skeleton variant="text" width="58%" height={16} />
          </Box>
          <Box className="product-card__skeleton-actions">
            <Skeleton variant="rounded" width="34%" height={30} />
            <Skeleton variant="rounded" width="38%" height={36} />
          </Box>
        </Box>
      ))}
    </Box>
  );
}
