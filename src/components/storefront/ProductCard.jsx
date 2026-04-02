import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Rating from "@mui/material/Rating";
import Typography from "@mui/material/Typography";
import FavoriteBorderRoundedIcon from "@mui/icons-material/FavoriteBorderRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import "./ProductCard.css";

const badgeColorMap = {
  NEW: "storefront-product-card__badge--new",
  HOT: "storefront-product-card__badge--hot",
  DISCOUNT: "storefront-product-card__badge--discount",
};

export default function ProductCard({ product }) {
  return (
    <Box className="storefront-product-card">
      <Box className="storefront-product-card__media">
        <img src={product.image} alt={product.name} className="storefront-product-card__image" />
        <Chip
          label={product.badge}
          size="small"
          className={`storefront-product-card__badge ${badgeColorMap[product.badge] ?? ""}`}
        />
        <IconButton
          aria-label={`Add ${product.name} to wishlist`}
          className="storefront-product-card__wishlist"
          size="small"
        >
          <FavoriteBorderRoundedIcon fontSize="small" />
        </IconButton>
      </Box>

      <Box className="storefront-product-card__content">
        <Typography variant="h6" className="storefront-product-card__name">
          {product.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" className="storefront-product-card__sold">
          {product.soldCount}+ sold
        </Typography>
        <Box className="storefront-product-card__meta">
          <Rating
            value={product.rating}
            precision={0.1}
            readOnly
            icon={<StarRoundedIcon fontSize="inherit" />}
            emptyIcon={<StarRoundedIcon fontSize="inherit" />}
            sx={{
              color: "var(--accent)",
              fontSize: "1rem",
            }}
          />
          <Typography variant="body2" color="text.secondary">
            {product.rating.toFixed(1)}
          </Typography>
        </Box>
        <Typography variant="h6" className="storefront-product-card__price">
          ${product.price}
        </Typography>
      </Box>
    </Box>
  );
}
