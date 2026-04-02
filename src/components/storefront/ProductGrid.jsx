import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ProductCard from "./ProductCard.jsx";
import "./ProductGrid.css";

export default function ProductGrid({ products }) {
  if (!products.length) {
    return (
      <Box className="storefront-product-grid storefront-product-grid--empty">
        <Typography variant="h6">No pieces match this filter.</Typography>
        <Typography variant="body2" color="text.secondary">
          Try another category or widen the price range.
        </Typography>
      </Box>
    );
  }

  return (
    <Box className="storefront-product-grid">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </Box>
  );
}
