import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ProductGrid from "./ProductGrid.jsx";
import "./CategoryProductSections.css";

export default function CategoryProductSections({ groups, scope, ...gridProps }) {
  return <Box className="category-product-sections">
    {groups.map(group => {
      const id = `${scope}-category-${encodeURIComponent(group.id)}`;
      return <Box component="section" key={group.id} id={id} aria-labelledby={`${id}-title`}
        data-scroll-section className="category-product-section">
        <Typography component="h3" variant="h5" id={`${id}-title`} className="category-product-section__title">{group.name}</Typography>
        <ProductGrid {...gridProps} products={group.products} scrollAnchorScope={id} />
      </Box>;
    })}
  </Box>;
}
