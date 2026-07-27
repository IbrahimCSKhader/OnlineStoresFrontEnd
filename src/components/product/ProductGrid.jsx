import { useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
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
