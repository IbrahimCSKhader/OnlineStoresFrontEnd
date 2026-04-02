import Box from "@mui/material/Box";
import ProductCard from "./ProductCard.jsx";

export default function ProductGrid({
  products,
  storeSlug,
  onAddToCart,
  addingProductId,
}) {
  return (
    <Box className="storefront-products-grid">
      {products.map((product) => (
        <ProductCard
          key={product.id ?? `${product.name}-${product.slug}`}
          product={product}
          storeSlug={storeSlug}
          onAddToCart={onAddToCart}
          adding={addingProductId === product.id}
        />
      ))}
    </Box>
  );
}
